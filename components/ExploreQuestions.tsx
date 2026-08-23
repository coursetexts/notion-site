import * as React from 'react'

import styles from './ExploreQuestions.module.css'
import { ExploreQuestionFieldMap } from './ExploreQuestionFieldMap'
import {
  EXPLORE_FIELDS,
  EXPLORE_QUESTIONS_SEED,
  type ExploreFieldId,
  type ExploreQuestion,
  type ExploreReadingItem,
  getExploreField
} from '@/lib/explore-questions-seed'

function newId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export function ExploreQuestions() {
  const [questions, setQuestions] = React.useState<ExploreQuestion[]>(
    EXPLORE_QUESTIONS_SEED
  )
  const [query, setQuery] = React.useState('')
  const [selectedField, setSelectedField] =
    React.useState<ExploreFieldId | null>(null)
  const [selectedId, setSelectedId] = React.useState(
    EXPLORE_QUESTIONS_SEED[0]?.id ?? ''
  )
  const [readingOpen, setReadingOpen] = React.useState(false)
  const [compose, setCompose] = React.useState('')
  const [createOpen, setCreateOpen] = React.useState(false)

  const filtered = React.useMemo(() => {
    const needle = query.trim().toLowerCase()
    return questions.filter((q) => {
      if (selectedField && q.field !== selectedField) return false
      if (!needle) return true
      const hay = [
        q.title,
        q.body,
        q.author,
        getExploreField(q.field)?.label ?? '',
        ...q.readingList.map((item) => `${item.title} ${item.note ?? ''}`)
      ]
        .join(' ')
        .toLowerCase()
      return hay.includes(needle)
    })
  }, [questions, query, selectedField])

  React.useEffect(() => {
    if (filtered.some((q) => q.id === selectedId)) return
    setSelectedId(filtered[0]?.id ?? '')
  }, [filtered, selectedId])

  const selected = questions.find((q) => q.id === selectedId) ?? null
  const selectedIndex = selected
    ? questions.findIndex((q) => q.id === selected.id) + 1
    : 0

  function addComment(e: React.FormEvent) {
    e.preventDefault()
    const body = compose.trim()
    if (!body || !selected) return
    const comment = {
      id: newId('c'),
      author: 'You',
      body,
      createdAt: new Date().toISOString().slice(0, 10)
    }
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === selected.id
          ? { ...q, comments: [...q.comments, comment] }
          : q
      )
    )
    setCompose('')
  }

  function handleCreated(question: ExploreQuestion) {
    setQuestions((prev) => [question, ...prev])
    setSelectedId(question.id)
    setSelectedField(question.field)
    setReadingOpen(question.readingList.length > 0)
    setCreateOpen(false)
    setQuery('')
  }

  return (
    <section className={styles.section} aria-label='Explore questions'>
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>Explore Frontier Open Questions</h1>
            <button
              type='button'
              className={styles.askBtn}
              onClick={() => setCreateOpen(true)}
            >
              <PlusIcon />
              Ask a question
            </button>
          </div>
          <p className={styles.subtitle}>
            Search open questions, attach a reading list, and talk them through.
          </p>
        </header>

        <div className={styles.searchWrap}>
          <span className={styles.searchIcon} aria-hidden>
            <SearchIcon />
          </span>
          <input
            type='search'
            className={styles.searchInput}
            placeholder='Search questions, readings, or authors…'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label='Search questions'
          />
        </div>

        <ExploreQuestionFieldMap
          questions={questions}
          selectedField={selectedField}
          selectedQuestionId={selectedId}
          onSelectField={setSelectedField}
          onSelectQuestion={(id) => {
            setSelectedId(id)
            setReadingOpen(false)
          }}
        />

        <div className={styles.layout}>
          <div className={styles.listPane}>
            <p className={styles.listMeta}>
              {filtered.length}{' '}
              {filtered.length === 1 ? 'question' : 'questions'}
              {selectedField
                ? ` in ${getExploreField(selectedField)?.label ?? selectedField}`
                : ''}
            </p>
            {filtered.length === 0 ? (
              <p className={styles.empty}>
                No questions match that search. Ask one, or clear the query.
              </p>
            ) : (
              <ol className={styles.questionList}>
                {filtered.map((q) => {
                  const index = questions.findIndex((item) => item.id === q.id)
                  const active = q.id === selectedId
                  return (
                    <li key={q.id}>
                      <button
                        type='button'
                        className={`${styles.questionBtn}${
                          active ? ` ${styles.questionBtnActive}` : ''
                        }`}
                        onClick={() => {
                          setSelectedId(q.id)
                          setReadingOpen(false)
                        }}
                        aria-current={active ? 'true' : undefined}
                      >
                        <span className={styles.questionIndex}>
                          {index + 1}.
                        </span>
                        <span className={styles.questionBtnBody}>
                          <span className={styles.questionBtnTitle}>
                            {q.title}
                          </span>
                          <span className={styles.questionBtnMeta}>
                            {getExploreField(q.field)?.label ?? q.field} ·{' '}
                            {q.readingList.length}{' '}
                            {q.readingList.length === 1
                              ? 'reading'
                              : 'readings'}{' '}
                            · {q.comments.length}{' '}
                            {q.comments.length === 1 ? 'reply' : 'replies'}
                          </span>
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ol>
            )}
          </div>

          <div className={styles.detailPane}>
            {selected ? (
              <>
                <article className={styles.questionCard}>
                  <p className={styles.cardEyebrow}>
                    {getExploreField(selected.field)?.label ?? selected.field} ·
                    Question {selectedIndex}
                  </p>
                  <h2 className={styles.cardTitle}>{selected.title}</h2>
                  <p className={styles.cardBody}>{selected.body}</p>
                  <p className={styles.cardByline}>
                    Asked by {selected.author} · {formatDate(selected.createdAt)}
                  </p>
                </article>

                <div className={styles.readingBlock}>
                  <button
                    type='button'
                    className={styles.readingToggle}
                    onClick={() => setReadingOpen((v) => !v)}
                    aria-expanded={readingOpen}
                  >
                    <span
                      className={`${styles.readingChevron}${
                        readingOpen ? ` ${styles.readingChevronOpen}` : ''
                      }`}
                      aria-hidden
                    >
                      <ChevronIcon />
                    </span>
                    <BookIcon />
                    <span>Reading list</span>
                    <span className={styles.readingCount}>
                      {selected.readingList.length}
                    </span>
                  </button>
                  {readingOpen && (
                    <ul className={styles.readingList}>
                      {selected.readingList.length === 0 ? (
                        <li className={styles.readingEmpty}>
                          No readings attached yet.
                        </li>
                      ) : (
                        selected.readingList.map((item) => (
                          <li key={item.id} className={styles.readingItem}>
                            {item.url ? (
                              <a
                                href={item.url}
                                target='_blank'
                                rel='noopener noreferrer'
                                className={styles.readingTitle}
                              >
                                {item.title}
                              </a>
                            ) : (
                              <span className={styles.readingTitle}>
                                {item.title}
                              </span>
                            )}
                            {item.note ? (
                              <p className={styles.readingNote}>{item.note}</p>
                            ) : null}
                          </li>
                        ))
                      )}
                    </ul>
                  )}
                </div>

                <section
                  className={styles.forum}
                  aria-labelledby='discussion-heading'
                >
                  <h3 id='discussion-heading' className={styles.forumTitle}>
                    Discussion
                  </h3>
                  {selected.comments.length === 0 ? (
                    <p className={styles.forumEmpty}>
                      No replies yet. Start the thread.
                    </p>
                  ) : (
                    <ul className={styles.commentList}>
                      {selected.comments.map((comment) => (
                        <li key={comment.id} className={styles.comment}>
                          <p className={styles.commentMeta}>
                            <span className={styles.commentAuthor}>
                              {comment.author}
                            </span>
                            <span>{formatDate(comment.createdAt)}</span>
                          </p>
                          <p className={styles.commentBody}>{comment.body}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                  <form className={styles.compose} onSubmit={addComment}>
                    <label className={styles.srOnly} htmlFor='eq-reply'>
                      Write a reply
                    </label>
                    <textarea
                      id='eq-reply'
                      className={styles.composeInput}
                      placeholder='Add to the discussion…'
                      value={compose}
                      onChange={(e) => setCompose(e.target.value)}
                      rows={3}
                    />
                    <div className={styles.composeActions}>
                      <button
                        type='submit'
                        className={styles.askBtn}
                        disabled={!compose.trim()}
                      >
                        Post reply
                      </button>
                    </div>
                  </form>
                </section>
              </>
            ) : (
              <p className={styles.empty}>Select a question to read it.</p>
            )}
          </div>
        </div>
      </div>

      {createOpen && (
        <CreateQuestionModal
          onClose={() => setCreateOpen(false)}
          onCreate={handleCreated}
        />
      )}
    </section>
  )
}

function CreateQuestionModal({
  onClose,
  onCreate
}: {
  onClose: () => void
  onCreate: (question: ExploreQuestion) => void
}) {
  const [title, setTitle] = React.useState('')
  const [body, setBody] = React.useState('')
  const [field, setField] = React.useState<ExploreFieldId>('learning')
  const [readings, setReadings] = React.useState<
    Array<{ key: string; title: string; url: string; note: string }>
  >([{ key: newId('draft'), title: '', url: '', note: '' }])

  function updateReading(
    key: string,
    field: 'title' | 'url' | 'note',
    value: string
  ) {
    setReadings((prev) =>
      prev.map((row) => (row.key === key ? { ...row, [field]: value } : row))
    )
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const trimmedTitle = title.trim()
    const trimmedBody = body.trim()
    if (!trimmedTitle || !trimmedBody) return

    const readingList: ExploreReadingItem[] = readings
      .map((row) => ({
        id: newId('r'),
        title: row.title.trim(),
        url: row.url.trim() || undefined,
        note: row.note.trim() || undefined
      }))
      .filter((row) => row.title)

    onCreate({
      id: newId('q'),
      title: trimmedTitle,
      body: trimmedBody,
      author: 'You',
      createdAt: new Date().toISOString().slice(0, 10),
      field,
      readingList,
      comments: []
    })
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
        aria-labelledby='create-question-title'
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id='create-question-title' className={styles.modalTitle}>
          Ask a question
        </h2>
        <p className={styles.modalHint}>
          Add context and an optional reading list. Nothing is saved to a
          server yet.
        </p>
        <form onSubmit={submit}>
          <label className={styles.field}>
            <span className={styles.label}>Question</span>
            <input
              className={styles.input}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder='What are you trying to understand?'
              required
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Context</span>
            <textarea
              className={styles.textarea}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder='Why this question matters, and what you have already tried.'
              required
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Field</span>
            <select
              className={styles.input}
              value={field}
              onChange={(e) => setField(e.target.value as ExploreFieldId)}
            >
              {EXPLORE_FIELDS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <div className={styles.readingEditor}>
            <div className={styles.readingEditorHead}>
              <span className={styles.label}>Reading list</span>
              <button
                type='button'
                className={styles.addReadingBtn}
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
                <p className={styles.readingRowLabel}>Reading {i + 1}</p>
                <input
                  className={styles.input}
                  value={row.title}
                  onChange={(e) =>
                    updateReading(row.key, 'title', e.target.value)
                  }
                  placeholder='Title'
                />
                <input
                  className={styles.input}
                  value={row.url}
                  onChange={(e) =>
                    updateReading(row.key, 'url', e.target.value)
                  }
                  placeholder='URL (optional)'
                />
                <input
                  className={styles.input}
                  value={row.note}
                  onChange={(e) =>
                    updateReading(row.key, 'note', e.target.value)
                  }
                  placeholder='Why it belongs here (optional)'
                />
              </div>
            ))}
          </div>

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
              disabled={!title.trim() || !body.trim()}
            >
              Publish question
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

function SearchIcon() {
  return (
    <svg width='16' height='16' viewBox='0 0 16 16' fill='none' aria-hidden>
      <circle cx='7' cy='7' r='4.25' stroke='currentColor' strokeWidth='1.3' />
      <path
        d='M10.2 10.2L13.5 13.5'
        stroke='currentColor'
        strokeWidth='1.3'
        strokeLinecap='round'
      />
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

function ChevronIcon() {
  return (
    <svg width='10' height='10' viewBox='0 0 16 16' fill='none' aria-hidden>
      <path
        d='M6 3.5L10.5 8L6 12.5'
        fill='currentColor'
      />
    </svg>
  )
}

function BookIcon() {
  return (
    <svg width='16' height='16' viewBox='0 0 16 16' fill='none' aria-hidden>
      <path
        d='M3.5 3.2C5.1 2.6 6.6 2.8 8 4C9.4 2.8 10.9 2.6 12.5 3.2V12.2C10.9 11.6 9.4 11.8 8 13C6.6 11.8 5.1 11.6 3.5 12.2V3.2Z'
        stroke='currentColor'
        strokeWidth='1.2'
        strokeLinejoin='round'
      />
      <path
        d='M8 4V13'
        stroke='currentColor'
        strokeWidth='1.2'
        strokeLinecap='round'
      />
    </svg>
  )
}
