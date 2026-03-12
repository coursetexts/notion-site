import Link from 'next/link'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useFollowerIds } from '@/hooks/useFollowerIds'
import { useFollowingIds } from '@/hooks/useFollowingIds'

import { authDebug } from '@/lib/auth-debug'
import {
  type Annotation as DbAnnotation,
  addAnnotation,
  getAnnotations,
  getOrCreateCourse,
  setVote
} from '@/lib/course-activity-db'

import { useAuthOptional } from '../contexts/AuthContext'
import styles from './AnnotationWidget.module.css'
import { UserLink } from './UserLink'

type SortBy = 'time' | 'votes'

export interface AnnotationWidgetProps {
  count?: number
  onHide?: () => void
  courseUrl?: string
  courseTitle?: string
  coursePageId?: string
  /** Current section/tab label for this annotation context */
  sectionId?: string
}

/** True if any line starts with optional spaces then > (markdown blockquote). */
function isBlockquoteBody(text: string): boolean {
  return text.split('\n').some((line) => /^\s*>/.test(line))
}

/** Strip leading > and optional space from each line for display. */
function stripBlockquoteMarkers(text: string): string {
  return text
    .split('\n')
    .map((line) => line.replace(/^\s*>\s?/, ''))
    .join('\n')
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
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
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

function sortAnnotationRoots(
  roots: ThreadAnnotation[],
  sortBy: SortBy
): ThreadAnnotation[] {
  if (sortBy === 'votes') {
    return [...roots].sort((a, b) => {
      const sa = a.score ?? 0
      const sb = b.score ?? 0
      if (sb !== sa) return sb - sa
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }
  return [...roots].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
}

interface VoteRowProps {
  score: number
  userVote: number | null
  disabled: boolean
  onVote: (value: 1 | -1 | null) => void
}

const UpvoteIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns='http://www.w3.org/2000/svg'
    width='16'
    height='16'
    viewBox='0 0 16 16'
    fill='none'
    className={className}
    aria-hidden
  >
    <g opacity='0.4'>
      <path
        d='M13.3563 9.64376L8.35635 4.64376C8.26155 4.54986 8.13352 4.49719 8.0001 4.49719C7.86667 4.49719 7.73865 4.54986 7.64385 4.64376L2.64385 9.64376C2.57602 9.71605 2.53004 9.80607 2.51124 9.9034C2.49244 10.0007 2.50158 10.1014 2.5376 10.1938C2.57585 10.2848 2.64018 10.3624 2.72249 10.4169C2.80479 10.4714 2.90139 10.5003 3.0001 10.5H13.0001C13.0988 10.5003 13.1954 10.4714 13.2777 10.4169C13.36 10.3624 13.4243 10.2848 13.4626 10.1938C13.4986 10.1014 13.5078 10.0007 13.489 9.9034C13.4702 9.80607 13.4242 9.71605 13.3563 9.64376Z'
        fill='#5D534B'
      />
    </g>
  </svg>
)

const DownvoteIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns='http://www.w3.org/2000/svg'
    width='16'
    height='16'
    viewBox='0 0 16 16'
    fill='none'
    className={className}
    aria-hidden
  >
    <g opacity='0.4'>
      <path
        d='M13.4626 5.80625C13.4243 5.71525 13.36 5.63761 13.2777 5.58311C13.1954 5.52861 13.0988 5.49969 13.0001 5.5H3.0001C2.90139 5.49969 2.80479 5.52861 2.72249 5.58311C2.64018 5.63761 2.57585 5.71525 2.5376 5.80625C2.50158 5.89861 2.49244 5.99927 2.51124 6.09661C2.53004 6.19394 2.57602 6.28396 2.64385 6.35625L7.64385 11.3563C7.73942 11.4487 7.86716 11.5003 8.0001 11.5003C8.13304 11.5003 8.26078 11.4487 8.35635 11.3563L13.3563 6.35625C13.4242 6.28396 13.4702 6.19394 13.489 6.09661C13.5078 5.99927 13.4986 5.89861 13.4626 5.80625Z'
        fill='#5D534B'
      />
    </g>
  </svg>
)

const ReplyArrowIcon: React.FC = () => (
  <svg
    xmlns='http://www.w3.org/2000/svg'
    width='16'
    height='16'
    viewBox='0 0 16 16'
    fill='none'
    className={styles.replyBtnIcon}
    aria-hidden
  >
    <path
      d='M5.75635 9.25623H1.75635V5.25623'
      stroke='#5D534B'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
    <path
      d='M14.0001 11.5C14.0005 10.313 13.6489 9.15254 12.9896 8.16544C12.3304 7.17834 11.3931 6.40896 10.2965 5.95465C9.19987 5.50034 7.99312 5.38152 6.82895 5.61322C5.66477 5.84491 4.59547 6.41671 3.75635 7.25627L1.75635 9.25627'
      stroke='#5D534B'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
)

/** Collapsed → expand (chevron down). */
const RepliesChevronDownIcon: React.FC = () => (
  <svg
    xmlns='http://www.w3.org/2000/svg'
    width='15'
    height='15'
    viewBox='0 0 15 15'
    fill='none'
    className={styles.repliesToggleIcon}
    aria-hidden
  >
    <path
      d='M11.4154 5.26868L7.02482 9.65922L2.63428 5.26868'
      stroke='#0089C4'
      strokeWidth='1.08333'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
)

/** Expanded → collapse (chevron up). */
const RepliesChevronUpIcon: React.FC = () => (
  <svg
    xmlns='http://www.w3.org/2000/svg'
    width='15'
    height='15'
    viewBox='0 0 15 15'
    fill='none'
    className={styles.repliesToggleIcon}
    aria-hidden
  >
    <path
      d='M2.63444 8.78113L7.02498 4.39058L11.4155 8.78113'
      stroke='#0089C4'
      strokeWidth='1.08333'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
)

const SubmitArrowIcon: React.FC = () => (
  <svg
    xmlns='http://www.w3.org/2000/svg'
    width='8'
    height='5'
    viewBox='0 0 8 5'
    fill='none'
    className={styles.submitBtnIcon}
    aria-hidden
  >
    <path
      d='M0.5 3.875L3.875 0.5L7.25 3.875'
      stroke='#F8F7F4'
      strokeWidth='1.1'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
)

const VoteRow: React.FC<VoteRowProps> = ({
  score,
  userVote,
  disabled,
  onVote
}) => {
  const handleUp = () => onVote(userVote === 1 ? null : 1)
  const handleDown = () => onVote(userVote === -1 ? null : -1)
  return (
    <div className={styles.voteRow}>
      <button
        type='button'
        className={
          userVote === 1
            ? `${styles.voteBtn} ${styles.voteBtnActive}`
            : styles.voteBtn
        }
        onClick={handleUp}
        disabled={disabled}
        aria-label='Upvote'
        title='Upvote'
      >
        <UpvoteIcon />
      </button>
      <span className={styles.voteCount}>{score}</span>
      <button
        type='button'
        className={
          userVote === -1
            ? `${styles.voteBtn} ${styles.voteBtnActive}`
            : styles.voteBtn
        }
        onClick={handleDown}
        disabled={disabled}
        aria-label='Downvote'
        title='Downvote'
      >
        <DownvoteIcon />
      </button>
    </div>
  )
}

const SortChevronIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns='http://www.w3.org/2000/svg'
    width='14'
    height='14'
    viewBox='0 0 14 14'
    fill='none'
    className={className}
    aria-hidden
  >
    <path
      d='M3.5 5.25L7 8.75L10.5 5.25'
      stroke='#5D534B'
      strokeWidth='1.25'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
)

