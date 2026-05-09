import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { useAuthOptional } from '@/contexts/AuthContext'
import { useFollowingIds } from '@/hooks/useFollowingIds'

import { FollowCountDividerDot } from '@/components/FollowCountDividerDot'
import { HomeFooterSection } from '@/components/HomeFooterSection'
import { HomeHeader } from '@/components/HomeHeader'
import { ProfileBackArrow } from '@/components/ProfileBackArrow'
import { ProfileSidebarBackHome } from '@/components/ProfileSidebarBackHome'
import { ProfileInterestsPanel } from '@/components/ProfileInterestsPanel'
import { ProfilePersonalLinksPanel } from '@/components/ProfilePersonalLinksPanel'
import { ProfileNotebooksPanel } from '@/components/ProfileNotebooksPanel'
import {
  type CommunityResourceBookmarkWithCourse,
  getCommunityResourceBookmarksByUser
} from '@/lib/community-wall-db'
import { name as siteName } from '@/lib/config'
import type { Course } from '@/lib/course-activity-db'
import type { Annotation, Bookmark, Comment } from '@/lib/course-activity-db'
import {
  type ProfileListItem,
  type PublicProfile,
  followUser,
  getAnnotationsByUser,
  getBookmarksByUser,
  getCommentsByUser,
  getFollowStatus,
  getFollowersCount,
  getFollowersList,
  getFollowingCount,
  getFollowingList,
  getProfileByUserId,
  unfollowUser
} from '@/lib/follows'
import {
  type Notebook,
  getPublishedNotebooksByUserId
} from '@/lib/notebooks-db'
import { getProfileInterestsByUserId } from '@/lib/profile-interests-db'
import {
  type ProfilePersonalLink,
  listPersonalLinksByUserId
} from '@/lib/profile-personal-links-db'
import {
  notebookUserLinkHref,
  parseNotebookIdFromUserLinkUrl
} from '@/lib/notebook-bookmark-link'
import { type UserLinkWithTag, getLinksByUserId } from '@/lib/user-links'
import styles from '@/styles/profile.module.css'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
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
  const [bookmarks, setBookmarks] = useState<
    { bookmark: Bookmark; course: Course }[]
  >([])
  const [resourceBookmarks, setResourceBookmarks] = useState<
    CommunityResourceBookmarkWithCourse[]
  >([])
  const [userLinks, setUserLinks] = useState<UserLinkWithTag[]>([])
  const [showNoteForLinkId, setShowNoteForLinkId] = useState<string | null>(
    null
  )
  const notebookPinLinks = useMemo(
    () =>
      userLinks.filter((l) => parseNotebookIdFromUserLinkUrl(l.url) != null),
    [userLinks]
  )
  const savedProfileLinks = useMemo(
    () =>
      userLinks.filter((l) => parseNotebookIdFromUserLinkUrl(l.url) == null),
    [userLinks]
  )
  const [personalLinks, setPersonalLinks] = useState<ProfilePersonalLink[]>([])
  const [comments, setComments] = useState<
    { comment: Comment; course: Course }[]
  >([])
  const [annotations, setAnnotations] = useState<
    { annotation: Annotation; course: Course }[]
  >([])
  const [publishedNotebooks, setPublishedNotebooks] = useState<Notebook[]>([])
  const [profileInterestTags, setProfileInterestTags] = useState<string[]>([])
  const [mainTab, setMainTab] = useState<
    'notebooks' | 'bookmarks' | 'activity'
  >('activity')
  const [activitySubTab, setActivitySubTab] = useState<
    'comments' | 'annotations'
  >('comments')
  const [bookmarksSubTab, setBookmarksSubTab] = useState<
    'saved' | 'notebookPins' | 'courses' | 'community'
  >('saved')
  const [notebooksSubTab, setNotebooksSubTab] = useState<'yours' | 'saved'>(
    'yours'
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

  const loadProfile = useCallback(
    async (uid: string) => {
      setLoading(true)
      setNotFound(false)
      setPublishedNotebooks([])
      setProfileInterestTags([])
      const [
        p,
        followStatus,
        fCount,
        fersCount,
        fList,
        fersList,
        b,
        resourceB,
        links,
        personal,
        c,
        a,
        pubNotebooks,
        interestTags
      ] = await Promise.all([
        getProfileByUserId(uid),
        currentUserId ? getFollowStatus(currentUserId, uid) : false,
        getFollowingCount(uid),
        getFollowersCount(uid),
        getFollowingList(uid),
        getFollowersList(uid),
        getBookmarksByUser(uid),
        getCommunityResourceBookmarksByUser(uid),
        getLinksByUserId(uid),
        listPersonalLinksByUserId(uid),
        getCommentsByUser(uid),
        getAnnotationsByUser(uid),
        getPublishedNotebooksByUserId(uid),
        getProfileInterestsByUserId(uid)
      ])
      if (!p) {
        setProfile(null)
        setPersonalLinks([])
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
      setBookmarks(b)
      setResourceBookmarks(resourceB)
      setUserLinks(links)
      setPersonalLinks(personal)
      setComments(c)
      setAnnotations(a)
      setPublishedNotebooks(pubNotebooks)
      setProfileInterestTags(interestTags)
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
            <ProfileInterestsPanel
              userId={profile.user_id}
              editable={false}
              initialTags={profileInterestTags}
            />
            <ProfilePersonalLinksPanel
              links={personalLinks}
              editable={false}
              onRefresh={() => undefined}
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
                {followLoading ? '…' : isFollowing ? 'Following' : 'Follow'}
              </button>
            )}
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
                                {busy
                                  ? '…'
                                  : isFollowingRow
                                    ? 'Following'
                                    : 'Follow'}
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
                              {busy
                                ? '…'
                                : isFollowingRow
                                  ? 'Following'
                                  : 'Follow'}
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
                    aria-selected={mainTab === 'notebooks'}
                    className={
                      mainTab === 'notebooks'
                        ? styles.primaryTabActive
                        : styles.primaryTab
                    }
                    onClick={() => setMainTab('notebooks')}
                  >
                    Notebooks
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

                {mainTab === 'bookmarks' && (
                  <div className={styles.tabPanel}>
                    <h2 className={styles.mainSerifTitle}>Bookmarks</h2>
                    <nav
                      className={styles.activitySubTabs}
                      role='tablist'
                      aria-label='Bookmarks type'
                    >
                      <button
                        type='button'
                        role='tab'
                        aria-selected={bookmarksSubTab === 'saved'}
                        className={
                          bookmarksSubTab === 'saved'
                            ? styles.activitySubTabActive
                            : styles.activitySubTab
                        }
                        onClick={() => setBookmarksSubTab('saved')}
                      >
                        Saved links
                      </button>
                      <button
                        type='button'
                        role='tab'
                        aria-selected={bookmarksSubTab === 'notebookPins'}
                        className={
                          bookmarksSubTab === 'notebookPins'
                            ? styles.activitySubTabActive
                            : styles.activitySubTab
                        }
                        onClick={() => setBookmarksSubTab('notebookPins')}
                      >
                        Notebook bookmarks
                      </button>
                      <button
                        type='button'
                        role='tab'
                        aria-selected={bookmarksSubTab === 'courses'}
                        className={
                          bookmarksSubTab === 'courses'
                            ? styles.activitySubTabActive
                            : styles.activitySubTab
                        }
                        onClick={() => setBookmarksSubTab('courses')}
                      >
                        Course bookmarks
                      </button>
                      <button
                        type='button'
                        role='tab'
                        aria-selected={bookmarksSubTab === 'community'}
                        className={
                          bookmarksSubTab === 'community'
                            ? styles.activitySubTabActive
                            : styles.activitySubTab
                        }
                        onClick={() => setBookmarksSubTab('community')}
                      >
                        Community resources
                      </button>
                    </nav>
                    {bookmarksSubTab === 'saved' && (
                    <div className={styles.section}>
                      {savedProfileLinks.length === 0 ? (
                        <p className={styles.placeholder}>
                          No bookmarked links.
                        </p>
                      ) : (
                        <ul className={styles.userLinksList}>
                          {savedProfileLinks.map((l) => {
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
                                    </div>
                                    <div className={styles.userLinkMeta}>
                                      <div className={styles.userLinkMetaTags}>
                                        {l.note ? (
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
                                      {l.note && showNoteForLinkId === l.id ? (
                                        <p className={styles.userLinkNote}>
                                          {l.note}
                                        </p>
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
                    )}
                    {bookmarksSubTab === 'notebookPins' && (
                    <div className={styles.section}>
                      {notebookPinLinks.length === 0 ? (
                        <p className={styles.placeholder}>
                          No notebook shortcuts on this profile.
                        </p>
                      ) : (
                        <ul className={styles.list}>
                          {notebookPinLinks.map((l) => (
                            <li key={l.id} className={styles.listItem}>
                              <Link
                                href={notebookUserLinkHref(l.url)}
                                legacyBehavior={false}
                                className={styles.listLink}
                              >
                                <span className={styles.listTitle}>
                                  {l.title?.trim() || 'Notebook'}
                                </span>
                                <span className={styles.listMeta}>
                                  Notebook · {formatDate(l.created_at)}
                                </span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    )}
                    {bookmarksSubTab === 'courses' && (
                    <div className={styles.section}>
                      {bookmarks.length === 0 ? (
                        <p className={styles.placeholder}>
                          No bookmarked courses.
                        </p>
                      ) : (
                        <ul className={styles.list}>
                          {bookmarks.map(({ bookmark, course }) => (
                            <li key={bookmark.id} className={styles.listItem}>
                              <Link
                                href={course.url ?? `/${course.notion_page_id}`}
                              >
                                <a className={styles.listLink}>
                                  <span className={styles.listTitle}>
                                    {course.name}
                                  </span>
                                  <span className={styles.listMeta}>
                                    {formatDate(bookmark.created_at)}
                                  </span>
                                </a>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    )}
                    {bookmarksSubTab === 'community' && (
                    <div className={styles.section}>
                      {resourceBookmarks.length === 0 ? (
                        <p className={styles.placeholder}>
                          No saved community resources.
                        </p>
                      ) : (
                        <ul className={styles.list}>
                          {resourceBookmarks.map(
                            ({ bookmark, resource, course }) => (
                              <li key={bookmark.id} className={styles.listItem}>
                                <Link
                                  href={
                                    course.url ?? `/${course.notion_page_id}`
                                  }
                                >
                                  <a className={styles.listLink}>
                                    <span className={styles.listTitle}>
                                      {resource.title}
                                    </span>
                                    <span className={styles.listMeta}>
                                      {course.name} ·{' '}
                                      {formatDate(bookmark.created_at)}
                                    </span>
                                  </a>
                                </Link>
                                {resource.description ? (
                                  <p className={styles.listBody}>
                                    {resource.description.length > 220
                                      ? `${resource.description.slice(0, 220)}…`
                                      : resource.description}
                                  </p>
                                ) : null}
                                {resource.link ? (
                                  <p className={styles.notificationMeta}>
                                    <a
                                      href={resource.link}
                                      target='_blank'
                                      rel='noopener noreferrer'
                                      className={styles.inlineLink}
                                    >
                                      {resource.link}
                                    </a>
                                  </p>
                                ) : null}
                              </li>
                            )
                          )}
                        </ul>
                      )}
                    </div>
                    )}
                  </div>
                )}

                {mainTab === 'activity' && (
                  <div className={styles.tabPanel}>
                    <h2 className={styles.mainSerifTitle}>All activity</h2>
                    <nav
                      className={styles.activitySubTabs}
                      role='tablist'
                      aria-label='Activity type'
                    >
                      <button
                        type='button'
                        role='tab'
                        aria-selected={activitySubTab === 'comments'}
                        className={
                          activitySubTab === 'comments'
                            ? styles.activitySubTabActive
                            : styles.activitySubTab
                        }
                        onClick={() => setActivitySubTab('comments')}
                      >
                        Comments
                      </button>
                      <button
                        type='button'
                        role='tab'
                        aria-selected={activitySubTab === 'annotations'}
                        className={
                          activitySubTab === 'annotations'
                            ? styles.activitySubTabActive
                            : styles.activitySubTab
                        }
                        onClick={() => setActivitySubTab('annotations')}
                      >
                        Annotations
                      </button>
                    </nav>

                    {activitySubTab === 'comments' &&
                      (comments.length === 0 ? (
                        <p className={styles.placeholder}>No comments yet.</p>
                      ) : (
                        <ul className={styles.list}>
                          {comments.map(({ comment, course }) => (
                            <li key={comment.id} className={styles.listItem}>
                              <Link
                                href={course.url ?? `/${course.notion_page_id}`}
                              >
                                <a className={styles.listLink}>
                                  <span className={styles.listTitle}>
                                    {course.name}
                                  </span>
                                  <span className={styles.listMeta}>
                                    {formatDate(comment.created_at)}
                                  </span>
                                </a>
                              </Link>
                              <p className={styles.listBody}>{comment.body}</p>
                            </li>
                          ))}
                        </ul>
                      ))}

                    {activitySubTab === 'annotations' &&
                      (annotations.length === 0 ? (
                        <p className={styles.placeholder}>
                          No annotations yet.
                        </p>
                      ) : (
                        <ul className={styles.list}>
                          {annotations.map(({ annotation, course }) => (
                            <li key={annotation.id} className={styles.listItem}>
                              <Link
                                href={course.url ?? `/${course.notion_page_id}`}
                              >
                                <a className={styles.listLink}>
                                  <span className={styles.listTitle}>
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
                          ))}
                        </ul>
                      ))}
                  </div>
                )}

                {mainTab === 'notebooks' && (
                  <div className={styles.tabPanel}>
                    <h2 className={styles.mainSerifTitle}>Notebooks</h2>
                    <div className={styles.activitySubTabs} role='tablist'>
                      <button
                        type='button'
                        role='tab'
                        aria-selected={notebooksSubTab === 'yours'}
                        className={
                          notebooksSubTab === 'yours'
                            ? styles.activitySubTabActive
                            : styles.activitySubTab
                        }
                        onClick={() => setNotebooksSubTab('yours')}
                      >
                        Their notebooks
                      </button>
                      <button
                        type='button'
                        role='tab'
                        aria-selected={notebooksSubTab === 'saved'}
                        className={
                          notebooksSubTab === 'saved'
                            ? styles.activitySubTabActive
                            : styles.activitySubTab
                        }
                        onClick={() => setNotebooksSubTab('saved')}
                      >
                        Saved notebooks
                      </button>
                    </div>

                    {notebooksSubTab === 'yours' ? (
                      <ProfileNotebooksPanel
                        notebooks={publishedNotebooks}
                        loading={loading}
                        onRefresh={() => undefined}
                        canCreate={false}
                        subsectionTitle='Published notebooks'
                        emptyHint='No published notebooks yet.'
                      />
                    ) : (
                      <div className={styles.section}>
                        {loading ? (
                          <p className={styles.placeholder}>Loading…</p>
                        ) : notebookPinLinks.length === 0 ? (
                          <p className={styles.placeholder}>
                            No saved notebooks on this profile yet.
                          </p>
                        ) : (
                          <ul className={styles.list}>
                            {notebookPinLinks.map((l) => (
                              <li key={l.id} className={styles.listItem}>
                                <Link
                                  href={notebookUserLinkHref(l.url)}
                                  legacyBehavior={false}
                                  className={styles.listLink}
                                >
                                  <span className={styles.listTitle}>
                                    {l.title?.trim() || 'Notebook'}
                                  </span>
                                  <span className={styles.listMeta}>
                                    Notebook · {formatDate(l.created_at)}
                                  </span>
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
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
