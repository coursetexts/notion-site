import * as React from 'react'
import Link from 'next/link'

import type {
  LearningPathVisibility,
  StoredLearningPath
} from '@/lib/learning-path-seed'
import { isCourseKindPath } from '@/lib/learning-path-kind-ui'
import { COURSETEXTS_BYLINE_AUTHOR } from '@/lib/course-byline'
import type { LearningPathReminder } from '@/lib/learning-path-commitments-db'
import type { NavPinResume } from '@/lib/nav-pin-resume'
import { formatLearningStreakLabel } from '@/lib/profile-learning-streaks'
import styles from '@/styles/profile.module.css'
import { ProfilePathIcon } from './ProfileTabItemIcons'
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

function LearningPathResumePreview({
  description,
  resume
}: {
  description?: string | null
  resume?: NavPinResume | null
}) {
  const blurb = (description ?? resume?.description ?? '').trim()
  const progressLabel = resume
    ? `${resume.explored} of ${resume.total} ${resume.unit} explored`
    : 'Pick up where you left off'
  const nextLabel = resume?.nextLabel
    ? `Next: ${resume.nextLabel}`
    : resume && resume.explored >= resume.total
      ? 'All caught up'
      : null

  return (
    <div className={styles.learningPathCardResume}>
      {blurb ? (
        <p className={styles.learningPathCardResumeDescription}>{blurb}</p>
      ) : null}
      <p className={styles.learningPathCardResumeLine}>
        <span>{progressLabel}</span>
        {nextLabel ? (
          <>
            <span className={styles.learningPathCardResumeSep} aria-hidden>
              |
            </span>
            <span className={styles.learningPathCardResumeNextLabel}>
              {nextLabel}
            </span>
          </>
        ) : null}
      </p>
    </div>
  )
}

export function ProfileLearningPathCard({
  href,
  title,
  privacy,
  bylineAuthor,
  committed = false,
  onToggleCommit,
  commitBusy = false,
  completedPercent,
  streakDays = 0,
  reminder = null,
  onSaveReminder,
  onRemoveReminder,
  reminderBusy = false,
  resume = null,
  description = null
}: {
  href: string
  title: string
  privacy?: LearningPathVisibility | null
  bylineAuthor?: string | null
  committed?: boolean
  onToggleCommit?: () => void
  commitBusy?: boolean
  completedPercent?: number | null
  streakDays?: number | null
  reminder?: LearningPathReminder | null
  onSaveReminder?: (reminder: LearningPathReminder) => void
  onRemoveReminder?: () => void
  reminderBusy?: boolean
  resume?: NavPinResume | null
  description?: string | null
}) {
  const committedTag = committed ? (
    onToggleCommit ? (
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
      <span
        className={`${styles.learningPathTag} ${styles.learningPathCommittedTag}`}
        aria-label='Committed learning path'
      >
        Committed
      </span>
    )
  ) : null

  const commitHoverControl =
    !committed && onToggleCommit ? (
      <button
        type='button'
        className={`${styles.learningPathTag} ${styles.learningPathCommitTag} ${styles.learningPathCommitHover}${
          commitBusy ? ` ${styles.notebooksListIconBtnInnerBusy}` : ''
        }`}
        onClick={onToggleCommit}
        disabled={commitBusy}
        aria-label='Commit to this learning path'
      >
        Commit
      </button>
    ) : null

  const continueHref = resume?.continueHref ?? href
  const continueControl = (
    <Link href={continueHref}>
      <a
        className={`${styles.learningPathTag} ${styles.learningPathContinueTag} ${styles.learningPathCommitHover}`}
      >
        Continue →
      </a>
    </Link>
  )

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

  const hasTags = Boolean(
    streakTag ||
      completeTag ||
      committedTag ||
      reminderControl ||
      commitHoverControl ||
      continueControl
  )

  return (
    <div
      className={`${styles.learningPathCard}${
        byline ? ` ${styles.learningPathCardWithByline}` : ''
      }`}
    >
      <span className={styles.tabItemIcon} aria-hidden>
        <ProfilePathIcon />
      </span>
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
        <LearningPathResumePreview
          description={description}
          resume={resume}
        />
        {hasTags ? (
          <span className={styles.learningPathCardTags}>
            {streakTag}
            {completeTag}
            {committedTag}
            {reminderControl}
            {commitHoverControl}
            {continueControl}
          </span>
        ) : null}
      </div>
    </div>
  )
}

export function ProfileCommunityLearningPathCard({
  item,
  ownAuthorLabel = 'you',
  committed = false,
  onToggleCommit,
  commitBusy = false,
  completedPercent,
  streakDays = 0,
  reminder = null,
  onSaveReminder,
  onRemoveReminder,
  reminderBusy = false,
  resume = null
}: {
  item: StoredLearningPath
  ownAuthorLabel?: string
  committed?: boolean
  onToggleCommit?: (slug: string) => void
  commitBusy?: boolean
  completedPercent?: number | null
  streakDays?: number | null
  reminder?: LearningPathReminder | null
  onSaveReminder?: (reminder: LearningPathReminder) => void
  onRemoveReminder?: () => void
  reminderBusy?: boolean
  resume?: NavPinResume | null
}) {
  const savedLinkId = item.savedLinkId
  const isCreated = !savedLinkId && !item.invited
  const isCourse = isCourseKindPath(item.kind)
  const bylineAuthor = isCreated
    ? ownAuthorLabel
    : item.ownerName?.trim() ||
      (isCourse ? COURSETEXTS_BYLINE_AUTHOR : 'someone')
  const privacy: LearningPathVisibility =
    item.visibility ??
    (item.isPrivate === false || isCourse ? 'public' : 'private')
  const description = item.data?.summary?.trim() || null
  return (
    <ProfileLearningPathCard
      href={`/learning-path/${item.slug}`}
      title={item.goal}
      bylineAuthor={bylineAuthor}
      privacy={privacy}
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
      resume={resume}
      description={description}
    />
  )
}
