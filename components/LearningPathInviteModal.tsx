import * as React from 'react'

import { createPortal } from 'react-dom'

import type { LearningPathJoinRequest } from '@/lib/learning-path-join-requests-db'
import type { LearningPathInvite } from '@/lib/learning-path-invites-db'
import { isValidLearningPathInviteEmail } from '@/lib/learning-path-invites-db'

import styles from './LearningPathInviteModal.module.css'

function inviteErrorMessage(error: string | null) {
  if (error === 'invalid') return 'Enter a valid email address.'
  if (error === 'not-found') return "That person isn't on Coursetexts yet."
  if (error === 'self') return "That's your email."
  if (error === 'already') return 'They are already invited.'
  if (error === 'failed') return 'Could not invite that person. Try again.'
  return error
}

export function LearningPathInviteModal({
  open,
  invites,
  requests = [],
  busy = false,
  removingId = null,
  acceptingId = null,
  error = null,
  onClose,
  onInvite,
  onRemove,
  onAcceptRequest,
  onDismissRequest
}: {
  open: boolean
  invites: LearningPathInvite[]
  requests?: LearningPathJoinRequest[]
  busy?: boolean
  removingId?: string | null
  acceptingId?: string | null
  error?: string | null
  onClose: () => void
  onInvite: (email: string) => Promise<boolean> | boolean
  onRemove: (inviteId: string) => void
  onAcceptRequest?: (request: LearningPathJoinRequest) => void
  onDismissRequest?: (requestId: string) => void
}) {
  const dialogRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const closeRef = React.useRef(onClose)
  closeRef.current = onClose
  const [draft, setDraft] = React.useState('')

  React.useEffect(() => {
    if (open) setDraft('')
  }, [open])

  React.useEffect(() => {
    if (!open) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const frame = window.requestAnimationFrame(() => {
      inputRef.current?.focus()
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

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const email = draft.trim()
    if (!email || busy) return
    const ok = await onInvite(email)
    if (ok) setDraft('')
  }

  if (typeof document === 'undefined' || !open) return null

  const canSubmit = isValidLearningPathInviteEmail(draft) && !busy

  return createPortal(
    <div
      className={styles.backdrop}
      role='presentation'
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        ref={dialogRef}
        className={styles.modal}
        role='dialog'
        aria-modal='true'
        aria-labelledby='invite-collab-title'
        tabIndex={-1}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className={styles.header}>
          <h2 id='invite-collab-title' className={styles.title}>
            Invite a collaborator
          </h2>
          <button
            type='button'
            className={styles.close}
            onClick={onClose}
            aria-label='Close'
          >
            ×
          </button>
        </div>
        <p className={styles.intro}>
          They must already have a Coursetexts account. We don’t send an email —
          they can open and edit this path while signed in with that address.
        </p>
        <form className={styles.form} onSubmit={(event) => void handleSubmit(event)}>
          <label className={styles.field}>
            <span className={styles.visuallyHidden}>Email</span>
            <input
              ref={inputRef}
              className={styles.input}
              type='email'
              autoComplete='email'
              placeholder='name@example.com'
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              disabled={busy}
            />
          </label>
          <button type='submit' className={styles.submit} disabled={!canSubmit}>
            {busy ? 'Inviting…' : 'Invite'}
          </button>
        </form>
        {error ? <p className={styles.error}>{inviteErrorMessage(error)}</p> : null}
        {requests.length > 0 ? (
          <>
            <p className={styles.sectionLabel}>Asked to join</p>
            <ul className={styles.list}>
              {requests.map((request) => (
                <li key={request.id} className={styles.item}>
                  <div className={styles.person}>
                    {request.displayName ? (
                      <span className={styles.name}>{request.displayName}</span>
                    ) : null}
                    <span className={styles.email}>{request.email}</span>
                  </div>
                  <div className={styles.itemActions}>
                    <button
                      type='button'
                      className={styles.invite}
                      disabled={acceptingId === request.id || busy}
                      onClick={() => onAcceptRequest?.(request)}
                    >
                      {acceptingId === request.id ? 'Inviting…' : 'Invite'}
                    </button>
                    <button
                      type='button'
                      className={styles.remove}
                      disabled={removingId === request.id}
                      onClick={() => onDismissRequest?.(request.id)}
                    >
                      {removingId === request.id ? 'Removing…' : 'Dismiss'}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </>
        ) : null}
        {invites.length === 0 && requests.length === 0 ? (
          <p className={styles.empty}>No one else can edit this path yet.</p>
        ) : invites.length === 0 ? null : (
          <>
            {requests.length > 0 ? (
              <p className={styles.sectionLabel}>Collaborators</p>
            ) : null}
            <ul className={styles.list}>
              {invites.map((invite) => (
                <li key={invite.id} className={styles.item}>
                  <div className={styles.person}>
                    {invite.displayName ? (
                      <span className={styles.name}>{invite.displayName}</span>
                    ) : null}
                    <span className={styles.email}>{invite.email}</span>
                  </div>
                  <button
                    type='button'
                    className={styles.remove}
                    disabled={removingId === invite.id}
                    onClick={() => onRemove(invite.id)}
                  >
                    {removingId === invite.id ? 'Removing…' : 'Remove'}
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>,
    document.body
  )
}
