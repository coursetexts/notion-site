import * as React from 'react'
import { useRouter } from 'next/router'

import styles from './CreateLearningPathModal.module.css'

export function CreateLearningPathModal({
  open,
  onClose
}: {
  open: boolean
  onClose: () => void
}) {
  const router = useRouter()
  const [draft, setDraft] = React.useState('')

  React.useEffect(() => {
    if (open) setDraft('')
  }, [open])

  React.useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  function handleCreate(event: React.FormEvent) {
    event.preventDefault()
    const goal = draft.trim()
    if (!goal) return
    onClose()
    void router.push({
      pathname: '/learning-path/new',
      query: { goal }
    })
  }

  if (!open) return null

  return (
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
        aria-labelledby='create-path-title'
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          <div className={styles.modalHeading}>
            <h2 id='create-path-title' className={styles.modalTitle}>
              What do you want to learn?
            </h2>
            <p className={styles.workflow}>
              Describe your goal → receive an editable draft path → add resources
              → save or publish.
            </p>
          </div>
          <button
            type='button'
            className={styles.modalClose}
            onClick={onClose}
            aria-label='Close'
          >
            ×
          </button>
        </div>
        <form className={styles.modalForm} onSubmit={handleCreate}>
          <label className={styles.field}>
            <span className={styles.label}>Your goal</span>
            <textarea
              className={styles.textarea}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder='I want to…'
              rows={4}
              autoFocus
            />
          </label>
          <div className={styles.modalActions}>
            <button
              type='button'
              className={styles.cancelBtn}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type='submit'
              className={styles.submitBtn}
              disabled={!draft.trim()}
            >
              Continue
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
