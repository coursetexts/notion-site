import * as React from 'react'
import { createPortal } from 'react-dom'

import styles from './LearningPathFillRetryModal.module.css'

const MAX_CHANGES = 1500

export function LearningPathFillRetryModal({
  open,
  onClose,
  onSubmit
}: {
  open: boolean
  onClose: () => void
  onSubmit: (changes: string) => void
}) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  const closeRef = React.useRef(onClose)
  closeRef.current = onClose
  const [note, setNote] = React.useState('')

  React.useEffect(() => {
    if (!open) return
    setNote('')
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const frame = window.requestAnimationFrame(() => {
      textareaRef.current?.focus()
    })
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') closeRef.current()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.cancelAnimationFrame(frame)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div
      className={styles.backdrop}
      role='presentation'
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        className={styles.modal}
        role='dialog'
        aria-modal='true'
        aria-labelledby='learning-path-retry-title'
        aria-describedby='learning-path-retry-body'
        tabIndex={-1}
      >
        <header className={styles.header}>
          <h2 id='learning-path-retry-title' className={styles.title}>
            Try this path again
          </h2>
          <button
            type='button'
            className={styles.close}
            aria-label='Close'
            onClick={onClose}
          >
            ×
          </button>
        </header>
        <p id='learning-path-retry-body' className={styles.body}>
          What should change from this path? Leave this blank to generate
          another version from the same goal.
        </p>
        <form
          className={styles.form}
          onSubmit={(event) => {
            event.preventDefault()
            onSubmit(note.trim())
          }}
        >
          <label className={styles.field}>
            <span className={styles.label}>What to change</span>
            <textarea
              ref={textareaRef}
              className={styles.textarea}
              value={note}
              maxLength={MAX_CHANGES}
              rows={5}
              placeholder='Fewer theory steps, more practice, skip the history section…'
              onChange={(event) => setNote(event.target.value)}
            />
          </label>
          <div className={styles.actions}>
            <button type='button' className={styles.cancel} onClick={onClose}>
              Cancel
            </button>
            <button type='submit' className={styles.confirm}>
              Generate again
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
