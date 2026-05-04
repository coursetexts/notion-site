import * as React from 'react'

import styles from './HomeBlogSection.module.css'

export function HomeBlogSection() {
  const blogPostUrl =
    'https://blog.coursetexts.org/automating-copyright-compliance-for-open-courseware'

  return (
    <section className={styles.section}>
      <div className={styles.content}>
        <h2 className={styles.heading}>Fresh from the Blog</h2>

        <div className={styles.featureRow}>
          <a
            href={blogPostUrl}
            className={styles.featureImageFrame}
            target='_blank'
            rel='noreferrer'
          >
            <img
              src='/images/home/fresh-from-blog-image.png'
              alt='Automating Copyright Compliance for Open Courseware'
              className={styles.featureImage}
            />
          </a>

          <div className={styles.featureCopy}>
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
              A 7-stage AI pipeline that turns a weeks-long legal workflow into
              a minutes-long process, with a human reviewer in the loop.
            </p>

            <div className={styles.authorRow}>
              <div className={styles.authorIconBadge} aria-hidden>
                <img
                  src='/coursetexts-book.svg'
                  alt=''
                  className={styles.authorBookIcon}
                />
              </div>
              <p className={styles.authorName}>Coursetexts Engineering Team</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
