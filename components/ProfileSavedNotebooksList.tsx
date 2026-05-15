import Link from 'next/link'
import React, { useEffect, useRef, useState } from 'react'

import { notebookAbsoluteUrl } from '@/lib/notebook-bookmark-link'
import styles from '@/styles/profile.module.css'

import {
  NotebookBookmarkIcon,
  NotebookShareLinkIcon
} from './ProfileNotebooksPanel'

export type SavedNotebookRow =
  | {
      kind: 'notebook'
      id: string
      notebookId: string
      title: string
      href: string
      createdAt: string
    }
  | {
      kind: 'course'
      id: string
      courseId: string
      title: string
      href: string
      createdAt: string
    }

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

function absoluteHref(href: string, origin: string): string {
  if (href.startsWith('http')) return href
  const base = origin.replace(/\/$/, '')
  return `${base}${href.startsWith('/') ? href : `/${href}`}`
}

type ProfileSavedNotebooksListProps = {
  rows: SavedNotebookRow[]
  loading?: boolean
  emptyMessage: string
  bookmarkedNotebookIds?: ReadonlySet<string>
  bookmarkedCourseIds?: ReadonlySet<string>
  onBookmarkNotebook?: (nb: { id: string; title: string }) => Promise<boolean>
  onBookmarkCourse?: (course: {
    id: string
    title: string
    href: string
  }) => Promise<boolean>
}

export function ProfileSavedNotebooksList({
  rows,
  loading = false,
  emptyMessage,
  bookmarkedNotebookIds,
  bookmarkedCourseIds,
  onBookmarkNotebook,
  onBookmarkCourse
}: ProfileSavedNotebooksListProps) {
  const [shareCopiedKey, setShareCopiedKey] = useState<string | null>(null)
  const [bookmarkBusyKey, setBookmarkBusyKey] = useState<string | null>(null)
  const shareCopiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (shareCopiedTimer.current) clearTimeout(shareCopiedTimer.current)
    }
  }, [])

  const handleShareLink = async (row: SavedNotebookRow) => {
    if (typeof window === 'undefined') return
    const key = `${row.kind}-${row.id}`
    const url =
      row.kind === 'notebook'
        ? notebookAbsoluteUrl(row.notebookId, window.location.origin)
        : absoluteHref(row.href, window.location.origin)
    try {
      await navigator.clipboard.writeText(url)
      if (shareCopiedTimer.current) clearTimeout(shareCopiedTimer.current)
      setShareCopiedKey(key)
      shareCopiedTimer.current = setTimeout(() => {
        setShareCopiedKey((cur) => (cur === key ? null : cur))
        shareCopiedTimer.current = null
      }, 2000)
    } catch {
      window.alert('Could not copy link.')
    }
  }

  const handleBookmark = async (row: SavedNotebookRow) => {
    const key = `${row.kind}-${row.id}`
    if (bookmarkBusyKey) return
    setBookmarkBusyKey(key)
    try {
      if (row.kind === 'notebook' && onBookmarkNotebook) {
        const ok = await onBookmarkNotebook({
          id: row.notebookId,
          title: row.title
        })
        if (!ok) window.alert('Could not add bookmark.')
      } else if (row.kind === 'course' && onBookmarkCourse) {
        const ok = await onBookmarkCourse({
          id: row.courseId,
          title: row.title,
          href: row.href
        })
        if (!ok) window.alert('Could not add bookmark.')
      }
    } finally {
      setBookmarkBusyKey(null)
    }
  }

  if (loading) {
    return <p className={styles.placeholder}>Loading…</p>
  }

  if (rows.length === 0) {
    return <p className={styles.placeholder}>{emptyMessage}</p>
  }

  const showBookmarkActions =
    onBookmarkNotebook != null || onBookmarkCourse != null

  return (
    <ul className={styles.notebooksList}>
      {rows.map((row) => {
        const rowKey = `${row.kind}-${row.id}`
        const isBookmarked =
          row.kind === 'notebook'
            ? (bookmarkedNotebookIds?.has(row.notebookId) ?? false)
            : (bookmarkedCourseIds?.has(row.courseId) ?? false)
        const canBookmark =
          row.kind === 'notebook'
            ? onBookmarkNotebook != null
            : onBookmarkCourse != null

        return (
          <li key={rowKey} className={styles.notebooksListItemWrap}>
            <div className={styles.notebooksListRow}>
              <Link
                href={row.href}
                legacyBehavior={false}
                className={styles.notebooksListItem}
              >
                <span className={styles.notebooksListTitle}>
                  <span className={styles.notebooksListTitleText}>
                    {row.title}
                  </span>
                </span>
                <span className={styles.notebooksListMeta}>
                  <span className={styles.notebooksKindTag}>
                    {row.kind === 'notebook' ? 'Notebook' : 'Course'}
                  </span>
                  {' · '}
                  {formatDate(row.createdAt)}
                </span>
              </Link>
              <div className={styles.notebooksListRowActions}>
                <button
                  type='button'
                  className={styles.notebooksListIconBtn}
                  onClick={() => void handleShareLink(row)}
                  title={
                    shareCopiedKey === rowKey ? 'Copied' : 'Copy link'
                  }
                  aria-label={
                    shareCopiedKey === rowKey ? 'Link copied' : 'Copy link'
                  }
                >
                  <NotebookShareLinkIcon />
                </button>
                {showBookmarkActions && canBookmark ? (
                  <button
                    type='button'
                    className={styles.notebooksListIconBtn}
                    disabled={isBookmarked || bookmarkBusyKey !== null}
                    onClick={() => void handleBookmark(row)}
                    title={
                      isBookmarked ? 'Saved to bookmarks' : 'Add to bookmarks'
                    }
                    aria-label={
                      isBookmarked ? 'Saved to bookmarks' : 'Add to bookmarks'
                    }
                  >
                    <span
                      className={
                        bookmarkBusyKey === rowKey && !isBookmarked
                          ? styles.notebooksListIconBtnInnerBusy
                          : undefined
                      }
                    >
                      <NotebookBookmarkIcon filled={isBookmarked} />
                    </span>
                  </button>
                ) : null}
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
