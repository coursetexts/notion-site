import * as React from 'react'
import Link from 'next/link'

import { getCachedAuth } from '@/lib/auth-cache'
import { useAuthOptional } from '@/contexts/AuthContext'

import styles from './HomeSocialLearningSection.module.css'

const features = [
  {
    title: 'Create your bookshelf',
    body: 'Add private or public pins, saved links, and social links to your profile',
    image: '/images/home/social-feature-bookshelf-ss.png',
    imageAlt: 'Profile bookshelf with follow button and social links'
  },
  {
    title: 'Annotate with friends',
    body: 'Chat with other learners across course materials, syllabi, and shared material',
    image: '/images/home/social-feature-annotate-ss.png',
    imageAlt: 'Annotation thread with learner comments'
  },
  {
    title: 'Track your learning progress',
    body: 'Learn frontier material at your own pace. Mark as completed when you feel ready.',
    image: '/images/home/social-feature-track-progress-ss.png',
    imageAlt: 'Table of contents with completed readings'
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
