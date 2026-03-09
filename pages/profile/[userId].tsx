import React, { useCallback, useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useAuthOptional } from '@/contexts/AuthContext'
import {
  getProfileByUserId,
  getFollowStatus,
  followUser,
  unfollowUser,
  getFollowingCount,
  getFollowersCount,
  getFollowingList,
  getFollowersList,
  getBookmarksByUser,
  getCommentsByUser,
  getAnnotationsByUser,
  type PublicProfile,
  type ProfileListItem
} from '@/lib/follows'
import type { Course } from '@/lib/course-activity-db'
import type { Comment, Annotation, Bookmark } from '@/lib/course-activity-db'
import { getLinksByUserId, type UserLinkWithTag } from '@/lib/user-links'
import { getLinkSiteFaviconDomain, getFaviconUrl } from '@/lib/link-site-favicon'
import { name as siteName } from '@/lib/config'
import styles from '@/styles/profile.module.css'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

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
  const [bookmarks, setBookmarks] = useState<{ bookmark: Bookmark; course: Course }[]>([])
  const [userLinks, setUserLinks] = useState<UserLinkWithTag[]>([])
  const [comments, setComments] = useState<{ comment: Comment; course: Course }[]>([])
  const [annotations, setAnnotations] = useState<{ annotation: Annotation; course: Course }[]>([])
  const [activityTab, setActivityTab] = useState<'comments' | 'annotations'>('comments')
  const [loading, setLoading] = useState(true)
  const [followLoading, setFollowLoading] = useState(false)
  const [notFound, setNotFound] = useState(false)
  type ProfileView = 'profile' | 'following' | 'followers'
  const [view, setView] = useState<ProfileView>('profile')

  const loadProfile = useCallback(async (uid: string) => {
    setLoading(true)
    setNotFound(false)
    const [p, followStatus, fCount, fersCount, fList, fersList, b, links, c, a] = await Promise.all([
      getProfileByUserId(uid),
      currentUserId ? getFollowStatus(currentUserId, uid) : false,
      getFollowingCount(uid),
      getFollowersCount(uid),
      getFollowingList(uid),
      getFollowersList(uid),
      getBookmarksByUser(uid),
      getLinksByUserId(uid),
      getCommentsByUser(uid),
      getAnnotationsByUser(uid)
    ])
    if (!p) {
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
    setUserLinks(links)
    setComments(c)
    setAnnotations(a)
    setLoading(false)
  }, [currentUserId])

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

  const displayName =
    profile?.display_name || 'User'

  if (!userId) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading…</div>
      </div>
    )
  }

  if (notFound) {
    return (
      <>
        <Head>
          <title>Profile not found – {siteName}</title>
        </Head>
        <div className={styles.container}>
          <div className={styles.card}>
            <Link href="/" className={styles.back}>
              ← Back to home
            </Link>
            <h1 className={styles.name}>Profile not found</h1>
            <p className={styles.placeholder}>This user doesn’t exist or their profile is unavailable.</p>
          </div>
        </div>
      </>
    )
  }

  if (loading) {
    return (
      <>
        <Head>
          <title>Profile – {siteName}</title>
        </Head>
        <div className={styles.container}>
          <div className={styles.loading}>Loading…</div>
        </div>
      </>
    )
  }

  return (
    <>
      <Head>
        <title>{displayName} – {siteName}</title>
      </Head>
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.header}>
            <Link href="/" className={styles.back}>
              ← Back to home
            </Link>
          </div>

          <div className={styles.profileSection}>
            <div className={styles.avatarWrap}>
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt=""
                  className={styles.avatar}
                  width={80}
                  height={80}
                />
              ) : (
                <div className={styles.avatarPlaceholder}>
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <h1 className={styles.name}>{displayName}</h1>
            <div className={styles.followRow}>
              {currentUserId && currentUserId !== userId && (
                <button
                  type="button"
                  className={isFollowing ? styles.followingBtn : styles.followBtn}
                  onClick={handleFollowToggle}
                  disabled={followLoading}
                >
                  {followLoading ? '…' : isFollowing ? 'Following' : 'Follow'}
                </button>
              )}
              <span className={styles.followCounts}>
                <button
                  type="button"
                  className={styles.followCountBtn}
                  onClick={() => setView('following')}
                >
                  <strong>{followingCount}</strong> following
                </button>
                {' · '}
                <button
                  type="button"
                  className={styles.followCountBtn}
                  onClick={() => setView('followers')}
                >
                  <strong>{followersCount}</strong> followers
                </button>
              </span>
            </div>
          </div>

          {view === 'following' && (
            <div className={styles.section}>
              <button
                type="button"
                className={styles.backToProfile}
                onClick={() => setView('profile')}
              >
                ← Back to profile
              </button>
              <h2 className={styles.sectionTitle}>Following</h2>
              {followingList.length === 0 ? (
                <p className={styles.placeholder}>Not following anyone yet.</p>
              ) : (
                <ul className={styles.userList}>
                  {followingList.map((u) => (
                    <li key={u.user_id} className={styles.userListItem}>
                      <a href={`/profile/${u.user_id}`} className={styles.userListLink}>
                        {u.display_name || 'User'}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {view === 'followers' && (
            <div className={styles.section}>
              <button
                type="button"
                className={styles.backToProfile}
                onClick={() => setView('profile')}
              >
                ← Back to profile
              </button>
              <h2 className={styles.sectionTitle}>Followers</h2>
              {followersList.length === 0 ? (
                <p className={styles.placeholder}>No followers yet.</p>
              ) : (
                <ul className={styles.userList}>
                  {followersList.map((u) => (
                    <li key={u.user_id} className={styles.userListItem}>
                      <a href={`/profile/${u.user_id}`} className={styles.userListLink}>
                        {u.display_name || 'User'}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {view === 'profile' && (
          <>
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Bookmarked courses</h2>
            {bookmarks.length === 0 ? (
              <p className={styles.placeholder}>No bookmarked courses.</p>
            ) : (
              <ul className={styles.list}>
                {bookmarks.map(({ bookmark, course }) => (
                  <li key={bookmark.id} className={styles.listItem}>
                    <Link href={course.url ?? `/${course.notion_page_id}`}>
                      <a className={styles.listLink}>
                        <span className={styles.listTitle}>{course.name}</span>
                        <span className={styles.listMeta}>{formatDate(bookmark.created_at)}</span>
                      </a>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Bookmarked links</h2>
            {userLinks.length === 0 ? (
              <p className={styles.placeholder}>No bookmarked links.</p>
            ) : (
              <ul className={styles.userLinksList}>
                {userLinks.map((l) => {
                  const faviconDomain = getLinkSiteFaviconDomain(l.url)
                  return (
                    <li key={l.id} className={styles.userLinkItem}>
                      <div className={styles.userLinkItemInner}>
                        <span className={styles.userLinkIconWrap}>
                          {faviconDomain ? (
                            <img
                              src={getFaviconUrl(faviconDomain)}
                              alt=""
                              className={styles.userLinkIcon}
                              width={20}
                              height={20}
                            />
                          ) : (
                            <span className={styles.userLinkIconDefault} aria-hidden>
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                              </svg>
                            </span>
                          )}
                        </span>
                        <div className={styles.userLinkContent}>
                          <div className={styles.userLinkRow}>
                            <a
                              href={l.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={styles.userLinkUrl}
                            >
                              {l.title || l.url}
                            </a>
                          </div>
                          <div className={styles.userLinkMeta}>
                            {l.tag_names?.length > 0 && l.tag_names.map((name) => (
                              <span key={name} className={styles.userLinkTag}>{name}</span>
                            ))}
                            <span className={styles.userLinkDate}>{formatDate(l.created_at)}</span>
                            {(() => {
                              try {
                                return <span className={styles.userLinkDomain}>{new URL(l.url).hostname}</span>
                              } catch {
                                return null
                              }
                            })()}
                          </div>
                          {l.note && <p className={styles.userLinkNote}>{l.note}</p>}
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          <div className={styles.section}>
            <div className={styles.sectionTitleRow}>
              <h2 className={styles.sectionTitle}>Activity</h2>
              <div className={styles.activityToggle} role="tablist" aria-label="Activity tabs">
                <button
                  type="button"
                  role="tab"
                  aria-selected={activityTab === 'comments'}
                  className={activityTab === 'comments' ? styles.toggleBtnActive : styles.toggleBtn}
                  onClick={() => setActivityTab('comments')}
                >
                  Comments
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activityTab === 'annotations'}
                  className={activityTab === 'annotations' ? styles.toggleBtnActive : styles.toggleBtn}
                  onClick={() => setActivityTab('annotations')}
                >
                  Annotations
                </button>
              </div>
            </div>

            {activityTab === 'comments' && (
              comments.length === 0 ? (
                <p className={styles.placeholder}>No comments yet.</p>
              ) : (
                <ul className={styles.list}>
                  {comments.map(({ comment, course }) => (
                    <li key={comment.id} className={styles.listItem}>
                      <Link href={course.url ?? `/${course.notion_page_id}`}>
                        <a className={styles.listLink}>
                          <span className={styles.listTitle}>{course.name}</span>
                          <span className={styles.listMeta}>{formatDate(comment.created_at)}</span>
                        </a>
                      </Link>
                      <p className={styles.listBody}>{comment.body}</p>
                    </li>
                  ))}
                </ul>
              )
            )}

            {activityTab === 'annotations' && (
              annotations.length === 0 ? (
                <p className={styles.placeholder}>No annotations yet.</p>
              ) : (
                <ul className={styles.list}>
                  {annotations.map(({ annotation, course }) => (
                    <li key={annotation.id} className={styles.listItem}>
                      <Link href={course.url ?? `/${course.notion_page_id}`}>
                        <a className={styles.listLink}>
                          <span className={styles.listTitle}>{course.name}</span>
                          <span className={styles.listMeta}>{formatDate(annotation.created_at)}</span>
                        </a>
                      </Link>
                      <p className={styles.notificationMeta}>Section: {annotation.section_id}</p>
                      <p className={styles.listBody}>{annotation.body}</p>
                    </li>
                  ))}
                </ul>
              )
            )}
          </div>
          </>
          )}
        </div>
      </div>
    </>
  )
}
