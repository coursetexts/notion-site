import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react'

import { useFollowerIds } from '@/hooks/useFollowerIds'
import { useFollowingIds } from '@/hooks/useFollowingIds'
import type { User } from '@supabase/supabase-js'

import { HomeFooterSection } from '@/components/HomeFooterSection'
import { HomeHeader } from '@/components/HomeHeader'
import { ProfileBackArrow } from '@/components/ProfileBackArrow'
import { ProfileSidebarBackHome } from '@/components/ProfileSidebarBackHome'
import { FollowCountDividerDot } from '@/components/FollowCountDividerDot'
import { ProfileInterestsPanel } from '@/components/ProfileInterestsPanel'
import { ProfileKnowledgePanel } from '@/components/ProfileKnowledgePanel'
import { ProfileNotesPanel } from '@/components/ProfileNotesPanel'
import {
  ProfilePersonalLinkAnchorRow,
  ProfilePersonalLinksPanel
} from '@/components/ProfilePersonalLinksPanel'
import {
  ProfileCommunityLearningPathCard,
  ProfileLearningPathCard
} from '@/components/ProfileLearningPathCard'
import { UserLink } from '@/components/UserLink'
import {
  BookmarkNotePreview,
  SiteNotesEditor
} from '@/components/SiteNotesEditor'
import { getCachedAuth, setCachedAuth } from '@/lib/auth-cache'
import { authDebug } from '@/lib/auth-debug'
import {
  type CommunityResourceBookmarkWithCourse,
  getMyCommunityResourceBookmarks
} from '@/lib/community-wall-db'
import { name as siteName } from '@/lib/config'
import {
  type Course as CourseType,
  type Annotation as DbAnnotation,
  type Comment as DbComment,
  getMyAnnotations,
  getMyBookmarks,
  getMyComments,
  removeBookmark
} from '@/lib/course-activity-db'
import {
  type ProfileListItem,
  followUser,
  getFollowersCount,
  getFollowersList,
  getFollowingCount,
  getFollowingList,
  unfollowUser
} from '@/lib/follows'
import {
  followButtonLabel,
  followRelationship
} from '@/lib/follow-relationship'
import { getProfileInterestsByUserId } from '@/lib/profile-interests-db'
import {
  type ProfilePersonalLink,
  listMyPersonalLinks
} from '@/lib/profile-personal-links-db'
import {
  type ProfileFeedItem,
  getProfileFeed
} from '@/lib/profile-feed-db'
import {
  readStoredLearningPaths,
  type StoredLearningPath
} from '@/lib/learning-path-seed'
import {
  learningPathsFromUserLinks,
  mergeOwnedAndSavedLearningPaths
} from '@/lib/learning-path-bookmark-link'
import {
  attachLearningPathKinds,
  listOwnedLearningPaths
} from '@/lib/learning-path-db'
import {
  learningPathCommitmentKey,
  listMyLearningPathCommitments,
  officialCourseCommitmentKey,
  setLearningPathCommitted
} from '@/lib/learning-path-commitments-db'
import { isCourseKindPath } from '@/lib/learning-path-kind-ui'
import {
  type ReplyNotification,
  getReplyNotifications,
  markReplyNotificationsRead
} from '@/lib/reply-notifications'
import {
  listMyCourseLearningPathPins,
  setCourseLearningPathPinned,
  subscribeCourseLearningPathPins,
  type PinnedCourseLearningPath
} from '@/lib/course-learning-path-pins-db'
import { getSupabaseClient } from '@/lib/supabase'
import {
  type UserKnowledgeTopic,
  listMyKnowledgeTopics
} from '@/lib/user-knowledge-topics-db'
import {
  type ProfileTopicNote,
  listMyTopicNotes
} from '@/lib/profile-notes-db'
import {
  type LinkTag,
  type UserLinkWithTag,
  addLink,
  createTag,
  deleteLink,
  getMyLinks,
  getMyTags,
  updateLink
} from '@/lib/user-links'
import styles from '@/styles/profile.module.css'

import { useAuthOptional } from '../contexts/AuthContext'
import {
  emptyNotebookDoc,
  parseStoredNotebookNote,
  serializeStoredNotebookNote,
  storedNotebookNoteHasContent,
  type NotebookDocJson
} from '@/lib/notebook-editor-default'

import {
  EMPTY_BOOKMARK_TAG_FILTER,
  isBookmarkTagFilterActive,
  linkMatchesBookmarkTagFilter,
  newLinkVisibleInBookmarkFilter,
  shouldIncludeCommunityBookmarks,
  toggleBookmarkTagFilter,
  type BookmarkTagFilter
} from '@/lib/bookmark-tag-filter'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

function isInternalHref(href: string) {
  return href.startsWith('/')
}

function FeedTargetLink({
  href,
  children
}: {
  href: string
  children: React.ReactNode
}) {
  if (isInternalHref(href)) {
    return (
      <Link href={href}>
        <a className={styles.inlineLink}>{children}</a>
      </Link>
    )
  }
  return (
    <a
      href={href}
      className={styles.inlineLink}
      target='_blank'
      rel='noopener noreferrer'
    >
      {children}
    </a>
  )
}

function FeedItemNarrative({ item }: { item: ProfileFeedItem }) {
  switch (item.kind) {
    case 'wall_resource':
      return (
        <>
          added <em>{item.resource_title}</em> to the Community Wall on{' '}
          <FeedTargetLink href={item.course_url ?? `/course/${item.course_id}`}>
            {item.course_name}
          </FeedTargetLink>
        </>
      )
    case 'followed_course_bookmark':
      return (
        <>
          saved course{' '}
          <FeedTargetLink href={item.course_url ?? `/course/${item.course_id}`}>
            {item.course_name}
          </FeedTargetLink>
        </>
      )
    case 'followed_resource_bookmark':
      return (
        <>
          bookmarked <em>{item.resource_title}</em> on{' '}
          <FeedTargetLink href={item.course_url ?? `/course/${item.course_id}`}>
            {item.course_name}
          </FeedTargetLink>
        </>
      )
    case 'followed_link_bookmark':
      return (
        <>
          bookmarked{' '}
          <FeedTargetLink href={item.link_href}>{item.link_title}</FeedTargetLink>
        </>
      )
    case 'followed_comment':
      return (
        <>
          {item.is_reply ? 'replied on ' : 'commented on '}
          <FeedTargetLink href={item.target_href}>{item.target_title}</FeedTargetLink>
        </>
      )
    case 'followed_annotation':
      return (
        <>
          posted in Discussions on{' '}
          <FeedTargetLink href={item.target_href}>{item.target_title}</FeedTargetLink>
        </>
      )
    case 'followed_learning_path':
      return (
        <>
          started a new learning path{' '}
          <FeedTargetLink href={item.path_href}>{item.path_title}</FeedTargetLink>
        </>
      )
    case 'followed_path_progress':
      return (
        <>
          explored <em>{item.node_label}</em> on{' '}
          <FeedTargetLink href={item.path_href}>{item.path_title}</FeedTargetLink>
        </>
      )
    case 'suggestion_for_you':
      return (
        <>
          suggested <em>{item.resource_title}</em> for your resource list on{' '}
          <FeedTargetLink href={item.path_href}>{item.path_title}</FeedTargetLink>
        </>
      )
    case 'suggestion_response':
      return (
        <>
          {item.decision === 'accepted' ? 'accepted' : 'declined'} your
          suggestion <em>{item.resource_title}</em> on{' '}
          <FeedTargetLink href={item.path_href}>{item.path_title}</FeedTargetLink>
        </>
      )
    default:
      return null
  }
}

function feedItemExcerpt(item: ProfileFeedItem): string | null {
  if (
    item.kind === 'followed_comment' ||
    item.kind === 'followed_annotation' ||
    item.kind === 'suggestion_for_you'
  ) {
    const body = item.body.trim()
    return body || null
  }
  return null
}

function feedItemMeta(item: ProfileFeedItem): string | null {
  if (item.kind === 'followed_annotation' && item.section_id) {
    return `Section: ${item.section_id}`
  }
  return null
}

type LearningPathItem = StoredLearningPath

type PathsCoursesFilter = 'courses' | 'learning-paths' | 'by-you' | 'committed'

const PATHS_COURSES_FILTERS: { id: PathsCoursesFilter; label: string }[] = [
  { id: 'courses', label: 'Courses' },
  { id: 'learning-paths', label: 'Learning paths' },
  { id: 'by-you', label: 'By you' },
  { id: 'committed', label: 'Committed' }
]

type ActivityFilter = 'feed' | 'yours'

const ACTIVITY_FILTERS: { id: ActivityFilter; label: string }[] = [
  { id: 'feed', label: 'Feed' },
  { id: 'yours', label: 'Your activity' }
]

function nextPathsCoursesFilter(
  current: PathsCoursesFilter | null,
  clicked: PathsCoursesFilter
): PathsCoursesFilter | null {
  return current === clicked ? null : clicked
}

function isCreatedLearningPath(item: StoredLearningPath) {
  return !item.savedLinkId
}

function normalizeSearch(value: string) {
  return value.trim().toLowerCase()
}

function matchesSearch(haystack: string, query: string) {
  if (!query) return true
  return haystack.toLowerCase().includes(query)
}

function storedPathMatchesQuery(item: StoredLearningPath, query: string) {
  if (!query) return true
  return (
    matchesSearch(item.goal, query) ||
    matchesSearch(item.slug.replace(/-/g, ' '), query) ||
    (item.data?.title ? matchesSearch(item.data.title, query) : false)
  )
}

function bookmarkRowMatchesQuery(
  row:
    | { kind: 'link'; link: UserLinkWithTag }
    | { kind: 'community'; data: CommunityResourceBookmarkWithCourse },
  query: string
) {
  if (!query) return true
  if (row.kind === 'link') {
    const link = row.link
    return (
      matchesSearch(link.title ?? '', query) ||
      matchesSearch(link.url, query) ||
      matchesSearch(link.note ?? '', query) ||
      link.tag_names.some((name) => matchesSearch(name, query))
    )
  }
  const { resource, course } = row.data
  return (
    matchesSearch(resource.title, query) ||
    matchesSearch(resource.description ?? '', query) ||
    matchesSearch(resource.link ?? '', query) ||
    matchesSearch(course.name, query) ||
    matchesSearch('community resource', query)
  )
}

function feedItemMatchesQuery(item: ProfileFeedItem, query: string) {
  if (!query) return true
  const fields: string[] = [
    item.actor_display_name ?? '',
    item.kind.replace(/_/g, ' ')
  ]
  switch (item.kind) {
    case 'wall_resource':
      fields.push(item.course_name, item.resource_title, 'community wall')
      break
    case 'followed_course_bookmark':
      fields.push(item.course_name, 'saved course')
      break
    case 'followed_resource_bookmark':
      fields.push(item.course_name, item.resource_title, 'bookmarked')
      break
    case 'followed_link_bookmark':
      fields.push(item.link_title, item.link_href, 'bookmarked')
      break
    case 'followed_comment':
      fields.push(
        item.target_title,
        item.body,
        item.is_reply ? 'replied' : 'commented'
      )
      break
    case 'followed_annotation':
      fields.push(item.target_title, item.body, item.section_id, 'discussion')
      break
    case 'followed_learning_path':
      fields.push(item.path_title, 'learning path')
      break
    case 'followed_path_progress':
      fields.push(item.path_title, item.node_label)
      break
    case 'suggestion_for_you':
      fields.push(item.path_title, item.resource_title, item.body, 'suggested')
      break
    case 'suggestion_response':
      fields.push(item.path_title, item.resource_title, item.decision)
      break
  }
  return fields.some((field) => matchesSearch(field, query))
}

