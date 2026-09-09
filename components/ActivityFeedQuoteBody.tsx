import React from 'react'

import styles from '@/styles/profile.module.css'

export type ActivityFeedTurn = {
  author: React.ReactNode
  verb?: string | null
  body?: React.ReactNode
  muted?: boolean
}

type ActivityFeedThreadProps = {
  /** Content subject shown above the thread (course, path, bookmark title, etc.). */
  subject: React.ReactNode
  time?: React.ReactNode
  turns: ActivityFeedTurn[]
}

function TurnAuthorRow({ turn }: { turn: ActivityFeedTurn }) {
  return (
    <div className={styles.feedThreadActorRow}>
      {turn.author}
      {turn.verb ? (
        <span className={styles.feedThreadVerb}>{turn.verb}</span>
      ) : null}
    </div>
  )
}

function TurnBody({ turn }: { turn: ActivityFeedTurn }) {
  if (!turn.body) return null
  return (
    <p
      className={
        turn.muted ? styles.feedThreadBodyMuted : styles.feedThreadBody
      }
    >
      {turn.body}
    </p>
  )
}

/**
 * Substack-style thread: subject first, then a left rule through earlier
 * turns that meets each author’s avatar, with the name to the right —
 * not beside the last body.
 */
export function ActivityFeedThread({
  subject,
  time,
  turns
}: ActivityFeedThreadProps) {
  if (turns.length === 0) {
    return (
      <div className={styles.feedThread}>
        <div className={styles.feedCardSubjectRow}>
          <div className={styles.feedCardSubject}>{subject}</div>
          {time ? <span className={styles.feedCardTime}>{time}</span> : null}
        </div>
      </div>
    )
  }

  const last = turns[turns.length - 1]
  const earlier = turns.slice(0, -1)

  return (
    <div className={styles.feedThread}>
      <div className={styles.feedCardSubjectRow}>
        <div className={styles.feedCardSubject}>{subject}</div>
        {time ? <span className={styles.feedCardTime}>{time}</span> : null}
      </div>
      <div className={styles.feedThreadSpine}>
        {earlier.map((turn, index) => (
          <div key={index} className={styles.feedThreadTurn}>
            <TurnAuthorRow turn={turn} />
            <TurnBody turn={turn} />
          </div>
        ))}
        <div className={styles.feedThreadTurn}>
          <TurnAuthorRow turn={last} />
        </div>
      </div>
      <TurnBody turn={last} />
    </div>
  )
}

type ActivityFeedQuoteBodyProps = {
  children: React.ReactNode
  parentBody?: string | null
  parentAuthorName?: string | null
  replyAuthorName?: string | null
}

/** Legacy quote helper for non-feed surfaces (Your activity / public). */
export function ActivityFeedQuoteBody({
  children,
  parentBody,
  parentAuthorName,
  replyAuthorName
}: ActivityFeedQuoteBodyProps) {
  const parentText = (parentBody ?? '').trim()
  const parentName = (parentAuthorName ?? '').trim()
  const replyName = (replyAuthorName ?? '').trim()

  if (!parentText) {
    return (
      <p className={`${styles.listBody} ${styles.listBodyQuote}`}>{children}</p>
    )
  }

  return (
    <div className={styles.listBodyDialogue}>
      <div className={styles.listBodyDialogueTurn}>
        {parentName ? (
          <p className={styles.listBodyQuoteAuthorMuted}>{parentName}</p>
        ) : null}
        <p className={`${styles.listBody} ${styles.listBodyQuoteParent}`}>
          {parentText}
        </p>
      </div>
      <div className={styles.listBodyDialogueTurn}>
        {replyName ? (
          <p className={styles.listBodyQuoteAuthor}>{replyName}</p>
        ) : null}
        <p className={`${styles.listBody} ${styles.listBodyQuote}`}>{children}</p>
      </div>
    </div>
  )
}
