import * as React from 'react'

import type { ProfileFeedItem } from '@/lib/profile-feed-db'
import styles from '@/styles/profile.module.css'
import {
  ProfileAnnouncementIcon,
  ProfileBookmarkIcon,
  ProfileCommentIcon,
  ProfileDiscussionIcon,
  ProfileHeartIcon,
  ProfileJoinIcon,
  ProfilePathIcon,
  ProfileProgressIcon,
  ProfileSuggestionIcon
} from '@/components/ProfileTabItemIcons'

export type ActivityFeedIconKind =
  | 'bookmark'
  | 'comment'
  | 'discussion'
  | 'path'
  | 'progress'
  | 'update'
  | 'suggestion'
  | 'join'
  | 'follow'
  | 'like'

export function activityIconKindForFeedItem(
  item: ProfileFeedItem
): ActivityFeedIconKind {
  switch (item.kind) {
    case 'followed_course_bookmark':
    case 'followed_link_bookmark':
      return 'bookmark'
    case 'followed_comment':
      return 'comment'
    case 'followed_annotation':
      return 'discussion'
    case 'followed_learning_path':
      return 'path'
    case 'followed_path_progress':
      return 'progress'
    case 'followed_profile_update':
      return 'update'
    case 'suggestion_for_you':
    case 'suggestion_response':
      return 'suggestion'
    default:
      return 'comment'
  }
}

function iconForKind(kind: ActivityFeedIconKind) {
  switch (kind) {
    case 'bookmark':
      return <ProfileBookmarkIcon />
    case 'comment':
      return <ProfileCommentIcon />
    case 'discussion':
      return <ProfileDiscussionIcon />
    case 'path':
      return <ProfilePathIcon />
    case 'progress':
      return <ProfileProgressIcon />
    case 'update':
      return <ProfileAnnouncementIcon />
    case 'suggestion':
      return <ProfileSuggestionIcon />
    case 'join':
    case 'follow':
      return <ProfileJoinIcon />
    case 'like':
      return <ProfileHeartIcon />
    default:
      return <ProfileCommentIcon />
  }
}

/** Type badge — used inside feed target cards. */
export function ActivityFeedTypeIcon({
  kind,
  className
}: {
  kind: ActivityFeedIconKind
  className?: string
}) {
  return (
    <span className={className ?? styles.tabItemIcon} aria-hidden>
      {iconForKind(kind)}
    </span>
  )
}

/** Feed list row without a left-rail icon (icons live in content cards). */
export function ActivityFeedRowShell({
  className,
  children
}: {
  /** Kept for call-site compatibility; icon renders inside the content card. */
  iconKind?: ActivityFeedIconKind
  className?: string
  children: React.ReactNode
}) {
  return (
    <li className={className ?? styles.listItem}>
      <div className={styles.activityFeedItemMain}>{children}</div>
    </li>
  )
}
