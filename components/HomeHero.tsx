import * as React from 'react'
import { useRouter } from 'next/router'

import {
  LEARNING_PATH_TOPICS,
  type LearningPathTopicId
} from '@/lib/learning-path-topic'

import styles from './HomeHero.module.css'

const subjects = ['Science', 'Math', 'Sociology', 'English']

type HeroChip =
  | { kind: 'subject'; id: string; label: string }
  | { kind: 'topic'; id: LearningPathTopicId; label: string }

const heroChips: HeroChip[] = [
  ...subjects.map((subject) => ({
    kind: 'subject' as const,
    id: subject,
    label: subject
  })),
  ...LEARNING_PATH_TOPICS.map((topic) => ({
    kind: 'topic' as const,
    id: topic.id,
    label: topic.label
  }))
]

type HomeHeroProps = {
  activeTopic?: LearningPathTopicId | null
  onTopicToggle?: (topic: LearningPathTopicId) => void
}

export function HomeHero({
  activeTopic = null,
  onTopicToggle
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
      params.set('view', 'all')

      if (query.trim()) {
        params.set('q', query.trim())
      }

      const href = `/paths/all-courses?${params.toString()}`

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
    [query, router, triggerSearchPulse]
  )

  const openCatalogSearch = React.useCallback(
    (term: string) => {
      const params = new URLSearchParams()
      params.set('view', 'all')
      params.set('q', term)
      void router.push(`/paths/all-courses?${params.toString()}`)
    },
    [router]
  )

  const renderChip = React.useCallback(
    (chip: HeroChip, keySuffix: string) => {
      const isActive = chip.kind === 'topic' && activeTopic === chip.id

      return (
        <button
          key={`${chip.kind}-${chip.id}-${keySuffix}`}
          type='button'
          className={`${styles.chip} ${isActive ? styles.chipSelected : ''}`}
          aria-pressed={chip.kind === 'topic' ? isActive : undefined}
          onClick={() => {
            if (chip.kind === 'subject') {
              openCatalogSearch(chip.label)
              return
            }

            onTopicToggle?.(chip.id)
          }}
          tabIndex={keySuffix === 'b' ? -1 : undefined}
        >
          {chip.label}
        </button>
      )
    },
    [activeTopic, onTopicToggle, openCatalogSearch]
  )

  const renderChipRow = React.useCallback(
    (keySuffix: string, ariaHidden = false) => (
      <div
        className={styles.chipRow}
        aria-hidden={ariaHidden ? true : undefined}
      >
        {heroChips.map((chip) => renderChip(chip, keySuffix))}
      </div>
    ),
    [renderChip]
  )

  return (
    <section className={styles.heroWrapper}>
      <div className={styles.heroContent}>
        <h1 className={styles.title}>
          Learn independently,{' '}
          <br className={styles.titleBreak} />
          <span className={styles.titleFree}>not</span> alone
        </h1>

        <p className={styles.description}>
        {/* learning paths with the concepts, resources, and structure you need to finish what you set out to learn. */}
          Paths for self-learners — concepts, resources, and structure <br />to help you actually finish what you set out to learn.
          {/* High-quality materials, structure and community to help you <br />actually finish what you set to learn. */}
          {/* or set out to do ?*/}
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
            placeholder='What do you want to learn?'
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
          <div className={styles.chipMarquee}>
            <div className={styles.chipMarqueeTrack}>
              {renderChipRow('a')}
              {renderChipRow('b', true)}
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}
