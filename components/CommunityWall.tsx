import React from 'react'

import { useAuthOptional } from '@/contexts/AuthContext'
import { createPortal } from 'react-dom'

import {
  type CommunityResource,
  type CommunityResourceComment,
  addCommunityResource,
  addCommunityResourceComment,
  getCommunityResourceComments,
  getCommunityResources,
  setCommunityResourceVote,
  toggleCommunityResourceBookmark
} from '@/lib/community-wall-db'
import type { DummyCommunityResource } from '@/lib/community-wall-dummy'
import { getDummyCommunityResources } from '@/lib/community-wall-dummy'
import { getOrCreateCourse } from '@/lib/course-activity-db'

import styles from './CommunityWall.module.css'

function hostFromUrl(url?: string | null): string {
  if (!url) return ''
  try {
    return new URL(url).host.replace(/^www\./, '')
  } catch {
    return url
  }
}

function PinIcon() {
  return (
    <svg width='12' height='12' viewBox='0 0 24 24' fill='none' aria-hidden>
      <path
        d='M14 3l7 7-4 4v6l-2-2-2 2v-6L3 7l11-4z'
        stroke='currentColor'
        strokeWidth='1.6'
        strokeLinejoin='round'
      />
    </svg>
  )
}

function LinkIcon() {
  return (
    <svg width='14' height='14' viewBox='0 0 24 24' fill='none' aria-hidden>
      <path
        d='M10 13a5 5 0 0 1 0-7l1.5-1.5a5 5 0 0 1 7 7L17 13'
        stroke='currentColor'
        strokeWidth='1.8'
        strokeLinecap='round'
      />
      <path
        d='M14 11a5 5 0 0 1 0 7L12.5 19.5a5 5 0 1 1-7-7L7 11'
        stroke='currentColor'
        strokeWidth='1.8'
        strokeLinecap='round'
      />
    </svg>
  )
}

function ExternalIcon() {
  return (
    <svg width='14' height='14' viewBox='0 0 24 24' fill='none' aria-hidden>
      <path
        d='M14 3h7v7'
        stroke='currentColor'
        strokeWidth='1.8'
        strokeLinecap='round'
      />
      <path
        d='M10 14L21 3'
        stroke='currentColor'
        strokeWidth='1.8'
        strokeLinecap='round'
      />
      <path
        d='M21 14v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h6'
        stroke='currentColor'
        strokeWidth='1.8'
        strokeLinecap='round'
      />
    </svg>
  )
}

function BookmarkIcon({ filled }: { filled: boolean }) {
  return (
    <svg width='14' height='14' viewBox='0 0 24 24' fill='none' aria-hidden>
      <path
        d='M6 3h12a1 1 0 0 1 1 1v18l-7-4-7 4V4a1 1 0 0 1 1-1z'
        fill={filled ? 'currentColor' : 'none'}
        stroke='currentColor'
        strokeWidth='1.6'
        strokeLinejoin='round'
      />
    </svg>
  )
}

type ResourceVM = {
  kind: 'db' | 'dummy'
  id: string
  title: string
  description: string
  link?: string | null
  is_pinned: boolean
  score: number
  comment_count: number
  is_bookmarked: boolean
  user_vote: number | null
  authorName?: string | null
  sourceLabel?: string
}

function toVMFromDb(r: CommunityResource): ResourceVM {
  return {
    kind: 'db',
    id: r.id,
    title: r.title,
    description: r.description,
    link: r.link,
    is_pinned: r.is_pinned,
    score: r.score ?? 0,
    comment_count: r.comment_count ?? 0,
    is_bookmarked: r.is_bookmarked ?? false,
    user_vote: r.user_vote ?? null,
    authorName: r.author?.display_name ?? null
  }
}

function toVMFromDummy(r: DummyCommunityResource): ResourceVM {
  return {
    kind: 'dummy',
    id: r.id,
    title: r.title,
    description: r.description,
    link: r.link,
    is_pinned: Boolean(r.pinned),
    score: r.votes ?? 0,
    comment_count: r.comments ?? 0,
    is_bookmarked: false,
    user_vote: null,
    authorName: null,
    sourceLabel: r.sourceLabel
  }
}

