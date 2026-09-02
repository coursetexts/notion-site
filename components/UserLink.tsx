import React from 'react'

import {
  followRelationship,
  followTagLabel
} from '@/lib/follow-relationship'

import styles from './UserLink.module.css'

export interface UserLinkProps {
  userId: string
  displayName: string
  /** When true, show "following" tag (current user follows this user). */
  showFollowingTag?: boolean
  /** When true, show "follows you" tag (this user follows the current user). */
  showFollowsYouTag?: boolean
  className?: string
}

export const UserLink: React.FC<UserLinkProps> = ({
  userId,
  displayName,
  showFollowingTag = false,
  showFollowsYouTag = false,
  className
}) => {
  const name = displayName || 'Anonymous'
  const href = `/profile/${userId}`
  const relationship = followRelationship(
    showFollowingTag,
    showFollowsYouTag
  )
  const tag = followTagLabel(relationship)
  const tagClass =
    relationship === 'each-other'
      ? styles.tagEachOther
      : relationship === 'following'
        ? styles.tagFollowing
        : styles.tagFollowsYou
  return (
    <span className={className}>
      <a href={href} className={styles.link}>
        {name}
      </a>
      {tag ? <span className={tagClass}>{tag}</span> : null}
    </span>
  )
}
