import * as React from 'react'
import Link from 'next/link'

import { getCachedAuth } from '@/lib/auth-cache'
import { useAuthOptional } from '@/contexts/AuthContext'

import styles from './HomeSocialLearningSection.module.css'

const features = [
  {
    title: 'Create and follow learning paths',
    body: 'Turn a goal into an ordered path of concepts, resources, and notes. Follow a path someone else created—or publish your own for others.',
    image: '/images/home/social-feature-track-progress-ss.png',
    imageAlt: 'Learning path with a goal, outline, and ordered resources'
  },
  {
    title: 'Share what helped',
    body: 'Add the videos, papers, exercises, and explanations that made a concept click. Vote on resources so the most useful ones rise to the top.',
    image: '/images/home/social-feature-bookshelf-ss.png',
    imageAlt: 'Learners adding and ranking resources for a concept'
  },
  {
    title: 'Discuss each concept',
    body: 'Ask questions, share what you learned, and help others when they get stuck—all alongside learners working through the same path.',
    image: '/images/home/social-feature-annotate-ss.png',
    imageAlt: 'Discussion among learners on the same learning path'
  }
] as const

export function HomeSocialLearningSection() {
  const auth = useAuthOptional()
  const cached = React.useMemo(() => getCachedAuth(), [])
  const user = auth?.user ?? cached.user
  const isLoggedIn = Boolean(user)

  const ctaHref = isLoggedIn
    ? '/profile'
    : `/signin?redirect=${encodeURIComponent('/profile')}`
  const ctaLabel = isLoggedIn ? 'Your Profile' : 'Start learning'

  return (
    <section className={styles.section}>
      <div className={styles.content}>
        <div className={styles.intro}>
          <div className={styles.introCopy}>
            <h2 className={styles.heading}>
              A <span className={styles.headingAccent}>community</span> for self-learners.
            </h2>
            <p className={styles.subheading}>Learn independently, not alone</p>
          </div>
          <Link href={ctaHref} legacyBehavior>
            <a className={styles.cta}>{ctaLabel}</a>
          </Link>
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
