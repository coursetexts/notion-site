import * as React from 'react'
import Link from 'next/link'

import type { LearningPathTopicId } from '@/lib/learning-path-topic'

import styles from './HomeCoursesSection.module.css'
import { HomeLearningPathsSection } from './HomeLearningPathsSection'
import { HomeSocialLearningSection } from './HomeSocialLearningSection'
import { getSchoolLogoForMeta } from './courseSchoolLogo'
import { DegreeCardIcon } from './degreeCardIcons'

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
  /** Optional “7 concepts · 24 resources” line under the title. */
  statsLine?: string
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
  hideDescription?: boolean
  startSlot?: React.ReactNode
}

function HomeCourseCardItem({
  course,
  descriptionWidth,
  hideDescription = false
}: {
  course: HomeCourseCard
  descriptionWidth?: React.CSSProperties['width']
  hideDescription?: boolean
}) {
  const schoolLogo = getSchoolLogoForMeta(course.meta)

  const descriptionStyle: React.CSSProperties = descriptionWidth
    ? { width: descriptionWidth, maxWidth: '100%' }
    : { maxWidth: '100%' }

  return (
    <Link href={course.href} legacyBehavior>
      <a className={styles.courseCardLink}>
        <article
          className={`${styles.courseCard}${
            hideDescription ? ` ${styles.courseCardNoDescription}` : ''
          }`}
        >
          <div className={styles.courseMetaRow}>
            <span
              className={course.subjectDegreeId ? styles.logoStack : undefined}
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

          {course.statsLine ? (
            <p className={styles.courseStats}>{course.statsLine}</p>
          ) : null}

          {hideDescription ? null : (
            <p
              className={`${styles.courseDescription} ${styles.courseDescriptionTruncated}`}
              style={descriptionStyle}
            >
              {course.description}
            </p>
          )}
        </article>
      </a>
    </Link>
  )
}

export function CourseCardGrid({
  cards,
  emptyMessage,
  descriptionWidth,
  hideDescription = false,
  startSlot,
  className
}: CourseCardGridProps & { className?: string }) {
  if (cards.length === 0 && !startSlot) {
    return <p className={styles.emptyState}>{emptyMessage}</p>
  }

  return (
    <div
      className={
        className ? `${styles.courseGrid} ${className}` : styles.courseGrid
      }
    >
      {startSlot}
      {cards.map((course) => (
        <HomeCourseCardItem
          key={course.id}
          course={course}
          descriptionWidth={descriptionWidth}
          hideDescription={hideDescription}
        />
      ))}
    </div>
  )
}

type HomeCoursesSectionProps = {
  academicCourses?: HomeCourseCard[]
  activeSubjects?: string[]
  onSubjectToggle?: (subject: string) => void
  onTopicToggle?: (topic: LearningPathTopicId) => void
  activeTopic?: LearningPathTopicId | null
}

export function HomeCoursesSection({
  academicCourses = [],
  activeSubjects = [],
  onSubjectToggle,
  onTopicToggle,
  activeTopic = null
}: HomeCoursesSectionProps) {
  return (
    <section className={styles.section}>
      <div className={styles.content}>
        <HomeLearningPathsSection
          academicCourses={academicCourses}
          activeSubjects={activeSubjects}
          onSubjectToggle={onSubjectToggle}
          onTopicToggle={onTopicToggle}
          activeTopic={activeTopic}
        />
      </div>

      <HomeSocialLearningSection />
    </section>
  )
}
