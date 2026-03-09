import React, { useCallback, useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import type { User } from '@supabase/supabase-js'
import { useAuthOptional } from '../contexts/AuthContext'
import { getCachedAuth } from '@/lib/auth-cache'
import { authDebug } from '@/lib/auth-debug'
import { getSupabaseClient } from '@/lib/supabase'
import {
  getMyComments,
  getMyAnnotations,
  getMyBookmarks,
  type Comment as DbComment,
  type Annotation as DbAnnotation,
  type Course as CourseType
} from '@/lib/course-activity-db'
import {
  getReplyNotifications,
  markReplyNotificationsRead,
  type ReplyNotification
} from '@/lib/reply-notifications'
import { name as siteName } from '@/lib/config'
import { useFollowingIds } from '@/hooks/useFollowingIds'
import { useFollowerIds } from '@/hooks/useFollowerIds'
import { UserLink } from '@/components/UserLink'
import styles from '@/styles/profile.module.css'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export default function ProfilePage() {
  const router = useRouter()
  const auth = useAuthOptional()
  const user = auth?.user ?? null
  const profile = auth?.profile ?? null
  const isLoading = auth?.isLoading ?? true
  const signOut = auth?.signOut ?? (async () => {})

  const cached = getCachedAuth()
  const [resolvedUser, setResolvedUser] = useState<User | null>(() => cached.user ?? null)
  const [comments, setComments] = useState<{ comment: DbComment; course: CourseType }[]>([])
  const [annotations, setAnnotations] = useState<{ annotation: DbAnnotation; course: CourseType }[]>([])
  const [bookmarks, setBookmarks] = useState<{ bookmark: { id: string; course_id: string; created_at: string }; course: CourseType }[]>([])
  const [notifications, setNotifications] = useState<ReplyNotification[]>([])
  const [activityLoading, setActivityLoading] = useState(true)
  const [myActivityTab, setMyActivityTab] = useState<'comments' | 'annotations'>(
    'comments'
  )
  const { followingIds } = useFollowingIds()
  const { followerIds } = useFollowerIds()

  const effectiveUser = user ?? resolvedUser

  const loadActivity = useCallback(async (userId: string) => {
    const [commentsRes, annotationsRes, bookmarksRes, notificationRes] = await Promise.all([
      getMyComments(),
      getMyAnnotations(),
      getMyBookmarks(),
      getReplyNotifications(userId)
    ])
    setComments(commentsRes)
    setAnnotations(annotationsRes)
    setBookmarks(bookmarksRes)
    setNotifications(notificationRes)
    setActivityLoading(false)

    // Mark as read after rendering this fetch so entries can appear as read next time.
    await markReplyNotificationsRead(userId)
    setNotifications((prev) => prev.map((n) => ({ ...n, is_unread: false })))
  }, [])

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
    return () => { cancelled = true }
  }, [user, isLoading, resolvedUser])

  const handleSignOut = async () => {
    await signOut()
    const supabase = getSupabaseClient()
    if (supabase) await supabase.auth.signOut()
    setResolvedUser(null)
    router.replace('/')
  }

  if ((isLoading && !resolvedUser) || !effectiveUser) {
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

  const displayName =
    profile?.display_name ||
    (effectiveUser.user_metadata?.full_name as string | undefined) ||
    (effectiveUser.user_metadata?.name as string | undefined) ||
    effectiveUser.email?.split('@')[0] ||
    'User'
  const avatarUrl =
    profile?.avatar_url || (effectiveUser.user_metadata?.avatar_url as string | undefined)

  return (
    <>
      <Head>
        <title>Profile – {siteName}</title>
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
              {avatarUrl ? (
                <img
                  src={avatarUrl}
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
            {effectiveUser.email && (
              <p className={styles.email}>{effectiveUser.email}</p>
            )}
            <button
              type="button"
              className={styles.signOutBtn}
              onClick={handleSignOut}
            >
              Sign out
            </button>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Bookmarked courses</h2>
            {activityLoading ? (
              <p className={styles.placeholder}>Loading…</p>
            ) : bookmarks.length === 0 ? (
              <p className={styles.placeholder}>
                No bookmarks yet. Use “Save course” on a course page to add one.
              </p>
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
            <h2 className={styles.sectionTitle}>Replies to me</h2>
            {activityLoading ? (
              <p className={styles.placeholder}>Loading…</p>
            ) : notifications.length === 0 ? (
              <p className={styles.placeholder}>
                No replies yet. When someone replies to your comment or annotation, it appears here.
              </p>
            ) : (
              <ul className={styles.list}>
                {notifications.map((n) => (
                  <li
                    key={n.id}
                    className={
                      n.is_unread
                        ? `${styles.listItem} ${styles.listItemUnread}`
                        : styles.listItem
                    }
                  >
                    <div className={styles.listLink}>
                      <span className={styles.listTitle}>
                        <UserLink
                          userId={n.author_id}
                          displayName={n.author_name}
                          showFollowingTag={followingIds.has(n.author_id)}
                          showFollowsYouTag={followerIds.has(n.author_id)}
                        />
                        {' replied on '}
                        <Link href={n.course_url ?? `/${n.course_id}`}>
                          <a className={styles.inlineLink}>{n.course_name}</a>
                        </Link>
                      </span>
                      <span className={styles.listMeta}>{formatDate(n.created_at)}</span>
                    </div>
                    {n.type === 'annotation' && n.section_id && (
                      <p className={styles.notificationMeta}>Section: {n.section_id}</p>
                    )}
                    <p className={styles.listBody}>{n.body}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className={styles.section}>
            <div className={styles.sectionTitleRow}>
              <h2 className={styles.sectionTitle}>My activity</h2>
              <div className={styles.activityToggle} role="tablist" aria-label="My activity tabs">
                <button
                  type="button"
                  role="tab"
                  aria-selected={myActivityTab === 'comments'}
                  className={myActivityTab === 'comments' ? styles.toggleBtnActive : styles.toggleBtn}
                  onClick={() => setMyActivityTab('comments')}
                >
                  Comments
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={myActivityTab === 'annotations'}
                  className={myActivityTab === 'annotations' ? styles.toggleBtnActive : styles.toggleBtn}
                  onClick={() => setMyActivityTab('annotations')}
                >
                  Annotations
                </button>
              </div>
            </div>

            {activityLoading && <p className={styles.placeholder}>Loading…</p>}

            {!activityLoading && myActivityTab === 'comments' && (
              comments.length === 0 ? (
                <p className={styles.placeholder}>
                  You haven’t commented on any course yet. Comments you leave on course pages will appear here.
                </p>
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

            {!activityLoading && myActivityTab === 'annotations' && (
              annotations.length === 0 ? (
                <p className={styles.placeholder}>
                  You haven’t added annotations yet. Annotations you leave in course sections will appear here.
                </p>
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
        </div>
      </div>
    </>
  )
}
