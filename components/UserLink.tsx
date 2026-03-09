import React from 'react'
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
  return (
    <span className={className}>
      <a href={href} className={styles.link}>
        {name}
      </a>
      {showFollowingTag && (
        <span className={styles.tagFollowing}>following</span>
      )}
      {showFollowsYouTag && (
        <span className={styles.tagFollowsYou}>follows you</span>
      )}
    </span>
  )
}
