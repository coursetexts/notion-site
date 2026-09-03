import * as React from 'react'
import Link from 'next/link'

import type {
  LearningPathVisibility,
  StoredLearningPath
} from '@/lib/learning-path-seed'
import { isCourseKindPath } from '@/lib/learning-path-kind-ui'
import { COURSETEXTS_BYLINE_AUTHOR } from '@/lib/course-byline'
import type { LearningPathReminder } from '@/lib/learning-path-commitments-db'
import { formatLearningStreakLabel } from '@/lib/profile-learning-streaks'
import styles from '@/styles/profile.module.css'
import { ProfileCommitmentReminder } from './ProfileCommitmentReminder'

function formatLearningPathByline(
  author?: string | null,
  privacy?: LearningPathVisibility | null
): string | null {
  const who = author?.trim()
  const privacyLabel =
    privacy === 'private'
      ? 'Private'
      : privacy === 'collaborative'
        ? 'Collaborative'
        : privacy === 'public'
          ? 'Public'
          : null
  const prefix = who && /^you$/i.test(who) ? 'Created by' : 'By'
  if (who && privacyLabel) return `${prefix} ${who} · ${privacyLabel}`
  if (who) return `${prefix} ${who}`
  if (privacyLabel) return privacyLabel
  return null
}

function GrowingPlantIcon() {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='15'
      height='15'
      viewBox='0 0 16 16'
      fill='none'
      aria-hidden
    >
      <path
        d='M8 9.1C3.8 10 2.4 6.1 3.6 3.3C7.8 3.6 8.6 6.8 8 9.1Z'
        fill='#6b944f'
      />
      <path
        d='M8 8.3C12.1 6.6 13.8 8.8 13 12C9.1 12.5 7.7 9.8 8 8.3Z'
        fill='#5a833f'
      />
      <path
        d='M8 8.6v5.5'
        stroke='#5a7348'
        strokeWidth='1.35'
        strokeLinecap='round'
      />
      <path
        d='M5.4 14.4c.8-.75 4.4-.75 5.2 0'
        stroke='#5a7348'
        strokeWidth='1.2'
        strokeLinecap='round'
      />
    </svg>
  )
}

export function ProfileLearningPathCard({
  href,
  title,
  privacy,
  bylineAuthor,
  onUnsave,
  unsaveBusy = false,
  showSavedTag = false,
  committed = false,
  onToggleCommit,
  commitBusy = false,
  completedPercent,
  streakDays = 0,
  reminder = null,
  onSaveReminder,
  onRemoveReminder,
  reminderBusy = false
}: {
  href: string
  title: string
  privacy?: LearningPathVisibility | null
  bylineAuthor?: string | null
  onUnsave?: () => void
  unsaveBusy?: boolean
  showSavedTag?: boolean
  committed?: boolean
  onToggleCommit?: () => void
  commitBusy?: boolean
  completedPercent?: number | null
  streakDays?: number | null
  reminder?: LearningPathReminder | null
  onSaveReminder?: (reminder: LearningPathReminder) => void
  onRemoveReminder?: () => void
  reminderBusy?: boolean
}) {
  const savedControl = onUnsave ? (
    <button
      type='button'
      className={`${styles.learningPathTag} ${styles.learningPathSavedTag}${
        unsaveBusy ? ` ${styles.notebooksListIconBtnInnerBusy}` : ''
      }`}
      onClick={onUnsave}
      disabled={unsaveBusy}
      aria-label='Unsave'
    >
      <span className={styles.learningPathSavedLabel}>Saved</span>
      <span className={styles.learningPathUnsaveLabel}>Unsave</span>
    </button>
  ) : showSavedTag ? (
    <span
      className={`${styles.learningPathTag} ${styles.learningPathSavedTag}`}
      aria-label='Saved learning path'
    >
      Saved
    </span>
  ) : null

  const commitControl = onToggleCommit ? (
    committed ? (
      <button
        type='button'
        className={`${styles.learningPathTag} ${styles.learningPathCommittedTag}${
          commitBusy ? ` ${styles.notebooksListIconBtnInnerBusy}` : ''
        }`}
        onClick={onToggleCommit}
        disabled={commitBusy}
        aria-label='Uncommit'
      >
        <span className={styles.learningPathCommittedLabel}>Committed</span>
        <span className={styles.learningPathUncommitLabel}>Uncommit</span>
      </button>
    ) : (
      <button
        type='button'
        className={`${styles.learningPathTag} ${styles.learningPathCommitTag}${
          commitBusy ? ` ${styles.notebooksListIconBtnInnerBusy}` : ''
        }`}
        onClick={onToggleCommit}
        disabled={commitBusy}
        aria-label='Commit to this learning path'
      >
        Commit
      </button>
    )
  ) : committed ? (
    <span
      className={`${styles.learningPathTag} ${styles.learningPathCommittedTag}`}
      aria-label='Committed learning path'
    >
      Committed
    </span>
  ) : null

  const reminderControl =
    committed && onSaveReminder && onRemoveReminder ? (
      <ProfileCommitmentReminder
        reminder={reminder}
        onSave={onSaveReminder}
        onRemove={onRemoveReminder}
        busy={reminderBusy}
      />
    ) : null

  const showProgress =
    completedPercent != null &&
    completedPercent > 0 &&
    Number.isFinite(completedPercent)
  const completePercent = showProgress
    ? Math.min(100, Math.max(1, Math.round(completedPercent as number)))
    : 0
  const completeTag = showProgress ? (
    <span
      className={`${styles.learningPathTag} ${styles.learningPathCompleteTag}`}
    >
      {completePercent}% complete
    </span>
  ) : null

  const streak =
    streakDays != null && Number.isFinite(streakDays)
      ? Math.max(0, Math.round(streakDays))
      : 0
  const streakLabel = formatLearningStreakLabel(streak)
  const streakTag =
    streak > 0 ? (
      <span
        className={`${styles.learningPathTag} ${styles.learningPathStreakTag}`}
      >
        <GrowingPlantIcon />
        <span>{streakLabel}</span>
      </span>
    ) : null

  const byline = formatLearningPathByline(bylineAuthor, privacy ?? null)

  const hasActionTags = Boolean(
    savedControl || streakTag || completeTag || commitControl || reminderControl
  )

  return (
    <div
      className={`${styles.learningPathCard}${
        byline ? ` ${styles.learningPathCardWithByline}` : ''
      }`}
    >
      <div className={styles.learningPathCardMain}>
        <Link href={href}>
          <a className={styles.learningPathCardLink}>
            <span className={styles.learningPathCardTitle} title={title}>
              {title}
            </span>
          </a>
        </Link>
        {byline ? (
          <span className={styles.learningPathCardByline} title={byline}>
            {byline}
          </span>
        ) : null}
      </div>
      {hasActionTags ? (
        <span className={styles.learningPathCardTags}>
          {savedControl}
          {streakTag}
          {completeTag}
          {commitControl}
          {reminderControl}
        </span>
      ) : null}
    </div>
  )
}

