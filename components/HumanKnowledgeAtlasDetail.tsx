import * as React from 'react'

import styles from './HumanKnowledgeAtlas.module.css'
import {
  ATLAS_STATUS_META,
  appendAtlasReply,
  countAtlasThread,
  type AtlasKnownFact,
  type AtlasQuestion,
  type AtlasQuestionStatus,
  type AtlasReadingItem,
  type AtlasThreadComment
} from '@/lib/human-knowledge-atlas-seed'

function newId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
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

function makeComment(body: string): AtlasThreadComment {
  return {
    id: newId('c'),
    author: 'You',
    body,
    createdAt: new Date().toISOString().slice(0, 10),
    replies: []
  }
}

const STATUS_CLASS: Record<AtlasQuestionStatus, string> = {
  active: styles.badgeActive,
  contested: styles.badgeContested,
  emerging: styles.badgeEmerging,
  settled: styles.badgeSettled
}

const WEIGHT_LABEL: Record<string, string> = {
  leading: 'Leading',
  contender: 'Contender',
  fringe: 'Fringe'
}

const STRENGTH_CLASS: Record<string, string> = {
  strong: styles.strengthStrong,
  suggestive: '',
  weak: styles.strengthWeak,
  absent: styles.strengthAbsent
}

export function StatusBadge({ status }: { status: AtlasQuestionStatus }) {
  return (
    <span className={`${styles.badge} ${STATUS_CLASS[status]}`}>
      {ATLAS_STATUS_META[status].label}
    </span>
  )
}

