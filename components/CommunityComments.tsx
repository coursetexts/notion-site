import * as React from 'react'

import { VoteRow } from '@/components/CourseActivity'
import {
  type ThreadedComment,
  addResourceComment,
  getResourceCommentThread,
  setResourceCommentVote
} from '@/lib/community-comments-db'

import styles from './CommunityComments.module.css'

function formatWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  } catch {
    return ''
  }
}

interface CommentFormProps {
  placeholder: string
  submitLabel: string
  autoFocus?: boolean
  testId?: string
  onSubmit: (body: string) => Promise<boolean>
  onCancel?: () => void
}

const CommentForm: React.FC<CommentFormProps> = ({
  placeholder,
  submitLabel,
  autoFocus,
  testId,
  onSubmit,
  onCancel
}) => {
  const [body, setBody] = React.useState('')
  const [busy, setBusy] = React.useState(false)

  const submit = async () => {
    const text = body.trim()
    if (!text || busy) return
    setBusy(true)
    const ok = await onSubmit(text)
    setBusy(false)
    if (ok) {
      setBody('')
      onCancel?.()
    }
  }

  return (
    <div className={styles.form}>
      <textarea
        className={styles.formInput}
        placeholder={placeholder}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        autoFocus={autoFocus}
        data-testid={testId ? `${testId}-input` : undefined}
      />
      <div className={styles.formActions}>
        {onCancel && (
          <button type='button' className={styles.quietLink} onClick={onCancel}>
            Cancel
          </button>
        )}
        <button
          type='button'
          className={styles.submitBtn}
          onClick={submit}
          disabled={!body.trim() || busy}
          data-testid={testId ? `${testId}-submit` : undefined}
        >
          {busy ? 'Posting…' : submitLabel}
        </button>
      </div>
    </div>
  )
}

interface CommentNodeProps {
  comment: ThreadedComment
  signedIn: boolean
  onReply: (parent: ThreadedComment, body: string) => Promise<boolean>
  onVote: (comment: ThreadedComment, value: 1 | -1 | null) => void
}

