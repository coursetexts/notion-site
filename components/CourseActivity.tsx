import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react'

import { useFollowerIds } from '@/hooks/useFollowerIds'
import { useFollowingIds } from '@/hooks/useFollowingIds'

import {
  type Annotation as DbAnnotation,
  type Comment as DbComment,
  addComment,
  getAnnotations,
  getComments,
  getOrCreateCourse,
  setVote
} from '@/lib/course-activity-db'

import { useAuthOptional } from '../contexts/AuthContext'
import styles from './CourseActivity.module.css'
import { UserLink } from './UserLink'

type TabId = 'all' | 'comments' | 'annotations'
type SortBy = 'time' | 'votes'
type ThreadComment = DbComment & { replies: ThreadComment[] }

function autoGrowTextArea(el: HTMLTextAreaElement | null) {
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${el.scrollHeight}px`
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

const SubmitArrowIcon: React.FC = () => (
  <svg
    xmlns='http://www.w3.org/2000/svg'
    width='12'
    height='12'
    viewBox='0 0 12 12'
    fill='none'
    className={styles.submitBtnIcon}
    aria-hidden
  >
    <path
      d='M6 10.125V1.875'
      stroke='#F8F7F4'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
    <path
      d='M2.625 5.25L6 1.875L9.375 5.25'
      stroke='#F8F7F4'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
)

const SortChevronIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns='http://www.w3.org/2000/svg'
    width='12'
    height='12'
    viewBox='0 0 12 12'
    fill='none'
    className={className}
    aria-hidden
  >
    <path
      d='M10.0969 4.35469C10.0682 4.28644 10.02 4.22821 9.95822 4.18733C9.89649 4.14646 9.82405 4.12477 9.75001 4.125H2.25001C2.17598 4.12477 2.10353 4.14646 2.0418 4.18733C1.98007 4.22821 1.93183 4.28644 1.90314 4.35469C1.87612 4.42396 1.86927 4.49946 1.88337 4.57246C1.89747 4.64545 1.93195 4.71297 1.98282 4.76719L5.73283 8.51719C5.8045 8.5865 5.90031 8.62524 6.00001 8.62524C6.09972 8.62524 6.19552 8.5865 6.2672 8.51719L10.0172 4.76719C10.0681 4.71297 10.1026 4.64545 10.1167 4.57246C10.1308 4.49946 10.1239 4.42396 10.0969 4.35469Z'
      fill='#5D534B'
    />
  </svg>
)

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

/** Up-right arrow ↗ for section tag – Figma-style, matches toggle chevrons */
const SectionTagArrowIcon: React.FC<{ className?: string }> = ({
  className
}) => (
  <svg
    xmlns='http://www.w3.org/2000/svg'
    width='12'
    height='12'
    viewBox='0 0 12 12'
    fill='none'
    className={className}
    aria-hidden
  >
    <path
      d='M3 9L9 3M9 3V6.5M9 3H5.5'
      stroke='currentColor'
      strokeWidth='1.08333'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
)

const GoogleIcon: React.FC = () => (
  <svg width='20' height='20' viewBox='0 0 24 24' aria-hidden>
    <path
      fill='#4285F4'
      d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
    />
    <path
      fill='#34A853'
      d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
    />
    <path
      fill='#FBBC05'
      d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
    />
    <path
      fill='#EA4335'
      d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
    />
  </svg>
)

const sectionTagArrowTransition = {
  type: 'tween' as const,
  duration: 0.28,
  ease: [0.22, 1, 0.36, 1] as const
}

/** Clickable section tag that expands on hover to reveal ↗ arrow */
const SectionTagButton: React.FC<{
  label: string
  onClick: () => void
  title: string
}> = ({ label, onClick, title }) => {
  const [hovered, setHovered] = useState(false)
  return (
    <motion.button
      type='button'
      className={styles.sectionTag}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={title}
    >
      <span className={styles.sectionTagLabel}>{label}</span>
      <motion.span
        className={styles.sectionTagArrow}
        initial={false}
        animate={{
          width: hovered ? 16 : 0,
          opacity: hovered ? 1 : 0,
          marginLeft: hovered ? 4 : 0
        }}
        transition={sectionTagArrowTransition}
        style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}
      >
        <SectionTagArrowIcon />
      </motion.span>
    </motion.button>
  )
}

const sortLabel = (sortBy: SortBy): string =>
  sortBy === 'votes' ? 'Most Voted' : 'Newest First'

interface SortMenuProps {
  value: SortBy
  onChange: (next: SortBy) => void
  ariaLabel: string
}

const SortMenu: React.FC<SortMenuProps> = ({ value, onChange, ariaLabel }) => {
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
          aria-label={ariaLabel}
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
            Newest First
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
            Most Voted
          </button>
        </div>
      )}
    </div>
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
        className={styles.voteBtn}
        onClick={handleUp}
        disabled={disabled}
        aria-label='Upvote'
        title='Upvote'
      >
        <UpvoteIcon
          className={userVote === 1 ? styles.voteBtnActive : undefined}
        />
      </button>
      <span className={styles.voteCount}>{score}</span>
      <button
        type='button'
        className={styles.voteBtn}
        onClick={handleDown}
        disabled={disabled}
        aria-label='Downvote'
        title='Downvote'
      >
        <DownvoteIcon
          className={userVote === -1 ? styles.voteBtnActive : undefined}
        />
      </button>
    </div>
  )
}

function buildCommentTree(comments: DbComment[]): ThreadComment[] {
  const sorted = [...comments].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
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

function sortCommentRoots(
  roots: ThreadComment[],
  sortBy: SortBy
): ThreadComment[] {
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

function sortAnnotationRoots<T extends { score?: number; created_at: string }>(
  items: T[],
  sortBy: SortBy
): T[] {
  if (sortBy === 'votes') {
    return [...items].sort((a, b) => {
      const sa = a.score ?? 0
      const sb = b.score ?? 0
      if (sb !== sa) return sb - sa
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }
  return [...items].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
}

export interface CourseActivityProps {
  coursePageId?: string
  courseTitle?: string
  courseUrl?: string
  /** When provided, section tags become clickable and call this with the section label to open that tab. */
  onSectionClick?: (sectionLabel: string) => void
}

export const CourseActivity: React.FC<CourseActivityProps> = ({
  coursePageId,
  courseTitle,
  courseUrl,
  onSectionClick
}) => {
  const auth = useAuthOptional()
  const [activeTab, setActiveTab] = useState<TabId>('comments')
  const [sortBy, setSortBy] = useState<SortBy>('time')
  const [commentInput, setCommentInput] = useState('')
  const commentComposerRef = useRef<HTMLTextAreaElement | null>(null)
  const [courseId, setCourseId] = useState<string | null>(null)
  const [comments, setComments] = useState<DbComment[]>([])
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
  const [repliesOpenById, setRepliesOpenById] = useState<
    Record<string, boolean>
  >({})
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submittingReplyId, setSubmittingReplyId] = useState<string | null>(
    null
  )
  const [error, setError] = useState<string | null>(null)
  const [votingId, setVotingId] = useState<string | null>(null)
  const { followingIds } = useFollowingIds()
  const { followerIds } = useFollowerIds()

  const loadCourseAndActivity = useCallback(async () => {
    if (!coursePageId || !courseTitle) return
    setLoading(true)
    setError(null)
    try {
      const result = await getOrCreateCourse(
        coursePageId,
        courseTitle,
        courseUrl
      )
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

  useEffect(() => {
    autoGrowTextArea(commentComposerRef.current)
  }, [commentInput])

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
    const items: {
      type: 'comment' | 'annotation'
      item: DbComment | DbAnnotation
      at: string
      score: number
    }[] = []
    comments.forEach((c) =>
      items.push({
        type: 'comment',
        item: c,
        at: c.created_at,
        score: c.score ?? 0
      })
    )
    annotations.forEach((a) =>
      items.push({
        type: 'annotation',
        item: a,
        at: a.created_at,
        score: a.score ?? 0
      })
    )
    if (sortBy === 'votes') {
      items.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score
        return new Date(b.at).getTime() - new Date(a.at).getTime()
      })
    } else {
      items.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    }
    return items
  }, [comments, annotations, sortBy])

  const threadedComments = useMemo(() => buildCommentTree(comments), [comments])
  const sortedCommentRoots = useMemo(
    () => sortCommentRoots(threadedComments, sortBy),
    [threadedComments, sortBy]
  )

  const updateCommentVote = useCallback(
    (commentId: string, score: number, user_vote: number | null) => {
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, score, user_vote } : c))
      )
    },
    []
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

  const participants = React.useMemo(() => {
    const byId: Record<string, { name: string; count: number }> = {}
    const add = (name: string) => {
      const n = name || 'Anonymous'
      if (!byId[n]) byId[n] = { name: n, count: 0 }
      byId[n].count += 1
    }
    comments.forEach((c) => add(c.author?.display_name ?? undefined))
    annotations.forEach((a) => add(a.author?.display_name ?? undefined))
    return Object.values(byId)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  }, [comments, annotations])

  if (!coursePageId || !courseTitle) {
    return (
      <section className={styles.root} aria-label='Course activity'>
        <h2 className={styles.mainTitle}>Course activity</h2>
        <p className={styles.placeholderText}>
          Activity is available on course pages.
        </p>
      </section>
    )
  }

  return (
    <section className={styles.root} aria-label='Course activity'>
      <h2 className={styles.mainTitle}>Completed the course?</h2>

      <div className={styles.layout}>
        <div className={styles.main}>
          <nav
            className={styles.tabs}
            role='tablist'
            aria-label='Activity tabs'
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type='button'
                role='tab'
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
              <div className={styles.headingRow}>
                <h3 className={styles.commentsHeading}>
                  Comments{' '}
                  <span className={styles.commentsHeadingCount}>
                    ({commentCount})
                  </span>
                </h3>
                <div
                  className={styles.sortWrap}
                  role='group'
                  aria-label='Sort comments'
                >

                  <SortMenu
                    value={sortBy}
                    onChange={setSortBy}
                    ariaLabel='Sort comments'
                  />
                </div>
              </div>
              {auth?.user && (
                <div className={styles.addWrap}>
                  <div className={styles.addWrapInner}>
                    <textarea
                      ref={commentComposerRef}
                      className={styles.addInput}
                      placeholder='Add your thoughts…'
                      value={commentInput}
                      onChange={(e) => setCommentInput(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === 'Enter' &&
                        !e.shiftKey && (e.preventDefault(), handleSubmitComment(undefined))
                      }
                      onInput={(e) =>
                        autoGrowTextArea(e.currentTarget)
                      }
                      aria-label='Add comment'
                      disabled={submitting}
                      rows={1}
                    />
                    <button
                      type='button'
                      className={styles.submitBtn}
                      onClick={() => handleSubmitComment(undefined)}
                      disabled={submitting || !commentInput.trim()}
                      aria-label={submitting ? 'Posting' : 'Post comment'}
                      title='Post'
                    >
                      {submitting ? (
                        <span
                          style={{
                            color: '#F8F7F4',
                            fontSize: '0.75rem'
                          }}
                        >
                          …
                        </span>
                      ) : (
                        <SubmitArrowIcon />
                      )}
                    </button>
                  </div>
                </div>
              )}
              {!auth?.user && (
                <p className={styles.signInHint}>
                  <Link
                    href={`/signin?redirect=${encodeURIComponent(courseUrl)}`}
                  >
                    Sign in
                  </Link>{' '}
                  to add a comment.
                </p>
              )}
              {error && <p className={styles.error}>{error}</p>}
              <div className={styles.commentList}>
                {sortedCommentRoots.map((c) => (
                  <ThreadCommentItem
                    key={c.id}
                    node={c}
                    depth={0}
                    authUser={Boolean(auth?.user)}
                    courseUrl={courseUrl}
                    followingIds={followingIds}
                    followerIds={followerIds}
                    replyDraftById={replyDraftById}
                    replyOpenById={replyOpenById}
                    submittingReplyId={submittingReplyId}
                    threadExpandedById={threadExpandedById}
                    repliesOpenById={repliesOpenById}
                    votingId={votingId}
                    onVote={async (id, value) => {
                      setVotingId(id)
                      const newScore = await setVote('comment', id, value)
                      if (newScore !== null)
                        updateCommentVote(id, newScore, value)
                      setVotingId(null)
                    }}
                    onToggleReply={(id) =>
                      setReplyOpenById((prev) => ({ ...prev, [id]: !prev[id] }))
                    }
                    onToggleThread={(id) =>
                      setThreadExpandedById((prev) => ({
                        ...prev,
                        [id]: !prev[id]
                      }))
                    }
                    onToggleRepliesOpen={(id) =>
                      setRepliesOpenById((prev) => ({
                        ...prev,
                        [id]: prev[id] === false
                      }))
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
              <div className={styles.headingRow}>
                <h3 className={styles.commentsHeading}>
                  Annotations{' '}
                  <span className={styles.commentsHeadingCount}>
                    ({annotationCount})
                  </span>
                </h3>
                <div
                  className={styles.sortWrap}
                  role='group'
                  aria-label='Sort annotations'
                >

                  <SortMenu
                    value={sortBy}
                    onChange={setSortBy}
                    ariaLabel='Sort annotations'
                  />
                </div>
              </div>
              {annotations.length === 0 && (
                <p className={styles.placeholderText}>
                  No annotations yet. Add annotations from the sidebar on a
                  specific section.
                </p>
              )}
              {sortAnnotationRoots(annotations, sortBy).map((a) => (
                <div key={a.id} className={styles.threadItemRoot}>
                  <div className={styles.annotationItem}>
                    <div className={styles.commentHeader}>
                    <span className={styles.author}>
                      <UserLink
                        userId={a.user_id}
                        displayName={a.author?.display_name ?? 'Anonymous'}
                        showFollowingTag={followingIds.has(a.user_id)}
                        showFollowsYouTag={followerIds.has(a.user_id)}
                      />
                    </span>
                    <span className={styles.metaTimeVotes}>
                      <span className={styles.time}>
                        {formatRelativeTime(a.created_at)}
                      </span>
                      <VoteRow
                        score={a.score ?? 0}
                        userVote={a.user_vote ?? null}
                        disabled={!auth?.user || votingId === a.id}
                        onVote={async (value) => {
                          setVotingId(a.id)
                          const newScore = await setVote(
                            'annotation',
                            a.id,
                            value
                          )
                          if (newScore !== null)
                            updateAnnotationVote(a.id, newScore, value)
                          setVotingId(null)
                        }}
                      />
                    </span>
                    {onSectionClick && a.section_id ? (
                      <SectionTagButton
                        label={a.section_id}
                        onClick={() => onSectionClick(a.section_id)}
                        title={`Go to section: ${a.section_id}`}
                      />
                    ) : (
                      <span className={styles.sectionTag}>{a.section_id}</span>
                    )}
                  </div>
                    <p className={styles.body}>{a.body}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && activeTab === 'all' && (
            <div className={styles.allPanel}>
              <div className={styles.headingRow}>
                <h3 className={styles.commentsHeading}>
                  All Activity{' '}
                  <span className={styles.commentsHeadingCount}>
                    ({totalCount})
                  </span>
                </h3>
                <div
                  className={styles.sortWrap}
                  role='group'
                  aria-label='Sort activity'
                >
                  <SortMenu
                    value={sortBy}
                    onChange={setSortBy}
                    ariaLabel='Sort activity'
                  />
                </div>
              </div>
              {allActivity.length === 0 && (
                <p className={styles.placeholderText}>No activity yet.</p>
              )}
              {allActivity.map(({ type, item }) =>
                type === 'comment' ? (
                  <div key={`c-${item.id}`} className={styles.threadItemRoot}>
                    <div className={styles.comment}>
                      <div className={styles.commentHeader}>
                      <span className={styles.author}>
                        <UserLink
                          userId={(item as DbComment).user_id}
                          displayName={
                            (item as DbComment).author?.display_name ??
                            'Anonymous'
                          }
                          showFollowingTag={followingIds.has(
                            (item as DbComment).user_id
                          )}
                          showFollowsYouTag={followerIds.has(
                            (item as DbComment).user_id
                          )}
                        />
                      </span>
                      <span className={styles.metaTimeVotes}>
                        <span className={styles.time}>
                          {formatRelativeTime((item as DbComment).created_at)}
                        </span>
                        <VoteRow
                          score={(item as DbComment).score ?? 0}
                          userVote={(item as DbComment).user_vote ?? null}
                          disabled={!auth?.user || votingId === item.id}
                          onVote={async (value) => {
                            setVotingId(item.id)
                            const newScore = await setVote(
                              'comment',
                              item.id,
                              value
                            )
                            if (newScore !== null)
                              updateCommentVote(item.id, newScore, value)
                            setVotingId(null)
                          }}
                        />
                      </span>
                        <span className={styles.typeTag}>Comment</span>
                      </div>
                      <p className={styles.body}>{(item as DbComment).body}</p>
                    </div>
                  </div>
                ) : (
                  <div key={`a-${item.id}`} className={styles.threadItemRoot}>
                    <div className={styles.annotationItem}>
                      <div className={styles.commentHeader}>
                      <span className={styles.author}>
                        <UserLink
                          userId={(item as DbAnnotation).user_id}
                          displayName={
                            (item as DbAnnotation).author?.display_name ??
                            'Anonymous'
                          }
                          showFollowingTag={followingIds.has(
                            (item as DbAnnotation).user_id
                          )}
                          showFollowsYouTag={followerIds.has(
                            (item as DbAnnotation).user_id
                          )}
                        />
                      </span>
                        <span className={styles.metaTimeVotes}>
                          <span className={styles.time}>
                            {formatRelativeTime(
                              (item as DbAnnotation).created_at
                            )}
                          </span>
                          <VoteRow
                            score={(item as DbAnnotation).score ?? 0}
                            userVote={(item as DbAnnotation).user_vote ?? null}
                            disabled={!auth?.user || votingId === item.id}
                            onVote={async (value) => {
                              setVotingId(item.id)
                              const newScore = await setVote(
                                'annotation',
                                item.id,
                                value
                              )
                              if (newScore !== null)
                                updateAnnotationVote(item.id, newScore, value)
                              setVotingId(null)
                            }}
                          />
                        </span>
                        <span className={styles.typeTag}>Annotation</span>
                        {onSectionClick &&
                        (item as DbAnnotation).section_id ? (
                          <SectionTagButton
                            label={
                              (item as DbAnnotation).section_id ?? ''
                            }
                            onClick={() =>
                              onSectionClick(
                                (item as DbAnnotation).section_id ?? ''
                              )
                            }
                            title={`Go to section: ${
                              (item as DbAnnotation).section_id ?? ''
                            }`}
                          />
                        ) : (
                          <span className={styles.sectionTag}>
                            {(item as DbAnnotation).section_id}
                          </span>
                        )}
                      </div>
                      <p className={styles.body}>
                        {(item as DbAnnotation).body}
                      </p>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>

        {participants.length > 0 && (
          <aside className={styles.participants} aria-label='Participants'>
            {participants.map((p, i) => (
              <div key={i} className={styles.participant}>
                <span className={styles.participantCount}>{p.count}</span>
                <span className={styles.participantName}>{p.name}</span>
              </div>
            ))}
          </aside>
        )}

        {!loading && totalCount === 0 && (
          <aside className={styles.activityCtaWrap} aria-label='Call to action'>
            <div className={styles.activityCta}>
              <div className={styles.activityCtaImageWrap}>
                <Image
                  src='/images/coursepage/FurnitureSignInCTA.png'
                  alt=''
                  width={240}
                  height={120}
                  className={styles.activityCtaImage}
                />
              </div>
              <p className={styles.activityCtaMessage}>
                No comments yet. Be the first!
              </p>
              {!auth?.user && (
                <>
                  <button
                    type='button'
                    className={styles.activityCtaGoogleBtn}
                    onClick={() => auth?.signInWithGoogle?.()}
                    disabled={!auth}
                  >
                    <GoogleIcon />
                    <span>Continue with Google</span>
                  </button>
                  <p className={styles.activityCtaSignUp}>
                    Don&apos;t have an account?{' '} Sign Up
                  </p>
                </>
              )}
            </div>
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
  followingIds: Set<string>
  followerIds: Set<string>
  replyDraftById: Record<string, string>
  replyOpenById: Record<string, boolean>
  submittingReplyId: string | null
  threadExpandedById: Record<string, boolean>
  repliesOpenById: Record<string, boolean>
  votingId: string | null
  onVote: (id: string, value: 1 | -1 | null) => void
  onToggleReply: (id: string) => void
  onToggleThread: (id: string) => void
  onToggleRepliesOpen: (id: string) => void
  onReplyChange: (id: string, value: string) => void
  onSubmitReply: (id: string) => void
}

const ThreadCommentItem: React.FC<ThreadCommentItemProps> = ({
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
  repliesOpenById,
  votingId,
  onVote,
  onToggleReply,
  onToggleThread,
  onToggleRepliesOpen,
  onReplyChange,
  onSubmitReply
}) => {
  const COLLAPSE_AFTER = 2
  const marginLeft = Math.min(depth * 16, 96)
  const isReplyOpen = Boolean(replyOpenById[node.id])
  const draft = replyDraftById[node.id] || ''
  const replyComposerRef = useRef<HTMLTextAreaElement | null>(null)
  const isSubmitting = submittingReplyId === node.id
  const hasLongThread = node.replies.length > COLLAPSE_AFTER
  const isThreadExpanded = Boolean(threadExpandedById[node.id])
  const repliesOpen = repliesOpenById[node.id] !== false
  const hasReplies = node.replies.length > 0
  const visibleReplies =
    hasLongThread && !isThreadExpanded
      ? node.replies.slice(0, COLLAPSE_AFTER)
      : node.replies

  useEffect(() => {
    if (!isReplyOpen) return
    autoGrowTextArea(replyComposerRef.current)
  }, [draft, isReplyOpen])

  return (
    <div
      className={
        depth === 0
          ? `${styles.threadItem} ${styles.threadItemRoot}`
          : styles.threadItem
      }
      style={{ marginLeft }}
    >
      <div className={styles.comment}>
        <div className={styles.commentHeader}>
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
              <textarea
                ref={replyComposerRef}
                className={styles.addInput}
                placeholder='Write a reply…'
                value={draft}
                onChange={(e) => onReplyChange(node.id, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key !== 'Enter' || e.shiftKey) return
                  e.preventDefault()
                  onSubmitReply(node.id)
                }}
                onInput={(e) => autoGrowTextArea(e.currentTarget)}
                disabled={isSubmitting}
                rows={1}
              />
              <button
                type='button'
                className={styles.submitBtn}
                onClick={() => onSubmitReply(node.id)}
                disabled={isSubmitting || !draft.trim()}
                aria-label={
                  isSubmitting ? 'Posting reply' : 'Submit reply'
                }
                title='Submit reply'
              >
                {isSubmitting ? (
                  <span
                    style={{
                      color: '#F8F7F4',
                      fontSize: '0.75rem'
                    }}
                  >
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
            <ThreadCommentItem
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
              repliesOpenById={repliesOpenById}
              votingId={votingId}
              onVote={onVote}
              onToggleReply={onToggleReply}
              onToggleThread={onToggleThread}
              onToggleRepliesOpen={onToggleRepliesOpen}
              onReplyChange={onReplyChange}
              onSubmitReply={onSubmitReply}
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
