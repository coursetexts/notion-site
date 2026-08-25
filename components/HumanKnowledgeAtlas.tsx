import * as React from 'react'
import { useRouter } from 'next/router'

import styles from './HumanKnowledgeAtlas.module.css'
import {
  HumanKnowledgeAtlasDetail,
  HumanKnowledgeAtlasKnownDetail,
  StatusBadge
} from './HumanKnowledgeAtlasDetail'
import {
  ATLAS_FACTS,
  ATLAS_QUESTIONS,
  ATLAS_STATUS_META,
  ATLAS_TREE,
  addQuestionToAtlasTree,
  collectAtlasSubmissionTargets,
  countAtlasThread,
  type AtlasKnownFact,
  type AtlasQuestion,
  type AtlasQuestionStatus,
  type AtlasReadingItem,
  type AtlasTreeNode
} from '@/lib/human-knowledge-atlas-seed'

const LEGEND_ORDER: AtlasQuestionStatus[] = [
  'emerging',
  'active',
  'contested',
  'settled'
]

function newId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function normalizeSearch(value: string) {
  return value.trim().toLowerCase()
}

function matchesSearch(haystack: string, query: string) {
  return haystack.toLowerCase().includes(query)
}

function questionMatchesQuery(question: AtlasQuestion, query: string) {
  if (!query) return true
  return (
    matchesSearch(question.title, query) ||
    matchesSearch(question.posed, query) ||
    matchesSearch(question.disciplinePath, query) ||
    question.hypotheses.some((item) => matchesSearch(item.statement, query))
  )
}

function factMatchesQuery(fact: AtlasKnownFact, query: string) {
  if (!query) return true
  return (
    matchesSearch(fact.title, query) ||
    matchesSearch(fact.note, query) ||
    matchesSearch(fact.disciplinePath, query)
  )
}

function filterAtlasTree(
  nodes: AtlasTreeNode[],
  query: string,
  questions: Record<string, AtlasQuestion>,
  facts: Record<string, AtlasKnownFact>
): AtlasTreeNode[] {
  if (!query) return nodes

  const next: AtlasTreeNode[] = []

  for (const node of nodes) {
    const selfMatch = matchesSearch(node.label, query)

    if (node.kind === 'known') {
      const factIds = (node.factIds ?? []).filter((id) => {
        const fact = facts[id]
        return fact ? factMatchesQuery(fact, query) : false
      })
      if (factIds.length === 0 && !selfMatch) continue
      next.push({
        ...node,
        factIds: factIds.length > 0 ? factIds : node.factIds
      })
      continue
    }

    if (node.kind === 'unresolved') {
      const questionIds = (node.questionIds ?? []).filter((id) => {
        const question = questions[id]
        return question ? questionMatchesQuery(question, query) : false
      })
      if (questionIds.length === 0 && !selfMatch) continue
      next.push({
        ...node,
        questionIds: questionIds.length > 0 ? questionIds : node.questionIds
      })
      continue
    }

    const children = filterAtlasTree(
      node.children ?? [],
      query,
      questions,
      facts
    )
    if (children.length === 0 && !selfMatch) continue
    next.push({
      ...node,
      children: children.length > 0 ? children : node.children
    })
  }

  return next
}

type AtlasSelection =
  | { kind: 'question'; id: string }
  | { kind: 'known'; id: string }

