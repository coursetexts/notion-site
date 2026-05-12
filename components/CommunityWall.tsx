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
import {
  type LinkPreviewVisual,
  resolveLinkPreviewVisual
} from '@/lib/link-preview'

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
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='16'
      height='16'
      viewBox='0 0 16 16'
      fill='none'
      aria-hidden
    >
      <path
        d='M14.4999 6.70625L10.8437 10.3625C11.1249 11.1562 11.2437 12.4812 10.0187 14.1125C9.9319 14.227 9.82188 14.3218 9.69585 14.3907C9.56983 14.4596 9.43065 14.5011 9.28745 14.5125H9.2187C8.95379 14.5114 8.70002 14.4058 8.51245 14.2187L5.49995 11.2062L3.3562 13.3562C3.26063 13.4487 3.13289 13.5003 2.99995 13.5003C2.86701 13.5003 2.73927 13.4487 2.6437 13.3562C2.54981 13.2614 2.49714 13.1334 2.49714 13C2.49714 12.8666 2.54981 12.7385 2.6437 12.6437L4.7937 10.5L1.7687 7.475C1.66835 7.37612 1.59017 7.25705 1.53935 7.12566C1.48852 6.99428 1.46621 6.85359 1.47389 6.71292C1.48157 6.57226 1.51908 6.43484 1.58391 6.30977C1.64874 6.1847 1.73943 6.07485 1.84995 5.9875C3.43745 4.70625 4.9562 4.9625 5.62495 5.16875L9.2937 1.5C9.48196 1.31449 9.73565 1.21051 9.99995 1.21051C10.2642 1.21051 10.5179 1.31449 10.7062 1.5L14.4999 5.29375C14.5933 5.38615 14.6674 5.49615 14.718 5.61737C14.7686 5.7386 14.7946 5.86865 14.7946 6C14.7946 6.13135 14.7686 6.2614 14.718 6.38262C14.6674 6.50384 14.5933 6.61384 14.4999 6.70625Z'
        fill='currentColor'
      />
    </svg>
  )
}

/** YouTube mark for video links — matches other typed placeholders (no thumb). */
function YouTubeCardIcon() {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='28'
      height='28'
      viewBox='0 0 24 24'
      aria-hidden
    >
      <path
        fill='currentColor'
        d='M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12 9.545 15.568z'
      />
    </svg>
  )
}

/** X (Twitter) mark for tweet link placeholders — matches in-app link preview tone. */
function TwitterPostPlaceholderIcon() {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='22'
      height='22'
      viewBox='0 0 24 24'
      fill='currentColor'
      aria-hidden
    >
      <path d='M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z' />
    </svg>
  )
}