const sortLabel = (sortBy: SortBy): string =>
  sortBy === 'votes' ? 'Votes' : 'Newest'

interface SortMenuProps {
  value: SortBy
  onChange: (next: SortBy) => void
}

const SortMenu: React.FC<SortMenuProps> = ({ value, onChange }) => {
  const [open, setOpen] = useState(false)
  const btnRef = useRef<HTMLButtonElement | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    const onPointerDown = (e: MouseEvent | PointerEvent) => {
      const target = e.target as Node | null
      if (!target) return
      if (btnRef.current?.contains(target)) return
      if (menuRef.current?.contains(target)) return
      setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('pointerdown', onPointerDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('pointerdown', onPointerDown)
    }
  }, [open])

  return (
    <div className={styles.sortMenuWrap}>
      <button
        ref={btnRef}
        type='button'
        className={styles.sortBtn}
        aria-haspopup='menu'
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={styles.sortBtnLabel}>{sortLabel(value)}</span>
        <SortChevronIcon
          className={`${styles.sortBtnChevron} ${
            open ? styles.sortBtnChevronOpen : ''
          }`}
        />
      </button>
      {open && (
        <div
          ref={menuRef}
          className={styles.sortMenu}
          role='menu'
          aria-label='Sort annotations'
        >
          <button
            type='button'
            role='menuitemradio'
            aria-checked={value === 'time'}
            className={`${styles.sortMenuItem} ${
              value === 'time' ? styles.sortMenuItemActive : ''
            }`}
            onClick={() => {
              onChange('time')
              setOpen(false)
            }}
          >
            Newest
          </button>
          <button
            type='button'
            role='menuitemradio'
            aria-checked={value === 'votes'}
            className={`${styles.sortMenuItem} ${
              value === 'votes' ? styles.sortMenuItemActive : ''
            }`}
            onClick={() => {
              onChange('votes')
              setOpen(false)
            }}
          >
            Votes
          </button>
        </div>
      )}
    </div>
  )
}