function activityFeedRowMatchesQuery(
  row:
    | { kind: 'feed'; item: ProfileFeedItem }
    | { kind: 'reply'; notification: ReplyNotification },
  query: string
) {
  if (!query) return true
  if (row.kind === 'reply') {
    const notification = row.notification
    return (
      matchesSearch(notification.author_name, query) ||
      matchesSearch(notification.course_name, query) ||
      matchesSearch(notification.body, query) ||
      matchesSearch(notification.section_id ?? '', query) ||
      matchesSearch('replied', query) ||
      matchesSearch(notification.type, query)
    )
  }
  return feedItemMatchesQuery(row.item, query)
}

function myActivityRowMatchesQuery(
  row:
    | { kind: 'comment'; comment: DbComment; course: CourseType }
    | { kind: 'annotation'; annotation: DbAnnotation; course: CourseType },
  query: string
) {
  if (!query) return true
  if (row.kind === 'comment') {
    return (
      matchesSearch('comment', query) ||
      matchesSearch(row.course.name, query) ||
      matchesSearch(row.comment.body, query)
    )
  }
  return (
    matchesSearch('annotation', query) ||
    matchesSearch('discussion', query) ||
    matchesSearch(row.course.name, query) ||
    matchesSearch(row.annotation.body, query) ||
    matchesSearch(row.annotation.section_id ?? '', query)
  )
}

function ProfilePanelSearch({
  id,
  value,
  onChange,
  ariaLabel
}: {
  id: string
  value: string
  onChange: (value: string) => void
  ariaLabel: string
}) {
  return (
    <div className={styles.panelSearchWrap}>
      <input
        id={id}
        type='search'
        className={styles.panelSearchInput}
        placeholder='SEARCH'
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={ariaLabel}
      />
    </div>
  )
}

