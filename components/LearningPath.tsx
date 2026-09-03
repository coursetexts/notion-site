import * as React from 'react'
import { useRouter } from 'next/router'

import { useAuthOptional } from '@/contexts/AuthContext'

import { CourseActivity } from '@/components/CourseActivity'
import {
  CourseHero,
  formatHeroPublishedDate,
  unwrapFirstLetterInDescription,
  wrapFirstLetterInDescription
} from '@/components/CourseHero'
import { CourseLearningPath } from '@/components/CourseLearningPath'
import { FormSelect } from '@/components/FormSelect'
import { LearningPathOutlinePanel } from '@/components/LearningPathOutlinePanel'
import { PathContentActivity } from '@/components/PathContentActivity'
import { ReportButton, reportHoverTargetClass } from '@/components/ReportButton'
import { SiteNotesEditor } from '@/components/SiteNotesEditor'
import { getCachedAuth } from '@/lib/auth-cache'
import { currentAuthRedirectPath, signInPageHref } from '@/lib/auth-redirect'
import { centerGraphNode } from '@/lib/center-graph-node'
import { pathResourceReportId } from '@/lib/content-reports'
import { learningPathActivityPageId } from '@/lib/course-activity-db'
import { getCourseLearningPathData } from '@/lib/course-learning-path-db'
import { DEFAULT_COURSE_LEARNING_PATH_SLUG } from '@/lib/course-learning-path-seed'
import { isCourseLearningPathPayload } from '@/lib/course-learning-path-types'
import { getProfileByUserId } from '@/lib/follows'
import { structuralKnowledgeEdgesFromLearningPath } from '@/lib/knowledge-graph'
import {
  learningPathAbsoluteUrl,
  learningPathHref,
  learningPathResourceBookmarkUrl,
  normalizeUserLinkUrl,
  userLinkMatchesLearningPathSlug
} from '@/lib/learning-path-bookmark-link'
import { formatLearningPathExportContext } from '@/lib/learning-path-export-context'
import {
  getLearningPathRecord,
  loadLearningPathUserState,
  overlayUserState,
  saveLearningPathUserState,
  setOwnedLearningPathVisibility,
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
  learningPathKicker,
  learningPathOutlineHint
} from '@/lib/learning-path-kind-ui'
import {
  isLearningPathFinished,
  knowledgeTopicItemsFromLearningPath,
  knowledgeTopicsFromLearningPath
} from '@/lib/learning-path-knowledge'
import {
  type LearningPathPublishTopicGap,
  checkLearningPathPublishResources,
  isLearningPathPublishVisibility,
  promoteLearningPathOwnerResources
} from '@/lib/learning-path-publish'
import {
  LEARNING_PATH_RATING_TARGET,
  hasLocalLearningPathRating
} from '@/lib/learning-path-ratings'
import { submitLearningPathRating } from '@/lib/learning-path-ratings-db'
import {
  type LearningPathResourceSuggestion,
  addLearningPathResourceSuggestion,
  deleteLearningPathResourceSuggestion,
  listLearningPathResourceSuggestions,
  respondToLearningPathResourceSuggestion
} from '@/lib/learning-path-resource-suggestions-db'
import {
  type LearningPathResourceVoteSummary,
  getLearningPathResourceVoteSummaries,
  learningPathResourceVoteKey,
  setLearningPathResourceUpvote
} from '@/lib/learning-path-resource-votes-db'
import {
  LEARNING_PATH_KNOWLEDGE_SECTION_ID,
  LEARNING_PATH_MENTAL_MAP_LABEL,
  LEARNING_PATH_MENTAL_MAP_SECTION_ID,
  LEARNING_PATH_RECOMMENDED_SECTION_ID,
  isLearningPathKnowledgeSelection,
  isLearningPathMentalMapSelection,
  isLearningPathRecommendedSelection,
  isLearningPathSectionSelection,
  outlineTreeWithoutGoal
} from '@/lib/learning-path-sections'
import {
  type LearningPathData,
  type LearningPathKind,
  type LearningPathListedResource,
  type LearningPathNode,
  type LearningPathResource,
  type LearningPathResourceKind,
  type LearningPathUserResource,
  type LearningPathVisibility,
  SEEDED_LEARNING_PATHS_BY_SLUG,
  emptyLearningPath,
  insertLearningPathOfficialResource,
  insertLearningPathUserResource,
  isCatalogLearningPathSlug,
  mergeLearningPathResources,
  parseLearningPathKind,
  readStoredLearningPaths,
  resolveLearningPath,
  sequenceMarks,
  updateLearningPathUserResource
} from '@/lib/learning-path-seed'
import { readSearchParam, replaceSearchParams } from '@/lib/note-deep-link'
import {
  type NotebookDocJson,
  parseStoredNotebookNote,
  serializeStoredNotebookNote
} from '@/lib/notebook-editor-default'
import { registerPersistBeforeSignOut } from '@/lib/persist-before-sign-out'
import { restoreScrollAfter } from '@/lib/restore-scroll-after'
import { addKnowledgeTopicsFromCompletedPath } from '@/lib/user-knowledge-topics-db'
import { addLink, deleteLink, getMyLinks } from '@/lib/user-links'

import heroStyles from './CourseHero.module.css'
import { GraphViewport } from './GraphViewport'
import styles from './LearningPath.module.css'
import { LearningPathFinishedModal } from './LearningPathFinishedModal'
import { LearningPathLearnedPanel } from './LearningPathLearnedPanel'
import { LearningPathPublishModal } from './LearningPathPublishModal'
import { LearningPathRatingModal } from './LearningPathRatingModal'
import saveStyles from './SaveCourseButton.module.css'

const RESOURCE_KINDS: LearningPathResourceKind[] = [
  'article',
  'video',
  'book',
  'course',
  'paper',
  'exercise'
]

const RESOURCE_KIND_OPTIONS = RESOURCE_KINDS.map((kind) => ({
  value: kind,
  label: kind.charAt(0).toUpperCase() + kind.slice(1)
}))

const VISIBILITY_OPTIONS: Array<{
  value: LearningPathVisibility
  label: string
}> = [
  { value: 'private', label: 'Private' },
  { value: 'public', label: 'Public' },
  { value: 'collaborative', label: 'Collab' }
]

function ResourceEditPencilIcon() {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='13'
      height='13'
      viewBox='0 0 14 14'
      fill='none'
      aria-hidden
    >
      <path
        d='M8.6 2.2l3.2 3.2M3 11.2l2.9-.6 6.1-6.1a.9.9 0 0 0 0-1.3L10.8 2a.9.9 0 0 0-1.3 0L3.4 8.1 3 11.2Z'
        stroke='currentColor'
        strokeWidth='1.2'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

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

function isLearningPathRowUuid(id: string | null | undefined): id is string {
  return Boolean(
    id &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        id
      )
  )
}

function ResourceUpvoteIcon() {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='11'
      height='11'
      viewBox='0 0 16 16'
      fill='none'
      aria-hidden
    >
      <path
        d='M13.3563 9.64376L8.35635 4.64376C8.26155 4.54986 8.13352 4.49719 8.0001 4.49719C7.86667 4.49719 7.73865 4.54986 7.64385 4.64376L2.64385 9.64376C2.57602 9.71605 2.53004 9.80607 2.51124 9.9034C2.49244 10.0007 2.50158 10.1014 2.5376 10.1938C2.57585 10.2848 2.64018 10.3624 2.72249 10.4169C2.80479 10.4714 2.90139 10.5003 3.0001 10.5H13.0001C13.0988 10.5003 13.1954 10.4714 13.2777 10.4169C13.36 10.3624 13.4243 10.2848 13.4626 10.1938C13.4986 10.1014 13.5078 10.0007 13.489 9.9034C13.4702 9.80607 13.4242 9.71605 13.3563 9.64376Z'
        fill='currentColor'
      />
    </svg>
  )
}