export const AnnotationWidget: React.FC<AnnotationWidgetProps> = ({
  count = 0,
  onHide,
  courseUrl,
  courseTitle,
  coursePageId,
  sectionId
}) => {
  void count
  const auth = useAuthOptional()
  const [sortBy, setSortBy] = useState<SortBy>('time')
  const [inputValue, setInputValue] = useState('')
  const [courseId, setCourseId] = useState<string | null>(null)
  const [annotations, setAnnotations] = useState<DbAnnotation[]>([])
  const [replyDraftById, setReplyDraftById] = useState<Record<string, string>>(
    {}
  )
  const [replyOpenById, setReplyOpenById] = useState<Record<string, boolean>>(
    {}
  )
  const [threadExpandedById, setThreadExpandedById] = useState<
    Record<string, boolean>
  >({})
  /** When false, reply thread for that annotation is hidden (root-level toggles only). */
  const [repliesOpenById, setRepliesOpenById] = useState<
    Record<string, boolean>
  >({})
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submittingReplyId, setSubmittingReplyId] = useState<string | null>(
    null
  )
  const [votingId, setVotingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { followingIds } = useFollowingIds()
  const { followerIds } = useFollowerIds()

  const loadAnnotations = useCallback(async () => {
    if (!coursePageId || !courseTitle || sectionId == null || sectionId === '')
      return
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
  }, [auth?.user?.id, coursePageId, loadAnnotations, sectionId])

  const handleSubmit = async (parentAnnotationId?: string) => {
    const body =
      parentAnnotationId != null
        ? (replyDraftById[parentAnnotationId] || '').trim()
        : inputValue.trim()
    if (
      !body ||
      !courseId ||
      sectionId == null ||
      sectionId === '' ||
      !auth?.user
    )
      return
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
  const sortedAnnotationRoots = useMemo(
    () => sortAnnotationRoots(threadedAnnotations, sortBy),
    [threadedAnnotations, sortBy]
  )
  const updateAnnotationVote = useCallback(
    (annotationId: string, score: number, user_vote: number | null) => {
      setAnnotations((prev) =>
        prev.map((a) =>
          a.id === annotationId ? { ...a, score, user_vote } : a
        )
      )
    },
    []
  )

  return (
    <aside className={styles.root} aria-label='Annotations'>
      <div className={styles.header}>
        <h2 className={styles.title}>
          Annotations{' '}
          <span className={styles.titleCount}>({displayCount})</span>
        </h2>
        <div className={styles.headerActions}>
          <SortMenu value={sortBy} onChange={setSortBy} />
          <button
            type='button'
            className={styles.hideBtn}
            onClick={onHide}
            aria-label='Hide annotations'
          >
            Hide
          </button>
        </div>
      </div>
      {auth?.user ? (
        <div className={styles.addWrap}>
          <div className={styles.addWrapInner}>
            <input
              type='text'
              className={styles.addInput}
              placeholder='Add your thoughts…'
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit(undefined)}
              aria-label='Add annotation'
              disabled={submitting || !sectionId}
            />
            <button
              type='button'
              className={styles.submitBtn}
              onClick={() => handleSubmit(undefined)}
              disabled={submitting || !inputValue.trim() || !sectionId}
              aria-label={submitting ? 'Submitting' : 'Submit annotation'}
              title='Submit'
            >
              {submitting ? (
                <span style={{ color: '#F8F7F4', fontSize: '0.75rem' }}>…</span>
              ) : (
                <SubmitArrowIcon />
              )}
            </button>
          </div>
        </div>
      ) : (
        <p className={styles.signInHint}>
          <Link
            href={
              typeof window !== 'undefined'
                ? `/signin?redirect=${encodeURIComponent(
                    window.location.pathname
                  )}`
                : '/signin'
            }
          >
            Sign in
          </Link>{' '}
          to add annotations.
        </p>
      )}
      {error && <p className={styles.error}>{error}</p>}
      <div className={styles.list}>
        {loading && <p className={styles.placeholder}>Loading…</p>}
        {!loading && threadedAnnotations.length === 0 && (
          <p className={styles.placeholder}>
            No annotations on this section yet.
          </p>
        )}
        {!loading &&
          sortedAnnotationRoots.map((a) => (
            <ThreadAnnotationItem
              key={a.id}
              node={a}
              depth={0}
              authUser={Boolean(auth?.user)}
              courseUrl={courseUrl}
              followingIds={followingIds}
              followerIds={followerIds}
              replyDraftById={replyDraftById}
              replyOpenById={replyOpenById}
              submittingReplyId={submittingReplyId}
              threadExpandedById={threadExpandedById}
              votingId={votingId}
              onVote={async (id, value) => {
                setVotingId(id)
                const newScore = await setVote('annotation', id, value)
                if (newScore !== null) updateAnnotationVote(id, newScore, value)
                setVotingId(null)
              }}
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
              repliesOpenById={repliesOpenById}
              onToggleRepliesOpen={(id) =>
                setRepliesOpenById((prev) => ({
                  ...prev,
                  [id]: prev[id] === false
                }))
              }
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
  followingIds: Set<string>
  followerIds: Set<string>
  replyDraftById: Record<string, string>
  replyOpenById: Record<string, boolean>
  submittingReplyId: string | null
  threadExpandedById: Record<string, boolean>
  votingId: string | null
  onVote: (id: string, value: 1 | -1 | null) => void
  onToggleReply: (id: string) => void
  onToggleThread: (id: string) => void
  onReplyChange: (id: string, value: string) => void
  onSubmitReply: (id: string) => void
  repliesOpenById: Record<string, boolean>
  onToggleRepliesOpen: (id: string) => void
}

const ThreadAnnotationItem: React.FC<ThreadAnnotationItemProps> = ({
  node,
  depth,
  authUser,
  courseUrl,
  followingIds,
  followerIds,
  replyDraftById,
  replyOpenById,
  submittingReplyId,
  threadExpandedById,
  votingId,
  onVote,
  onToggleReply,
  onToggleThread,
  onReplyChange,
  onSubmitReply,
  repliesOpenById,
  onToggleRepliesOpen
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

  const repliesOpen = repliesOpenById[node.id] !== false
  const hasReplies = node.replies.length > 0

  return (
    <div
      className={
        depth === 0
          ? `${styles.threadItem} ${styles.threadItemRoot}`
          : styles.threadItem
      }
      style={{ marginLeft }}
    >
      <div className={styles.annotation}>
        <div className={styles.annotationMetaRow}>
          <span className={styles.author}>
            <UserLink
              userId={node.user_id}
              displayName={node.author?.display_name ?? 'Anonymous'}
              showFollowingTag={followingIds.has(node.user_id)}
              showFollowsYouTag={followerIds.has(node.user_id)}
            />
          </span>
          <span className={styles.metaTimeVotes}>
            <span className={styles.time}>
              {formatRelativeTime(node.created_at)}
            </span>
            <VoteRow
              score={node.score ?? 0}
              userVote={node.user_vote ?? null}
              disabled={!authUser || votingId === node.id}
              onVote={(value) => onVote(node.id, value)}
            />
          </span>
        </div>
        <p
          className={
            isBlockquoteBody(node.body)
              ? `${styles.body} ${styles.bodyBlockquote}`
              : styles.body
          }
        >
          {isBlockquoteBody(node.body)
            ? stripBlockquoteMarkers(node.body)
            : node.body}
        </p>
        <button
          type='button'
          className={styles.replyBtn}
          onClick={() => onToggleReply(node.id)}
        >
          <ReplyArrowIcon />
          Reply
        </button>
        {isReplyOpen && authUser && (
          <div className={styles.replyComposer}>
            <div className={styles.addWrapInner}>
              <input
                type='text'
                className={styles.addInput}
                placeholder='Write a reply…'
                value={draft}
                onChange={(e) => onReplyChange(node.id, e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onSubmitReply(node.id)}
                disabled={isSubmitting}
              />
              <button
                type='button'
                className={styles.submitBtn}
                onClick={() => onSubmitReply(node.id)}
                disabled={isSubmitting || !draft.trim()}
                aria-label={isSubmitting ? 'Submitting reply' : 'Submit reply'}
                title='Submit reply'
              >
                {isSubmitting ? (
                  <span style={{ color: '#F8F7F4', fontSize: '0.75rem' }}>
                    …
                  </span>
                ) : (
                  <SubmitArrowIcon />
                )}
              </button>
            </div>
          </div>
        )}
        {isReplyOpen && !authUser && (
          <p className={styles.signInHint}>
            <Link
              href={`/signin?redirect=${encodeURIComponent(
                courseUrl || '/profile'
              )}`}
            >
              Sign in
            </Link>{' '}
            to reply.
          </p>
        )}
      </div>

      {hasReplies && (
        <div className={styles.repliesToggleRow}>
          <button
            type='button'
            className={styles.repliesToggleBtn}
            onClick={() => onToggleRepliesOpen(node.id)}
            aria-expanded={repliesOpen}
            title={
              repliesOpen
                ? 'Hide replies'
                : `Show ${node.replies.length} repl${
                    node.replies.length === 1 ? 'y' : 'ies'
                  }`
            }
            aria-label={
              repliesOpen
                ? `Hide ${node.replies.length} repl${
                    node.replies.length === 1 ? 'y' : 'ies'
                  }`
                : `Show ${node.replies.length} repl${
                    node.replies.length === 1 ? 'y' : 'ies'
                  }`
            }
          >
            {repliesOpen ? (
              <>
                <RepliesChevronUpIcon />
                <span className={styles.repliesToggleLabel}>
                  Hide replies ({node.replies.length})
                </span>
              </>
            ) : (
              <>
                <RepliesChevronDownIcon />
                <span className={styles.repliesToggleLabel}>
                  Show replies ({node.replies.length})
                </span>
              </>
            )}
          </button>
        </div>
      )}

      {hasReplies && repliesOpen && (
        <div className={styles.threadChildren}>
          {visibleReplies.map((child) => (
            <ThreadAnnotationItem
              key={child.id}
              node={child}
              depth={depth + 1}
              authUser={authUser}
              courseUrl={courseUrl}
              followingIds={followingIds}
              followerIds={followerIds}
              replyDraftById={replyDraftById}
              replyOpenById={replyOpenById}
              submittingReplyId={submittingReplyId}
              threadExpandedById={threadExpandedById}
              votingId={votingId}
              onVote={onVote}
              onToggleReply={onToggleReply}
              onToggleThread={onToggleThread}
              onReplyChange={onReplyChange}
              onSubmitReply={onSubmitReply}
              repliesOpenById={repliesOpenById}
              onToggleRepliesOpen={onToggleRepliesOpen}
            />
          ))}
          {hasLongThread && (
            <button
              type='button'
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
