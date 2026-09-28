import * as React from 'react'
import Link from 'next/link'

import styles from './PathsHomeBanner.module.css'

export function PathsHomeBanner() {
  return (
    <div className={styles.banner} role='note'>
      <p className={styles.text}>
        Paths are our first experimental interface for self-learning.{' '}
        <Link href='/team' legacyBehavior>
          <a className={styles.link}>
            Help us report bugs and provide early feedback!
          </a>
        </Link>
      </p>
    </div>
  )
}
