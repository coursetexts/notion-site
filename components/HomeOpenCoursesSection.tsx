import * as React from 'react'
import Link from 'next/link'

import {
  CourseCardGrid,
  type HomeCourseCard
} from '@/components/HomeCoursesSection'

import courseStyles from './HomeCoursesSection.module.css'
import styles from './HomeOpenCoursesSection.module.css'

const SCHOOL_FILTERS = [
  {
    id: 'Stanford',
    label: 'Stanford University',
    icon: '/images/home/stanford.png'
  },
  {
    id: 'Harvard',
    label: 'Harvard University',
    icon: '/images/home/harvard-red.png'
  },
  {
    id: 'Yale',
    label: 'Yale University',
    icon: '/images/home/yale.png'
  },
  {
    id: 'Columbia',
    label: 'Columbia University',
    icon: '/images/home/columbia.png'
  },
  {
    id: 'Princeton',
    label: 'Princeton University',
    icon: '/images/home/princeton.png'
  }
] as const

const GRID_COUNT = 12

type HomeOpenCoursesSectionProps = {
  courses: HomeCourseCard[]
}

function courseMatchesSchool(course: HomeCourseCard, schoolId: string): boolean {
  const haystack = `${course.meta} ${course.title}`.toLowerCase()
  return haystack.includes(schoolId.toLowerCase())
}

export function HomeOpenCoursesSection({
  courses
}: HomeOpenCoursesSectionProps) {
  const [activeSchool, setActiveSchool] = React.useState<string | null>(null)

  const filtered = React.useMemo(() => {
    const list = activeSchool
      ? courses.filter((course) => courseMatchesSchool(course, activeSchool))
      : courses
    return list.slice(0, GRID_COUNT)
  }, [activeSchool, courses])

  return (
    <section className={styles.section}>
      <div className={styles.content}>
        <div className={styles.openCoursesContainer}> 
          <div className={styles.headingRow}>
            <h2 className={styles.heading}>
              Try open courses from top schools.
            </h2>
            <Link href='/all-courses' legacyBehavior>
              <a className={styles.viewAllBtn}>View All</a>
            </Link>
          </div>

          <div className={styles.schoolBox} role='list'>
            {SCHOOL_FILTERS.map((school) => {
              const selected = activeSchool === school.id
              return (
                <button
                  key={school.id}
                  type='button'
                  role='listitem'
                  className={`${styles.schoolChip}${
                    selected ? ` ${styles.schoolChipSelected}` : ''
                  }`}
                  aria-pressed={selected}
                  onClick={() =>
                    setActiveSchool((current) =>
                      current === school.id ? null : school.id
                    )
                  }
                >
                  <span className={styles.schoolIconWrap} aria-hidden>
                    <img
                      src={school.icon}
                      alt=''
                      className={styles.schoolIcon}
                    />
                  </span>
                  <span>{school.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        <CourseCardGrid
          className={styles.courseGridSpacious}
          cards={filtered}
          emptyMessage={
            activeSchool
              ? `No open courses from ${activeSchool} yet.`
              : 'No open courses available yet.'
          }
        />

        <div className={courseStyles.viewAllRow}>
          <div
            className={`${courseStyles.viewAllBar} ${courseStyles.viewAllBarEnd}`}
          >
            <Link href='/all-courses' legacyBehavior>
              <a
                className={courseStyles.viewAllBarLink}
                aria-label='View all courses'
              >
                <span className={courseStyles.viewAllText}>View All</span>
                <span
                  className={courseStyles.viewAllArrowBox}
                  aria-hidden='true'
                >
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

        <p className={styles.disclaimer}>
          Coursetexts is not affiliated with or endorsed by the universities
          listed.
        </p>
      </div>
    </section>
  )
}
