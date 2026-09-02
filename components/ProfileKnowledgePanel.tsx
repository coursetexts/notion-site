import * as React from 'react'

import { ProfileKnowledgeGraph } from '@/components/ProfileKnowledgeGraph'
import {
  type KnowledgeGraphSubset,
  listKnowledgeGraphSubset,
  subsetFromUserTopics
} from '@/lib/knowledge-graph-db'
import {
  type UserKnowledgeTopic,
  addMyKnowledgeTopics
} from '@/lib/user-knowledge-topics-db'
import styles from '@/styles/profile.module.css'

const KNOWLEDGE_VIEWS = [
  { id: 'list', label: 'List' },
  { id: 'graph', label: 'Graph' }
] as const

type KnowledgeView = (typeof KNOWLEDGE_VIEWS)[number]['id']

export function formatKnowledgeExportText(topics: UserKnowledgeTopic[]): string {
  const labels = topics.map((topic) => topic.label.trim()).filter(Boolean)
  if (labels.length === 0) {
    return 'So far I have knowledge of these concepts:'
  }
  const lines = labels.map((label) => `- ${label}`)
  return `So far I have knowledge of these concepts:\n${lines.join('\n')}`
}

export function ProfileKnowledgePanel({
  topics,
  loading = false,
  searchId,
  emptyMessage,
  canAdd = false,
  onTopicsChange
}: {
  topics: UserKnowledgeTopic[]
  loading?: boolean
  searchId: string
  emptyMessage: string
  canAdd?: boolean
  onTopicsChange?: (topics: UserKnowledgeTopic[]) => void
}) {
  const [query, setQuery] = React.useState('')
  const [draft, setDraft] = React.useState('')
  const [showAddInput, setShowAddInput] = React.useState(false)
  const [view, setView] = React.useState<KnowledgeView>('list')
  const [graph, setGraph] = React.useState<KnowledgeGraphSubset>(() =>
    subsetFromUserTopics(topics)
  )
  const [graphLoading, setGraphLoading] = React.useState(false)
  const [exportCopied, setExportCopied] = React.useState(false)
  const addingRef = React.useRef(false)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const exportTimerRef = React.useRef<number | null>(null)

  React.useEffect(() => {
    return () => {
      if (exportTimerRef.current) window.clearTimeout(exportTimerRef.current)
    }
  }, [])

  React.useEffect(() => {
    if (!showAddInput) return
    inputRef.current?.focus()
  }, [showAddInput])

  React.useEffect(() => {
    if (view !== 'graph') return
    let cancelled = false
    setGraphLoading(true)
    void listKnowledgeGraphSubset(topics).then((next) => {
      if (cancelled) return
      setGraph(next)
      setGraphLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [view, topics])

  const normalized = query.trim().toLowerCase()
  const visible = normalized
    ? topics.filter((topic) => topic.label.toLowerCase().includes(normalized))
    : topics
  const graphForView = React.useMemo(() => {
    if (!normalized) return graph
    const nodes = graph.nodes.filter((node) =>
      node.label.toLowerCase().includes(normalized)
    )
    const ids = new Set(nodes.map((node) => node.id))
    return {
      nodes,
      edges: graph.edges.filter(
        (edge) => ids.has(edge.fromId) && ids.has(edge.toId)
      )
    }
  }, [graph, normalized])

  function cancelAdd() {
    setShowAddInput(false)
    setDraft('')
  }

  async function addTopic() {
    const label = draft.trim()
    if (!canAdd || !label || addingRef.current) return
    addingRef.current = true
    const next = await addMyKnowledgeTopics([label])
    onTopicsChange?.(next)
    setDraft('')
    addingRef.current = false
    inputRef.current?.focus()
  }

  async function exportKnowledgeList() {
    if (topics.length === 0) return
    const text = formatKnowledgeExportText(topics)
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      window.prompt('Copy this knowledge list', text)
      return
    }
    setExportCopied(true)
    if (exportTimerRef.current) window.clearTimeout(exportTimerRef.current)
    exportTimerRef.current = window.setTimeout(() => {
      setExportCopied(false)
      exportTimerRef.current = null
    }, 2000)
  }

  return (
    <div className={styles.tabPanel}>
      <div className={styles.tabPanelHeaderRow}>
        <h2 className={styles.mainSerifTitle}>Knowledge</h2>
        <div className={styles.knowledgeHeaderActions}>
          {canAdd ? (
            showAddInput ? (
              <input
                ref={inputRef}
                type='text'
                className={styles.knowledgeAddInput}
                placeholder='New topic'
                value={draft}
                maxLength={120}
                aria-label='New knowledge topic'
                autoComplete='off'
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    void addTopic()
                  }
                  if (event.key === 'Escape') {
                    event.preventDefault()
                    cancelAdd()
                  }
                }}
                onBlur={() => {
                  window.setTimeout(() => {
                    if (addingRef.current) return
                    cancelAdd()
                  }, 0)
                }}
              />
            ) : (
              <button
                type='button'
                className={styles.notebooksCreateBtn}
                onClick={() => setShowAddInput(true)}
              >
                + Add topic
              </button>
            )
          ) : null}
          {canAdd ? (
            <button
              type='button'
              className={styles.notebooksCreateBtn}
              onClick={() => void exportKnowledgeList()}
              disabled={loading || topics.length === 0}
            >
              {exportCopied ? 'Copied' : 'Export knowledge list'}
            </button>
          ) : null}
        </div>
      </div>
      <div className={styles.filterSearchBlock}>
        <div className={styles.panelSearchWrap}>
          <input
            id={searchId}
            type='search'
            className={styles.panelSearchInput}
            placeholder='SEARCH'
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label='Search completed topics'
          />
        </div>
        <div className={`${styles.linkFilterRow} ${styles.pathsCoursesFilter}`}>
          <div
            className={styles.linkFilterTagsWrap}
            role='group'
            aria-label='Knowledge view'
          >
            {KNOWLEDGE_VIEWS.map((item) => (
              <button
                key={item.id}
                type='button'
                aria-pressed={view === item.id}
                className={
                  view === item.id
                    ? styles.linkFilterBtnActive
                    : styles.linkFilterBtn
                }
                onClick={() => setView(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      {loading ? (
        <p className={styles.placeholder}>Loading…</p>
      ) : topics.length === 0 ? (
        <p className={styles.placeholder}>{emptyMessage}</p>
      ) : view === 'graph' ? (
        graphLoading ? (
          <p className={styles.placeholder}>Loading…</p>
        ) : graphForView.nodes.length === 0 ? (
          <p className={styles.placeholder}>No matching topics.</p>
        ) : (
          <>
            <ProfileKnowledgeGraph graph={graphForView} />
            <p className={styles.knowledgeGraphHint}>
              Links come from learning paths and a daily pass over Coursetexts
              topics. Isolated nodes still count — they connect when the graph
              catches up.
            </p>
          </>
        )
      ) : visible.length === 0 ? (
        <p className={styles.placeholder}>No matching topics.</p>
      ) : (
        <ul className={`${styles.list} ${styles.knowledgeList}`}>
          {visible.map((topic) => (
            <li key={topic.id} className={styles.listItem}>
              <span className={styles.listTitle}>{topic.label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
