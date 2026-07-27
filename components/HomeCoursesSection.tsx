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

function HomeCourseCardItem({
  course,
  descriptionWidth
}: {
  course: HomeCourseCard
  descriptionWidth?: React.CSSProperties['width']
}) {
  const schoolLogo = getSchoolLogoForMeta(course.meta)

  const descriptionStyle: React.CSSProperties = descriptionWidth
    ? { width: descriptionWidth, maxWidth: '100%' }
    : { maxWidth: '100%' }

  return (
    <Link href={course.href} legacyBehavior>
      <a className={styles.courseCardLink}>
        <article className={styles.courseCard}>
          <div className={styles.courseMetaRow}>
            {schoolLogo ? (
              <span className={styles.schoolLogoWrap}>
                <img
                  src={schoolLogo.src}
                  alt={schoolLogo.alt}
                  className={styles.schoolLogo}
                />
              </span>
            ) : null}
            <span
              className={`${styles.courseMetaText} ${
                schoolLogo ? '' : styles.courseMetaTextWithoutLogo
              }`}
            >
              {course.meta}
            </span>
          </div>

          <h3
            className={`${styles.courseTitle} ${styles.courseTitleTruncated}`}
          >
            {course.title}
          </h3>

          <p
            className={`${styles.courseDescription} ${styles.courseDescriptionTruncated}`}
            style={descriptionStyle}
          >
            {course.description}
          </p>
        </article>
      </a>
    </Link>
  )
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
      {cards.map((course) => (
        <HomeCourseCardItem
          key={course.id}
          course={course}
          descriptionWidth={descriptionWidth}
        />
      ))}
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

  const topSchools = [
    {
      src: '/images/home/harvard-red.png',
      alt: 'Harvard University',
      query: 'Harvard'
    },
    {
      src: '/images/home/stanford.png',
      alt: 'Stanford University',
      query: 'Stanford'
    },
    {
      src: '/images/home/princeton.png',
      alt: 'Princeton University',
      query: 'Princeton'
    },
    { src: '/images/home/yale.png', alt: 'Yale University', query: 'Yale' },
    {
      src: '/images/home/columbia.png',
      alt: 'Columbia University',
      query: 'Columbia'
    },
    {
      src: '/images/home/waterloo.png',
      alt: 'University of Waterloo',
      query: 'Waterloo'
    }
  ]

  // Repeat the set so one half of the track (the scroll distance) always
  // exceeds the content column (≤1000px) even before logos load — otherwise a
  // blank gap appears at the end of each loop. 6 copies keeps it gap-free.
  const loopSchools = Array.from({ length: 6 }, () => topSchools).flat()

  const cards = courses ?? []

  return (
    <section className={styles.section}>
      <div className={styles.content}>
        <h2 className={styles.heading}>Try courses from top schools.</h2>

        <div
          className={styles.schoolsMarquee}
          aria-label='Featured top schools'
        >
          <div className={styles.schoolsTrack}>
            {loopSchools.map((school, index) => {
              const isDuplicate = index >= topSchools.length

              return (
                <Link
                  key={`${school.alt}-${index}`}
                  href={`/all-courses?q=${encodeURIComponent(school.query)}`}
                  legacyBehavior
                >
                  <a
                    className={styles.schoolLogoItem}
                    aria-label={
                      isDuplicate ? undefined : `Browse ${school.alt} courses`
                    }
                    aria-hidden={isDuplicate ? true : undefined}
                    tabIndex={isDuplicate ? -1 : undefined}
                  >
                    <img
                      src={school.src}
                      alt={isDuplicate ? '' : school.alt}
                      className={styles.schoolLogoImg}
                    />
                  </a>
                </Link>
              )
            })}
          </div>
        </div>

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
