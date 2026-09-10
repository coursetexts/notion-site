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

/** Left-rail type badge for Activity feed / Your activity rows. */
export function ActivityFeedTypeIcon({
  kind
}: {
  kind: ActivityFeedIconKind
}) {
  return (
    <span className={styles.tabItemIcon} aria-hidden>
      {iconForKind(kind)}
    </span>
  )
}

export function ActivityFeedRowShell({
  iconKind,
  className,
  children
}: {
  iconKind: ActivityFeedIconKind
  className?: string
  children: React.ReactNode
}) {
  return (
    <li className={className ?? styles.listItem}>
      <div className={styles.tabItemRow}>
        <ActivityFeedTypeIcon kind={iconKind} />
        <div className={styles.activityFeedItemMain}>{children}</div>
      </div>
    </li>
  )
}
