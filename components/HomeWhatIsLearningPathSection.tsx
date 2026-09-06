import * as React from 'react'

import { HomeLearningPathDiagram } from './HomeLearningPathDiagram'
import styles from './HomeWhatIsLearningPathSection.module.css'

export function HomeWhatIsLearningPathSection() {
  const [previewOpen, setPreviewOpen] = React.useState(false)
  const [previewHover, setPreviewHover] = React.useState(false)

  const closePreview = React.useCallback(() => {
    setPreviewOpen(false)
    setPreviewHover(false)
  }, [])

  return (
    <section
      id='what-is-a-learning-path'
      className={styles.section}
      aria-labelledby='what-is-a-learning-path-heading'
    >
      <div className={styles.content}>
        <div className={styles.copy}>
          <h2 id='what-is-a-learning-path-heading' className={styles.heading}>
            A new educational interface. <br />{' '}
            <span className={styles.headingAccent}>Learning paths.</span>
          </h2>
          <p className={styles.body}>
            When you want to learn something, you have a goal. A learning path
            is that goal, broken into the concepts you need, in an order that
            works — with a resource list and your notes on each one.
            <br />
            <br />
            It is one place to follow, remember, and come back to, instead of a
            trail of chats, videos, and tabs.
          </p>
        </div>

        <div
          className={`${styles.diagram}${
            previewOpen ? ` ${styles.diagramPreviewOpen}` : ''
          }`}
        >
          <div className={styles.diagramFront}>
            <HomeLearningPathDiagram
              pauseLoop={previewHover}
              onCycleHold={() => setPreviewOpen(true)}
              onCycleRestart={closePreview}
            />
          </div>
          <button
            type='button'
            className={styles.diagramPeek}
            tabIndex={previewOpen ? 0 : -1}
            aria-hidden={!previewOpen}
            aria-label='Preview of a learning path for playing a song on guitar'
            onMouseEnter={() => {
              if (previewOpen) setPreviewHover(true)
            }}
            onMouseLeave={() => setPreviewHover(false)}
            onFocus={() => {
              if (previewOpen) setPreviewHover(true)
            }}
            onBlur={() => setPreviewHover(false)}
          >
            <img src='/images/home/learning-path-preview.png' alt='' />
          </button>
        </div>
      </div>
    </section>
  )
}
