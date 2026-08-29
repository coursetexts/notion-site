import * as React from 'react'
import { useRouter } from 'next/router'

import { useAuthOptional } from '@/contexts/AuthContext'

import { CourseHero, formatHeroPublishedDate } from '@/components/CourseHero'
import { CourseActivity } from '@/components/CourseActivity'
import { SiteNotesEditor } from '@/components/SiteNotesEditor'
import { getProfileByUserId } from '@/lib/follows'
import {
  learningPathAbsoluteUrl,
  learningPathHref,
  userLinkMatchesLearningPathSlug
} from '@/lib/learning-path-bookmark-link'
import { learningPathActivityPageId } from '@/lib/course-activity-db'
import {
  getLearningPathRecord,
  loadLearningPathUserState,
  overlayUserState,
  saveLearningPathUserState,
  setOwnedLearningPathPrivate,
  upsertOwnedLearningPath,
  userStateFromPath,
  writeLocalUserState
} from '@/lib/learning-path-db'
import {
  type PathTreeItem,
  edgePath,
  isCoreStep,
  layoutHoverGraph,
  visibleTree
} from '@/lib/learning-path-graph-layout'
import {
  LEARNING_PATH_MENTAL_MAP_SECTION_ID,
  LEARNING_PATH_RECOMMENDED_SECTION_ID,
  isLearningPathMentalMapSelection,
  isLearningPathRecommendedSelection,
  outlineTreeWithoutGoal
} from '@/lib/learning-path-sections'
import {
  type LearningPathData,
  type LearningPathNode,
  type LearningPathNodeStatus,
  type LearningPathResourceKind,
  type LearningPathUserResource,
  emptyLearningPath,
  insertLearningPathUserResource,
  isCatalogLearningPathSlug,
  mergeLearningPathResources,
  readStoredLearningPaths,
  resolveLearningPath,
  sequenceMarks
} from '@/lib/learning-path-seed'
import {
  type NotebookDocJson,
  parseStoredNotebookNote,
  serializeStoredNotebookNote
} from '@/lib/notebook-editor-default'
import { registerPersistBeforeSignOut } from '@/lib/persist-before-sign-out'
import { restoreScrollAfter } from '@/lib/restore-scroll-after'
import { centerGraphNode } from '@/lib/center-graph-node'
import { addLink, deleteLink, getMyLinks } from '@/lib/user-links'

import { GraphViewport } from './GraphViewport'

import heroStyles from './CourseHero.module.css'
import styles from './LearningPath.module.css'
import saveStyles from './SaveCourseButton.module.css'

const RESOURCE_KINDS: LearningPathResourceKind[] = [
  'article',
  'video',
  'book',
  'course',
  'paper',
  'exercise'
]

const EMPTY_RESOURCE_DRAFT = {
  title: '',
  href: '',
  kind: 'article' as LearningPathResourceKind,
  passage: '',
  why: '',
  sequence: ''
}

const GRAPH_DETAIL_MIN = 280
const GRAPH_MAP_MIN = 360
const GRAPH_DETAIL_DEFAULT = 400
const GRAPH_SPLIT_STORAGE_KEY = 'coursetexts-learning-path-detail-width'

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function pathDescriptionHtml(summary: string) {
  const text = summary.trim()
  if (!text) {
    return '<p>Start with a goal and map the knowledge you need to reach it.</p>'
  }
  return text
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => `<p>${escapeHtml(part).replace(/\n/g, '<br/>')}</p>`)
    .join('')
}

function filterPathTree(items: PathTreeItem[], query: string): PathTreeItem[] {
  if (!query) return items
  return items
    .map((item) => {
      const selfMatch = item.node.label.toLowerCase().includes(query)
      const children = filterPathTree(item.children, query)
      if (selfMatch) return item
      if (children.length) return { ...item, children }
      return null
    })
    .filter((item): item is PathTreeItem => item != null)
}

function readStoredGraphDetailWidth() {
  if (typeof window === 'undefined') return GRAPH_DETAIL_DEFAULT
  try {
    const raw = window.localStorage.getItem(GRAPH_SPLIT_STORAGE_KEY)
    const n = raw ? Number(raw) : NaN
    return Number.isFinite(n) ? n : GRAPH_DETAIL_DEFAULT
  } catch {
    return GRAPH_DETAIL_DEFAULT
  }
}

function persistGraphDetailWidth(width: number) {
  try {
    window.localStorage.setItem(
      GRAPH_SPLIT_STORAGE_KEY,
      String(Math.round(width))
    )
  } catch {
    // ignore quota / private mode
  }
}

function clampGraphDetailWidth(width: number, bodyWidth: number) {
  const max = Math.max(GRAPH_DETAIL_MIN, Math.floor(bodyWidth - GRAPH_MAP_MIN))
  return Math.round(Math.min(max, Math.max(GRAPH_DETAIL_MIN, width)))
}

function newId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function descendantIds(path: LearningPathData, rootId: string): string[] {
  const children = new Map<string, string[]>()
  for (const edge of path.edges) {
    const list = children.get(edge.from) ?? []
    list.push(edge.to)
    children.set(edge.from, list)
  }
  const found: string[] = []
  const stack = [...(children.get(rootId) ?? [])]
  const seen = new Set<string>()
  while (stack.length > 0) {
    const id = stack.pop() as string
    if (seen.has(id)) continue
    seen.add(id)
    found.push(id)
    stack.push(...(children.get(id) ?? []))
  }
  return found
}

function removeNodeSubtree(
  path: LearningPathData,
  rootId: string
): LearningPathData {
  const remove = new Set([rootId, ...descendantIds(path, rootId)])
  const incoming = path.edges
    .filter((edge) => edge.to === rootId && !remove.has(edge.from))
    .map((edge) => edge.from)
  const outgoing = path.edges
    .filter((edge) => edge.from === rootId && !remove.has(edge.to))
    .map((edge) => edge.to)
  const nodes = path.nodes.filter((node) => !remove.has(node.id))
  const edges = path.edges.filter(
    (edge) => !remove.has(edge.from) && !remove.has(edge.to)
  )
  for (const from of incoming) {
    for (const to of outgoing) {
      if (!edges.some((edge) => edge.from === from && edge.to === to)) {
        edges.push({ from, to })
      }
    }
  }
  return { ...path, nodes, edges }
}

function statusLabel(status: LearningPathNodeStatus) {
  if (status === 'explored') return 'Explored'
  if (status === 'exploring') return 'Exploring'
  return 'Next'
}

function nodeClass(node: LearningPathNode, selected: boolean) {
  const parts = [styles.node]
  if (selected) parts.push(styles.nodeSelected)
  if (node.kind === 'goal') parts.push(styles.nodeGoal)
  if (node.kind === 'milestone') parts.push(styles.nodeMilestone)
  if (node.status === 'explored') parts.push(styles.nodeExplored)
  if (node.status === 'exploring') parts.push(styles.nodeExploring)
  return parts.join(' ')
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = React.useState(false)
  React.useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(media.matches)
    const onChange = () => setReduced(media.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])
  return reduced
}