function LinkIcon() {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='18'
      height='18'
      viewBox='0 0 18 18'
      fill='none'
      aria-hidden
    >
      <path
        d='M14.7657 3.23437C14.4272 2.89358 14.0246 2.62313 13.5811 2.43857C13.1377 2.25401 12.6621 2.159 12.1817 2.159C11.7014 2.159 11.2258 2.25401 10.7823 2.43857C10.3389 2.62313 9.93627 2.89358 9.59775 3.23437L8.20556 4.62655C8.10861 4.73356 8.05652 4.87374 8.06007 5.01809C8.06362 5.16244 8.12255 5.29989 8.22465 5.40199C8.32675 5.50409 8.46421 5.56302 8.60856 5.56657C8.7529 5.57013 8.89309 5.51804 9.00009 5.42108L10.3923 4.0289C10.8679 3.55616 11.5112 3.29082 12.1817 3.29082C12.8523 3.29082 13.4956 3.55616 13.9712 4.0289C14.207 4.26346 14.394 4.5423 14.5217 4.84939C14.6494 5.15648 14.7151 5.48578 14.7151 5.81835C14.7151 6.15092 14.6494 6.48022 14.5217 6.78731C14.394 7.0944 14.207 7.37324 13.9712 7.6078L11.9813 9.59765C11.5058 10.0704 10.8624 10.3357 10.1919 10.3357C9.52133 10.3357 8.87801 10.0704 8.40244 9.59765C8.35127 9.54118 8.28917 9.4957 8.21989 9.46396C8.15062 9.43222 8.07562 9.41489 7.99944 9.41301C7.92326 9.41113 7.8475 9.42475 7.77675 9.45305C7.706 9.48134 7.64173 9.52371 7.58785 9.57759C7.53397 9.63147 7.4916 9.69574 7.4633 9.76649C7.43501 9.83724 7.42139 9.91301 7.42327 9.98918C7.42514 10.0654 7.44247 10.1404 7.47421 10.2096C7.50595 10.2789 7.55144 10.341 7.6079 10.3922C8.29347 11.077 9.22286 11.4617 10.1919 11.4617C11.1609 11.4617 12.0903 11.077 12.7759 10.3922L14.7657 8.40233C15.1065 8.06382 15.377 7.66123 15.5615 7.21776C15.7461 6.77429 15.8411 6.29869 15.8411 5.81835C15.8411 5.33801 15.7461 4.86241 15.5615 4.41894C15.377 3.97547 15.1065 3.57289 14.7657 3.23437Z'
        fill='currentColor'
      />
      <path
        d='M9.00007 12.5789L7.60789 13.9711C7.1299 14.429 6.49156 14.6815 5.82966 14.6744C5.16777 14.6673 4.53498 14.4012 4.06692 13.9332C3.59886 13.4651 3.33277 12.8323 3.32568 12.1704C3.31859 11.5085 3.57106 10.8702 4.02898 10.3922L6.01882 8.40235C6.4944 7.92961 7.13772 7.66427 7.80828 7.66427C8.47884 7.66427 9.12215 7.92961 9.59773 8.40235C9.70473 8.4993 9.84492 8.55139 9.98927 8.54784C10.1336 8.54428 10.2711 8.48536 10.3732 8.38325C10.4753 8.28115 10.5342 8.1437 10.5378 7.99935C10.5413 7.855 10.4892 7.71482 10.3923 7.60782C9.70669 6.92298 8.7773 6.5383 7.80828 6.5383C6.83925 6.5383 5.90986 6.92298 5.22429 7.60782L3.23445 9.59766C2.87672 9.93278 2.59003 10.3364 2.39143 10.7846C2.19282 11.2327 2.08636 11.7162 2.07837 12.2063C2.07037 12.6964 2.16102 13.1832 2.3449 13.6375C2.52879 14.0919 2.80216 14.5047 3.14877 14.8513C3.49538 15.1979 3.90815 15.4713 4.36253 15.6552C4.81691 15.8391 5.30363 15.9297 5.79375 15.9217C6.28386 15.9137 6.76737 15.8073 7.21551 15.6087C7.66366 15.41 8.06729 15.1234 8.40242 14.7656L9.7946 13.3734C9.89156 13.2664 9.94365 13.1263 9.94009 12.9819C9.93654 12.8376 9.87761 12.7001 9.77551 12.598C9.67341 12.4959 9.53596 12.437 9.39161 12.4334C9.24726 12.4299 9.10707 12.482 9.00007 12.5789Z'
        fill='currentColor'
      />
    </svg>
  )
}

function ExternalIcon() {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='12'
      height='12'
      viewBox='0 0 12 12'
      fill='none'
      aria-hidden
    >
      <path
        d='M3 9L9 3'
        stroke='currentColor'
        strokeWidth='1'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='M4.125 3H9V7.875'
        stroke='currentColor'
        strokeWidth='1'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

function BookmarkIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='12'
      height='12'
      viewBox='0 0 12 12'
      fill='none'
      aria-hidden
    >
      <g opacity={filled ? 1 : 0.5}>
        <path
          d='M8.625 1.5H3.375C3.17609 1.5 2.98532 1.57902 2.84467 1.71967C2.70402 1.86032 2.625 2.05109 2.625 2.25V10.5C2.62536 10.5668 2.64331 10.6322 2.67706 10.6899C2.7108 10.7475 2.75913 10.7952 2.81719 10.8281C2.8728 10.8599 2.93596 10.8761 3 10.875C3.06961 10.8751 3.13784 10.8556 3.19687 10.8188L6 9.06562L8.79844 10.8188C8.85621 10.8535 8.92201 10.8726 8.98939 10.8742C9.05677 10.8759 9.12342 10.86 9.18281 10.8281C9.24087 10.7952 9.2892 10.7475 9.32294 10.6899C9.35669 10.6322 9.37464 10.5668 9.375 10.5V2.25C9.375 2.05109 9.29598 1.86032 9.15533 1.71967C9.01468 1.57902 8.82391 1.5 8.625 1.5Z'
          fill='currentColor'
        />
      </g>
    </svg>
  )
}

