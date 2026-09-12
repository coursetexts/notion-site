import * as React from 'react'

import { CommunityComments } from '@/components/CommunityComments'
import { useAuthOptional } from '@/contexts/AuthContext'
import { currentAuthRedirectPath, signInPageHref } from '@/lib/auth-redirect'
import {
  createProfileUpdateQuote,
  createProfileUpdateRepost,
  setProfileUpdateLiked
} from '@/lib/profile-updates-db'
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

function RepostIcon() {
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
      <path d='M17 1l4 4-4 4' />
      <path d='M3 11V9a4 4 0 0 1 4-4h14' />
      <path d='M7 23l-4-4 4-4' />
      <path d='M21 13v2a4 4 0 0 1-4 4H3' />
    </svg>
  )
}

function QuoteIcon() {
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
      <path d='M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21z' />
      <path d='M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3z' />
    </svg>
  )
}

/** Like, reply, repost, and quote for a profile update (personal or Following). */
export function ActivityFeedUpdateReplies({
  updateId,
  updateAuthorId,
  initialLikeCount = 0,
  initialLikedByMe = false,
  initialCommentCount = 0,
  onCreated
}: {
  updateId: string
  /** When set and equal to the signed-in user, hide Repost. */
  updateAuthorId?: string | null
  initialLikeCount?: number
  initialLikedByMe?: boolean
  initialCommentCount?: number
  /** Called after a successful repost or quote (e.g. refresh list). */
  onCreated?: () => void
}) {
  const auth = useAuthOptional()
  const signedIn = Boolean(auth?.user)
  const isOwnUpdate =
    Boolean(updateAuthorId) && auth?.user?.id === updateAuthorId
  const [open, setOpen] = React.useState(false)
  const [repostMenuOpen, setRepostMenuOpen] = React.useState(false)
  const [quoteOpen, setQuoteOpen] = React.useState(false)
  const [quoteDraft, setQuoteDraft] = React.useState('')
  const [quoteBusy, setQuoteBusy] = React.useState(false)
  const [repostBusy, setRepostBusy] = React.useState(false)
  const [reposted, setReposted] = React.useState(false)
  const [commentCount, setCommentCount] = React.useState(initialCommentCount)
  const [likeCount, setLikeCount] = React.useState(initialLikeCount)
  const [likedByMe, setLikedByMe] = React.useState(initialLikedByMe)
  const [likeBusy, setLikeBusy] = React.useState(false)
  const rootRef = React.useRef<HTMLDivElement>(null)
  const quoteRef = React.useRef<HTMLTextAreaElement>(null)

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
    if (!open && !quoteOpen && !repostMenuOpen) return
    function onPointerDown(event: MouseEvent | TouchEvent) {
      const target = event.target
      if (!(target instanceof Node)) return
      if (rootRef.current?.contains(target)) return
      setOpen(false)
      setQuoteOpen(false)
      setRepostMenuOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('touchstart', onPointerDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('touchstart', onPointerDown)
    }
  }, [open, quoteOpen, repostMenuOpen])

  React.useEffect(() => {
    if (quoteOpen) quoteRef.current?.focus()
  }, [quoteOpen])

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

  async function handleRepost() {
    if (!signedIn) {
      requestSignIn()
      return
    }
    if (repostBusy || isOwnUpdate || reposted) return
    setRepostBusy(true)
    setRepostMenuOpen(false)
    const created = await createProfileUpdateRepost(updateId)
    setRepostBusy(false)
    if (!created) {
      window.alert(
        'Could not repost this update. If this keeps failing, apply migration 051_profile_update_reposts in Supabase.'
      )
      return
    }
    setReposted(true)
    onCreated?.()
  }

  async function handleQuote() {
    if (!signedIn) {
      requestSignIn()
      return
    }
    const commentary = quoteDraft.trim()
    // Empty commentary on someone else's update = plain repost.
    if (!commentary) {
      if (isOwnUpdate) return
      await handleRepost()
      setQuoteOpen(false)
      setQuoteDraft('')
      return
    }
    if (quoteBusy) return
    setQuoteBusy(true)
    const created = await createProfileUpdateQuote(updateId, commentary)
    setQuoteBusy(false)
    if (!created) {
      window.alert(
        'Could not post your quote. If this keeps failing, apply migration 051_profile_update_reposts in Supabase.'
      )
      return
    }
    setQuoteDraft('')
    setQuoteOpen(false)
    onCreated?.()
  }

  function openRepostMenu() {
    if (!signedIn) {
      requestSignIn()
      return
    }
    setOpen(false)
    setQuoteOpen(false)
    setRepostMenuOpen((value) => !value)
  }

  function openQuoteComposer() {
    if (!signedIn) {
      requestSignIn()
      return
    }
    setOpen(false)
    setRepostMenuOpen(false)
    setQuoteOpen(true)
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
          aria-label={
            likedByMe
              ? likeCount > 0
                ? `Unlike update (${likeCount})`
                : 'Unlike update'
              : likeCount > 0
              ? `Like update (${likeCount})`
              : 'Like update'
          }
          onClick={() => void toggleLike()}
        >
          <HeartIcon filled={likedByMe} />
          {likeCount > 0 ? <span>{likeCount}</span> : null}
        </button>
        <button
          type='button'
          className={styles.updatesActionBtn}
          aria-expanded={open}
          aria-label={
            open
              ? commentCount > 0
                ? `Hide replies (${commentCount})`
                : 'Hide replies'
              : commentCount > 0
              ? `Show replies (${commentCount})`
              : 'Show replies and discussion'
          }
          onClick={() => {
            if (!signedIn) {
              requestSignIn()
              return
            }
            setQuoteOpen(false)
            setRepostMenuOpen(false)
            setOpen((value) => !value)
          }}
        >
          <CommentIcon />
          {commentCount > 0 ? <span>{commentCount}</span> : null}
        </button>
        {!isOwnUpdate ? (
          <div className={styles.repostActionWrap}>
            <button
              type='button'
              className={
                reposted
                  ? `${styles.updatesActionBtn} ${styles.updatesActionBtnReposted}`
                  : styles.updatesActionBtn
              }
              disabled={repostBusy}
              aria-expanded={repostMenuOpen}
              aria-haspopup='menu'
              aria-label={
                repostBusy
                  ? 'Reposting'
                  : reposted
                  ? 'Already reposted'
                  : 'Repost or quote update'
              }
              onClick={openRepostMenu}
            >
              <RepostIcon />
            </button>
            {repostMenuOpen ? (
              <div className={styles.repostMenu} role='menu'>
                <button
                  type='button'
                  role='menuitem'
                  className={styles.repostMenuItem}
                  disabled={repostBusy || reposted}
                  onClick={() => void handleRepost()}
                >
                  <RepostIcon />
                  <span>
                    <strong>Repost</strong>
                    <em>Share without adding a comment</em>
                  </span>
                </button>
                <button
                  type='button'
                  role='menuitem'
                  className={styles.repostMenuItem}
                  onClick={openQuoteComposer}
                >
                  <QuoteIcon />
                  <span>
                    <strong>Quote</strong>
                    <em>Add your own commentary</em>
                  </span>
                </button>
              </div>
            ) : null}
          </div>
        ) : (
          <button
            type='button'
            className={styles.updatesActionBtn}
            aria-expanded={quoteOpen}
            aria-label='Quote update'
            onClick={openQuoteComposer}
          >
            <QuoteIcon />
          </button>
        )}
      </div>
      {quoteOpen ? (
        <form
          className={styles.updateQuoteComposer}
          onSubmit={(event) => {
            event.preventDefault()
            void handleQuote()
          }}
        >
          <textarea
            ref={quoteRef}
            className={styles.updateQuoteInput}
            value={quoteDraft}
            onChange={(event) => setQuoteDraft(event.target.value)}
            placeholder={
              isOwnUpdate
                ? 'Add a comment…'
                : 'Add a comment, or leave blank to just repost…'
            }
            rows={3}
            aria-label='Quote commentary'
          />
          <div className={styles.updateQuoteFooter}>
            <button
              type='button'
              className={styles.updatesNoteSecondary}
              onClick={() => {
                setQuoteOpen(false)
                setQuoteDraft('')
              }}
            >
              Cancel
            </button>
            <button
              type='submit'
              className={styles.updatesNotePost}
              disabled={
                quoteBusy ||
                repostBusy ||
                (isOwnUpdate && !quoteDraft.trim())
              }
            >
              {quoteBusy || repostBusy
                ? 'Posting…'
                : quoteDraft.trim() || isOwnUpdate
                  ? 'Quote'
                  : 'Repost'}
            </button>
          </div>
        </form>
      ) : null}
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
