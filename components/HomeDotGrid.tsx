import * as React from 'react'

import styles from './HomeDotGrid.module.css'

export function HomeDotGrid() {
  return (
    <section className={styles.gridBand}>
      <div className={styles.content}>
        <img
          src='/images/home/dot-grid-hero.png'
          alt=''
          className={styles.heroImage}
        />
        <p className={styles.disclaimer}>
          Coursetexts has neither sought nor received permission from any
          university to open-source courses that were taught at that university.
          It is not affiliated with, sponsored by, or endorsed by any
          university.
        </p>
      </div>
    </section>
  )
}
