import React, { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  getOrCreateCourse,
  getAnnotations,
  addAnnotation,
  type Annotation as DbAnnotation
} from '@/lib/course-activity-db'
import { authDebug } from '@/lib/auth-debug'
import { useAuthOptional } from '../contexts/AuthContext'
import styles from './AnnotationWidget.module.css'

export interface AnnotationWidgetProps {
  count?: number
  onHide?: () => void
  courseUrl?: string
  courseTitle?: string
  coursePageId?: string
  /** Current section/tab label for this annotation context */
  sectionId?: string
}

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

type ThreadAnnotation = DbAnnotation & { replies: ThreadAnnotation[] }

function buildAnnotationTree(annotations: DbAnnotation[]): ThreadAnnotation[] {
  const sorted = [...annotations].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )
  const byId: Record<string, ThreadAnnotation> = {}
  sorted.forEach((a) => {
    byId[a.id] = { ...a, replies: [] }
  })

  const roots: ThreadAnnotation[] = []
  sorted.forEach((a) => {
    const node = byId[a.id]
    const parentId = a.parent_annotation_id
    if (parentId && byId[parentId] && parentId !== a.id) {
      byId[parentId].replies.push(node)
    } else {
      roots.push(node)
    }
  })

  return roots
}

export const AnnotationWidget: React.FC<AnnotationWidgetProps> = ({
  count = 0,
  onHide,
  courseUrl,
  courseTitle,
  coursePageId,
  sectionId
}) => {
  const auth = useAuthOptional()
  const [inputValue, setInputValue] = useState('')
  const [courseId, setCourseId] = useState<string | null>(null)
  const [annotations, setAnnotations] = useState<DbAnnotation[]>([])
  const [replyDraftById, setReplyDraftById] = useState<Record<string, string>>({})
  const [replyOpenById, setReplyOpenById] = useState<Record<string, boolean>>({})
  const [threadExpandedById, setThreadExpandedById] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submittingReplyId, setSubmittingReplyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadAnnotations = useCallback(async () => {
    if (!coursePageId || !courseTitle || sectionId == null || sectionId === '') return
    const result = await getOrCreateCourse(coursePageId, courseTitle, courseUrl)
    if (!result) return
    setCourseId(result.courseId)
    const list = await getAnnotations(result.courseId, sectionId)
    setAnnotations(list)
  }, [coursePageId, courseTitle, courseUrl, sectionId])

  useEffect(() => {
    authDebug('annotation:auth', {
      authUser: auth?.user?.id ?? null,
      coursePageId: coursePageId ?? null,
      sectionId: sectionId ?? null
    })
    setLoading(true)
    loadAnnotations().then(() => setLoading(false))
  }, [loadAnnotations])

  const handleSubmit = async (parentAnnotationId?: string) => {
    const body =
      parentAnnotationId != null
        ? (replyDraftById[parentAnnotationId] || '').trim()
        : inputValue.trim()
    if (!body || !courseId || sectionId == null || sectionId === '' || !auth?.user) return
    if (parentAnnotationId) setSubmittingReplyId(parentAnnotationId)
    else setSubmitting(true)
    setError(null)
    const added = await addAnnotation(
      courseId,
      sectionId,
      body,
      parentAnnotationId ?? null
    )
    if (added) {
      if (parentAnnotationId) {
        setReplyDraftById((prev) => ({ ...prev, [parentAnnotationId]: '' }))
        setReplyOpenById((prev) => ({ ...prev, [parentAnnotationId]: false }))
      } else {
        setInputValue('')
      }
      setAnnotations((prev) => [...prev, added])
    } else {
      setError('Could not add annotation. Try again.')
    }
    if (parentAnnotationId) setSubmittingReplyId(null)
    else setSubmitting(false)
  }

  const displayCount = annotations.length
  const threadedAnnotations = useMemo(
    () => buildAnnotationTree(annotations),
    [annotations]
  )

  return (
    <aside className={styles.root} aria-label="Annotations">
      <div className={styles.header}>
        <h2 className={styles.title}>
          Annotations
          {sectionId ? ` · ${sectionId}` : ''} ({displayCount})
        </h2>
        <button
          type="button"
          className={styles.hideBtn}
          onClick={onHide}
          aria-label="Hide annotations"
        >
          Hide
        </button>
      </div>
      {auth?.user ? (
        <div className={styles.addWrap}>
          <input
            type="text"
            className={styles.addInput}
            placeholder="Add your thoughts…"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit(undefined)}
            aria-label="Add annotation"
            disabled={submitting || !sectionId}
          />
          <button
            type="button"
            className={styles.submitBtn}
            onClick={() => handleSubmit(undefined)}
            disabled={submitting || !inputValue.trim() || !sectionId}
          >
            {submitting ? '…' : 'Add'}
          </button>
        </div>
      ) : (
        <p className={styles.signInHint}>
          <Link href={typeof window !== 'undefined' ? `/signin?redirect=${encodeURIComponent(window.location.pathname)}` : '/signin'}>
            Sign in
          </Link>
          {' '}to add annotations.
        </p>
      )}
      {error && <p className={styles.error}>{error}</p>}
      <div className={styles.list}>
        {loading && <p className={styles.placeholder}>Loading…</p>}
        {!loading && threadedAnnotations.length === 0 && (
          <p className={styles.placeholder}>No annotations on this section yet.</p>
        )}
        {!loading &&
          threadedAnnotations.map((a) => (
            <ThreadAnnotationItem
              key={a.id}
              node={a}
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
              onSubmitReply={(id) => handleSubmit(id)}
            />
          ))}
      </div>
    </aside>
  )
}

interface ThreadAnnotationItemProps {
  node: ThreadAnnotation
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

const ThreadAnnotationItem: React.FC<ThreadAnnotationItemProps> = ({
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
  const marginLeft = Math.min(depth * 14, 84)
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
      <div className={styles.annotation}>
        <div className={styles.annotationHeader}>
          <span className={styles.author}>{node.author?.display_name ?? 'Anonymous'}</span>
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
              {isSubmitting ? '…' : 'Reply'}
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
            <ThreadAnnotationItem
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