function VoteChevronDown() {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='16'
      height='16'
      viewBox='0 0 16 16'
      fill='none'
      aria-hidden
    >
      <g opacity='0.4'>
        <path
          d='M13.4626 5.80625C13.4243 5.71525 13.36 5.63761 13.2777 5.58311C13.1954 5.52861 13.0988 5.49969 13.0001 5.5H3.0001C2.90139 5.49969 2.80479 5.52861 2.72249 5.58311C2.64018 5.63761 2.57585 5.71525 2.5376 5.80625C2.50158 5.89861 2.49244 5.99927 2.51124 6.09661C2.53004 6.19394 2.57602 6.28396 2.64385 6.35625L7.64385 11.3563C7.73942 11.4487 7.86716 11.5003 8.0001 11.5003C8.13304 11.5003 8.26078 11.4487 8.35635 11.3563L13.3563 6.35625C13.4242 6.28396 13.4702 6.19394 13.489 6.09661C13.5078 5.99927 13.4986 5.89861 13.4626 5.80625Z'
          fill='currentColor'
        />
      </g>
    </svg>
  )
}

function VoteChevronUp() {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='16'
      height='16'
      viewBox='0 0 16 16'
      fill='none'
      aria-hidden
    >
      <g opacity='0.4'>
        <path
          d='M13.3563 9.64376L8.35635 4.64376C8.26155 4.54986 8.13352 4.49719 8.0001 4.49719C7.86667 4.49719 7.73865 4.54986 7.64385 4.64376L2.64385 9.64376C2.57602 9.71605 2.53004 9.80607 2.51124 9.9034C2.49244 10.0007 2.50158 10.1014 2.5376 10.1938C2.57585 10.2848 2.64018 10.3624 2.72249 10.4169C2.80479 10.4714 2.90139 10.5003 3.0001 10.5H13.0001C13.0988 10.5003 13.1954 10.4714 13.2777 10.4169C13.36 10.3624 13.4243 10.2848 13.4626 10.1938C13.4986 10.1014 13.5078 10.0007 13.489 9.9034C13.4702 9.80607 13.4242 9.71605 13.3563 9.64376Z'
          fill='currentColor'
        />
      </g>
    </svg>
  )
}

function CommentBubbleIcon() {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='16'
      height='16'
      viewBox='0 0 16 16'
      fill='none'
      aria-hidden
    >
      <path
        d='M8.25 1.5C6.59341 1.5033 5.00562 2.16284 3.83423 3.33423C2.66284 4.50562 2.0033 6.09341 2 7.75V13.0188C2 13.279 2.10338 13.5286 2.2874 13.7126C2.47142 13.8966 2.72101 14 2.98125 14H8.25C9.9076 14 11.4973 13.3415 12.6694 12.1694C13.8415 10.9973 14.5 9.4076 14.5 7.75C14.5 6.0924 13.8415 4.50269 12.6694 3.33058C11.4973 2.15848 9.9076 1.5 8.25 1.5ZM10 9.5H6.25C6.11739 9.5 5.99021 9.44732 5.89645 9.35355C5.80268 9.25979 5.75 9.13261 5.75 9C5.75 8.86739 5.80268 8.74021 5.89645 8.64645C5.99021 8.55268 6.11739 8.5 6.25 8.5H10C10.1326 8.5 10.2598 8.55268 10.3536 8.64645C10.4473 8.74021 10.5 8.86739 10.5 9C10.5 9.13261 10.4473 9.25979 10.3536 9.35355C10.2598 9.44732 10.1326 9.5 10 9.5ZM10 7.5H6.25C6.11739 7.5 5.99021 7.44732 5.89645 7.35355C5.80268 7.25979 5.75 7.13261 5.75 7C5.75 6.86739 5.80268 6.74021 5.89645 6.64645C5.99021 6.55268 6.11739 6.5 6.25 6.5H10C10.1326 6.5 10.2598 6.55268 10.3536 6.64645C10.4473 6.74021 10.5 6.86739 10.5 7C10.5 7.13261 10.4473 7.25979 10.3536 7.35355C10.2598 7.44732 10.1326 7.5 10 7.5Z'
        fill='currentColor'
      />
    </svg>
  )
}

