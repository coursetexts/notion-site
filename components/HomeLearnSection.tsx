import * as React from 'react'
import Link from 'next/link'

import styles from './HomeLearnSection.module.css'

export function HomeLearnSection() {
  const categories = [
    {
      title: 'Self Learning',
      image: '/images/home/category-self-learning.png',
      href: '/all-courses?q=Self+Learning'
    },
    {
      title: 'Language Learning',
      image: '/images/home/category-language-learning.png',
      href: '/all-courses?q=Language+Learning'
    },
    {
      title: 'Computer Science',
      image: '/images/home/category-computer-science.png',
      href: '/all-courses?q=Computer+Science'
    },
    {
      title: 'Visual Culture',
      image: '/images/home/category-visual-culture.png',
      href: '/all-courses?q=Visual+Culture'
    },
    {
      title: 'Mathematics',
      image: '/images/home/category-mathematics.png',
      href: '/all-courses?q=Mathematics'
    }
  ]

  return (
    <section className={styles.section}>
      <div className={styles.content}>
        <div className={styles.imageWrap}>
          <img
            src='/images/home/learn-something.png'
            alt=''
            className={styles.image}
          />
        </div>
        <h2 className={styles.heading}>Learn something new today</h2>

        <div className={styles.categoryGrid}>
          {categories.map((category, index) => (
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
                        <h3 className={styles.categoryTitle}>{category.title}</h3>
                        {index === 0 && (
                          <span className={styles.newBadge}>
                            <span className={styles.newBadgeText}>NEW</span>
                          </span>
                        )}
                      </div>
                      <p className={styles.categoryCount}>11 Courses</p>
                    </div>
                  </article>
                </a>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
