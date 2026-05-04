import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { useEffect, useRef, useState } from 'react'

import { type Notebook, createNotebook } from '@/lib/notebooks-db'
import styles from '@/styles/profile.module.css'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

type ProfileNotebooksPanelProps = {
  notebooks: Notebook[]
  loading: boolean
  onRefresh: () => void | Promise<void>
  /** When false, hide “Create new” (e.g. public profile). */
  canCreate?: boolean
  /** Overrides the h3 above the list (default: “Your notebooks”). */
  subsectionTitle?: string
  /** Overrides empty-list copy (default: “Nothing here.”). */
  emptyHint?: string
  /** Show a “Public” pill next to titles that are published (own profile). */
  showPublishedBadge?: boolean
}

export function ProfileNotebooksPanel({
  notebooks,
  loading,
  onRefresh,
  canCreate = true,
  subsectionTitle = 'Your Notebooks',
  emptyHint,
  showPublishedBadge = false
}: ProfileNotebooksPanelProps) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [nameModalOpen, setNameModalOpen] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const wrapRef = useRef<HTMLDivElement>(null)

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

  return (
    <div className={styles.tabPanel}>
      <h2 className={styles.mainSerifTitle}>Notebooks</h2>
      <div className={styles.notebooksToolbar}>
        <h3 className={styles.subsectionSerifTitle}>{subsectionTitle}</h3>
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
          {notebooks.map((n) => (
            <li key={n.id} className={styles.notebooksListItemWrap}>
              <Link
                href={`/notebook/${n.id}`}
                legacyBehavior={false}
                className={styles.notebooksListItem}
              >
                <span className={styles.notebooksListTitle}>
                  {n.title}
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
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