function ExpandableTwoLineText({
  as,
  className,
  children,
  measureKey
}: {
  as: 'h3' | 'p'
  className: string
  children: React.ReactNode
  measureKey: string
}) {
  const ref = React.useRef<HTMLElement | null>(null)
  const [expanded, setExpanded] = React.useState(false)
  const [expandable, setExpandable] = React.useState(false)

  /**
   * scrollHeight vs clientHeight is unreliable with -webkit-line-clamp in some
   * browsers. Briefly unclamp in layout, compare full vs two-line height.
   */
  React.useLayoutEffect(() => {
    const el = ref.current
    if (!el) {
      setExpandable(false)
      return
    }

    const measure = () => {
      if (expanded) {
        setExpandable(true)
        return
      }
      el.classList.remove(styles.cardTextClamp)
      el.classList.add(styles.cardTextExpanded)
      const fullH = el.scrollHeight
      el.classList.remove(styles.cardTextExpanded)
      el.classList.add(styles.cardTextClamp)
      const clampH = el.clientHeight
      setExpandable(fullH > clampH + 2)
    }

    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [measureKey, expanded])

  const showInteraction = expandable || expanded
  const toggle = () => {
    if (!showInteraction) return
    setExpanded((v) => !v)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (!showInteraction) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      toggle()
    }
  }

  const Tag = as
  return (
    <Tag
      ref={ref as React.Ref<HTMLHeadingElement & HTMLParagraphElement>}
      className={[
        className,
        expanded ? styles.cardTextExpanded : styles.cardTextClamp,
        showInteraction ? styles.cardTextExpandable : ''
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={showInteraction ? toggle : undefined}
      onKeyDown={showInteraction ? onKeyDown : undefined}
      tabIndex={showInteraction ? 0 : undefined}
      aria-expanded={showInteraction ? expanded : undefined}
      title={
        showInteraction
          ? expanded
            ? 'Click to collapse'
            : 'Click to expand'
          : undefined
      }
    >
      {children}
    </Tag>
  )
}

function CardDescription({ text }: { text: string }) {
  const lower = text.toLowerCase()
  const idx = lower.lastIndexOf('read more')
  const body =
    idx === -1 ? (
      text
    ) : (
      <>
        {text.slice(0, idx).trimEnd()}
        {text.slice(0, idx).trimEnd() ? ' ' : null}
        <em className={styles.cardDescReadMore}>{text.slice(idx).trim()}</em>
      </>
    )

  return (
    <ExpandableTwoLineText
      as='p'
      className={styles.cardDesc}
      measureKey={text}
    >
      {body}
    </ExpandableTwoLineText>
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
  sourceHandle?: string
  previewImage?: string | null
}

function cardPreview(r: ResourceVM): LinkPreviewVisual {
  return resolveLinkPreviewVisual(r.link, r.previewImage ?? null)
}

function WebsiteFaviconPreview({
  faviconUrl,
  hostname
}: {
  faviconUrl: string
  hostname: string
}) {
  const [failed, setFailed] = React.useState(false)
  if (failed) {
    return (
      <span className={styles.previewLinkIconWrap}>
        <LinkIcon />
      </span>
    )
  }
  return (
    <span
      className={styles.previewWebsiteIconWrap}
      title={hostname}
      aria-label={`${hostname} icon`}
    >
      <img
        src={faviconUrl}
        alt=''
        className={styles.previewWebsiteFavicon}
        loading='lazy'
        decoding='async'
        onError={() => setFailed(true)}
      />
    </span>
  )
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
    authorName: r.author?.display_name ?? null,
    previewImage: null
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
    sourceLabel: r.sourceLabel,
    sourceHandle: r.sourceHandle,
    previewImage: r.previewImage ?? null
  }
}

export interface CommunityWallProps {
  coursePageId?: string
  courseTitle?: string
  courseUrl?: string
}

export interface CommunityWallHandle {
  openAdd: () => void
}

export const CommunityWall = React.forwardRef<
  CommunityWallHandle,
  CommunityWallProps
>(function CommunityWall({ coursePageId, courseTitle, courseUrl }, ref) {
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

  const openAdd = React.useCallback(() => {
    if (!isSignedIn) {
      setError('Sign in to add a resource.')
      return
    }
    setAddOpen(true)
    setError(null)
  }, [isSignedIn])

  React.useImperativeHandle(ref, () => ({ openAdd }), [openAdd])

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

  const pinNumberById = React.useMemo(() => {
    const m = new Map<string, number>()
    let n = 0
    for (const r of resources) {
      if (r.is_pinned) {
        n += 1
        m.set(r.id, n)
      }
    }
    return m
  }, [resources])

  return (
    <section className={styles.root} aria-label='Community wall'>
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
            const preview = cardPreview(r)
            const domain = hostFromUrl(r.link)
            const source = r.sourceLabel ?? (domain ? domain : 'Resource')
            const subline =
              r.sourceHandle ??
              (domain || (r.link ? r.link : 'No link'))
            const pinN = pinNumberById.get(r.id)
            return (
              <article key={r.id} className={styles.card}>
                {r.is_pinned && pinN != null && (
                  <div className={styles.pinRow}>
                    <span className={styles.pinTag}>
                      <PinIcon /> Pin {pinN}
                    </span>
                  </div>
                )}

                <ExpandableTwoLineText
                  as='h3'
                  className={styles.cardTitle}
                  measureKey={r.title}
                >
                  {r.title}
                </ExpandableTwoLineText>
                <CardDescription text={r.description} />

                <div className={styles.preview}>
                  <div
                    className={
                      preview.kind === 'image'
                        ? styles.previewBodyImage
                        : preview.kind === 'youtube'
                          ? styles.previewBodyYoutube
                          : preview.kind === 'twitter'
                            ? styles.previewBodyTwitter
                            : preview.kind === 'website'
                              ? styles.previewBodyWebsite
                              : styles.previewBody
                    }
                  >
                    {preview.kind === 'image' ? (
                      <img
                        src={preview.src}
                        alt=''
                        className={styles.previewImg}
                        loading='lazy'
                        decoding='async'
                      />
                    ) : preview.kind === 'youtube' ? (
                      <span className={styles.previewYoutubeIconWrap}>
                        <YouTubeCardIcon />
                      </span>
                    ) : preview.kind === 'twitter' ? (
                      <span className={styles.previewTwitterIconWrap}>
                        <TwitterPostPlaceholderIcon />
                      </span>
                    ) : preview.kind === 'website' ? (
                      <WebsiteFaviconPreview
                        faviconUrl={preview.faviconUrl}
                        hostname={preview.hostname}
                      />
                    ) : (
                      <span className={styles.previewLinkIconWrap}>
                        <LinkIcon />
                      </span>
                    )}
                  </div>
                  <div className={styles.previewFooter}>
                    <div className={styles.previewMeta}>
                      <div className={styles.previewSource}>{source}</div>
                      {r.link ? (
                        <a
                          href={r.link}
                          className={styles.previewLink}
                          target='_blank'
                          rel='noopener noreferrer'
                          title={r.link}
                        >
                          {subline}
                        </a>
                      ) : (
                        <div className={styles.previewLink}>{subline}</div>
                      )}
                    </div>
                    <div className={styles.previewActions}>
                      {r.link ? (
                        <a
                          href={r.link}
                          className={styles.previewIconBtn}
                          target='_blank'
                          rel='noopener noreferrer'
                          aria-label='Open link in new tab'
                          title={r.link}
                        >
                          <ExternalIcon />
                        </a>
                      ) : null}
                      <button
                        type='button'
                        className={
                          r.is_bookmarked
                            ? `${styles.previewBookmarkBtn} ${styles.previewBookmarkBtnActive}`
                            : styles.previewBookmarkBtn
                        }
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
                  </div>
                </div>

                <div className={styles.actionsRow}>
                  <div
                    className={styles.votePill}
                    role='group'
                    aria-label='Votes'
                  >
                    <button
                      type='button'
                      className={styles.votePillBtn}
                      aria-label='Downvote'
                      title='Downvote'
                      onClick={() =>
                        handleVote(r, r.user_vote === -1 ? null : -1)
                      }
                      disabled={!isSignedIn || r.kind !== 'db'}
                    >
                      <VoteChevronDown />
                    </button>
                    <span className={styles.votePillScore}>{r.score}</span>
                    <button
                      type='button'
                      className={styles.votePillBtn}
                      aria-label='Upvote'
                      title='Upvote'
                      onClick={() => handleVote(r, r.user_vote === 1 ? null : 1)}
                      disabled={!isSignedIn || r.kind !== 'db'}
                    >
                      <VoteChevronUp />
                    </button>
                  </div>
                  <button
                    type='button'
                    className={styles.commentPill}
                    onClick={() => openComments(r)}
                    disabled={r.kind !== 'db'}
                    aria-label='View comments'
                    title='View comments'
                  >
                    <CommentBubbleIcon />
                    <span>{r.comment_count}</span>
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
})