export function HumanKnowledgeAtlas() {
  const router = useRouter()
  const [questions, setQuestions] =
    React.useState<Record<string, AtlasQuestion>>(ATLAS_QUESTIONS)
  const [facts, setFacts] =
    React.useState<Record<string, AtlasKnownFact>>(ATLAS_FACTS)
  const [tree, setTree] = React.useState<AtlasTreeNode[]>(ATLAS_TREE)
  const [selected, setSelected] = React.useState<AtlasSelection | null>(null)
  const [createOpen, setCreateOpen] = React.useState(false)
  const [query, setQuery] = React.useState('')
  const [isSearchPulse, setIsSearchPulse] = React.useState(false)
  const pulseTimeoutRef = React.useRef<number | null>(null)
  const submitFromButtonRef = React.useRef(false)

  React.useEffect(() => {
    if (!router.isReady) return
    const raw = router.query.q
    const id = Array.isArray(raw) ? raw[0] : raw
    if (id && ATLAS_QUESTIONS[id]) {
      setSelected({ kind: 'question', id })
    }
  }, [router.isReady, router.query.q])

  React.useEffect(() => {
    return () => {
      if (pulseTimeoutRef.current !== null) {
        window.clearTimeout(pulseTimeoutRef.current)
      }
    }
  }, [])

  const targets = React.useMemo(
    () => collectAtlasSubmissionTargets(tree),
    [tree]
  )

  const selectedQuestion =
    selected?.kind === 'question' ? questions[selected.id] ?? null : null
  const selectedFact =
    selected?.kind === 'known' ? facts[selected.id] ?? null : null
  const search = normalizeSearch(query)
  const filteredTree = React.useMemo(
    () => filterAtlasTree(tree, search, questions, facts),
    [tree, search, questions, facts]
  )

  const triggerSearchPulse = React.useCallback(() => {
    setIsSearchPulse(false)

    window.requestAnimationFrame(() => {
      setIsSearchPulse(true)
    })

    if (pulseTimeoutRef.current !== null) {
      window.clearTimeout(pulseTimeoutRef.current)
    }

    pulseTimeoutRef.current = window.setTimeout(() => {
      setIsSearchPulse(false)
      pulseTimeoutRef.current = null
    }, 900)
  }, [])

  const markSearchButtonSubmit = React.useCallback(() => {
    submitFromButtonRef.current = true
  }, [])

  const handleSearchSubmit = React.useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      const fromSearchButton = submitFromButtonRef.current
      submitFromButtonRef.current = false
      if (fromSearchButton) {
        triggerSearchPulse()
      }
    },
    [triggerSearchPulse]
  )

  function handleCreated(question: AtlasQuestion, targetNodeId: string) {
    setQuestions((prev) => ({ ...prev, [question.id]: question }))
    setTree((prev) => addQuestionToAtlasTree(prev, targetNodeId, question.id))
    setSelected({ kind: 'question', id: question.id })
    setCreateOpen(false)
  }

  return (
    <section className={styles.section} aria-label='Human knowledge atlas'>
      <div className={styles.container}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>Human Knowledge Atlas</p>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>
              An atlas of what we know, <br/>what we suspect, and what <br/>we are trying
              to find out.
            </h1>
          </div>
          <p className={styles.subtitle}>
            Most maps of science chart papers. This one charts questions. Each
            frontier node holds the chain of inquiry — competing hypotheses, a
            reading list, and a thread for the work of talking it through.
          </p>
        </header>

        <form
          id='human-knowledge-atlas-search'
          className={`${styles.searchWrap} ${
            isSearchPulse ? styles.searchWrapPulse : ''
          }`}
          onSubmit={handleSearchSubmit}
          role='search'
        >
          <input
            type='text'
            className={styles.searchInput}
            placeholder='What are you curious about?'
            aria-label='What are you curious about?'
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button
            type='submit'
            className={styles.searchButton}
            onClick={markSearchButtonSubmit}
          >
            Search
          </button>
        </form>
      </div>

      <div className={styles.body}>
        <div className={styles.container}>
        <div className={styles.toolbar}>
          <div className={styles.legend}>
            {LEGEND_ORDER.map((status) => (
              <span key={status} className={styles.legendItem}>
                <span
                  className={`${styles.legendSwatch} ${
                    status === 'active'
                      ? styles.swatchActive
                      : status === 'contested'
                        ? styles.swatchContested
                        : status === 'settled'
                          ? styles.swatchSettled
                          : styles.swatchEmerging
                  }`}
                  aria-hidden
                />
                {ATLAS_STATUS_META[status].label}
              </span>
            ))}
          </div>
          <button
            type='button'
            className={styles.askBtn}
            onClick={() => setCreateOpen(true)}
          >
            <PlusIcon />
            Chart a question
          </button>
        </div>

        <div className={styles.treeHead}>
          <h2 className={styles.treeTitle}>The knowledge tree</h2>
          <span className={styles.treeHint}>
            domain → subfield → known / unresolved → question
          </span>
        </div>

        {filteredTree.length === 0 ? (
          <p className={`${styles.empty} ${styles.treeEmpty}`}>
            No matching questions or known facts.
          </p>
        ) : (
        <div className={styles.tree}>
          {filteredTree.map((domain, i) => (
            <Branch
              key={domain.id}
              node={domain}
              depth={0}
              defaultOpen={i === 0}
              forceOpen={Boolean(search)}
              questions={questions}
              facts={facts}
              selected={selected}
              onSelectQuestion={(id) => setSelected({ kind: 'question', id })}
              onSelectFact={(id) => setSelected({ kind: 'known', id })}
            />
          ))}
        </div>
        )}

        <p className={styles.quote}>
          “The map is not the territory — but a map of our questions is the
          closest thing we have to a portrait of the edge of human
          understanding.”
        </p>
        </div>
      </div>

      {selectedQuestion ? (
        <HumanKnowledgeAtlasDetail
          question={selectedQuestion}
          onClose={() => setSelected(null)}
          onChange={(next) =>
            setQuestions((prev) => ({ ...prev, [next.id]: next }))
          }
        />
      ) : null}

      {selectedFact ? (
        <HumanKnowledgeAtlasKnownDetail
          fact={selectedFact}
          onClose={() => setSelected(null)}
          onChange={(next) =>
            setFacts((prev) => ({ ...prev, [next.id]: next }))
          }
        />
      ) : null}

      {createOpen ? (
        <ChartQuestionModal
          targets={targets}
          onClose={() => setCreateOpen(false)}
          onCreate={handleCreated}
        />
      ) : null}
    </section>
  )
}

