import * as React from 'react'
import Link from 'next/link'

import {
  type LearningPathData,
  type LearningPathNode,
  type LearningPathNodeStatus,
  emptyLearningPath,
  readStoredLearningPaths,
  resolveLearningPath
} from '@/lib/learning-path-seed'

import styles from './LearningPath.module.css'

type DepthFilter = 'all' | 'core' | 'unfinished'

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

function initialSelection(path: LearningPathData) {
  return (
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
  const [depth, setDepth] = React.useState<DepthFilter>('all')
  const [addOpen, setAddOpen] = React.useState(false)
  const [addLabel, setAddLabel] = React.useState('')
  const [promptOpen, setPromptOpen] = React.useState(false)
  const [circleOpen, setCircleOpen] = React.useState(false)

  React.useEffect(() => {
    const next = resolveLearningPath(slug, readStoredLearningPaths())
    setPath(next)
    setSelectedId(initialSelection(next))
    setNotes({})
    setPromptOpen(false)
    setCircleOpen(false)
  }, [slug])

  const nodes = React.useMemo(
    () => visibleNodes(path, depth),
    [path, depth]
  )
  const nodeById = React.useMemo(
    () => Object.fromEntries(path.nodes.map((node) => [node.id, node])),
    [path.nodes]
  )
  const selected =
    (selectedId ? nodeById[selectedId] : null) ?? nodes[0] ?? path.nodes[0]
  const exploredCount = path.nodes.filter(
    (node) => node.status === 'explored'
  ).length

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
    const node: LearningPathNode = {
      id,
      label,
      kind: 'concept',
      sub: 'Added by you',
      status: 'next',
      x: 22 + ((count * 19) % 58),
      y: 54 + (count % 3) * 8,
      description:
        'A concept you placed on this path. Attach why it belongs, then the resource that made it click.',
      why: 'You added this because it sits between where you are and the goal.',
      resources: []
    }
    const fromId = selected?.id ?? 'goal'
    setPath((prev) => ({
      ...prev,
      nodes: [...prev.nodes, node],
      edges: [...prev.edges, { from: fromId, to: id }]
    }))
    setSelectedId(id)
    setAddLabel('')
    setAddOpen(false)
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
        </div>

        <div className={styles.layout}>
          <section className={styles.mapPanel}>
            <div className={styles.mapToolbar}>
              <h2 className={styles.mapTitle}>The map</h2>
              <span className={styles.mapHint}>
                Goal → what you need → how deep to go
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
              {nodes.map((node) => (
                <button
                  key={node.id}
                  type='button'
                  className={nodeClass(node, node.id === selected.id)}
                  style={{ left: `${node.x}%`, top: `${node.y}%` }}
                  onClick={() => {
                    setSelectedId(node.id)
                    setPromptOpen(false)
                  }}
                >
                  <span className={styles.nodeStatus} />
                  <span className={styles.nodeLabel}>{node.label}</span>
                  <span className={styles.nodeSub}>{node.sub}</span>
                </button>
              ))}
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
              <span>{selected.kind}</span>
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
                placeholder='What made this click? Which part of which resource?'
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
