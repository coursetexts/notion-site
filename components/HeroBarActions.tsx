import * as React from 'react'

import type { ContentReportTarget } from '@/lib/content-reports'
import type { LearningPathVisibility } from '@/lib/learning-path-seed'

import heroStyles from './CourseHero.module.css'
import { PinIcon } from './PinIcon'
import { ReportButton } from './ReportButton'

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

function ShareIcon() {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='14'
      height='14'
      viewBox='0 0 16 16'
      fill='none'
      aria-hidden
    >
      <circle
        cx='12'
        cy='3.5'
        r='1.75'
        stroke='currentColor'
        strokeWidth='1.3'
      />
      <circle
        cx='4'
        cy='8'
        r='1.75'
        stroke='currentColor'
        strokeWidth='1.3'
      />
      <circle
        cx='12'
        cy='12.5'
        r='1.75'
        stroke='currentColor'
        strokeWidth='1.3'
      />
      <path
        d='M5.6 7.15L10.4 4.35M5.6 8.85L10.4 11.65'
        stroke='currentColor'
        strokeWidth='1.3'
        strokeLinecap='round'
      />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='14'
      height='14'
      viewBox='0 0 16 16'
      fill='none'
      aria-hidden
    >
      <rect
        x='3.5'
        y='7'
        width='9'
        height='6.5'
        rx='1.5'
        stroke='currentColor'
        strokeWidth='1.3'
      />
      <path
        d='M5.5 7V5.25a2.5 2.5 0 0 1 5 0V7'
        stroke='currentColor'
        strokeWidth='1.3'
        strokeLinecap='round'
      />
    </svg>
  )
}

function GlobeIcon() {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='14'
      height='14'
      viewBox='0 0 16 16'
      fill='none'
      aria-hidden
    >
      <circle
        cx='8'
        cy='8'
        r='5.25'
        stroke='currentColor'
        strokeWidth='1.3'
      />
      <path
        d='M2.75 8h10.5M8 2.75c1.6 1.7 2.4 3.4 2.4 5.25S9.6 11.55 8 13.25M8 2.75C6.4 4.45 5.6 6.15 5.6 8s.8 3.55 2.4 5.25'
        stroke='currentColor'
        strokeWidth='1.3'
        strokeLinecap='round'
      />
    </svg>
  )
}

function UsersIcon() {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='14'
      height='14'
      viewBox='0 0 16 16'
      fill='none'
      aria-hidden
    >
      <circle
        cx='6'
        cy='5.5'
        r='2.1'
        stroke='currentColor'
        strokeWidth='1.3'
      />
      <path
        d='M2.4 12.5c.35-2 1.7-3.1 3.6-3.1s3.25 1.1 3.6 3.1'
        stroke='currentColor'
        strokeWidth='1.3'
        strokeLinecap='round'
      />
      <circle
        cx='11.2'
        cy='6'
        r='1.7'
        stroke='currentColor'
        strokeWidth='1.3'
      />
      <path
        d='M10.1 9.6c1.35.15 2.35.95 2.7 2.4'
        stroke='currentColor'
        strokeWidth='1.3'
        strokeLinecap='round'
      />
    </svg>
  )
}

function InviteIcon() {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='14'
      height='14'
      viewBox='0 0 16 16'
      fill='none'
      aria-hidden
    >
      <circle
        cx='6.25'
        cy='5.5'
        r='2.15'
        stroke='currentColor'
        strokeWidth='1.3'
      />
      <path
        d='M2.5 12.6c.4-2.05 1.85-3.15 3.75-3.15 1.05 0 1.95.35 2.65.95'
        stroke='currentColor'
        strokeWidth='1.3'
        strokeLinecap='round'
      />
      <path
        d='M12.25 7.25v4.5M10 9.5h4.5'
        stroke='currentColor'
        strokeWidth='1.3'
        strokeLinecap='round'
      />
    </svg>
  )
}

const VISIBILITY_ITEMS: Array<{
  value: LearningPathVisibility
  label: string
  icon: React.ReactNode
}> = [
  { value: 'private', label: 'Private', icon: <LockIcon /> },
  { value: 'public', label: 'Public', icon: <GlobeIcon /> },
  { value: 'collaborative', label: 'Collab', icon: <UsersIcon /> }
]

function MenuItemLabel({
  icon,
  children
}: {
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <>
      <span className={heroStyles.moreItemIcon}>{icon}</span>
      <span>{children}</span>
    </>
  )
}

