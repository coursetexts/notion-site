import * as React from 'react'

import {
  type UserKnowledgeTopic,
  addMyKnowledgeTopics
} from '@/lib/user-knowledge-topics-db'
import styles from '@/styles/profile.module.css'

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

  const normalized = query.trim().toLowerCase()
  const visible = normalized
    ? topics.filter((topic) => topic.label.toLowerCase().includes(normalized))
    : topics

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
      </div>
      {loading ? (
        <p className={styles.placeholder}>Loading…</p>
      ) : topics.length === 0 ? (
        <p className={styles.placeholder}>{emptyMessage}</p>
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