const CommentNode: React.FC<CommentNodeProps> = ({
  comment,
  signedIn,
  onReply,
  onVote
}) => {
  const [collapsed, setCollapsed] = React.useState(false)
  const [replying, setReplying] = React.useState(false)
  const name = comment.author?.display_name ?? 'Anonymous'
  const karma = comment.author?.karma_score ?? 0

  return (
    <div className={styles.comment} data-testid='comment-item'>
      <div className={styles.commentMeta}>
        <button
          type='button'
          className={styles.collapseBtn}
          onClick={() => setCollapsed((c) => !c)}
          aria-expanded={!collapsed}
          aria-label={collapsed ? 'Expand comment' : 'Collapse comment'}
        >
          [{collapsed ? '+' : '−'}]
        </button>
        <span className={styles.commentAuthor} data-testid='comment-author'>
          {name}
        </span>
        <span
          className={styles.commentKarma}
          title='Karma'
          data-testid='comment-karma'
        >
          {karma}
        </span>
        <span className={styles.metaDot} aria-hidden>
          ·
        </span>
        <span className={styles.commentWhen}>
          {formatWhen(comment.created_at)}
        </span>
        <span className={styles.commentVote} data-testid='comment-vote'>
          <VoteRow
            score={comment.score}
            userVote={comment.user_vote}
            disabled={!signedIn}
            onVote={(value) => onVote(comment, value)}
          />
        </span>
      </div>

      {!collapsed && (
        <>
          <p className={styles.commentBody} data-testid='comment-body'>
            {comment.body}
          </p>
          <div className={styles.commentActions}>
            {signedIn && !replying && (
              <button
                type='button'
                className={styles.quietLink}
                onClick={() => setReplying(true)}
                data-testid='comment-reply-btn'
              >
                Reply
              </button>
            )}
          </div>
          {replying && (
            <CommentForm
              placeholder={`Reply to ${name}…`}
              submitLabel='Reply'
              autoFocus
              testId='reply'
              onSubmit={(body) => onReply(comment, body)}
              onCancel={() => setReplying(false)}
            />
          )}
          {comment.replies.length > 0 && (
            <div className={styles.replies}>
              {comment.replies.map((r) => (
                <CommentNode
                  key={r.id}
                  comment={r}
                  signedIn={signedIn}
                  onReply={onReply}
                  onVote={onVote}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

interface CommunityCommentsProps {
  resourceId: string
  signedIn: boolean
  onCountChange?: (count: number) => void
}

function countThread(nodes: ThreadedComment[]): number {
  return nodes.reduce((n, c) => n + 1 + countThread(c.replies), 0)
}

function updateNode(
  nodes: ThreadedComment[],
  id: string,
  patch: Partial<ThreadedComment>
): ThreadedComment[] {
  return nodes.map((n) =>
    n.id === id
      ? { ...n, ...patch }
      : { ...n, replies: updateNode(n.replies, id, patch) }
  )
}

function appendReply(
  nodes: ThreadedComment[],
  parentId: string,
  reply: ThreadedComment
): ThreadedComment[] {
  return nodes.map((n) =>
    n.id === parentId
      ? { ...n, replies: [...n.replies, reply] }
      : { ...n, replies: appendReply(n.replies, parentId, reply) }
  )
}

export const CommunityComments: React.FC<CommunityCommentsProps> = ({
  resourceId,
  signedIn,
  onCountChange
}) => {
  const [thread, setThread] = React.useState<ThreadedComment[]>([])
  const [loading, setLoading] = React.useState(true)

  const report = React.useCallback(
    (t: ThreadedComment[]) => onCountChange?.(countThread(t)),
    [onCountChange]
  )

  React.useEffect(() => {
    let alive = true
    getResourceCommentThread(resourceId).then((t) => {
      if (!alive) return
      setThread(t)
      setLoading(false)
      report(t)
    })
    return () => {
      alive = false
    }
  }, [resourceId, report])

  const handleTopLevel = async (body: string): Promise<boolean> => {
    const created = await addResourceComment(resourceId, body)
    if (!created) return false
    setThread((prev) => {
      const next = [...prev, created]
      report(next)
      return next
    })
    return true
  }

  const handleReply = async (
    parent: ThreadedComment,
    body: string
  ): Promise<boolean> => {
    const created = await addResourceComment(resourceId, body, parent.id)
    if (!created) return false
    setThread((prev) => {
      const next = appendReply(prev, parent.id, created)
      report(next)
      return next
    })
    return true
  }

  const handleVote = async (comment: ThreadedComment, value: 1 | -1 | null) => {
    // Optimistic update; reconcile with the server total when it returns.
    const prevVote = comment.user_vote ?? 0
    const optimistic = comment.score - prevVote + (value ?? 0)
    setThread((prev) =>
      updateNode(prev, comment.id, { score: optimistic, user_vote: value })
    )
    const score = await setResourceCommentVote(comment, value)
    if (score !== null) {
      setThread((prev) => updateNode(prev, comment.id, { score }))
    }
  }

  return (
    <div className={styles.thread} data-testid='comment-thread'>
      {loading ? (
        <p className={styles.threadNote}>Loading comments…</p>
      ) : (
        <>
          {thread.map((c) => (
            <CommentNode
              key={c.id}
              comment={c}
              signedIn={signedIn}
              onReply={handleReply}
              onVote={handleVote}
            />
          ))}
          {thread.length === 0 && (
            <p className={styles.threadNote}>
              No comments yet. Start the discussion.
            </p>
          )}
          {signedIn ? (
            <CommentForm
              placeholder='Add a comment…'
              submitLabel='Comment'
              testId='comment'
              onSubmit={handleTopLevel}
            />
          ) : (
            <p className={styles.threadNote}>
              <a
                className={styles.quietLink}
                href='/signin?redirect=/community'
              >
                Sign in
              </a>{' '}
              to join the discussion.
            </p>
          )}
        </>
      )}
    </div>
  )
}