export function HumanKnowledgeAtlasDetail({
  question,
  onClose,
  onChange
}: {
  question: AtlasQuestion
  onClose: () => void
  onChange: (next: AtlasQuestion) => void
}) {
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

  function addQuestionReply(parentId: string | null, body: string) {
    onChange({
      ...question,
      threads: appendAtlasReply(question.threads, parentId, makeComment(body))
    })
  }

  function addReadingReply(
    readingId: string,
    parentId: string | null,
    body: string
  ) {
    onChange({
      ...question,
      readingList: question.readingList.map((item) =>
        item.id === readingId
          ? {
              ...item,
              threads: appendAtlasReply(item.threads, parentId, makeComment(body))
            }
          : item
      )
    })
  }

  function addReading(item: AtlasReadingItem) {
    onChange({
      ...question,
      readingList: [...question.readingList, item]
    })
  }

  return (
    <>
      <button
        type='button'
        className={styles.drawerBackdrop}
        aria-label='Close question'
        onClick={onClose}
      />
      <aside
        className={styles.drawer}
        role='dialog'
        aria-modal='true'
        aria-labelledby='atlas-question-title'
      >
        <div className={styles.drawerHeader}>
          <div className={styles.drawerHeaderBody}>
            <p className={styles.drawerPath}>{question.disciplinePath}</p>
            <h2 id='atlas-question-title' className={styles.drawerTitle}>
              {question.title}
            </h2>
            <div className={styles.drawerMeta}>
              <StatusBadge status={question.status} />
              <span className={styles.threadMeta}>
                Updated {formatDate(question.updated)}
              </span>
              {question.contributedBy ? (
                <span className={styles.contributed}>
                  Submitted by {question.contributedBy}
                </span>
              ) : null}
            </div>
          </div>
          <button
            type='button'
            className={styles.closeBtn}
            onClick={onClose}
            aria-label='Close'
          >
            <CloseIcon />
          </button>
        </div>

        <div className={styles.drawerBody}>
          <p className={styles.posed}>{question.posed}</p>

          {question.hypotheses.length > 0 ? (
            <section className={styles.block}>
              <h3 className={styles.blockTitle}>Competing hypotheses</h3>
              <ul className={styles.hypoList}>
                {question.hypotheses.map((h) => (
                  <li
                    key={h.id}
                    className={`${styles.hypoItem}${
                      h.weight === 'leading' ? ` ${styles.hypoItemLeading}` : ''
                    }`}
                  >
                    <p className={styles.hypoWeight}>{WEIGHT_LABEL[h.weight]}</p>
                    <p className={styles.hypoStatement}>{h.statement}</p>
                    <p className={styles.hypoWho}>{h.proponents}</p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {question.evidence.length > 0 ? (
            <section className={styles.block}>
              <h3 className={styles.blockTitle}>Evidence on the table</h3>
              <ul className={styles.evidenceList}>
                {question.evidence.map((ev) => (
                  <li key={ev.id} className={styles.evidenceItem}>
                    <p className={styles.evidenceClaim}>{ev.claim}</p>
                    <span
                      className={`${styles.strength} ${
                        STRENGTH_CLASS[ev.strength] ?? ''
                      }`}
                    >
                      {ev.strength}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {question.experiments.length > 0 ? (
          <section className={styles.block}>
            <h3 className={styles.blockTitle}>Experiments in flight</h3>
            <ul className={styles.experimentList}>
              {question.experiments.map((x) => (
                <li key={x.id} className={styles.experimentItem}>
                  <div>
                    <p className={styles.experimentName}>{x.name}</p>
                    <p className={styles.experimentNote}>{x.note}</p>
                  </div>
                  <span className={styles.stage}>{x.stage}</span>
                </li>
              ))}
            </ul>
          </section>
          ) : null}

          <AtlasReadingDiscussion
            readingList={question.readingList}
            threads={question.threads}
            onAddReading={addReading}
            onReadingReply={addReadingReply}
            onThreadReply={addQuestionReply}
          />

          {(question.researchers.length > 0 || question.labs.length > 0) && (
            <div className={styles.chipRow}>
              {question.researchers.length > 0 ? (
                <section className={styles.block}>
                  <h3 className={styles.blockTitle}>Researchers</h3>
                  <ul className={styles.chipList}>
                    {question.researchers.map((name) => (
                      <li key={name} className={styles.chip}>
                        {name}
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
              {question.labs.length > 0 ? (
                <section className={styles.block}>
                  <h3 className={styles.blockTitle}>Labs & institutes</h3>
                  <ul className={styles.chipList}>
                    {question.labs.map((name) => (
                      <li key={name} className={styles.chip}>
                        {name}
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </div>
          )}
        </div>
      </aside>
    </>
  )
}

export function HumanKnowledgeAtlasKnownDetail({
  fact,
  onClose,
  onChange
}: {
  fact: AtlasKnownFact
  onClose: () => void
  onChange: (next: AtlasKnownFact) => void
}) {
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

  function addFactReply(parentId: string | null, body: string) {
    onChange({
      ...fact,
      threads: appendAtlasReply(fact.threads, parentId, makeComment(body))
    })
  }

  function addReadingReply(
    readingId: string,
    parentId: string | null,
    body: string
  ) {
    onChange({
      ...fact,
      readingList: fact.readingList.map((item) =>
        item.id === readingId
          ? {
              ...item,
              threads: appendAtlasReply(item.threads, parentId, makeComment(body))
            }
          : item
      )
    })
  }

  function addReading(item: AtlasReadingItem) {
    onChange({
      ...fact,
      readingList: [...fact.readingList, item]
    })
  }

  return (
    <>
      <button
        type='button'
        className={styles.drawerBackdrop}
        aria-label='Close known fact'
        onClick={onClose}
      />
      <aside
        className={styles.drawer}
        role='dialog'
        aria-modal='true'
        aria-labelledby='atlas-known-title'
      >
        <div className={`${styles.drawerHeader} ${styles.drawerHeaderKnown}`}>
          <div className={styles.drawerHeaderBody}>
            <p className={styles.drawerPath}>{fact.disciplinePath}</p>
            <h2 id='atlas-known-title' className={styles.drawerTitle}>
              {fact.title}
            </h2>
            <div className={styles.drawerMeta}>
              <StatusBadge status='settled' />
              <span className={styles.threadMeta}>
                Updated {formatDate(fact.updated)}
              </span>
            </div>
          </div>
          <button
            type='button'
            className={styles.closeBtn}
            onClick={onClose}
            aria-label='Close'
          >
            <CloseIcon />
          </button>
        </div>

        <div className={styles.drawerBody}>
          <p className={styles.posed}>{fact.note}</p>
          <AtlasReadingDiscussion
            readingList={fact.readingList}
            threads={fact.threads}
            onAddReading={addReading}
            onReadingReply={addReadingReply}
            onThreadReply={addFactReply}
          />
        </div>
      </aside>
    </>
  )
}

function AtlasReadingDiscussion({
  readingList,
  threads,
  onAddReading,
  onReadingReply,
  onThreadReply
}: {
  readingList: AtlasReadingItem[]
  threads: AtlasThreadComment[]
  onAddReading: (item: AtlasReadingItem) => void
  onReadingReply: (
    readingId: string,
    parentId: string | null,
    body: string
  ) => void
  onThreadReply: (parentId: string | null, body: string) => void
}) {
  return (
    <>
      <section className={styles.block}>
        <h3 className={styles.blockTitle}>Reading list</h3>
        <div className={styles.readingBlock}>
          {readingList.length === 0 ? (
            <p className={styles.readingEmpty}>No readings attached yet.</p>
          ) : (
            <ul className={styles.readingList}>
              {readingList.map((item) => (
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
                    <span className={styles.readingTitle}>{item.title}</span>
                  )}
                  {item.note ? (
                    <p className={styles.readingNote}>{item.note}</p>
                  ) : null}
                  <ReadingThread
                    item={item}
                    onReply={(parentId, body) =>
                      onReadingReply(item.id, parentId, body)
                    }
                  />
                </li>
              ))}
            </ul>
          )}
          <AddReadingForm onAdd={onAddReading} />
        </div>
      </section>

      <section className={styles.block} aria-labelledby='atlas-discussion'>
        <h3 id='atlas-discussion' className={styles.blockTitle}>
          Discussion
        </h3>
        <Thread
          comments={threads}
          empty='No replies yet. Start the thread.'
          onReply={onThreadReply}
        />
      </section>
    </>
  )
}

function ReadingThread({
  item,
  onReply
}: {
  item: AtlasReadingItem
  onReply: (parentId: string | null, body: string) => void
}) {
  const [open, setOpen] = React.useState(item.threads.length > 0)
  const count = countAtlasThread(item.threads)

  return (
    <div>
      <button
        type='button'
        className={`${styles.quietBtn} ${styles.threadToggle}`}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        {open ? 'Hide discussion' : 'Discussion'} · {count}{' '}
        {count === 1 ? 'reply' : 'replies'}
      </button>
      {open ? (
        <div className={styles.threadWrap}>
          <Thread
            comments={item.threads}
            empty='No discussion on this reading yet.'
            onReply={onReply}
          />
        </div>
      ) : null}
    </div>
  )
}

function Thread({
  comments,
  empty,
  onReply
}: {
  comments: AtlasThreadComment[]
  empty: string
  onReply: (parentId: string | null, body: string) => void
}) {
  return (
    <div>
      {comments.length === 0 ? (
        <p className={styles.empty}>{empty}</p>
      ) : (
        <ul className={styles.threadList}>
          {comments.map((item) => (
            <ThreadNode key={item.id} comment={item} onReply={onReply} />
          ))}
        </ul>
      )}
      <Compose
        placeholder='Add to the discussion…'
        submitLabel='Post reply'
        onSubmit={(body) => onReply(null, body)}
      />
    </div>
  )
}

function ThreadNode({
  comment,
  onReply
}: {
  comment: AtlasThreadComment
  onReply: (parentId: string | null, body: string) => void
}) {
  const [replying, setReplying] = React.useState(false)

  return (
    <li className={styles.thread}>
      <p className={styles.threadMeta}>
        <span className={styles.threadAuthor}>{comment.author}</span>
        <span>{formatDate(comment.createdAt)}</span>
      </p>
      <p className={styles.threadBody}>{comment.body}</p>
      <button
        type='button'
        className={`${styles.quietBtn} ${styles.mutedBtn}`}
        onClick={() => setReplying((v) => !v)}
      >
        {replying ? 'Cancel' : 'Reply'}
      </button>
      {replying ? (
        <Compose
          placeholder='Write a reply…'
          submitLabel='Reply'
          compact
          onSubmit={(body) => {
            onReply(comment.id, body)
            setReplying(false)
          }}
          onCancel={() => setReplying(false)}
        />
      ) : null}
      {comment.replies.length > 0 ? (
        <ul className={styles.threadReplies}>
          {comment.replies.map((child) => (
            <ThreadNode key={child.id} comment={child} onReply={onReply} />
          ))}
        </ul>
      ) : null}
    </li>
  )
}

function Compose({
  placeholder,
  submitLabel,
  compact,
  onSubmit,
  onCancel
}: {
  placeholder: string
  submitLabel: string
  compact?: boolean
  onSubmit: (body: string) => void
  onCancel?: () => void
}) {
  const [value, setValue] = React.useState('')

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const body = value.trim()
    if (!body) return
    onSubmit(body)
    setValue('')
  }

  const composeId = React.useId()

  return (
    <form
      className={`${styles.compose}${compact ? ` ${styles.composeInline}` : ''}`}
      onSubmit={submit}
    >
      <label className={styles.srOnly} htmlFor={composeId}>
        {placeholder}
      </label>
      <textarea
        id={composeId}
        className={styles.textarea}
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={compact ? 2 : 3}
      />
      <div className={styles.composeActions}>
        {onCancel ? (
          <button
            type='button'
            className={styles.cancelBtn}
            onClick={onCancel}
          >
            Cancel
          </button>
        ) : null}
        <button
          type='submit'
          className={styles.askBtn}
          disabled={!value.trim()}
        >
          {submitLabel}
        </button>
      </div>
    </form>
  )
}

function AddReadingForm({
  onAdd
}: {
  onAdd: (item: AtlasReadingItem) => void
}) {
  const [open, setOpen] = React.useState(false)
  const [title, setTitle] = React.useState('')
  const [url, setUrl] = React.useState('')
  const [note, setNote] = React.useState('')

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return
    onAdd({
      id: newId('r'),
      title: trimmed,
      url: url.trim() || undefined,
      note: note.trim() || undefined,
      threads: []
    })
    setTitle('')
    setUrl('')
    setNote('')
    setOpen(false)
  }

  if (!open) {
    return (
      <div className={styles.addReading}>
        <button
          type='button'
          className={styles.quietBtn}
          onClick={() => setOpen(true)}
        >
          Add a reading
        </button>
      </div>
    )
  }

  return (
    <form className={styles.addReading} onSubmit={submit}>
      <input
        className={styles.input}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder='Title'
        required
      />
      <input
        className={styles.input}
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder='URL'
      />
      <input
        className={styles.input}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder='Why it belongs here (optional)'
      />
      <div className={styles.addReadingActions}>
        <div className={styles.composeActions}>
          <button
            type='button'
            className={styles.cancelBtn}
            onClick={() => setOpen(false)}
          >
            Cancel
          </button>
          <button
            type='submit'
            className={styles.askBtn}
            disabled={!title.trim()}
          >
            Add to reading list
          </button>
        </div>
      </div>
    </form>
  )
}

function CloseIcon() {
  return (
    <svg width='12' height='12' viewBox='0 0 12 12' fill='none' aria-hidden>
      <path
        d='M2 2L10 10M10 2L2 10'
        stroke='currentColor'
        strokeWidth='1.4'
        strokeLinecap='round'
      />
    </svg>
  )
}
