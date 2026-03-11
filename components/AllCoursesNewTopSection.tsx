import * as React from 'react'
import Link from 'next/link'

import styles from './AllCoursesNewTopSection.module.css'

const SUBJECTS = [
  { label: 'Science', icon: '/images/home/science.png' },
  { label: 'Math', icon: '/images/home/math.png' },
  { label: 'Sociology', icon: '/images/home/sociology.png' },
  { label: 'English', icon: '/images/home/english.png' }
]

const PARTNER_LINKS = [
  { label: 'Stanford', icon: '/images/home/stanford.png', href: '/all-courses?q=Stanford' },
  { label: 'Harvard', icon: '/images/home/harvard-red.png', href: '/all-courses?q=Harvard' },
  { label: 'Waterloo', icon: '/images/home/waterloo.png', href: '/all-courses?q=Waterloo' },
  { label: 'More schools', icon: '/images/home/plus-10.png', href: '/all-courses' }
]

type AllCoursesNewTopSectionProps = {
  query: string
  activeSubjects: string[]
  onQueryChange: (value: string) => void
  onSubjectToggle: (subject: string) => void
  onSearchSubmit: () => void
}

export function AllCoursesNewTopSection({
  query,
  activeSubjects,
  onQueryChange,
  onSubjectToggle,
  onSearchSubmit
}: AllCoursesNewTopSectionProps) {
  const [isSearchPulse, setIsSearchPulse] = React.useState(false)
  const pulseTimeoutRef = React.useRef<number | null>(null)
  const submitFromButtonRef = React.useRef(false)

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
      <h1 className={styles.heading}>All Courses</h1>

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
          placeholder='What are you curious about?'
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

      <div className={styles.filtersRow}>
        <div className={styles.subjectRow}>
          {SUBJECTS.map((subject) => (
            <button
              key={subject.label}
              type='button'
              className={`${styles.subjectItem} ${
                activeSubjects.includes(subject.label) ? styles.subjectItemActive : ''
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
    </section>
  )
}
