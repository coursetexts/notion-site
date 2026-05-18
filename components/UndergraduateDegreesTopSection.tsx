import * as React from 'react'

import styles from './UndergraduateDegreesTopSection.module.css'

const INTRO_COPY =
  'Coursetexts curated curriculum for common undergraduate degrees. Helping self learners structure their learning, and linking out to world class resources.'

type UndergraduateDegreesTopSectionProps = {
  query: string
  onQueryChange: (value: string) => void
  onSearchSubmit: () => void
}

export function UndergraduateDegreesTopSection({
  query,
  onQueryChange,
  onSearchSubmit
}: UndergraduateDegreesTopSectionProps) {
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
    const form = document.getElementById('undergraduate-degrees-search')
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
      <h1 className={styles.heading}>Undergraduate Degrees</h1>

      <p className={styles.intro}>{INTRO_COPY}</p>

      <form
        id='undergraduate-degrees-search'
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
