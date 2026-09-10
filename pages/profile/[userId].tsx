import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { useAuthOptional } from '@/contexts/AuthContext'
import { useFollowerIds } from '@/hooks/useFollowerIds'
import { useFollowingIds } from '@/hooks/useFollowingIds'

import {
  ActivityFeedThread,
  type ActivityFeedTurn
} from '@/components/ActivityFeedQuoteBody'
import { ActivityFeedRowShell } from '@/components/ActivityFeedTypeIcon'
import { FollowCountDividerDot } from '@/components/FollowCountDividerDot'
import { HomeFooterSection } from '@/components/HomeFooterSection'
import { HomeHeader } from '@/components/HomeHeader'
import { ProfileBackArrow } from '@/components/ProfileBackArrow'
import { ProfileSidebarBackHome } from '@/components/ProfileSidebarBackHome'
import { ProfileInterestsPanel } from '@/components/ProfileInterestsPanel'
import { ProfilePublicSummary } from '@/components/ProfilePublicSummary'
import {
  ProfileCommunityLearningPathCard
} from '@/components/ProfileLearningPathCard'
import { ProfileKnowledgePanel } from '@/components/ProfileKnowledgePanel'
import { ProfilePersonalLinksPopover } from '@/components/ProfilePersonalLinksPopover'
import { ProfileUpdatesTab } from '@/components/ProfileUpdatesTab'
import { ProfileBookmarkIcon } from '@/components/ProfileTabItemIcons'
import { BookmarkNotePreview } from '@/components/SiteNotesEditor'
import { UserLink } from '@/components/UserLink'
import { name as siteName } from '@/lib/config'
import type { Annotation, Comment, Course } from '@/lib/course-activity-db'
import {
  type ProfileListItem,
  type PublicProfile,
  followUser,
  getAnnotationsByUser,
  getCommentsByUser,
  getFollowStatus,
  getFollowersCount,
  getFollowersList,
  getFollowingCount,
  getFollowingList,
  getProfileByUserId,
  unfollowUser
} from '@/lib/follows'
import { getProfileInterestsByUserId } from '@/lib/profile-interests-db'
import {
  type UserKnowledgeTopic,
  listKnowledgeTopicsByUserId
} from '@/lib/user-knowledge-topics-db'
import {
  type ProfilePersonalLink,
  listPersonalLinksByUserId
} from '@/lib/profile-personal-links-db'
import {
  notebookNoteWithAttribution,
  storedNotebookNoteHasContent
} from '@/lib/notebook-editor-default'
import {
  learningPathsFromUserLinks,
  mergeOwnedAndSavedLearningPaths
} from '@/lib/learning-path-bookmark-link'
import {
  attachLearningPathBylines,
  attachLearningPathKinds,
  listOwnedLearningPathsByUserId
} from '@/lib/learning-path-db'
import {
  learningPathCommitmentKey,
  listLearningPathCommitmentKeysForUser
} from '@/lib/learning-path-commitments-db'
import { isCourseKindPath } from '@/lib/learning-path-kind-ui'
import {
  followButtonLabel,
  followRelationship
} from '@/lib/follow-relationship'
import { readStoredLearningPaths, type StoredLearningPath } from '@/lib/learning-path-seed'
import {
  type LinkTag,
  type UserLinkWithTag,
  addLink,
  getLinkTagsByUserId,
  getLinksByUserId,
  getMyLinks
} from '@/lib/user-links'
import styles from '@/styles/profile.module.css'

import {
  EMPTY_BOOKMARK_TAG_FILTER,
  isBookmarkTagFilterActive,
  linkMatchesBookmarkTagFilter,
  toggleBookmarkTagFilter,
  type BookmarkTagFilter
} from '@/lib/bookmark-tag-filter'

