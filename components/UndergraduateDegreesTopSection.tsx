import * as React from 'react'

import styles from './UndergraduateDegreesTopSection.module.css'

export type DegreeLevel = 'undergraduate' | 'graduate'

const LEVEL_LABELS: Record<DegreeLevel, string> = {
  undergraduate: 'Undergraduate Degrees',
  graduate: 'Graduate Degrees'
}

const LEVEL_OPTIONS: DegreeLevel[] = ['undergraduate', 'graduate']

const INTRO_COPY: Record<DegreeLevel, string> = {
  undergraduate:
    'Coursetexts curated curriculum for the top 50 most common undergraduate degrees. Helping self learners structure their learning, and linking out to world class resources.',
  graduate:
    'Coursetexts curated curriculum for the top 50 most common graduate degrees. Helping self learners structure their learning, and linking out to world class resources.'
}

function ChevronDownIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`${styles.levelChevron} ${open ? styles.levelChevronOpen : ''}`}
      width='12'
      height='12'
      viewBox='0 0 12 12'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      aria-hidden='true'
    >
      <path
        d='M2.25 4.125L6 7.875L9.75 4.125'
        stroke='currentColor'
        strokeWidth='1.25'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

type UndergraduateDegreesTopSectionProps = {
  level: DegreeLevel
  onLevelChange: (level: DegreeLevel) => void
  query: string
  onQueryChange: (value: string) => void
  onSearchSubmit: () => void
}

export function UndergraduateDegreesTopSection({
  level,
  onLevelChange,
  query,
  onQueryChange,
  onSearchSubmit
}: UndergraduateDegreesTopSectionProps) {
  const [isSearchPulse, setIsSearchPulse] = React.useState(false)
  const [levelMenuOpen, setLevelMenuOpen] = React.useState(false)
  const pulseTimeoutRef = React.useRef<number | null>(null)
  const submitFromButtonRef = React.useRef(false)
  const levelSelectRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    return () => {
      if (pulseTimeoutRef.current !== null) {
        window.clearTimeout(pulseTimeoutRef.current)
      }
    }
  }, [])

  React.useEffect(() => {
    if (!levelMenuOpen) return

    const handlePointerDown = (event: MouseEvent) => {
      if (!levelSelectRef.current?.contains(event.target as Node)) {
        setLevelMenuOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setLevelMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [levelMenuOpen])

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
    const form = document.getElementById('degrees-search')
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

  const handleLevelSelect = React.useCallback(
    (nextLevel: DegreeLevel) => {
      onLevelChange(nextLevel)
      setLevelMenuOpen(false)
    },
    [onLevelChange]
  )

  return (
    <section className={styles.section}>
      <div className={styles.levelSelect} ref={levelSelectRef}>
        <button
          type='button'
          id='degrees-level-label'
          className={styles.levelTrigger}
          aria-haspopup='listbox'
          aria-expanded={levelMenuOpen}
          aria-controls='degrees-level-menu'
          onClick={() => setLevelMenuOpen((open) => !open)}
        >
          <span className={styles.levelTitle}>{LEVEL_LABELS[level]}</span>
          <ChevronDownIcon open={levelMenuOpen} />
        </button>

        {levelMenuOpen ? (
          <ul
            id='degrees-level-menu'
            role='listbox'
            aria-labelledby='degrees-level-label'
            className={styles.levelMenu}
          >
            {LEVEL_OPTIONS.map((option) => {
              const selected = option === level

              return (
                <li key={option} role='presentation'>
                  <button
                    type='button'
                    role='option'
                    aria-selected={selected}
                    className={`${styles.levelOption} ${
                      selected ? styles.levelOptionSelected : ''
                    }`}
                    onClick={() => handleLevelSelect(option)}
                  >
                    {LEVEL_LABELS[option]}
                  </button>
                </li>
              )
            })}
          </ul>
        ) : null}
      </div>

      <p className={styles.intro}>{INTRO_COPY[level]}</p>

      <form
        id='degrees-search'
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
    </section>
  )
}
