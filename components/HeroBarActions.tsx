import * as React from 'react'

import type { ContentReportTarget } from '@/lib/content-reports'
import type { LearningPathVisibility } from '@/lib/learning-path-seed'

import heroStyles from './CourseHero.module.css'
import { ReportButton } from './ReportButton'

const VISIBILITY_ITEMS: Array<{
  value: LearningPathVisibility
  label: string
}> = [
  { value: 'private', label: 'Private' },
  { value: 'public', label: 'Public' },
  { value: 'collaborative', label: 'Collab' }
]

function ShareArrowIcon() {
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
        d='M3.25 8.75L8.75 3.25M4.5 3.25h4.25V7.5'
        stroke='currentColor'
        strokeWidth='1.25'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='13'
      height='13'
      viewBox='0 0 16 16'
      fill={filled ? 'currentColor' : 'none'}
      aria-hidden
    >
      <path
        d='M8 13.35S2.4 10.1 2.4 6.55A3.15 3.15 0 0 1 8 4.9a3.15 3.15 0 0 1 5.6 1.65C13.6 10.1 8 13.35 8 13.35Z'
        stroke='currentColor'
        strokeWidth='1.25'
        strokeLinejoin='round'
      />
    </svg>
  )
}

export function HeroShareButton({ href }: { href?: string }) {
  const [copied, setCopied] = React.useState(false)
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  React.useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  async function handleShare() {
    const shareUrl = href
      ? `${window.location.origin}${href.startsWith('/') ? href : `/${href}`}`
      : window.location.href
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => {
        setCopied(false)
        timer.current = null
      }, 1600)
    } catch {
      window.prompt('Copy this link', shareUrl)
    }
  }

  return (
    <button
      type='button'
      className={heroStyles.heroAction}
      onClick={() => void handleShare()}
      aria-label={copied ? 'Link copied' : 'Copy share link'}
    >
      <ShareArrowIcon />
      {copied ? 'Copied' : 'Share'}
    </button>
  )
}

export function HeroSaveButton({
  saved,
  busy,
  onClick,
  saveLabel,
  savedLabel
}: {
  saved: boolean
  busy?: boolean
  onClick: () => void
  saveLabel: string
  savedLabel: string
}) {
  return (
    <button
      type='button'
      className={
        saved
          ? `${heroStyles.heroAction} ${heroStyles.heroActionSaved}`
          : heroStyles.heroAction
      }
      onClick={onClick}
      disabled={busy}
      aria-pressed={saved}
      aria-label={saved ? savedLabel : saveLabel}
    >
      <HeartIcon filled={saved} />
      {saved ? 'Saved' : 'Save'}
    </button>
  )
}

export function HeroMoreMenu({
  reportTarget,
  visibility,
  visibilityBusy,
  onVisibilityChange
}: {
  reportTarget: ContentReportTarget
  visibility?: LearningPathVisibility
  visibilityBusy?: boolean
  onVisibilityChange?: (next: LearningPathVisibility) => void
}) {
  const [open, setOpen] = React.useState(false)
  const wrapRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!open) return
    function onPointerDown(event: MouseEvent) {
      if (!wrapRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  const showVisibility = Boolean(onVisibilityChange && visibility)

  return (
    <div className={heroStyles.moreWrap} ref={wrapRef}>
      <button
        type='button'
        className={heroStyles.moreBtn}
        aria-label='More'
        aria-haspopup='menu'
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        •••
      </button>
      {open ? (
        <div className={heroStyles.moreMenu} role='menu'>
          <ReportButton
            target={reportTarget}
            variant='menuItem'
            className={heroStyles.moreItem}
            onOpen={() => setOpen(false)}
          />
          {showVisibility ? (
            <>
              <div className={heroStyles.moreDivider} />
              {VISIBILITY_ITEMS.map((item) => {
                const active = item.value === visibility
                return (
                  <button
                    key={item.value}
                    type='button'
                    role='menuitem'
                    className={
                      active
                        ? `${heroStyles.moreItem} ${heroStyles.moreItemActive}`
                        : heroStyles.moreItem
                    }
                    disabled={visibilityBusy}
                    aria-checked={active}
                    onClick={() => {
                      onVisibilityChange?.(item.value)
                      setOpen(false)
                    }}
                  >
                    {item.label}
                  </button>
                )
              })}
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