/** Bookmark glyph on public profile saved-link rows */
function ProfileSaveBookmarkIcon({ filled }: { filled: boolean }) {
  if (filled) {
    return (
      <svg
        xmlns='http://www.w3.org/2000/svg'
        width='14'
        height='14'
        viewBox='0 0 14 16'
        fill='none'
        aria-hidden
      >
        <path
          d='M2.75 2.25h8.5v10.85L7 9.35l-4.25 3.75V2.25z'
          fill='currentColor'
        />
      </svg>
    )
  }
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='14'
      height='14'
      viewBox='0 0 14 16'
      fill='none'
      aria-hidden
    >
      <path
        d='M2.75 2.25h8.5v10.85L7 9.35l-4.25 3.75V2.25z'
        fill='none'
        stroke='currentColor'
        strokeWidth='1.05'
        strokeLinejoin='round'
      />
    </svg>
  )
}

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

function FeedSectionUnderline({ sectionId }: { sectionId: string }) {
  const label = sectionId.replace(/-/g, ' ').trim()
  if (!label) return null
  return <span className={styles.feedSectionUnderline}>{label}</span>
}

function feedActorAvatar(name: string, avatarUrl?: string | null) {
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
      {(name || 'U').charAt(0).toUpperCase()}
    </span>
  )
}

function feedActorNode(
  actorUserId: string,
  name: string,
  followingIds: Set<string>,
  followerIds: Set<string>,
  avatarUrl?: string | null
) {
  return (
    <span className={styles.feedThreadActor}>
      {feedActorAvatar(name, avatarUrl)}
      <UserLink
        userId={actorUserId}
        displayName={name}
        showFollowingTag={followingIds.has(actorUserId)}
        showFollowsYouTag={followerIds.has(actorUserId)}
      />
    </span>
  )
}

type PathsCoursesFilter = 'courses' | 'learning-paths' | 'committed'

const PATHS_COURSES_FILTERS: { id: PathsCoursesFilter; label: string }[] = [
  { id: 'courses', label: 'Courses' },
  { id: 'learning-paths', label: 'Learning paths' },
  { id: 'committed', label: 'Committed' }
]

function nextPathsCoursesFilter(
  current: PathsCoursesFilter | null,
  clicked: PathsCoursesFilter
): PathsCoursesFilter | null {
  return current === clicked ? null : clicked
}

const profileFontLinks = (
  <>
    <link rel='preconnect' href='https://use.typekit.net' />
    <link rel='preconnect' href='https://p.typekit.net' />
    <link rel='stylesheet' href='https://use.typekit.net/vxh3dki.css' />
    <link rel='preconnect' href='https://fonts.googleapis.com' />
    <link
      rel='stylesheet'
      href='https://fonts.googleapis.com/css2?family=Hanken+Grotesk:ital,wght@0,100..900;1,100..900&display=swap'
    />
  </>
)

