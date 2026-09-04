import * as React from 'react'

import styles from './PathCompleteCheck.module.css'

/** Outline completed mark: light-blue stroke check, no circle. */
export function PathCompleteCheck() {
  return (
    <span className={styles.check} aria-hidden>
      <svg
        xmlns='http://www.w3.org/2000/svg'
        width='15'
        height='15'
        viewBox='0 0 16 16'
        fill='none'
      >
        <path
          d='M2.75 8.35L6.2 11.7L13.25 3.9'
          stroke='currentColor'
          strokeWidth='1.7'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
      </svg>
    </span>
  )
}

export function OutlineAccordionChevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`${styles.chevron}${open ? ` ${styles.chevronOpen}` : ''}`}
      xmlns='http://www.w3.org/2000/svg'
      width='10'
      height='10'
      viewBox='0 0 12 12'
      fill='currentColor'
      aria-hidden
    >
      <path d='M2 4.25h8L6 9.25z' />
    </svg>
  )
}