export function ProfileCommunityLearningPathCard({
  item,
  ownAuthorLabel = 'you',
  onUnsave,
  unsaveBusy = false,
  committed = false,
  onToggleCommit,
  commitBusy = false,
  completedPercent,
  streakDays = 0,
  reminder = null,
  onSaveReminder,
  onRemoveReminder,
  reminderBusy = false
}: {
  item: StoredLearningPath
  ownAuthorLabel?: string
  onUnsave?: (linkId: string) => void
  unsaveBusy?: boolean
  committed?: boolean
  onToggleCommit?: (slug: string) => void
  commitBusy?: boolean
  completedPercent?: number | null
  streakDays?: number | null
  reminder?: LearningPathReminder | null
  onSaveReminder?: (reminder: LearningPathReminder) => void
  onRemoveReminder?: () => void
  reminderBusy?: boolean
}) {
  const savedLinkId = item.savedLinkId
  const canUnsave = Boolean(savedLinkId && onUnsave)
  const isCreated = !savedLinkId
  const isCourse = isCourseKindPath(item.kind)
  const bylineAuthor = isCreated
    ? ownAuthorLabel
    : item.ownerName?.trim() ||
      (isCourse ? COURSETEXTS_BYLINE_AUTHOR : 'someone')
  const privacy: LearningPathVisibility =
    item.visibility ??
    (item.isPrivate === false || isCourse ? 'public' : 'private')
  return (
    <ProfileLearningPathCard
      href={`/learning-path/${item.slug}`}
      title={item.goal}
      bylineAuthor={bylineAuthor}
      privacy={privacy}
      onUnsave={
        canUnsave ? () => onUnsave?.(savedLinkId as string) : undefined
      }
      unsaveBusy={unsaveBusy}
      showSavedTag={Boolean(savedLinkId && !canUnsave)}
      committed={committed}
      onToggleCommit={
        onToggleCommit ? () => onToggleCommit(item.slug) : undefined
      }
      commitBusy={commitBusy}
      completedPercent={completedPercent}
      streakDays={streakDays}
      reminder={reminder}
      onSaveReminder={onSaveReminder}
      onRemoveReminder={onRemoveReminder}
      reminderBusy={reminderBusy}
    />
  )
}
