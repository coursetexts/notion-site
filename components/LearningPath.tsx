import * as React from 'react'
import Link from 'next/link'

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

import styles from './LearningPath.module.css'

type DepthFilter = 'all' | 'core' | 'unfinished'

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

function visibleNodes(path: LearningPathData, depth: DepthFilter) {
  return path.nodes.filter((node) => {
    if (depth === 'core') return node.kind !== 'prerequisite'
    if (depth === 'unfinished') return node.status !== 'explored'
    return true
  })
}

function edgePath(
  from: LearningPathNode,
  to: LearningPathNode
): string {
  const midY = (from.y + to.y) / 2
  return `M${from.x} ${from.y} C${from.x} ${midY} ${to.x} ${midY} ${to.x} ${to.y}`
}

function tutorPrompt(path: LearningPathData, node: LearningPathNode) {
  const known = path.nodes
    .filter((item) => item.status === 'explored' && item.id !== node.id)
    .map((item) => item.label)
  const knownLine =
    known.length > 0
      ? `Assume I already understand: ${known.join(', ')}.`
      : 'Assume I am starting this concept from scratch.'
  return `Goal: ${path.goal}\n\nExplain “${node.label}” only as deeply as I need to reach that goal. ${knownLine} Show me one example, then one thing I should try myself.`
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
  const [addOpen, setAddOpen] = React.useState(false)
  const [addLabel, setAddLabel] = React.useState('')
  const [promptOpen, setPromptOpen] = React.useState(false)
  const [circleOpen, setCircleOpen] = React.useState(false)
  const [addResourceOpen, setAddResourceOpen] = React.useState(false)
  const [resourceDraft, setResourceDraft] = React.useState(EMPTY_RESOURCE_DRAFT)
  const [shareCopied, setShareCopied] = React.useState(false)
  const shareTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  React.useEffect(() => {
    const next = resolveLearningPath(slug, readStoredLearningPaths())
    setPath(next)
    setSelectedId(initialSelection(next))
    setNotes({})
    setUserResources({})
    setPromptOpen(false)
    setCircleOpen(false)
    setAddResourceOpen(false)
    setResourceDraft(EMPTY_RESOURCE_DRAFT)
    setShareCopied(false)
  }, [slug])

  React.useEffect(() => {
    return () => {
      if (shareTimer.current) clearTimeout(shareTimer.current)
    }
  }, [])

  const nodes = React.useMemo(
    () => visibleNodes(path, depth),
    [path, depth]
  )
  const nodeById = React.useMemo(
    () => Object.fromEntries(path.nodes.map((node) => [node.id, node])),
    [path.nodes]
  )
  const marks = React.useMemo(() => sequenceMarks(path), [path])
  const selected =
    (selectedId ? nodeById[selectedId] : null) ?? nodes[0] ?? path.nodes[0]
  const selectedMark = selected ? marks[selected.id] : undefined
  const selectedParent = selectedMark?.parentId
    ? nodeById[selectedMark.parentId]
    : null
  const exploredCount = path.nodes.filter(
    (node) => node.status === 'explored'
  ).length
  const myResources = selected ? userResources[selected.id] ?? [] : []

  function markExplored() {
    if (!selected || selected.kind === 'goal') return
    setPath((prev) => ({
      ...prev,
      nodes: prev.nodes.map((node) =>
        node.id === selected.id ? { ...node, status: 'explored' } : node
      )
    }))
  }

  function addConcept(event: React.FormEvent) {
    event.preventDefault()
    const label = addLabel.trim()
    if (!label) return
    const id = newId('n')
    const count = path.nodes.length
    const underGoal = !selected || selected.kind === 'goal'
    const siblingKind = underGoal ? 'concept' : 'prerequisite'
    const parentId = selected?.id ?? 'goal'
    const siblings = underGoal
      ? path.nodes.filter(
          (item) => item.kind === 'concept' || item.kind === 'milestone'
        )
      : path.edges
          .filter((edge) => edge.from === parentId)
          .map((edge) => path.nodes.find((item) => item.id === edge.to))
          .filter(
            (item): item is LearningPathNode =>
              !!item && item.kind === 'prerequisite'
          )
    const node: LearningPathNode = {
      id,
      label,
      kind: siblingKind,
      sub: underGoal ? 'Need this' : 'As deep as you need',
      status: 'next',
      sequence: siblings.length + 1,
      x: 22 + ((count * 19) % 58),
      y: 54 + (count % 3) * 8,
      description:
        'A concept you placed on this path. Attach why it belongs, then the resource that made it click.',
      why: 'You added this because it sits between where you are and the goal.',
      resources: []
    }
    setPath((prev) => ({
      ...prev,
      nodes: [...prev.nodes, node],
      edges: [...prev.edges, { from: parentId, to: id }]
    }))
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
    setUserResources((prev) => ({
      ...prev,
      [selected.id]: [item, ...(prev[selected.id] ?? [])]
    }))
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
        <nav className={styles.crumb} aria-label='Breadcrumb'>
          <Link href='/profile'>
            <a>Profile</a>
          </Link>
          <span className={styles.crumbSep} aria-hidden>
            /
          </span>
          <span>Learning path</span>
          <span className={styles.crumbSep} aria-hidden>
            /
          </span>
          <span>{path.title}</span>
        </nav>

        <p className={styles.eyebrow}>Learning path</p>
        <div className={styles.headerRow}>
          <div>
            <h1 className={styles.title}>{path.title}</h1>
            <p className={styles.summary}>{path.summary}</p>
          </div>
        </div>
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
              <h2 className={styles.mapTitle}>The map</h2>
              <span className={styles.mapHint}>
                1 → 2 → 3 is the order · a, b how deep to go
              </span>
            </div>
            <div className={styles.canvas}>
              <svg
                className={styles.connections}
                viewBox='0 0 100 100'
                preserveAspectRatio='none'
                aria-hidden
              >
                {path.edges.map((edge) => {
                  const from = nodeById[edge.from]
                  const to = nodeById[edge.to]
                  if (!from || !to) return null
                  if (
                    !nodes.some((node) => node.id === from.id) ||
                    !nodes.some((node) => node.id === to.id)
                  ) {
                    return null
                  }
                  return (
                    <path
                      key={`${edge.from}-${edge.to}`}
                      d={edgePath(from, to)}
                    />
                  )
                })}
              </svg>
              {nodes.map((node) => {
                const mark = marks[node.id]
                return (
                  <button
                    key={node.id}
                    type='button'
                    className={nodeClass(node, node.id === selected.id)}
                    style={{ left: `${node.x}%`, top: `${node.y}%` }}
                    aria-label={
                      mark
                        ? mark.role === 'core'
                          ? `Step ${mark.mark}: ${node.label}`
                          : `${node.label}, ${mark.mark})`
                        : node.label
                    }
                    onClick={() => {
                      setSelectedId(node.id)
                      setPromptOpen(false)
                      setAddResourceOpen(false)
                      setResourceDraft(EMPTY_RESOURCE_DRAFT)
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
                          {mark.role === 'branch' ? `${mark.mark})` : mark.mark}
                        </span>
                      ) : null}
                      <span className={styles.nodeLabel}>{node.label}</span>
                    </span>
                    <span className={styles.nodeSub}>{node.sub}</span>
                  </button>
                )
              })}
              <button
                type='button'
                className={styles.addNode}
                onClick={() => setAddOpen(true)}
              >
                <PlusIcon /> Add concept
              </button>
              <div className={styles.legend}>
                <span>
                  <i
                    className={`${styles.legendDot} ${styles.legendExplored}`}
                  />{' '}
                  Explored
                </span>
                <span>
                  <i
                    className={`${styles.legendDot} ${styles.legendExploring}`}
                  />{' '}
                  Exploring
                </span>
                <span>
                  <i className={`${styles.legendDot} ${styles.legendNext}`} />{' '}
                  Next
                </span>
              </div>
            </div>
          </section>

          <aside className={styles.detail} aria-live='polite'>
            <div className={styles.detailKicker}>
              <span>
                {selectedMark
                  ? selectedMark.role === 'core'
                    ? `Core path · ${selectedMark.mark}`
                    : `Under ${selectedParent?.label ?? 'this step'} · ${selectedMark.mark})`
                  : selected.kind}
              </span>
              <span className={styles.detailStatus}>
                {statusLabel(selected.status)}
              </span>
            </div>
            <h2 className={styles.detailTitle}>{selected.label}</h2>
            <p className={styles.detailBody}>{selected.description}</p>

            <div className={styles.block}>
              <h3 className={styles.blockTitle}>Why it is on your path</h3>
              <p className={styles.blockCopy}>{selected.why}</p>
            </div>

            <div className={styles.block}>
              <h3 className={styles.blockTitle}>What helped other people</h3>
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
            </div>

            <div className={styles.block}>
              <div className={styles.blockTitleRow}>
                <h3 className={styles.blockTitle}>Your resources</h3>
                {!addResourceOpen ? (
                  <button
                    type='button'
                    className={styles.addResourceBtn}
                    onClick={() => setAddResourceOpen(true)}
                  >
                    + Add a resource
                  </button>
                ) : null}
              </div>
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
            </div>

            <div className={styles.block}>
              <h3 className={styles.blockTitle}>Your note</h3>
              <textarea
                className={styles.note}
                rows={4}
                value={notes[selected.id] ?? ''}
                onChange={(event) =>
                  setNotes((prev) => ({
                    ...prev,
                    [selected.id]: event.target.value
                  }))
                }
                placeholder='What do you understand now? What is still fuzzy?'
              />
            </div>

            <div className={styles.actions}>
              <button
                type='button'
                className={styles.ghostBtn}
                onClick={() => setPromptOpen((open) => !open)}
              >
                {promptOpen ? 'Hide tutor prompt' : 'Ask for an explanation'}
              </button>
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
                Add a concept
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
            <form className={styles.modalForm} onSubmit={addConcept}>
              <label className={styles.modalLabel}>
                What belongs on the way to this goal?
                <input
                  className={styles.modalInput}
                  value={addLabel}
                  onChange={(event) => setAddLabel(event.target.value)}
                  placeholder='e.g. Positional embeddings'
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
