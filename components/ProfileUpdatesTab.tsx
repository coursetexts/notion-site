import * as React from 'react'

import { CommunityComments } from '@/components/CommunityComments'
import { ProfileAnnouncementIcon } from '@/components/ProfileTabItemIcons'
import { useAuthOptional } from '@/contexts/AuthContext'
import { currentAuthRedirectPath, signInPageHref } from '@/lib/auth-redirect'
import {
  type ProfileUpdate,
  createProfileUpdate,
  listProfileUpdatesByUserId,
  setProfileUpdateLiked
} from '@/lib/profile-updates-db'
import styles from '@/styles/profile.module.css'

function formatUpdateDate(iso: string | undefined): string {
  const trimmed = (iso ?? '').trim()
  if (!trimmed) return ''
  const date = new Date(trimmed)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

function ExternalLinkIcon() {
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
      <path d='M14 4h6v6' />
      <path d='M10 14L20 4' />
      <path d='M20 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h5' />
    </svg>
  )
}

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

function UpdateCard({
  update,
  signedIn,
  onToggleLike,
  likeBusy
}: {
  update: ProfileUpdate
  signedIn: boolean
  onToggleLike: (update: ProfileUpdate) => void
  likeBusy: boolean
}) {
  const auth = useAuthOptional()
  const [commentsOpen, setCommentsOpen] = React.useState(false)
  const [commentCount, setCommentCount] = React.useState(update.commentCount)
  const repliesRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    setCommentCount(update.commentCount)
  }, [update.commentCount])

  React.useEffect(() => {
    if (!commentsOpen) return
    function onPointerDown(event: MouseEvent | TouchEvent) {
      const target = event.target
      if (!(target instanceof Node)) return
      if (repliesRef.current?.contains(target)) return
      setCommentsOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('touchstart', onPointerDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('touchstart', onPointerDown)
    }
  }, [commentsOpen])

  const body = update.description.trim()
  const title = update.title.trim()
  const showTitle =
    Boolean(title) &&
    title !== body &&
    !body.startsWith(title) &&
    title !== body.slice(0, 72)
  const hasUrl = Boolean(update.url?.trim())
  const dateLabel = formatUpdateDate(update.createdAt)

  function requestSignIn() {
    if (auth?.signInWithGoogle) {
      void auth.signInWithGoogle(currentAuthRedirectPath())
      return
    }
    window.location.href = signInPageHref(currentAuthRedirectPath())
  }

  return (
    <article className={styles.updatesCard}>
      <span className={styles.tabItemIcon} aria-hidden>
        <ProfileAnnouncementIcon />
      </span>
      <div className={styles.updatesCardMain}>
        <div className={styles.updatesCardTitleRow}>
          {showTitle ? (
            <h3 className={styles.updatesCardTitle}>{title}</h3>
          ) : (
            <span className={styles.updatesCardTitleSpacer} />
          )}
          {dateLabel ? (
            <span className={styles.tabItemDate}>{dateLabel}</span>
          ) : null}
        </div>
        {body ? <p className={styles.updatesCardBody}>{body}</p> : null}
        {hasUrl ? (
          <a
            href={update.url}
            target='_blank'
            rel='noopener noreferrer'
            className={styles.updatesExternalLink}
            aria-label={`Open link for ${title || 'update'}`}
          >
            <ExternalLinkIcon />
            <span>Link</span>
          </a>
        ) : null}
        {update.tags.length > 0 ? (
          <ul className={styles.updatesTagList} aria-label='Tags'>
            {update.tags.map((tag) => (
              <li key={tag} className={styles.updatesTag}>
                {tag}
              </li>
            ))}
          </ul>
        ) : null}
        <div ref={repliesRef}>
          <div className={styles.updatesActions}>
            <button
              type='button'
              className={
                update.likedByMe
                  ? `${styles.updatesActionBtn} ${styles.updatesActionBtnLiked}`
                  : styles.updatesActionBtn
              }
              disabled={likeBusy}
              aria-pressed={update.likedByMe}
              aria-label={update.likedByMe ? 'Unlike update' : 'Like update'}
              onClick={() => {
                if (!signedIn) {
                  requestSignIn()
                  return
                }
                onToggleLike(update)
              }}
            >
              <HeartIcon filled={update.likedByMe} />
              <span>{update.likeCount > 0 ? update.likeCount : 'Like'}</span>
            </button>
            <button
              type='button'
              className={styles.updatesActionBtn}
              aria-expanded={commentsOpen}
              aria-label={
                commentsOpen ? 'Hide replies' : 'Show replies and discussion'
              }
              onClick={() => setCommentsOpen((open) => !open)}
            >
              <CommentIcon />
              <span>
                {commentCount > 0
                  ? `${commentCount} ${commentCount === 1 ? 'reply' : 'replies'}`
                  : 'Reply'}
              </span>
            </button>
          </div>
          {commentsOpen ? (
            <div className={styles.updatesComments}>
              <CommunityComments
                targetType='profile_update'
                targetId={update.id}
                signedIn={signedIn}
                variant='discussion'
                onCountChange={setCommentCount}
              />
            </div>
          ) : null}
        </div>
      </div>
    </article>
  )
}

