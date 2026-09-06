import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'

import { useAuthOptional } from '@/contexts/AuthContext'
import { currentAuthRedirectPath, signInPageHref } from '@/lib/auth-redirect'
import { requestLearningPathJoin } from '@/lib/learning-path-join-requests-db'
import { titleFromSlug } from '@/lib/learning-path-slug'

import styles from './LearningPathUnavailable.module.css'

function joinErrorMessage(error: string | null) {
  if (error === 'signed-out') return 'Sign in to request access.'
  if (error === 'no-email') {
    return 'Your account needs an email before you can request access.'
  }
  if (error === 'already-invited') {
    return 'You’re already invited. Try signing in with that email again.'
  }
  if (error === 'owner') return 'You already own this path.'
  if (error === 'not-private') return 'This path is not private.'
  if (error === 'missing') return 'This learning path is not available.'
  if (error === 'failed') return 'Could not send that request. Try again.'
  return error
}

export function LearningPathUnavailable({
  slug,
  reason,
  joinRequested = false
}: {
  slug: string
  reason: 'private' | 'missing'
  joinRequested?: boolean
}) {
  const router = useRouter()
  const auth = useAuthOptional()
  const title = titleFromSlug(slug) || slug
  const signedIn = Boolean(auth?.user)
  const createHref = `/learning-path/new?goal=${encodeURIComponent(
    `I want to ${title.toLowerCase()}`
  )}`
  const [requested, setRequested] = React.useState(joinRequested)
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    setRequested(joinRequested)
  }, [joinRequested, slug])

  function requestSignIn() {
    const next = currentAuthRedirectPath()
    if (auth?.signInWithGoogle) {
      void auth.signInWithGoogle(next)
      return
    }
    void router.push(signInPageHref(next))
  }

  async function handleRequestJoin() {
    if (!signedIn) {
      requestSignIn()
      return
    }
    setBusy(true)
    setError(null)
    try {
      const result = await requestLearningPathJoin(slug)
      if ('error' in result) {
        setError(result.error)
        return
      }
      setRequested(true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <p className={styles.kicker}>Learning path</p>
        <h1 className={styles.title}>{title}</h1>
        {reason === 'private' ? (
          <>
            <p className={styles.body}>
              This learning path is <b> private</b>. Request to join and the owner will
              see your email. If they already invited you, sign in with that
              address.
            </p>
            {signedIn ? (
              <p className={styles.note}>
                You’re signed in
                {auth?.user?.email ? ` as ${auth.user.email}` : ''}.
                {requested
                  ? ' Your request is waiting on the owner.'
                  : ' That account doesn’t have an invitation yet.'}
              </p>
            ) : null}
            {error ? (
              <p className={styles.error}>{joinErrorMessage(error)}</p>
            ) : null}
            <div className={styles.actions}>
              {signedIn ? (
                <button
                  type='button'
                  className={styles.primary}
                  disabled={busy || requested}
                  onClick={() => void handleRequestJoin()}
                >
                  {requested
                    ? 'Request sent'
                    : busy
                    ? 'Sending…'
                    : 'Request to join'}
                </button>
              ) : (
                <button
                  type='button'
                  className={styles.primary}
                  onClick={requestSignIn}
                >
                  Sign in
                </button>
              )}
              <Link href='/all-courses?view=learning-paths'>
                <a className={styles.secondary}>Browse learning paths</a>
              </Link>
            </div>
          </>
        ) : (
          <>
            <p className={styles.body}>
              This learning path “{title}” doesn’t exist yet. You can start one
              from this goal.
            </p>
            <div className={styles.actions}>
              <Link href={createHref}>
                <a className={styles.primary}>Create this path</a>
              </Link>
              <Link href='/all-courses?view=learning-paths'>
                <a className={styles.secondary}>Browse learning paths</a>
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
