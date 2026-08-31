import * as React from 'react'

import styles from './LearningPath.module.css'

export function LearningPathOutlinePanel({
  viewMode,
  onViewModeChange,
  search,
  onSearchChange,
  searchAriaLabel = 'Search in outline',
  graphHint,
  list,
  graph,
  footer
}: {
  viewMode: 'list' | 'graph'
  onViewModeChange: (mode: 'list' | 'graph') => void
  search: string
  onSearchChange: (value: string) => void
  searchAriaLabel?: string
  graphHint: string
  list: React.ReactNode
  graph: React.ReactNode
  footer?: React.ReactNode
}) {
  return (
    <section className={styles.mapPanel}>
      <div className={styles.mapToolbar}>
        <div className={styles.mapToolbarRow}>
          <div className={styles.mapToolbarCopy}>
            <h2 className={styles.mapTitle}>
              {viewMode === 'list' ? 'The outline' : 'The map'}
            </h2>
            {viewMode === 'graph' ? (
              <span className={styles.mapHint}>{graphHint}</span>
            ) : null}
          </div>
          <div className={styles.viewToggle} role='group' aria-label='Path view'>
            <button
              type='button'
              className={styles.viewToggleBtn}
              aria-pressed={viewMode === 'list'}
              onClick={() => onViewModeChange('list')}
            >
              List
            </button>
            <button
              type='button'
              className={styles.viewToggleBtn}
              aria-pressed={viewMode === 'graph'}
              onClick={() => onViewModeChange('graph')}
            >
              Graph
            </button>
          </div>
        </div>
        {viewMode === 'list' ? (
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
        ) : null}
      </div>
      {viewMode === 'list' ? (
        <div className={styles.pathListWrap}>
          <div className={styles.pathListScroll}>{list}</div>
          {footer ? (
            <div className={styles.pathListFooter}>{footer}</div>
          ) : null}
        </div>
      ) : (
        graph
      )}
    </section>
  )
}