function ResourceVoteControl({
  score,
  userVoted,
  disabled,
  signedIn,
  onToggle
}: {
  score: number
  userVoted: boolean
  disabled: boolean
  signedIn: boolean
  onToggle: () => void
}) {
  return (
    <button
      type='button'
      className={`${styles.resourceVoteBtn}${
        userVoted ? ` ${styles.resourceVoteBtnOn}` : ''
      }`}
      onClick={onToggle}
      disabled={disabled}
      aria-pressed={userVoted}
      aria-label={
        userVoted
          ? 'Remove upvote'
          : signedIn
          ? 'Upvote this resource'
          : 'Sign in to upvote this resource'
      }
      title={
        userVoted
          ? 'Remove upvote'
          : signedIn
          ? 'Upvote — does not change list order'
          : 'Sign in to upvote'
      }
    >
      <ResourceUpvoteIcon />
      <span
        className={styles.resourceVoteCount}
        aria-live='polite'
        aria-atomic='true'
      >
        {score}
      </span>
    </button>
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

function ResourceBookmarkControl({
  saved,
  disabled,
  signedIn,
  onToggle
}: {
  saved: boolean
  disabled: boolean
  signedIn: boolean
  onToggle: () => void
}) {
  return (
    <button
      type='button'
      className={styles.resourceEditBtn}
      onClick={onToggle}
      disabled={disabled}
      aria-pressed={saved}
      aria-label={
        saved
          ? 'Remove bookmark'
          : signedIn
          ? 'Bookmark this resource'
          : 'Sign in to bookmark this resource'
      }
      title={
        saved
          ? 'Remove bookmark'
          : signedIn
          ? 'Save to your bookmarked links'
          : 'Sign in to bookmark'
      }
    >
      <BookmarkIcon filled={saved} />
    </button>
  )
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

function isCannedPathSub(sub: string) {
  const value = sub.trim().toLowerCase()
  return value === 'need this' || value === 'as deep as you need'
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

function PencilIcon() {
  return (
    <svg width='12' height='12' viewBox='0 0 12 12' fill='none' aria-hidden>
      <path
        d='M7.35 1.85l2.8 2.8M2.15 9.55l2.45-.5 5.25-5.25a.8.8 0 0 0 0-1.13L8.53 1.35a.8.8 0 0 0-1.13 0L2.5 7.25 2.15 9.55Z'
        stroke='currentColor'
        strokeWidth='1.3'
        strokeLinecap='round'
        strokeLinejoin='round'
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

function fallbackSelection() {
  return LEARNING_PATH_RECOMMENDED_SECTION_ID
}

function selectionFromSearch(nodeIds: Iterable<string>) {
  const node = readSearchParam('node')
  if (!node) return LEARNING_PATH_RECOMMENDED_SECTION_ID
  if (isLearningPathSectionSelection(node)) return node
  for (const id of nodeIds) {
    if (id === node) return node
  }
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

const OPEN_SECTIONS = {
  why: true,
  resources: true
}

function pathTypeBadge(node: LearningPathNode, mentalMap: boolean) {
  if (mentalMap || node.kind === 'goal') return LEARNING_PATH_MENTAL_MAP_LABEL
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
  inline = false,
  popout = false,
  underLabel
}: {
  onAdd: () => void
  onEdit: () => void
  inline?: boolean
  popout?: boolean
  underLabel?: string
}) {
  const wrapClass = popout
    ? styles.nodeMenu
    : inline
    ? styles.graphActionsInline
    : styles.graphActions
  const btnClass = inline
    ? `${styles.addNode} ${styles.addNodeInline}`
    : popout
    ? `${styles.addNode} ${styles.addNodePopout}`
    : styles.addNode
  const plusClass = popout ? styles.nodePlusBtn : btnClass
  const addAria = popout
    ? underLabel
      ? `New node under “${underLabel}”`
      : 'New node under this node'
    : 'Add to path'
  return (
    <div
      className={wrapClass}
      role={popout ? 'menu' : undefined}
      aria-label={popout ? 'Node actions' : undefined}
      data-no-pan={popout ? '' : undefined}
    >
      <button
        type='button'
        className={btnClass}
        role={popout ? 'menuitem' : undefined}
        aria-label='Edit this node'
        title='Edit this node'
        onClick={(event) => {
          event.stopPropagation()
          onEdit()
        }}
      >
        {popout ? <PencilIcon /> : 'Edit this node'}
      </button>
      <button
        type='button'
        className={plusClass}
        role={popout ? 'menuitem' : undefined}
        aria-label={addAria}
        title={addAria}
        onClick={(event) => {
          event.stopPropagation()
          onAdd()
        }}
      >
        {popout ? (
          <PlusIcon />
        ) : (
          <>
            <PlusIcon /> Add to path
          </>
        )}
      </button>
    </div>
  )
}

const DESCRIPTION_LINE_HEIGHT = 24
const DESCRIPTION_COLLAPSED_LINES = 8
const DESCRIPTION_COLLAPSED_PX =
  DESCRIPTION_LINE_HEIGHT * DESCRIPTION_COLLAPSED_LINES

function applyDescriptionDropCap(el: HTMLElement | null, enabled: boolean) {
  if (!el) return
  unwrapFirstLetterInDescription(el)
  if (enabled) wrapFirstLetterInDescription(el)
}

function LearningPathDescription({
  value,
  editable,
  onChange,
  onSave
}: {
  value: string
  editable: boolean
  onChange: (next: string) => void
  onSave: (next?: string) => void
}) {
  const [expanded, setExpanded] = React.useState(false)
  const [overflows, setOverflows] = React.useState(false)
  const [fullHeight, setFullHeight] = React.useState(DESCRIPTION_COLLAPSED_PX)
  const [clamped, setClamped] = React.useState(true)
  const [focused, setFocused] = React.useState(false)
  const wrapRef = React.useRef<HTMLDivElement>(null)
  const textRef = React.useRef<HTMLDivElement>(null)
  const sizerRef = React.useRef<HTMLDivElement>(null)

  const measure = React.useCallback(() => {
    const sizer = sizerRef.current
    if (!sizer) return
    const height = Math.max(sizer.scrollHeight, DESCRIPTION_LINE_HEIGHT)
    setFullHeight(height)
    setOverflows(height > DESCRIPTION_COLLAPSED_PX + 1)
  }, [])

  React.useLayoutEffect(() => {
    const showDropCap = Boolean(value.trim()) && !focused
    applyDescriptionDropCap(textRef.current, showDropCap)
    applyDescriptionDropCap(sizerRef.current, showDropCap)
    measure()
  }, [measure, value, expanded, focused])

  React.useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => measure())
    observer.observe(wrap)
    return () => observer.disconnect()
  }, [measure])

  const empty = !value.trim()
  const isEditing = editable && (expanded || empty || !overflows)
  const canToggle = overflows || expanded || (empty && editable)

  function readText() {
    return (textRef.current?.innerText ?? value).replace(/\n$/, '')
  }

  function toggle() {
    if (window.getSelection()?.toString()) return
    if (empty && editable && !expanded) {
      setClamped(false)
      setExpanded(true)
      return
    }
    if (!overflows && !expanded) return
    if (expanded) {
      const next = readText()
      onChange(next)
      onSave(next)
      setExpanded(false)
      return
    }
    setClamped(false)
    setExpanded(true)
  }

  function onTransitionEnd(event: React.TransitionEvent<HTMLDivElement>) {
    if (event.propertyName !== 'max-height') return
    if (!expanded) setClamped(true)
  }

  return (
    <div
      ref={wrapRef}
      className={`${heroStyles.descriptionToggle}${
        canToggle ? ` ${heroStyles.descriptionToggleInteractive}` : ''
      }${
        clamped && overflows && !expanded
          ? ` ${heroStyles.descriptionToggleClamped}`
          : ''
      }`}
      style={{
        maxHeight:
          expanded || !overflows ? fullHeight : DESCRIPTION_COLLAPSED_PX
      }}
      role={canToggle && !isEditing ? 'button' : undefined}
      tabIndex={canToggle && !isEditing ? 0 : undefined}
      aria-expanded={overflows || expanded ? expanded : undefined}
      aria-label='Learning path description'
      title={
        canToggle
          ? expanded
            ? 'Click to collapse'
            : 'Click to expand'
          : undefined
      }
      onClick={toggle}
      onTransitionEnd={onTransitionEnd}
      onKeyDown={(event) => {
        if (isEditing) return
        if (event.key !== 'Enter' && event.key !== ' ') return
        event.preventDefault()
        toggle()
      }}
    >
      <div
        ref={sizerRef}
        className={heroStyles.descriptionToggleSizer}
        aria-hidden
        dangerouslySetInnerHTML={{
          __html: value.trim()
            ? escapeHtml(value).replace(/\n/g, '<br/>')
            : '&nbsp;'
        }}
      />
      <div
        ref={textRef}
        className={heroStyles.descriptionToggleInner}
        contentEditable={isEditing}
        suppressContentEditableWarning
        data-placeholder='Add a description…'
        dangerouslySetInnerHTML={{
          __html: escapeHtml(value).replace(/\n/g, '<br/>')
        }}
        onInput={(event) => {
          const el = event.currentTarget
          const height = Math.max(el.scrollHeight, DESCRIPTION_LINE_HEIGHT)
          setFullHeight(height)
          if (height > DESCRIPTION_COLLAPSED_PX + 1) {
            setOverflows(true)
            setClamped(false)
            setExpanded(true)
          }
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false)
          const next = readText()
          onChange(next)
          onSave(next)
        }}
      />
    </div>
  )
}

function CommunityLearningPath({
  slug,
  kicker,
  kind
}: {
  slug: string
  kicker: string
  kind: Exclude<LearningPathKind, 'course'>
}) {
  const router = useRouter()
  const auth = useAuthOptional()
  const currentUserId = auth?.user?.id ?? null
  const [path, setPath] = React.useState<LearningPathData>(() =>
    resolveLearningPath(slug)
  )
  const [summaryDraft, setSummaryDraft] = React.useState(path.summary)
  const [selectedId, setSelectedId] = React.useState(() => fallbackSelection())
  const [notes, setNotes] = React.useState<Record<string, string>>({})
  const [userResources, setUserResources] = React.useState<
    Record<string, LearningPathUserResource[]>
  >({})
  const [resourceSuggestions, setResourceSuggestions] = React.useState<
    LearningPathResourceSuggestion[]
  >([])
  const [viewMode, setViewMode] = React.useState<'graph' | 'list'>('list')
  const [showFinishedModal, setShowFinishedModal] = React.useState(false)
  const [topicRating, setTopicRating] = React.useState<{
    id: string
    title: string
  } | null>(null)
  const [pendingFinish, setPendingFinish] = React.useState(false)
  const [outlineSearch, setOutlineSearch] = React.useState('')
  const [graphDetailWidth, setGraphDetailWidth] =
    React.useState(GRAPH_DETAIL_DEFAULT)
  const [graphSplitDragging, setGraphSplitDragging] = React.useState(false)
  const bodyRef = React.useRef<HTMLDivElement>(null)
  const detailRef = React.useRef<HTMLDivElement>(null)
  const graphDetailWidthRef = React.useRef(graphDetailWidth)
  const graphSplitDraggingRef = React.useRef(false)
  graphDetailWidthRef.current = graphDetailWidth
  const [activityRefreshNonce, setActivityRefreshNonce] = React.useState(0)
  const [hoverId, setHoverId] = React.useState<string | null>(null)
  const [addOpen, setAddOpen] = React.useState(false)
  const [addLabel, setAddLabel] = React.useState('')
  const [addPlacement, setAddPlacement] = React.useState<'child' | 'after'>(
    'child'
  )
  const [editOpen, setEditOpen] = React.useState(false)
  const [editLabel, setEditLabel] = React.useState('')
  const [editDescription, setEditDescription] = React.useState('')
  const [editWhy, setEditWhy] = React.useState('')
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [addResourceOpen, setAddResourceOpen] = React.useState(false)
  const [editingResourceId, setEditingResourceId] = React.useState<
    string | null
  >(null)
  const [openSections, setOpenSections] = React.useState(OPEN_SECTIONS)
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
  const [savedLinkByUrl, setSavedLinkByUrl] = React.useState<
    Record<string, string>
  >({})
  const [bookmarkingResourceId, setBookmarkingResourceId] = React.useState<
    string | null
  >(null)
  const [pathVisibility, setPathVisibility] =
    React.useState<LearningPathVisibility>('private')
  const [privacyBusy, setPrivacyBusy] = React.useState(false)
  const [publishModal, setPublishModal] = React.useState<{
    visibility: Extract<LearningPathVisibility, 'public' | 'collaborative'>
    needsTopics: boolean
    gaps: LearningPathPublishTopicGap[]
  } | null>(null)
  const [resourceVotes, setResourceVotes] = React.useState<
    Record<string, LearningPathResourceVoteSummary>
  >({})
  const [votingResourceId, setVotingResourceId] = React.useState<string | null>(
    null
  )
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

  function requestSignIn(intent?: 'notes' | 'annotations') {
    const extra: Record<string, string> = {}
    if (selectedId) extra.node = selectedId
    if (intent === 'notes') extra.notes = '1'
    if (intent === 'annotations') extra.annotations = '1'
    const next = currentAuthRedirectPath(extra)
    if (auth?.signInWithGoogle) {
      void auth.signInWithGoogle(next)
      return
    }
    void router.push(signInPageHref(next))
  }

  function persistGraph(next: LearningPathData) {
    if (!canEditPathStructure) return
    void upsertOwnedLearningPath(next).then((id) => {
      if (id) setPathRowId(id)
    })
  }

  function savePathSummary(nextValue?: string) {
    if (!isOwnPath) return
    const nextSummary = (nextValue ?? summaryDraft).trim()
    if (nextValue !== undefined && nextValue !== summaryDraft) {
      setSummaryDraft(nextValue)
    }
    if (nextSummary === path.summary) return
    setPath((prev) => {
      const next = { ...prev, summary: nextSummary }
      persistGraph(next)
      pathRef.current = next
      return next
    })
  }

  function queueUserStateSave() {
    const ownerId = currentUserId ?? getCachedAuth().user?.id ?? null
    const state = userStateFromPath(
      pathRef.current,
      notesRef.current,
      resourcesRef.current
    )
    writeLocalUserState(slug, state, ownerId)
    if (stateTimer.current) clearTimeout(stateTimer.current)
    stateTimer.current = setTimeout(() => {
      const stillOwner = (getCachedAuth().user?.id ?? null) === ownerId
      if (!stillOwner) return
      void saveLearningPathUserState(pathRowIdRef.current, slug, state, ownerId)
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
    const ownerId = getCachedAuth().user?.id ?? currentUserId
    return saveLearningPathUserState(
      pathRowIdRef.current,
      slug,
      userStateFromPath(
        pathRef.current,
        notesRef.current,
        resourcesRef.current
      ),
      ownerId
    )
  }

  React.useEffect(() => {
    let cancelled = false
    const local = resolveLearningPath(slug, readStoredLearningPaths())
    setPath(local)
    const localSelection = selectionFromSearch(
      local.nodes.map((node) => node.id)
    )
    setSelectedId(localSelection)
    replaceSearchParams({ node: localSelection })
    setHoverId(null)
    setPathRowId(null)
    setUserStateReady(false)
    setAddResourceOpen(false)
    setEditingResourceId(null)
    setOpenSections(OPEN_SECTIONS)
    setResourceDraft(EMPTY_RESOURCE_DRAFT)
    setShareCopied(false)
    setShowFinishedModal(false)
    setTopicRating(null)
    setPendingFinish(false)
    setPathOwnerId(null)
    setCreatorName(null)
    setCreatorAvatarUrl(null)
    setBookmarkLinkId(null)
    setBookmarkBusy(false)
    setSavedLinkByUrl({})
    setBookmarkingResourceId(null)
    setPathVisibility(isCatalogLearningPathSlug(slug) ? 'public' : 'private')
    setResourceVotes({})
    setVotingResourceId(null)
    setPrivacyBusy(false)
    setPublishModal(null)
    setEditOpen(false)
    setDeleteOpen(false)
    setAddOpen(false)
    setNotes({})
    notesRef.current = {}

    void (async () => {
      const record = await getLearningPathRecord(slug)
      const base =
        record && record.kind !== 'course' && Array.isArray(record.data?.nodes)
          ? record.data
          : local
      const state = await loadLearningPathUserState(record?.id ?? null, slug)
      if (cancelled) return
      const next = overlayUserState(base, state)
      setPath(next)
      setPathRowId(record?.id ?? null)
      setPathOwnerId(record?.ownerId ?? null)
      setPathVisibility(
        record
          ? record.visibility
          : isCatalogLearningPathSlug(slug)
          ? 'public'
          : 'private'
      )
      setNotes(state.notes)
      setUserResources(state.resources)
      const nextSelection = selectionFromSearch(
        next.nodes.map((node) => node.id)
      )
      setSelectedId(nextSelection)
      replaceSearchParams({ node: nextSelection })
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
    if (!userStateReady || !currentUserId) return
    if (!isLearningPathFinished(path)) return
    void addKnowledgeTopicsFromCompletedPath({
      labels: knowledgeTopicsFromLearningPath(path),
      pathId: pathRowId,
      pathSlug: slug,
      pathTitle: path.title,
      graphEdges:
        pathVisibility === 'private'
          ? undefined
          : structuralKnowledgeEdgesFromLearningPath(path)
    })
  }, [userStateReady, currentUserId, path, pathRowId, slug, pathVisibility])

  React.useEffect(() => {
    if (!isLearningPathKnowledgeSelection(selectedId)) return
    if (isLearningPathFinished(path)) return
    setSelectedId(LEARNING_PATH_RECOMMENDED_SECTION_ID)
    replaceSearchParams({ node: LEARNING_PATH_RECOMMENDED_SECTION_ID })
  }, [path, selectedId])

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

  const canEditPathStructure =
    isOwnPath ||
    (!currentUserId &&
      !pathOwnerId &&
      !isCatalogLearningPathSlug(slug) &&
      readStoredLearningPaths().some((item) => item.slug === slug))

  const canVoteOnResources =
    pathVisibility === 'public' || pathVisibility === 'collaborative'
  const isCollabPath = pathVisibility === 'collaborative'
  const canSuggestResources = isCollabPath && !isOwnPath

  React.useEffect(() => {
    if (!isCollabPath) {
      setResourceSuggestions([])
      return
    }
    const id = pathRowId ?? slug
    let cancelled = false
    void listLearningPathResourceSuggestions(id).then((rows) => {
      if (!cancelled) setResourceSuggestions(rows)
    })
    return () => {
      cancelled = true
    }
  }, [isCollabPath, pathRowId, slug, currentUserId])

  React.useEffect(() => {
    if (!canVoteOnResources || !isLearningPathRowUuid(pathRowId)) {
      setResourceVotes({})
      return
    }
    let cancelled = false
    void getLearningPathResourceVoteSummaries(pathRowId).then((next) => {
      if (!cancelled) setResourceVotes(next)
    })
    return () => {
      cancelled = true
    }
  }, [pathRowId, canVoteOnResources, currentUserId])

  React.useEffect(() => {
    setSummaryDraft(path.summary)
  }, [path.summary])

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
    if (!currentUserId) {
      setAddResourceOpen(false)
      setEditingResourceId(null)
    }
  }, [currentUserId])

  React.useEffect(() => {
    let cancelled = false
    setBookmarkLinkId(null)
    setSavedLinkByUrl({})
    if (!currentUserId) {
      return
    }
    void getMyLinks().then((links) => {
      if (cancelled) return
      const byUrl: Record<string, string> = {}
      for (const link of links) {
        byUrl[normalizeUserLinkUrl(link.url)] = link.id
      }
      setSavedLinkByUrl(byUrl)
      if (!isOwnPath) {
        const existing = links.find((link) =>
          userLinkMatchesLearningPathSlug(link.url, slug)
        )
        setBookmarkLinkId(existing?.id ?? null)
      }
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
    () => filterPathTree(outlineTreeWithoutGoal(tree), outlineQuery),
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
  const showingKnowledge = isLearningPathKnowledgeSelection(selectedId)
  const pathFinished = isLearningPathFinished(path)
  const learnedTopics = React.useMemo(
    () => knowledgeTopicItemsFromLearningPath(path),
    [path]
  )
  const selected =
    showingRecommended || showingKnowledge
      ? null
      : showingMentalMap
      ? goalNode ?? null
      : (selectedId ? nodeById[selectedId] : null) ?? null

  const coreSteps = React.useMemo(
    () =>
      path.nodes.filter(isCoreStep).sort((a, b) => {
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
    'general approach'.includes(outlineQuery) ||
    (goalNode?.label ?? '').toLowerCase().includes(outlineQuery)
  const showKnowledgeNav =
    pathFinished &&
    (!searching ||
      'what you learned'.includes(outlineQuery) ||
      'knowledge'.includes(outlineQuery) ||
      'learned'.includes(outlineQuery) ||
      learnedTopics.some((topic) =>
        topic.label.toLowerCase().includes(outlineQuery)
      ))
  const outlineNoMatches =
    searching &&
    !showRecommendedNav &&
    !showMentalMapNav &&
    !showKnowledgeNav &&
    filteredTree.length === 0
  const visibleIds = React.useMemo(
    () => new Set(path.nodes.map((node) => node.id)),
    [path.nodes]
  )
  const graphSelectedId = showingMentalMap
    ? goalNode?.id ?? ''
    : showingRecommended || showingKnowledge
    ? ''
    : selected?.id ?? ''
  const graphFocusId =
    hoverId ??
    (showingMentalMap || showingRecommended || showingKnowledge
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
  const nodeSuggestions = selected
    ? resourceSuggestions
        .filter((row) => row.nodeId === selected.id)
        .map((row) => ({
          id: row.id,
          kind: row.kind,
          title: row.title,
          href: row.href,
          passage: row.passage,
          why: row.why,
          sequence: row.sequence,
          suggestedByYou: Boolean(currentUserId && row.userId === currentUserId)
        }))
    : []
  const listedResources = selected
    ? mergeLearningPathResources(
        selected.resources,
        myResources,
        nodeSuggestions
      )
    : []
  const resourceFormOpen = addResourceOpen || Boolean(editingResourceId)
  const resourcePlacementMax =
    resourceFormOpen && editingResourceId
      ? Math.max(listedResources.length, 1)
      : listedResources.length + 1
  const nestedToDelete =
    selected && selected.kind !== 'goal' ? descendantIds(path, selected.id) : []
  const nextNode = selected ? nextOutlineNode(path, selected.id) : null

  function selectNode(id: string) {
    const next =
      nodeById[id]?.kind === 'goal' ? LEARNING_PATH_MENTAL_MAP_SECTION_ID : id
    setSelectedId(next)
    replaceSearchParams({ node: next })
    setOpenSections(OPEN_SECTIONS)
    setAddResourceOpen(false)
    setEditingResourceId(null)
    setResourceDraft(EMPTY_RESOURCE_DRAFT)
  }

  function selectNodeKeepingScroll(id: string) {
    restoreScrollAfter(() => selectNode(id), detailRef.current)
  }

  function openAdd(placement: 'child' | 'after') {
    if (!canEditPathStructure) return
    setAddPlacement(placement)
    setAddLabel('')
    setAddOpen(true)
  }

  function addToPathFromSelection() {
    openAdd('child')
  }

  function addAfterSelected() {
    if (!canEditPathStructure) return
    if (!(selected ?? goalNode)) return
    openAdd('after')
  }

  function openEdit() {
    if (!canEditPathStructure) return
    const node = selected ?? goalNode
    if (!node) return
    setEditLabel(node.label)
    setEditDescription(node.description)
    setEditWhy(node.why)
    setEditOpen(true)
  }

  function saveEdit(event: React.FormEvent) {
    event.preventDefault()
    if (!canEditPathStructure) return
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
    if (!canEditPathStructure) return
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
    replaceSearchParams({ node: fallback })
    setDeleteOpen(false)
  }

  function toggleExplored() {
    if (!selected || selected.kind === 'goal') return
    const makingExplored = selected.status !== 'explored'
    const next: LearningPathData = {
      ...path,
      nodes: path.nodes.map((node) =>
        node.id === selected.id
          ? {
              ...node,
              status: makingExplored ? ('explored' as const) : ('next' as const)
            }
          : node
      )
    }
    const justFinished =
      makingExplored &&
      !isLearningPathFinished(path) &&
      isLearningPathFinished(next)
    setPath(next)
    persistGraph(next)
    pathRef.current = next
    queueUserStateSave()
    if (makingExplored) {
      const alreadyRated = hasLocalLearningPathRating(
        slug,
        'topic',
        selected.id
      )
      if (!alreadyRated) {
        setTopicRating({
          id: selected.id,
          title: selected.label
        })
      }
      if (justFinished) {
        if (alreadyRated) setShowFinishedModal(true)
        else setPendingFinish(true)
        setViewMode('list')
        setSelectedId(LEARNING_PATH_KNOWLEDGE_SECTION_ID)
        replaceSearchParams({ node: LEARNING_PATH_KNOWLEDGE_SECTION_ID })
      }
    }
  }

  function addNode(event: React.FormEvent) {
    event.preventDefault()
    if (!canEditPathStructure) return
    const label = addLabel.trim()
    const target = selected ?? goalNode
    if (!label || !target) return
    const id = newId('n')
    const after = addPlacement === 'after'
    const afterOnCore =
      after &&
      (target.kind === 'goal' ||
        target.kind === 'concept' ||
        target.kind === 'milestone')

    setPath((prev) => {
      const core = prev.nodes
        .filter((item) => item.kind === 'concept' || item.kind === 'milestone')
        .sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0))
      const coreIds = new Set(core.map((item) => item.id))
      const goal = prev.nodes.find((item) => item.kind === 'goal') ?? target

      if (afterOnCore) {
        const afterIndex =
          target.kind === 'goal'
            ? -1
            : core.findIndex((item) => item.id === target.id)
        const sequence = afterIndex + 2
        const fromId = target.kind === 'goal' ? goal.id : target.id
        const oldNext = prev.edges.find(
          (edge) => edge.from === fromId && coreIds.has(edge.to)
        )
        const nodes = prev.nodes.map((item) => {
          if (item.kind !== 'concept' && item.kind !== 'milestone') {
            return item
          }
          const seq = item.sequence ?? 0
          if (seq >= sequence) {
            return { ...item, sequence: seq + 1, sub: `Step ${seq + 1}` }
          }
          return item
        })
        const node: LearningPathNode = {
          id,
          label,
          kind: 'milestone',
          sub: `Step ${sequence}`,
          status: 'next',
          sequence,
          x: Math.min(88, Math.max(12, (target.x ?? 34) + 16)),
          y: target.kind === 'goal' ? 36 : target.y,
          description: `A milestone on the way to ${prev.title}.`,
          why: '',
          resources: []
        }
        const edges = oldNext
          ? [
              ...prev.edges.filter(
                (edge) => !(edge.from === fromId && edge.to === oldNext.to)
              ),
              { from: fromId, to: id },
              { from: id, to: oldNext.to }
            ]
          : [...prev.edges, { from: fromId, to: id }]
        const next = { ...prev, nodes: [...nodes, node], edges }
        persistGraph(next)
        pathRef.current = next
        queueUserStateSave()
        return next
      }

      const parentId = after
        ? prev.edges.find((edge) => edge.to === target.id)?.from ?? target.id
        : target.id
      const parent = prev.nodes.find((item) => item.id === parentId) ?? target
      const siblings = prev.edges
        .filter((edge) => edge.from === parentId)
        .map((edge) => prev.nodes.find((item) => item.id === edge.to))
        .filter(
          (item): item is LearningPathNode =>
            !!item && item.kind === 'prerequisite'
        )
        .sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0))
      const sequence = after ? (target.sequence ?? 0) + 1 : siblings.length + 1
      const siblingIds = new Set(siblings.map((item) => item.id))
      const nodes = after
        ? prev.nodes.map((item) => {
            if (!siblingIds.has(item.id)) return item
            const seq = item.sequence ?? 0
            if (seq >= sequence) return { ...item, sequence: seq + 1 }
            return item
          })
        : prev.nodes

      const node: LearningPathNode = {
        id,
        label,
        kind: 'prerequisite',
        sub: '',
        status: 'next',
        sequence,
        x: Math.min(
          88,
          Math.max(12, parent.x + (after ? 8 : siblings.length * 8 - 8))
        ),
        y: Math.min(88, parent.y + (parent.kind === 'prerequisite' ? 16 : 20)),
        description:
          parent.kind === 'prerequisite'
            ? 'A finer concept under the parent idea.'
            : 'A concept this step depends on.',
        why: '',
        resources: []
      }

      const next = {
        ...prev,
        nodes: [...nodes, node],
        edges: [...prev.edges, { from: parentId, to: id }]
      }
      persistGraph(next)
      pathRef.current = next
      queueUserStateSave()
      return next
    })
    setSelectedId(id)
    replaceSearchParams({ node: id })
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
    if (!currentUserId) {
      requestSignIn()
      return
    }
    setBookmarkBusy(true)
    try {
      if (bookmarkLinkId) {
        const ok = await deleteLink(bookmarkLinkId)
        if (ok) {
          const pathUrl = normalizeUserLinkUrl(
            learningPathAbsoluteUrl(path.slug, window.location.origin)
          )
          setBookmarkLinkId(null)
          setSavedLinkByUrl((prev) => {
            const next = { ...prev }
            delete next[pathUrl]
            return next
          })
        } else window.alert('Could not remove this saved path.')
        return
      }
      const row = await addLink(
        learningPathAbsoluteUrl(path.slug, window.location.origin),
        { title: path.title || path.goal }
      )
      if (row) {
        setBookmarkLinkId(row.id)
        setSavedLinkByUrl((prev) => ({
          ...prev,
          [normalizeUserLinkUrl(row.url)]: row.id
        }))
      } else
        window.alert(
          'Could not save this path. It may already be in your list.'
        )
    } finally {
      setBookmarkBusy(false)
    }
  }

  async function setPathVisibilityChoice(next: LearningPathVisibility) {
    if (privacyBusy || !isOwnPath || next === pathVisibility) return
    if (!currentUserId) {
      requestSignIn()
      return
    }
    const publishingFromPrivate =
      pathVisibility === 'private' && isLearningPathPublishVisibility(next)
    let nextPath = path
    let nextUserResources = userResources
    if (publishingFromPrivate) {
      const check = checkLearningPathPublishResources(path, userResources)
      if (!check.ok) {
        setPublishModal({
          visibility: next,
          needsTopics: check.needsTopics,
          gaps: check.gaps
        })
        return
      }
      const promoted = promoteLearningPathOwnerResources(path, userResources)
      nextPath = promoted.path
      nextUserResources = promoted.userResources
    }
    setPrivacyBusy(true)
    try {
      if (publishingFromPrivate) {
        setPath(nextPath)
        pathRef.current = nextPath
        setUserResources(nextUserResources)
        resourcesRef.current = nextUserResources
      }
      let id = pathRowId
      if (!id || id.startsWith('path-') || publishingFromPrivate) {
        id = await upsertOwnedLearningPath(nextPath)
        if (id) setPathRowId(id)
      }
      if (!id) {
        window.alert('Could not update privacy. Try signing in again.')
        return
      }
      if (publishingFromPrivate) {
        await saveLearningPathUserState(
          id,
          slug,
          userStateFromPath(nextPath, notesRef.current, nextUserResources),
          currentUserId
        )
      }
      const ok = await setOwnedLearningPathVisibility(id, next, path.slug)
      if (ok) setPathVisibility(next)
      else window.alert('Could not update privacy.')
    } finally {
      setPrivacyBusy(false)
    }
  }

  function closeResourceForm() {
    setAddResourceOpen(false)
    setEditingResourceId(null)
    setResourceDraft(EMPTY_RESOURCE_DRAFT)
  }

  function openEditResource(resource: {
    id: string
    kind: LearningPathResourceKind
    title: string
    href?: string
    passage?: string
    why: string
    sequence: number
  }) {
    if (!currentUserId) {
      requestSignIn()
      return
    }
    setAddResourceOpen(false)
    setEditingResourceId(resource.id)
    setResourceDraft({
      title: resource.title,
      href: resource.href ?? '',
      kind: resource.kind,
      passage: resource.passage ?? '',
      why: resource.why,
      sequence: String(resource.sequence)
    })
    setOpenSections((prev) => ({ ...prev, resources: true }))
  }

  async function saveUserResource(event: React.FormEvent) {
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
        ? editingResourceId
          ? listedResources.find((row) => row.id === editingResourceId)
              ?.sequence ?? listedResources.length
          : listedResources.length + 1
        : rawPlacement
    if (canSuggestResources && !editingResourceId) {
      const created = await addLearningPathResourceSuggestion({
        pathId: pathRowId ?? path.slug,
        nodeId: selected.id,
        kind: resourceDraft.kind,
        title,
        href: href || undefined,
        passage,
        why: resourceDraft.why.trim(),
        sequence: placement
      })
      if (!created) {
        window.alert('Could not send this suggestion. Try signing in again.')
        return
      }
      setResourceSuggestions((prev) => [...prev, created])
      closeResourceForm()
      return
    }
    const item: Omit<LearningPathUserResource, 'sequence'> = {
      id: editingResourceId ?? newId('ur'),
      kind: resourceDraft.kind,
      title,
      href: href || undefined,
      passage,
      why: resourceDraft.why.trim()
    }
    setUserResources((prev) => {
      const current = prev[selected.id] ?? []
      const nextMine = editingResourceId
        ? updateLearningPathUserResource(
            selected.resources,
            current,
            editingResourceId,
            item,
            placement
          )
        : insertLearningPathUserResource(
            selected.resources,
            current,
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
    closeResourceForm()
  }

  async function acceptSuggestedResource(resource: LearningPathListedResource) {
    if (!isOwnPath || !selected || !resource.suggested) return
    const suggestion = resourceSuggestions.find((row) => row.id === resource.id)
    const placement = suggestion?.sequence ?? selected.resources.length + 1
    const official: LearningPathResource = {
      id: newId('r'),
      kind: resource.kind,
      title: resource.title,
      source: 'Community',
      href: resource.href,
      why:
        [resource.passage, resource.why].filter(Boolean).join(' — ') ||
        resource.why
    }
    setPath((prev) => {
      const next: LearningPathData = {
        ...prev,
        nodes: prev.nodes.map((node) =>
          node.id === selected.id
            ? {
                ...node,
                resources: insertLearningPathOfficialResource(
                  node.resources,
                  official,
                  placement
                )
              }
            : node
        )
      }
      persistGraph(next)
      pathRef.current = next
      return next
    })
    const ok = await respondToLearningPathResourceSuggestion(
      resource.id,
      pathRowId ?? path.slug,
      'accepted'
    )
    if (!ok) {
      window.alert('Could not accept this suggestion.')
      return
    }
    setResourceSuggestions((prev) =>
      prev.filter((row) => row.id !== resource.id)
    )
  }

  async function dismissSuggestedResource(
    resource: LearningPathListedResource
  ) {
    if (!resource.suggested) return
    const pathId = pathRowId ?? path.slug
    const ok = isOwnPath
      ? await respondToLearningPathResourceSuggestion(
          resource.id,
          pathId,
          'declined'
        )
      : await deleteLearningPathResourceSuggestion(resource.id, pathId)
    if (!ok) {
      window.alert('Could not remove this suggestion.')
      return
    }
    setResourceSuggestions((prev) =>
      prev.filter((row) => row.id !== resource.id)
    )
  }

  async function toggleResourceUpvote(resourceId: string) {
    if (!currentUserId) {
      requestSignIn()
      return
    }
    if (!canVoteOnResources) return
    const nodeId = selected?.id
    if (!nodeId) return
    let id = pathRowId
    if (!isLearningPathRowUuid(id)) {
      const record = await getLearningPathRecord(slug)
      id = record?.id ?? null
      if (isLearningPathRowUuid(id)) setPathRowId(id)
    }
    if (!isLearningPathRowUuid(id)) {
      window.alert(
        'Could not save your upvote. This path is not in the database yet.'
      )
      return
    }
    const key = learningPathResourceVoteKey(nodeId, resourceId)
    const current = resourceVotes[key] ?? { score: 0, userVoted: false }
    const nextVoted = !current.userVoted
    const optimistic: LearningPathResourceVoteSummary = {
      score: Math.max(0, current.score + (nextVoted ? 1 : -1)),
      userVoted: nextVoted
    }
    setVotingResourceId(resourceId)
    setResourceVotes((prev) => ({ ...prev, [key]: optimistic }))
    try {
      const score = await setLearningPathResourceUpvote(
        id,
        nodeId,
        resourceId,
        nextVoted
      )
      if (score == null) {
        setResourceVotes((prev) => ({ ...prev, [key]: current }))
        window.alert('Could not save your upvote. Try signing in again.')
        return
      }
      setResourceVotes((prev) => ({
        ...prev,
        [key]: { score, userVoted: nextVoted }
      }))
    } finally {
      setVotingResourceId(null)
    }
  }

  async function toggleResourceBookmark(resource: LearningPathListedResource) {
    if (!currentUserId) {
      requestSignIn()
      return
    }
    const nodeId = selected?.id
    if (!nodeId || bookmarkingResourceId) return
    const url = learningPathResourceBookmarkUrl({
      slug: path.slug,
      nodeId,
      resourceId: resource.id,
      href: resource.href,
      origin: window.location.origin
    })
    const key = normalizeUserLinkUrl(url)
    const existingId = savedLinkByUrl[key]
    setBookmarkingResourceId(resource.id)
    try {
      if (existingId) {
        const ok = await deleteLink(existingId)
        if (!ok) {
          window.alert('Could not remove this bookmark.')
          return
        }
        setSavedLinkByUrl((prev) => {
          const next = { ...prev }
          delete next[key]
          return next
        })
        return
      }
      const row = await addLink(url, { title: resource.title })
      if (!row) {
        window.alert('Could not bookmark this resource. Try signing in again.')
        return
      }
      setSavedLinkByUrl((prev) => ({
        ...prev,
        [normalizeUserLinkUrl(row.url)]: row.id
      }))
    } finally {
      setBookmarkingResourceId(null)
    }
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
    addPlacement === 'after' &&
    (editorNode.kind === 'goal' ||
      editorNode.kind === 'concept' ||
      editorNode.kind === 'milestone')

  const heroInstructors = isOwnPath
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
      <LearningPathRatingModal
        open={Boolean(topicRating)}
        badge='Topic complete'
        title={topicRating ? `You finished ${topicRating.title}` : ''}
        onSkip={() => {
          setTopicRating(null)
          if (pendingFinish) {
            setPendingFinish(false)
            setShowFinishedModal(true)
          }
        }}
        onSubmit={(rating, durationMs) => {
          if (topicRating) {
            void submitLearningPathRating({
              pathSlug: slug,
              pathId: pathRowId,
              targetType: 'topic',
              targetId: topicRating.id,
              targetTitle: topicRating.title,
              rating,
              durationMs
            })
          }
          setTopicRating(null)
          if (pendingFinish) {
            setPendingFinish(false)
            setShowFinishedModal(true)
          }
        }}
      />
      <LearningPathFinishedModal
        open={showFinishedModal}
        pathTitle={path.title}
        topics={learnedTopics}
        kindLabel='path'
        showRating={
          !hasLocalLearningPathRating(slug, 'path', LEARNING_PATH_RATING_TARGET)
        }
        onClose={() => setShowFinishedModal(false)}
        onSubmitRating={(rating, durationMs) => {
          void submitLearningPathRating({
            pathSlug: slug,
            pathId: pathRowId,
            targetType: 'path',
            targetId: LEARNING_PATH_RATING_TARGET,
            targetTitle: path.title,
            rating,
            durationMs
          })
        }}
        onSelectTopic={(id) => {
          setShowFinishedModal(false)
          selectNode(id)
        }}
      />
      <LearningPathPublishModal
        open={Boolean(publishModal)}
        intendedVisibility={publishModal?.visibility ?? 'public'}
        needsTopics={publishModal?.needsTopics ?? false}
        gaps={publishModal?.gaps ?? []}
        onClose={() => setPublishModal(null)}
        onSelectTopic={(gap) => {
          setPublishModal(null)
          selectNode(gap.id)
          setOpenSections({
            why: gap.missingWhy,
            resources: gap.needed > 0
          })
          if (gap.missingWhy) {
            const node = path.nodes.find((item) => item.id === gap.id)
            if (node) {
              setEditLabel(node.label)
              setEditDescription(node.description)
              setEditWhy(node.why)
              setEditOpen(true)
            }
          }
        }}
      />
      <div className={styles.hero}>
        <CourseHero
          courseCode={kicker}
          title={path.title}
          instructors={heroInstructors}
          descriptionHtml={pathDescriptionHtml(path.summary)}
          descriptionSlot={
            <LearningPathDescription
              value={isOwnPath ? summaryDraft : path.summary}
              editable={isOwnPath}
              onChange={setSummaryDraft}
              onSave={savePathSummary}
            />
          }
          schoolDate={formatHeroPublishedDate(
            path.createdAt,
            !isOwnPath &&
              (pathVisibility === 'public' ||
                pathVisibility === 'collaborative')
              ? { visibility: pathVisibility }
              : undefined
          )}
          reportTarget={{
            type: 'learning_path',
            id: pathRowId || path.slug,
            url: learningPathHref(path.slug),
            title: path.title
          }}
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
                <div
                  className={`${saveStyles.wrap} ${styles.visibilitySelect}`}
                >
                  <FormSelect<LearningPathVisibility>
                    ariaLabel='Learning path visibility'
                    value={pathVisibility}
                    options={VISIBILITY_OPTIONS}
                    disabled={privacyBusy}
                    onChange={(next) => void setPathVisibilityChoice(next)}
                  />
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
          <LearningPathOutlinePanel
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            search={outlineSearch}
            onSearchChange={setOutlineSearch}
            graphHint={learningPathOutlineHint(kind)}
            list={
              <>
                {outlineNoMatches ? (
                  <p className={styles.pathListEmpty}>No matching steps.</p>
                ) : null}
                {showRecommendedNav || showMentalMapNav ? (
                  <div className={styles.navPanelSection}>
                    {showMentalMapNav ? (
                      <PathSectionRow
                        label={LEARNING_PATH_MENTAL_MAP_LABEL}
                        selected={showingMentalMap}
                        onSelect={() =>
                          selectNode(LEARNING_PATH_MENTAL_MAP_SECTION_ID)
                        }
                      />
                    ) : null}
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
                {showKnowledgeNav ? (
                  <div className={styles.navPanelSection}>
                    <PathSectionRow
                      label='What you learned'
                      count={learnedTopics.length}
                      selected={showingKnowledge}
                      onSelect={() =>
                        selectNode(LEARNING_PATH_KNOWLEDGE_SECTION_ID)
                      }
                    />
                  </div>
                ) : null}
              </>
            }
            footer={
              canEditPathStructure ? (
                <PathStageActions
                  inline
                  onEdit={openEdit}
                  onAdd={addToPathFromSelection}
                  underLabel={editorNode.label}
                />
              ) : undefined
            }
            graph={
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
                    const isSelected = node.id === graphSelectedId
                    return (
                      <div
                        key={node.id}
                        className={
                          isSelected
                            ? `${styles.nodeAnchor} ${styles.nodeAnchorSelected}`
                            : styles.nodeAnchor
                        }
                        style={{ left: pos.x, top: pos.y }}
                      >
                        <button
                          type='button'
                          className={nodeClass(node, isSelected)}
                          aria-haspopup='menu'
                          aria-expanded={isSelected}
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
                          {node.sub && !isCannedPathSub(node.sub) ? (
                            <span className={styles.nodeSub}>{node.sub}</span>
                          ) : null}
                        </button>
                        {isSelected && canEditPathStructure ? (
                          <button
                            type='button'
                            className={`${styles.nodePlusBtn} ${styles.nodeAfterBtn}`}
                            data-no-pan=''
                            aria-label={`New after “${node.label}”`}
                            title={`New after “${node.label}”`}
                            onClick={(event) => {
                              event.stopPropagation()
                              addAfterSelected()
                            }}
                          >
                            <PlusIcon />
                          </button>
                        ) : null}
                        {isSelected && canEditPathStructure ? (
                          <PathStageActions
                            popout
                            onEdit={openEdit}
                            onAdd={addToPathFromSelection}
                            underLabel={node.label}
                          />
                        ) : null}
                      </div>
                    )
                  })}
                </GraphViewport>
              </div>
            }
          />

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

          <PathContentActivity
            className={styles.detail}
            contentClassName={styles.detailContent}
            contentRef={detailRef}
            style={
              viewMode === 'graph'
                ? {
                    flexBasis: graphDetailWidth,
                    width: graphDetailWidth,
                    maxWidth: 'none'
                  }
                : undefined
            }
            coursePageId={learningPathActivityPageId(slug)}
            courseTitle={path.title}
            courseUrl={learningPathHref(slug)}
            sectionId={selectedId}
            notesTopicTitle={
              showingRecommended
                ? 'Recommended Path'
                : showingMentalMap
                ? LEARNING_PATH_MENTAL_MAP_LABEL
                : showingKnowledge
                ? 'What you learned'
                : selected?.label ?? path.title
            }
            notesEditor={
              userStateReady ? (
                <SiteNotesEditor
                  key={`${slug}:${selectedId}:${currentUserId ?? 'anon'}`}
                  value={parseStoredNotebookNote(notes[selectedId])}
                  onChange={(doc) => persistSelectedNote(selectedId, doc)}
                  placeholder='Write notes for this topic…'
                  ariaLabel='Your notes'
                  expandTitle='Your Notes'
                  expandTopic={
                    showingRecommended
                      ? 'Recommended Path'
                      : showingMentalMap
                      ? LEARNING_PATH_MENTAL_MAP_LABEL
                      : showingKnowledge
                      ? 'What you learned'
                      : selected?.label
                  }
                  fillHeight
                  locked={!currentUserId}
                  lockedMessage='Sign in to add your notes'
                  onUnlock={() => requestSignIn('notes')}
                />
              ) : (
                <p className={styles.resourceEmpty}>Loading notes…</p>
              )
            }
            onActivityPosted={() => setActivityRefreshNonce((n) => n + 1)}
            onExportContext={() =>
              formatLearningPathExportContext({
                path,
                selectedId
              })
            }
          >
            {showingRecommended ? (
              <LearningPathRecommendedOverview
                steps={coreSteps}
                marks={marks}
                onSelect={selectNode}
              />
            ) : showingKnowledge ? (
              <LearningPathLearnedPanel
                pathTitle={path.title}
                topics={learnedTopics}
                onSelectTopic={selectNode}
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
                      (showingMentalMap
                        ? path.summary
                        : selected.description) ||
                      'A reason has not been written for this step yet.'}
                  </p>
                </PathContentSection>

                <PathContentSection
                  title='Resources'
                  icon={<ResourcesIcon />}
                  open={openSections.resources}
                  onToggle={() =>
                    setOpenSections((prev) => ({
                      ...prev,
                      resources: !prev.resources
                    }))
                  }
                  extra={
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
                          !currentUserId
                            ? ` ${styles.addResourceBtnDisabled}`
                            : ''
                        }`}
                        aria-disabled={!currentUserId}
                        title={
                          currentUserId
                            ? undefined
                            : canSuggestResources
                            ? 'Sign in to suggest a resource'
                            : 'Sign in to add a resource'
                        }
                        onClick={() => {
                          if (!currentUserId) {
                            requestSignIn()
                            return
                          }
                          setEditingResourceId(null)
                          setResourceDraft(EMPTY_RESOURCE_DRAFT)
                          setAddResourceOpen(true)
                          setOpenSections((prev) => ({
                            ...prev,
                            resources: true
                          }))
                        }}
                      >
                        {canSuggestResources
                          ? '+ Suggest a resource'
                          : '+ Add a resource'}
                      </button>
                    </>
                  }
                >
                  {listedResources.length === 0 ? (
                    <p className={styles.resourceEmpty}>
                      {canSuggestResources
                        ? 'Nothing here yet. Suggest a resource for the owner to review.'
                        : 'Nothing here yet. When something makes this click, add it in the order you would study it.'}
                    </p>
                  ) : (
                    <ol className={styles.resourceList}>
                      {listedResources.map((resource) => {
                        const kindLabel = resource.source
                          ? `${resource.kind} · ${resource.source}`
                          : resource.kind
                        const vote = selected
                          ? resourceVotes[
                              learningPathResourceVoteKey(
                                selected.id,
                                resource.id
                              )
                            ]
                          : undefined
                        const voteScore = vote?.score ?? 0
                        const userVoted = Boolean(vote?.userVoted)
                        const bookmarkUrl = learningPathResourceBookmarkUrl({
                          slug: path.slug,
                          nodeId: selected.id,
                          resourceId: resource.id,
                          href: resource.href,
                          origin:
                            typeof window === 'undefined'
                              ? ''
                              : window.location.origin
                        })
                        const bookmarkSaved = Boolean(
                          savedLinkByUrl[normalizeUserLinkUrl(bookmarkUrl)]
                        )
                        const title = resource.href ? (
                          <a
                            className={styles.resourceTitle}
                            href={resource.href}
                            target='_blank'
                            rel='noopener noreferrer'
                          >
                            {resource.title}
                          </a>
                        ) : (
                          <p className={styles.resourceTitle}>
                            {resource.title}
                          </p>
                        )
                        return (
                          <li key={resource.id}>
                            <div
                              className={`${
                                styles.resource
                              } ${reportHoverTargetClass}${
                                editingResourceId === resource.id
                                  ? ` ${styles.resourceEditing}`
                                  : ''
                              }${
                                resource.suggested
                                  ? ` ${styles.resourceSuggested}`
                                  : ''
                              }`}
                            >
                              <span className={styles.resourcePos}>
                                {resource.sequence}
                              </span>
                              <div className={styles.resourceBody}>
                                <div className={styles.resourceMetaRow}>
                                  <p className={styles.resourceKind}>
                                    {kindLabel}
                                  </p>
                                  <div className={styles.resourceMetaActions}>
                                    {resource.suggested ? (
                                      <span className={styles.resourceYou}>
                                        {resource.suggestedByYou
                                          ? 'Suggested by you'
                                          : 'Suggested'}
                                      </span>
                                    ) : resource.addedByYou ? (
                                      <span className={styles.resourceYou}>
                                        Added by you
                                      </span>
                                    ) : null}
                                    {resource.suggested && isOwnPath ? (
                                      <button
                                        type='button'
                                        className={styles.resourceAcceptBtn}
                                        onClick={() =>
                                          void acceptSuggestedResource(resource)
                                        }
                                      >
                                        Add
                                      </button>
                                    ) : null}
                                    {resource.suggested &&
                                    (isOwnPath || resource.suggestedByYou) ? (
                                      <button
                                        type='button'
                                        className={styles.resourceDismissBtn}
                                        onClick={() =>
                                          void dismissSuggestedResource(
                                            resource
                                          )
                                        }
                                      >
                                        {isOwnPath ? 'Dismiss' : 'Withdraw'}
                                      </button>
                                    ) : null}
                                    {canVoteOnResources &&
                                    !resource.suggested ? (
                                      <ResourceVoteControl
                                        score={voteScore}
                                        userVoted={userVoted}
                                        disabled={
                                          votingResourceId === resource.id
                                        }
                                        signedIn={Boolean(currentUserId)}
                                        onToggle={() =>
                                          void toggleResourceUpvote(resource.id)
                                        }
                                      />
                                    ) : null}
                                    <ResourceBookmarkControl
                                      saved={bookmarkSaved}
                                      disabled={
                                        bookmarkingResourceId === resource.id
                                      }
                                      signedIn={Boolean(currentUserId)}
                                      onToggle={() =>
                                        void toggleResourceBookmark(resource)
                                      }
                                    />
                                    <ReportButton
                                      target={{
                                        type: 'resource',
                                        id: pathResourceReportId({
                                          slug: path.slug,
                                          nodeId: selected.id,
                                          resourceId: resource.id
                                        }),
                                        url: learningPathHref(path.slug),
                                        title: resource.title,
                                        snippet:
                                          resource.why || resource.passage
                                      }}
                                    />
                                    {resource.addedByYou ? (
                                      <button
                                        type='button'
                                        className={styles.resourceEditBtn}
                                        onClick={() =>
                                          openEditResource(resource)
                                        }
                                        aria-label='Edit'
                                      >
                                        <ResourceEditPencilIcon />
                                      </button>
                                    ) : null}
                                  </div>
                                </div>
                                {title}
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
                            </div>
                          </li>
                        )
                      })}
                    </ol>
                  )}
                </PathContentSection>

                {selected.kind !== 'goal' || nextNode ? (
                  <div className={styles.actionRow}>
                    {selected.kind !== 'goal' ? (
                      <button
                        type='button'
                        className={`${styles.primaryBtn}${
                          selected.status === 'explored'
                            ? ` ${styles.exploredBtn}`
                            : ''
                        }`}
                        onClick={toggleExplored}
                      >
                        {selected.status === 'explored' ? (
                          <span className={styles.exploredLabel}>
                            <span className={styles.exploredIdle}>
                              Explored
                            </span>
                            <span className={styles.exploredHover}>
                              Mark unexplored
                            </span>
                          </span>
                        ) : (
                          'Mark as explored'
                        )}
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
          </PathContentActivity>
        </div>
      </div>

      <div className={styles.activitySection}>
        <CourseActivity
          coursePageId={learningPathActivityPageId(slug)}
          courseTitle={path.title}
          courseUrl={learningPathHref(slug)}
          activityRefreshNonce={activityRefreshNonce}
        />
      </div>

      {resourceFormOpen ? (
        <div
          className={styles.backdrop}
          role='presentation'
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeResourceForm()
          }}
        >
          <div
            className={`${styles.modal} ${styles.modalResource}`}
            role='dialog'
            aria-modal='true'
            aria-labelledby='resource-form-title'
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h2 id='resource-form-title' className={styles.modalTitle}>
                {editingResourceId ? 'Edit resource' : 'Add a resource'}
              </h2>
              <button
                type='button'
                className={styles.modalClose}
                onClick={closeResourceForm}
                aria-label='Close'
              >
                ×
              </button>
            </div>
            <form className={styles.modalForm} onSubmit={saveUserResource}>
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
                  autoFocus
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
              <div className={styles.modalLabel}>
                <span id='resource-type-label'>Type</span>
                <FormSelect<LearningPathResourceKind>
                  labelledBy='resource-type-label'
                  value={resourceDraft.kind}
                  options={RESOURCE_KIND_OPTIONS}
                  onChange={(kind) =>
                    setResourceDraft((prev) => ({
                      ...prev,
                      kind
                    }))
                  }
                />
              </div>
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
                  className={styles.modalTextarea}
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
                      : editingResourceId
                      ? ` · current ${
                          listedResources.find(
                            (row) => row.id === editingResourceId
                          )?.sequence ?? ''
                        }`
                      : ` · blank = end (${resourcePlacementMax})`}
                  </span>
                </span>
              </label>
              <div className={styles.modalActions}>
                <button
                  type='button'
                  className={styles.modalCancel}
                  onClick={closeResourceForm}
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  className={styles.modalSubmit}
                  disabled={
                    !resourceDraft.title.trim() || !resourceDraft.passage.trim()
                  }
                >
                  {editingResourceId
                    ? 'Save changes'
                    : canSuggestResources
                    ? 'Suggest resource'
                    : 'Save resource'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {addOpen && canEditPathStructure ? (
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
              <p className={styles.placementHint}>
                {addPlacement === 'after'
                  ? `New after “${editorNode.label}”`
                  : `New node under “${editorNode.label}”`}
              </p>
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

      {editOpen && canEditPathStructure ? (
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

      {deleteOpen &&
      canEditPathStructure &&
      selected &&
      selected.kind !== 'goal' ? (
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

export function LearningPath({ slug }: { slug: string }) {
  const seeded = SEEDED_LEARNING_PATHS_BY_SLUG[slug]
  const [kind, setKind] = React.useState<LearningPathKind | null>(
    seeded ? 'community' : null
  )

  React.useEffect(() => {
    if (seeded) {
      setKind('community')
      return
    }
    let cancelled = false
    void (async () => {
      const record = await getLearningPathRecord(slug)
      if (cancelled) return
      if (
        record?.kind === 'course' ||
        isCourseLearningPathPayload(record?.data as unknown)
      ) {
        setKind('course')
        return
      }
      if (record) {
        setKind(parseLearningPathKind(record.kind))
        return
      }
      const course = await getCourseLearningPathData(slug)
      if (cancelled) return
      if (course || slug === DEFAULT_COURSE_LEARNING_PATH_SLUG) {
        setKind('course')
        return
      }
      setKind('community')
    })()
    return () => {
      cancelled = true
    }
  }, [slug, seeded])

  if (!kind) {
    return <div style={{ padding: '48px var(--home-side)' }}>Loading…</div>
  }

  const kicker = learningPathKicker(kind)
  if (kind === 'course') {
    return <CourseLearningPath key={slug} slug={slug} kicker={kicker} />
  }
  return (
    <CommunityLearningPath key={slug} slug={slug} kicker={kicker} kind={kind} />
  )
}
