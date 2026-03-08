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
  getMyBookmarks,
  type Comment as DbComment,
  type Course as CourseType
} from '@/lib/course-activity-db'
import { name as siteName } from '@/lib/config'
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
  const [bookmarks, setBookmarks] = useState<{ bookmark: { id: string; course_id: string; created_at: string }; course: CourseType }[]>([])
  const [activityLoading, setActivityLoading] = useState(true)

  const effectiveUser = user ?? resolvedUser

  const loadActivity = useCallback(async () => {
    const [commentsRes, bookmarksRes] = await Promise.all([
      getMyComments(),
      getMyBookmarks()
    ])
    setComments(commentsRes)
    setBookmarks(bookmarksRes)
    setActivityLoading(false)
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
    if (effectiveUser) loadActivity()
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
            <h2 className={styles.sectionTitle}>My comments</h2>
            {activityLoading ? (
              <p className={styles.placeholder}>Loading…</p>
            ) : comments.length === 0 ? (
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
            )}
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
        </div>
      </div>
    </>
  )
}
