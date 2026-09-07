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
            When you want to learn something, you have a goal. A learning path
            is that goal, broken into the concepts you need, in an order that
            works — with a resource list and your notes on each one.
            <br />
            <br />
            It is one place to follow, remember, and come back to, instead of a
            trail of chats, videos, and tabs.
          </p>
        </div>

        <div className={styles.diagram}>
          <HomeLearningPathDiagram />
        </div>
      </div>
    </section>
  )
}
