import * as React from 'react'

import styles from './AllCoursesNewGridSection.module.css'
import { CourseCardGrid, type HomeCourseCard } from './HomeCoursesSection'

type AllCoursesNewGridSectionProps = {
  courses?: HomeCourseCard[]
}

export function AllCoursesNewGridSection({
  courses
}: AllCoursesNewGridSectionProps) {
  const cards = courses ?? []

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
