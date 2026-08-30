import * as React from 'react'
import Link from 'next/link'

import { getCachedAuth } from '@/lib/auth-cache'
import { useAuthOptional } from '@/contexts/AuthContext'

import styles from './HomeSocialLearningSection.module.css'

const features = [
  {
    title: 'Create a learning path',
    body: 'Start with a learning goal. Create a learning path map that helps organize your notes, resources, and progress towards that learning goal',
    image: '/images/home/social-feature-track-progress-ss.png',
    imageAlt: 'Learning path with a goal, outline, and organized resources'
  },
  {
    title: 'Curate Resources',
    body: 'Find and rank the best resources to learn a concept in a goal, or bookmark a resource for later',
    image: '/images/home/social-feature-bookshelf-ss.png',
    imageAlt: 'Learners ranking resources for a concept'
  },
  {
    title: 'Discuss with friends',
    body: 'Chat with other learners across course materials, syllabi, and shared material',
    image: '/images/home/social-feature-annotate-ss.png',
    imageAlt: 'Discussion among learners on course materials'
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
  const ctaLabel = isLoggedIn ? 'Your Profile' : 'Create an Account'

  return (
    <section className={styles.section}>
      <div className={styles.content}>
        <div className={styles.intro}>
          <h2 className={styles.heading}>
            Coursetexts is social learning,{' '}
            <span className={styles.headingAccent}>as it was meant to be.</span>
          </h2>
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
