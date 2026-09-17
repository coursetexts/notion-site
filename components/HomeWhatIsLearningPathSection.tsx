import * as React from 'react'
import Link from 'next/link'

import { pathsCommunityHref } from '@/lib/paths-routes'

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
            <b>Turn any learning goal into a path you can finish.</b> <br />
   
            Follow an ordered sequence of concepts, with a list of
            community-ranked resources attached, and along with your notes and progress in one
            place.
          </p>
          <p className={styles.body}>
            A community of autodidacts - Anyone can publish a
            learning path to help others learn what they have already.
            The community curates and votes on resources to build the best
            possible learning experience.{' '} <br /> <br />
            <Link href={pathsCommunityHref()} legacyBehavior>
              <a className={styles.bodyLink}>Learn more about our community</a>
            </Link>
            .
          </p>
        </div>

        <div className={styles.diagram}>
          <HomeLearningPathDiagram />
        </div>
      </div>
    </section>
  )
}
