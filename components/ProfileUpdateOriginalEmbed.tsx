import * as React from 'react'
import Link from 'next/link'

import type { ProfileUpdateOriginal } from '@/lib/profile-updates-db'
import styles from '@/styles/profile.module.css'

function OriginalAvatar({
  displayName,
  avatarUrl
}: {
  displayName: string
  avatarUrl?: string | null
}) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt=''
        className={styles.feedThreadAvatar}
        width={24}
        height={24}
      />
    )
  }
  return (
    <span className={styles.feedThreadAvatarPlaceholder} aria-hidden>
      {(displayName || 'U').charAt(0).toUpperCase()}
    </span>
  )
}

/** Nested card for a reposted / quoted original update. */
export function ProfileUpdateOriginalEmbed({
  original
}: {
  original: ProfileUpdateOriginal
}) {
  const body = original.body.trim() || 'Update'
  return (
    <div className={styles.updateOriginalEmbed}>
      <div className={styles.updateOriginalHead}>
        <OriginalAvatar
          displayName={original.displayName}
          avatarUrl={original.avatarUrl}
        />
        <Link href={`/profile/${original.userId}`} legacyBehavior>
          <a className={styles.updateOriginalAuthor}>{original.displayName}</a>
        </Link>
      </div>
      {original.url ? (
        <a
          href={original.url}
          target='_blank'
          rel='noopener noreferrer'
          className={styles.updateOriginalBody}
        >
          {body}
        </a>
      ) : (
        <p className={styles.updateOriginalBody}>{body}</p>
      )}
    </div>
  )
}