function Branch({
  node,
  depth,
  defaultOpen = false,
  forceOpen = false,
  questions,
  facts,
  selected,
  onSelectQuestion,
  onSelectFact
}: {
  node: AtlasTreeNode
  depth: number
  defaultOpen?: boolean
  forceOpen?: boolean
  questions: Record<string, AtlasQuestion>
  facts: Record<string, AtlasKnownFact>
  selected: AtlasSelection | null
  onSelectQuestion: (id: string) => void
  onSelectFact: (id: string) => void
}) {
  const initialOpen =
    node.kind === 'domain' ? defaultOpen : node.kind !== 'known'
  const [open, setOpen] = React.useState(initialOpen)
  const expanded = forceOpen || open

  const count =
    node.kind === 'unresolved'
      ? node.questionIds?.length ?? 0
      : node.kind === 'known'
        ? node.factIds?.length ?? 0
        : 0

  const label =
    node.kind === 'domain' ? (
      <span className={styles.domainLabel}>{node.label}</span>
    ) : node.kind === 'subfield' ? (
      <span className={styles.subfieldLabel}>{node.label}</span>
    ) : node.kind === 'known' ? (
      <span className={`${styles.kindLabel} ${styles.kindKnown}`}>
        known
        <span className={styles.kindCount}>{count}</span>
      </span>
    ) : (
      <span className={`${styles.kindLabel} ${styles.kindUnresolved}`}>
        unresolved
        <span className={styles.kindCount}>{count}</span>
      </span>
    )

  return (
    <div className={depth > 0 ? styles.branchNested : styles.branch}>
      <button
        type='button'
        className={styles.branchToggle}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={expanded}
      >
        <span
          className={`${styles.chevron}${expanded ? ` ${styles.chevronOpen}` : ''}`}
          aria-hidden
        >
          <ChevronIcon />
        </span>
        {label}
      </button>

      {expanded ? (
        <div>
          {node.children?.map((child) => (
            <Branch
              key={child.id}
              node={child}
              depth={depth + 1}
              forceOpen={forceOpen}
              questions={questions}
              facts={facts}
              selected={selected}
              onSelectQuestion={onSelectQuestion}
              onSelectFact={onSelectFact}
            />
          ))}

          {node.kind === 'known' ? (
            <div className={styles.questionList}>
              {node.factIds?.map((fid) => {
                const fact = facts[fid]
                if (!fact) return null
                const active =
                  selected?.kind === 'known' && selected.id === fid
                const replies = countAtlasThread(fact.threads)
                return (
                  <button
                    key={fid}
                    type='button'
                    className={`${styles.questionBtn}${
                      active ? ` ${styles.questionBtnActive}` : ''
                    }`}
                    onClick={() => onSelectFact(fid)}
                    aria-current={active ? 'true' : undefined}
                  >
                    <span className={styles.factMark} aria-hidden />
                    <span className={styles.questionBtnBody}>
                      <span className={styles.questionBtnTitle}>
                        {fact.title}
                      </span>
                      <span className={styles.questionBtnMeta}>
                        <StatusBadge status='settled' />
                        <span>
                          {fact.readingList.length}{' '}
                          {fact.readingList.length === 1
                            ? 'reading'
                            : 'readings'}{' '}
                          · {replies} {replies === 1 ? 'reply' : 'replies'}
                        </span>
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
          ) : null}

          {node.kind === 'unresolved' ? (
            <div className={styles.questionList}>
              {node.questionIds?.map((qid) => {
                const q = questions[qid]
                if (!q) return null
                const active =
                  selected?.kind === 'question' && selected.id === qid
                const replies = countAtlasThread(q.threads)
                return (
                  <button
                    key={qid}
                    type='button'
                    className={`${styles.questionBtn}${
                      active ? ` ${styles.questionBtnActive}` : ''
                    }`}
                    onClick={() => onSelectQuestion(qid)}
                    aria-current={active ? 'true' : undefined}
                  >
                    <span className={styles.questionMark} aria-hidden />
                    <span className={styles.questionBtnBody}>
                      <span className={styles.questionBtnTitle}>{q.title}</span>
                      <span className={styles.questionBtnMeta}>
                        <StatusBadge status={q.status} />
                        <span>
                          {q.readingList.length}{' '}
                          {q.readingList.length === 1 ? 'reading' : 'readings'}{' '}
                          · {replies} {replies === 1 ? 'reply' : 'replies'}
                        </span>
                        {q.contributedBy ? (
                          <span className={styles.contributed}>contributed</span>
                        ) : null}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

function ChartQuestionModal({
  targets,
  onClose,
  onCreate
}: {
  targets: { nodeId: string; path: string }[]
  onClose: () => void
  onCreate: (question: AtlasQuestion, targetNodeId: string) => void
}) {
  const [title, setTitle] = React.useState('')
  const [posed, setPosed] = React.useState('')
  const [targetNodeId, setTargetNodeId] = React.useState(
    targets[0]?.nodeId ?? ''
  )
  const [status, setStatus] = React.useState<AtlasQuestionStatus>('emerging')
  const [contributor, setContributor] = React.useState('')
  const [hypotheses, setHypotheses] = React.useState([''])
  const [readings, setReadings] = React.useState<
    Array<{ key: string; title: string; url: string; note: string }>
  >([{ key: newId('draft'), title: '', url: '', note: '' }])

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [onClose])

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const trimmedTitle = title.trim()
    if (!trimmedTitle || !targetNodeId) return
    const target = targets.find((t) => t.nodeId === targetNodeId)

    const readingList: AtlasReadingItem[] = readings
      .map((row) => ({
        id: newId('r'),
        title: row.title.trim(),
        url: row.url.trim() || undefined,
        note: row.note.trim() || undefined,
        threads: []
      }))
      .filter((row) => row.title)

    const cleanedHypotheses = hypotheses
      .map((h) => h.trim())
      .filter(Boolean)
      .map((statement, i) => ({
        id: newId('h'),
        statement,
        weight: (i === 0 ? 'leading' : 'contender') as 'leading' | 'contender',
        proponents: contributor.trim() || 'Community contributor'
      }))

    onCreate(
      {
        id: newId('q'),
        title: trimmedTitle,
        posed:
          posed.trim() ||
          'A newly proposed open question awaiting hypotheses and evidence.',
        status,
        disciplinePath: target?.path ?? 'Unfiled',
        hypotheses: cleanedHypotheses,
        evidence: [],
        experiments: [],
        readingList,
        researchers: [],
        labs: [],
        threads: [],
        contributedBy: contributor.trim() || 'anonymous',
        updated: new Date().toISOString().slice(0, 10)
      },
      targetNodeId
    )
  }

  return (
    <div
      className={styles.modalBackdrop}
      role='presentation'
      onClick={onClose}
    >
      <div
        className={styles.modal}
        role='dialog'
        aria-labelledby='chart-question-title'
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id='chart-question-title' className={styles.modalTitle}>
          Chart a question
        </h2>
        <p className={styles.modalHint}>
          Add an open question to the atlas. A reading list and discussion can
          accrue on the node.
        </p>
        <form onSubmit={submit}>
          <label className={styles.field}>
            <span className={styles.label}>The question</span>
            <textarea
              className={styles.textarea}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder='e.g. Why does the immune system tolerate the gut microbiome?'
              required
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Why is it open?</span>
            <textarea
              className={styles.textarea}
              value={posed}
              onChange={(e) => setPosed(e.target.value)}
              placeholder='What makes this hard or unresolved right now?'
            />
          </label>
          <div className={styles.fieldRow}>
            <label className={styles.field}>
              <span className={styles.label}>Place it under</span>
              <select
                className={styles.select}
                value={targetNodeId}
                onChange={(e) => setTargetNodeId(e.target.value)}
              >
                {targets.map((t) => (
                  <option key={t.nodeId} value={t.nodeId}>
                    {t.path}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              <span className={styles.label}>Status</span>
              <select
                className={styles.select}
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as AtlasQuestionStatus)
                }
              >
                <option value='emerging'>Emerging</option>
                <option value='active'>Active</option>
                <option value='contested'>Contested</option>
              </select>
            </label>
          </div>

          <div className={styles.field}>
            <span className={styles.label}>Competing hypotheses</span>
            <div className={styles.hypoEditor}>
              {hypotheses.map((h, i) => (
                <div key={i} className={styles.hypoRow}>
                  <input
                    className={styles.input}
                    value={h}
                    onChange={(e) =>
                      setHypotheses((prev) =>
                        prev.map((x, j) => (j === i ? e.target.value : x))
                      )
                    }
                    placeholder={
                      i === 0 ? 'Leading hypothesis' : 'Alternative hypothesis'
                    }
                  />
                </div>
              ))}
              <button
                type='button'
                className={styles.quietBtn}
                onClick={() => setHypotheses((prev) => [...prev, ''])}
              >
                Add hypothesis
              </button>
            </div>
          </div>

          <div className={styles.readingEditor}>
            <div className={styles.readingEditorHead}>
              <span className={styles.label}>Reading list</span>
              <button
                type='button'
                className={styles.quietBtn}
                onClick={() =>
                  setReadings((prev) => [
                    ...prev,
                    { key: newId('draft'), title: '', url: '', note: '' }
                  ])
                }
              >
                Add reading
              </button>
            </div>
            {readings.map((row, i) => (
              <div key={row.key} className={styles.readingRow}>
                <p className={styles.label}>Reading {i + 1}</p>
                <input
                  className={styles.input}
                  value={row.title}
                  onChange={(e) =>
                    setReadings((prev) =>
                      prev.map((item) =>
                        item.key === row.key
                          ? { ...item, title: e.target.value }
                          : item
                      )
                    )
                  }
                  placeholder='Title'
                />
                <input
                  className={styles.input}
                  value={row.url}
                  onChange={(e) =>
                    setReadings((prev) =>
                      prev.map((item) =>
                        item.key === row.key
                          ? { ...item, url: e.target.value }
                          : item
                      )
                    )
                  }
                  placeholder='URL (optional)'
                />
                <input
                  className={styles.input}
                  value={row.note}
                  onChange={(e) =>
                    setReadings((prev) =>
                      prev.map((item) =>
                        item.key === row.key
                          ? { ...item, note: e.target.value }
                          : item
                      )
                    )
                  }
                  placeholder='Why it belongs here (optional)'
                />
              </div>
            ))}
          </div>

          <label className={styles.field}>
            <span className={styles.label}>Your name or handle</span>
            <input
              className={styles.input}
              value={contributor}
              onChange={(e) => setContributor(e.target.value)}
              placeholder='anonymous'
            />
          </label>

          <div className={styles.modalActions}>
            <button
              type='button'
              className={styles.cancelBtn}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type='submit'
              className={styles.askBtn}
              disabled={!title.trim() || !targetNodeId}
            >
              Add to the atlas
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ChevronIcon() {
  return (
    <svg width='10' height='10' viewBox='0 0 16 16' fill='none' aria-hidden>
      <path d='M6 3.5L10.5 8L6 12.5' fill='currentColor' />
    </svg>
  )
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