export interface CommunityWallProps {
  coursePageId?: string
  courseTitle?: string
  courseUrl?: string
}

export const CommunityWall: React.FC<CommunityWallProps> = ({
  coursePageId,
  courseTitle,
  courseUrl
}) => {
  const auth = useAuthOptional()
  const isSignedIn = Boolean(auth?.user)

  const [courseId, setCourseId] = React.useState<string | null>(null)
  const [resources, setResources] = React.useState<ResourceVM[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const [addOpen, setAddOpen] = React.useState(false)
  const [addTitle, setAddTitle] = React.useState('')
  const [addDesc, setAddDesc] = React.useState('')
  const [addLink, setAddLink] = React.useState('')
  const [adding, setAdding] = React.useState(false)

  const [commentsOpenFor, setCommentsOpenFor] = React.useState<string | null>(
    null
  )
  const [comments, setComments] = React.useState<CommunityResourceComment[]>([])
  const [commentDraft, setCommentDraft] = React.useState('')
  const [commentLoading, setCommentLoading] = React.useState(false)
  const [commentSubmitting, setCommentSubmitting] = React.useState(false)

  const load = React.useCallback(async () => {
    if (!coursePageId || !courseTitle) {
      setResources(getDummyCommunityResources(coursePageId).map(toVMFromDummy))
      return
    }
    setLoading(true)
    setError(null)
    try {
      const course = await getOrCreateCourse(
        coursePageId,
        courseTitle,
        courseUrl
      )
      const id = course?.courseId ?? coursePageId
      setCourseId(id)
      const db = await getCommunityResources(id)
      const dummy = getDummyCommunityResources(coursePageId).map(toVMFromDummy)

      // If DB has any data, prefer it (plus pinned dummy only if DB empty).
      const merged = db.length > 0 ? db.map(toVMFromDb) : dummy

      const pinned = merged.filter((r) => r.is_pinned)
      const rest = merged.filter((r) => !r.is_pinned)
      setResources([...pinned, ...rest])
    } catch (e) {
      setResources(getDummyCommunityResources(coursePageId).map(toVMFromDummy))
    } finally {
      setLoading(false)
    }
  }, [coursePageId, courseTitle, courseUrl])

  React.useEffect(() => {
    void load()
  }, [load])

  const closeAdd = () => {
    setAddOpen(false)
    setAddTitle('')
    setAddDesc('')
    setAddLink('')
    setError(null)
  }

  const openAdd = () => {
    if (!isSignedIn) {
      setError('Sign in to add a resource.')
      return
    }
    setAddOpen(true)
    setError(null)
  }

  const submitAdd = async () => {
    if (!isSignedIn) {
      setError('Sign in to add a resource.')
      return
    }
    const title = addTitle.trim()
    const description = addDesc.trim()
    const link = addLink.trim()
    if (!title || !description) {
      setError('Title and description are required.')
      return
    }
    if (!courseId) {
      setError('Course not ready yet. Try again in a second.')
      return
    }
    setAdding(true)
    setError(null)
    const created = await addCommunityResource(courseId, {
      title,
      description,
      link: link ? link : null
    })
    if (!created) {
      setError('Could not add resource. Try again.')
      setAdding(false)
      return
    }
    setResources((prev) => [toVMFromDb(created), ...prev])
    setAdding(false)
    closeAdd()
  }

  const handleVote = async (r: ResourceVM, value: 1 | -1 | null) => {
    if (!isSignedIn) {
      setError('Sign in to vote.')
      return
    }
    if (r.kind !== 'db') return
    const newScore = await setCommunityResourceVote(r.id, value)
    if (newScore == null) return
    setResources((prev) =>
      prev.map((x) =>
        x.id === r.id ? { ...x, score: newScore, user_vote: value } : x
      )
    )
  }

  const handleBookmark = async (r: ResourceVM) => {
    if (!isSignedIn) {
      setError('Sign in to bookmark.')
      return
    }
    if (r.kind !== 'db') return
    const next = await toggleCommunityResourceBookmark(r.id)
    if (next == null) return
    setResources((prev) =>
      prev.map((x) => (x.id === r.id ? { ...x, is_bookmarked: next } : x))
    )
  }

  const openComments = async (r: ResourceVM) => {
    if (r.kind !== 'db') return
    setCommentsOpenFor(r.id)
    setCommentDraft('')
    setComments([])
    setCommentLoading(true)
    const list = await getCommunityResourceComments(r.id)
    setComments(list)
    setCommentLoading(false)
  }

  const submitComment = async () => {
    if (!isSignedIn || !commentsOpenFor) return
    const body = commentDraft.trim()
    if (!body) return
    setCommentSubmitting(true)
    const added = await addCommunityResourceComment(commentsOpenFor, body)
    if (added) {
      setComments((prev) => [...prev, added])
      setResources((prev) =>
        prev.map((x) =>
          x.id === commentsOpenFor
            ? { ...x, comment_count: (x.comment_count ?? 0) + 1 }
            : x
        )
      )
      setCommentDraft('')
    }
    setCommentSubmitting(false)
  }

  const closeComments = () => {
    setCommentsOpenFor(null)
    setComments([])
    setCommentDraft('')
    setCommentLoading(false)
    setCommentSubmitting(false)
  }

  const commentsModal =
    typeof document !== 'undefined' && commentsOpenFor
      ? createPortal(
          <div
            className={styles.modalBackdrop}
            role='dialog'
            aria-modal='true'
            aria-label='Resource comments'
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) closeComments()
            }}
          >
            <div className={styles.modal}>
              <h3 className={styles.modalTitle}>Comments</h3>
              {commentLoading && (
                <p style={{ margin: 0, color: '#9ca3af' }}>Loading…</p>
              )}
              {!commentLoading && comments.length === 0 && (
                <p style={{ margin: 0, color: '#9ca3af' }}>No comments yet.</p>
              )}
              {!commentLoading &&
                comments.map((c) => (
                  <div key={c.id} style={{ padding: '0.6rem 0' }}>
                    <div style={{ fontSize: '0.85rem', color: '#5d534b' }}>
                      {c.author?.display_name ?? 'Anonymous'}
                    </div>
                    <div style={{ fontSize: '0.95rem' }}>{c.body}</div>
                  </div>
                ))}
              {isSignedIn ? (
                <>
                  <div
                    className={styles.field}
                    style={{ marginTop: '0.75rem' }}
                  >
                    <span className={styles.label}>Add comment</span>
                    <textarea
                      className={styles.textarea}
                      value={commentDraft}
                      onChange={(e) => setCommentDraft(e.target.value)}
                      placeholder='Write a comment…'
                      disabled={commentSubmitting}
                    />
                  </div>
                  <div className={styles.modalActions}>
                    <button
                      type='button'
                      className={styles.btn}
                      onClick={closeComments}
                    >
                      Close
                    </button>
                    <button
                      type='button'
                      className={styles.btnPrimary}
                      onClick={submitComment}
                      disabled={commentSubmitting || !commentDraft.trim()}
                    >
                      Post
                    </button>
                  </div>
                </>
              ) : (
                <div className={styles.modalActions}>
                  <button
                    type='button'
                    className={styles.btn}
                    onClick={closeComments}
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>,
          document.body
        )
      : null

  const addModal =
    typeof document !== 'undefined' && addOpen
      ? createPortal(
          <div
            className={styles.modalBackdrop}
            role='dialog'
            aria-modal='true'
            aria-label='Add resource'
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) closeAdd()
            }}
          >
            <div className={styles.modal}>
              <h3 className={styles.modalTitle}>Add Resource</h3>
              <div className={styles.field}>
                <span className={styles.label}>Title</span>
                <input
                  className={styles.input}
                  value={addTitle}
                  onChange={(e) => setAddTitle(e.target.value)}
                  placeholder='e.g. Free fonts website'
                  disabled={adding}
                />
              </div>
              <div className={styles.field}>
                <span className={styles.label}>Description</span>
                <textarea
                  className={styles.textarea}
                  value={addDesc}
                  onChange={(e) => setAddDesc(e.target.value)}
                  placeholder='Why is this useful?'
                  disabled={adding}
                />
              </div>
              <div className={styles.field}>
                <span className={styles.label}>Link (optional)</span>
                <input
                  className={styles.input}
                  value={addLink}
                  onChange={(e) => setAddLink(e.target.value)}
                  placeholder='https://…'
                  disabled={adding}
                />
              </div>
              {error && <p className={styles.error}>{error}</p>}
              <div className={styles.modalActions}>
                <button type='button' className={styles.btn} onClick={closeAdd}>
                  Cancel
                </button>
                <button
                  type='button'
                  className={styles.btnPrimary}
                  onClick={submitAdd}
                  disabled={adding}
                >
                  {adding ? 'Adding…' : 'Add'}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )
      : null

  const pinned = resources.filter((r) => r.is_pinned)
  const rest = resources.filter((r) => !r.is_pinned)
  const ordered = [...pinned, ...rest]

  return (
    <section className={styles.root} aria-label='Community wall'>
      <div className={styles.headerRow}>
        <h2 className={styles.title}>Community Wall</h2>
        <div className={styles.headerActions}>
          <button type='button' className={styles.btn} disabled>
            Subscribe
          </button>
          <button type='button' className={styles.btnPrimary} onClick={openAdd}>
            + Add Resource
          </button>
        </div>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      {loading && <div className={styles.empty}>Loading resources…</div>}

      {!loading && ordered.length === 0 && (
        <div className={styles.empty}>
          No resources yet. Be the first to add one.
        </div>
      )}

      {!loading && ordered.length > 0 && (
        <div className={styles.grid}>
          {ordered.map((r) => {
            const domain = hostFromUrl(r.link)
            const source = r.sourceLabel ?? (domain ? domain : 'Resource')
            return (
              <article key={r.id} className={styles.card}>
                {r.is_pinned && (
                  <div className={styles.pinRow}>
                    <span className={styles.pinTag}>
                      <PinIcon /> Pin
                    </span>
                  </div>
                )}

                <h3 className={styles.cardTitle}>{r.title}</h3>
                <p className={styles.cardDesc}>{r.description}</p>

                <div className={styles.preview}>
                  <div className={styles.previewBody}>
                    <LinkIcon />
                  </div>
                  <div className={styles.previewFooter}>
                    <div className={styles.previewMeta}>
                      <div className={styles.previewSource}>{source}</div>
                      <div className={styles.previewLink}>
                        {domain || (r.link ? r.link : 'No link')}
                      </div>
                    </div>
                    <div className={styles.miniActions}>
                      {r.link && (
                        <button
                          type='button'
                          className={styles.miniBtn}
                          aria-label='Open link'
                          title='Open link'
                          onClick={() =>
                            window.open(
                              r.link || '',
                              '_blank',
                              'noopener,noreferrer'
                            )
                          }
                        >
                          <ExternalIcon />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className={styles.actionsRow}>
                  <div className={styles.leftActions}>
                    <span className={styles.actionPill}>
                      <button
                        type='button'
                        className={styles.miniBtn}
                        aria-label='Upvote'
                        title='Upvote'
                        onClick={() =>
                          handleVote(r, r.user_vote === 1 ? null : 1)
                        }
                        disabled={!isSignedIn || r.kind !== 'db'}
                      >
                        ▲
                      </button>
                      {r.score}
                      <button
                        type='button'
                        className={styles.miniBtn}
                        aria-label='Downvote'
                        title='Downvote'
                        onClick={() =>
                          handleVote(r, r.user_vote === -1 ? null : -1)
                        }
                        disabled={!isSignedIn || r.kind !== 'db'}
                      >
                        ▼
                      </button>
                    </span>
                    <button
                      type='button'
                      className={styles.miniBtn}
                      onClick={() => openComments(r)}
                      disabled={r.kind !== 'db'}
                      aria-label='View comments'
                      title='View comments'
                    >
                      💬 {r.comment_count}
                    </button>
                  </div>
                  <button
                    type='button'
                    className={styles.miniBtn}
                    onClick={() => handleBookmark(r)}
                    disabled={!isSignedIn || r.kind !== 'db'}
                    aria-label={
                      r.is_bookmarked ? 'Remove bookmark' : 'Bookmark'
                    }
                    title={r.is_bookmarked ? 'Bookmarked' : 'Bookmark'}
                  >
                    <BookmarkIcon filled={r.is_bookmarked} />
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      )}

      {addModal}
      {commentsModal}
    </section>
  )
}
