import * as React from 'react'
import Link from 'next/link'

import { NotebookBookmarkIcon } from '@/components/ProfileNotebooksPanel'
import type { StoredLearningPath } from '@/lib/learning-path-seed'
import styles from '@/styles/profile.module.css'

export function ProfileLearningPathCard({
  href,
  title,
  privacy,
  onUnsave,
  unsaveBusy = false,
  showSavedIcon = false
}: {
  href: string
  title: string
  privacy?: 'public' | 'private'
  onUnsave?: () => void
  unsaveBusy?: boolean
  showSavedIcon?: boolean
}) {
  return (
    <div className={styles.learningPathCard}>
      <Link href={href}>
        <a className={styles.learningPathCardLink}>
          <span className={styles.learningPathCardTitle}>{title}</span>
        </a>
      </Link>
      {onUnsave ? (
        <button
          type='button'
          className={`${styles.notebooksListIconBtn} ${styles.learningPathSaveBtn}`}
          onClick={onUnsave}
          disabled={unsaveBusy}
          aria-label='Unsave'
          title='Unsave'
        >
          <span
            className={
              unsaveBusy ? styles.notebooksListIconBtnInnerBusy : undefined
            }
          >
            <NotebookBookmarkIcon filled />
          </span>
        </button>
      ) : showSavedIcon ? (
        <span
          className={styles.learningPathSaveIcon}
          title='Saved'
          aria-label='Saved learning path'
        >
          <NotebookBookmarkIcon filled />
        </span>
      ) : privacy ? (
        <span
          className={
            privacy === 'private'
              ? styles.learningPathPrivateTag
              : styles.learningPathPublicTag
          }
        >
          {privacy === 'private' ? 'Private' : 'Public'}
        </span>
      ) : null}
    </div>
  )
}

export function ProfileCommunityLearningPathCard({
  item,
  onUnsave,
  unsaveBusy = false
}: {
  item: StoredLearningPath
  onUnsave?: (linkId: string) => void
  unsaveBusy?: boolean
}) {
  const savedLinkId = item.savedLinkId
  const canUnsave = Boolean(savedLinkId && onUnsave)
  return (
    <ProfileLearningPathCard
      href={`/learning-path/${item.slug}`}
      title={item.goal}
      privacy={
        savedLinkId
          ? undefined
          : item.isPrivate !== false
            ? 'private'
            : 'public'
      }
      onUnsave={
        canUnsave ? () => onUnsave?.(savedLinkId as string) : undefined
      }
      unsaveBusy={unsaveBusy}
      showSavedIcon={Boolean(savedLinkId && !canUnsave)}
    />
  )
}