function useAnimatedPositions(
  targets: Record<string, { x: number; y: number }>,
  enabled: boolean
) {
  const [current, setCurrent] = React.useState(targets)
  const currentRef = React.useRef(targets)
  const rafRef = React.useRef(0)

  React.useEffect(() => {
    if (!enabled) {
      currentRef.current = targets
      setCurrent(targets)
      return
    }
    const from = { ...currentRef.current }
    const start = performance.now()
    const duration = 580
    const ease = (t: number) => 1 - Math.pow(1 - t, 4)

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const e = ease(t)
      const next: Record<string, { x: number; y: number }> = {}
      const ids = new Set([...Object.keys(from), ...Object.keys(targets)])
      for (const id of ids) {
        const end = targets[id]
        const begin = from[id] ?? end
        if (!end) continue
        next[id] = {
          x: begin.x + (end.x - begin.x) * e,
          y: begin.y + (end.y - begin.y) * e
        }
      }
      currentRef.current = next
      setCurrent(next)
      if (t < 1) rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [targets, enabled])

  return current
}

function flattenTree(items: PathTreeItem[]): LearningPathNode[] {
  const flat: LearningPathNode[] = []
  function walk(nodes: PathTreeItem[]) {
    for (const item of nodes) {
      flat.push(item.node)
      walk(item.children)
    }
  }
  walk(items)
  return flat
}

function nextOutlineNode(
  path: LearningPathData,
  selectedId: string
): LearningPathNode | null {
  const order = flattenTree(visibleTree(path, path.nodes))
  const index = order.findIndex((node) => node.id === selectedId)
  if (index < 0) return order[0] ?? null
  return order[index + 1] ?? null
}

function PlusIcon() {
  return (
    <svg width='12' height='12' viewBox='0 0 12 12' fill='none' aria-hidden>
      <path
        d='M6 1.5V10.5M1.5 6H10.5'
        stroke='currentColor'
        strokeWidth='1.4'
        strokeLinecap='round'
      />
    </svg>
  )
}

function ShareIcon() {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='14'
      height='14'
      viewBox='0 0 8 8'
      fill='none'
      aria-hidden
    >
      <path
        d='M4.14058 1.91565L4.44058 1.61252C4.70255 1.37375 5.04645 1.2451 5.40081 1.2533C5.75518 1.2615 6.09276 1.40593 6.3434 1.65657C6.59404 1.90721 6.73847 2.24479 6.74667 2.59916C6.75488 2.95352 6.62622 3.29742 6.38745 3.5594L5.44058 4.50315C5.31312 4.63108 5.16166 4.73259 4.99488 4.80186C4.8281 4.87112 4.64929 4.90678 4.4687 4.90678C4.28811 4.90678 4.1093 4.87112 3.94252 4.80186C3.77574 4.73259 3.62428 4.63108 3.49683 4.50315'
        stroke='currentColor'
        strokeWidth='0.75'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='M3.8594 6.08439L3.5594 6.38752C3.29742 6.62629 2.95352 6.75494 2.59916 6.74674C2.24479 6.73853 1.90721 6.5941 1.65657 6.34346C1.40593 6.09282 1.2615 5.75524 1.2533 5.40088C1.2451 5.04651 1.37375 4.70261 1.61252 4.44064L2.5594 3.49689C2.68685 3.36896 2.83831 3.26745 3.00509 3.19818C3.17187 3.12892 3.35068 3.09326 3.53127 3.09326C3.71186 3.09326 3.89067 3.12892 4.05745 3.19818C4.22423 3.26745 4.37569 3.36896 4.50315 3.49689'
        stroke='currentColor'
        strokeWidth='0.75'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

function BookmarkIcon({ filled }: { filled: boolean }) {
  return (
    <svg width='13' height='13' viewBox='0 0 14 16' fill='none' aria-hidden>
      <path
        d='M2.75 2.25h8.5v10.85L7 9.35l-4.25 3.75V2.25z'
        fill={filled ? 'currentColor' : 'none'}
        stroke='currentColor'
        strokeWidth='1.2'
        strokeLinejoin='round'
      />
    </svg>
  )
}

function PrivacyIcon({ locked }: { locked: boolean }) {
  return locked ? (
    <svg width='13' height='13' viewBox='0 0 13 13' fill='none' aria-hidden>
      <rect
        x='2.5'
        y='6'
        width='8'
        height='5.5'
        rx='1'
        stroke='currentColor'
        strokeWidth='1.2'
      />
      <path
        d='M4.25 6V4.5a2.25 2.25 0 1 1 4.5 0V6'
        stroke='currentColor'
        strokeWidth='1.2'
        strokeLinecap='round'
      />
    </svg>
  ) : (
    <svg width='13' height='13' viewBox='0 0 13 13' fill='none' aria-hidden>
      <rect
        x='2.5'
        y='6'
        width='8'
        height='5.5'
        rx='1'
        stroke='currentColor'
        strokeWidth='1.2'
      />
      <path
        d='M4.25 6V4.5a2.25 2.25 0 0 1 4.1-1.25'
        stroke='currentColor'
        strokeWidth='1.2'
        strokeLinecap='round'
      />
    </svg>
  )
}

function initialSelection() {
  return LEARNING_PATH_RECOMMENDED_SECTION_ID
}

function PathLegend() {
  return (
    <div className={styles.legend}>
      <span>
        <i className={`${styles.legendDot} ${styles.legendExplored}`} />{' '}
        Explored
      </span>
      <span>
        <i className={`${styles.legendDot} ${styles.legendExploring}`} />{' '}
        Exploring
      </span>
      <span>
        <i className={`${styles.legendDot} ${styles.legendNext}`} /> Next
      </span>
    </div>
  )
}

function PathOutlineList({
  items,
  marks,
  selectedId,
  onSelect
}: {
  items: PathTreeItem[]
  marks: ReturnType<typeof sequenceMarks>
  selectedId: string
  onSelect: (id: string) => void
}) {
  if (items.length === 0) return null
  return (
    <ul className={styles.pathList}>
      {items.map((item) => {
        const mark = marks[item.node.id]
        const selected = item.node.id === selectedId
        return (
          <li key={item.node.id} className={styles.pathListItem}>
            <button
              type='button'
              className={
                selected
                  ? `${styles.pathListRow} ${styles.pathListRowSelected}`
                  : styles.pathListRow
              }
              aria-current={selected ? 'true' : undefined}
              aria-label={
                mark
                  ? mark.role === 'core'
                    ? `Step ${mark.mark}: ${item.node.label}`
                    : `${item.node.label}, ${mark.mark})`
                  : item.node.label
              }
              onClick={() => onSelect(item.node.id)}
            >
              <i
                className={[
                  styles.pathListDot,
                  item.node.status === 'explored'
                    ? styles.legendExplored
                    : item.node.status === 'exploring'
                    ? styles.legendExploring
                    : styles.legendNext
                ].join(' ')}
                aria-hidden
              />
              {mark ? (
                <span
                  className={
                    mark.role === 'branch'
                      ? `${styles.nodeMark} ${styles.nodeMarkBranch}`
                      : styles.nodeMark
                  }
                >
                  {mark.role === 'branch' ? `${mark.mark})` : mark.mark}
                </span>
              ) : item.node.kind === 'goal' ? (
                <span className={styles.pathListGoalMark}>Goal</span>
              ) : (
                <span className={styles.nodeMark} />
              )}
              <span className={styles.pathListCopy}>
                <span className={styles.pathListLabel}>{item.node.label}</span>
                <span className={styles.pathListMeta}>
                  {item.node.kind === 'goal'
                    ? item.node.sub || 'The destination'
                    : `${statusLabel(item.node.status)}${
                        item.node.sub ? ` · ${item.node.sub}` : ''
                      }`}
                </span>
              </span>
            </button>
            {item.children.length > 0 ? (
              <PathOutlineList
                items={item.children}
                marks={marks}
                selectedId={selectedId}
                onSelect={onSelect}
              />
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}

function PathSectionRow({
  label,
  count,
  selected,
  onSelect
}: {
  label: string
  count?: number
  selected: boolean
  onSelect: () => void
}) {
  return (
    <div
      className={`${styles.navRow}${
        selected ? ` ${styles.navRowSelected}` : ''
      }`}
    >
      <span className={styles.leafDot} aria-hidden>
        <span className={styles.dot} />
      </span>
      <button
        type='button'
        onClick={onSelect}
        aria-current={selected ? 'true' : undefined}
        className={styles.navSelect}
      >
        <span
          className={`${styles.navTitle}${
            selected ? ` ${styles.navTitleSelected}` : ''
          }`}
        >
          {label}
        </span>
        {typeof count === 'number' && count > 0 ? (
          <span className={styles.navCount}>{count}</span>
        ) : null}
      </button>
    </div>
  )
}

function LearningPathRecommendedOverview({
  steps,
  marks,
  onSelect
}: {
  steps: LearningPathNode[]
  marks: ReturnType<typeof sequenceMarks>
  onSelect: (id: string) => void
}) {
  return (
    <article className={styles.article}>
      <header className={styles.articleHeader}>
        <span className={styles.typeBadge}>Recommended Path</span>
      </header>
      {steps.length === 0 ? (
        <p className={styles.articleEmpty}>
          Steps for this path will appear here as you add them.
        </p>
      ) : (
        <ul className={styles.childrenGrid}>
          {steps.map((step) => {
            const mark = marks[step.id]
            return (
              <li key={step.id}>
                <button
                  type='button'
                  onClick={() => onSelect(step.id)}
                  className={styles.childBtn}
                >
                  <span className={styles.childTitle}>
                    {mark?.role === 'core' ? `${mark.mark}. ` : null}
                    {step.label}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </article>
  )
}

const CLOSED_SECTIONS = {
  why: false,
  resources: false,
  note: false
}

function pathTypeBadge(node: LearningPathNode, mentalMap: boolean) {
  if (mentalMap || node.kind === 'goal') return 'Mental Map'
  if (node.kind === 'prerequisite') return 'Concept'
  if (node.kind === 'milestone') return 'Step'
  return 'Step'
}

function PathContentSection({
  title,
  icon,
  open,
  onToggle,
  extra,
  children
}: {
  title: string
  icon: React.ReactNode
  open: boolean
  onToggle: () => void
  extra?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section>
      <div
        className={`${styles.sectionHeader}${
          open ? '' : ` ${styles.sectionHeaderCollapsed}`
        }`}
      >
        <h2 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}>{icon}</span>
          {title}
        </h2>
        <div className={styles.sectionHeaderActions}>
          {extra}
          <button
            type='button'
            className={styles.sectionToggleBtn}
            onClick={onToggle}
            aria-expanded={open}
            aria-label={open ? `Collapse ${title}` : `Expand ${title}`}
          >
            <svg
              className={`${styles.sectionToggleIcon}${
                open ? ` ${styles.sectionToggleIconOpen}` : ''
              }`}
              xmlns='http://www.w3.org/2000/svg'
              viewBox='0 0 16 16'
              fill='none'
              aria-hidden
            >
              <path
                d='M6 3.5L10.5 8L6 12.5'
                stroke='currentColor'
                strokeWidth='1.4'
                strokeLinecap='round'
                strokeLinejoin='round'
              />
            </svg>
          </button>
        </div>
      </div>
      {open ? <div className={styles.sectionBody}>{children}</div> : null}
    </section>
  )
}

function WhyIcon() {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='20'
      height='20'
      viewBox='0 0 16 16'
      fill='none'
      aria-hidden
    >
      <circle cx='8' cy='8' r='6.25' stroke='currentColor' strokeWidth='1.2' />
      <path
        d='M6.4 6.15c0-1 0.85-1.7 1.7-1.7 0.9 0 1.65 0.6 1.65 1.5 0 0.85-0.55 1.2-1.15 1.55-0.5 0.3-0.7 0.55-0.7 1.1v0.2'
        stroke='currentColor'
        strokeWidth='1.2'
        strokeLinecap='round'
      />
      <circle cx='8' cy='11.35' r='0.7' fill='currentColor' />
    </svg>
  )
}

function ResourcesIcon() {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='20'
      height='20'
      viewBox='0 0 16 16'
      fill='none'
      aria-hidden
    >
      <circle cx='8' cy='8' r='6.25' stroke='currentColor' strokeWidth='1.2' />
      <path d='M6.75 5.5L11 8L6.75 10.5V5.5Z' fill='currentColor' />
    </svg>
  )
}

function NoteIcon() {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='20'
      height='20'
      viewBox='0 0 16 16'
      fill='none'
      aria-hidden
    >
      <path
        d='M3.5 2.5h7l2 2V13.5h-9V2.5Z'
        stroke='currentColor'
        strokeWidth='1.2'
        strokeLinejoin='round'
      />
      <path
        d='M10.5 2.5V4.5H12.5'
        stroke='currentColor'
        strokeWidth='1.2'
        strokeLinejoin='round'
      />
      <path
        d='M5.5 7H10.5M5.5 9.5H10.5M5.5 12H8.5'
        stroke='currentColor'
        strokeWidth='1.2'
        strokeLinecap='round'
      />
    </svg>
  )
}

function ChevronSmall() {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='12'
      height='12'
      viewBox='0 0 16 16'
      fill='none'
      aria-hidden
    >
      <path
        d='M6 3.5L10.5 8L6 12.5'
        stroke='currentColor'
        strokeWidth='1.4'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

function PathStageActions({
  onAdd,
  onEdit,
  inline = false
}: {
  onAdd: () => void
  onEdit: () => void
  inline?: boolean
}) {
  const btnClass = inline
    ? `${styles.addNode} ${styles.addNodeInline}`
    : styles.addNode
  return (
    <div className={inline ? styles.graphActionsInline : styles.graphActions}>
      <button type='button' className={btnClass} onClick={onEdit}>
        Edit this node
      </button>
      <button type='button' className={btnClass} onClick={onAdd}>
        <PlusIcon /> Add to path
      </button>
    </div>
  )
}

export function LearningPath({ slug }: { slug: string }) {
  const router = useRouter()
  const auth = useAuthOptional()
  const currentUserId = auth?.user?.id ?? null
  const [path, setPath] = React.useState<LearningPathData>(() =>
    resolveLearningPath(slug)
  )
  const [selectedId, setSelectedId] = React.useState(() => initialSelection())
  const [notes, setNotes] = React.useState<Record<string, string>>({})
  const [userResources, setUserResources] = React.useState<
    Record<string, LearningPathUserResource[]>
  >({})
  const [viewMode, setViewMode] = React.useState<'graph' | 'list'>('list')
  const [outlineSearch, setOutlineSearch] = React.useState('')
  const [graphDetailWidth, setGraphDetailWidth] =
    React.useState(GRAPH_DETAIL_DEFAULT)
  const [graphSplitDragging, setGraphSplitDragging] = React.useState(false)
  const bodyRef = React.useRef<HTMLDivElement>(null)
  const detailRef = React.useRef<HTMLElement>(null)
  const graphDetailWidthRef = React.useRef(graphDetailWidth)
  const graphSplitDraggingRef = React.useRef(false)
  graphDetailWidthRef.current = graphDetailWidth
  const [hoverId, setHoverId] = React.useState<string | null>(null)
  const [addOpen, setAddOpen] = React.useState(false)
  const [addLabel, setAddLabel] = React.useState('')
  const [addPlacement, setAddPlacement] = React.useState<'step' | 'child'>(
    'child'
  )
  const [editOpen, setEditOpen] = React.useState(false)
  const [editLabel, setEditLabel] = React.useState('')
  const [editDescription, setEditDescription] = React.useState('')
  const [editWhy, setEditWhy] = React.useState('')
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [addResourceOpen, setAddResourceOpen] = React.useState(false)
  const [openSections, setOpenSections] = React.useState(CLOSED_SECTIONS)
  const [resourceDraft, setResourceDraft] = React.useState(EMPTY_RESOURCE_DRAFT)
  const [shareCopied, setShareCopied] = React.useState(false)
  const [pathOwnerId, setPathOwnerId] = React.useState<string | null>(null)
  const [creatorName, setCreatorName] = React.useState<string | null>(null)
  const [creatorAvatarUrl, setCreatorAvatarUrl] = React.useState<string | null>(
    null
  )
  const [bookmarkLinkId, setBookmarkLinkId] = React.useState<string | null>(
    null
  )
  const [bookmarkBusy, setBookmarkBusy] = React.useState(false)
  const [pathIsPrivate, setPathIsPrivate] = React.useState(true)
  const [privacyBusy, setPrivacyBusy] = React.useState(false)
  const [pathRowId, setPathRowId] = React.useState<string | null>(null)
  const [userStateReady, setUserStateReady] = React.useState(false)
  const shareTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const stateTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const pathRef = React.useRef(path)
  const notesRef = React.useRef(notes)
  const resourcesRef = React.useRef(userResources)
  const pathRowIdRef = React.useRef(pathRowId)
  pathRef.current = path
  notesRef.current = notes
  resourcesRef.current = userResources
  pathRowIdRef.current = pathRowId

  function requestSignIn() {
    if (auth?.signInWithGoogle) {
      void auth.signInWithGoogle()
      return
    }
    void router.push(
      `/signin?redirect=${encodeURIComponent(`/learning-path/${slug}`)}`
    )
  }

  function persistGraph(next: LearningPathData) {
    void upsertOwnedLearningPath(next).then((id) => {
      if (id) setPathRowId(id)
    })
  }

  function queueUserStateSave() {
    const state = userStateFromPath(
      pathRef.current,
      notesRef.current,
      resourcesRef.current
    )
    writeLocalUserState(slug, state)
    if (stateTimer.current) clearTimeout(stateTimer.current)
    stateTimer.current = setTimeout(() => {
      void saveLearningPathUserState(pathRowIdRef.current, slug, state)
    }, 500)
  }

  function persistSelectedNote(nodeId: string, doc: NotebookDocJson) {
    if (!currentUserId) return
    const value = serializeStoredNotebookNote(doc) ?? ''
    setNotes((prev) => {
      const next = { ...prev, [nodeId]: value }
      notesRef.current = next
      queueUserStateSave()
      return next
    })
  }

  function flushUserState() {
    if (stateTimer.current) {
      clearTimeout(stateTimer.current)
      stateTimer.current = null
    }
    return saveLearningPathUserState(
      pathRowIdRef.current,
      slug,
      userStateFromPath(pathRef.current, notesRef.current, resourcesRef.current)
    )
  }

  React.useEffect(() => {
    let cancelled = false
    const local = resolveLearningPath(slug, readStoredLearningPaths())
    setPath(local)
    setSelectedId(initialSelection())
    setHoverId(null)
    setPathRowId(null)
    setUserStateReady(false)
    setAddResourceOpen(false)
    setOpenSections(CLOSED_SECTIONS)
    setResourceDraft(EMPTY_RESOURCE_DRAFT)
    setShareCopied(false)
    setPathOwnerId(null)
    setCreatorName(null)
    setCreatorAvatarUrl(null)
    setBookmarkLinkId(null)
    setBookmarkBusy(false)
    setPathIsPrivate(!isCatalogLearningPathSlug(slug))
    setPrivacyBusy(false)
    setEditOpen(false)
    setDeleteOpen(false)
    setAddOpen(false)

    void (async () => {
      const record = await getLearningPathRecord(slug)
      const base = record?.data ?? local
      const state = await loadLearningPathUserState(record?.id ?? null, slug)
      if (cancelled) return
      const next = overlayUserState(base, state)
      setPath(next)
      setPathRowId(record?.id ?? null)
      setPathOwnerId(record?.ownerId ?? null)
      setPathIsPrivate(
        record ? record.isPrivate : !isCatalogLearningPathSlug(slug)
      )
      setNotes(state.notes)
      setUserResources(state.resources)
      setSelectedId(initialSelection())
      setUserStateReady(true)
    })()

    return () => {
      cancelled = true
    }
  }, [slug, currentUserId])

  React.useEffect(() => {
    return registerPersistBeforeSignOut(() => flushUserState())
  }, [slug])

  React.useEffect(() => {
    function onLeave() {
      void flushUserState()
    }
    window.addEventListener('pagehide', onLeave)
    window.addEventListener('beforeunload', onLeave)
    return () => {
      window.removeEventListener('pagehide', onLeave)
      window.removeEventListener('beforeunload', onLeave)
    }
  }, [slug])

  const isOwnPath = React.useMemo(() => {
    if (isCatalogLearningPathSlug(slug)) return false
    if (currentUserId && pathOwnerId === currentUserId) return true
    if (currentUserId && !pathOwnerId) {
      return readStoredLearningPaths().some((item) => item.slug === slug)
    }
    return false
  }, [slug, currentUserId, pathOwnerId])

  function measureGraphBodyWidth() {
    return (
      bodyRef.current?.getBoundingClientRect().width ??
      (typeof window !== 'undefined' ? window.innerWidth : 1200)
    )
  }

  function applyGraphDetailWidth(width: number, persist = false) {
    const next = clampGraphDetailWidth(width, measureGraphBodyWidth())
    graphDetailWidthRef.current = next
    setGraphDetailWidth(next)
    if (persist) persistGraphDetailWidth(next)
    return next
  }

  React.useEffect(() => {
    if (viewMode !== 'graph') return
    applyGraphDetailWidth(readStoredGraphDetailWidth())
  }, [viewMode])

  React.useEffect(() => {
    if (viewMode !== 'graph') return
    function onResize() {
      applyGraphDetailWidth(graphDetailWidthRef.current)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [viewMode])

  function handleGraphSplitPointerDown(
    event: React.PointerEvent<HTMLButtonElement>
  ) {
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    graphSplitDraggingRef.current = true
    setGraphSplitDragging(true)
  }

  function handleGraphSplitPointerMove(
    event: React.PointerEvent<HTMLButtonElement>
  ) {
    if (!graphSplitDraggingRef.current) return
    const body = bodyRef.current
    if (!body) return
    applyGraphDetailWidth(body.getBoundingClientRect().right - event.clientX)
  }

  function handleGraphSplitPointerUp(
    event: React.PointerEvent<HTMLButtonElement>
  ) {
    if (!graphSplitDraggingRef.current) return
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    graphSplitDraggingRef.current = false
    setGraphSplitDragging(false)
    persistGraphDetailWidth(graphDetailWidthRef.current)
  }

  function handleGraphSplitKeyDown(
    event: React.KeyboardEvent<HTMLButtonElement>
  ) {
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      applyGraphDetailWidth(graphDetailWidthRef.current + 24, true)
    } else if (event.key === 'ArrowRight') {
      event.preventDefault()
      applyGraphDetailWidth(graphDetailWidthRef.current - 24, true)
    } else if (event.key === 'Home') {
      event.preventDefault()
      applyGraphDetailWidth(GRAPH_DETAIL_MIN, true)
    } else if (event.key === 'End') {
      event.preventDefault()
      applyGraphDetailWidth(measureGraphBodyWidth() - GRAPH_MAP_MIN, true)
    }
  }

  function handleGraphSplitDoubleClick() {
    applyGraphDetailWidth(GRAPH_DETAIL_DEFAULT, true)
  }

  React.useEffect(() => {
    let cancelled = false
    setCreatorName(null)
    setCreatorAvatarUrl(null)
    if (!pathOwnerId || pathOwnerId === currentUserId) return
    void getProfileByUserId(pathOwnerId).then((profile) => {
      if (cancelled) return
      setCreatorName(profile?.display_name?.trim() || 'Someone')
      setCreatorAvatarUrl(profile?.avatar_url ?? null)
    })
    return () => {
      cancelled = true
    }
  }, [pathOwnerId, currentUserId])

  React.useEffect(() => {
    if (!currentUserId) setAddResourceOpen(false)
  }, [currentUserId])

  React.useEffect(() => {
    let cancelled = false
    setBookmarkLinkId(null)
    if (!currentUserId || isOwnPath) {
      return
    }
    void getMyLinks().then((links) => {
      if (cancelled) return
      const existing = links.find((link) =>
        userLinkMatchesLearningPathSlug(link.url, slug)
      )
      setBookmarkLinkId(existing?.id ?? null)
    })
    return () => {
      cancelled = true
    }
  }, [slug, currentUserId, isOwnPath])

  React.useEffect(() => {
    return () => {
      if (shareTimer.current) clearTimeout(shareTimer.current)
      flushUserState()
    }
  }, [slug])

  const tree = React.useMemo(() => visibleTree(path, path.nodes), [path])
  const outlineQuery = outlineSearch.trim().toLowerCase()
  const searching = outlineQuery.length > 0
  const filteredTree = React.useMemo(
    () =>
      filterPathTree(outlineTreeWithoutGoal(tree), outlineQuery),
    [tree, outlineQuery]
  )
  const nodeById = React.useMemo(
    () => Object.fromEntries(path.nodes.map((node) => [node.id, node])),
    [path.nodes]
  )
  const marks = React.useMemo(() => sequenceMarks(path), [path])
  const goalNode =
    path.nodes.find((node) => node.kind === 'goal') ?? path.nodes[0]
  const showingRecommended = isLearningPathRecommendedSelection(selectedId)
  const showingMentalMap = isLearningPathMentalMapSelection(selectedId)
  const selected = showingRecommended
    ? null
    : showingMentalMap
      ? goalNode ?? null
      : (selectedId ? nodeById[selectedId] : null) ?? null
  const coreSteps = React.useMemo(
    () => path.nodes.filter(isCoreStep).sort((a, b) => {
      const am = marks[a.id]
      const bm = marks[b.id]
      if (am?.role === 'core' && bm?.role === 'core') {
        return Number(am.mark) - Number(bm.mark)
      }
      return (a.sequence ?? a.x) - (b.sequence ?? b.x)
    }),
    [path.nodes, marks]
  )
  const showRecommendedNav =
    !searching ||
    'recommended path'.includes(outlineQuery) ||
    path.title.toLowerCase().includes(outlineQuery)
  const showMentalMapNav =
    !searching ||
    'mental map'.includes(outlineQuery) ||
    (goalNode?.label ?? '').toLowerCase().includes(outlineQuery)
  const outlineNoMatches =
    searching &&
    !showRecommendedNav &&
    !showMentalMapNav &&
    filteredTree.length === 0
  const visibleIds = React.useMemo(
    () => new Set(path.nodes.map((node) => node.id)),
    [path.nodes]
  )
  const graphSelectedId = showingMentalMap
    ? goalNode?.id ?? ''
    : showingRecommended
      ? ''
      : selected?.id ?? ''
  const graphFocusId =
    hoverId ??
    (showingMentalMap || showingRecommended
      ? goalNode?.id ?? ''
      : selected?.id ?? goalNode?.id ?? '')
  const layout = React.useMemo(
    () => layoutHoverGraph(path, graphFocusId, visibleIds),
    [path, graphFocusId, visibleIds]
  )
  const reduceMotion = usePrefersReducedMotion()
  const displayPositions = useAnimatedPositions(layout.positions, !reduceMotion)
  const selectedMark = selected ? marks[selected.id] : undefined
  const selectedParent = selectedMark?.parentId
    ? nodeById[selectedMark.parentId]
    : null
  const myResources = selected ? userResources[selected.id] ?? [] : []
  const listedResources = selected
    ? mergeLearningPathResources(selected.resources, myResources)
    : []
  const resourcePlacementMax = listedResources.length + 1
  const nestedToDelete =
    selected && selected.kind !== 'goal' ? descendantIds(path, selected.id) : []
  const nextNode = selected ? nextOutlineNode(path, selected.id) : null

  function selectNode(id: string) {
    const next =
      nodeById[id]?.kind === 'goal'
        ? LEARNING_PATH_MENTAL_MAP_SECTION_ID
        : id
    setSelectedId(next)
    setOpenSections(CLOSED_SECTIONS)
    setAddResourceOpen(false)
    setResourceDraft(EMPTY_RESOURCE_DRAFT)
  }

  function selectNodeKeepingScroll(id: string) {
    restoreScrollAfter(() => selectNode(id), detailRef.current)
  }

  function openAdd(placement: 'step' | 'child') {
    setAddPlacement(placement)
    setAddLabel('')
    setAddOpen(true)
  }

  function openEdit() {
    const node = selected ?? goalNode
    if (!node) return
    setEditLabel(node.label)
    setEditDescription(node.description)
    setEditWhy(node.why)
    setEditOpen(true)
  }

  function saveEdit(event: React.FormEvent) {
    event.preventDefault()
    const node = selected ?? goalNode
    const label = editLabel.trim()
    if (!label || !node) return
    setPath((prev) => {
      const next: LearningPathData = {
        ...prev,
        title: node.kind === 'goal' ? label : prev.title,
        goal:
          node.kind === 'goal'
            ? /^i want to\s+/i.test(label)
              ? label
              : `I want to ${label}`
            : prev.goal,
        nodes: prev.nodes.map((item) =>
          item.id === node.id
            ? {
                ...item,
                label,
                description: editDescription.trim(),
                why: editWhy.trim()
              }
            : item
        )
      }
      persistGraph(next)
      pathRef.current = next
      queueUserStateSave()
      return next
    })
    setEditOpen(false)
  }

  function deleteSelected() {
    if (!selected || selected.kind === 'goal') return
    const fallback =
      !selectedParent || selectedParent.kind === 'goal'
        ? LEARNING_PATH_RECOMMENDED_SECTION_ID
        : selectedParent.id
    setPath((prev) => {
      const next = removeNodeSubtree(prev, selected.id)
      persistGraph(next)
      pathRef.current = next
      queueUserStateSave()
      return next
    })
    setSelectedId(fallback)
    setDeleteOpen(false)
  }

  function markExplored() {
    if (!selected || selected.kind === 'goal') return
    setPath((prev) => {
      const next: LearningPathData = {
        ...prev,
        nodes: prev.nodes.map((node) =>
          node.id === selected.id
            ? { ...node, status: 'explored' as const }
            : node
        )
      }
      persistGraph(next)
      pathRef.current = next
      queueUserStateSave()
      return next
    })
  }

  function addNode(event: React.FormEvent) {
    event.preventDefault()
    const label = addLabel.trim()
    const target = selected ?? goalNode
    if (!label || !target) return
    const id = newId('n')
    const asStep = addPlacement === 'step' || target.kind === 'goal'

    setPath((prev) => {
      const core = prev.nodes.filter(
        (item) => item.kind === 'concept' || item.kind === 'milestone'
      )
      const lastCore = [...core].sort(
        (a, b) => (a.sequence ?? 0) - (b.sequence ?? 0)
      )[core.length - 1]
      const parentId = asStep
        ? lastCore?.id ?? (goalNode?.id ?? target.id)
        : target.id
      const parent =
        prev.nodes.find((item) => item.id === parentId) ?? target
      const siblings = prev.edges
        .filter((edge) => edge.from === parentId)
        .map((edge) => prev.nodes.find((item) => item.id === edge.to))
        .filter((item): item is LearningPathNode => !!item)

      const node: LearningPathNode = asStep
        ? {
            id,
            label,
            kind: 'milestone',
            sub: `Step ${core.length + 1}`,
            status: 'next',
            sequence: core.length + 1,
            x: Math.min(88, Math.max(12, (lastCore?.x ?? 34) + 16)),
            y: 36,
            description: `A milestone on the way to ${prev.title}.`,
            why: 'Steps are the major checkpoints. Concepts sit inside them.',
            resources: []
          }
        : {
            id,
            label,
            kind: 'prerequisite',
            sub:
              parent.kind === 'prerequisite'
                ? 'As deep as you need'
                : 'Need this',
            status: 'next',
            sequence: siblings.length + 1,
            x: Math.min(88, Math.max(12, parent.x + siblings.length * 8 - 8)),
            y: Math.min(
              88,
              parent.y + (parent.kind === 'prerequisite' ? 16 : 20)
            ),
            description:
              parent.kind === 'prerequisite'
                ? 'A finer concept under the parent idea.'
                : 'A concept this step depends on.',
            why:
              parent.kind === 'prerequisite'
                ? 'Go only as deep as the goal requires.'
                : 'You placed this because it sits inside the step.',
            resources: []
          }

      const next = {
        ...prev,
        nodes: [...prev.nodes, node],
        edges: [...prev.edges, { from: parentId, to: id }]
      }
      persistGraph(next)
      pathRef.current = next
      queueUserStateSave()
      return next
    })
    setSelectedId(id)
    setAddLabel('')
    setAddOpen(false)
  }

  async function copyShareUrl() {
    const url = `${window.location.origin}/learning-path/${path.slug}`
    try {
      await navigator.clipboard.writeText(url)
      setShareCopied(true)
      if (shareTimer.current) clearTimeout(shareTimer.current)
      shareTimer.current = setTimeout(() => {
        setShareCopied(false)
        shareTimer.current = null
      }, 2000)
    } catch {
      window.prompt('Copy this link', url)
    }
  }

  async function toggleBookmarkPath() {
    if (bookmarkBusy) return
    const href = `/learning-path/${path.slug}`
    if (!currentUserId) {
      void router.push(`/signin?redirect=${encodeURIComponent(href)}`)
      return
    }
    setBookmarkBusy(true)
    try {
      if (bookmarkLinkId) {
        const ok = await deleteLink(bookmarkLinkId)
        if (ok) setBookmarkLinkId(null)
        else window.alert('Could not remove this saved path.')
        return
      }
      const row = await addLink(
        learningPathAbsoluteUrl(path.slug, window.location.origin),
        { title: path.title || path.goal }
      )
      if (row) setBookmarkLinkId(row.id)
      else
        window.alert(
          'Could not save this path. It may already be in your list.'
        )
    } finally {
      setBookmarkBusy(false)
    }
  }

  async function togglePathPrivacy() {
    if (privacyBusy || !isOwnPath) return
    if (!currentUserId) {
      void router.push(
        `/signin?redirect=${encodeURIComponent(`/learning-path/${path.slug}`)}`
      )
      return
    }
    const nextPrivate = !pathIsPrivate
    setPrivacyBusy(true)
    try {
      let id = pathRowId
      if (!id || id.startsWith('path-')) {
        id = await upsertOwnedLearningPath(path)
        if (id) setPathRowId(id)
      }
      if (!id) {
        window.alert('Could not update privacy. Try signing in again.')
        return
      }
      const ok = await setOwnedLearningPathPrivate(id, nextPrivate, path.slug)
      if (ok) setPathIsPrivate(nextPrivate)
      else window.alert('Could not update privacy.')
    } finally {
      setPrivacyBusy(false)
    }
  }

  function addUserResource(event: React.FormEvent) {
    event.preventDefault()
    if (!currentUserId) {
      requestSignIn()
      return
    }
    if (!selected) return
    const title = resourceDraft.title.trim()
    const passage = resourceDraft.passage.trim()
    if (!title || !passage) return
    const href = resourceDraft.href.trim()
    const rawPlacement = Number(resourceDraft.sequence)
    const placement =
      resourceDraft.sequence.trim() === '' || !Number.isFinite(rawPlacement)
        ? listedResources.length + 1
        : rawPlacement
    const item: Omit<LearningPathUserResource, 'sequence'> = {
      id: newId('ur'),
      kind: resourceDraft.kind,
      title,
      href: href || undefined,
      passage,
      why: resourceDraft.why.trim()
    }
    setUserResources((prev) => {
      const nextMine = insertLearningPathUserResource(
        selected.resources,
        prev[selected.id] ?? [],
        item,
        placement
      )
      const next = {
        ...prev,
        [selected.id]: nextMine
      }
      resourcesRef.current = next
      queueUserStateSave()
      return next
    })
    setResourceDraft(EMPTY_RESOURCE_DRAFT)
    setAddResourceOpen(false)
  }

  if (!goalNode) {
    const empty = emptyLearningPath(path.goal, path.slug)
    return (
      <section className={styles.section}>
        <div className={styles.container}>
          <h1 className={styles.title}>{empty.title}</h1>
        </div>
      </section>
    )
  }

  const editorNode = selected ?? goalNode
  const addingOnCore =
    showingRecommended ||
    showingMentalMap ||
    editorNode.kind === 'goal' ||
    addPlacement === 'step'

  const heroInstructors =
    isOwnPath
      ? [{ name: 'By You' }]
      : pathOwnerId
        ? [
            {
              name: `By ${creatorName?.trim() || 'Someone'}`,
              url: `/profile/${pathOwnerId}`
            }
          ]
        : [{ name: 'By Coursetexts' }]

  const ownAvatarUrl =
    auth?.profile?.avatar_url ||
    (typeof auth?.user?.user_metadata?.avatar_url === 'string'
      ? auth.user.user_metadata.avatar_url
      : null) ||
    null
  const ownInitialSource =
    auth?.profile?.display_name ||
    (typeof auth?.user?.user_metadata?.full_name === 'string'
      ? auth.user.user_metadata.full_name
      : null) ||
    (typeof auth?.user?.user_metadata?.name === 'string'
      ? auth.user.user_metadata.name
      : null) ||
    auth?.user?.email ||
    'Y'
  const isCoursetextsPublisher = !isOwnPath && !pathOwnerId
  const publisherAvatarUrl = isOwnPath ? ownAvatarUrl : creatorAvatarUrl
  const publisherAvatarFallback = isCoursetextsPublisher
    ? 'coursetexts'
    : isOwnPath
      ? ownInitialSource.toString().trim().charAt(0).toUpperCase() || 'Y'
      : (creatorName || 'S').trim().charAt(0).toUpperCase()
  const publisherAvatarHref = isOwnPath
    ? '/profile'
    : pathOwnerId
      ? `/profile/${pathOwnerId}`
      : undefined

  return (
    <section className={styles.section} aria-label='Learning path'>
      <div className={styles.hero}>
        <CourseHero
          courseCode='Learning Path'
          title={path.title}
          instructors={heroInstructors}
          descriptionHtml={pathDescriptionHtml(path.summary)}
          schoolDate={formatHeroPublishedDate(path.createdAt)}
          publisherAvatarUrl={publisherAvatarUrl}
          publisherAvatarFallback={publisherAvatarFallback}
          publisherAvatarAlt={
            isOwnPath
              ? 'Your profile'
              : pathOwnerId
                ? `${creatorName?.trim() || 'Publisher'} profile`
                : 'Coursetexts'
          }
          publisherAvatarHref={publisherAvatarHref}
          actions={
            <>
              <button
                type='button'
                className={heroStyles.shareLink}
                onClick={() => void copyShareUrl()}
                aria-label={
                  shareCopied
                    ? 'Link copied to clipboard'
                    : 'Copy link to this learning path'
                }
              >
                <ShareIcon />
                {shareCopied ? 'Copied' : 'Share'}
              </button>
              {isOwnPath ? (
                <div className={saveStyles.wrap}>
                  <button
                    type='button'
                    className={
                      pathIsPrivate ? saveStyles.savedBtn : saveStyles.saveBtn
                    }
                    onClick={() => void togglePathPrivacy()}
                    disabled={privacyBusy}
                    aria-pressed={pathIsPrivate}
                    aria-label={
                      pathIsPrivate
                        ? 'Make this learning path public'
                        : 'Make this learning path private'
                    }
                  >
                    <span className={saveStyles.icon} aria-hidden>
                      <PrivacyIcon locked={pathIsPrivate} />
                    </span>
                    <span className={saveStyles.label}>
                      {pathIsPrivate ? 'Make public' : 'Make private'}
                    </span>
                  </button>
                </div>
              ) : (
                <div className={saveStyles.wrap}>
                  <button
                    type='button'
                    className={
                      bookmarkLinkId ? saveStyles.savedBtn : saveStyles.saveBtn
                    }
                    onClick={() => void toggleBookmarkPath()}
                    disabled={bookmarkBusy}
                    aria-pressed={Boolean(bookmarkLinkId)}
                    aria-label={
                      bookmarkLinkId
                        ? 'Remove this learning path from your saved list'
                        : 'Save this learning path'
                    }
                  >
                    <span className={saveStyles.icon} aria-hidden>
                      <BookmarkIcon filled={Boolean(bookmarkLinkId)} />
                    </span>
                    <span className={saveStyles.label}>
                      {bookmarkLinkId ? 'Saved' : 'Save'}
                    </span>
                  </button>
                </div>
              )}
            </>
          }
        />
      </div>

      <div
        ref={bodyRef}
        className={`${styles.body}${
          viewMode === 'graph' ? ` ${styles.bodyGraph}` : ''
        }${graphSplitDragging ? ` ${styles.bodyGraphDragging}` : ''}`}
      >
        <div
          className={`${styles.layout} ${
            viewMode === 'graph' ? styles.layoutGraph : styles.layoutList
          }`}
        >
            <section className={styles.mapPanel}>
              <div className={styles.mapToolbar}>
                <div className={styles.mapToolbarRow}>
                  <div className={styles.mapToolbarCopy}>
                    <h2 className={styles.mapTitle}>
                      {viewMode === 'list' ? 'The outline' : 'The map'}
                    </h2>
                    {viewMode === 'graph' ? (
                      <span className={styles.mapHint}>
                        Hover a step to see its children · click a node to read
                        it
                      </span>
                    ) : null}
                  </div>
                  <div
                    className={styles.viewToggle}
                    role='group'
                    aria-label='Path view'
                  >
                    <button
                      type='button'
                      className={styles.viewToggleBtn}
                      aria-pressed={viewMode === 'graph'}
                      onClick={() => setViewMode('graph')}
                    >
                      Graph
                    </button>
                    <button
                      type='button'
                      className={styles.viewToggleBtn}
                      aria-pressed={viewMode === 'list'}
                      onClick={() => setViewMode('list')}
                    >
                      List
                    </button>
                  </div>
                </div>
                {viewMode === 'list' ? (
                  <div className={styles.searchWrap}>
                    <input
                      type='search'
                      className={styles.search}
                      placeholder='SEARCH'
                      value={outlineSearch}
                      onChange={(event) => setOutlineSearch(event.target.value)}
                      aria-label='Search in outline'
                    />
                  </div>
                ) : null}
              </div>
              {viewMode === 'list' ? (
                <div className={styles.pathListWrap}>
                  <div className={styles.pathListScroll}>
                    {outlineNoMatches ? (
                      <p className={styles.pathListEmpty}>
                        No matching steps.
                      </p>
                    ) : null}
                    {showRecommendedNav || showMentalMapNav ? (
                      <div className={styles.navPanelSection}>
                        {showRecommendedNav ? (
                          <PathSectionRow
                            label='Recommended Path'
                            count={coreSteps.length}
                            selected={showingRecommended}
                            onSelect={() =>
                              selectNode(LEARNING_PATH_RECOMMENDED_SECTION_ID)
                            }
                          />
                        ) : null}
                        {showMentalMapNav ? (
                          <PathSectionRow
                            label='Mental Map'
                            selected={showingMentalMap}
                            onSelect={() =>
                              selectNode(LEARNING_PATH_MENTAL_MAP_SECTION_ID)
                            }
                          />
                        ) : null}
                      </div>
                    ) : null}
                    {filteredTree.length > 0 ? (
                      <PathOutlineList
                        items={filteredTree}
                        marks={marks}
                        selectedId={selectedId}
                        onSelect={selectNode}
                      />
                    ) : !searching && coreSteps.length === 0 ? (
                      <p className={styles.pathListEmpty}>
                        Nothing on this path yet.
                      </p>
                    ) : null}
                  </div>
                  <div className={styles.pathListFooter}>
                    <PathLegend />
                    <PathStageActions
                      inline
                      onEdit={openEdit}
                      onAdd={() =>
                        openAdd(
                          showingRecommended ||
                            showingMentalMap ||
                            !selected ||
                            selected.kind === 'goal'
                            ? 'step'
                            : 'child'
                        )
                      }
                    />
                  </div>
                </div>
              ) : (
                <div
                  className={styles.mapStage}
                  onMouseLeave={() => setHoverId(null)}
                >
                  <GraphViewport
                    scrollerClassName={styles.mapScroll}
                    padClassName={styles.graphPad}
                    canvasClassName={styles.canvas}
                    canvasStyle={
                      {
                        '--graph-w': `${layout.width}px`,
                        '--graph-h': `${layout.height}px`
                      } as React.CSSProperties
                    }
                    overlay={<PathLegend />}
                  >
                      <svg
                        className={styles.connections}
                        viewBox={`0 0 ${layout.width} ${layout.height}`}
                        preserveAspectRatio='xMinYMin meet'
                        aria-hidden
                      >
                        {path.edges.map((edge) => {
                          if (
                            !layout.visibleIds.has(edge.from) ||
                            !layout.visibleIds.has(edge.to)
                          ) {
                            return null
                          }
                          const fromPos = displayPositions[edge.from]
                          const toPos = displayPositions[edge.to]
                          if (!fromPos || !toPos) return null
                          return (
                            <path
                              key={`${edge.from}-${edge.to}`}
                              d={edgePath(fromPos, toPos)}
                              style={{ strokeWidth: 1.4 }}
                            />
                          )
                        })}
                      </svg>
                      {path.nodes.map((node) => {
                        if (!layout.visibleIds.has(node.id)) return null
                        const mark = marks[node.id]
                        const pos =
                          displayPositions[node.id] ?? layout.positions[node.id]
                        if (!pos) return null
                        return (
                          <button
                            key={node.id}
                            type='button'
                            className={nodeClass(
                              node,
                              node.id === graphSelectedId
                            )}
                            style={{ left: pos.x, top: pos.y }}
                            aria-label={
                              mark
                                ? mark.role === 'core'
                                  ? `Step ${mark.mark}: ${node.label}`
                                  : `${node.label}, ${mark.mark})`
                                : node.label
                            }
                            onMouseEnter={() => setHoverId(node.id)}
                            onFocus={() => setHoverId(node.id)}
                            onClick={(event) => {
                              centerGraphNode(event.currentTarget)
                              selectNodeKeepingScroll(node.id)
                            }}
                          >
                            <span className={styles.nodeStatus} />
                            <span className={styles.nodeHead}>
                              {mark ? (
                                <span
                                  className={
                                    mark.role === 'branch'
                                      ? `${styles.nodeMark} ${styles.nodeMarkBranch}`
                                      : styles.nodeMark
                                  }
                                >
                                  {mark.role === 'branch'
                                    ? `${mark.mark})`
                                    : mark.mark}
                                </span>
                              ) : null}
                              <span className={styles.nodeLabel}>
                                {node.label}
                              </span>
                            </span>
                            <span className={styles.nodeSub}>{node.sub}</span>
                          </button>
                        )
                      })}
                  </GraphViewport>
                  <PathStageActions
                    onEdit={openEdit}
                    onAdd={() =>
                      openAdd(
                        showingRecommended ||
                          showingMentalMap ||
                          !selected ||
                          selected.kind === 'goal'
                          ? 'step'
                          : 'child'
                      )
                    }
                  />
                </div>
              )}
            </section>

            {viewMode === 'graph' ? (
              <button
                type='button'
                className={`${styles.splitHandle}${
                  graphSplitDragging ? ` ${styles.splitHandleActive}` : ''
                }`}
                aria-label='Resize content panel'
                aria-orientation='vertical'
                aria-valuemin={GRAPH_DETAIL_MIN}
                aria-valuenow={graphDetailWidth}
                title='Drag to resize. Double-click to reset.'
                onPointerDown={handleGraphSplitPointerDown}
                onPointerMove={handleGraphSplitPointerMove}
                onPointerUp={handleGraphSplitPointerUp}
                onPointerCancel={handleGraphSplitPointerUp}
                onLostPointerCapture={handleGraphSplitPointerUp}
                onKeyDown={handleGraphSplitKeyDown}
                onDoubleClick={handleGraphSplitDoubleClick}
              />
            ) : null}

            <aside
              ref={detailRef}
              className={styles.detail}
              aria-live='polite'
              style={
                viewMode === 'graph'
                  ? {
                      flexBasis: graphDetailWidth,
                      width: graphDetailWidth,
                      maxWidth: 'none'
                    }
                  : undefined
              }
            >
              {showingRecommended ? (
                <LearningPathRecommendedOverview
                  steps={coreSteps}
                  marks={marks}
                  onSelect={selectNode}
                />
              ) : selected ? (
                <article className={styles.article}>
              <header className={styles.articleHeader}>
                {!showingMentalMap && selectedParent ? (
                  <nav aria-label='Breadcrumb'>
                    <ol className={styles.breadcrumb}>
                      <li className={styles.breadcrumbItem}>
                        <button
                          type='button'
                          onClick={() => selectNode(selectedParent.id)}
                          className={styles.breadcrumbBtn}
                        >
                          {selectedParent.label}
                        </button>
                        <ChevronSmall />
                      </li>
                    </ol>
                  </nav>
                ) : null}
                <span className={styles.typeBadge}>
                  {pathTypeBadge(selected, showingMentalMap)}
                </span>
                <h1 className={styles.articleTitle}>
                  {showingMentalMap ? path.title : selected.label}
                </h1>
              </header>

              <PathContentSection
                title='Why is this on the learning path'
                icon={<WhyIcon />}
                open={openSections.why}
                onToggle={() =>
                  setOpenSections((prev) => ({ ...prev, why: !prev.why }))
                }
              >
                <p className={styles.whyCopy}>
                  {selected.why ||
                    (showingMentalMap ? path.summary : selected.description) ||
                    'A reason has not been written for this step yet.'}
                </p>
              </PathContentSection>

              <PathContentSection
                title='Resources'
                icon={<ResourcesIcon />}
                open={openSections.resources}
                onToggle={() =>
                  setOpenSections((prev) => {
                    const nextOpen = !prev.resources
                    if (!nextOpen) {
                      setAddResourceOpen(false)
                      setResourceDraft(EMPTY_RESOURCE_DRAFT)
                    }
                    return { ...prev, resources: nextOpen }
                  })
                }
                extra={
                  !addResourceOpen ? (
                    <>
                      {listedResources.length > 0 ? (
                        <span className={styles.sectionMeta}>
                          {listedResources.length}{' '}
                          {listedResources.length === 1
                            ? 'resource'
                            : 'resources'}{' '}
                          · in order
                        </span>
                      ) : null}
                    <button
                      type='button'
                      className={`${styles.addResourceBtn}${
                        !currentUserId ? ` ${styles.addResourceBtnDisabled}` : ''
                      }`}
                      aria-disabled={!currentUserId}
                      title={
                        currentUserId ? undefined : 'Sign in to add a resource'
                      }
                      onClick={() => {
                        if (!currentUserId) {
                          requestSignIn()
                          return
                        }
                        setAddResourceOpen(true)
                        setOpenSections((prev) => ({
                          ...prev,
                          resources: true
                        }))
                      }}
                    >
                      + Add a resource
                    </button>
                    </>
                  ) : null
                }
              >
                {addResourceOpen ? (
                  <form
                    className={styles.resourceForm}
                    onSubmit={addUserResource}
                  >
                    <label className={styles.modalLabel}>
                      Title
                      <input
                        className={styles.modalInput}
                        value={resourceDraft.title}
                        onChange={(event) =>
                          setResourceDraft((prev) => ({
                            ...prev,
                            title: event.target.value
                          }))
                        }
                        placeholder='The Illustrated Transformer'
                        required
                      />
                    </label>
                    <label className={styles.modalLabel}>
                      URL
                      <input
                        className={styles.modalInput}
                        type='url'
                        value={resourceDraft.href}
                        onChange={(event) =>
                          setResourceDraft((prev) => ({
                            ...prev,
                            href: event.target.value
                          }))
                        }
                        placeholder='https://…'
                      />
                    </label>
                    <label className={styles.modalLabel}>
                      Type
                      <select
                        className={styles.modalInput}
                        value={resourceDraft.kind}
                        onChange={(event) =>
                          setResourceDraft((prev) => ({
                            ...prev,
                            kind: event.target.value as LearningPathResourceKind
                          }))
                        }
                      >
                        {RESOURCE_KINDS.map((kind) => (
                          <option key={kind} value={kind}>
                            {kind}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className={styles.modalLabel}>
                      The part that helped
                      <input
                        className={styles.modalInput}
                        value={resourceDraft.passage}
                        onChange={(event) =>
                          setResourceDraft((prev) => ({
                            ...prev,
                            passage: event.target.value
                          }))
                        }
                        placeholder='e.g. the QKV diagram, 12:40–14:10, chapter 4'
                        required
                      />
                    </label>
                    <label className={styles.modalLabel}>
                      Why it helped
                      <textarea
                        className={styles.note}
                        rows={3}
                        value={resourceDraft.why}
                        onChange={(event) =>
                          setResourceDraft((prev) => ({
                            ...prev,
                            why: event.target.value
                          }))
                        }
                        placeholder='What did this specific part make click?'
                      />
                    </label>
                    <label className={styles.modalLabel}>
                      Suggested order
                      <span className={styles.placementRow}>
                        <input
                          className={`${styles.modalInput} ${styles.placementInput}`}
                          type='number'
                          inputMode='numeric'
                          min={1}
                          max={resourcePlacementMax}
                          step={1}
                          value={resourceDraft.sequence}
                          onChange={(event) =>
                            setResourceDraft((prev) => ({
                              ...prev,
                              sequence: event.target.value
                            }))
                          }
                          placeholder={String(resourcePlacementMax)}
                        />
                        <span className={styles.placementHint}>
                          1–{resourcePlacementMax}
                          {listedResources.length === 0
                            ? ' (first resource)'
                            : ` · blank = end (${resourcePlacementMax})`}
                        </span>
                      </span>
                    </label>
                    <div className={styles.resourceFormActions}>
                      <button
                        type='button'
                        className={styles.modalCancel}
                        onClick={() => {
                          setAddResourceOpen(false)
                          setResourceDraft(EMPTY_RESOURCE_DRAFT)
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type='submit'
                        className={styles.modalSubmit}
                        disabled={
                          !resourceDraft.title.trim() ||
                          !resourceDraft.passage.trim()
                        }
                      >
                        Save resource
                      </button>
                    </div>
                  </form>
                ) : null}
                {listedResources.length === 0 && !addResourceOpen ? (
                  <p className={styles.resourceEmpty}>
                    Nothing here yet. When something makes this click, add it in
                    the order you would study it.
                  </p>
                ) : listedResources.length > 0 ? (
                  <ol className={styles.resourceList}>
                    {listedResources.map((resource) => {
                      const kindLabel = resource.source
                        ? `${resource.kind} · ${resource.source}`
                        : resource.kind
                      const inner = (
                        <>
                          <span className={styles.resourcePos}>
                            {resource.sequence}
                          </span>
                          <div className={styles.resourceBody}>
                            <div className={styles.resourceMetaRow}>
                              <p className={styles.resourceKind}>{kindLabel}</p>
                              {resource.addedByYou ? (
                                <span className={styles.resourceYou}>
                                  Added by you
                                </span>
                              ) : null}
                            </div>
                            <p className={styles.resourceTitle}>
                              {resource.title}
                            </p>
                            {resource.passage ? (
                              <p className={styles.resourcePassage}>
                                {resource.passage}
                              </p>
                            ) : null}
                            {resource.why ? (
                              <p className={styles.resourceWhy}>
                                {resource.why}
                              </p>
                            ) : null}
                          </div>
                        </>
                      )
                      return (
                        <li key={resource.id}>
                          {resource.href ? (
                            <a
                              className={styles.resource}
                              href={resource.href}
                              target='_blank'
                              rel='noopener noreferrer'
                            >
                              {inner}
                            </a>
                          ) : (
                            <div className={styles.resource}>{inner}</div>
                          )}
                        </li>
                      )
                    })}
                  </ol>
                ) : null}
              </PathContentSection>

              <PathContentSection
                title='Your Notes'
                icon={<NoteIcon />}
                open={openSections.note}
                onToggle={() =>
                  setOpenSections((prev) => ({ ...prev, note: !prev.note }))
                }
              >
                {userStateReady ? (
                  <SiteNotesEditor
                    key={`${slug}:${selected.id}:${currentUserId ?? 'anon'}`}
                    value={parseStoredNotebookNote(notes[selected.id])}
                    onChange={(doc) => persistSelectedNote(selected.id, doc)}
                    placeholder='Write notes for this topic…'
                    ariaLabel='Your notes'
                    expandTitle='Your Notes'
                    expandTopic={selected.label}
                    locked={!currentUserId}
                    lockedMessage='Sign in to add your notes'
                    onUnlock={requestSignIn}
                  />
                ) : (
                  <p className={styles.resourceEmpty}>Loading notes…</p>
                )}
              </PathContentSection>

              {selected.kind !== 'goal' || nextNode ? (
                <div className={styles.actionRow}>
                  {selected.kind !== 'goal' ? (
                    <button
                      type='button'
                      className={styles.primaryBtn}
                      onClick={markExplored}
                      disabled={selected.status === 'explored'}
                    >
                      {selected.status === 'explored'
                        ? 'Explored'
                        : 'Mark as explored'}
                    </button>
                  ) : null}
                  {nextNode ? (
                    <button
                      type='button'
                      className={`${styles.primaryBtn} ${styles.nextBtn}`}
                      onClick={() => selectNodeKeepingScroll(nextNode.id)}
                    >
                      Next
                    </button>
                  ) : null}
                </div>
              ) : null}
                </article>
              ) : null}
            </aside>
          </div>
      </div>

      <div className={styles.activitySection}>
        <CourseActivity
          coursePageId={learningPathActivityPageId(slug)}
          courseTitle={path.title}
          courseUrl={learningPathHref(slug)}
        />
      </div>

      {addOpen ? (
        <div
          className={styles.backdrop}
          role='presentation'
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setAddOpen(false)
          }}
        >
          <div
            className={styles.modal}
            role='dialog'
            aria-modal='true'
            aria-labelledby='add-concept-title'
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h2 id='add-concept-title' className={styles.modalTitle}>
                Add to path
              </h2>
              <button
                type='button'
                className={styles.modalClose}
                onClick={() => setAddOpen(false)}
                aria-label='Close'
              >
                ×
              </button>
            </div>
            <form className={styles.modalForm} onSubmit={addNode}>
              {editorNode.kind !== 'goal' &&
              !showingRecommended &&
              !showingMentalMap ? (
                <fieldset className={styles.placement}>
                  <legend className={styles.placementLegend}>Where</legend>
                  <label className={styles.placementOption}>
                    <input
                      type='radio'
                      name='add-placement'
                      checked={addPlacement === 'child'}
                      onChange={() => setAddPlacement('child')}
                    />
                    Under “{editorNode.label}”
                  </label>
                  <label className={styles.placementOption}>
                    <input
                      type='radio'
                      name='add-placement'
                      checked={addPlacement === 'step'}
                      onChange={() => setAddPlacement('step')}
                    />
                    New step on the core path
                  </label>
                </fieldset>
              ) : (
                <p className={styles.placementHint}>
                  This will be added as the next step on the core path.
                </p>
              )}
              <label className={styles.modalLabel}>
                {addingOnCore
                  ? 'Step title'
                  : editorNode.kind === 'prerequisite'
                  ? 'Sub-concept'
                  : 'Concept'}
                <input
                  className={styles.modalInput}
                  value={addLabel}
                  onChange={(event) => setAddLabel(event.target.value)}
                  placeholder={
                    addingOnCore
                      ? 'e.g. Practice project'
                      : 'e.g. Positional embeddings'
                  }
                  autoFocus
                />
              </label>
              <div className={styles.modalActions}>
                <button
                  type='button'
                  className={styles.modalCancel}
                  onClick={() => setAddOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  className={styles.modalSubmit}
                  disabled={!addLabel.trim()}
                >
                  Add to path
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {editOpen ? (
        <div
          className={styles.backdrop}
          role='presentation'
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setEditOpen(false)
          }}
        >
          <div
            className={styles.modal}
            role='dialog'
            aria-modal='true'
            aria-labelledby='edit-node-title'
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h2 id='edit-node-title' className={styles.modalTitle}>
                Edit node
              </h2>
              <button
                type='button'
                className={styles.modalClose}
                onClick={() => setEditOpen(false)}
                aria-label='Close'
              >
                ×
              </button>
            </div>
            <form className={styles.modalForm} onSubmit={saveEdit}>
              <label className={styles.modalLabel}>
                {editorNode.kind === 'goal'
                  ? 'Goal'
                  : editorNode.kind === 'milestone'
                  ? 'Step title'
                  : 'Name'}
                <input
                  className={styles.modalInput}
                  value={editLabel}
                  onChange={(event) => setEditLabel(event.target.value)}
                  autoFocus
                />
              </label>
              <label className={styles.modalLabel}>
                Description
                <textarea
                  className={styles.modalTextarea}
                  rows={3}
                  value={editDescription}
                  onChange={(event) => setEditDescription(event.target.value)}
                />
              </label>
              <label className={styles.modalLabel}>
                Why it is on your path
                <textarea
                  className={styles.modalTextarea}
                  rows={3}
                  value={editWhy}
                  onChange={(event) => setEditWhy(event.target.value)}
                />
              </label>
              <div className={styles.modalActions}>
                {editorNode.kind !== 'goal' ? (
                  <button
                    type='button'
                    className={styles.modalDelete}
                    onClick={() => {
                      setEditOpen(false)
                      setDeleteOpen(true)
                    }}
                  >
                    Delete this node
                  </button>
                ) : null}
                <button
                  type='button'
                  className={styles.modalCancel}
                  onClick={() => setEditOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  className={styles.modalSubmit}
                  disabled={!editLabel.trim()}
                >
                  Save changes
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {deleteOpen && selected && selected.kind !== 'goal' ? (
        <div
          className={styles.backdrop}
          role='presentation'
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setDeleteOpen(false)
          }}
        >
          <div
            className={styles.modal}
            role='alertdialog'
            aria-modal='true'
            aria-labelledby='delete-node-title'
            aria-describedby='delete-node-warning'
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h2 id='delete-node-title' className={styles.modalTitle}>
                Delete this node?
              </h2>
              <button
                type='button'
                className={styles.modalClose}
                onClick={() => setDeleteOpen(false)}
                aria-label='Close'
              >
                ×
              </button>
            </div>
            <div className={styles.modalForm}>
              <p id='delete-node-warning' className={styles.deleteWarning}>
                You are about to delete “{selected.label}”.
                {nestedToDelete.length > 0
                  ? ` This will also remove ${nestedToDelete.length} nested ${
                      nestedToDelete.length === 1 ? 'concept' : 'concepts'
                    } underneath it.`
                  : ''}{' '}
                This cannot be undone.
              </p>
              <div className={styles.modalActions}>
                <button
                  type='button'
                  className={styles.modalCancel}
                  onClick={() => setDeleteOpen(false)}
                >
                  Keep node
                </button>
                <button
                  type='button'
                  className={styles.modalDanger}
                  onClick={deleteSelected}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
