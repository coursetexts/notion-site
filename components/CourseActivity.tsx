import React, { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  addComment,
  getComments,
  getAnnotations,
  getOrCreateCourse,
  type Comment as DbComment,
  type Annotation as DbAnnotation
} from '@/lib/course-activity-db'
import { useAuthOptional } from '../contexts/AuthContext'
import styles from './CourseActivity.module.css'

type TabId = 'all' | 'comments' | 'annotations'
type ThreadComment = DbComment & { replies: ThreadComment[] }

function formatRelativeTime(iso: string): string {
  const d = new Date(iso)
  const now = Date.now()
  const diff = now - d.getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return 'now'
  if (mins < 60) return `${mins}m`
  if (hours < 24) return `${hours}h`
  if (days < 7) return `${days}d`
  return d.toLocaleDateString()
}

function buildCommentTree(comments: DbComment[]): ThreadComment[] {
  const sorted = [...comments].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )
  const byId: Record<string, ThreadComment> = {}
  sorted.forEach((c) => {
    byId[c.id] = { ...c, replies: [] }
  })

  const roots: ThreadComment[] = []
  sorted.forEach((c) => {
    const node = byId[c.id]
    const parentId = c.parent_comment_id
    if (parentId && byId[parentId] && parentId !== c.id) {
      byId[parentId].replies.push(node)
    } else {
      roots.push(node)
    }
  })

  return roots
}

export interface CourseActivityProps {
  coursePageId?: string
  courseTitle?: string
  courseUrl?: string
}