export function HeroActionGroup({ children }: { children: React.ReactNode }) {
  return <div className={heroStyles.heroActionGroup}>{children}</div>
}

export function HeroShareButton({
  href,
  onShared,
  style
}: {
  href?: string
  onShared?: () => void
  style?: React.CSSProperties
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
    } catch {
      window.prompt('Copy this link', shareUrl)
      onShared?.()
      return
    }
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      setCopied(false)
      timer.current = null
      onShared?.()
    }, 900)
  }

  return (
    <button
      type='button'
      role='menuitem'
      className={heroStyles.moreItem}
      style={style}
      onClick={() => void handleShare()}
      aria-label={copied ? 'Link copied' : 'Copy share link'}
    >
      <MenuItemLabel icon={<ShareIcon />}>
        {copied ? 'Copied' : 'Share'}
      </MenuItemLabel>
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
  pinned,
  pinBusy,
  onPinToggle,
  visibility,
  visibilityBusy,
  onVisibilityChange,
  onInviteCollaborators
}: {
  reportTarget: ContentReportTarget
  shareHref?: string
  pinned?: boolean
  pinBusy?: boolean
  onPinToggle?: () => void
  visibility?: LearningPathVisibility
  visibilityBusy?: boolean
  onVisibilityChange?: (next: LearningPathVisibility) => void
  onInviteCollaborators?: () => void
}) {
  const [open, setOpen] = React.useState(false)
  const [menuVisible, setMenuVisible] = React.useState(false)
  const wrapRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!open) {
      setMenuVisible(false)
      return
    }
    let frame2 = 0
    const frame1 = window.requestAnimationFrame(() => {
      frame2 = window.requestAnimationFrame(() => {
        setMenuVisible(true)
      })
    })
    return () => {
      window.cancelAnimationFrame(frame1)
      window.cancelAnimationFrame(frame2)
    }
  }, [open])

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
  const showPin = Boolean(onPinToggle)

  let itemIndex = 0
  function nextItemDelay(): React.CSSProperties {
    const delay = 40 + itemIndex * 30
    itemIndex += 1
    return { ['--more-item-delay' as string]: `${delay}ms` }
  }

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
        <div
          className={
            menuVisible
              ? `${heroStyles.moreMenu} ${heroStyles.moreMenuVisible}`
              : heroStyles.moreMenu
          }
          role='menu'
        >
          <div className={heroStyles.moreMenuInner}>
            <HeroShareButton
              href={shareHref}
              onShared={() => setOpen(false)}
              style={nextItemDelay()}
            />
            {showPin ? (
              <button
                type='button'
                role='menuitem'
                className={
                  pinned
                    ? `${heroStyles.moreItem} ${heroStyles.moreItemActive}`
                    : heroStyles.moreItem
                }
                style={nextItemDelay()}
                disabled={pinBusy}
                aria-checked={Boolean(pinned)}
                onClick={() => {
                  onPinToggle?.()
                  setOpen(false)
                }}
              >
                <MenuItemLabel
                  icon={<PinIcon size={14} filled={Boolean(pinned)} />}
                >
                  {pinned ? 'Unpin' : 'Pin'}
                </MenuItemLabel>
              </button>
            ) : null}
            <ReportButton
              target={reportTarget}
              variant='menuItem'
              className={heroStyles.moreItem}
              iconClassName={heroStyles.moreItemIcon}
              style={nextItemDelay()}
              onOpen={() => setOpen(false)}
            />
            {onInviteCollaborators ? (
              <button
                type='button'
                role='menuitem'
                className={heroStyles.moreItem}
                style={nextItemDelay()}
                onClick={() => {
                  onInviteCollaborators()
                  setOpen(false)
                }}
              >
                <MenuItemLabel icon={<InviteIcon />}>Invite</MenuItemLabel>
              </button>
            ) : null}
            {showVisibility ? (
              <>
                <div
                  className={heroStyles.moreDivider}
                  style={nextItemDelay()}
                  aria-hidden
                />
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
                      style={nextItemDelay()}
                      disabled={visibilityBusy}
                      aria-checked={active}
                      onClick={() => {
                        onVisibilityChange?.(item.value)
                        setOpen(false)
                      }}
                    >
                      <MenuItemLabel icon={item.icon}>
                        {item.label}
                      </MenuItemLabel>
                    </button>
                  )
                })}
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}
