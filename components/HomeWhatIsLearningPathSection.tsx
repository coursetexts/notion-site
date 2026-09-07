import * as React from 'react'

import { HomeLearningPathDiagram } from './HomeLearningPathDiagram'
import styles from './HomeWhatIsLearningPathSection.module.css'

export function HomeWhatIsLearningPathSection() {
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
          Turn any learning goal into a path you can finish.
          Follow an ordered sequence of concepts, use the best community-ranked resources, and keep your notes and progress in one place.
          </p>
        </div>

        <div className={styles.diagram}>
          <HomeLearningPathDiagram />
        </div>
      </div>
    </section>
  )
}
