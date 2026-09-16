import * as React from 'react'

import styles from './LearningPath.module.css'

export function LearningPathOutlinePanel({
  search,
  onSearchChange,
  searchAriaLabel = 'Search in outline',
  title = 'THE PATH',
  hideSearch = false,
  list,
  footer,
  onMobileClose
}: {
  search: string
  onSearchChange: (value: string) => void
  searchAriaLabel?: string
  title?: string
  hideSearch?: boolean
  list: React.ReactNode
  footer?: React.ReactNode
  onMobileClose?: () => void
}) {
  return (
    <section className={styles.mapPanel}>
      <div className={styles.mapToolbar}>
        <div className={styles.mapToolbarRow}>
          {onMobileClose ? (
            <button
              type='button'
              className={styles.mapPanelCloseBtn}
              onClick={onMobileClose}
              aria-label='Close path menu'
            >
              <span aria-hidden>&laquo;</span>
            </button>
          ) : null}
          <div className={styles.mapToolbarCopy}>
            <h2 className={styles.mapTitle}>{title}</h2>
          </div>
        </div>
        {hideSearch ? null : (
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
        )}
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
