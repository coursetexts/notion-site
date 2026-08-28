import * as React from 'react'

import {
  type LearningPathData,
  type LearningPathNode,
  type LearningPathNodeStatus,
  type LearningPathResourceKind,
  type LearningPathUserResource,
  emptyLearningPath,
  readStoredLearningPaths,
  resolveLearningPath,
  sequenceMarks
} from '@/lib/learning-path-seed'
import {
  getLearningPathRecord,
  loadLearningPathUserState,
  overlayUserState,
  saveLearningPathUserState,
  upsertOwnedLearningPath,
  userStateFromPath,
  writeLocalUserState
} from '@/lib/learning-path-db'
import {
  edgePath,
  layoutHoverGraph,
  visibleTree,
  type PathTreeItem
} from '@/lib/learning-path-graph-layout'

import styles from './LearningPath.module.css'

type DepthFilter = 'all' | 'core' | 'unfinished' | 'branch'

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
  why: ''
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

function ancestorIds(path: LearningPathData, nodeId: string): string[] {
  const parentOf = new Map<string, string>()
  for (const edge of path.edges) {
    if (!parentOf.has(edge.to)) parentOf.set(edge.to, edge.from)
  }
  const chain: string[] = []
  const seen = new Set<string>()
  let current = parentOf.get(nodeId)
  while (current && !seen.has(current)) {
    seen.add(current)
    chain.push(current)
    current = parentOf.get(current)
  }
  return chain
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

function currentBranchIds(path: LearningPathData, selectedId: string): Set<string> {
  const ids = new Set<string>([selectedId])
  for (const id of ancestorIds(path, selectedId)) ids.add(id)
  for (const edge of path.edges) {
    if (edge.from === selectedId) ids.add(edge.to)
  }
  return ids
}

function visibleNodes(
  path: LearningPathData,
  depth: DepthFilter,
  selectedId?: string | null
) {
  return path.nodes.filter((node) => {
    if (depth === 'core') return node.kind !== 'prerequisite'
    if (depth === 'unfinished') return node.status !== 'explored'
    if (depth === 'branch') {
      const focusId = selectedId || path.nodes[0]?.id
      if (!focusId) return true
      return currentBranchIds(path, focusId).has(node.id)
    }
    return true
  })
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

function tutorPrompt(path: LearningPathData, node: LearningPathNode) {
  const prior = ancestorIds(path, node.id)
    .map((id) => path.nodes.find((item) => item.id === id))
    .filter(
      (item): item is LearningPathNode => !!item && item.kind !== 'goal'
    )
    .reverse()
  const familiar =
    prior.length > 0
      ? ` So far I am familiar with ${prior
          .map((item) => `“${item.label}”`)
          .join(' and ')} and this is my next learning goal.`
      : ''
  return `Goal: ${path.goal}\n\nExplain “${node.label}” only as deeply as I need to reach that goal. Assume I am starting this concept from scratch. Show me one example, then one thing I should try myself.${familiar}`
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
    <svg width='13' height='13' viewBox='0 0 13 13' fill='none' aria-hidden>
      <circle cx='10' cy='2.75' r='1.6' stroke='currentColor' strokeWidth='1.2' />
      <circle cx='3' cy='6.5' r='1.6' stroke='currentColor' strokeWidth='1.2' />
      <circle cx='10' cy='10.25' r='1.6' stroke='currentColor' strokeWidth='1.2' />
      <path
        d='M4.4 5.7L8.5 3.5M4.4 7.3L8.5 9.5'
        stroke='currentColor'
        strokeWidth='1.2'
      />
    </svg>
  )
}

function initialSelection(path: LearningPathData) {
  const marks = sequenceMarks(path)
  const nextCore = path.nodes
    .filter(
      (node) => marks[node.id]?.role === 'core' && node.status !== 'explored'
    )
    .sort(
      (a, b) => Number(marks[a.id].mark) - Number(marks[b.id].mark)
    )[0]
  return (
    nextCore?.id ??
    path.nodes.find((node) => node.status === 'exploring')?.id ??
    path.nodes[0]?.id
  )
}

function PathLegend() {
  return (
    <div className={styles.legend}>
      <span>
        <i className={`${styles.legendDot} ${styles.legendExplored}`} /> Explored
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

const CLOSED_SECTIONS = {
  why: false,
  helped: false,
  resources: false,
  note: false
}

function DetailToggle({
  title,
  open,
  onToggle,
  extra,
  children
}: {
  title: string
  open: boolean
  onToggle: () => void
  extra?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className={styles.block}>
      <div className={styles.blockTitleRow}>
        <button
          type='button'
          className={styles.blockToggle}
          aria-expanded={open}
          onClick={onToggle}
        >
          <span className={styles.blockTitle}>{title}</span>
          <span className={styles.blockChevron} aria-hidden />
        </button>
        {open ? extra : null}
      </div>
      {open ? <div className={styles.blockBody}>{children}</div> : null}
    </div>
  )
}

export function LearningPath({ slug }: { slug: string }) {
  const [path, setPath] = React.useState<LearningPathData>(() =>
    resolveLearningPath(slug)
  )
  const [selectedId, setSelectedId] = React.useState(() =>
    initialSelection(resolveLearningPath(slug))
  )
  const [notes, setNotes] = React.useState<Record<string, string>>({})
  const [userResources, setUserResources] = React.useState<
    Record<string, LearningPathUserResource[]>
  >({})
  const [depth, setDepth] = React.useState<DepthFilter>('all')
  const [viewMode, setViewMode] = React.useState<'graph' | 'list'>('graph')
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
  const [promptOpen, setPromptOpen] = React.useState(false)
  const [circleOpen, setCircleOpen] = React.useState(false)
  const [addResourceOpen, setAddResourceOpen] = React.useState(false)
  const [openSections, setOpenSections] = React.useState(CLOSED_SECTIONS)
  const [resourceDraft, setResourceDraft] = React.useState(EMPTY_RESOURCE_DRAFT)
  const [shareCopied, setShareCopied] = React.useState(false)
  const [pathRowId, setPathRowId] = React.useState<string | null>(null)
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

  function flushUserState() {
    if (stateTimer.current) {
      clearTimeout(stateTimer.current)
      stateTimer.current = null
    }
    void saveLearningPathUserState(
      pathRowIdRef.current,
      slug,
      userStateFromPath(
        pathRef.current,
        notesRef.current,
        resourcesRef.current
      )
    )
  }

  React.useEffect(() => {
    let cancelled = false
    const local = resolveLearningPath(slug, readStoredLearningPaths())
    setPath(local)
    setSelectedId(initialSelection(local))
    setHoverId(null)
    setPathRowId(null)
    setPromptOpen(false)
    setCircleOpen(false)
    setAddResourceOpen(false)
    setOpenSections(CLOSED_SECTIONS)
    setResourceDraft(EMPTY_RESOURCE_DRAFT)
    setShareCopied(false)
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
      setNotes(state.notes)
      setUserResources(state.resources)
      setSelectedId(initialSelection(next))
    })()

    return () => {
      cancelled = true
    }
  }, [slug])

  React.useEffect(() => {
    return () => {
      if (shareTimer.current) clearTimeout(shareTimer.current)
      flushUserState()
    }
  }, [slug])

  const nodes = React.useMemo(
    () => visibleNodes(path, depth, selectedId),
    [path, depth, selectedId]
  )
  const tree = React.useMemo(() => visibleTree(path, nodes), [path, nodes])
  const nodeById = React.useMemo(
    () => Object.fromEntries(path.nodes.map((node) => [node.id, node])),
    [path.nodes]
  )
  const marks = React.useMemo(() => sequenceMarks(path), [path])
  const selected =
    (selectedId ? nodeById[selectedId] : null) ?? nodes[0] ?? path.nodes[0]
  const visibleIds = React.useMemo(
    () => new Set(nodes.map((node) => node.id)),
    [nodes]
  )
  const graphFocusId = hoverId ?? selected?.id ?? path.nodes[0]?.id ?? ''
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
  const exploredCount = path.nodes.filter(
    (node) => node.status === 'explored'
  ).length
  const myResources = selected ? userResources[selected.id] ?? [] : []
  const nestedToDelete =
    selected && selected.kind !== 'goal'
      ? descendantIds(path, selected.id)
      : []
  const nextNode = selected
    ? nextOutlineNode(path, selected.id)
    : null

  function selectNode(id: string) {
    setSelectedId(id)
    setPromptOpen(false)
    setAddResourceOpen(false)
    setResourceDraft(EMPTY_RESOURCE_DRAFT)
  }

  function openAdd(placement: 'step' | 'child') {
    setAddPlacement(placement)
    setAddLabel('')
    setAddOpen(true)
  }

  function openEdit() {
    if (!selected) return
    setEditLabel(selected.label)
    setEditDescription(selected.description)
    setEditWhy(selected.why)
    setEditOpen(true)
  }

  function saveEdit(event: React.FormEvent) {
    event.preventDefault()
    const label = editLabel.trim()
    if (!label || !selected) return
    setPath((prev) => {
      const next: LearningPathData = {
        ...prev,
        title: selected.kind === 'goal' ? label : prev.title,
        goal:
          selected.kind === 'goal'
            ? /^i want to\s+/i.test(label)
              ? label
              : `I want to ${label}`
            : prev.goal,
        nodes: prev.nodes.map((node) =>
          node.id === selected.id
            ? {
                ...node,
                label,
                description: editDescription.trim(),
                why: editWhy.trim()
              }
            : node
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
    const fallback = selectedParent?.id ?? 'goal'
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
    if (!label || !selected) return
    const id = newId('n')
    const asStep = addPlacement === 'step' || selected.kind === 'goal'

    setPath((prev) => {
      const core = prev.nodes.filter(
        (item) => item.kind === 'concept' || item.kind === 'milestone'
      )
      const lastCore = [...core].sort(
        (a, b) => (a.sequence ?? 0) - (b.sequence ?? 0)
      )[core.length - 1]
      const parentId = asStep
        ? lastCore?.id ?? 'goal'
        : selected.id
      const parent =
        prev.nodes.find((item) => item.id === parentId) ?? selected
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
            x: Math.min(
              88,
              Math.max(12, parent.x + siblings.length * 8 - 8)
            ),
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

  function addUserResource(event: React.FormEvent) {
    event.preventDefault()
    if (!selected) return
    const title = resourceDraft.title.trim()
    const passage = resourceDraft.passage.trim()
    if (!title || !passage) return
    const href = resourceDraft.href.trim()
    const item: LearningPathUserResource = {
      id: newId('ur'),
      kind: resourceDraft.kind,
      title,
      href: href || undefined,
      passage,
      why: resourceDraft.why.trim()
    }
    setUserResources((prev) => {
      const next = {
        ...prev,
        [selected.id]: [item, ...(prev[selected.id] ?? [])]
      }
      resourcesRef.current = next
      queueUserStateSave()
      return next
    })
    setResourceDraft(EMPTY_RESOURCE_DRAFT)
    setAddResourceOpen(false)
  }

  if (!selected) {
    const empty = emptyLearningPath(path.goal, path.slug)
    return (
      <section className={styles.section}>
        <div className={styles.container}>
          <h1 className={styles.title}>{empty.title}</h1>
        </div>
      </section>
    )
  }

  return (
    <section className={styles.section} aria-label='Learning path'>
      <div className={styles.container}>
        <p className={styles.eyebrow}>Learning path</p>
        <div className={styles.headerRow}>
          <div>
            <h1 className={styles.title}>{path.title}</h1>
            <p className={styles.summary}>{path.summary}</p>
          </div>
        </div>
      </div>

      <div className={styles.body}>
        <div className={styles.container}>
        <p className={styles.intention}>“{path.goal}”</p>
        <div className={styles.metaRow}>
          <span className={styles.meta}>
            <strong>
              {exploredCount} of {path.nodes.length}
            </strong>{' '}
            concepts explored
          </span>
          <div className={styles.metaTools}>
            <label className={styles.depth}>
              Depth
              <select
                className={styles.depthSelect}
                value={depth}
                aria-label='How much of the map to show'
                onChange={(event) =>
                  setDepth(event.target.value as DepthFilter)
                }
              >
                <option value='all'>All connections</option>
                <option value='core'>Core path</option>
                <option value='branch'>Current children path</option>
                <option value='unfinished'>Only unfinished</option>
              </select>
            </label>
            <button
              type='button'
              className={
                shareCopied
                  ? `${styles.shareBtn} ${styles.shareBtnCopied}`
                  : styles.shareBtn
              }
              onClick={() => void copyShareUrl()}
              aria-label={
                shareCopied
                  ? 'Link copied to clipboard'
                  : 'Copy link to this learning path'
              }
            >
              <ShareIcon />
              <span aria-live='polite'>
                {shareCopied ? 'Copied' : 'Share'}
              </span>
            </button>
          </div>
        </div>

        <div className={styles.layout}>
          <section className={styles.mapPanel}>
            <div className={styles.mapToolbar}>
              <div className={styles.mapToolbarCopy}>
                <h2 className={styles.mapTitle}>
                  {viewMode === 'list' ? 'The outline' : 'The map'}
                </h2>
                <span className={styles.mapHint}>
                  {viewMode === 'list'
                    ? 'Select a step to read it on the right'
                    : 'Hover a step to see its children · click a node to read it'}
                </span>
              </div>
              <div className={styles.viewToggle} role='group' aria-label='Path view'>
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
              <div className={styles.pathListWrap}>
                <div className={styles.pathListScroll}>
                  {tree.length === 0 ? (
                    <p className={styles.pathListEmpty}>
                      Nothing on this depth yet.
                    </p>
                  ) : (
                    <PathOutlineList
                      items={tree}
                      marks={marks}
                      selectedId={selected.id}
                      onSelect={selectNode}
                    />
                  )}
                </div>
                <div className={styles.pathListFooter}>
                  <PathLegend />
                  <button
                    type='button'
                    className={`${styles.addNode} ${styles.addNodeInline}`}
                    onClick={() =>
                      openAdd(selected.kind === 'goal' ? 'step' : 'child')
                    }
                  >
                    <PlusIcon /> Add to path
                  </button>
                </div>
              </div>
            ) : (
              <div
                className={styles.mapStage}
                onMouseLeave={() => setHoverId(null)}
              >
                <div className={styles.mapScroll}>
                  <div
                    className={styles.canvas}
                    style={{
                      minHeight: layout.height,
                      minWidth: layout.width,
                      height: layout.height,
                      width: layout.width
                    }}
                  >
                    <svg
                      className={styles.connections}
                      viewBox={`0 0 ${layout.width} ${layout.height}`}
                      preserveAspectRatio='none'
                      aria-hidden
                      style={{ inset: 0, width: '100%', height: '100%' }}
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
                          className={nodeClass(node, node.id === selected.id)}
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
                          onClick={() => selectNode(node.id)}
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
                            <span className={styles.nodeLabel}>{node.label}</span>
                          </span>
                          <span className={styles.nodeSub}>{node.sub}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
                <button
                  type='button'
                  className={styles.addNode}
                  onClick={() =>
                    openAdd(selected.kind === 'goal' ? 'step' : 'child')
                  }
                >
                  <PlusIcon /> Add to path
                </button>
                <PathLegend />
              </div>
            )}
          </section>

          <aside className={styles.detail} aria-live='polite'>
            <div className={styles.detailHead}>
              <div className={styles.detailKicker}>
                <span>
                  {selectedMark
                    ? selectedMark.role === 'core'
                      ? `Core path · ${selectedMark.mark}`
                      : `Under ${selectedParent?.label ?? 'this step'} · ${selectedMark.mark})`
                    : selected.kind}
                </span>
                {selected.status === 'explored' ? (
                  <span className={styles.detailStatus}>Explored</span>
                ) : null}
              </div>
              <h2 className={styles.detailTitle}>{selected.label}</h2>
              <p className={styles.detailBody}>{selected.description}</p>
            </div>

            <DetailToggle
              title='Why it is on your path'
              open={openSections.why}
              onToggle={() =>
                setOpenSections((prev) => ({ ...prev, why: !prev.why }))
              }
            >
              <p className={styles.blockCopy}>{selected.why}</p>
            </DetailToggle>

            <DetailToggle
              title='What helped other people'
              open={openSections.helped}
              onToggle={() =>
                setOpenSections((prev) => ({ ...prev, helped: !prev.helped }))
              }
            >
              {selected.resources.length === 0 ? (
                <p className={styles.blockCopy}>
                  No traces here yet. When something makes this click — a
                  chapter, a timestamp, an exercise — it belongs on this
                  concept.
                </p>
              ) : (
                <ul className={styles.resourceList}>
                  {selected.resources.map((resource) => {
                    const inner = (
                      <>
                        <p className={styles.resourceKind}>
                          {resource.kind} · {resource.source}
                        </p>
                        <p className={styles.resourceTitle}>
                          {resource.title}
                        </p>
                        <p className={styles.resourceWhy}>{resource.why}</p>
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
                </ul>
              )}
            </DetailToggle>

            <DetailToggle
              title='Your resources'
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
                  <button
                    type='button'
                    className={styles.addResourceBtn}
                    onClick={() => setAddResourceOpen(true)}
                  >
                    + Add a resource
                  </button>
                ) : null
              }
            >
              <p className={styles.blockCopy}>
                Bookmark the exact part that made this click — a chapter,
                timestamp, diagram, or exercise.
              </p>
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
              {myResources.length === 0 && !addResourceOpen ? (
                <p className={styles.resourceEmpty}>
                  Nothing saved here yet.
                </p>
              ) : (
                <ul className={styles.resourceList}>
                  {myResources.map((resource) => {
                    const inner = (
                      <>
                        <p className={styles.resourceKind}>{resource.kind}</p>
                        <p className={styles.resourceTitle}>
                          {resource.title}
                        </p>
                        <p className={styles.resourcePassage}>
                          {resource.passage}
                        </p>
                        {resource.why ? (
                          <p className={styles.resourceWhy}>{resource.why}</p>
                        ) : null}
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
                </ul>
              )}
            </DetailToggle>

            <DetailToggle
              title='Your note'
              open={openSections.note}
              onToggle={() =>
                setOpenSections((prev) => ({ ...prev, note: !prev.note }))
              }
            >
              <textarea
                className={styles.note}
                rows={4}
                value={notes[selected.id] ?? ''}
                onChange={(event) => {
                  const value = event.target.value
                  setNotes((prev) => {
                    const next = { ...prev, [selected.id]: value }
                    notesRef.current = next
                    queueUserStateSave()
                    return next
                  })
                }}
                placeholder='What do you understand now? What is still fuzzy?'
              />
            </DetailToggle>

            <div className={styles.actions}>
              <button
                type='button'
                className={styles.ghostBtn}
                onClick={openEdit}
              >
                Edit this node
              </button>
              <button
                type='button'
                className={styles.ghostBtn}
                onClick={() =>
                  openAdd(selected.kind === 'goal' ? 'step' : 'child')
                }
              >
                {selected.kind === 'goal'
                  ? 'Add a step'
                  : selected.kind === 'prerequisite'
                    ? 'Add a sub-concept'
                    : 'Add a concept here'}
              </button>
              <button
                type='button'
                className={styles.ghostBtn}
                onClick={() => setPromptOpen((open) => !open)}
              >
                {promptOpen ? 'Hide tutor prompt' : 'Ask for an explanation'}
              </button>
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
                      onClick={() => selectNode(nextNode.id)}
                    >
                      Next
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
            {promptOpen ? (
              <pre className={styles.prompt}>{tutorPrompt(path, selected)}</pre>
            ) : null}
          </aside>
        </div>

        <section className={styles.circleCard} aria-label='Study circle'>
          <div className={styles.circleCopy}>
            <p className={styles.circleEyebrow}>Study circle</p>
            <h2 className={styles.circleTitle}>{path.circle.name}</h2>
            <p className={styles.circleBody}>{path.circle.description}</p>
            <button
              type='button'
              className={styles.circleLink}
              onClick={() => setCircleOpen(true)}
            >
              {path.circle.members.length > 0
                ? 'View circle'
                : 'Start a circle'}
            </button>
          </div>
          {path.circle.members.length > 0 ? (
            <div className={styles.avatars} aria-hidden>
              {path.circle.members.slice(0, 3).map((member) => (
                <span key={member.initials} className={styles.avatar}>
                  {member.initials}
                </span>
              ))}
              {path.circle.members.length > 3 ? (
                <span className={styles.avatarMore}>
                  +{path.circle.members.length - 3}
                </span>
              ) : null}
            </div>
          ) : null}
        </section>
        </div>
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
              {selected.kind !== 'goal' ? (
                <fieldset className={styles.placement}>
                  <legend className={styles.placementLegend}>Where</legend>
                  <label className={styles.placementOption}>
                    <input
                      type='radio'
                      name='add-placement'
                      checked={addPlacement === 'child'}
                      onChange={() => setAddPlacement('child')}
                    />
                    Under “{selected.label}”
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
                {addPlacement === 'step' || selected.kind === 'goal'
                  ? 'Step title'
                  : selected.kind === 'prerequisite'
                    ? 'Sub-concept'
                    : 'Concept'}
                <input
                  className={styles.modalInput}
                  value={addLabel}
                  onChange={(event) => setAddLabel(event.target.value)}
                  placeholder={
                    addPlacement === 'step' || selected.kind === 'goal'
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
                {selected.kind === 'goal'
                  ? 'Goal'
                  : selected.kind === 'milestone'
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
                {selected.kind !== 'goal' ? (
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

      {deleteOpen && selected.kind !== 'goal' ? (
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

      {circleOpen ? (
        <div
          className={styles.backdrop}
          role='presentation'
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setCircleOpen(false)
          }}
        >
          <div
            className={styles.modal}
            role='dialog'
            aria-modal='true'
            aria-labelledby='study-circle-title'
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h2 id='study-circle-title' className={styles.modalTitle}>
                {path.circle.name}
              </h2>
              <button
                type='button'
                className={styles.modalClose}
                onClick={() => setCircleOpen(false)}
                aria-label='Close'
              >
                ×
              </button>
            </div>
            <div className={styles.circleModalBody}>
              <p className={styles.circleBody}>{path.circle.description}</p>
              {path.circle.members.length > 0 ? (
                <ul className={styles.memberList}>
                  {path.circle.members.map((member) => (
                    <li key={member.initials} className={styles.memberRow}>
                      <span className={styles.avatar}>{member.initials}</span>
                      <span className={styles.memberName}>{member.name}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={styles.circleBody}>
                  No one else is on this path yet. Leave traces as you learn,
                  and this is where they would gather.
                </p>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
