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

function BookmarkIcon() {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='14'
      height='14'
      viewBox='-4 -4 20 20'
      fill='none'
      aria-hidden
    >
      <path
        d='M8.625 1.5H3.375C3.17609 1.5 2.98532 1.57902 2.84467 1.71967C2.70402 1.86032 2.625 2.05109 2.625 2.25V10.5C2.62536 10.5668 2.64331 10.6322 2.67706 10.6899C2.7108 10.7475 2.75913 10.7952 2.81719 10.8281C2.8728 10.8599 2.93596 10.8761 3 10.875C3.06961 10.8751 3.13784 10.8556 3.19687 10.8188L6 9.06562L8.79844 10.8188C8.85621 10.8535 8.92201 10.8726 8.98939 10.8742C9.05677 10.8759 9.12342 10.86 9.18281 10.8281C9.24087 10.7952 9.2892 10.7475 9.32294 10.6899C9.35669 10.6322 9.37464 10.5668 9.375 10.5V2.25C9.375 2.05109 9.29598 1.86032 9.15533 1.71967C9.01468 1.57902 8.82391 1.5 8.625 1.5Z'
        fill='currentColor'
      />
    </svg>
  )
}

function MoreIcon() {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='14'
      height='14'
      viewBox='0 0 16 16'
      fill='none'
      aria-hidden
    >
      <circle cx='8' cy='3.2' r='1.25' fill='currentColor' />
      <circle cx='8' cy='8' r='1.25' fill='currentColor' />
      <circle cx='8' cy='12.8' r='1.25' fill='currentColor' />
    </svg>
  )
}

export function HeroActionGroup({ children }: { children: React.ReactNode }) {
  return <div className={heroStyles.heroActionGroup}>{children}</div>
}

export function HeroShareButton({
  href,
  onShared
}: {
  href?: string
  onShared?: () => void
}) {
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
        onShared?.()
      }, 900)
    } catch {
      window.prompt('Copy this link', shareUrl)
      onShared?.()
    }
  }

  return (
    <button
      type='button'
      role='menuitem'
      className={heroStyles.moreItem}
      onClick={() => void handleShare()}
      aria-label={copied ? 'Link copied' : 'Copy share link'}
    >
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
      <BookmarkIcon />
      {saved ? 'Saved' : 'Save'}
    </button>
  )
}

export function HeroMoreMenu({
  reportTarget,
  shareHref,
  visibility,
  visibilityBusy,
  onVisibilityChange
}: {
  reportTarget: ContentReportTarget
  shareHref?: string
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
        <MoreIcon />
      </button>
      {open ? (
        <div className={heroStyles.moreMenu} role='menu'>
          <HeroShareButton
            href={shareHref}
            onShared={() => setOpen(false)}
          />
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
