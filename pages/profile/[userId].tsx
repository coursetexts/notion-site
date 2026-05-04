import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useState } from 'react'

import { useAuthOptional } from '@/contexts/AuthContext'

import { HomeFooterSection } from '@/components/HomeFooterSection'
import { HomeHeader } from '@/components/HomeHeader'
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
import {
  getFaviconUrl,
  getLinkSiteFaviconDomain
} from '@/lib/link-site-favicon'
import { getProfileInterestsByUserId } from '@/lib/profile-interests-db'
import {
  type ProfilePersonalLink,
  listPersonalLinksByUserId
} from '@/lib/profile-personal-links-db'
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
  const [loading, setLoading] = useState(true)
  const [followLoading, setFollowLoading] = useState(false)
  const [notFound, setNotFound] = useState(false)
  type ProfileView = 'profile' | 'following' | 'followers'
  const [view, setView] = useState<ProfileView>('profile')

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
              <Link
                href='/'
                legacyBehavior={false}
                className={styles.sidebarBack}
              >
                ← Back to Home
              </Link>
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
            <Link
              href='/'
              legacyBehavior={false}
              className={styles.sidebarBack}
            >
              ← Back to Home
            </Link>
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
                onClick={() => setView('following')}
              >
                {followingCount} following
              </button>
              <span className={styles.sidebarFollowDot} aria-hidden>
                {' '}
                •{' '}
              </span>
              <button
                type='button'
                className={styles.sidebarFollowBtn}
                onClick={() => setView('followers')}
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
            {view === 'following' && (
              <div className={styles.mainPanel}>
                <button
                  type='button'
                  className={styles.backToProfile}
                  onClick={() => setView('profile')}
                >
                  ← Back to profile
                </button>
                <h2 className={styles.mainSerifTitle}>Following</h2>
                {followingList.length === 0 ? (
                  <p className={styles.placeholder}>
                    Not following anyone yet.
                  </p>
                ) : (
                  <ul className={styles.userList}>
                    {followingList.map((u) => (
                      <li key={u.user_id} className={styles.userListItem}>
                        <a
                          href={`/profile/${u.user_id}`}
                          className={styles.userListLink}
                        >
                          {u.display_name || 'User'}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {view === 'followers' && (
              <div className={styles.mainPanel}>
                <button
                  type='button'
                  className={styles.backToProfile}
                  onClick={() => setView('profile')}
                >
                  ← Back to profile
                </button>
                <h2 className={styles.mainSerifTitle}>Followers</h2>
                {followersList.length === 0 ? (
                  <p className={styles.placeholder}>No followers yet.</p>
                ) : (
                  <ul className={styles.userList}>
                    {followersList.map((u) => (
                      <li key={u.user_id} className={styles.userListItem}>
                        <a
                          href={`/profile/${u.user_id}`}
                          className={styles.userListLink}
                        >
                          {u.display_name || 'User'}
                        </a>
                      </li>
                    ))}
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
                    <div className={styles.section}>
                      <h3 className={styles.subsectionSerifTitle}>
                        Saved links
                      </h3>
                      {userLinks.length === 0 ? (
                        <p className={styles.placeholder}>
                          No bookmarked links.
                        </p>
                      ) : (
                        <ul className={styles.userLinksList}>
                          {userLinks.map((l) => {
                            const faviconDomain = getLinkSiteFaviconDomain(
                              l.url
                            )
                            return (
                              <li key={l.id} className={styles.userLinkItem}>
                                <div className={styles.userLinkItemInner}>
                                  <span className={styles.userLinkIconWrap}>
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
                                  </span>
                                  <div className={styles.userLinkContent}>
                                    <div className={styles.userLinkRow}>
                                      <a
                                        href={l.url}
                                        target='_blank'
                                        rel='noopener noreferrer'
                                        className={styles.userLinkUrl}
                                      >
                                        {l.title || l.url}
                                      </a>
                                    </div>
                                    <div className={styles.userLinkMeta}>
                                      {l.tag_names?.length > 0 &&
                                        l.tag_names.map((name) => (
                                          <span
                                            key={name}
                                            className={styles.userLinkTag}
                                          >
                                            {name}
                                          </span>
                                        ))}
                                      <span className={styles.userLinkDate}>
                                        {formatDate(l.created_at)}
                                      </span>
                                      {(() => {
                                        try {
                                          return (
                                            <span
                                              className={styles.userLinkDomain}
                                            >
                                              {new URL(l.url).hostname}
                                            </span>
                                          )
                                        } catch {
                                          return null
                                        }
                                      })()}
                                    </div>
                                    {l.note && (
                                      <p className={styles.userLinkNote}>
                                        {l.note}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </li>
                            )
                          })}
                        </ul>
                      )}
                    </div>

                    <div className={styles.section}>
                      <h3 className={styles.subsectionSerifTitle}>
                        Course bookmarks
                      </h3>
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

                    <div className={styles.section}>
                      <h3 className={styles.subsectionSerifTitle}>
                        Community resources
                      </h3>
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
                  <ProfileNotebooksPanel
                    notebooks={publishedNotebooks}
                    loading={loading}
                    onRefresh={() => undefined}
                    canCreate={false}
                    subsectionTitle='Published notebooks'
                    emptyHint='No published notebooks yet.'
                  />
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