export default function PublicProfilePage() {
  const router = useRouter()
  const { userId: routeUserId } = router.query
  const userId = typeof routeUserId === 'string' ? routeUserId : null
  const auth = useAuthOptional()
  const currentUserId = auth?.user?.id ?? null

  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followingCount, setFollowingCount] = useState(0)
  const [followersCount, setFollowersCount] = useState(0)
  const [followingList, setFollowingList] = useState<ProfileListItem[]>([])
  const [followersList, setFollowersList] = useState<ProfileListItem[]>([])
  const [userLinks, setUserLinks] = useState<UserLinkWithTag[]>([])
  const [communityLearningPaths, setCommunityLearningPaths] = useState<
    StoredLearningPath[]
  >([])
  const [committedKeys, setCommittedKeys] = useState<Set<string>>(
    () => new Set()
  )
  const [profileLinkTags, setProfileLinkTags] = useState<LinkTag[]>([])
  const [bookmarkTagFilter, setBookmarkTagFilter] = useState<BookmarkTagFilter>(
    EMPTY_BOOKMARK_TAG_FILTER
  )
  const [showNoteForLinkId, setShowNoteForLinkId] = useState<string | null>(
    null
  )
  const savedProfileLinks = userLinks

  const profileBookmarkTagsInUse = useMemo(() => {
    const used = new Set<string>()
    for (const l of savedProfileLinks) {
      for (const tid of l.tag_ids || []) used.add(tid)
    }
    return profileLinkTags.filter((t) => used.has(t.id))
  }, [profileLinkTags, savedProfileLinks])

  const filteredPublicSavedLinks = useMemo(
    () =>
      savedProfileLinks.filter((l) =>
        linkMatchesBookmarkTagFilter(l, bookmarkTagFilter)
      ),
    [savedProfileLinks, bookmarkTagFilter]
  )

  const publicSavedBookmarkRows = useMemo(() => {
    const rows = [...filteredPublicSavedLinks]
    rows.sort((a, b) => b.created_at.localeCompare(a.created_at))
    return rows
  }, [filteredPublicSavedLinks])

  const showPublicBookmarkTagFilters =
    profileBookmarkTagsInUse.length > 0 || savedProfileLinks.length > 0

  const [personalLinks, setPersonalLinks] = useState<ProfilePersonalLink[]>([])
  const [comments, setComments] = useState<
    { comment: Comment; course: Course }[]
  >([])
  const [annotations, setAnnotations] = useState<
    { annotation: Annotation; course: Course }[]
  >([])

  const publicActivityRows = useMemo(() => {
    type Row =
      | { kind: 'comment'; comment: Comment; course: Course }
      | { kind: 'annotation'; annotation: Annotation; course: Course }
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

  const publicCoursePaths = useMemo(
    () => communityLearningPaths.filter((item) => isCourseKindPath(item.kind)),
    [communityLearningPaths]
  )
  const publicCommunityPaths = useMemo(
    () =>
      communityLearningPaths.filter(
        (item) => item.kind !== 'research' && !isCourseKindPath(item.kind)
      ),
    [communityLearningPaths]
  )
  const publicResearchPaths = useMemo(
    () => communityLearningPaths.filter((item) => item.kind === 'research'),
    [communityLearningPaths]
  )

  const [profileInterestTags, setProfileInterestTags] = useState<string[]>([])
  const [mainTab, setMainTab] = useState<
    'learning-path' | 'knowledge' | 'bookmarks' | 'activity'
  >('learning-path')
  const [knowledgeTopics, setKnowledgeTopics] = useState<UserKnowledgeTopic[]>(
    []
  )
  const [pathsCoursesFilter, setPathsCoursesFilter] =
    useState<PathsCoursesFilter | null>(null)
  const showAllLearningCards = pathsCoursesFilter == null
  const coursesOnly = pathsCoursesFilter === 'courses'
  const learningPathsOnly = pathsCoursesFilter === 'learning-paths'
  const committedOnly = pathsCoursesFilter === 'committed'
  const showCoursesGroup =
    showAllLearningCards || coursesOnly || committedOnly
  const showLearningPathsGroup =
    showAllLearningCards || learningPathsOnly || committedOnly

  const visiblePublicCoursePaths = useMemo(() => {
    if (!committedOnly) return publicCoursePaths
    return publicCoursePaths.filter((item) =>
      committedKeys.has(learningPathCommitmentKey(item.slug))
    )
  }, [publicCoursePaths, committedOnly, committedKeys])

  const visiblePublicResearchPaths = useMemo(() => {
    if (!committedOnly) return publicResearchPaths
    return publicResearchPaths.filter((item) =>
      committedKeys.has(learningPathCommitmentKey(item.slug))
    )
  }, [publicResearchPaths, committedOnly, committedKeys])

  const visiblePublicCommunityPaths = useMemo(() => {
    if (!committedOnly) return publicCommunityPaths
    return publicCommunityPaths.filter((item) =>
      committedKeys.has(learningPathCommitmentKey(item.slug))
    )
  }, [publicCommunityPaths, committedOnly, committedKeys])

  const showCourseCards = showCoursesGroup
  const showResearchCards = showLearningPathsGroup
  const showCommunityCards = showLearningPathsGroup
  const hasAnyPublicCourseCards = visiblePublicCoursePaths.length > 0
  const hasAnyPublicNonCourseCards =
    visiblePublicCommunityPaths.length > 0 ||
    visiblePublicResearchPaths.length > 0
  const hasAnyPublicLearningCards =
    hasAnyPublicCourseCards || hasAnyPublicNonCourseCards
  const hasAnyCommittedCards = communityLearningPaths.some((item) =>
    committedKeys.has(learningPathCommitmentKey(item.slug))
  )
  const [loading, setLoading] = useState(true)
  const [followLoading, setFollowLoading] = useState(false)
  const [notFound, setNotFound] = useState(false)
  type ProfileView = 'profile' | 'connections'
  type ConnectionsTab = 'followers' | 'following'
  const [view, setView] = useState<ProfileView>('profile')
  const [connectionsTab, setConnectionsTab] =
    useState<ConnectionsTab>('following')
  const [rowFollowBusyId, setRowFollowBusyId] = useState<string | null>(null)
  const { followingIds, refresh: refreshFollowingIds } = useFollowingIds()
  const { followerIds } = useFollowerIds()

  const [viewerSavedLinkUrls, setViewerSavedLinkUrls] = useState<Set<string>>(
    () => new Set()
  )
  const [viewerCopyTargetsLoaded, setViewerCopyTargetsLoaded] =
    useState(false)
  const [copyBookmarkBusyKey, setCopyBookmarkBusyKey] = useState<
    string | null
  >(null)

  const loadViewerBookmarkCopyState = useCallback(async () => {
    if (!currentUserId) {
      setViewerSavedLinkUrls(new Set())
      setViewerCopyTargetsLoaded(false)
      return
    }
    const allLinks = await getMyLinks(null)
    const urls = new Set<string>()
    for (const link of allLinks) {
      urls.add(link.url.trim())
    }
    setViewerSavedLinkUrls(urls)
    setViewerCopyTargetsLoaded(true)
  }, [currentUserId])

  useEffect(() => {
    void loadViewerBookmarkCopyState()
  }, [loadViewerBookmarkCopyState])

  const handleCopyProfileLinkBookmark = useCallback(
    async (l: UserLinkWithTag) => {
      if (!currentUserId) return
      const key = `link-${l.id}`
      if (copyBookmarkBusyKey) return
      const url = l.url.trim()
      if (viewerSavedLinkUrls.has(url)) return
      setCopyBookmarkBusyKey(key)
      try {
        const row = await addLink(url, {
          title: l.title,
          note: storedNotebookNoteHasContent(l.note)
            ? notebookNoteWithAttribution(l.note, "(from someone's profile)")
            : notebookNoteWithAttribution(null, 'Saved from a profile')
        })
        if (!row) {
          await loadViewerBookmarkCopyState()
          window.alert(
            'Could not add bookmark. It may already be in your list.'
          )
          return
        }
        setViewerSavedLinkUrls((prev) => {
          const next = new Set(prev)
          next.add(url)
          return next
        })
      } finally {
        setCopyBookmarkBusyKey(null)
      }
    },
    [
      currentUserId,
      copyBookmarkBusyKey,
      viewerSavedLinkUrls,
      loadViewerBookmarkCopyState
    ]
  )

  const loadProfile = useCallback(
    async (uid: string) => {
      setLoading(true)
      setNotFound(false)
      setProfileInterestTags([])
      setBookmarkTagFilter(EMPTY_BOOKMARK_TAG_FILTER)
      const [
        p,
        followStatus,
        fCount,
        fersCount,
        fList,
        fersList,
        links,
        linkTags,
        personal,
        c,
        a,
        interestTags,
        ownedPaths,
        knowledge,
        commitmentKeys
      ] = await Promise.all([
        getProfileByUserId(uid),
        currentUserId ? getFollowStatus(currentUserId, uid) : false,
        getFollowingCount(uid),
        getFollowersCount(uid),
        getFollowingList(uid),
        getFollowersList(uid),
        getLinksByUserId(uid),
        getLinkTagsByUserId(uid),
        listPersonalLinksByUserId(uid),
        getCommentsByUser(uid),
        getAnnotationsByUser(uid),
        getProfileInterestsByUserId(uid),
        listOwnedLearningPathsByUserId(uid, currentUserId === uid),
        listKnowledgeTopicsByUserId(uid),
        listLearningPathCommitmentKeysForUser(uid)
      ])
      if (!p) {
        setProfile(null)
        setPersonalLinks([])
        setProfileLinkTags([])
        setCommunityLearningPaths([])
        setCommittedKeys(new Set())
        setKnowledgeTopics([])
        setNotFound(true)
        setLoading(false)
        return
      }
      setProfile(p)
      setIsFollowing(followStatus)
      setFollowingCount(fCount)
      setFollowersCount(fersCount)
      setFollowingList(fList)
      setFollowersList(fersList)
      setUserLinks(links)
      setProfileLinkTags(linkTags)
      setPersonalLinks(personal)
      setComments(c)
      setAnnotations(a)
      setProfileInterestTags(interestTags)
      setKnowledgeTopics(knowledge)
      setCommittedKeys(new Set(commitmentKeys))
      setCommunityLearningPaths(
        await attachLearningPathBylines(
          await attachLearningPathKinds(
            mergeOwnedAndSavedLearningPaths({
              owned: ownedPaths,
              stored:
                currentUserId === uid ? readStoredLearningPaths() : undefined,
              saved: learningPathsFromUserLinks(links)
            })
          )
        )
      )
      setLoading(false)
    },
    [currentUserId]
  )

  const refreshPublicConnectionLists = useCallback(async () => {
    if (!userId) return
    const [fCount, fersCount, fList, fersList] = await Promise.all([
      getFollowingCount(userId),
      getFollowersCount(userId),
      getFollowingList(userId),
      getFollowersList(userId)
    ])
    setFollowingCount(fCount)
    setFollowersCount(fersCount)
    setFollowingList(fList)
    setFollowersList(fersList)
  }, [userId])

  const handleConnectionRowFollowToggle = useCallback(
    async (targetUserId: string) => {
      if (
        !currentUserId ||
        targetUserId === currentUserId ||
        rowFollowBusyId
      ) {
        return
      }
      setRowFollowBusyId(targetUserId)
      try {
        const already = followingIds.has(targetUserId)
        if (already) {
          await unfollowUser(currentUserId, targetUserId)
        } else {
          await followUser(currentUserId, targetUserId)
        }
        await refreshFollowingIds()
        await refreshPublicConnectionLists()
      } finally {
        setRowFollowBusyId(null)
      }
    },
    [
      currentUserId,
      followingIds,
      refreshFollowingIds,
      refreshPublicConnectionLists,
      rowFollowBusyId
    ]
  )

  useEffect(() => {
    if (!userId) return
    setView('profile')
    if (currentUserId && userId === currentUserId) {
      router.replace('/profile')
      return
    }
    loadProfile(userId)
  }, [userId, currentUserId, router, loadProfile])

  const handleFollowToggle = async () => {
    if (!currentUserId || !userId || followLoading) return
    setFollowLoading(true)
    if (isFollowing) {
      const ok = await unfollowUser(currentUserId, userId)
      if (ok) {
        setIsFollowing(false)
        setFollowersCount((n) => Math.max(0, n - 1))
      }
    } else {
      const ok = await followUser(currentUserId, userId)
      if (ok) {
        setIsFollowing(true)
        setFollowersCount((n) => n + 1)
      }
    }
    setFollowLoading(false)
  }

  const displayName = profile?.display_name || 'User'
  if (!userId) {
    return (
      <>
        <Head>
          <title>Profile – {siteName}</title>
          {profileFontLinks}
        </Head>
        <HomeHeader />
        <div className={styles.pageShell}>
          <div className={styles.loading}>Loading…</div>
        </div>
        <HomeFooterSection />
      </>
    )
  }

  if (notFound) {
    return (
      <>
        <Head>
          <title>Profile not found – {siteName}</title>
          {profileFontLinks}
        </Head>
        <HomeHeader />
        <div className={styles.pageShell}>
          <div className={styles.profileGrid}>
            <div className={styles.publicProfileSingleCol}>
              <ProfileSidebarBackHome />
              <h1 className={styles.sidebarName}>Profile not found</h1>
              <p className={styles.placeholder}>
                This user doesn’t exist or their profile is unavailable.
              </p>
            </div>
          </div>
        </div>
        <HomeFooterSection />
      </>
    )
  }

  if (loading || !profile) {
    return (
      <>
        <Head>
          <title>Profile – {siteName}</title>
          {profileFontLinks}
        </Head>
        <HomeHeader />
        <div className={styles.pageShell}>
          <div className={styles.loading}>Loading…</div>
        </div>
        <HomeFooterSection />
      </>
    )
  }

  return (
    <>
      <Head>
        <title>
          {displayName} – {siteName}
        </title>
        {profileFontLinks}
      </Head>
      <HomeHeader />
      <div className={styles.pageShell}>
        <div className={styles.profileGrid}>
          <aside className={styles.profileSidebar}>
            <ProfileSidebarBackHome />
            <div className={styles.sidebarAvatarWrap}>
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
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
            <div className={styles.sidebarNameRow}>
              <h1 className={styles.sidebarName}>{displayName}</h1>
              {personalLinks.length > 0 ? (
                <ProfilePersonalLinksPopover links={personalLinks} />
              ) : null}
            </div>
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
            <ProfilePublicSummary
              bio={profile.bio}
              bioOnly
            />
            <ProfileInterestsPanel
              userId={profile.user_id}
              editable={false}
              initialTags={profileInterestTags}
            />
            {currentUserId && currentUserId !== userId && (
              <button
                type='button'
                className={`${
                  isFollowing ? styles.followingBtn : styles.followBtn
                } ${styles.sidebarFollowMainBtn}`}
                onClick={handleFollowToggle}
                disabled={followLoading}
              >
                {followButtonLabel(
                  followRelationship(
                    isFollowing,
                    userId ? followerIds.has(userId) : false
                  ),
                  followLoading
                )}
              </button>
            )}
            <ProfilePublicSummary
              learningNow={profile.learning_now}
              learningLearned={profile.learning_learned}
              learningOnly
              metadataStyle
            />
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
                        const showFollow =
                          !!currentUserId && u.user_id !== currentUserId
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
                      const showFollow =
                        !!currentUserId && u.user_id !== currentUserId
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
                    aria-selected={mainTab === 'bookmarks'}
                    className={
                      mainTab === 'bookmarks'
                        ? styles.primaryTabActive
                        : styles.primaryTab
                    }
                    onClick={() => setMainTab('bookmarks')}
                  >
                    Resources
                  </button>
                  <span className={styles.primaryTabsDivider} aria-hidden />
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
                    Feed
                  </button>
                </nav>

                {mainTab === 'knowledge' && (
                  <ProfileKnowledgePanel
                    topics={knowledgeTopics}
                    loading={loading}
                    searchId='public-profile-knowledge-search'
                    emptyMessage='No completed topics yet.'
                  />
                )}

                {mainTab === 'bookmarks' && (
                  <div className={styles.tabPanel}>
                    <h2 className={styles.mainSerifTitle}>
                      Resources
                    </h2>
                    <div className={styles.section}>
                      {showPublicBookmarkTagFilters ? (
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
                            {profileBookmarkTagsInUse.map((t) => (
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
                          </div>
                        </div>
                      ) : null}
                      {publicSavedBookmarkRows.length === 0 ? (
                        <p className={styles.placeholder}>
                          {isBookmarkTagFilterActive(bookmarkTagFilter)
                            ? 'No resources match this filter.'
                            : 'No saved resources on this profile yet.'}
                        </p>
                      ) : (
                        <ul
                          className={`${styles.userLinksList} ${
                            currentUserId ? styles.userLinksListWithCopy : ''
                          }`}
                        >
                          {publicSavedBookmarkRows.map((l) => {
                            return (
                              <li key={l.id} className={styles.userLinkItem}>
                                <div className={styles.userLinkItemInner}>
                                  <span className={styles.tabItemIcon} aria-hidden>
                                    <ProfileBookmarkIcon />
                                  </span>
                                  <div className={styles.userLinkContent}>
                                    <div className={styles.userLinkRow}>
                                      <div className={styles.userLinkRowMain}>
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
                                        {currentUserId ? (
                                          <div
                                            className={styles.userLinkActions}
                                          >
                                            <button
                                              type='button'
                                              className={
                                                styles.notebooksListIconBtn
                                              }
                                              disabled={
                                                !viewerCopyTargetsLoaded ||
                                                copyBookmarkBusyKey !== null ||
                                                viewerSavedLinkUrls.has(
                                                  l.url.trim()
                                                )
                                              }
                                              onClick={() =>
                                                void handleCopyProfileLinkBookmark(
                                                  l
                                                )
                                              }
                                              title={
                                                viewerSavedLinkUrls.has(
                                                  l.url.trim()
                                                )
                                                  ? 'Saved to your bookmarks'
                                                  : 'Save to your bookmarks'
                                              }
                                              aria-label={
                                                viewerSavedLinkUrls.has(
                                                  l.url.trim()
                                                )
                                                  ? 'Saved to your bookmarks'
                                                  : 'Save to your bookmarks'
                                              }
                                            >
                                              <span
                                                className={
                                                  copyBookmarkBusyKey ===
                                                    `link-${l.id}` &&
                                                  !viewerSavedLinkUrls.has(
                                                    l.url.trim()
                                                  )
                                                    ? styles.notebooksListIconBtnInnerBusy
                                                    : undefined
                                                }
                                              >
                                                <ProfileSaveBookmarkIcon
                                                  filled={viewerSavedLinkUrls.has(
                                                    l.url.trim()
                                                  )}
                                                />
                                              </span>
                                            </button>
                                          </div>
                                        ) : null}
                                      </div>
                                      {l.created_at ? (
                                        <span className={styles.userLinkDate}>
                                          {formatDate(l.created_at)}
                                        </span>
                                      ) : null}
                                    </div>
                                    <div className={styles.userLinkMeta}>
                                      <div className={styles.userLinkMetaTags}>
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
                                      {storedNotebookNoteHasContent(l.note) &&
                                      showNoteForLinkId === l.id ? (
                                        <div
                                          className={`${styles.userLinkNote} ${styles.userLinkNoteRich}`}
                                        >
                                          <BookmarkNotePreview note={l.note} />
                                        </div>
                                      ) : null}
                                    </div>
                                  </div>
                                </div>
                              </li>
                            )
                          })}
                        </ul>
                      )}
                    </div>
                  </div>
                )}

                {mainTab === 'activity' && (
                  <div className={styles.tabPanel}>
                    <h2 className={styles.mainSerifTitle}>Feed</h2>
                    <ProfileUpdatesTab
                      userId={userId}
                      authorDisplayName={displayName}
                      authorAvatarUrl={profile.avatar_url}
                      showFollowingTag={isFollowing}
                      embedded
                    />
                    {publicActivityRows.length > 0 ? (
                      <ul className={styles.list}>
                        {publicActivityRows.map((row) => {
                          if (row.kind === 'comment') {
                            const { comment, course } = row
                            const turns: ActivityFeedTurn[] = [
                              {
                                author: feedActorNode(
                                  comment.user_id,
                                  displayName,
                                  followingIds,
                                  followerIds,
                                  profile.avatar_url
                                ),
                                verb: 'commented',
                                body: comment.body
                              }
                            ]
                            return (
                              <ActivityFeedRowShell
                                key={`comment-${comment.id}`}
                                iconKind='comment'
                              >
                                <ActivityFeedThread
                                  iconKind='comment'
                                  leadSubject
                                  subject={
                                    <FeedTargetLink
                                      href={
                                        course.url ??
                                        `/course/${course.notion_page_id}`
                                      }
                                    >
                                      {course.name}
                                    </FeedTargetLink>
                                  }
                                  time={formatDate(comment.created_at)}
                                  turns={turns}
                                />
                              </ActivityFeedRowShell>
                            )
                          }
                          const { annotation, course } = row
                          const turns: ActivityFeedTurn[] = [
                            {
                              author: feedActorNode(
                                annotation.user_id,
                                displayName,
                                followingIds,
                                followerIds,
                                profile.avatar_url
                              ),
                              verb: 'posted',
                              body: annotation.body
                            }
                          ]
                          return (
                            <ActivityFeedRowShell
                              key={`annotation-${annotation.id}`}
                              iconKind='discussion'
                            >
                              <ActivityFeedThread
                                iconKind='discussion'
                                leadSubject
                                subject={
                                  <>
                                    Discussions on{' '}
                                    <FeedTargetLink
                                      href={
                                        course.url ??
                                        `/course/${course.notion_page_id}`
                                      }
                                    >
                                      {course.name}
                                    </FeedTargetLink>
                                    {annotation.section_id ? (
                                      <>
                                        {' '}
                                        in section:{' '}
                                        <FeedSectionUnderline
                                          sectionId={annotation.section_id}
                                        />
                                      </>
                                    ) : null}
                                  </>
                                }
                                time={formatDate(annotation.created_at)}
                                turns={turns}
                              />
                            </ActivityFeedRowShell>
                          )
                        })}
                      </ul>
                    ) : null}
                  </div>
                )}

                {mainTab === 'learning-path' && (
                  <div className={styles.tabPanel}>
                    <h2 className={styles.mainSerifTitle}>
                      Learning Paths & Courses
                    </h2>
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
                    {!showAllLearningCards &&
                    coursesOnly &&
                    !hasAnyPublicCourseCards ? (
                      <p className={styles.placeholder}>
                        No courses on this profile yet.
                      </p>
                    ) : !showAllLearningCards &&
                      learningPathsOnly &&
                      !hasAnyPublicNonCourseCards ? (
                      <p className={styles.placeholder}>
                        No learning paths on this profile yet.
                      </p>
                    ) : !showAllLearningCards &&
                      committedOnly &&
                      !hasAnyCommittedCards ? (
                      <p className={styles.placeholder}>
                        No committed learning paths on this profile yet.
                      </p>
                    ) : showAllLearningCards && !hasAnyPublicLearningCards ? (
                      <p className={styles.placeholder}>
                        No learning paths or courses on this profile yet.
                      </p>
                    ) : (
                      <ul className={styles.learningPathList}>
                        {showCourseCards
                          ? visiblePublicCoursePaths.map((item) => (
                              <li key={item.id}>
                                <ProfileCommunityLearningPathCard
                                  item={item}
                                  ownAuthorLabel={
                                    currentUserId && userId === currentUserId
                                      ? 'you'
                                      : displayName
                                  }
                                  committed={committedKeys.has(
                                    learningPathCommitmentKey(item.slug)
                                  )}
                                  showResumeActions={false}
                                />
                              </li>
                            ))
                          : null}
                        {showResearchCards
                          ? visiblePublicResearchPaths.map((item) => (
                              <li key={item.id}>
                                <ProfileCommunityLearningPathCard
                                  item={item}
                                  ownAuthorLabel={
                                    currentUserId && userId === currentUserId
                                      ? 'you'
                                      : displayName
                                  }
                                  committed={committedKeys.has(
                                    learningPathCommitmentKey(item.slug)
                                  )}
                                  showResumeActions={false}
                                />
                              </li>
                            ))
                          : null}
                        {showCommunityCards
                          ? visiblePublicCommunityPaths.map((item) => (
                              <li key={item.id}>
                                <ProfileCommunityLearningPathCard
                                  item={item}
                                  ownAuthorLabel={
                                    currentUserId && userId === currentUserId
                                      ? 'you'
                                      : displayName
                                  }
                                  committed={committedKeys.has(
                                    learningPathCommitmentKey(item.slug)
                                  )}
                                  showResumeActions={false}
                                />
                              </li>
                            ))
                          : null}
                      </ul>
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
