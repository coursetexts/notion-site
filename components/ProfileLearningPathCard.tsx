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
        ? 'Open to suggestions'
        : privacy === 'public'
          ? 'Public'
          : null
  const prefix = who && /^you$/i.test(who) ? 'Created by' : 'By'
  if (who && privacyLabel) return `${prefix} ${who} · ${privacyLabel}`
  if (who) return `${prefix} ${who}`
  if (privacyLabel) return privacyLabel
  return null
}

function LearningPathResumePreview({
  description,
  resume
}: {
  description?: string | null
  resume?: NavPinResume | null
}) {
  const blurb = (description ?? resume?.description ?? '').trim()
  if (!blurb) return null
  return (
    <div className={styles.learningPathCardResume}>
      <div className={styles.learningPathCardResumeInner}>
        <p className={styles.learningPathCardResumeDescription}>{blurb}</p>
      </div>
    </div>
  )
}

function formatContinueLabel(resume?: NavPinResume | null): string {
  const next = resume?.nextLabel?.trim()
  if (next) return `Continue, Next: ${next}`
  return 'Continue →'
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
  reminder = null,
  onSaveReminder,
  onRemoveReminder,
  reminderBusy = false,
  resume = null,
  description = null,
  showResumeActions = true
}: {
  href: string
  title: string
  privacy?: LearningPathVisibility | null
  bylineAuthor?: string | null
  committed?: boolean
  onToggleCommit?: () => void
  commitBusy?: boolean
  completedPercent?: number | null
  reminder?: LearningPathReminder | null
  onSaveReminder?: (reminder: LearningPathReminder) => void
  onRemoveReminder?: () => void
  reminderBusy?: boolean
  resume?: NavPinResume | null
  description?: string | null
  /** When false (public profiles): hover shows description only, no Continue. */
  showResumeActions?: boolean
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
    showResumeActions && !committed && onToggleCommit ? (
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
  const continueLabel = formatContinueLabel(resume)
  const continueControl = showResumeActions ? (
    <Link href={continueHref}>
      <a
        className={`${styles.learningPathTag} ${styles.learningPathContinueTag} ${styles.learningPathCommitHover}`}
        title={continueLabel}
      >
        <span className={styles.learningPathContinueLabel}>{continueLabel}</span>
      </a>
    </Link>
  ) : null

  const reminderControl =
    showResumeActions && committed && onSaveReminder && onRemoveReminder ? (
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

  const byline = formatLearningPathByline(bylineAuthor, privacy ?? null)

  const hasTags = Boolean(
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
        <LearningPathResumePreview description={description} resume={resume} />
        {hasTags ? (
          <span className={styles.learningPathCardTags}>
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
  reminder = null,
  onSaveReminder,
  onRemoveReminder,
  reminderBusy = false,
  resume = null,
  showResumeActions = true
}: {
  item: StoredLearningPath
  ownAuthorLabel?: string
  committed?: boolean
  onToggleCommit?: (slug: string) => void
  commitBusy?: boolean
  completedPercent?: number | null
  reminder?: LearningPathReminder | null
  onSaveReminder?: (reminder: LearningPathReminder) => void
  onRemoveReminder?: () => void
  reminderBusy?: boolean
  resume?: NavPinResume | null
  showResumeActions?: boolean
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
      reminder={reminder}
      onSaveReminder={onSaveReminder}
      onRemoveReminder={onRemoveReminder}
      reminderBusy={reminderBusy}
      resume={resume}
      description={description}
      showResumeActions={showResumeActions}
    />
  )
}
