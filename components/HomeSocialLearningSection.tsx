import * as React from 'react'

import { LearningPathsTutorialButton } from './LearningPathsTutorialButton'
import styles from './HomeSocialLearningSection.module.css'

const features = [
  {
    title: 'Create and follow paths for your learning goals',
    body: "Break down any goal into an orderly path of topics, resources, and notes. Or, discover others' paths to follow in the footsteps of fellow learners.",
    image: '/images/home/social-feature-track-progress-ss.png',
    imageAlt: 'Learning path with a goal, outline, and ordered resources'
  },
  {
    title: 'Share paths and resources',
    body: 'Organize your videos, papers, and other resources for yourself and others to reference. Share them, discover, and upvote similar resources that were uploaded by other community members.',
    image: '/images/home/social-feature-bookshelf-ss.png',
    imageAlt: 'Learners adding and ranking resources for a topic'
  },
  {
    title: 'Discuss paths and topics',
    body: 'Add questions, comments, and feedback to any resource. Provide and receive help when you or a fellow learner is feeling stuck!',
    image: '/images/home/social-feature-annotate-ss.png',
    imageAlt: 'Discussion among learners on the same learning path'
  }
] as const

export function HomeSocialLearningSection() {
  return (
    <section className={styles.section}>
      <div className={styles.content}>
        <div className={styles.intro}>
          <div className={styles.introCopy}>
            <h2 className={styles.heading}>
              A <span className={styles.headingAccent}>community</span> for
              self-learners.
            </h2>
          </div>
          <LearningPathsTutorialButton />
          <div className={styles.introRule} aria-hidden />
        </div>

        <div className={styles.featureGrid}>
          {features.map((item) => (
            <div key={item.title} className={styles.featureCol}>
              <h3 className={styles.featureTitle}>{item.title}</h3>
              <p className={styles.featureBody}>{item.body}</p>
              <div className={styles.featureImageWrap}>
                <img
                  src={item.image}
                  alt={item.imageAlt}
                  className={styles.featureImage}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
