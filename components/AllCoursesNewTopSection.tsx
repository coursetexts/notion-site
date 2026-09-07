import * as React from 'react'
import Link from 'next/link'

import {
  LEARNING_PATH_TOPICS,
  type LearningPathTopicId
} from '@/lib/learning-path-topic'

import { LearningPathTopicIcon } from './LearningPathTopicIcon'
import styles from './AllCoursesNewTopSection.module.css'

const SUBJECTS = [
  { label: 'Science', icon: '/images/home/science.png' },
  { label: 'Math', icon: '/images/home/math.png' },
  { label: 'Sociology', icon: '/images/home/sociology.png' },
  { label: 'English', icon: '/images/home/english.png' }
]

const PARTNER_LINKS = [
  {
    label: 'Stanford',
    icon: '/images/home/stanford.png',
    href: '/all-courses?q=Stanford'
  },
  {
    label: 'Harvard',
    icon: '/images/home/harvard-red.png',
    href: '/all-courses?q=Harvard'
  },
  {
    label: 'Waterloo',
    icon: '/images/home/waterloo.png',
    href: '/all-courses?q=Waterloo'
  },
  {
    label: 'More schools',
    icon: '/images/home/plus-10.png',
    href: '/all-courses'
  }
]

export const ALL_COURSES_VIEWS = ['courses', 'learning-paths'] as const
export type AllCoursesView = (typeof ALL_COURSES_VIEWS)[number]

export const ALL_COURSES_VIEW_LABELS: Record<AllCoursesView, string> = {
  courses: 'All Academic Courses',
  'learning-paths': 'All Learning Paths'
}

export const ALL_COURSES_VIEW_FILTERS: Record<AllCoursesView, string> = {
  courses: 'Academic Courses',
  'learning-paths': 'Learning Paths'
}

type AllCoursesNewTopSectionProps = {
  query: string
  view: AllCoursesView
  activeSubjects: string[]
  activeTopic?: LearningPathTopicId | null
  onQueryChange: (value: string) => void
  onViewChange: (view: AllCoursesView) => void
  onSubjectToggle: (subject: string) => void
  onTopicToggle?: (topic: LearningPathTopicId) => void
  onSearchSubmit: () => void
}

export function AllCoursesNewTopSection({
  query,
  view,
  activeSubjects,
  activeTopic = null,
  onQueryChange,
  onViewChange,
  onSubjectToggle,
  onTopicToggle,
  onSearchSubmit
}: AllCoursesNewTopSectionProps) {
  const [isSearchPulse, setIsSearchPulse] = React.useState(false)
  const pulseTimeoutRef = React.useRef<number | null>(null)
  const submitFromButtonRef = React.useRef(false)
  const showCourseFilters = view === 'courses'
  const showPathFilters = view === 'learning-paths'

  React.useEffect(() => {
    return () => {
      if (pulseTimeoutRef.current !== null) {
        window.clearTimeout(pulseTimeoutRef.current)
      }
    }
  }, [])

  const triggerSearchPulse = React.useCallback(() => {
    setIsSearchPulse(false)

    window.requestAnimationFrame(() => {
      setIsSearchPulse(true)
    })

    if (pulseTimeoutRef.current !== null) {
      window.clearTimeout(pulseTimeoutRef.current)
    }

    pulseTimeoutRef.current = window.setTimeout(() => {
      setIsSearchPulse(false)
      pulseTimeoutRef.current = null
    }, 900)
  }, [])

  React.useEffect(() => {
    const form = document.getElementById('all-courses-search')
    if (!form) return

    const handleExternalPulse = () => triggerSearchPulse()
    form.addEventListener('ct:search-pulse', handleExternalPulse)

    return () => {
      form.removeEventListener('ct:search-pulse', handleExternalPulse)
    }
  }, [triggerSearchPulse])

  const markSearchButtonSubmit = React.useCallback(() => {
    submitFromButtonRef.current = true
  }, [])

  const handleSubmit = React.useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      const fromSearchButton = submitFromButtonRef.current
      submitFromButtonRef.current = false
      if (fromSearchButton) {
        triggerSearchPulse()
      }
      onSearchSubmit()
    },
    [onSearchSubmit, triggerSearchPulse]
  )

  return (
    <section className={styles.section}>
      <div className={styles.headingRow}>
        <h1 className={styles.heading}>{ALL_COURSES_VIEW_LABELS[view]}</h1>
      </div>

      <form
        id='all-courses-search'
        className={`${styles.searchWrap} ${
          isSearchPulse ? styles.searchWrapPulse : ''
        }`}
        onSubmit={handleSubmit}
        role='search'
      >
        <input
          type='text'
          className={styles.input}
          placeholder='What do you want to learn?'
          aria-label='What are you curious about?'
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
        />
        <button
          type='submit'
          className={styles.button}
          onClick={markSearchButtonSubmit}
        >
          Search
        </button>
      </form>

      <div
        className={`${styles.filtersRow}${
          showPathFilters ? ` ${styles.pathFiltersRow}` : ''
        }`}
      >
        <div
          className={styles.catalogRow}
          role='radiogroup'
          aria-label='Catalog type'
        >
          {ALL_COURSES_VIEWS.map((option, index) => {
            const selected = option === view

            return (
              <React.Fragment key={option}>
                {index > 0 ? (
                  <span className={styles.catalogDivider} aria-hidden='true'>
                    |
                  </span>
                ) : null}
                <button
                  type='button'
                  role='radio'
                  aria-checked={selected}
                  className={`${styles.catalogLink}${
                    selected ? ` ${styles.catalogLinkSelected}` : ''
                  }`}
                  onClick={() => onViewChange(option)}
                >
                  {ALL_COURSES_VIEW_FILTERS[option]}
                </button>
              </React.Fragment>
            )
          })}
        </div>

        {showPathFilters ? (
          <div className={styles.subjectRow}>
            {LEARNING_PATH_TOPICS.map((topic) => (
              <button
                key={topic.id}
                type='button'
                className={`${styles.subjectItem} ${
                  activeTopic === topic.id ? styles.subjectItemActive : ''
                }`}
                onClick={() => onTopicToggle?.(topic.id)}
                aria-pressed={activeTopic === topic.id}
              >
                <span className={styles.subjectIconWrap}>
                  <LearningPathTopicIcon
                    id={topic.id}
                    className={styles.topicIcon}
                  />
                </span>
                <span className={styles.subjectLabel}>{topic.label}</span>
              </button>
            ))}
          </div>
        ) : null}

        {showCourseFilters ? (
          <>
            <div className={styles.subjectRow}>
              {SUBJECTS.map((subject) => (
                <button
                  key={subject.label}
                  type='button'
                  className={`${styles.subjectItem} ${
                    activeSubjects.includes(subject.label)
                      ? styles.subjectItemActive
                      : ''
                  }`}
                  onClick={() => onSubjectToggle(subject.label)}
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

            <div className={styles.logoRow} aria-label='Partner schools'>
              {PARTNER_LINKS.map((partner) => (
                <Link key={partner.label} href={partner.href} legacyBehavior>
                  <a className={styles.logoCircle} title={partner.label}>
                    <img
                      src={partner.icon}
                      alt={partner.label}
                      className={
                        partner.label === 'More schools'
                          ? styles.logoPlusImage
                          : styles.logoImage
                      }
                    />
                  </a>
                </Link>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </section>
  )
}
