import * as React from 'react'

import { CommunityComments } from '@/components/CommunityComments'
import { useAuthOptional } from '@/contexts/AuthContext'
import { currentAuthRedirectPath, signInPageHref } from '@/lib/auth-redirect'
import styles from '@/styles/profile.module.css'

function ReplyArrowIcon() {
  return (
    <svg
      width={12}
      height={12}
      viewBox='0 0 16 16'
      fill='none'
      aria-hidden
    >
      <path
        d='M3 8h9M8 4l4 4-4 4'
        stroke='currentColor'
        strokeWidth='1.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

/** Expandable discussion-style reply thread for a profile update (Activity feed). */
export function ActivityFeedUpdateReplies({
  updateId
}: {
  updateId: string
}) {
  const auth = useAuthOptional()
  const signedIn = Boolean(auth?.user)
  const [open, setOpen] = React.useState(false)
  const [count, setCount] = React.useState(0)
  const rootRef = React.useRef<HTMLDivElement>(null)

  function requestSignIn() {
    if (auth?.signInWithGoogle) {
      void auth.signInWithGoogle(currentAuthRedirectPath())
      return
    }
    window.location.href = signInPageHref(currentAuthRedirectPath())
  }

  React.useEffect(() => {
    if (!open) return
    function onPointerDown(event: MouseEvent | TouchEvent) {
      const target = event.target
      if (!(target instanceof Node)) return
      if (rootRef.current?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('touchstart', onPointerDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('touchstart', onPointerDown)
    }
  }, [open])

  return (
    <div ref={rootRef} className={styles.activityUpdateReplies}>
      <button
        type='button'
        className={styles.activityUpdateReplyBtn}
        aria-expanded={open}
        onClick={() => {
          if (!signedIn) {
            requestSignIn()
            return
          }
          setOpen((value) => !value)
        }}
      >
        <ReplyArrowIcon />
        <span>
          {open
            ? 'Hide replies'
            : count > 0
              ? `${count} ${count === 1 ? 'reply' : 'replies'}`
              : 'Reply'}
        </span>
      </button>
      {open ? (
        <div className={styles.activityUpdateReplyThread}>
          <CommunityComments
            targetType='profile_update'
            targetId={updateId}
            signedIn={signedIn}
            variant='discussion'
            onCountChange={setCount}
          />
        </div>
      ) : null}
    </div>
  )
}
