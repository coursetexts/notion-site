import React from 'react'

import {
  ActivityFeedTypeIcon,
  type ActivityFeedIconKind
} from '@/components/ActivityFeedTypeIcon'
import styles from '@/styles/profile.module.css'

export type ActivityFeedTurn = {
  author: React.ReactNode
  verb?: string | null
  body?: React.ReactNode
  muted?: boolean
}

type ActivityFeedThreadProps = {
  /**
   * Main content: update text, or a target (course / path / bookmark /
   * discussion) depending on placement.
   */
  subject?: React.ReactNode
  time?: React.ReactNode
  turns: ActivityFeedTurn[]
  /**
   * Trailing bordered subcard under the author (bookmarks, paths, quotes’
   * originals are separate). Not used when `leadSubject` is set.
   */
  contentCard?: boolean
  /** Type icon on the lead target or inside a trailing content card. */
  iconKind?: ActivityFeedIconKind
  /**
   * Discussion / comment layout: subject card first, spine from the type
   * icon down to the responding avatar(s).
   */
  leadSubject?: boolean
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

function SubjectBlock({
  subject,
  contentCard,
  iconKind
}: {
  subject: React.ReactNode
  contentCard?: boolean
  iconKind?: ActivityFeedIconKind
}) {
  if (subject == null || subject === false) return null
  if (contentCard) {
    return (
      <div className={styles.feedTargetCard}>
        {iconKind ? (
          <ActivityFeedTypeIcon
            kind={iconKind}
            className={styles.feedTargetCardIcon}
          />
        ) : null}
        <div className={styles.feedTargetCardBody}>{subject}</div>
      </div>
    )
  }
  return <div className={styles.feedCardSubject}>{subject}</div>
}

function LeadSubjectOnSpine({
  subject,
  iconKind
}: {
  subject: React.ReactNode
  iconKind?: ActivityFeedIconKind
}) {
  if (subject == null || subject === false) return null
  return (
    <div className={styles.feedLeadSubjectRow}>
      {iconKind ? (
        <ActivityFeedTypeIcon
          kind={iconKind}
          className={styles.feedLeadIconOnSpine}
        />
      ) : (
        <span className={styles.feedLeadIconOnSpine} aria-hidden />
      )}
      <div className={styles.feedLeadSubjectCard}>{subject}</div>
    </div>
  )
}

/**
 * Author-first feed row, or discussion lead (subject card → spine → actors).
 * Replies use a left spine parent → reply; bodies indent under the name.
 */
export function ActivityFeedThread({
  subject,
  time,
  turns,
  contentCard = false,
  iconKind,
  leadSubject = false
}: ActivityFeedThreadProps) {
  if (leadSubject) {
    const last = turns.length > 0 ? turns[turns.length - 1] : null
    const earlier = turns.length > 1 ? turns.slice(0, -1) : []

    return (
      <div className={styles.feedThread}>
        <div
          className={`${styles.feedThreadSpine} ${styles.feedThreadSpineLead}`}
        >
          <LeadSubjectOnSpine subject={subject} iconKind={iconKind} />
          {earlier.map((turn, index) => (
            <div key={index} className={styles.feedThreadTurn}>
              <TurnAuthorRow turn={turn} />
              <div className={styles.feedThreadTurnBody}>
                <TurnBody turn={turn} />
              </div>
            </div>
          ))}
          {last ? (
            <div className={styles.feedThreadTurn}>
              <div className={styles.feedThreadHead}>
                <div className={styles.feedThreadHeadMain}>
                  <TurnAuthorRow turn={last} />
                </div>
                {time ? (
                  <span className={styles.feedCardTime}>{time}</span>
                ) : null}
              </div>
            </div>
          ) : time ? (
            <div className={styles.feedThreadHead}>
              <div className={styles.feedThreadHeadMain} />
              <span className={styles.feedCardTime}>{time}</span>
            </div>
          ) : null}
        </div>
        {last ? (
          <div className={styles.feedThreadIndent}>
            <TurnBody turn={last} />
          </div>
        ) : null}
      </div>
    )
  }

  if (turns.length === 0) {
    return (
      <div className={styles.feedThread}>
        <div className={styles.feedThreadHead}>
          <div className={styles.feedThreadHeadMain} />
          {time ? <span className={styles.feedCardTime}>{time}</span> : null}
        </div>
        <div className={styles.feedThreadIndent}>
          <SubjectBlock
            subject={subject}
            contentCard={contentCard}
            iconKind={iconKind}
          />
        </div>
      </div>
    )
  }

  const last = turns[turns.length - 1]
  const earlier = turns.slice(0, -1)

  if (earlier.length === 0) {
    return (
      <div className={styles.feedThread}>
        <div className={styles.feedThreadHead}>
          <div className={styles.feedThreadHeadMain}>
            <TurnAuthorRow turn={last} />
          </div>
          {time ? <span className={styles.feedCardTime}>{time}</span> : null}
        </div>
        <div className={styles.feedThreadIndent}>
          <TurnBody turn={last} />
          <SubjectBlock
            subject={subject}
            contentCard={contentCard}
            iconKind={iconKind}
          />
        </div>
      </div>
    )
  }

  return (
    <div className={styles.feedThread}>
      <div className={styles.feedThreadSpine}>
        {earlier.map((turn, index) => (
          <div key={index} className={styles.feedThreadTurn}>
            <TurnAuthorRow turn={turn} />
            <div className={styles.feedThreadTurnBody}>
              <TurnBody turn={turn} />
            </div>
          </div>
        ))}
        <div className={styles.feedThreadTurn}>
          <div className={styles.feedThreadHead}>
            <div className={styles.feedThreadHeadMain}>
              <TurnAuthorRow turn={last} />
            </div>
            {time ? <span className={styles.feedCardTime}>{time}</span> : null}
          </div>
        </div>
      </div>
      <div className={styles.feedThreadIndent}>
        <TurnBody turn={last} />
        <SubjectBlock
          subject={subject}
          contentCard={contentCard}
          iconKind={iconKind}
        />
      </div>
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