function normalizeTag(value: string): string {
  return value.trim().replace(/\s+/g, ' ')
}

function UpdateNoteComposer({
  onSubmit
}: {
  onSubmit: (draft: {
    title: string
    description: string
    type: 'Document'
    url: string
    tags: string[]
  }) => Promise<boolean>
}) {
  const [body, setBody] = React.useState('')
  const [tags, setTags] = React.useState<string[]>([])
  const [tagDraft, setTagDraft] = React.useState('')
  const [showTags, setShowTags] = React.useState(false)
  const [busy, setBusy] = React.useState(false)
  const [focused, setFocused] = React.useState(false)
  const bodyRef = React.useRef<HTMLTextAreaElement>(null)

  function resizeTextarea() {
    const el = bodyRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.max(el.scrollHeight, 72)}px`
  }

  React.useEffect(() => {
    resizeTextarea()
  }, [body])

  function addTagFromDraft() {
    const next = normalizeTag(tagDraft)
    if (!next) return
    setTags((prev) =>
      prev.some((tag) => tag.toLowerCase() === next.toLowerCase())
        ? prev
        : [...prev, next]
    )
    setTagDraft('')
  }

  function removeTag(tag: string) {
    setTags((prev) => prev.filter((item) => item !== tag))
  }

  async function post() {
    const description = body.trim()
    if (!description || busy) return
    setBusy(true)
    const ok = await onSubmit({
      title: description.slice(0, 72),
      type: 'Document',
      description,
      tags,
      url: ''
    })
    setBusy(false)
    if (!ok) {
      window.alert('Could not post this update. Try again.')
      return
    }
    setBody('')
    setTags([])
    setTagDraft('')
    setShowTags(false)
    setFocused(false)
    bodyRef.current?.blur()
  }

  const canPost = Boolean(body.trim())
  const expanded = focused || canPost || showTags || tags.length > 0

  return (
    <form
      className={
        expanded
          ? `${styles.updatesNoteComposer} ${styles.updatesNoteComposerOpen}`
          : styles.updatesNoteComposer
      }
      onSubmit={(event) => {
        event.preventDefault()
        void post()
      }}
    >
      <textarea
        ref={bodyRef}
        className={styles.updatesNoteInput}
        value={body}
        onChange={(event) => setBody(event.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          window.setTimeout(() => {
            if (!body.trim() && !showTags && tags.length === 0) {
              setFocused(false)
            }
          }, 120)
        }}
        onKeyDown={(event) => {
          if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
            event.preventDefault()
            void post()
          }
        }}
        placeholder="What's on your mind?"
        rows={2}
        aria-label='Write an update'
      />
      {showTags || tags.length > 0 ? (
        <div className={styles.updatesNoteTags}>
          {tags.length > 0 ? (
            <ul className={styles.updatesComposerTagList} aria-label='Tags'>
              {tags.map((tag) => (
                <li key={tag}>
                  <button
                    type='button'
                    className={styles.updatesComposerTag}
                    onClick={() => removeTag(tag)}
                    aria-label={`Remove tag ${tag}`}
                  >
                    {tag}
                    <span aria-hidden>×</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          <input
            type='text'
            className={styles.updatesNoteTagInput}
            value={tagDraft}
            onChange={(event) => setTagDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                addTagFromDraft()
              }
            }}
            onBlur={addTagFromDraft}
            placeholder='Add a tag'
            aria-label='Add tag'
          />
        </div>
      ) : null}
      {expanded ? (
        <div className={styles.updatesNoteFooter}>
          <button
            type='button'
            className={styles.updatesNoteSecondary}
            onClick={() => setShowTags((value) => !value)}
          >
            {showTags || tags.length > 0 ? 'Hide tags' : 'Add tags'}
          </button>
          <button
            type='submit'
            className={styles.updatesNotePost}
            disabled={!canPost || busy}
          >
            {busy ? 'Posting…' : 'Post'}
          </button>
        </div>
      ) : null}
    </form>
  )
}

export function ProfileUpdatesTab({
  userId,
  canAdd = false
}: {
  userId: string | null | undefined
  canAdd?: boolean
}) {
  const auth = useAuthOptional()
  const signedIn = Boolean(auth?.user)
  const [updates, setUpdates] = React.useState<ProfileUpdate[]>([])
  const [loading, setLoading] = React.useState(true)
  const [likeBusyId, setLikeBusyId] = React.useState<string | null>(null)

  React.useEffect(() => {
    let alive = true
    if (!userId) {
      setUpdates([])
      setLoading(false)
      return
    }
    setLoading(true)
    void listProfileUpdatesByUserId(userId).then((rows) => {
      if (!alive) return
      setUpdates(rows)
      setLoading(false)
    })
    return () => {
      alive = false
    }
  }, [userId])

  async function handleToggleLike(update: ProfileUpdate) {
    if (likeBusyId) return
    const nextLiked = !update.likedByMe
    setLikeBusyId(update.id)
    setUpdates((prev) =>
      prev.map((item) =>
        item.id === update.id
          ? {
              ...item,
              likedByMe: nextLiked,
              likeCount: Math.max(0, item.likeCount + (nextLiked ? 1 : -1))
            }
          : item
      )
    )
    const result = await setProfileUpdateLiked(update.id, nextLiked)
    if (result) {
      setUpdates((prev) =>
        prev.map((item) =>
          item.id === update.id
            ? {
                ...item,
                likedByMe: result.likedByMe,
                likeCount: result.likeCount
              }
            : item
        )
      )
    } else {
      setUpdates((prev) =>
        prev.map((item) => (item.id === update.id ? update : item))
      )
    }
    setLikeBusyId(null)
  }

  return (
    <div className={styles.tabPanel}>
      <div className={styles.tabPanelTop}>
        <h2 className={styles.mainSerifTitle}>Updates</h2>
      </div>
      {canAdd ? (
        <UpdateNoteComposer
          onSubmit={async (draft) => {
            const created = await createProfileUpdate(draft)
            if (!created) return false
            setUpdates((prev) => [created, ...prev])
            return true
          }}
        />
      ) : null}
      {loading ? (
        <p className={styles.placeholder}>Loading…</p>
      ) : updates.length === 0 ? (
        <p className={styles.placeholder}>No updates yet.</p>
      ) : (
        <ul className={styles.updatesFeed}>
          {updates.map((update) => (
            <li key={update.id} className={styles.updatesFeedItem}>
              <UpdateCard
                update={update}
                signedIn={signedIn}
                likeBusy={likeBusyId === update.id}
                onToggleLike={(item) => void handleToggleLike(item)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
