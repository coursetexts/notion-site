import * as React from 'react'
import { createPortal } from 'react-dom'

import styles from './LearningPathDeleteModal.module.css'

export function LearningPathDeleteModal({
  open,
  pathTitle,
  busy = false,
  error = null,
  onClose,
  onConfirm
}: {
  open: boolean
  pathTitle: string
  busy?: boolean
  error?: string | null
  onClose: () => void
  onConfirm: () => void
}) {
  const dialogRef = React.useRef<HTMLDivElement>(null)
  const cancelRef = React.useRef<HTMLButtonElement>(null)
  const closeRef = React.useRef(onClose)
  closeRef.current = onClose

  React.useEffect(() => {
    if (!open) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const frame = window.requestAnimationFrame(() => {
      cancelRef.current?.focus()
    })
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape' && !busy) closeRef.current()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.cancelAnimationFrame(frame)
      window.removeEventListener('keydown', onKey)
    }
  }, [open, busy])

  if (!open || typeof document === 'undefined') return null

  const title = pathTitle.trim() || 'this learning path'

  return createPortal(
    <div
      className={styles.backdrop}
      role='presentation'
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onClose()
      }}
    >
      <div
        ref={dialogRef}
        className={styles.modal}
        role='alertdialog'
        aria-modal='true'
        aria-labelledby='learning-path-delete-title'
        aria-describedby='learning-path-delete-body'
        tabIndex={-1}
      >
        <header className={styles.header}>
          <h2 id='learning-path-delete-title' className={styles.title}>
            Delete learning path?
          </h2>
          <button
            type='button'
            className={styles.close}
            aria-label='Close'
            disabled={busy}
            onClick={onClose}
          >
            ×
          </button>
        </header>
        <p id='learning-path-delete-body' className={styles.body}>
          Are you sure you want to delete <strong>{title}</strong>? This
          permanently removes the path, its outline, and resources. This cannot
          be undone.
        </p>
        {error ? <p className={styles.error}>{error}</p> : null}
        <div className={styles.actions}>
          <button
            ref={cancelRef}
            type='button'
            className={styles.cancel}
            disabled={busy}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type='button'
            className={styles.confirm}
            disabled={busy}
            onClick={onConfirm}
          >
            {busy ? 'Deleting…' : 'Delete learning path'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
