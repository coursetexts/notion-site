import * as React from 'react'

import styles from './HomeLicenseBar.module.css'

export function HomeLicenseBar() {
  return (
    <div className={styles.bar}>
      <p className={styles.text}>
        All content is licensed under{' '}
        <a
          href='https://creativecommons.org/licenses/by-nc-sa/4.0/'
          target='_blank'
          rel='noreferrer'
          className={styles.license}
        >
          CC BY-NC-SA 4.0
        </a>
      </p>
    </div>
  )
}
