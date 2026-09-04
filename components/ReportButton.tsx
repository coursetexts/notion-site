import * as React from 'react'

import { useAuthOptional } from '@/contexts/AuthContext'
import { createPortal } from 'react-dom'

import { currentAuthRedirectPath, signInPageHref } from '@/lib/auth-redirect'
import {
  type ContentReportTarget,
  contentReportTypeLabel
} from '@/lib/content-reports'
import { submitContentReport } from '@/lib/content-reports-db'

import styles from './ReportButton.module.css'

function FlagIcon() {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='14'
      height='14'
      viewBox='0 0 16 16'
      fill='none'
      aria-hidden
    >
      <path
        d='M3.25 13.5V2.5M3.25 2.5h8.1l-1.55 2.55 1.55 2.55H3.25'
        stroke='currentColor'
        strokeWidth='1.3'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

export const reportHoverTargetClass = styles.reportHoverTarget

export function ReportButton({
  target,
  variant = 'hover',
  className,
  onOpen
}: {
  target: ContentReportTarget
  variant?: 'hover' | 'always' | 'menuItem'
  className?: string
  onOpen?: () => void
}) {
  const auth = useAuthOptional()
  const [open, setOpen] = React.useState(false)
  const [reason, setReason] = React.useState('')
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [sent, setSent] = React.useState(false)
  const dialogRef = React.useRef<HTMLDivElement>(null)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  const close = React.useCallback(() => {
    setOpen(false)
    setReason('')
    setError(null)
    setSubmitting(false)
    setSent(false)
  }, [])

  React.useEffect(() => {
    if (!open) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const frame = window.requestAnimationFrame(() => {
      if (sent) dialogRef.current?.focus()
      else textareaRef.current?.focus()
    })
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.cancelAnimationFrame(frame)
      window.removeEventListener('keydown', onKey)
    }
  }, [open, sent, close])

  function handleOpen(event: React.MouseEvent) {
    event.preventDefault()
    event.stopPropagation()
    onOpen?.()
    if (!auth?.user) {
      const next = currentAuthRedirectPath()
      if (auth?.signInWithGoogle) {
        void auth.signInWithGoogle(next)
        return
      }
      window.location.href = signInPageHref(next)
      return
    }
    setOpen(true)
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (submitting || !reason.trim()) return
    setSubmitting(true)
    setError(null)
    const result = await submitContentReport({ target, reason })
    setSubmitting(false)
    if (result.ok) {
      setSent(true)
      return
    }
    setError(result.error || 'Could not send your report. Try again.')
  }

  const kind = contentReportTypeLabel(target.type).toLowerCase()
  const modal =
    typeof document === 'undefined' || !open
      ? null
      : createPortal(
          <div
            className={styles.backdrop}
            role='presentation'
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) close()
            }}
          >
            <div
              ref={dialogRef}
              className={styles.modal}
              role='dialog'
              aria-modal='true'
              aria-labelledby='content-report-title'
              tabIndex={-1}
              onMouseDown={(event) => event.stopPropagation()}
            >
              <div className={styles.header}>
                <h2 id='content-report-title' className={styles.title}>
                  {sent ? 'Report sent' : `Report this ${kind}`}
                </h2>
                <button
                  type='button'
                  className={styles.close}
                  onClick={close}
                  aria-label='Close'
                >
                  ×
                </button>
              </div>
              <div className={styles.body}>
                {sent ? (
                  <p className={styles.success}>
                    We are reviewing your report.
                  </p>
                ) : (
                  <form onSubmit={handleSubmit}>
                    <p className={styles.lead}>
                      Tell us why this {kind} should be reviewed. We read every
                      report.
                    </p>
                    <label
                      className={styles.label}
                      htmlFor='content-report-reason'
                    >
                      Why are you reporting this?
                    </label>
                    <textarea
                      ref={textareaRef}
                      id='content-report-reason'
                      className={styles.textarea}
                      value={reason}
                      onChange={(event) => setReason(event.target.value)}
                      placeholder='Describe the problem…'
                      required
                      rows={5}
                    />
                    {error ? <p className={styles.error}>{error}</p> : null}
                    <div className={styles.actions}>
                      <button
                        type='button'
                        className={styles.cancel}
                        onClick={close}
                      >
                        Cancel
                      </button>
                      <button
                        type='submit'
                        className={styles.submit}
                        disabled={submitting || !reason.trim()}
                      >
                        {submitting ? 'Sending…' : 'Send report'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>,
          document.body
        )

  const buttonClass =
    variant === 'menuItem'
      ? `${styles.menuItem}${className ? ` ${className}` : ''}`
      : `${variant === 'always' ? styles.flagAlways : styles.flag}${
          className ? ` ${className}` : ''
        }`

  return (
    <>
      <button
        type='button'
        className={buttonClass}
        onClick={handleOpen}
        onMouseDown={(event) => event.stopPropagation()}
        aria-label={`Report this ${kind}`}
        title='Report'
        role={variant === 'menuItem' ? 'menuitem' : undefined}
      >
        {variant === 'menuItem' ? 'Report' : <FlagIcon />}
      </button>
      {modal}
    </>
  )
}
