import * as React from 'react'
import Link from 'next/link'

import styles from './HomeCoursesSection.module.css'
import { getSchoolLogoForMeta } from './courseSchoolLogo'

export type HomeCourseCard = {
  id: string
  href: string
  meta: string
  title: string
  description: string
  subjects?: string[]
}

type CourseCardGridProps = {
  cards: HomeCourseCard[]
  emptyMessage: string
  descriptionWidth?: React.CSSProperties['width']
}

export function CourseCardGrid({
  cards,
  emptyMessage,
  descriptionWidth
}: CourseCardGridProps) {
  if (cards.length === 0) {
    return <p className={styles.emptyState}>{emptyMessage}</p>
  }

  return (
    <div className={styles.courseGrid}>
      {cards.map((course) => {
        const schoolLogo = getSchoolLogoForMeta(course.meta)

        return (
          <Link key={course.id} href={course.href} legacyBehavior>
            <a className={styles.courseCardLink}>
              <article className={styles.courseCard}>
                <div className={styles.courseMetaRow}>
                  <span className={styles.schoolLogoWrap}>
                    <img
                      src={schoolLogo.src}
                      alt={schoolLogo.alt}
                      className={styles.schoolLogo}
                    />
                  </span>
                  <span className={styles.courseMetaText}>{course.meta}</span>
                </div>

                <h3 className={styles.courseTitle}>{course.title}</h3>

                <p
                  className={styles.courseDescription}
                  style={
                    descriptionWidth ? { width: descriptionWidth } : undefined
                  }
                >
                  {course.description}
                </p>
              </article>
            </a>
          </Link>
        )
      })}
    </div>
  )
}

type HomeCoursesSectionProps = {
  courses?: HomeCourseCard[]
  activeSubjects?: string[]
  onSubjectToggle?: (subject: string) => void
}

export function HomeCoursesSection({
  courses,
  activeSubjects = [],
  onSubjectToggle
}: HomeCoursesSectionProps) {
  const subjects = [
    { label: 'Science', icon: '/images/home/science.png' },
    { label: 'Math', icon: '/images/home/math.png' },
    {
      label: 'Sociology',
      icon: '/images/home/sociology.png'
    },
    { label: 'English', icon: '/images/home/english.png' }
  ]

  const cards = courses
    ? courses.slice(0, 8)
    : Array.from({ length: 8 }).map((_, index) => ({
        id: `fallback-${index + 1}`,
        href: '/',
        meta: 'Harvard / Fall 2024',
        title: 'Global & Visual Digital Culture',
        description:
          'Investigate digital media as a convergence-point where technical-systems, economic-imperatives, and power-structures collide'
      }))

  return (
    <section className={styles.section}>
      <div className={styles.content}>
        <h2 className={styles.heading}>Try courses from top schools.</h2>

        <div className={styles.subjectGroup}>
          <div className={styles.dashedRule} />

          <div className={styles.subjectRow}>
            {subjects.map((subject) => (
              <button
                key={subject.label}
                type='button'
                className={`${styles.subjectItem} ${
                  activeSubjects.includes(subject.label)
                    ? styles.subjectItemActive
                    : ''
                }`}
                onClick={() => onSubjectToggle?.(subject.label)}
                aria-pressed={activeSubjects.includes(subject.label)}
              >
                <span className={styles.subjectIconWrap}>
                  <img
                    src={subject.icon}
                    alt=''
                    className={styles.subjectIcon}
                    aria-hidden='true'
                  />
                </span>
                <span className={styles.subjectLabel}>{subject.label}</span>
              </button>
            ))}
          </div>

          <div className={styles.dashedRule} />
        </div>

        <CourseCardGrid
          cards={cards}
          emptyMessage='No courses matched those subjects yet.'
        />

        <div className={styles.viewAllBar}>
          <Link href='/all-courses' legacyBehavior>
            <a className={styles.viewAllBarLink} aria-label='View all courses'>
              <span className={styles.viewAllText}>View All</span>
              <span className={styles.viewAllArrowBox} aria-hidden='true'>
                <svg
                  width='14'
                  height='14'
                  viewBox='0 0 14 14'
                  fill='none'
                  xmlns='http://www.w3.org/2000/svg'
                >
                  <path
                    d='M5.25 11.375L9.625 7L5.25 2.625'
                    stroke='#5D534B'
                    strokeWidth='1.60417'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                  />
                </svg>
              </span>
            </a>
          </Link>
        </div>
      </div>
    </section>
  )
}
