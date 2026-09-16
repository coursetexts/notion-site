import * as React from 'react'
import { useRouter } from 'next/router'

import { HomeDotGrid } from '@/components/HomeDotGrid'
import type { HomeCourseCard } from '@/components/HomeCoursesSection'

import styles from './CoursesHomeHero.module.css'

const SUBJECTS = [
  { label: 'Science', icon: '/images/home/science.png' },
  { label: 'Math', icon: '/images/home/math.png' },
  { label: 'Sociology', icon: '/images/home/sociology.png' },
  { label: 'English', icon: '/images/home/english.png' }
] as const

const LUCKY_QUERIES = [
  'linear algebra',
  'organic chemistry',
  'microeconomics',
  'machine learning',
  'philosophy of mind',
  'cell biology',
  'thermodynamics',
  'constitutional law'
]

function SearchFieldIcon() {
  return (
    <svg
      aria-hidden='true'
      width='18'
      height='18'
      viewBox='0 0 18 18'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      <circle cx='8' cy='8' r='5.25' stroke='currentColor' strokeWidth='1.5' />
      <path
        d='M12.25 12.25L15.5 15.5'
        stroke='currentColor'
        strokeWidth='1.5'
        strokeLinecap='round'
      />
    </svg>
  )
}

type CoursesHomeHeroProps = {
  courses?: HomeCourseCard[]
}

export function CoursesHomeHero({ courses = [] }: CoursesHomeHeroProps) {
  const router = useRouter()
  const [query, setQuery] = React.useState('')
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

  const goToCatalog = React.useCallback(
    (nextQuery?: string) => {
      const params = new URLSearchParams()
      const q = (nextQuery ?? query).trim()
      if (q) params.set('q', q)
      const href = params.toString()
        ? `/all-courses?${params.toString()}`
        : '/all-courses'
      void router.push(href)
    },
    [query, router]
  )

  const handleSubmit = React.useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      const fromSearchButton = submitFromButtonRef.current
      submitFromButtonRef.current = false

      const navigate = () => goToCatalog()

      if (fromSearchButton) {
        triggerSearchPulse()
        window.setTimeout(navigate, 180)
        return
      }
      navigate()
    },
    [goToCatalog, triggerSearchPulse]
  )

  const handleFeelingLucky = React.useCallback(() => {
    const pick =
      LUCKY_QUERIES[Math.floor(Math.random() * LUCKY_QUERIES.length)] ??
      'machine learning'
    setQuery(pick)
    goToCatalog(pick)
  }, [goToCatalog])

  return (
    <>
      <HomeDotGrid courses={courses} hideDisclaimer compactTop />

      <section className={styles.heroWrapper}>
        <div className={styles.heroContent}>
          <h1 className={styles.title}>
            Coursetexts is an open library of <br></br>advanced course readings.
          </h1>

          <p className={styles.description}>
            Coursetexts is a registered 501(c)(3) non-profit doing open research
            on self-learning, educational interfaces, and scaling open source
            software.
          </p>

          <form
            id='home-search'
            className={`${styles.searchWrap}${
              isSearchPulse ? ` ${styles.searchWrapPulse}` : ''
            }`}
            onSubmit={handleSubmit}
          >
            <span className={styles.searchIcon} aria-hidden>
              <SearchFieldIcon />
            </span>
            <input
              className={styles.searchInput}
              type='search'
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder='What are you curious about?'
              aria-label='Search courses'
            />
            <button
              type='submit'
              className={styles.searchButton}
              onPointerDown={() => {
                submitFromButtonRef.current = true
              }}
            >
              Search
            </button>
          </form>

          <div className={styles.subjectRow}>
            {SUBJECTS.map((subject) => (
              <button
                key={subject.label}
                type='button'
                className={styles.subjectChip}
                onClick={() => goToCatalog(subject.label)}
              >
                <img
                  src={subject.icon}
                  alt=''
                  className={styles.subjectIcon}
                  aria-hidden
                />
                <span>{subject.label}</span>
              </button>
            ))}
          </div>

          <button
            type='button'
            className={styles.luckyBtn}
            onClick={handleFeelingLucky}
          >
            <img
              src='/images/home/heart.png'
              alt=''
              width={18}
              height={18}
              aria-hidden
            />
            <span>I&apos;m Feeling Lucky</span>
          </button>

          <p className={styles.legal}>
            Coursetexts has neither sought nor received permission from any
            university to open-source courses that were taught at that
            university. It is not affiliated with, sponsored by, or endorsed by
            any university.
          </p>
        </div>
      </section>
    </>
  )
}