export const CourseActivity: React.FC<CourseActivityProps> = ({
  coursePageId,
  courseTitle,
  courseUrl
}) => {
  const auth = useAuthOptional()
  const [activeTab, setActiveTab] = useState<TabId>('comments')
  const [commentInput, setCommentInput] = useState('')
  const [courseId, setCourseId] = useState<string | null>(null)
  const [comments, setComments] = useState<DbComment[]>([])
  const [annotations, setAnnotations] = useState<DbAnnotation[]>([])
  const [replyDraftById, setReplyDraftById] = useState<Record<string, string>>({})
  const [replyOpenById, setReplyOpenById] = useState<Record<string, boolean>>({})
  const [threadExpandedById, setThreadExpandedById] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submittingReplyId, setSubmittingReplyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadCourseAndActivity = useCallback(async () => {
    if (!coursePageId || !courseTitle) return
    setLoading(true)
    setError(null)
    try {
      const result = await getOrCreateCourse(coursePageId, courseTitle, courseUrl)
      if (!result) {
        setComments([])
        setAnnotations([])
        return
      }
      setCourseId(result.courseId)
      const [commentsRes, annotationsRes] = await Promise.all([
        getComments(result.courseId),
        getAnnotations(result.courseId, null)
      ])
      setComments(commentsRes)
      setAnnotations(annotationsRes)
    } catch (_) {
      setComments([])
      setAnnotations([])
    } finally {
      setLoading(false)
    }
  }, [coursePageId, courseTitle, courseUrl])

  useEffect(() => {
    loadCourseAndActivity()
  }, [loadCourseAndActivity])

  const handleSubmitComment = async (parentCommentId?: string) => {
    const body =
      parentCommentId != null
        ? (replyDraftById[parentCommentId] || '').trim()
        : commentInput.trim()
    if (!body || !courseId || !auth?.user) return
    if (parentCommentId) setSubmittingReplyId(parentCommentId)
    else setSubmitting(true)
    setError(null)
    const added = await addComment(courseId, body, parentCommentId ?? null)
    if (added) {
      if (parentCommentId) {
        setReplyDraftById((prev) => ({ ...prev, [parentCommentId]: '' }))
        setReplyOpenById((prev) => ({ ...prev, [parentCommentId]: false }))
      } else {
        setCommentInput('')
      }
      setComments((prev) => [...prev, added])
    } else {
      setError('Could not post comment. Try again.')
    }
    if (parentCommentId) setSubmittingReplyId(null)
    else setSubmitting(false)
  }

  const commentCount = comments.length
  const annotationCount = annotations.length
  const totalCount = commentCount + annotationCount

  const tabs: { id: TabId; label: string; count: number }[] = [
    { id: 'all', label: 'All Activity', count: totalCount },
    { id: 'comments', label: 'Comments', count: commentCount },
    { id: 'annotations', label: 'Annotations', count: annotationCount }
  ]

  const allActivity = React.useMemo(() => {
    const items: { type: 'comment' | 'annotation'; item: DbComment | DbAnnotation; at: string }[] = []
    comments.forEach((c) => items.push({ type: 'comment', item: c, at: c.created_at }))
    annotations.forEach((a) => items.push({ type: 'annotation', item: a, at: a.created_at }))
    items.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    return items
  }, [comments, annotations])

  const threadedComments = useMemo(() => buildCommentTree(comments), [comments])

  const participants = React.useMemo(() => {
    const byId: Record<string, { name: string; count: number }> = {}
    const add = (name: string) => {
      const n = name || 'Anonymous'
      if (!byId[n]) byId[n] = { name: n, count: 0 }
      byId[n].count += 1
    }
    comments.forEach((c) => add(c.author?.display_name ?? undefined))
    annotations.forEach((a) => add(a.author?.display_name ?? undefined))
    return Object.values(byId).sort((a, b) => b.count - a.count).slice(0, 10)
  }, [comments, annotations])

  if (!coursePageId || !courseTitle) {
    return (
      <section className={styles.root} aria-label="Course activity">
        <h2 className={styles.mainTitle}>Course activity</h2>
        <p className={styles.placeholderText}>Activity is available on course pages.</p>
      </section>
    )
  }

  return (
    <section className={styles.root} aria-label="Course activity">
      <h2 className={styles.mainTitle}>Completed the course?</h2>

      <div className={styles.layout}>
        <div className={styles.main}>
          <nav className={styles.tabs} role="tablist" aria-label="Activity tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                className={activeTab === tab.id ? styles.tabActive : styles.tab}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
                {tab.count > 0 && ` (${tab.count})`}
              </button>
            ))}
          </nav>

          {loading && (
            <div className={styles.placeholderPanel}>
              <p className={styles.placeholderText}>Loading activity…</p>
            </div>
          )}

          {!loading && activeTab === 'comments' && (
            <div className={styles.commentsPanel}>
              <h3 className={styles.commentsHeading}>Comments ({commentCount})</h3>
              {auth?.user && (
                <div className={styles.addWrap}>
                  <input
                    type="text"
                    className={styles.addInput}
                    placeholder="Add your thoughts…"
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === 'Enter' && handleSubmitComment(undefined)
                    }
                    aria-label="Add comment"
                    disabled={submitting}
                  />
                  <button
                    type="button"
                    className={styles.submitBtn}
                    onClick={() => handleSubmitComment(undefined)}
                    disabled={submitting || !commentInput.trim()}
                  >
                    {submitting ? 'Posting…' : 'Post'}
                  </button>
                </div>
              )}
              {!auth?.user && (
                <p className={styles.signInHint}>
                  <Link href={`/signin?redirect=${encodeURIComponent(courseUrl)}`}>Sign in</Link> to add a comment.
                </p>
              )}
              {error && <p className={styles.error}>{error}</p>}
              <div className={styles.commentList}>
                {threadedComments.length === 0 && (
                  <p className={styles.placeholderText}>No comments yet. Be the first!</p>
                )}
                {threadedComments.map((c) => (
                  <ThreadCommentItem
                    key={c.id}
                    node={c}
                    depth={0}
                    authUser={Boolean(auth?.user)}
                    courseUrl={courseUrl}
                    replyDraftById={replyDraftById}
                    replyOpenById={replyOpenById}
                    submittingReplyId={submittingReplyId}
                    threadExpandedById={threadExpandedById}
                    onToggleReply={(id) =>
                      setReplyOpenById((prev) => ({ ...prev, [id]: !prev[id] }))
                    }
                    onToggleThread={(id) =>
                      setThreadExpandedById((prev) => ({ ...prev, [id]: !prev[id] }))
                    }
                    onReplyChange={(id, value) =>
                      setReplyDraftById((prev) => ({ ...prev, [id]: value }))
                    }
                    onSubmitReply={(id) => handleSubmitComment(id)}
                  />
                ))}
              </div>
            </div>
          )}

          {!loading && activeTab === 'annotations' && (
            <div className={styles.annotationsPanel}>
              <h3 className={styles.commentsHeading}>Annotations ({annotationCount})</h3>
              {annotations.length === 0 && (
                <p className={styles.placeholderText}>
                  No annotations yet. Add annotations from the sidebar on a specific section.
                </p>
              )}
              {annotations.map((a) => (
                <div key={a.id} className={styles.annotationItem}>
                  <div className={styles.commentHeader}>
                    <span className={styles.author}>
                      {a.author?.display_name ?? 'Anonymous'}
                    </span>
                    <span className={styles.time}>{formatRelativeTime(a.created_at)}</span>
                  </div>
                  <span className={styles.sectionTag}>{a.section_id}</span>
                  <p className={styles.body}>{a.body}</p>
                </div>
              ))}
            </div>
          )}

          {!loading && activeTab === 'all' && (
            <div className={styles.allPanel}>
              <h3 className={styles.commentsHeading}>All Activity ({totalCount})</h3>
              {allActivity.length === 0 && (
                <p className={styles.placeholderText}>No activity yet.</p>
              )}
              {allActivity.map(({ type, item }) =>
                type === 'comment' ? (
                  <div key={`c-${item.id}`} className={styles.comment}>
                    <div className={styles.commentHeader}>
                      <span className={styles.author}>
                        {(item as DbComment).author?.display_name ?? 'Anonymous'}
                      </span>
                      <span className={styles.time}>
                        {formatRelativeTime((item as DbComment).created_at)}
                      </span>
                      <span className={styles.typeTag}>Comment</span>
                    </div>
                    <p className={styles.body}>{(item as DbComment).body}</p>
                  </div>
                ) : (
                  <div key={`a-${item.id}`} className={styles.annotationItem}>
                    <div className={styles.commentHeader}>
                      <span className={styles.author}>
                        {(item as DbAnnotation).author?.display_name ?? 'Anonymous'}
                      </span>
                      <span className={styles.time}>
                        {formatRelativeTime((item as DbAnnotation).created_at)}
                      </span>
                      <span className={styles.typeTag}>Annotation</span>
                    </div>
                    <span className={styles.sectionTag}>{(item as DbAnnotation).section_id}</span>
                    <p className={styles.body}>{(item as DbAnnotation).body}</p>
                  </div>
                )
              )}
            </div>
          )}
        </div>

        {participants.length > 0 && (
          <aside className={styles.participants} aria-label="Participants">
            {participants.map((p, i) => (
              <div key={i} className={styles.participant}>
                <span className={styles.participantCount}>{p.count}</span>
                <span className={styles.participantName}>{p.name}</span>
              </div>
            ))}
          </aside>
        )}
      </div>
    </section>
  )
}

