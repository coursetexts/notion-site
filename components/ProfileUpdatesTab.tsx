import * as React from 'react'

import {
  ActivityFeedThread,
  type ActivityFeedTurn
} from '@/components/ActivityFeedQuoteBody'
import { ActivityFeedUpdateReplies } from '@/components/ActivityFeedUpdateReplies'
import { ProfileUpdateOriginalEmbed } from '@/components/ProfileUpdateOriginalEmbed'
import { UserLink } from '@/components/UserLink'
import { useAuthOptional } from '@/contexts/AuthContext'
import {
  type ProfileUpdate,
  createProfileUpdate,
  listProfileUpdatesByUserId
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

function UpdateAuthorAvatar({
  displayName,
  avatarUrl
}: {
  displayName: string
  avatarUrl?: string | null
}) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt=''
        className={styles.feedThreadAvatar}
        width={24}
        height={24}
      />
    )
  }
  return (
    <span className={styles.feedThreadAvatarPlaceholder} aria-hidden>
      {(displayName || 'U').charAt(0).toUpperCase()}
    </span>
  )
}

function updateVerb(update: ProfileUpdate): string {
  if (update.repostOfId) return 'reposted'
  if (update.quoteOfId) return 'quoted an update'
  return 'posted an update'
}

function UpdateCard({
  update,
  authorUserId,
  authorDisplayName,
  authorAvatarUrl,
  showFollowingTag,
  showFollowsYouTag,
  onCreated
}: {
  update: ProfileUpdate
  authorUserId: string
  authorDisplayName: string
  authorAvatarUrl?: string | null
  showFollowingTag?: boolean
  showFollowsYouTag?: boolean
  onCreated?: () => void
}) {
  const body = update.description.trim()
  const title = update.title.trim()
  const hasUrl = Boolean(update.url?.trim())
  const dateLabel = formatUpdateDate(update.createdAt)
  const name = authorDisplayName.trim() || 'User'
  const isRepost = Boolean(update.repostOfId && update.original)
  const hasQuoteOrRepostOriginal = Boolean(update.original)

  // Reposts only show the original as a nested card (no duplicate plain text).
  // Quotes / normal posts: author's text as plain subject.
  let subject: React.ReactNode = null
  if (!isRepost) {
    const subjectText = body || title || (hasQuoteOrRepostOriginal ? null : 'Update')
    const subjectHref = hasUrl ? update.url : ''
    if (subjectText) {
      subject = subjectHref ? (
        <a
          href={subjectHref}
          target='_blank'
          rel='noopener noreferrer'
          className={styles.inlineLink}
        >
          {subjectText}
        </a>
      ) : (
        subjectText
      )
    }
  }

  const turns: ActivityFeedTurn[] = [
    {
      author: (
        <span className={styles.feedThreadActor}>
          <UpdateAuthorAvatar displayName={name} avatarUrl={authorAvatarUrl} />
          <UserLink
            userId={authorUserId}
            displayName={name}
            showFollowingTag={showFollowingTag}
            showFollowsYouTag={showFollowsYouTag}
          />
        </span>
      ),
      verb: updateVerb(update)
    }
  ]

  return (
    <article className={styles.updatesCard}>
      <div className={styles.updatesCardMain}>
        <ActivityFeedThread
          subject={subject}
          time={dateLabel || undefined}
          turns={turns}
        />
        {update.original ? (
          <ProfileUpdateOriginalEmbed original={update.original} />
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
        <ActivityFeedUpdateReplies
          updateId={update.id}
          updateAuthorId={authorUserId}
          initialLikeCount={update.likeCount}
          initialLikedByMe={update.likedByMe}
          initialCommentCount={update.commentCount}
          onCreated={onCreated}
        />
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
  authorDisplayName,
  authorAvatarUrl,
  showFollowingTag = false,
  showFollowsYouTag = false,
  canAdd = false,
  embedded = false,
  hideEmptyMessage = false,
  reloadSignal = 0
}: {
  userId: string | null | undefined
  authorDisplayName?: string | null
  authorAvatarUrl?: string | null
  showFollowingTag?: boolean
  showFollowsYouTag?: boolean
  canAdd?: boolean
  /** Render inside another tab (no panel chrome / title). */
  embedded?: boolean
  /** Skip the empty-state copy when another list shares the panel. */
  hideEmptyMessage?: boolean
  /** Bump to force a reload (e.g. after reposting from Following). */
  reloadSignal?: number
}) {
  const auth = useAuthOptional()
  const [updates, setUpdates] = React.useState<ProfileUpdate[]>([])
  const [loading, setLoading] = React.useState(true)
  const [reloadToken, setReloadToken] = React.useState(0)
  const resolvedAuthorName =
    (authorDisplayName ?? '').trim() ||
    (auth?.user?.id === userId
      ? (
          (auth.user.user_metadata?.full_name as string | undefined) ||
          (auth.user.user_metadata?.name as string | undefined) ||
          auth.user.email?.split('@')[0] ||
          ''
        ).trim()
      : '') ||
    'User'
  const resolvedAuthorAvatar =
    authorAvatarUrl ||
    (auth?.user?.id === userId
      ? (auth.user.user_metadata?.avatar_url as string | undefined)
      : undefined)

  const refresh = React.useCallback(() => {
    setReloadToken((n) => n + 1)
  }, [])

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
  }, [userId, reloadToken, reloadSignal])

  const body = (
    <>
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
        hideEmptyMessage ? null : (
          <p className={styles.placeholder}>No updates yet.</p>
        )
      ) : !userId ? null : (
        <ul className={styles.updatesFeed}>
          {updates.map((update) => (
            <li key={update.id} className={styles.updatesFeedItem}>
              <UpdateCard
                update={update}
                authorUserId={userId}
                authorDisplayName={resolvedAuthorName}
                authorAvatarUrl={resolvedAuthorAvatar}
                showFollowingTag={showFollowingTag}
                showFollowsYouTag={showFollowsYouTag}
                onCreated={refresh}
              />
            </li>
          ))}
        </ul>
      )}
    </>
  )

  if (embedded) {
    return <div className={styles.activityUpdatesEmbed}>{body}</div>
  }

  return (
    <div className={styles.tabPanel}>
      <div className={styles.tabPanelTop}>
        <h2 className={styles.mainSerifTitle}>Updates</h2>
      </div>
      {body}
    </div>
  )
}
