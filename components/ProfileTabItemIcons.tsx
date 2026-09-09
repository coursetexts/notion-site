import * as React from 'react'

type IconProps = {
  className?: string
}

const common = {
  width: 16,
  height: 16,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true as const
}

/** Learning path — connected route / path. */
export function ProfilePathIcon({ className }: IconProps) {
  return (
    <svg {...common} className={className}>
      <circle cx='6' cy='6' r='2.25' />
      <circle cx='18' cy='12' r='2.25' />
      <circle cx='8' cy='18' r='2.25' />
      <path d='M8 7.5l7.5 3.5' />
      <path d='M16.2 13.8L10 16.5' />
    </svg>
  )
}

/** Updates — announcement / megaphone. */
export function ProfileAnnouncementIcon({ className }: IconProps) {
  return (
    <svg {...common} className={className}>
      <path d='M3 11v2a1 1 0 0 0 1 1h1l6 3V7L5 10H4a1 1 0 0 0-1 1z' />
      <path d='M14 9.5c1.2.6 2 1.7 2 2.5s-.8 1.9-2 2.5' />
      <path d='M11 8v8' />
      <path d='M5 14v2.5a2 2 0 0 0 3.2 1.6' />
    </svg>
  )
}

/** Knowledge — light bulb. */
export function ProfileLightbulbIcon({ className }: IconProps) {
  return (
    <svg {...common} className={className}>
      <path d='M9 18h6' />
      <path d='M10 21h4' />
      <path d='M12 3a5.5 5.5 0 0 0-3.2 9.9c.7.5 1.2 1.2 1.2 2.1V16h4v-1c0-.9.5-1.6 1.2-2.1A5.5 5.5 0 0 0 12 3z' />
    </svg>
  )
}

/** Notes — notepad. */
export function ProfileNoteIcon({ className }: IconProps) {
  return (
    <svg {...common} className={className}>
      <path d='M8 3h8a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z' />
      <path d='M9 8h6' />
      <path d='M9 12h6' />
      <path d='M9 16h4' />
    </svg>
  )
}

/** Bookmarks — bookmark ribbon. */
export function ProfileBookmarkIcon({ className }: IconProps) {
  return (
    <svg {...common} className={className}>
      <path d='M7 3h10a1 1 0 0 1 1 1v17l-6-3.5L6 21V4a1 1 0 0 1 1-1z' />
    </svg>
  )
}

/** Activity — course comment. */
export function ProfileCommentIcon({ className }: IconProps) {
  return (
    <svg {...common} className={className}>
      <path d='M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z' />
    </svg>
  )
}

/** Activity — discussion / annotation. */
export function ProfileDiscussionIcon({ className }: IconProps) {
  return (
    <svg {...common} className={className}>
      <path d='M4 7h16' />
      <path d='M4 12h11' />
      <path d='M4 17h8' />
      <path d='M17 14l3 3-3 3' />
    </svg>
  )
}

/** Activity — explored topic / progress. */
export function ProfileProgressIcon({ className }: IconProps) {
  return (
    <svg {...common} className={className}>
      <circle cx='12' cy='12' r='8.25' />
      <path d='M8.5 12.2l2.3 2.3 4.7-5' />
    </svg>
  )
}

/** Activity — resource list suggestion. */
export function ProfileSuggestionIcon({ className }: IconProps) {
  return (
    <svg {...common} className={className}>
      <path d='M12 3v3' />
      <path d='M12 18v3' />
      <path d='M3 12h3' />
      <path d='M18 12h3' />
      <circle cx='12' cy='12' r='4.25' />
    </svg>
  )
}

/** Activity — join request. */
export function ProfileJoinIcon({ className }: IconProps) {
  return (
    <svg {...common} className={className}>
      <circle cx='9' cy='8' r='3.25' />
      <path d='M3.5 19c.6-3.2 2.9-5 5.5-5s4.9 1.8 5.5 5' />
      <path d='M17 8v6' />
      <path d='M14 11h6' />
    </svg>
  )
}
