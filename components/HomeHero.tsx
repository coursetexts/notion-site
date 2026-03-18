import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'

import styles from './HomeHero.module.css'

const subjects = ['Science', 'Math', 'Sociology', 'English']

const partnerLinks = [
  {
    label: 'Stanford',
    icon: '/images/home/stanford.png',
    href: '/all-courses?q=Stanford'
  },
  {
    label: 'Waterloo',
    icon: '/images/home/waterloo.png',
    href: '/all-courses?q=Waterloo'
  },
  {
    label: 'Harvard',
    icon: '/images/home/harvard-red.png',
    href: '/all-courses?q=Harvard'
  },
  {
    label: 'More schools',
    icon: '/images/home/plus-10.png',
    href: '/all-courses'
  }
]

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
        <h1 className={styles.title}>The library for learners</h1>

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

          <div className={styles.logoRow} aria-label='Partner schools'>
            {partnerLinks.map((partner) => (
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
      </div>
    </section>
  )
}
