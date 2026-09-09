import React, { useEffect, useRef, useState } from 'react'

import type { ProfilePersonalLink } from '@/lib/profile-personal-links-db'
import {
  personalLinkDisplayTitle,
  personalLinkKindLabel
} from '@/components/ProfilePersonalLinksPanel'
import styles from '@/styles/profile.module.css'

function PersonalLinksLinkIcon() {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='14'
      height='14'
      viewBox='0 0 24 24'
      fill='none'
      aria-hidden
    >
      <path
        d='M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

function personalLinkPlatformLabel(url: string): string {
  const kind = personalLinkKindLabel(url)
  if (kind === 'Twitter / X') return 'X'
  return kind
}

function PersonalLinkPlatformIcon({ url }: { url: string }) {
  const kind = personalLinkKindLabel(url)
  if (kind === 'Instagram') {
    return (
      <svg width='16' height='16' viewBox='0 0 16 16' fill='none' aria-hidden>
        <rect
          x='2.5'
          y='2.5'
          width='11'
          height='11'
          rx='3'
          stroke='currentColor'
          strokeWidth='1.1'
        />
        <circle cx='8' cy='8' r='2.5' stroke='currentColor' strokeWidth='1.1' />
        <circle cx='11.5' cy='4.5' r='0.75' fill='currentColor' />
      </svg>
    )
  }
  if (kind === 'LinkedIn') {
    return (
      <svg width='16' height='16' viewBox='0 0 16 16' fill='none' aria-hidden>
        <rect
          x='2.5'
          y='2.5'
          width='11'
          height='11'
          rx='2'
          stroke='currentColor'
          strokeWidth='1.1'
        />
        <path
          d='M5.5 7v4M5.5 5.5v.01M8 11V8.2c0-.9.7-1.2 1.2-1.2.6 0 1 .3 1 1.1V11'
          stroke='currentColor'
          strokeWidth='1.1'
          strokeLinecap='round'
        />
      </svg>
    )
  }
  if (kind === 'Twitter / X') {
    return (
      <svg width='16' height='16' viewBox='0 0 16 16' fill='none' aria-hidden>
        <path
          d='M4 4l8 8M12 4 4 12'
          stroke='currentColor'
          strokeWidth='1.2'
          strokeLinecap='round'
        />
      </svg>
    )
  }
  if (kind === 'GitHub') {
    return (
      <svg width='16' height='16' viewBox='0 0 16 16' fill='none' aria-hidden>
        <path
          d='M8 2.5c-3.3 0-6 2.5-6 5.6 0 2.5 1.6 4.6 3.9 5.3.3.1.4-.1.4-.3v-1c-1.6 0-2-.8-2-.8-.4-1-.9-1.3-.9-1.3-.8-.5.1-.5.1-.5.8.1 1.3.9 1.3.9.8 1.3 2 1 2.5.1.1-.6.3-.9.5-.7.2-1.8 1-2.4 1.1-.6.1-1 .3-1.5.2-.4-.1-1-.5-1.4-1-.5-.5-.8-1.2-.8-2 0-1.5 1.1-2.3 1.1-2.3-.9-1.3-.9-2.6-.9-2.6 0-.7.2-1.4.9-2 .8-.7 2-.7 2.5-.7h.6c.5 0 1.7 0 2.5.7.7.6.9 1.3.9 2 0 0-.1 1.3-.9 2.6 0 0 1.1.8 1.1 2.3 0 .8-.3 1.5-.8 2-.4.5-1 .9-1.4 1-.5.1-1-.1-1.5-.2-.6-.1-1.7-.9-2.4-1.1-.3-.2-.9-.4-.9-.5.1-.1.5-.4 1-.9l.2-.2Z'
          stroke='currentColor'
          strokeWidth='1'
          strokeLinejoin='round'
        />
      </svg>
    )
  }
  return (
    <svg width='16' height='16' viewBox='0 0 16 16' fill='none' aria-hidden>
      <path
        d='M6.2 9.8 4.1 11.9a1.4 1.4 0 1 1-2-2l2.1-2.1M9.8 6.2l2.1-2.1a1.4 1.4 0 1 1 2 2l-2.1 2.1M5.5 10.5 10.5 5.5'
        stroke='currentColor'
        strokeWidth='1.1'
        strokeLinecap='round'
      />
    </svg>
  )
}

type ProfilePersonalLinksPopoverProps = {
  links: ProfilePersonalLink[]
}

export function ProfilePersonalLinksPopover({
  links
}: ProfilePersonalLinksPopoverProps) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!open) return
    function onPointer(event: MouseEvent | TouchEvent) {
      const target = event.target
      if (!(target instanceof Node)) return
      if (wrapRef.current?.contains(target)) return
      setOpen(false)
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('touchstart', onPointer)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('touchstart', onPointer)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (links.length === 0) return null

  return (
    <span className={styles.profilePersonalLinksWrap} ref={wrapRef}>
      <button
        type='button'
        className={styles.profilePersonalLinksTrigger}
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup='dialog'
        aria-expanded={open}
        aria-label={`${links.length} personal link${links.length === 1 ? '' : 's'}`}
      >
        <PersonalLinksLinkIcon />
        <span>{links.length}</span>
      </button>
      {open ? (
        <div
          className={styles.profilePersonalLinksPopover}
          role='dialog'
          aria-label='Personal links'
        >
          {links.map((link) => (
            <a
              key={link.id}
              href={link.url}
              target='_blank'
              rel='noopener noreferrer'
              className={styles.profilePersonalLinksPopoverRow}
              onClick={() => setOpen(false)}
            >
              <span className={styles.profilePersonalLinksPopoverIcon}>
                <PersonalLinkPlatformIcon url={link.url} />
              </span>
              <span className={styles.profilePersonalLinksPopoverText}>
                <span className={styles.profilePersonalLinksPopoverLabel}>
                  {personalLinkPlatformLabel(link.url)}
                </span>
                <span className={styles.profilePersonalLinksPopoverValue}>
                  {personalLinkDisplayTitle(link.url, link.title)}
                </span>
              </span>
            </a>
          ))}
        </div>
      ) : null}
    </span>
  )
}
