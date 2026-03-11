import * as React from 'react'

import { CourseCardGrid, type HomeCourseCard } from './HomeCoursesSection'
import styles from './AllCoursesNewGridSection.module.css'

type AllCoursesNewGridSectionProps = {
  courses?: HomeCourseCard[]
}

function fallbackCards(): HomeCourseCard[] {
  return Array.from({ length: 14 }).map((_, index) => ({
    id: `fallback-${index + 1}`,
    href: '/',
    meta: 'Harvard / Spring 2024',
    title: 'Global & Visual Digital Culture',
    description:
      'Investigate digital media as a convergence-point where technical-systems, economic-imperatives, and power-structures collide'
  }))
}

export function AllCoursesNewGridSection({ courses }: AllCoursesNewGridSectionProps) {
  const cards = courses ?? fallbackCards()

  return (
    <section className={styles.section}>
      <div className={styles.content}>
        <CourseCardGrid
          cards={cards}
          emptyMessage='No courses matched your search.'
          descriptionWidth='75%'
        />

        <div className={styles.disclaimerRule} />

        <p className={styles.disclaimerText}>
          Coursetexts has neither sought nor received permission from any
          university to open-source courses that were taught at that university.
          It is not affiliated with, sponsored by, or endorsed by any
          university.
        </p>
      </div>
    </section>
  )
}
