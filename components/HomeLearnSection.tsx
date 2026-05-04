import * as React from 'react'
import Link from 'next/link'

import styles from './HomeLearnSection.module.css'

export function HomeLearnSection() {
  const categories = [
    {
      title: 'Harvard University',
      image: '/images/home/learn-something-new-harvard.png',
      href: '/all-courses?q=Harvard',
      showNew: true
    },
    {
      title: 'Language Learning',
      image: '/images/home/category-language-learning.png',
      href: '/all-courses?q=Language+Learning',
      showNew: false
    },
    {
      title: 'Computer Science',
      image: '/images/home/category-computer-science.png',
      href: '/all-courses?q=Computer+Science',
      showNew: false
    },
    {
      title: 'Visual Culture',
      image: '/images/home/category-visual-culture.png',
      href: '/all-courses?q=Visual+Culture',
      showNew: false
    },
    {
      title: 'Mathematics',
      image: '/images/home/category-mathematics.png',
      href: '/all-courses?q=Mathematics',
      showNew: false
    }
  ]

  return (
    <section className={styles.section}>
      <div className={styles.content}>
        <h2 className={styles.heading}>Learn something new today</h2>

        <div className={styles.learnRow}>
          <div className={styles.learnLeft}>
            <div className={styles.categoryList}>
              {categories.map((category) => (
                <div key={category.title} className={styles.categoryCardSlot}>
                  <Link href={category.href} legacyBehavior>
                    <a className={styles.categoryCardLink}>
                      <article className={styles.categoryCard}>
                        <img
                          src={category.image}
                          alt=''
                          className={styles.categoryImage}
                        />

                        <div className={styles.categoryTextWrap}>
                          <div className={styles.categoryTitleRow}>
                            <h3 className={styles.categoryTitle}>
                              {category.title}
                            </h3>
                            {category.showNew && (
                              <span className={styles.newBadge}>
                                <span className={styles.newBadgeText}>
                                  NEW
                                </span>
                              </span>
                            )}
                          </div>
                        </div>
                      </article>
                    </a>
                  </Link>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.learnRight}>
            <div className={styles.previewFrame}>
              <img
                src='/images/home/learn-something-new-class-image.png'
                alt='Course reader preview showing table of contents and lesson content'
                className={styles.previewImage}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
