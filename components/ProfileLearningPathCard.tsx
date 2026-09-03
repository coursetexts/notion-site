import * as React from 'react'
import Link from 'next/link'

import type { StoredLearningPath } from '@/lib/learning-path-seed'
import type { LearningPathReminder } from '@/lib/learning-path-commitments-db'
import styles from '@/styles/profile.module.css'
import { ProfileCommitmentReminder } from './ProfileCommitmentReminder'

export function ProfileLearningPathCard({
  href,
  title,
  privacy,
  created = false,
  onUnsave,
  unsaveBusy = false,
  showSavedTag = false,
  committed = false,
  onToggleCommit,
  commitBusy = false,
  completedPercent,
  reminder = null,
  onSaveReminder,
  onRemoveReminder,
  reminderBusy = false
}: {
  href: string
  title: string
  privacy?: 'public' | 'private'
  created?: boolean
  onUnsave?: () => void
  unsaveBusy?: boolean
  showSavedTag?: boolean
  committed?: boolean
  onToggleCommit?: () => void
  commitBusy?: boolean
  completedPercent?: number | null
  reminder?: LearningPathReminder | null
  onSaveReminder?: (reminder: LearningPathReminder) => void
  onRemoveReminder?: () => void
  reminderBusy?: boolean
}) {
  const createdTag = created ? (
    <span
      className={`${styles.learningPathTag} ${styles.learningPathCreatedTag}`}
    >
      Created
    </span>
  ) : null

  const privacyTag = privacy ? (
    <span
      className={`${styles.learningPathTag} ${
        privacy === 'private'
          ? styles.learningPathPrivateTag
          : styles.learningPathPublicTag
      }`}
    >
      {privacy === 'private' ? 'Private' : 'Public'}
    </span>
  ) : null

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

  const hasTags = Boolean(
    createdTag ||
      privacyTag ||
      savedControl ||
      commitControl ||
      reminderControl ||
      completeTag
  )

  return (
    <div className={styles.learningPathCard}>
      <Link href={href}>
        <a className={styles.learningPathCardLink}>
          <span className={styles.learningPathCardTitle}>{title}</span>
        </a>
      </Link>
      {hasTags ? (
        <span className={styles.learningPathCardTags}>
          {createdTag}
          {privacyTag}
          {savedControl}
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
  onUnsave,
  unsaveBusy = false,
  committed = false,
  onToggleCommit,
  commitBusy = false,
  completedPercent,
  reminder = null,
  onSaveReminder,
  onRemoveReminder,
  reminderBusy = false
}: {
  item: StoredLearningPath
  onUnsave?: (linkId: string) => void
  unsaveBusy?: boolean
  committed?: boolean
  onToggleCommit?: (slug: string) => void
  commitBusy?: boolean
  completedPercent?: number | null
  reminder?: LearningPathReminder | null
  onSaveReminder?: (reminder: LearningPathReminder) => void
  onRemoveReminder?: () => void
  reminderBusy?: boolean
}) {
  const savedLinkId = item.savedLinkId
  const canUnsave = Boolean(savedLinkId && onUnsave)
  const isCreated = !savedLinkId
  return (
    <ProfileLearningPathCard
      href={`/learning-path/${item.slug}`}
      title={item.goal}
      created={isCreated}
      privacy={
        isCreated
          ? item.isPrivate !== false
            ? 'private'
            : 'public'
          : undefined
      }
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
      reminder={reminder}
      onSaveReminder={onSaveReminder}
      onRemoveReminder={onRemoveReminder}
      reminderBusy={reminderBusy}
    />
  )
}
