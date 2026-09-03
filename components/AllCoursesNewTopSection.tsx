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

function TitleChevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`${styles.headingChevron}${
        open ? ` ${styles.headingChevronOpen}` : ''
      }`}
      width='14'
      height='14'
      viewBox='0 0 12 12'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      aria-hidden='true'
    >
      <path
        d='M2.25 4.125L6 7.875L9.75 4.125'
        stroke='currentColor'
        strokeWidth='1.4'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

function CatalogViewSelect({
  view,
  onViewChange
}: {
  view: AllCoursesView
  onViewChange: (view: AllCoursesView) => void
}) {
  const rootRef = React.useRef<HTMLDivElement>(null)
  const [open, setOpen] = React.useState(false)
  const label = ALL_COURSES_VIEW_LABELS[view]

  const close = React.useCallback(() => setOpen(false), [])

  React.useEffect(() => {
    if (!open) return

    function onPointer(event: MouseEvent) {
      const target = event.target as Node
      if (rootRef.current?.contains(target)) return
      setOpen(false)
    }

    function onKey(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      event.stopPropagation()
      event.preventDefault()
      close()
    }

    document.addEventListener('mousedown', onPointer)
    window.addEventListener('keydown', onKey, true)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      window.removeEventListener('keydown', onKey, true)
    }
  }, [close, open])

  function selectView(next: AllCoursesView) {
    onViewChange(next)
    close()
  }

  function onTriggerKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      setOpen(true)
      return
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      setOpen((prev) => !prev)
    }
  }

  return (
    <div className={styles.headingWrap} ref={rootRef}>
      <h1 className={styles.heading}>
        <button
          type='button'
          className={styles.headingButton}
          aria-haspopup='listbox'
          aria-expanded={open}
          aria-label={`${label}. Switch catalog`}
          onClick={() => setOpen((prev) => !prev)}
          onKeyDown={onTriggerKeyDown}
        >
          <span className={styles.headingLabel}>{label}</span>
          <TitleChevron open={open} />
        </button>
      </h1>
      {open ? (
        <div className={styles.headingMenu} role='listbox' aria-label='Catalog'>
          {ALL_COURSES_VIEWS.map((option) => {
            const selected = option === view
            return (
              <button
                key={option}
                type='button'
                role='option'
                aria-selected={selected}
                className={`${styles.headingOption}${
                  selected ? ` ${styles.headingOptionSelected}` : ''
                }`}
                onClick={() => selectView(option)}
              >
                {ALL_COURSES_VIEW_LABELS[option]}
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
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
        <CatalogViewSelect view={view} onViewChange={onViewChange} />
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

      {showPathFilters ? (
        <div className={`${styles.filtersRow} ${styles.pathFiltersRow}`}>
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
        </div>
      ) : null}

      {showCourseFilters ? (
        <div className={styles.filtersRow}>
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
        </div>
      ) : null}
    </section>
  )
}
