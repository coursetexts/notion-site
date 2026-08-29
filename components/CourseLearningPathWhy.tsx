import * as React from 'react'

import styles from './CourseLearningPath.module.css'
import { CourseLearningPathSectionToggle } from './CourseLearningPathLinkSection'

interface CourseLearningPathWhyProps {
  text?: string
  headingId?: string
  resetKey?: string
}

export function CourseLearningPathWhy({
  text,
  headingId = 'course-learning-path-why-heading',
  resetKey
}: CourseLearningPathWhyProps) {
  const [open, setOpen] = React.useState(false)
  const body = (text ?? '').trim()

  React.useEffect(() => {
    setOpen(false)
  }, [resetKey, text])

  return (
    <section aria-labelledby={headingId}>
      <div
        className={`${styles.videosHeader}${
          open ? '' : ` ${styles.videosHeaderCollapsed}`
        }`}
      >
        <h2 id={headingId} className={styles.videosTitle}>
          <span style={{ color: '#0089c4', display: 'inline-flex' }}>
            <WhyIcon />
          </span>
          Why is this on the learning path
        </h2>
        <div className={styles.videosHeaderActions}>
          <CourseLearningPathSectionToggle
            open={open}
            label='Why is this on the learning path'
            onToggle={() => setOpen((value) => !value)}
          />
        </div>
      </div>

      {open ? (
        <div className={styles.whyBody}>
          <p className={styles.whyCopy}>
            {body ||
              'A reason has not been written for this step yet.'}
          </p>
        </div>
      ) : null}
    </section>
  )
}

function WhyIcon() {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='20'
      height='20'
      viewBox='0 0 16 16'
      fill='none'
      aria-hidden
    >
      <circle cx='8' cy='8' r='6.25' stroke='currentColor' strokeWidth='1.2' />
      <path
        d='M6.4 6.15c0-1 0.85-1.7 1.7-1.7 0.9 0 1.65 0.6 1.65 1.5 0 0.85-0.55 1.2-1.15 1.55-0.5 0.3-0.7 0.55-0.7 1.1v0.2'
        stroke='currentColor'
        strokeWidth='1.2'
        strokeLinecap='round'
      />
      <circle cx='8' cy='11.35' r='0.7' fill='currentColor' />
    </svg>
  )
}