export default function ProfilePage() {
  const router = useRouter()
  const auth = useAuthOptional()
  const user = auth?.user ?? null
  const profile = auth?.profile ?? null
  const isLoading = auth?.isLoading ?? true

  const cached = getCachedAuth()
  const [resolvedUser, setResolvedUser] = useState<User | null>(
    () => cached.user ?? null
  )
  const [comments, setComments] = useState<
    { comment: DbComment; course: CourseType }[]
  >([])
  const [annotations, setAnnotations] = useState<
    { annotation: DbAnnotation; course: CourseType }[]
  >([])
  const [resourceBookmarks, setResourceBookmarks] = useState<
    CommunityResourceBookmarkWithCourse[]
  >([])
  const [notifications, setNotifications] = useState<ReplyNotification[]>([])
  const [activityLoading, setActivityLoading] = useState(true)
  const [feedItems, setFeedItems] = useState<ProfileFeedItem[]>([])
  const [knowledgeTopics, setKnowledgeTopics] = useState<UserKnowledgeTopic[]>(
    []
  )
  const [knowledgeLoading, setKnowledgeLoading] = useState(true)
  const [topicNotes, setTopicNotes] = useState<ProfileTopicNote[]>([])
  const [notesLoading, setNotesLoading] = useState(true)
  const [mainTab, setMainTab] = useState<
    'learning-path' | 'knowledge' | 'notes' | 'bookmarks' | 'activity'
  >('learning-path')
  const [activitySubTab, setActivitySubTab] = useState<ActivityFilter>('feed')
  const [learningPaths, setLearningPaths] = useState<LearningPathItem[]>([])
  const [unsavePathBusyId, setUnsavePathBusyId] = useState<string | null>(null)
  const [unpinCourseBusyId, setUnpinCourseBusyId] = useState<string | null>(
    null
  )
  const [unsaveOfficialBusyId, setUnsaveOfficialBusyId] = useState<
    string | null
  >(null)
  const [committedKeys, setCommittedKeys] = useState<Set<string>>(
    () => new Set()
  )
  const [commitBusyKey, setCommitBusyKey] = useState<string | null>(null)
  const [courseLearningPaths, setCourseLearningPaths] = useState<
    PinnedCourseLearningPath[]
  >([])
  const [officialCourses, setOfficialCourses] = useState<
    { bookmark: { id: string }; course: CourseType }[]
  >([])
  const [pathsCoursesFilter, setPathsCoursesFilter] =
    useState<PathsCoursesFilter | null>(null)
  const [learningSearch, setLearningSearch] = useState('')
  const [bookmarkSearch, setBookmarkSearch] = useState('')
  const [activitySearch, setActivitySearch] = useState('')
  const [showLearningPathModal, setShowLearningPathModal] = useState(false)
  const [learningPathDraft, setLearningPathDraft] = useState('')
  type ProfileView = 'profile' | 'connections'
  type ConnectionsTab = 'followers' | 'following'
  const [view, setView] = useState<ProfileView>('profile')
  const [connectionsTab, setConnectionsTab] =
    useState<ConnectionsTab>('following')
  const [rowFollowBusyId, setRowFollowBusyId] = useState<string | null>(null)
  const [followingCount, setFollowingCount] = useState(0)
  const [followersCount, setFollowersCount] = useState(0)
  const [followingList, setFollowingList] = useState<ProfileListItem[]>([])
  const [followersList, setFollowersList] = useState<ProfileListItem[]>([])
  const { followingIds, refresh: refreshFollowingIds } = useFollowingIds()
  const { followerIds } = useFollowerIds()
  const [linkTags, setLinkTags] = useState<LinkTag[]>([])
  const [userLinks, setUserLinks] = useState<UserLinkWithTag[]>([])
  const [bookmarkTagFilter, setBookmarkTagFilter] = useState<BookmarkTagFilter>(
    EMPTY_BOOKMARK_TAG_FILTER
  )
  const [showAddLinkModal, setShowAddLinkModal] = useState(false)
  const [linkFormTitle, setLinkFormTitle] = useState('')
  const [linkFormUrl, setLinkFormUrl] = useState('')
  const [linkFormTagIds, setLinkFormTagIds] = useState<string[]>([])
  const [linkFormNoteDoc, setLinkFormNoteDoc] = useState<NotebookDocJson>(
    emptyNotebookDoc
  )
  const [linkFormIsPrivate, setLinkFormIsPrivate] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [showNewTagInput, setShowNewTagInput] = useState(false)
  const [linksLoading, setLinksLoading] = useState(false)
  const [linkSubmitting, setLinkSubmitting] = useState(false)
  const [tagSubmitting, setTagSubmitting] = useState(false)
  const tagSubmittingRef = useRef(false)
  useEffect(() => {
    tagSubmittingRef.current = tagSubmitting
  }, [tagSubmitting])
  type LinkActionType = 'edit-note' | 'add-tag' | 'delete'
  const [linkActionOverlay, setLinkActionOverlay] = useState<{
    type: LinkActionType
    link: UserLinkWithTag
  } | null>(null)
  const [editNoteDoc, setEditNoteDoc] = useState<NotebookDocJson>(
    emptyNotebookDoc
  )
  const [editTagIds, setEditTagIds] = useState<string[]>([])
  const [editIsPrivate, setEditIsPrivate] = useState(false)
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [showPrivateMessageForLinkId, setShowPrivateMessageForLinkId] =
    useState<string | null>(null)
  const [showNoteForLinkId, setShowNoteForLinkId] = useState<string | null>(
    null
  )
  const [profileInterests, setProfileInterests] = useState<string[]>([])
  const [personalLinks, setPersonalLinks] = useState<ProfilePersonalLink[]>([])
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [bioDraft, setBioDraft] = useState('')
  const [bioSaving, setBioSaving] = useState(false)
  const bioSavingRef = useRef(false)
  useEffect(() => {
    bioSavingRef.current = bioSaving
  }, [bioSaving])

  const effectiveUser = user ?? resolvedUser

  const bioText = useMemo(
    () =>
      (
        (effectiveUser?.user_metadata?.bio as string | undefined) ?? ''
      ).trim(),
    [effectiveUser?.user_metadata?.bio]
  )

  const loadActivity = useCallback(async (userId: string) => {
    const [
      commentsRes,
      annotationsRes,
      resourceBookmarksRes,
      notificationRes,
      feedRes,
      fCount,
      fersCount,
      fList,
      fersList
    ] = await Promise.all([
      getMyComments(),
      getMyAnnotations(),
      getMyCommunityResourceBookmarks(),
      getReplyNotifications(userId),
      getProfileFeed(userId),
      getFollowingCount(userId),
      getFollowersCount(userId),
      getFollowingList(userId),
      getFollowersList(userId)
    ])
    setComments(commentsRes)
    setAnnotations(annotationsRes)
    setResourceBookmarks(resourceBookmarksRes)
    setNotifications(notificationRes)
    setFeedItems(feedRes)
    setFollowingCount(fCount)
    setFollowersCount(fersCount)
    setFollowingList(fList)
    setFollowersList(fersList)
    setActivityLoading(false)

    // Mark as read after rendering this fetch so entries can appear as read next time.
    await markReplyNotificationsRead(userId)
    setNotifications((prev) => prev.map((n) => ({ ...n, is_unread: false })))
  }, [])

  const refreshFollowListsAndCounts = useCallback(async () => {
    const uid = effectiveUser?.id
    if (!uid) return
    const [fCount, fersCount, fList, fersList] = await Promise.all([
      getFollowingCount(uid),
      getFollowersCount(uid),
      getFollowingList(uid),
      getFollowersList(uid)
    ])
    setFollowingCount(fCount)
    setFollowersCount(fersCount)
    setFollowingList(fList)
    setFollowersList(fersList)
  }, [effectiveUser?.id])

  const handleConnectionRowFollowToggle = useCallback(
    async (targetUserId: string) => {
      const me = effectiveUser?.id
      if (!me || targetUserId === me || rowFollowBusyId) return
      setRowFollowBusyId(targetUserId)
      try {
        const already = followingIds.has(targetUserId)
        if (already) {
          await unfollowUser(me, targetUserId)
        } else {
          await followUser(me, targetUserId)
        }
        await refreshFollowingIds()
        await refreshFollowListsAndCounts()
      } finally {
        setRowFollowBusyId(null)
      }
    },
    [
      effectiveUser?.id,
      followingIds,
      refreshFollowListsAndCounts,
      refreshFollowingIds,
      rowFollowBusyId
    ]
  )

  const loadLinks = useCallback(async () => {
    setLinksLoading(true)
    const [tags, allLinks] = await Promise.all([getMyTags(), getMyLinks(null)])
    setLinkTags(tags)
    setUserLinks(allLinks)
    setLinksLoading(false)
  }, [])

  const savedBookmarkRows = useMemo(() => {
    type Row =
      | { kind: 'link'; link: UserLinkWithTag }
      | { kind: 'community'; data: CommunityResourceBookmarkWithCourse }
    const rows: Row[] = []
    if (!bookmarkTagFilter.communityOnly) {
      for (const link of userLinks) {
        if (linkMatchesBookmarkTagFilter(link, bookmarkTagFilter)) {
          rows.push({ kind: 'link', link })
        }
      }
    }
    if (shouldIncludeCommunityBookmarks(bookmarkTagFilter)) {
      for (const data of resourceBookmarks) {
        rows.push({ kind: 'community', data })
      }
    }
    rows.sort((a, b) => {
      const ta =
        a.kind === 'link'
          ? a.link.created_at
          : a.data.bookmark.created_at
      const tb =
        b.kind === 'link'
          ? b.link.created_at
          : b.data.bookmark.created_at
      return tb.localeCompare(ta)
    })
    return rows
  }, [userLinks, resourceBookmarks, bookmarkTagFilter])

  const bookmarkQuery = normalizeSearch(bookmarkSearch)
  const visibleBookmarkRows = useMemo(
    () =>
      savedBookmarkRows.filter((row) =>
        bookmarkRowMatchesQuery(row, bookmarkQuery)
      ),
    [savedBookmarkRows, bookmarkQuery]
  )

  const activityFeedRows = useMemo(() => {
    type Row =
      | { kind: 'feed'; item: ProfileFeedItem }
      | { kind: 'reply'; notification: ReplyNotification }
    const rows: Row[] = feedItems.map((item) => ({
      kind: 'feed' as const,
      item
    }))
    for (const notification of notifications) {
      rows.push({ kind: 'reply', notification })
    }
    rows.sort((a, b) => {
      const ta =
        a.kind === 'feed' ? a.item.created_at : a.notification.created_at
      const tb =
        b.kind === 'feed' ? b.item.created_at : b.notification.created_at
      return tb.localeCompare(ta)
    })
    return rows
  }, [feedItems, notifications])

  const activityQuery = normalizeSearch(activitySearch)
  const visibleActivityFeedRows = useMemo(
    () =>
      activityFeedRows.filter((row) =>
        activityFeedRowMatchesQuery(row, activityQuery)
      ),
    [activityFeedRows, activityQuery]
  )

  const myActivityRows = useMemo(() => {
    type Row =
      | {
          kind: 'comment'
          comment: DbComment
          course: CourseType
        }
      | {
          kind: 'annotation'
          annotation: DbAnnotation
          course: CourseType
        }
    const rows: Row[] = [
      ...comments.map((x) => ({ kind: 'comment' as const, ...x })),
      ...annotations.map((x) => ({ kind: 'annotation' as const, ...x }))
    ]
    rows.sort((a, b) => {
      const ta =
        a.kind === 'comment'
          ? a.comment.created_at
          : a.annotation.created_at
      const tb =
        b.kind === 'comment'
          ? b.comment.created_at
          : b.annotation.created_at
      return tb.localeCompare(ta)
    })
    return rows
  }, [comments, annotations])

  const visibleMyActivityRows = useMemo(
    () =>
      myActivityRows.filter((row) =>
        myActivityRowMatchesQuery(row, activityQuery)
      ),
    [myActivityRows, activityQuery]
  )

  const communityLearningPaths = useMemo(
    () =>
      learningPaths.filter(
        (item) => item.kind !== 'research' && !isCourseKindPath(item.kind)
      ),
    [learningPaths]
  )
  const researchLearningPaths = useMemo(
    () => learningPaths.filter((item) => item.kind === 'research'),
    [learningPaths]
  )
  const savedCourseKindPaths = useMemo(() => {
    const pinnedSlugs = new Set(courseLearningPaths.map((item) => item.slug))
    return learningPaths.filter(
      (item) => isCourseKindPath(item.kind) && !pinnedSlugs.has(item.slug)
    )
  }, [learningPaths, courseLearningPaths])
  const learningQuery = normalizeSearch(learningSearch)
  const coursesOnly = pathsCoursesFilter === 'courses'
  const learningPathsOnly = pathsCoursesFilter === 'learning-paths'
  const byYouOnly = pathsCoursesFilter === 'by-you'
  const committedOnly = pathsCoursesFilter === 'committed'
  const filteredCourseLearningPaths = useMemo(
    () =>
      courseLearningPaths.filter((item) => {
        if (byYouOnly) return false
        if (!matchesSearch(item.title, learningQuery)) return false
        if (
          committedOnly &&
          !committedKeys.has(learningPathCommitmentKey(item.slug))
        ) {
          return false
        }
        return true
      }),
    [
      courseLearningPaths,
      learningQuery,
      byYouOnly,
      committedOnly,
      committedKeys
    ]
  )
  const filteredSavedCourseKindPaths = useMemo(
    () =>
      savedCourseKindPaths.filter((item) => {
        if (byYouOnly && !isCreatedLearningPath(item)) return false
        if (!storedPathMatchesQuery(item, learningQuery)) return false
        if (
          committedOnly &&
          !committedKeys.has(learningPathCommitmentKey(item.slug))
        ) {
          return false
        }
        return true
      }),
    [
      savedCourseKindPaths,
      learningQuery,
      byYouOnly,
      committedOnly,
      committedKeys
    ]
  )
  const filteredResearchLearningPaths = useMemo(
    () =>
      researchLearningPaths.filter((item) => {
        if (byYouOnly && !isCreatedLearningPath(item)) return false
        if (!storedPathMatchesQuery(item, learningQuery)) return false
        if (
          committedOnly &&
          !committedKeys.has(learningPathCommitmentKey(item.slug))
        ) {
          return false
        }
        return true
      }),
    [
      researchLearningPaths,
      learningQuery,
      byYouOnly,
      committedOnly,
      committedKeys
    ]
  )
  const filteredCommunityLearningPaths = useMemo(
    () =>
      communityLearningPaths.filter((item) => {
        if (byYouOnly && !isCreatedLearningPath(item)) return false
        if (!storedPathMatchesQuery(item, learningQuery)) return false
        if (
          committedOnly &&
          !committedKeys.has(learningPathCommitmentKey(item.slug))
        ) {
          return false
        }
        return true
      }),
    [
      communityLearningPaths,
      learningQuery,
      byYouOnly,
      committedOnly,
      committedKeys
    ]
  )
  const filteredOfficialCourses = useMemo(
    () =>
      officialCourses.filter(({ course }) => {
        if (byYouOnly) return false
        if (!matchesSearch(course.name, learningQuery)) return false
        if (
          committedOnly &&
          !committedKeys.has(
            officialCourseCommitmentKey(course.notion_page_id)
          )
        ) {
          return false
        }
        return true
      }),
    [officialCourses, learningQuery, byYouOnly, committedOnly, committedKeys]
  )
  const showAllLearningCards = pathsCoursesFilter == null
  const showCoursesGroup =
    showAllLearningCards || coursesOnly || committedOnly
  const showLearningPathsGroup =
    showAllLearningCards || learningPathsOnly || committedOnly || byYouOnly
  const showCourseCards = showCoursesGroup
  const showSavedCourseKindCards = showCoursesGroup || byYouOnly
  const showOfficialCards = showCoursesGroup
  const showResearchCards = showLearningPathsGroup
  const showCommunityCards = showLearningPathsGroup
  const hasAnyCourseCards =
    courseLearningPaths.length > 0 ||
    savedCourseKindPaths.length > 0 ||
    officialCourses.length > 0
  const hasAnyNonCourseLearningCards =
    researchLearningPaths.length > 0 || communityLearningPaths.length > 0
  const hasAnyCreatedCards =
    savedCourseKindPaths.some(isCreatedLearningPath) ||
    researchLearningPaths.some(isCreatedLearningPath) ||
    communityLearningPaths.some(isCreatedLearningPath)
  const hasAnyCommittedCards =
    courseLearningPaths.some((item) =>
      committedKeys.has(learningPathCommitmentKey(item.slug))
    ) ||
    savedCourseKindPaths.some((item) =>
      committedKeys.has(learningPathCommitmentKey(item.slug))
    ) ||
    researchLearningPaths.some((item) =>
      committedKeys.has(learningPathCommitmentKey(item.slug))
    ) ||
    communityLearningPaths.some((item) =>
      committedKeys.has(learningPathCommitmentKey(item.slug))
    ) ||
    officialCourses.some(({ course }) =>
      committedKeys.has(officialCourseCommitmentKey(course.notion_page_id))
    )
  const hasAnyLearningCards =
    hasAnyCourseCards || hasAnyNonCourseLearningCards
  const hasVisibleLearningCards =
    (showCourseCards && filteredCourseLearningPaths.length > 0) ||
    (showSavedCourseKindCards && filteredSavedCourseKindPaths.length > 0) ||
    (showResearchCards && filteredResearchLearningPaths.length > 0) ||
    (showCommunityCards && filteredCommunityLearningPaths.length > 0) ||
    (showOfficialCards && filteredOfficialCourses.length > 0)

  const loadPersonalLinks = useCallback(async () => {
    const list = await listMyPersonalLinks()
    setPersonalLinks(list)
  }, [])

  useEffect(() => {
    if (!effectiveUser) return
    loadLinks()
  }, [effectiveUser, loadLinks])

  useEffect(() => {
    if (!effectiveUser?.id) return
    void getProfileInterestsByUserId(effectiveUser.id).then(setProfileInterests)
  }, [effectiveUser?.id])

  useEffect(() => {
    if (!effectiveUser?.id) {
      setKnowledgeTopics([])
      setKnowledgeLoading(false)
      return
    }
    let cancelled = false
    setKnowledgeLoading(true)
    void listMyKnowledgeTopics().then((topics) => {
      if (cancelled) return
      setKnowledgeTopics(topics)
      setKnowledgeLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [effectiveUser?.id])

  useEffect(() => {
    if (!effectiveUser?.id) {
      setTopicNotes([])
      setNotesLoading(false)
      return
    }
    let cancelled = false
    setNotesLoading(true)
    void listMyTopicNotes().then((notes) => {
      if (cancelled) return
      setTopicNotes(notes)
      setNotesLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [effectiveUser?.id])

  useEffect(() => {
    if (!effectiveUser?.id) return
    void loadPersonalLinks()
  }, [effectiveUser?.id, loadPersonalLinks])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const [owned, links] = await Promise.all([
        listOwnedLearningPaths(),
        getMyLinks()
      ])
      if (cancelled) return
      const merged = await attachLearningPathKinds(
        mergeOwnedAndSavedLearningPaths({
          owned,
          stored: readStoredLearningPaths(),
          saved: learningPathsFromUserLinks(links)
        })
      )
      if (cancelled) return
      setLearningPaths(merged)
    })()
    return () => {
      cancelled = true
    }
  }, [effectiveUser?.id])

  useEffect(() => {
    let cancelled = false
    void listMyLearningPathCommitments().then((keys) => {
      if (!cancelled) setCommittedKeys(new Set(keys))
    })
    return () => {
      cancelled = true
    }
  }, [effectiveUser?.id])

  useEffect(() => {
    if (!effectiveUser?.id) {
      setCourseLearningPaths([])
      setOfficialCourses([])
      return
    }
    let cancelled = false
    const load = async () => {
      const [pins, bookmarks] = await Promise.all([
        listMyCourseLearningPathPins(),
        getMyBookmarks()
      ])
      if (cancelled) return
      setCourseLearningPaths(pins)
      setOfficialCourses(bookmarks)
    }
    void load()
    const unsubscribe = subscribeCourseLearningPathPins(() => {
      void load()
    })
    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [effectiveUser?.id])

  useEffect(() => {
    if (isEditingProfile) setBioDraft(bioText)
  }, [isEditingProfile, bioText])

  const saveBio = async () => {
    const supabase = getSupabaseClient()
    if (!supabase || !effectiveUser) return
    setBioSaving(true)
    const trimmed = bioDraft.trim()
    const { data, error } = await supabase.auth.updateUser({
      data: {
        ...effectiveUser.user_metadata,
        bio: trimmed
      }
    })
    setBioSaving(false)
    if (error) {
      window.alert(error.message)
      return
    }
    if (data.user) {
      setCachedAuth(data.user, getCachedAuth().profile)
      if (!user) setResolvedUser(data.user)
      setBioDraft('')
    }
  }

  const saveProfile = async () => {
    const next = bioDraft.trim()
    if (next !== bioText) {
      await saveBio()
    }
    setIsEditingProfile(false)
  }

  function PencilIcon() {
    return (
      <svg
        xmlns='http://www.w3.org/2000/svg'
        width='14'
        height='14'
        viewBox='0 0 14 14'
        fill='none'
        aria-hidden
      >
        <path
          d='M8.6 2.2l3.2 3.2M3 11.2l2.9-.6 6.1-6.1a.9.9 0 0 0 0-1.3L10.8 2a.9.9 0 0 0-1.3 0L3.4 8.1 3 11.2Z'
          stroke='currentColor'
          strokeWidth='1.2'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
      </svg>
    )
  }

  function CheckIcon() {
    return (
      <svg
        xmlns='http://www.w3.org/2000/svg'
        width='14'
        height='14'
        viewBox='0 0 14 14'
        fill='none'
        aria-hidden
      >
        <path
          d='M11.5 4L6 10l-2.5-2.6'
          stroke='currentColor'
          strokeWidth='1.6'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
      </svg>
    )
  }

  const handleCreateTag = async () => {
    const name = newTagName.trim()
    if (!name || tagSubmitting) return
    setTagSubmitting(true)
    const tag = await createTag(name)
    if (tag) {
      setLinkTags((prev) =>
        [...prev, tag].sort((a, b) => a.name.localeCompare(b.name))
      )
      setNewTagName('')
      setShowNewTagInput(false)
    }
    setTagSubmitting(false)
  }

  const closeAddLinkModal = () => {
    setShowAddLinkModal(false)
    setLinkFormTitle('')
    setLinkFormUrl('')
    setLinkFormTagIds([])
    setLinkFormNoteDoc(emptyNotebookDoc())
    setLinkFormIsPrivate(false)
  }

  const openLearningPathModal = () => {
    setLearningPathDraft('')
    setShowLearningPathModal(true)
  }

  const closeLearningPathModal = () => {
    setShowLearningPathModal(false)
    setLearningPathDraft('')
  }

  const handleCreateLearningPath = (e: React.FormEvent) => {
    e.preventDefault()
    const goal = learningPathDraft.trim()
    if (!goal) return
    closeLearningPathModal()
    void router.push({
      pathname: '/learning-path/new',
      query: { goal }
    })
  }

  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!linkFormUrl.trim() || linkSubmitting) return
    setLinkSubmitting(true)
    const link = await addLink(linkFormUrl, {
      title: linkFormTitle || null,
      tagIds: linkFormTagIds.length ? linkFormTagIds : undefined,
      note: serializeStoredNotebookNote(linkFormNoteDoc),
      isPrivate: linkFormIsPrivate
    })
    if (link) {
      setUserLinks((prev) => {
        if (!newLinkVisibleInBookmarkFilter(link, bookmarkTagFilter)) return prev
        return [link, ...prev]
      })
      closeAddLinkModal()
    }
    setLinkSubmitting(false)
  }

  const handleDeleteLink = async (linkId: string) => {
    const ok = await deleteLink(linkId)
    if (ok) {
      setUserLinks((prev) => prev.filter((l) => l.id !== linkId))
      setLearningPaths((prev) =>
        prev.filter((item) => item.savedLinkId !== linkId)
      )
      setLinkActionOverlay(null)
    }
  }

  const handleUnsaveLearningPath = async (linkId: string) => {
    if (unsavePathBusyId) return
    setUnsavePathBusyId(linkId)
    const ok = await deleteLink(linkId)
    if (ok) {
      setLearningPaths((prev) =>
        prev.filter((item) => item.savedLinkId !== linkId)
      )
      setUserLinks((prev) => prev.filter((l) => l.id !== linkId))
    } else {
      window.alert('Could not unsave this path.')
    }
    setUnsavePathBusyId(null)
  }

  const handleUnpinCourseLearningPath = async (courseId: string) => {
    if (unpinCourseBusyId) return
    setUnpinCourseBusyId(courseId)
    const previous = courseLearningPaths
    setCourseLearningPaths((prev) =>
      prev.filter((item) => item.courseId !== courseId)
    )
    const result = await setCourseLearningPathPinned(courseId, false)
    if (result === null) {
      setCourseLearningPaths(previous)
      window.alert('Could not unsave this path.')
    }
    setUnpinCourseBusyId(null)
  }

  const handleUnsaveOfficialCourse = async (courseId: string) => {
    if (unsaveOfficialBusyId) return
    setUnsaveOfficialBusyId(courseId)
    const previous = officialCourses
    setOfficialCourses((prev) =>
      prev.filter((row) => row.course.notion_page_id !== courseId)
    )
    const ok = await removeBookmark(courseId)
    if (!ok) {
      setOfficialCourses(previous)
      window.alert('Could not unsave this course.')
    }
    setUnsaveOfficialBusyId(null)
  }

  const handleToggleCommit = async (targetKey: string) => {
    if (commitBusyKey) return
    const next = !committedKeys.has(targetKey)
    setCommitBusyKey(targetKey)
    setCommittedKeys((prev) => {
      const keys = new Set(prev)
      if (next) keys.add(targetKey)
      else keys.delete(targetKey)
      return keys
    })
    const ok = await setLearningPathCommitted(targetKey, next)
    if (!ok) {
      setCommittedKeys((prev) => {
        const keys = new Set(prev)
        if (next) keys.delete(targetKey)
        else keys.add(targetKey)
        return keys
      })
      window.alert('Could not update committed.')
    }
    setCommitBusyKey(null)
  }

  const openLinkAction = (type: LinkActionType, link: UserLinkWithTag) => {
    setLinkActionOverlay({ type, link })
    setEditNoteDoc(parseStoredNotebookNote(link.note))
    setEditTagIds(link.tag_ids ? [...link.tag_ids] : [])
    setEditIsPrivate(link.is_private ?? false)
  }

  const closeLinkActionOverlay = () => {
    setLinkActionOverlay(null)
    setEditNoteDoc(emptyNotebookDoc())
    setEditTagIds([])
    setEditIsPrivate(false)
  }

  const handleSaveEditNote = async () => {
    if (
      !linkActionOverlay ||
      linkActionOverlay.type !== 'edit-note' ||
      editSubmitting
    )
      return
    setEditSubmitting(true)
    const updated = await updateLink(linkActionOverlay.link.id, {
      note: serializeStoredNotebookNote(editNoteDoc)
    })
    if (updated) {
      setUserLinks((prev) =>
        prev.map((l) => (l.id === linkActionOverlay.link.id ? updated : l))
      )
      closeLinkActionOverlay()
    }
    setEditSubmitting(false)
  }

  const handleSaveAddTag = async () => {
    if (
      !linkActionOverlay ||
      linkActionOverlay.type !== 'add-tag' ||
      editSubmitting
    )
      return
    setEditSubmitting(true)
    const updated = await updateLink(linkActionOverlay.link.id, {
      tagIds: editTagIds,
      isPrivate: editIsPrivate
    })
    if (updated) {
      setUserLinks((prev) =>
        prev.map((l) => (l.id === linkActionOverlay.link.id ? updated : l))
      )
      closeLinkActionOverlay()
    }
    setEditSubmitting(false)
  }

  useEffect(() => {
    authDebug('profile:effective-user', {
      authUser: user?.id ?? null,
      resolvedUser: resolvedUser?.id ?? null,
      effectiveUser: effectiveUser?.id ?? null,
      isLoading
    })
    if (!isLoading && !effectiveUser) {
      router.replace(`/signin?redirect=${encodeURIComponent('/profile')}`)
    }
  }, [effectiveUser, isLoading, router])

  useEffect(() => {
    setView('profile')
    if (effectiveUser) loadActivity(effectiveUser.id)
    else setActivityLoading(false)
  }, [effectiveUser, loadActivity])

  useEffect(() => {
    if (user) {
      setResolvedUser(null)
      return
    }
    if (resolvedUser) return
    const supabase = getSupabaseClient()
    if (!supabase) return
    let cancelled = false
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!cancelled && session?.user) setResolvedUser(session.user)
    })
    return () => {
      cancelled = true
    }
  }, [user, isLoading, resolvedUser])

  if ((isLoading && !resolvedUser) || !effectiveUser) {
    return (
      <>
        <Head>
          <title>Profile – {siteName}</title>
          <link rel='preconnect' href='https://use.typekit.net' />
          <link rel='preconnect' href='https://p.typekit.net' />
          <link rel='stylesheet' href='https://use.typekit.net/vxh3dki.css' />
          <link rel='preconnect' href='https://fonts.googleapis.com' />
          <link
            rel='stylesheet'
            href='https://fonts.googleapis.com/css2?family=Hanken+Grotesk:ital,wght@0,100..900;1,100..900&display=swap'
          />
        </Head>
        <HomeHeader />
        <div className={styles.pageShell}>
          <div className={styles.loading}>Loading…</div>
        </div>
        <HomeFooterSection />
      </>
    )
  }

  const displayName =
    profile?.display_name ||
    (effectiveUser.user_metadata?.full_name as string | undefined) ||
    (effectiveUser.user_metadata?.name as string | undefined) ||
    effectiveUser.email?.split('@')[0] ||
    'User'
  const avatarUrl =
    profile?.avatar_url ||
    (effectiveUser.user_metadata?.avatar_url as string | undefined)
  return (
    <>
      <Head>
        <title>Profile – {siteName}</title>
        <link rel='preconnect' href='https://use.typekit.net' />
        <link rel='preconnect' href='https://p.typekit.net' />
        <link rel='stylesheet' href='https://use.typekit.net/vxh3dki.css' />
        <link rel='preconnect' href='https://fonts.googleapis.com' />
        <link
          rel='stylesheet'
          href='https://fonts.googleapis.com/css2?family=Hanken+Grotesk:ital,wght@0,100..900;1,100..900&display=swap'
        />
      </Head>
      <HomeHeader />
      <div className={styles.pageShell}>
        <div className={styles.profileGrid}>
          <aside className={styles.profileSidebar}>
            {/* Next 12: default Link legacy behavior drops className; false applies it to <a>. */}
            <ProfileSidebarBackHome />
            <div className={styles.sidebarAvatarWrap}>
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt=''
                  className={styles.sidebarAvatar}
                  width={96}
                  height={96}
                />
              ) : (
                <div className={styles.sidebarAvatarPlaceholder}>
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <h1 className={styles.sidebarName}>{displayName}</h1>
            <div className={styles.sidebarFollowLine}>
              <button
                type='button'
                className={styles.sidebarFollowBtn}
                onClick={() => {
                  setConnectionsTab('following')
                  setView('connections')
                }}
              >
                {followingCount} following
              </button>
              <FollowCountDividerDot />
              <button
                type='button'
                className={styles.sidebarFollowBtn}
                onClick={() => {
                  setConnectionsTab('followers')
                  setView('connections')
                }}
              >
                {followersCount} followers
              </button>
            </div>
            {effectiveUser?.id ? (
              <div className={styles.sidebarProfileMeta}>
                <div className={styles.sidebarProfileMetaPreview}>
                  {isEditingProfile ? (
                    <textarea
                      value={bioDraft}
                      onChange={(e) => setBioDraft(e.target.value)}
                      placeholder='A short line about you…'
                      className={styles.sidebarPersonalBioTextarea}
                      rows={4}
                      maxLength={500}
                      aria-label='Personal bio'
                      autoFocus
                      disabled={bioSaving}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          e.preventDefault()
                          setIsEditingProfile(false)
                        }
                        if (
                          e.key === 'Enter' &&
                          (e.metaKey || e.ctrlKey)
                        ) {
                          e.preventDefault()
                          void saveProfile()
                        }
                      }}
                      title='⌘/Ctrl+Enter to save'
                    />
                  ) : bioText ? (
                    <p className={styles.sidebarBio}>{bioText}</p>
                  ) : null}
                  {isEditingProfile ? (
                    <ProfileInterestsPanel
                      userId={effectiveUser.id}
                      editable
                      initialTags={profileInterests}
                      onTagsChange={setProfileInterests}
                      inline
                    />
                  ) : profileInterests.length > 0 ? (
                    <div className={styles.profileInterestTags}>
                      {profileInterests.map((t) => (
                        <Link
                          key={t}
                          href={{ pathname: '/users', query: { interest: t } }}
                          legacyBehavior={false}
                          className={styles.profileInterestTag}
                        >
                          {t}
                        </Link>
                      ))}
                    </div>
                  ) : null}
                  {isEditingProfile ? (
                    <ProfilePersonalLinksPanel
                      links={personalLinks}
                      editable
                      onRefresh={() => void loadPersonalLinks()}
                      inline
                    />
                  ) : personalLinks.length > 0 ? (
                    <ul className={styles.sidebarPersonalLinksList}>
                      {personalLinks.map((l) => (
                        <li
                          key={l.id}
                          className={styles.sidebarPersonalLinkItem}
                        >
                          <div className={styles.sidebarPersonalLinkCard}>
                            <ProfilePersonalLinkAnchorRow link={l} />
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {!bioText &&
                  profileInterests.length === 0 &&
                  personalLinks.length === 0 &&
                  !isEditingProfile ? (
                    <p className={styles.sidebarMetaPreviewEmpty}>
                      Your bio, interests, and links will appear here.
                    </p>
                  ) : null}
                </div>
                <div className={styles.sidebarEditProfileRow}>
                  <button
                    type='button'
                    className={
                      isEditingProfile
                        ? `${styles.sidebarEditProfileBtn} ${styles.sidebarEditProfileBtnActive}`
                        : styles.sidebarEditProfileBtn
                    }
                    onClick={() => {
                      if (isEditingProfile) {
                        void saveProfile()
                      } else {
                        setIsEditingProfile(true)
                      }
                    }}
                    aria-label={isEditingProfile ? 'Save profile' : 'Edit profile'}
                    title={isEditingProfile ? 'Save profile' : 'Edit profile'}
                    disabled={bioSaving}
                  >
                    {isEditingProfile ? <CheckIcon /> : <PencilIcon />}
                  </button>
                </div>
              </div>
            ) : null}
          </aside>

          <div className={styles.profileMain}>
            {view === 'connections' && (
              <div className={styles.mainPanel}>
                <button
                  type='button'
                  className={styles.backToProfile}
                  onClick={() => setView('profile')}
                >
                  <ProfileBackArrow className={styles.sidebarBackArrow} />
                  Profile
                </button>
                <h2 className={styles.mainSerifTitle}>
                  {connectionsTab === 'followers'
                    ? 'Followers'
                    : 'Following'}
                </h2>
                <nav
                  className={styles.connectionsTabs}
                  role='tablist'
                  aria-label='Followers and following'
                >
                  <button
                    type='button'
                    role='tab'
                    aria-selected={connectionsTab === 'followers'}
                    className={
                      connectionsTab === 'followers'
                        ? styles.connectionsTabActive
                        : styles.connectionsTab
                    }
                    onClick={() => setConnectionsTab('followers')}
                  >
                    Followers
                  </button>
                  <button
                    type='button'
                    role='tab'
                    aria-selected={connectionsTab === 'following'}
                    className={
                      connectionsTab === 'following'
                        ? styles.connectionsTabActive
                        : styles.connectionsTab
                    }
                    onClick={() => setConnectionsTab('following')}
                  >
                    Following
                  </button>
                </nav>
                {connectionsTab === 'followers' ? (
                  followersList.length === 0 ? (
                    <p className={styles.placeholder}>No followers yet.</p>
                  ) : (
                    <ul className={styles.userList}>
                      {followersList.map((u) => {
                        const selfId = effectiveUser?.id
                        const showFollow = !!selfId && u.user_id !== selfId
                        const isFollowingRow = followingIds.has(u.user_id)
                        const busy = rowFollowBusyId === u.user_id
                        const relationship = followRelationship(
                          isFollowingRow,
                          followerIds.has(u.user_id)
                        )
                        return (
                          <li key={u.user_id} className={styles.userListItem}>
                            <a
                              href={`/profile/${u.user_id}`}
                              className={styles.userListLink}
                            >
                              {u.avatar_url ? (
                                <img
                                  src={u.avatar_url}
                                  alt=''
                                  className={styles.userListAvatar}
                                  width={40}
                                  height={40}
                                />
                              ) : (
                                <span
                                  className={styles.userListAvatarPlaceholder}
                                  aria-hidden
                                >
                                  {(u.display_name || 'U')
                                    .charAt(0)
                                    .toUpperCase()}
                                </span>
                              )}
                              <span className={styles.userListLinkText}>
                                {u.display_name || 'User'}
                              </span>
                            </a>
                            {showFollow ? (
                              <button
                                type='button'
                                className={
                                  isFollowingRow
                                    ? `${styles.followingBtn} ${styles.userListFollowBtn}`
                                    : `${styles.followBtn} ${styles.userListFollowBtn}`
                                }
                                disabled={busy || rowFollowBusyId !== null}
                                onClick={() =>
                                  void handleConnectionRowFollowToggle(
                                    u.user_id
                                  )
                                }
                              >
                                {followButtonLabel(relationship, busy)}
                              </button>
                            ) : null}
                          </li>
                        )
                      })}
                    </ul>
                  )
                ) : followingList.length === 0 ? (
                  <p className={styles.placeholder}>
                    Not following anyone yet.
                  </p>
                ) : (
                  <ul className={styles.userList}>
                    {followingList.map((u) => {
                      const selfId = effectiveUser?.id
                      const showFollow = !!selfId && u.user_id !== selfId
                      const isFollowingRow = followingIds.has(u.user_id)
                      const busy = rowFollowBusyId === u.user_id
                      const relationship = followRelationship(
                        isFollowingRow,
                        followerIds.has(u.user_id)
                      )
                      return (
                        <li key={u.user_id} className={styles.userListItem}>
                          <a
                            href={`/profile/${u.user_id}`}
                            className={styles.userListLink}
                          >
                            {u.avatar_url ? (
                              <img
                                src={u.avatar_url}
                                alt=''
                                className={styles.userListAvatar}
                                width={40}
                                height={40}
                              />
                            ) : (
                              <span
                                className={styles.userListAvatarPlaceholder}
                                aria-hidden
                              >
                                {(u.display_name || 'U')
                                  .charAt(0)
                                  .toUpperCase()}
                              </span>
                            )}
                            <span className={styles.userListLinkText}>
                              {u.display_name || 'User'}
                            </span>
                          </a>
                          {showFollow ? (
                            <button
                              type='button'
                              className={
                                isFollowingRow
                                  ? `${styles.followingBtn} ${styles.userListFollowBtn}`
                                  : `${styles.followBtn} ${styles.userListFollowBtn}`
                              }
                              disabled={busy || rowFollowBusyId !== null}
                              onClick={() =>
                                void handleConnectionRowFollowToggle(u.user_id)
                              }
                            >
                              {followButtonLabel(relationship, busy)}
                            </button>
                          ) : null}
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            )}

            {view === 'profile' && (
              <div className={styles.mainPanel}>
                <div className={styles.primaryTabsRow}>
                  <nav
                    className={styles.primaryTabs}
                    role='tablist'
                    aria-label='Profile content'
                  >
                    <button
                      type='button'
                      role='tab'
                      aria-selected={mainTab === 'learning-path'}
                      className={
                        mainTab === 'learning-path'
                          ? styles.primaryTabActive
                          : styles.primaryTab
                      }
                      onClick={() => setMainTab('learning-path')}
                    >
                      Learning
                    </button>
                    <button
                      type='button'
                      role='tab'
                      aria-selected={mainTab === 'knowledge'}
                      className={
                        mainTab === 'knowledge'
                          ? styles.primaryTabActive
                          : styles.primaryTab
                      }
                      onClick={() => setMainTab('knowledge')}
                    >
                      Knowledge
                    </button>
                    <button
                      type='button'
                      role='tab'
                      aria-selected={mainTab === 'notes'}
                      className={
                        mainTab === 'notes'
                          ? styles.primaryTabActive
                          : styles.primaryTab
                      }
                      onClick={() => setMainTab('notes')}
                    >
                      Notes
                    </button>
                    <button
                      type='button'
                      role='tab'
                      aria-selected={mainTab === 'bookmarks'}
                      className={
                        mainTab === 'bookmarks'
                          ? styles.primaryTabActive
                          : styles.primaryTab
                      }
                      onClick={() => setMainTab('bookmarks')}
                    >
                      Bookmarks
                    </button>
                    <button
                      type='button'
                      role='tab'
                      aria-selected={mainTab === 'activity'}
                      className={
                        mainTab === 'activity'
                          ? styles.primaryTabActive
                          : styles.primaryTab
                      }
                      onClick={() => setMainTab('activity')}
                    >
                      Activity
                    </button>
                  </nav>

                  <div className={styles.primaryTabsRightActions} />
                </div>

                {mainTab === 'knowledge' && (
                  <ProfileKnowledgePanel
                    topics={knowledgeTopics}
                    loading={knowledgeLoading}
                    searchId='profile-knowledge-search'
                    emptyMessage='Topics you complete on learning paths will show up here. You can also add them yourself.'
                    canAdd
                    onTopicsChange={setKnowledgeTopics}
                  />
                )}

                {mainTab === 'notes' && (
                  <ProfileNotesPanel
                    notes={topicNotes}
                    loading={notesLoading}
                    onNoteChange={(note) => {
                      setTopicNotes((prev) =>
                        prev.map((item) => (item.id === note.id ? note : item))
                      )
                    }}
                  />
                )}

                {mainTab === 'bookmarks' && (
                  <div className={styles.tabPanel}>
                    <div className={styles.tabPanelHeaderRow}>
                      <h2 className={styles.mainSerifTitle}>
                        Bookmarked Resources
                      </h2>
                      <div className={styles.primaryTabsRightActions}>
                        <button
                          type='button'
                          className={styles.linkFilterBtnNew}
                          onClick={() => setShowNewTagInput(true)}
                        >
                          + New tag
                        </button>
                        <button
                          type='button'
                          className={styles.addLinkBtn}
                          onClick={() => setShowAddLinkModal(true)}
                        >
                          + New Link
                        </button>
                      </div>
                    </div>
                    <div className={styles.section}>
                      <div className={styles.filterSearchBlock}>
                      <ProfilePanelSearch
                        id='profile-bookmarks-search'
                        value={bookmarkSearch}
                        onChange={setBookmarkSearch}
                        ariaLabel='Search bookmarks'
                      />
                      <div className={styles.linkFilterRow}>
                        <div className={styles.linkFilterTagsWrap}>
                          <button
                            type='button'
                            className={
                              !isBookmarkTagFilterActive(bookmarkTagFilter)
                                ? styles.linkFilterBtnActive
                                : styles.linkFilterBtn
                            }
                            onClick={() =>
                              setBookmarkTagFilter(EMPTY_BOOKMARK_TAG_FILTER)
                            }
                          >
                            All
                          </button>
                          {linkTags.map((t) => (
                            <button
                              key={t.id}
                              type='button'
                              aria-pressed={bookmarkTagFilter.tagIds.includes(
                                t.id
                              )}
                              className={
                                bookmarkTagFilter.tagIds.includes(t.id)
                                  ? styles.linkFilterBtnActive
                                  : styles.linkFilterBtn
                              }
                              onClick={() =>
                                setBookmarkTagFilter((prev) =>
                                  toggleBookmarkTagFilter(prev, t.id)
                                )
                              }
                            >
                              {t.name}
                            </button>
                          ))}
                          <button
                            type='button'
                            aria-pressed={bookmarkTagFilter.communityOnly}
                            className={
                              bookmarkTagFilter.communityOnly
                                ? styles.linkFilterBtnActive
                                : styles.linkFilterBtn
                            }
                            onClick={() =>
                              setBookmarkTagFilter({
                                tagIds: [],
                                communityOnly: true
                              })
                            }
                          >
                            Community resource
                          </button>
                          {showNewTagInput ? (
                            <input
                              type='text'
                              className={styles.linkFilterNewTagInput}
                              placeholder='New tag'
                              value={newTagName}
                              aria-label='New tag name'
                              onChange={(e) => setNewTagName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault()
                                  void handleCreateTag()
                                }
                                if (e.key === 'Escape') {
                                  e.preventDefault()
                                  setShowNewTagInput(false)
                                  setNewTagName('')
                                }
                              }}
                              onBlur={() => {
                                window.setTimeout(() => {
                                  if (tagSubmittingRef.current) return
                                  setShowNewTagInput(false)
                                  setNewTagName('')
                                }, 0)
                              }}
                              disabled={tagSubmitting}
                              autoFocus
                            />
                          ) : null}
                        </div>
                      </div>
                      </div>
                      {showAddLinkModal && (
                        <div
                          className={styles.modalBackdrop}
                          onClick={closeAddLinkModal}
                          role='presentation'
                        >
                          <div
                            className={`${styles.modalCard} ${styles.modalCardWide}`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className={styles.modalHeader}>
                              <h3 className={styles.modalTitle}>
                                Add New Bookmark
                              </h3>
                              <button
                                type='button'
                                className={styles.modalClose}
                                onClick={closeAddLinkModal}
                                aria-label='Close'
                              >
                                ×
                              </button>
                            </div>
                            <form
                              className={styles.modalForm}
                              onSubmit={handleAddLink}
                            >
                              <label className={styles.modalLabel}>
                                Title{' '}
                                <input
                                  type='text'
                                  className={styles.modalInput}
                                  placeholder='My Awesome Link'
                                  value={linkFormTitle}
                                  onChange={(e) =>
                                    setLinkFormTitle(e.target.value)
                                  }
                                />
                              </label>
                              <label className={styles.modalLabel}>
                                <span className={styles.modalLabelCaption}>
                                  URL{' '}
                                  <span className={styles.modalRequired}>*</span>
                                </span>
                                <input
                                  type='url'
                                  className={styles.modalInput}
                                  placeholder='https://example.com'
                                  value={linkFormUrl}
                                  onChange={(e) =>
                                    setLinkFormUrl(e.target.value)
                                  }
                                  required
                                />
                              </label>
                              <div className={styles.modalLabel}>
                                Description
                                <SiteNotesEditor
                                  key={
                                    showAddLinkModal
                                      ? 'add-bookmark-note'
                                      : 'add-bookmark-note-closed'
                                  }
                                  value={linkFormNoteDoc}
                                  onChange={setLinkFormNoteDoc}
                                  placeholder='A brief description of this bookmark...'
                                  ariaLabel='Bookmark description'
                                  compact
                                />
                              </div>
                              <div className={styles.modalLabel}>
                                <span>Tags</span>
                                <div
                                  className={styles.tagPillsWrap}
                                  role='group'
                                  aria-label='Select tags'
                                >
                                  {linkTags.map((t) => {
                                    const selected = linkFormTagIds.includes(
                                      t.id
                                    )
                                    return (
                                      <button
                                        key={t.id}
                                        type='button'
                                        className={
                                          selected
                                            ? styles.tagPillSelected
                                            : styles.tagPill
                                        }
                                        onClick={() => {
                                          setLinkFormTagIds((prev) =>
                                            prev.includes(t.id)
                                              ? prev.filter((id) => id !== t.id)
                                              : [...prev, t.id]
                                          )
                                        }}
                                      >
                                        {t.name}
                                      </button>
                                    )
                                  })}
                                  {linkTags.length === 0 && (
                                    <span className={styles.tagPillsEmpty}>
                                      No tags yet. Add one in the filter row.
                                    </span>
                                  )}
                                </div>
                              </div>
                              <label className={styles.modalCheckboxLabel}>
                                <input
                                  type='checkbox'
                                  checked={linkFormIsPrivate}
                                  onChange={(e) =>
                                    setLinkFormIsPrivate(e.target.checked)
                                  }
                                  className={styles.modalCheckbox}
                                />
                                <span>Private – only visible to you</span>
                              </label>
                              <div className={styles.modalActions}>
                                <button
                                  type='button'
                                  className={styles.modalCancelBtn}
                                  onClick={closeAddLinkModal}
                                >
                                  Cancel
                                </button>
                                <button
                                  type='submit'
                                  className={styles.modalSubmitBtn}
                                  disabled={
                                    linkSubmitting || !linkFormUrl.trim()
                                  }
                                >
                                  {linkSubmitting ? '…' : 'Add Bookmark'}
                                </button>
                              </div>
                            </form>
                          </div>
                        </div>
                      )}
                      {linksLoading || activityLoading ? (
                        <p className={styles.placeholder}>Loading links…</p>
                      ) : savedBookmarkRows.length === 0 ? (
                        <p className={styles.placeholder}>
                          No saved links yet. Add a bookmark or save a resource
                          from a course Community Wall.
                        </p>
                      ) : visibleBookmarkRows.length === 0 ? (
                        <p className={styles.placeholder}>
                          No matching bookmarks.
                        </p>
                      ) : (
                        <ul className={styles.userLinksList}>
                          {visibleBookmarkRows.map((row) => {
                            if (row.kind === 'community') {
                              const { bookmark, resource, course } = row.data
                              const rowNoteId = `cr-${bookmark.id}`
                              const courseHref =
                                course.url ?? `/course/${course.notion_page_id}`
                              const raw = resource.link?.trim() ?? ''
                              const primaryHref =
                                raw && /^https?:\/\//i.test(raw)
                                  ? raw
                                  : courseHref
                              const openInNewTab =
                                /^https?:\/\//i.test(primaryHref)
                              let domainLabel: string | null = null
                              try {
                                domainLabel = new URL(
                                  primaryHref,
                                  typeof window !== 'undefined'
                                    ? window.location.origin
                                    : 'https://placeholder.local'
                                ).hostname
                              } catch {
                                domainLabel = null
                              }
                              return (
                                <li
                                  key={rowNoteId}
                                  className={styles.userLinkItem}
                                >
                                  <div className={styles.userLinkItemInner}>
                                    <span
                                      className={styles.userLinkIconWrap}
                                    >
                                      <span
                                        className={styles.userLinkIconBlue}
                                        aria-hidden
                                      >
                                        <svg
                                          xmlns='http://www.w3.org/2000/svg'
                                          width='8'
                                          height='8'
                                          viewBox='0 0 8 8'
                                          fill='none'
                                        >
                                          <path
                                            d='M4.14058 1.91562L4.44058 1.61249C4.70255 1.37372 5.04645 1.24506 5.40081 1.25327C5.75518 1.26147 6.09276 1.4059 6.3434 1.65654C6.59404 1.90718 6.73847 2.24476 6.74667 2.59913C6.75488 2.95349 6.62622 3.29739 6.38745 3.55937L5.44058 4.50312C5.31312 4.63105 5.16166 4.73256 4.99488 4.80183C4.8281 4.87109 4.64929 4.90674 4.4687 4.90674C4.28811 4.90674 4.1093 4.87109 3.94252 4.80183C3.77574 4.73256 3.62428 4.63105 3.49683 4.50312'
                                            stroke='#FDFDFD'
                                            strokeWidth='0.75'
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                          />
                                          <path
                                            d='M3.8594 6.08436L3.5594 6.38749C3.29742 6.62626 2.95352 6.75491 2.59916 6.74671C2.24479 6.7385 1.90721 6.59407 1.65657 6.34343C1.40593 6.09279 1.2615 5.75521 1.2533 5.40085C1.2451 5.04648 1.37375 4.70258 1.61252 4.44061L2.5594 3.49686C2.68685 3.36893 2.83831 3.26742 3.00509 3.19815C3.17187 3.12889 3.35068 3.09323 3.53127 3.09323C3.71186 3.09323 3.89067 3.12889 4.05745 3.19815C4.22423 3.26742 4.37569 3.36893 4.50315 3.49686'
                                            stroke='#FDFDFD'
                                            strokeWidth='0.75'
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                          />
                                        </svg>
                                      </span>
                                    </span>
                                    <div className={styles.userLinkContent}>
                                      <div className={styles.userLinkRow}>
                                        <span
                                          className={styles.userLinkTitleAndDomain}
                                        >
                                          <a
                                            href={primaryHref}
                                            {...(openInNewTab
                                              ? {
                                                  target: '_blank',
                                                  rel: 'noopener noreferrer'
                                                }
                                              : {})}
                                            className={styles.userLinkUrl}
                                          >
                                            {resource.title}
                                          </a>
                                          {domainLabel ? (
                                            <span
                                              className={styles.userLinkDomain}
                                            >
                                              {domainLabel}
                                            </span>
                                          ) : null}
                                        </span>
                                      </div>
                                      <div className={styles.userLinkMeta}>
                                        <div
                                          className={styles.userLinkMetaTags}
                                        >
                                          <span
                                            className={styles.userLinkTag}
                                          >
                                            Community resource
                                          </span>
                                          {resource.description ? (
                                            <button
                                              type='button'
                                              className={
                                                styles.userLinkNoteToggle
                                              }
                                              onClick={() =>
                                                setShowNoteForLinkId((cur) =>
                                                  cur === rowNoteId
                                                    ? null
                                                    : rowNoteId
                                                )
                                              }
                                            >
                                              Note
                                            </button>
                                          ) : null}
                                        </div>
                                        <span
                                          className={styles.userLinkDate}
                                        >
                                          {formatDate(bookmark.created_at)}
                                        </span>
                                        {resource.description &&
                                        showNoteForLinkId === rowNoteId ? (
                                          <p className={styles.userLinkNote}>
                                            {resource.description}
                                          </p>
                                        ) : null}
                                      </div>
                                    </div>
                                  </div>
                                </li>
                              )
                            }
                            const l = row.link
                            return (
                              <li key={l.id} className={styles.userLinkItem}>
                                <div className={styles.userLinkItemInner}>
                                  <span className={styles.userLinkIconWrap}>
                                    {/*
                                      Previous favicon / default icon logic kept for future use:

                                      {faviconDomain ? (
                                        <img
                                          src={getFaviconUrl(faviconDomain)}
                                          alt=''
                                          className={styles.userLinkIcon}
                                          width={20}
                                          height={20}
                                        />
                                      ) : (
                                        <span
                                          className={styles.userLinkIconDefault}
                                          aria-hidden
                                        >
                                          <svg
                                            width='20'
                                            height='20'
                                            viewBox='0 0 24 24'
                                            fill='none'
                                            stroke='currentColor'
                                            strokeWidth='2'
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                          >
                                            <path d='M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71' />
                                            <path d='M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71' />
                                          </svg>
                                        </span>
                                      )}
                                    */}
                                    <span className={styles.userLinkIconBlue} aria-hidden>
                                      <svg
                                        xmlns='http://www.w3.org/2000/svg'
                                        width='8'
                                        height='8'
                                        viewBox='0 0 8 8'
                                        fill='none'
                                      >
                                        <path
                                          d='M4.14058 1.91562L4.44058 1.61249C4.70255 1.37372 5.04645 1.24506 5.40081 1.25327C5.75518 1.26147 6.09276 1.4059 6.3434 1.65654C6.59404 1.90718 6.73847 2.24476 6.74667 2.59913C6.75488 2.95349 6.62622 3.29739 6.38745 3.55937L5.44058 4.50312C5.31312 4.63105 5.16166 4.73256 4.99488 4.80183C4.8281 4.87109 4.64929 4.90674 4.4687 4.90674C4.28811 4.90674 4.1093 4.87109 3.94252 4.80183C3.77574 4.73256 3.62428 4.63105 3.49683 4.50312'
                                          stroke='#FDFDFD'
                                          strokeWidth='0.75'
                                          strokeLinecap='round'
                                          strokeLinejoin='round'
                                        />
                                        <path
                                          d='M3.8594 6.08436L3.5594 6.38749C3.29742 6.62626 2.95352 6.75491 2.59916 6.74671C2.24479 6.7385 1.90721 6.59407 1.65657 6.34343C1.40593 6.09279 1.2615 5.75521 1.2533 5.40085C1.2451 5.04648 1.37375 4.70258 1.61252 4.44061L2.5594 3.49686C2.68685 3.36893 2.83831 3.26742 3.00509 3.19815C3.17187 3.12889 3.35068 3.09323 3.53127 3.09323C3.71186 3.09323 3.89067 3.12889 4.05745 3.19815C4.22423 3.26742 4.37569 3.36893 4.50315 3.49686'
                                          stroke='#FDFDFD'
                                          strokeWidth='0.75'
                                          strokeLinecap='round'
                                          strokeLinejoin='round'
                                        />
                                      </svg>
                                    </span>
                                  </span>
                                  <div className={styles.userLinkContent}>
                                    <div className={styles.userLinkRow}>
                                      <span className={styles.userLinkTitleAndDomain}>
                                        <a
                                          href={l.url}
                                          target='_blank'
                                          rel='noopener noreferrer'
                                          className={styles.userLinkUrl}
                                        >
                                          {l.title || l.url}
                                        </a>
                                        {(() => {
                                          try {
                                            return (
                                              <span className={styles.userLinkDomain}>
                                                {new URL(l.url).hostname}
                                              </span>
                                            )
                                          } catch {
                                            return null
                                          }
                                        })()}
                                      </span>
                                      <div className={styles.userLinkActions}>
                                        <button
                                          type='button'
                                          className={styles.userLinkActionBtn}
                                          onClick={() =>
                                            openLinkAction('edit-note', l)
                                          }
                                          aria-label='Edit note'
                                          title='Edit note'
                                        >
                                          Note
                                        </button>
                                        <button
                                          type='button'
                                          className={styles.userLinkActionBtn}
                                          onClick={() =>
                                            openLinkAction('add-tag', l)
                                          }
                                          aria-label='Add tag'
                                          title='Tag page'
                                        >
                                          Tag
                                        </button>
                                        <button
                                          type='button'
                                          className={styles.userLinkActionBtn}
                                          onClick={() =>
                                            openLinkAction('delete', l)
                                          }
                                          aria-label='Delete link'
                                          title='Delete'
                                        >
                                          Delete
                                        </button>
                                      </div>
                                    </div>
                                    <div className={styles.userLinkMeta}>
                                      <div className={styles.userLinkMetaTags}>
                                        {l.is_private && (
                                          <button
                                            type='button'
                                            className={styles.userLinkTagPrivate}
                                            onClick={() =>
                                              setShowPrivateMessageForLinkId(
                                                (id) =>
                                                  id === l.id ? null : l.id
                                              )
                                            }
                                            title='This link is only visible to you'
                                          >
                                            Private
                                          </button>
                                        )}
                                        {storedNotebookNoteHasContent(l.note) ? (
                                          <button
                                            type='button'
                                            className={styles.userLinkNoteToggle}
                                            onClick={() =>
                                              setShowNoteForLinkId((cur) =>
                                                cur === l.id ? null : l.id
                                              )
                                            }
                                          >
                                            Note
                                          </button>
                                        ) : null}
                                        {l.tag_names?.length > 0 &&
                                          l.tag_names.map((name) => (
                                            <span
                                              key={name}
                                              className={styles.userLinkTag}
                                            >
                                              {name}
                                            </span>
                                          ))}
                                      </div>
                                      <span className={styles.userLinkDate}>
                                        {formatDate(l.created_at)}
                                      </span>
                                      {storedNotebookNoteHasContent(l.note) &&
                                      showNoteForLinkId === l.id ? (
                                        <div
                                          className={`${styles.userLinkNote} ${styles.userLinkNoteRich}`}
                                        >
                                          <BookmarkNotePreview note={l.note} />
                                        </div>
                                      ) : null}
                                    </div>
                                    {showPrivateMessageForLinkId === l.id && (
                                      <p
                                        className={styles.privateMessage}
                                        role='status'
                                      >
                                        This link is only visible to you.
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </li>
                            )
                          })}
                        </ul>
                      )}
                      {linkActionOverlay && (
                        <div
                          className={styles.modalBackdrop}
                          onClick={closeLinkActionOverlay}
                          role='presentation'
                        >
                          <div
                            className={`${styles.actionOverlayCard} ${
                              linkActionOverlay.type === 'edit-note'
                                ? styles.actionOverlayCardWide
                                : ''
                            }`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {linkActionOverlay.type === 'edit-note' && (
                              <>
                                <h4 className={styles.actionOverlayTitle}>
                                  Edit note
                                </h4>
                                <SiteNotesEditor
                                  key={linkActionOverlay.link.id}
                                  value={editNoteDoc}
                                  onChange={setEditNoteDoc}
                                  placeholder='Note (optional)'
                                  ariaLabel='Bookmark note'
                                  compact
                                  className={styles.actionOverlayEditor}
                                />
                                <div className={styles.actionOverlayActions}>
                                  <button
                                    type='button'
                                    className={styles.actionOverlayCancel}
                                    onClick={closeLinkActionOverlay}
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type='button'
                                    className={styles.actionOverlaySave}
                                    onClick={handleSaveEditNote}
                                    disabled={editSubmitting}
                                  >
                                    {editSubmitting ? '…' : 'Save'}
                                  </button>
                                </div>
                              </>
                            )}
                            {linkActionOverlay.type === 'add-tag' && (
                              <>
                                <h4 className={styles.actionOverlayTitle}>
                                  Tag page
                                </h4>
                                <div
                                  className={styles.tagPillsWrap}
                                  role='group'
                                  aria-label='Select tags'
                                >
                                  {linkTags.map((t) => {
                                    const selected = editTagIds.includes(t.id)
                                    return (
                                      <button
                                        key={t.id}
                                        type='button'
                                        className={
                                          selected
                                            ? styles.tagPillSelected
                                            : styles.tagPill
                                        }
                                        onClick={() => {
                                          setEditTagIds((prev) =>
                                            prev.includes(t.id)
                                              ? prev.filter((id) => id !== t.id)
                                              : [...prev, t.id]
                                          )
                                        }}
                                      >
                                        {t.name}
                                      </button>
                                    )
                                  })}
                                  {linkTags.length === 0 && (
                                    <span className={styles.tagPillsEmpty}>
                                      No tags yet.
                                    </span>
                                  )}
                                </div>
                                <label className={styles.actionOverlayCheckbox}>
                                  <input
                                    type='checkbox'
                                    checked={editIsPrivate}
                                    onChange={(e) =>
                                      setEditIsPrivate(e.target.checked)
                                    }
                                    className={
                                      styles.actionOverlayCheckboxInput
                                    }
                                  />
                                  <span>Only visible to you</span>
                                </label>
                                <div className={styles.actionOverlayActions}>
                                  <button
                                    type='button'
                                    className={styles.actionOverlayCancel}
                                    onClick={closeLinkActionOverlay}
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type='button'
                                    className={styles.actionOverlaySave}
                                    onClick={handleSaveAddTag}
                                    disabled={editSubmitting}
                                  >
                                    {editSubmitting ? '…' : 'Save'}
                                  </button>
                                </div>
                              </>
                            )}
                            {linkActionOverlay.type === 'delete' && (
                              <>
                                <h4 className={styles.actionOverlayTitle}>
                                  Delete link?
                                </h4>
                                <p className={styles.actionOverlayText}>
                                  This bookmark will be removed.
                                </p>
                                <div className={styles.actionOverlayActions}>
                                  <button
                                    type='button'
                                    className={styles.actionOverlayCancel}
                                    onClick={closeLinkActionOverlay}
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type='button'
                                    className={styles.actionOverlayDelete}
                                    onClick={() =>
                                      handleDeleteLink(
                                        linkActionOverlay.link.id
                                      )
                                    }
                                  >
                                    Delete
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {mainTab === 'activity' && (
                  <div className={styles.tabPanel}>
                    <h2 className={styles.mainSerifTitle}>Activity</h2>
                    <div className={styles.filterSearchBlock}>
                      <ProfilePanelSearch
                        id='profile-activity-search'
                        value={activitySearch}
                        onChange={setActivitySearch}
                        ariaLabel='Search activity'
                      />
                      <div
                        className={`${styles.linkFilterRow} ${styles.pathsCoursesFilter}`}
                      >
                        <div
                          className={styles.linkFilterTagsWrap}
                          role='group'
                          aria-label='Activity type'
                        >
                          {ACTIVITY_FILTERS.map((filter) => (
                            <button
                              key={filter.id}
                              type='button'
                              aria-pressed={activitySubTab === filter.id}
                              className={
                                activitySubTab === filter.id
                                  ? styles.linkFilterBtnActive
                                  : styles.linkFilterBtn
                              }
                              onClick={() => setActivitySubTab(filter.id)}
                            >
                              {filter.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {activityLoading && (
                      <p className={styles.placeholder}>Loading…</p>
                    )}

                    {!activityLoading &&
                      activitySubTab === 'feed' &&
                      (activityFeedRows.length === 0 ? (
                        <p className={styles.placeholder}>
                          Nothing in your feed yet. Follow people to see their
                          comments, discussions, bookmarks, new learning paths,
                          and progress. Replies to your comments and
                          discussions, plus suggestions on your resource lists,
                          show up here as well.
                        </p>
                      ) : visibleActivityFeedRows.length === 0 ? (
                        <p className={styles.placeholder}>
                          No matching activity.
                        </p>
                      ) : (
                        <ul className={styles.list}>
                          {visibleActivityFeedRows.map((row) => {
                            if (row.kind === 'reply') {
                              const n = row.notification
                              return (
                                <li
                                  key={`reply-${n.id}`}
                                  className={
                                    n.is_unread
                                      ? `${styles.listItem} ${styles.listItemUnread}`
                                      : styles.listItem
                                  }
                                >
                                  <div className={styles.feedCardHead}>
                                    <div className={styles.feedCardActor}>
                                      <UserLink
                                        userId={n.author_id}
                                        displayName={n.author_name}
                                        showFollowingTag={followingIds.has(
                                          n.author_id
                                        )}
                                        showFollowsYouTag={followerIds.has(
                                          n.author_id
                                        )}
                                      />
                                    </div>
                                    <span className={styles.feedCardTime}>
                                      {formatDate(n.created_at)}
                                    </span>
                                  </div>
                                  <div className={styles.feedCardActions}>
                                    <span>replied on </span>
                                    <Link
                                      href={n.course_url ?? `/course/${n.course_id}`}
                                    >
                                      <a className={styles.inlineLink}>
                                        {n.course_name}
                                      </a>
                                    </Link>
                                  </div>
                                  {n.type === 'annotation' && n.section_id ? (
                                    <p className={styles.notificationMeta}>
                                      Section: {n.section_id}
                                    </p>
                                  ) : null}
                                  <p className={styles.listBody}>{n.body}</p>
                                </li>
                              )
                            }
                            const item = row.item
                            const actorLabel =
                              item.actor_display_name?.trim() || 'Someone'
                            const excerpt = feedItemExcerpt(item)
                            const meta = feedItemMeta(item)
                            return (
                              <li key={item.id} className={styles.listItem}>
                                <div className={styles.feedCardHead}>
                                  <div className={styles.feedCardActor}>
                                    <UserLink
                                      userId={item.actor_id}
                                      displayName={actorLabel}
                                      showFollowingTag={followingIds.has(
                                        item.actor_id
                                      )}
                                      showFollowsYouTag={followerIds.has(
                                        item.actor_id
                                      )}
                                    />
                                  </div>
                                  <span className={styles.feedCardTime}>
                                    {formatDate(item.created_at)}
                                  </span>
                                </div>
                                <div className={styles.feedCardActions}>
                                  <FeedItemNarrative item={item} />
                                </div>
                                {meta ? (
                                  <p className={styles.notificationMeta}>
                                    {meta}
                                  </p>
                                ) : null}
                                {excerpt ? (
                                  <p className={styles.listBody}>{excerpt}</p>
                                ) : null}
                              </li>
                            )
                          })}
                        </ul>
                      ))}

                    {!activityLoading &&
                      activitySubTab === 'yours' &&
                      (myActivityRows.length === 0 ? (
                        <p className={styles.placeholder}>
                          No comments or discussions yet. Content you add on
                          course pages will appear here with a Comment or
                          Discussion label.
                        </p>
                      ) : visibleMyActivityRows.length === 0 ? (
                        <p className={styles.placeholder}>
                          No matching activity.
                        </p>
                      ) : (
                        <ul className={styles.list}>
                          {visibleMyActivityRows.map((row) => {
                            if (row.kind === 'comment') {
                              const { comment, course } = row
                              return (
                                <li
                                  key={`comment-${comment.id}`}
                                  className={styles.listItem}
                                >
                                  <Link
                                    href={
                                      course.url ?? `/course/${course.notion_page_id}`
                                    }
                                  >
                                    <a className={styles.listLink}>
                                      <span className={styles.listTitle}>
                                        <span
                                          className={styles.userLinkTag}
                                          aria-label='Comment'
                                        >
                                          Comment
                                        </span>{' '}
                                        {course.name}
                                      </span>
                                      <span className={styles.listMeta}>
                                        {formatDate(comment.created_at)}
                                      </span>
                                    </a>
                                  </Link>
                                  <p className={styles.listBody}>
                                    {comment.body}
                                  </p>
                                </li>
                              )
                            }
                            const { annotation, course } = row
                            return (
                              <li
                                key={`annotation-${annotation.id}`}
                                className={styles.listItem}
                              >
                                <Link
                                  href={
                                    course.url ?? `/course/${course.notion_page_id}`
                                  }
                                >
                                  <a className={styles.listLink}>
                                    <span className={styles.listTitle}>
                                      <span
                                        className={styles.userLinkTag}
                                        aria-label='Discussion'
                                      >
                                        Discussion
                                      </span>{' '}
                                      {course.name}
                                    </span>
                                    <span className={styles.listMeta}>
                                      {formatDate(annotation.created_at)}
                                    </span>
                                  </a>
                                </Link>
                                <p className={styles.notificationMeta}>
                                  Section: {annotation.section_id}
                                </p>
                                <p className={styles.listBody}>
                                  {annotation.body}
                                </p>
                              </li>
                            )
                          })}
                        </ul>
                      ))}

                  </div>
                )}

                {mainTab === 'learning-path' && (
                  <div className={styles.tabPanel}>
                    <div className={styles.tabPanelHeaderRow}>
                      <h2 className={styles.mainSerifTitle}>
                        Learning
                      </h2>
                      {showAllLearningCards ||
                      learningPathsOnly ||
                      byYouOnly ? (
                        <button
                          type='button'
                          className={styles.notebooksCreateBtn}
                          onClick={openLearningPathModal}
                        >
                          + New learning path
                        </button>
                      ) : null}
                    </div>
                    <div className={styles.filterSearchBlock}>
                    <ProfilePanelSearch
                      id='profile-learning-search'
                      value={learningSearch}
                      onChange={setLearningSearch}
                      ariaLabel='Search learning paths and courses'
                    />
                    <div
                      className={`${styles.linkFilterRow} ${styles.pathsCoursesFilter}`}
                    >
                      <div
                        className={styles.linkFilterTagsWrap}
                        role='group'
                        aria-label='Filter learning paths and courses'
                      >
                        {PATHS_COURSES_FILTERS.map((filter) => (
                          <button
                            key={filter.id}
                            type='button'
                            aria-pressed={pathsCoursesFilter === filter.id}
                            className={
                              pathsCoursesFilter === filter.id
                                ? styles.linkFilterBtnActive
                                : styles.linkFilterBtn
                            }
                            onClick={() =>
                              setPathsCoursesFilter((current) =>
                                nextPathsCoursesFilter(current, filter.id)
                              )
                            }
                          >
                            {filter.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    </div>
                    {!showAllLearningCards &&
                    coursesOnly &&
                    !hasAnyCourseCards ? (
                      <p className={styles.placeholder}>
                        No courses yet. Official courses and course learning
                        paths show up here.
                      </p>
                    ) : !showAllLearningCards &&
                      learningPathsOnly &&
                      !hasAnyNonCourseLearningCards ? (
                      <p className={styles.placeholder}>
                        No learning paths yet.
                      </p>
                    ) : byYouOnly && !hasAnyCreatedCards ? (
                      <p className={styles.placeholder}>
                        No learning paths created by you yet.
                      </p>
                    ) : committedOnly && !hasAnyCommittedCards ? (
                      <p className={styles.placeholder}>
                        No committed learning paths yet. Mark a path as
                        Committed to get reminders when you want to finish it.
                      </p>
                    ) : showAllLearningCards && !hasAnyLearningCards ? (
                      <p className={styles.placeholder}>
                        No learning paths or courses yet.
                      </p>
                    ) : !hasVisibleLearningCards ? (
                      <p className={styles.placeholder}>
                        No matching learning paths or courses.
                      </p>
                    ) : (
                      <ul className={styles.learningPathList}>
                        {showCourseCards
                          ? filteredCourseLearningPaths.map((item) => (
                              <li key={item.pinId}>
                                <ProfileLearningPathCard
                                  href={`/learning-path/${item.slug}`}
                                  title={item.title}
                                  onUnsave={() =>
                                    void handleUnpinCourseLearningPath(
                                      item.courseId
                                    )
                                  }
                                  unsaveBusy={
                                    unpinCourseBusyId === item.courseId
                                  }
                                  committed={committedKeys.has(
                                    learningPathCommitmentKey(item.slug)
                                  )}
                                  onToggleCommit={() =>
                                    void handleToggleCommit(
                                      learningPathCommitmentKey(item.slug)
                                    )
                                  }
                                  commitBusy={
                                    commitBusyKey ===
                                    learningPathCommitmentKey(item.slug)
                                  }
                                />
                              </li>
                            ))
                          : null}
                        {showSavedCourseKindCards
                          ? filteredSavedCourseKindPaths.map((item) => (
                              <li key={item.id}>
                                <ProfileCommunityLearningPathCard
                                  item={item}
                                  onUnsave={handleUnsaveLearningPath}
                                  unsaveBusy={
                                    unsavePathBusyId === item.savedLinkId
                                  }
                                  committed={committedKeys.has(
                                    learningPathCommitmentKey(item.slug)
                                  )}
                                  onToggleCommit={(slug) =>
                                    void handleToggleCommit(
                                      learningPathCommitmentKey(slug)
                                    )
                                  }
                                  commitBusy={
                                    commitBusyKey ===
                                    learningPathCommitmentKey(item.slug)
                                  }
                                />
                              </li>
                            ))
                          : null}
                        {showResearchCards
                          ? filteredResearchLearningPaths.map((item) => (
                              <li key={item.id}>
                                <ProfileCommunityLearningPathCard
                                  item={item}
                                  onUnsave={handleUnsaveLearningPath}
                                  unsaveBusy={
                                    unsavePathBusyId === item.savedLinkId
                                  }
                                  committed={committedKeys.has(
                                    learningPathCommitmentKey(item.slug)
                                  )}
                                  onToggleCommit={(slug) =>
                                    void handleToggleCommit(
                                      learningPathCommitmentKey(slug)
                                    )
                                  }
                                  commitBusy={
                                    commitBusyKey ===
                                    learningPathCommitmentKey(item.slug)
                                  }
                                />
                              </li>
                            ))
                          : null}
                        {showCommunityCards
                          ? filteredCommunityLearningPaths.map((item) => (
                              <li key={item.id}>
                                <ProfileCommunityLearningPathCard
                                  item={item}
                                  onUnsave={handleUnsaveLearningPath}
                                  unsaveBusy={
                                    unsavePathBusyId === item.savedLinkId
                                  }
                                  committed={committedKeys.has(
                                    learningPathCommitmentKey(item.slug)
                                  )}
                                  onToggleCommit={(slug) =>
                                    void handleToggleCommit(
                                      learningPathCommitmentKey(slug)
                                    )
                                  }
                                  commitBusy={
                                    commitBusyKey ===
                                    learningPathCommitmentKey(item.slug)
                                  }
                                />
                              </li>
                            ))
                          : null}
                        {showOfficialCards
                          ? filteredOfficialCourses.map(({ bookmark, course }) => (
                              <li key={bookmark.id}>
                                <ProfileLearningPathCard
                                  href={
                                    course.url ??
                                    `/course/${course.notion_page_id}`
                                  }
                                  title={course.name}
                                  onUnsave={() =>
                                    void handleUnsaveOfficialCourse(
                                      course.notion_page_id
                                    )
                                  }
                                  unsaveBusy={
                                    unsaveOfficialBusyId ===
                                    course.notion_page_id
                                  }
                                  committed={committedKeys.has(
                                    officialCourseCommitmentKey(
                                      course.notion_page_id
                                    )
                                  )}
                                  onToggleCommit={() =>
                                    void handleToggleCommit(
                                      officialCourseCommitmentKey(
                                        course.notion_page_id
                                      )
                                    )
                                  }
                                  commitBusy={
                                    commitBusyKey ===
                                    officialCourseCommitmentKey(
                                      course.notion_page_id
                                    )
                                  }
                                />
                              </li>
                            ))
                          : null}
                      </ul>
                    )}
                    {showLearningPathModal && (
                      <div
                        className={styles.modalBackdrop}
                        role='presentation'
                        onMouseDown={(e) => {
                          if (e.target === e.currentTarget) {
                            closeLearningPathModal()
                          }
                        }}
                      >
                        <div
                          className={styles.modalCard}
                          role='dialog'
                          aria-modal='true'
                          aria-labelledby='learning-path-modal-title'
                          onMouseDown={(e) => e.stopPropagation()}
                        >
                          <div className={styles.modalHeader}>
                            <h2
                              id='learning-path-modal-title'
                              className={styles.modalTitle}
                            >
                              What do you want to learn?
                            </h2>
                            <button
                              type='button'
                              className={styles.modalClose}
                              onClick={closeLearningPathModal}
                              aria-label='Close'
                            >
                              ×
                            </button>
                          </div>
                          <form
                            className={styles.modalForm}
                            onSubmit={handleCreateLearningPath}
                          >
                            <label className={styles.modalLabel}>
                              <span className={styles.modalLabelCaption}>
                                Your goal
                              </span>
                              <textarea
                                className={styles.modalTextarea}
                                value={learningPathDraft}
                                onChange={(e) =>
                                  setLearningPathDraft(e.target.value)
                                }
                                placeholder='I want to…'
                                rows={4}
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Escape') {
                                    closeLearningPathModal()
                                  }
                                }}
                              />
                            </label>
                            <div className={styles.modalActions}>
                              <button
                                type='button'
                                className={styles.modalCancelBtn}
                                onClick={closeLearningPathModal}
                              >
                                Cancel
                              </button>
                              <button
                                type='submit'
                                className={styles.modalSubmitBtn}
                                disabled={!learningPathDraft.trim()}
                              >
                                Continue
                              </button>
                            </div>
                          </form>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <HomeFooterSection />
    </>
  )
}
