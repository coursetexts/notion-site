import * as React from 'react'
import Link from 'next/link'

import styles from './HomeCoursesSection.module.css'
import { HomeLearningPathsSection } from './HomeLearningPathsSection'
import { HomeSocialLearningSection } from './HomeSocialLearningSection'
import { DegreeCardIcon } from './degreeCardIcons'
import { getSchoolLogoForMeta } from './courseSchoolLogo'

export type HomeCourseCard = {
  id: string
  href: string
  meta: string
  title: string
  description: string
  subjects?: string[]
  /** Degrees-page icon key (`DegreeCardIcon`) for course learning path cards. */
  subjectDegreeId?: string
  /** Graph mark used for community / research learning path cards. */
  communityMark?: boolean
}

function CommunityPathMark() {
  return (
    <span className={styles.communityMark} aria-hidden>
      <svg
        width='12'
        height='12'
        viewBox='0 0 12 12'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
      >
        <circle cx='3' cy='8' r='1.15' fill='currentColor' />
        <circle cx='6' cy='3.2' r='1.15' fill='currentColor' />
        <circle cx='9' cy='7.4' r='1.15' fill='currentColor' />
        <path
          d='M3.6 7.15L5.4 4.05M6.55 4.05L8.45 6.45'
          stroke='currentColor'
          strokeWidth='0.9'
          strokeLinecap='round'
        />
      </svg>
    </span>
  )
}

type CourseCardGridProps = {
  cards: HomeCourseCard[]
  emptyMessage: string
  descriptionWidth?: React.CSSProperties['width']
  startSlot?: React.ReactNode
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
            <span
              className={
                course.subjectDegreeId ? styles.logoStack : undefined
              }
            >
              <span className={styles.schoolLogoWrap}>
                {course.communityMark ? (
                  <CommunityPathMark />
                ) : (
                  <img
                    src={schoolLogo.src}
                    alt={schoolLogo.alt}
                    className={styles.schoolLogo}
                  />
                )}
              </span>
              {course.subjectDegreeId ? (
                <DegreeCardIcon
                  degreeId={course.subjectDegreeId}
                  className={styles.subjectIcon}
                  iconClassName={styles.subjectIconSvg}
                />
              ) : null}
            </span>
            <span className={styles.courseMetaText}>{course.meta}</span>
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
  descriptionWidth,
  startSlot
}: CourseCardGridProps) {
  if (cards.length === 0 && !startSlot) {
    return <p className={styles.emptyState}>{emptyMessage}</p>
  }

  return (
    <div className={styles.courseGrid}>
      {startSlot}
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

  const cards =
    courses == null
      ? Array.from({ length: 12 }).map((_, index) => ({
          id: `fallback-${index + 1}`,
          href: '/',
          meta: 'Harvard / Fall 2024',
          title: 'Global & Visual Digital Culture',
          description:
            'Investigate digital media as a convergence-point where technical-systems, economic-imperatives, and power-structures collide'
        }))
      : courses

  return (
    <section className={styles.section}>
      <div className={styles.content}>
        <h2 className={styles.heading}>Try courses from top schools.</h2>
        <p className={styles.headingSub}>
          We work directly with professors to bring niche, hard-to-find graduate
          courses online through our{' '}
          <a
            href='https://blog.coursetexts.org/automating-copyright-compliance-for-open-courseware'
            target='_blank'
            rel='noreferrer'
            className={styles.headingSubLink}
          >
            publishing pipeline
          </a>
          .  We want to open source courses across every major unverisity. It's opensource, compliant and really fast!
        </p>

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

      <div className={`${styles.content} ${styles.contentBottom}`}>
        <HomeLearningPathsSection />
      </div>

      <HomeSocialLearningSection />
    </section>
  )
}
