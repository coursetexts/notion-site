import * as React from 'react'

import styles from './LearningPath.module.css'

export function LearningPathOutlinePanel({
  search,
  onSearchChange,
  searchAriaLabel = 'Search in outline',
  list,
  footer
}: {
  search: string
  onSearchChange: (value: string) => void
  searchAriaLabel?: string
  list: React.ReactNode
  footer?: React.ReactNode
}) {
  return (
    <section className={styles.mapPanel}>
      <div className={styles.mapToolbar}>
        <div className={styles.mapToolbarRow}>
          <div className={styles.mapToolbarCopy}>
            <h2 className={styles.mapTitle}>The outline</h2>
          </div>
        </div>
        <div className={styles.searchWrap}>
          <input
            type='search'
            className={styles.search}
            placeholder='SEARCH'
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            aria-label={searchAriaLabel}
          />
        </div>
      </div>
      <div className={styles.pathListWrap}>
        <div className={styles.pathListScroll}>{list}</div>
        {footer ? (
          <div className={styles.pathListFooter}>{footer}</div>
        ) : null}
      </div>
    </section>
  )
}
