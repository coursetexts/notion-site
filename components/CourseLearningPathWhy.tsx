import * as React from 'react'

import styles from './CourseLearningPath.module.css'

interface CourseLearningPathWhyProps {
  text?: string
}

export function CourseLearningPathWhy({ text }: CourseLearningPathWhyProps) {
  const body = (text ?? '').trim()

  return (
    <p className={styles.whyCopy}>
      <strong className={styles.whyLead}>
        Why is this on the learning path:
      </strong>{' '}
      {body || 'A reason has not been written for this step yet.'}
    </p>
  )
}
