import * as React from 'react'

import styles from './DefinedTerm.module.css'

type DefinedTermProps = {
  title: string
  definition: string
  pronunciation?: string
  children: React.ReactNode
}

export function DefinedTerm({
  title,
  definition,
  pronunciation,
  children
}: DefinedTermProps) {
  return (
    <span className={styles.term} tabIndex={0}>
      <span className={styles.word}>{children}</span>
      <span className={styles.tooltip} role='tooltip'>
        <span className={styles.tooltipTitle}>{title}</span>
        {pronunciation ? (
          <span className={styles.tooltipPronunciation}>{pronunciation}</span>
        ) : null}
        <span className={styles.tooltipBody}>{definition}</span>
      </span>
    </span>
  )
}
