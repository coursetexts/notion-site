import React from 'react'

import styles from '@/styles/profile.module.css'

/** Grey circle between “N following” and “N followers” (Figma spacing uses flex gap on parent). */
export function FollowCountDividerDot() {
  return (
    <span className={styles.sidebarFollowDot} aria-hidden>
      <svg
        xmlns='http://www.w3.org/2000/svg'
        width='4'
        height='4'
        viewBox='0 0 4 4'
        fill='none'
      >
        <circle cx='2' cy='2' r='2' fill='#D9D9D9' />
      </svg>
    </span>
  )
}
