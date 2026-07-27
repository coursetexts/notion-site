import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { useEffect, useRef, useState } from 'react'

import { type Notebook, createNotebook } from '@/lib/notebooks-db'
import { notebookAbsoluteUrl } from '@/lib/notebook-bookmark-link'
import styles from '@/styles/profile.module.css'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export function NotebookShareLinkIcon() {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='14'
      height='14'
      viewBox='0 0 8 8'
      fill='none'
      aria-hidden
    >
      <path
        d='M4.14058 1.91565L4.44058 1.61252C4.70255 1.37375 5.04645 1.2451 5.40081 1.2533C5.75518 1.2615 6.09276 1.40593 6.3434 1.65657C6.59404 1.90721 6.73847 2.24479 6.74667 2.59916C6.75488 2.95352 6.62622 3.29742 6.38745 3.5594L5.44058 4.50315C5.31312 4.63108 5.16166 4.73259 4.99488 4.80186C4.8281 4.87112 4.64929 4.90678 4.4687 4.90678C4.28811 4.90678 4.1093 4.87112 3.94252 4.80186C3.77574 4.73259 3.62428 4.63108 3.49683 4.50315'
        stroke='currentColor'
        strokeWidth='0.75'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='M3.8594 6.08439L3.5594 6.38752C3.29742 6.62629 2.95352 6.75494 2.59916 6.74674C2.24479 6.73853 1.90721 6.5941 1.65657 6.34346C1.40593 6.09282 1.2615 5.75524 1.2533 5.40088C1.2451 5.04651 1.37375 4.70261 1.61252 4.44064L2.5594 3.49689C2.68685 3.36896 2.83831 3.26745 3.00509 3.19818C3.17187 3.12892 3.35068 3.09326 3.53127 3.09326C3.71186 3.09326 3.89067 3.12892 4.05745 3.19818C4.22423 3.26745 4.37569 3.36896 4.50315 3.49689'
        stroke='currentColor'
        strokeWidth='0.75'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

export function NotebookBookmarkIcon({ filled }: { filled: boolean }) {
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

type ProfileNotebooksPanelProps = {
  notebooks: Notebook[]
  loading: boolean
  onRefresh: () => void | Promise<void>
  /** When false, hide “Create new” (e.g. public profile). */
  canCreate?: boolean
  /** Overrides the h3 above the list (default: “Your notebooks”). */
  subsectionTitle?: string | null
  /** Overrides empty-list copy (default: “Nothing here.”). */
  emptyHint?: string
  /** Show a “Public” pill next to titles that are published (own profile). */
  showPublishedBadge?: boolean
  /** Notebook ids already saved under Profile → Bookmarks (Saved links). */
  bookmarkedNotebookIds?: ReadonlySet<string>
  /**
   * Logged-in viewer: add this notebook’s URL to your saved links (Notebooks →
   * Saved notebooks on your profile).
   */
  onBookmarkNotebook?: (notebook: {
    id: string
    title: string
  }) => Promise<boolean>
}

export function ProfileNotebooksPanel({
  notebooks,
  loading,
  onRefresh,
  canCreate = true,
  subsectionTitle = 'Your Notebooks',
  emptyHint,
  showPublishedBadge = false,
  bookmarkedNotebookIds,
  onBookmarkNotebook
}: ProfileNotebooksPanelProps) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [nameModalOpen, setNameModalOpen] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [shareCopiedId, setShareCopiedId] = useState<string | null>(null)
  const [bookmarkBusyId, setBookmarkBusyId] = useState<string | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const shareCopiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (shareCopiedTimer.current) clearTimeout(shareCopiedTimer.current)
    }
  }, [])

  useEffect(() => {
    if (!menuOpen) return
    const onDoc = (e: MouseEvent) => {
      if (
        wrapRef.current &&
        !wrapRef.current.contains(e.target as globalThis.Node)
      ) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [menuOpen])

  const openNameModal = () => {
    setMenuOpen(false)
    setNewTitle('')
    setNameModalOpen(true)
  }

  const closeNameModal = () => {
    setNameModalOpen(false)
    setNewTitle('')
  }

  const handleCreateNotebook = async () => {
    if (creating) return
    const title = newTitle.trim() || 'Untitled notebook'
    setCreating(true)
    const row = await createNotebook(title)
    if (row) {
      await onRefresh()
      closeNameModal()
      await router.push(`/notebook/${row.id}`)
    }
    setCreating(false)
  }

  const handleShareLink = async (notebookId: string) => {
    if (typeof window === 'undefined') return
    const url = notebookAbsoluteUrl(notebookId, window.location.origin)
    try {
      await navigator.clipboard.writeText(url)
      if (shareCopiedTimer.current) clearTimeout(shareCopiedTimer.current)
      setShareCopiedId(notebookId)
      shareCopiedTimer.current = setTimeout(() => {
        setShareCopiedId((cur) => (cur === notebookId ? null : cur))
        shareCopiedTimer.current = null
      }, 2000)
    } catch {
      window.alert('Could not copy link.')
    }
  }

  const handleBookmarkNotebook = async (n: Notebook) => {
    if (!onBookmarkNotebook || bookmarkBusyId) return
    setBookmarkBusyId(n.id)
    try {
      const ok = await onBookmarkNotebook({ id: n.id, title: n.title })
      if (!ok) window.alert('Could not add bookmark.')
    } finally {
      setBookmarkBusyId(null)
    }
  }

  return (
    <div className={styles.tabPanel}>
      <div className={styles.notebooksToolbar}>
        {subsectionTitle ? (
          <h3 className={styles.subsectionSerifTitle}>{subsectionTitle}</h3>
        ) : (
          <div />
        )}
        {canCreate && (
          <div className={styles.createNewWrap} ref={wrapRef}>
            <button
              type='button'
              className={styles.notebooksCreateBtn}
              onClick={() => setMenuOpen((o) => !o)}
              aria-expanded={menuOpen}
              aria-haspopup='menu'
            >
              + Create New
            </button>
            {menuOpen && (
              <div className={styles.notebooksCreateMenu} role='menu'>
                <button
                  type='button'
                  role='menuitem'
                  className={styles.notebooksCreateMenuBtn}
                  onClick={() => openNameModal()}
                  disabled={creating}
                >
                  Start from Scratch
                </button>
                <div
                  className={styles.notebooksCreateMenuDivider}
                  aria-hidden
                />
                <button
                  type='button'
                  role='menuitem'
                  className={styles.notebooksCreateMenuBtn}
                  disabled
                  title='Coming soon'
                >
                  Import Notes
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {nameModalOpen && (
        <div
          className={styles.modalBackdrop}
          role='presentation'
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeNameModal()
          }}
        >
          <div
            className={styles.modalCard}
            role='dialog'
            aria-modal='true'
            aria-labelledby='notebook-name-modal-title'
          >
            <div className={styles.modalHeader}>
              <h2 id='notebook-name-modal-title' className={styles.modalTitle}>
                New notebook
              </h2>
              <button
                type='button'
                className={styles.modalClose}
                onClick={closeNameModal}
                aria-label='Close'
              >
                ×
              </button>
            </div>
            <div className={styles.modalForm}>
              <label className={styles.modalLabel}>
                Name
                <input
                  type='text'
                  className={styles.modalInput}
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder='Untitled notebook'
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void handleCreateNotebook()
                    if (e.key === 'Escape') closeNameModal()
                  }}
                />
              </label>
              <div className={styles.modalActions}>
                <button
                  type='button'
                  className={styles.modalCancelBtn}
                  onClick={closeNameModal}
                >
                  Cancel
                </button>
                <button
                  type='button'
                  className={styles.modalSubmitBtn}
                  onClick={() => void handleCreateNotebook()}
                  disabled={creating}
                >
                  {creating ? 'Creating…' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <p className={styles.placeholder}>Loading notebooks…</p>
      ) : notebooks.length === 0 ? (
        <div className={styles.notebooksEmpty}>
          <img
            src='/images/profiles/pot.png'
            alt=''
            className={styles.notebooksEmptyPot}
            width={120}
            height={120}
            decoding='async'
          />
          <p className={styles.notebooksEmptyText}>
            {emptyHint ?? 'Nothing here.'}
          </p>
        </div>
      ) : (
        <ul className={styles.notebooksList}>
          {notebooks.map((n) => {
            const isBookmarked = bookmarkedNotebookIds?.has(n.id) ?? false
            return (
              <li key={n.id} className={styles.notebooksListItemWrap}>
                <div className={styles.notebooksListRow}>
                  <Link
                    href={`/notebook/${n.id}`}
                    legacyBehavior={false}
                    className={styles.notebooksListItem}
                  >
                    <span className={styles.notebooksListTitle}>
                      <span className={styles.notebooksListTitleText}>
                        {n.title}
                      </span>
                      {showPublishedBadge && n.published ? (
                        <span className={styles.notebooksPublishedBadge}>
                          Public
                        </span>
                      ) : null}
                    </span>
                    <span className={styles.notebooksListMeta}>
                      {formatDate(n.created_at)}
                    </span>
                  </Link>
                  <div className={styles.notebooksListRowActions}>
                    <button
                      type='button'
                      className={styles.notebooksListIconBtn}
                      onClick={() => void handleShareLink(n.id)}
                      title={
                        shareCopiedId === n.id
                          ? 'Copied'
                          : 'Copy notebook link'
                      }
                      aria-label={
                        shareCopiedId === n.id
                          ? 'Link copied'
                          : 'Copy notebook link'
                      }
                    >
                      <NotebookShareLinkIcon />
                    </button>
                    {onBookmarkNotebook ? (
                      <button
                        type='button'
                        className={styles.notebooksListIconBtn}
                        disabled={isBookmarked || bookmarkBusyId !== null}
                        onClick={() => void handleBookmarkNotebook(n)}
                        title={
                          isBookmarked
                            ? 'Saved to bookmarks'
                            : 'Add to bookmarks'
                        }
                        aria-label={
                          isBookmarked
                            ? 'Saved to bookmarks'
                            : 'Add to bookmarks'
                        }
                      >
                        <span
                          className={
                            bookmarkBusyId === n.id && !isBookmarked
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
      )}
    </div>
  )
}