interface ThreadCommentItemProps {
  node: ThreadComment
  depth: number
  authUser: boolean
  courseUrl?: string
  replyDraftById: Record<string, string>
  replyOpenById: Record<string, boolean>
  submittingReplyId: string | null
  threadExpandedById: Record<string, boolean>
  onToggleReply: (id: string) => void
  onToggleThread: (id: string) => void
  onReplyChange: (id: string, value: string) => void
  onSubmitReply: (id: string) => void
}

const ThreadCommentItem: React.FC<ThreadCommentItemProps> = ({
  node,
  depth,
  authUser,
  courseUrl,
  replyDraftById,
  replyOpenById,
  submittingReplyId,
  threadExpandedById,
  onToggleReply,
  onToggleThread,
  onReplyChange,
  onSubmitReply
}) => {
  const COLLAPSE_AFTER = 2
  const marginLeft = Math.min(depth * 16, 96)
  const isReplyOpen = Boolean(replyOpenById[node.id])
  const draft = replyDraftById[node.id] || ''
  const isSubmitting = submittingReplyId === node.id
  const hasLongThread = node.replies.length > COLLAPSE_AFTER
  const isThreadExpanded = Boolean(threadExpandedById[node.id])
  const visibleReplies =
    hasLongThread && !isThreadExpanded
      ? node.replies.slice(0, COLLAPSE_AFTER)
      : node.replies

  return (
    <div className={styles.threadItem} style={{ marginLeft }}>
      <div className={styles.comment}>
        <div className={styles.commentHeader}>
          <span className={styles.author}>
            {node.author?.display_name ?? 'Anonymous'}
          </span>
          <span className={styles.time}>{formatRelativeTime(node.created_at)}</span>
        </div>
        <p className={styles.body}>{node.body}</p>
        <button
          type="button"
          className={styles.replyBtn}
          onClick={() => onToggleReply(node.id)}
        >
          Reply
        </button>

        {isReplyOpen && authUser && (
          <div className={styles.replyComposer}>
            <input
              type="text"
              className={styles.addInput}
              placeholder="Write a reply…"
              value={draft}
              onChange={(e) => onReplyChange(node.id, e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSubmitReply(node.id)}
              disabled={isSubmitting}
            />
            <button
              type="button"
              className={styles.submitBtn}
              onClick={() => onSubmitReply(node.id)}
              disabled={isSubmitting || !draft.trim()}
            >
              {isSubmitting ? 'Posting…' : 'Reply'}
            </button>
          </div>
        )}

        {isReplyOpen && !authUser && (
          <p className={styles.signInHint}>
            <Link href={`/signin?redirect=${encodeURIComponent(courseUrl || '/profile')}`}>
              Sign in
            </Link>{' '}
            to reply.
          </p>
        )}
      </div>

      {node.replies.length > 0 && (
        <div className={styles.threadChildren}>
          {visibleReplies.map((child) => (
            <ThreadCommentItem
              key={child.id}
              node={child}
              depth={depth + 1}
              authUser={authUser}
              courseUrl={courseUrl}
              replyDraftById={replyDraftById}
              replyOpenById={replyOpenById}
              submittingReplyId={submittingReplyId}
              threadExpandedById={threadExpandedById}
              onToggleReply={onToggleReply}
              onToggleThread={onToggleThread}
              onReplyChange={onReplyChange}
              onSubmitReply={onSubmitReply}
            />
          ))}
          {hasLongThread && (
            <button
              type="button"
              className={styles.threadToggleBtn}
              onClick={() => onToggleThread(node.id)}
            >
              {isThreadExpanded
                ? 'Show fewer replies'
                : `Show ${node.replies.length - COLLAPSE_AFTER} more repl${
                    node.replies.length - COLLAPSE_AFTER === 1 ? 'y' : 'ies'
                  }`}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
