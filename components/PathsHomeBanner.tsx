import * as React from 'react'

import styles from './PathsHomeBanner.module.css'

export function PathsHomeBanner() {
  return (
    <div className={styles.banner} role='note'>
      <p className={styles.text}>
        Paths are our first community experiment in self-learning and
        educational interfaces.
      </p>
    </div>
  )
}
