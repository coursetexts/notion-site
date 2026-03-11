import * as React from 'react'

import styles from './HomeBlogSection.module.css'

export function HomeBlogSection() {
  const blogPostUrl =
    'https://blog.coursetexts.org/automating-copyright-compliance-for-open-courseware'

  return (
    <section className={styles.section}>
      <div className={styles.content}>
        <h2 className={styles.heading}>Fresh from the Blog</h2>

        <a
          href={blogPostUrl}
          className={styles.featureImageFrame}
          target='_blank'
          rel='noreferrer'
        >
          <img
            src='/images/home/blog-feature-image.png?v=2'
            alt='Automating Copyright Compliance for Open Courseware'
            className={styles.featureImage}
          />
        </a>

        <span className={styles.dateBadge}>
          <span className={styles.dateText}>FEB 24, 2025</span>
        </span>

        <a
          href={blogPostUrl}
          className={styles.postTitleLink}
          target='_blank'
          rel='noreferrer'
        >
          <h3 className={styles.postTitle}>
            Automating Copyright Compliance for Open Courseware
          </h3>
        </a>

        <p className={styles.postExcerpt}>
          Thursday tea, and how it changed the way we work.The Coursetexts
          Review is a blog on successful self-learning, educational interfaces.
        </p>

        <div className={styles.authorRow}>
          <img
            src='/images/home/blog-author-avatar.png'
            alt=''
            aria-hidden='true'
            className={styles.authorImage}
          />
          <p className={styles.authorName}>Coursetexts Engineering Team</p>
        </div>
      </div>
    </section>
  )
}
