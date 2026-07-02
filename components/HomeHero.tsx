import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'

import styles from './HomeHero.module.css'

const subjects = ['Science', 'Math', 'Sociology', 'English']

const schoolLinks = [
  { label: 'Stanford', icon: '/images/home/stanford.png' },
  { label: 'Waterloo', icon: '/images/home/waterloo.png' },
  { label: 'Harvard', icon: '/images/home/harvard-red.png' },
  { label: 'Yale', icon: '/images/home/yale.png' },
  { label: 'Princeton', icon: '/images/home/princeton.png' },
  { label: 'Columbia', icon: '/images/home/columbia.png' }
].map((school) => ({
  ...school,
  href: `/all-courses?q=${school.label}`
}))

const moreSchoolsLink = {
  label: 'More schools',
  icon: '/images/home/plus-10.png',
  href: '/all-courses'
}

const VISIBLE_LOGO_COUNT = 3
const LOGO_ROTATE_MS = 2600

type HomeHeroProps = {
  activeSubjects?: string[]
  onSubjectToggle?: (subject: string) => void
}

export function HomeHero({
  activeSubjects = [],
  onSubjectToggle
}: HomeHeroProps) {
  const router = useRouter()
  const [query, setQuery] = React.useState('')
  const [isSearchPulse, setIsSearchPulse] = React.useState(false)
  const pulseTimeoutRef = React.useRef<number | null>(null)
  const submitFromButtonRef = React.useRef(false)
  const [logoOffset, setLogoOffset] = React.useState(0)
  const [logosPaused, setLogosPaused] = React.useState(false)

  // Circle the top-school logos through the visible slots. Paused on hover
  // and skipped entirely when the user prefers reduced motion.
  React.useEffect(() => {
    if (logosPaused) return
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return
    }
    const id = window.setInterval(
      () => setLogoOffset((o) => (o + 1) % schoolLinks.length),
      LOGO_ROTATE_MS
    )
    return () => window.clearInterval(id)
  }, [logosPaused])

  const visibleSchools = Array.from(
    { length: VISIBLE_LOGO_COUNT },
    (_, i) => schoolLinks[(logoOffset + i) % schoolLinks.length]
  )

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
    const form = document.getElementById('home-search')
    if (!form) return

    const handleExternalPulse = () => triggerSearchPulse()
    form.addEventListener('ct:search-pulse', handleExternalPulse)

    return () => {
      form.removeEventListener('ct:search-pulse', handleExternalPulse)
    }
  }, [triggerSearchPulse])

  const markSearchButtonPointerSubmit = React.useCallback(() => {
    submitFromButtonRef.current = true
  }, [])

  const handleSubmit = React.useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      const fromSearchButton = submitFromButtonRef.current
      submitFromButtonRef.current = false

      const params = new URLSearchParams()

      if (query.trim()) {
        params.set('q', query.trim())
      }

      if (activeSubjects.length) {
        params.set('subjects', activeSubjects.join(','))
      }

      const href = params.toString()
        ? `/all-courses?${params.toString()}`
        : '/all-courses'

      const navigate = () => {
        void router.push(href)
      }

      if (fromSearchButton) {
        triggerSearchPulse()
        window.setTimeout(navigate, 180)
        return
      }

      navigate()
    },
    [activeSubjects, query, router, triggerSearchPulse]
  )

  return (
    <section className={styles.heroWrapper}>
      <div className={styles.heroContent}>
        <h1 className={styles.title}>
          The <span className={styles.titleFree}>free</span> library for
          learners
        </h1>

        <p className={styles.description}>
          Coursetexts is a registered 501(c)(3) non-profit doing open research
          on self-learning, educational interfaces, and scaling open source
          software.
        </p>

        <form
          id='home-search'
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
            onChange={(event) => setQuery(event.target.value)}
          />
          <button
            type='submit'
            className={styles.button}
            onPointerDown={markSearchButtonPointerSubmit}
          >
            Search
          </button>
        </form>

        <div className={styles.frameBelow}>
          <div className={styles.chipRow}>
            {subjects.map((subject) => {
              const isActive = activeSubjects.includes(subject)

              return (
                <button
                  key={subject}
                  type='button'
                  className={`${styles.chip} ${
                    isActive ? styles.chipSelected : ''
                  }`}
                  aria-pressed={isActive}
                  onClick={() => onSubjectToggle?.(subject)}
                >
                  {subject}
                </button>
              )
            })}
          </div>

          <div
            className={styles.logoRow}
            aria-label='Partner schools'
            onMouseEnter={() => setLogosPaused(true)}
            onMouseLeave={() => setLogosPaused(false)}
          >
            {visibleSchools.map((school, slot) => (
              <Link key={slot} href={school.href} legacyBehavior>
                <a className={styles.logoCircle} title={school.label}>
                  <img
                    key={school.label}
                    src={school.icon}
                    alt={school.label}
                    className={styles.logoImage}
                  />
                </a>
              </Link>
            ))}
            <Link href={moreSchoolsLink.href} legacyBehavior>
              <a className={styles.logoCircle} title={moreSchoolsLink.label}>
                <img
                  src={moreSchoolsLink.icon}
                  alt={moreSchoolsLink.label}
                  className={styles.logoPlusImage}
                />
              </a>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
