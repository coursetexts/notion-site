import * as React from 'react'

import { CommunityComments } from '@/components/CommunityComments'
import { useAuthOptional } from '@/contexts/AuthContext'
import { currentAuthRedirectPath, signInPageHref } from '@/lib/auth-redirect'
import { setProfileUpdateLiked } from '@/lib/profile-updates-db'
import styles from '@/styles/profile.module.css'

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width={14}
      height={14}
      viewBox='0 0 24 24'
      fill={filled ? 'currentColor' : 'none'}
      stroke='currentColor'
      strokeWidth={1.75}
      strokeLinecap='round'
      strokeLinejoin='round'
      aria-hidden
    >
      <path d='M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z' />
    </svg>
  )
}

function CommentIcon() {
  return (
    <svg
      width={14}
      height={14}
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth={1.75}
      strokeLinecap='round'
      strokeLinejoin='round'
      aria-hidden
    >
      <path d='M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z' />
    </svg>
  )
}

/** Like + expandable reply thread for a profile update (personal or Following). */
export function ActivityFeedUpdateReplies({
  updateId,
  initialLikeCount = 0,
  initialLikedByMe = false,
  initialCommentCount = 0
}: {
  updateId: string
  initialLikeCount?: number
  initialLikedByMe?: boolean
  initialCommentCount?: number
}) {
  const auth = useAuthOptional()
  const signedIn = Boolean(auth?.user)
  const [open, setOpen] = React.useState(false)
  const [commentCount, setCommentCount] = React.useState(initialCommentCount)
  const [likeCount, setLikeCount] = React.useState(initialLikeCount)
  const [likedByMe, setLikedByMe] = React.useState(initialLikedByMe)
  const [likeBusy, setLikeBusy] = React.useState(false)
  const rootRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    setCommentCount(initialCommentCount)
  }, [initialCommentCount])

  React.useEffect(() => {
    setLikeCount(initialLikeCount)
    setLikedByMe(initialLikedByMe)
  }, [initialLikeCount, initialLikedByMe])

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

  async function toggleLike() {
    if (!signedIn) {
      requestSignIn()
      return
    }
    if (likeBusy) return
    const nextLiked = !likedByMe
    setLikeBusy(true)
    setLikedByMe(nextLiked)
    setLikeCount((count) => Math.max(0, count + (nextLiked ? 1 : -1)))
    const result = await setProfileUpdateLiked(updateId, nextLiked)
    if (result) {
      setLikedByMe(result.likedByMe)
      setLikeCount(result.likeCount)
    } else {
      setLikedByMe(!nextLiked)
      setLikeCount((count) => Math.max(0, count + (nextLiked ? -1 : 1)))
    }
    setLikeBusy(false)
  }

  return (
    <div ref={rootRef} className={styles.activityUpdateReplies}>
      <div className={styles.updatesActions}>
        <button
          type='button'
          className={
            likedByMe
              ? `${styles.updatesActionBtn} ${styles.updatesActionBtnLiked}`
              : styles.updatesActionBtn
          }
          disabled={likeBusy}
          aria-pressed={likedByMe}
          aria-label={likedByMe ? 'Unlike update' : 'Like update'}
          onClick={() => void toggleLike()}
        >
          <HeartIcon filled={likedByMe} />
          <span>{likeCount > 0 ? likeCount : 'Like'}</span>
        </button>
        <button
          type='button'
          className={styles.updatesActionBtn}
          aria-expanded={open}
          aria-label={
            open ? 'Hide replies' : 'Show replies and discussion'
          }
          onClick={() => {
            if (!signedIn) {
              requestSignIn()
              return
            }
            setOpen((value) => !value)
          }}
        >
          <CommentIcon />
          <span>
            {commentCount > 0
              ? `${commentCount} ${commentCount === 1 ? 'reply' : 'replies'}`
              : 'Reply'}
          </span>
        </button>
      </div>
      {open ? (
        <div className={styles.activityUpdateReplyThread}>
          <CommunityComments
            targetType='profile_update'
            targetId={updateId}
            signedIn={signedIn}
            variant='discussion'
            onCountChange={setCommentCount}
          />
        </div>
      ) : null}
    </div>
  )
}
