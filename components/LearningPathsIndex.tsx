import * as React from 'react'
import Link from 'next/link'

import {
  type LearningPathData,
  type StoredLearningPath,
  SEEDED_LEARNING_PATHS,
  emptyLearningPath,
  readStoredLearningPaths
} from '@/lib/learning-path-seed'
import {
  listCatalogLearningPaths,
  listOwnedLearningPaths
} from '@/lib/learning-path-db'
import {
  TRENDING_CONCEPTS,
  type TrendingConcept
} from '@/lib/trending-concepts-seed'

import { CreateLearningPathModal } from './CreateLearningPathModal'
import styles from './LearningPathsIndex.module.css'

function normalizeSearch(value: string) {
  return value.trim().toLowerCase()
}

function matchesSearch(haystack: string, query: string) {
  return haystack.toLowerCase().includes(query)
}

function pathMatchesQuery(path: LearningPathData, query: string) {
  if (!query) return true
  return (
    matchesSearch(path.title, query) ||
    matchesSearch(path.goal, query) ||
    matchesSearch(path.summary, query)
  )
}

function conceptMatchesQuery(concept: TrendingConcept, query: string) {
  if (!query) return true
  return (
    matchesSearch(concept.label, query) ||
    matchesSearch(concept.blurb, query) ||
    matchesSearch(concept.pathTitle, query)
  )
}

function conceptStats(path: LearningPathData) {
  const concepts = path.nodes.filter((node) => node.kind !== 'goal')
  const explored = concepts.filter((node) => node.status === 'explored').length
  return { total: concepts.length, explored }
}

function storedToPath(item: StoredLearningPath): LearningPathData {
  const seeded = SEEDED_LEARNING_PATHS.find((path) => path.slug === item.slug)
  if (seeded) return seeded
  if (item.data && Array.isArray(item.data.nodes)) {
    return {
      ...item.data,
      slug: item.slug,
      goal: item.goal
    }
  }
  return emptyLearningPath(item.goal, item.slug)
}

function formatCount(n: number) {
  return n.toLocaleString('en-US')
}

function PlusIcon() {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='14'
      height='14'
      viewBox='0 0 14 14'
      fill='none'
      aria-hidden
    >
      <path
        d='M7 2.5V11.5M2.5 7H11.5'
        stroke='currentColor'
        strokeWidth='1.4'
        strokeLinecap='round'
      />
    </svg>
  )
}

export function LearningPathsIndex() {
  const [catalogPaths, setCatalogPaths] = React.useState<LearningPathData[]>(
    SEEDED_LEARNING_PATHS
  )
  const [customPaths, setCustomPaths] = React.useState<StoredLearningPath[]>(
    []
  )
  const [createOpen, setCreateOpen] = React.useState(false)
  const [query, setQuery] = React.useState('')
  const [isSearchPulse, setIsSearchPulse] = React.useState(false)
  const pulseTimeoutRef = React.useRef<number | null>(null)
  const submitFromButtonRef = React.useRef(false)

  React.useEffect(() => {
    setCustomPaths(readStoredLearningPaths())
    void listCatalogLearningPaths().then(setCatalogPaths)
    void listOwnedLearningPaths().then(setCustomPaths)
  }, [])

  React.useEffect(() => {
    return () => {
      if (pulseTimeoutRef.current !== null) {
        window.clearTimeout(pulseTimeoutRef.current)
      }
    }
  }, [])

  const seededSlugs = React.useMemo(
    () => new Set(catalogPaths.map((path) => path.slug)),
    [catalogPaths]
  )
  const customOnly = customPaths.filter(
    (item) => !seededSlugs.has(item.slug)
  )
  const paths = [
    ...customOnly.map(storedToPath),
    ...catalogPaths
  ]
  const search = normalizeSearch(query)
  const filteredPaths = paths.filter((path) => pathMatchesQuery(path, search))
  const filteredConcepts = TRENDING_CONCEPTS.filter((concept) =>
    conceptMatchesQuery(concept, search)
  )

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

  const markSearchButtonSubmit = React.useCallback(() => {
    submitFromButtonRef.current = true
  }, [])

  const handleSearchSubmit = React.useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      const fromSearchButton = submitFromButtonRef.current
      submitFromButtonRef.current = false
      if (fromSearchButton) {
        triggerSearchPulse()
      }
    },
    [triggerSearchPulse]
  )

  const closeCreate = React.useCallback(() => setCreateOpen(false), [])

  return (
    <section className={styles.section} aria-label='Learning paths'>
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>Learning paths</h1>
            <button
              type='button'
              className={styles.startBtn}
              onClick={() => setCreateOpen(true)}
            >
              <PlusIcon />
              Start a learning path
            </button>
          </div>
          <p className={styles.lede}>
            Start from a goal. Work backward into what you need, how deep to
            go, and who is already on the way. Leave traces so the next person
            does not start from nowhere.
          </p>
        </header>

        <form
          id='learning-paths-search'
          className={`${styles.searchWrap} ${
            isSearchPulse ? styles.searchWrapPulse : ''
          }`}
          onSubmit={handleSearchSubmit}
          role='search'
        >
          <input
            type='text'
            className={styles.searchInput}
            placeholder='What are you curious about?'
            aria-label='What are you curious about?'
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button
            type='submit'
            className={styles.searchButton}
            onClick={markSearchButtonSubmit}
          >
            Search
          </button>
        </form>
      </div>

      <div className={styles.body}>
        <div className={styles.container}>
        <div className={styles.columns}>
          <div>
            <div className={styles.bar}>
              <span>
                <span className={styles.barLabel}>All learning paths</span>
                <span className={styles.barCount}>({filteredPaths.length})</span>
              </span>
              <span className={styles.barHint}>
                What people are trying to do
              </span>
            </div>
            {filteredPaths.length === 0 ? (
              <p className={styles.empty}>No matching learning paths.</p>
            ) : (
            <ul className={styles.list}>
              {filteredPaths.map((path) => {
                const stats = conceptStats(path)
                const yours = customOnly.some((item) => item.slug === path.slug)
                return (
                  <li key={path.slug} className={styles.item}>
                    <p className={styles.kicker}>
                      {yours ? 'Your path' : 'Community path'}
                    </p>
                    <h2 className={styles.itemTitle}>
                      <Link
                        href={`/learning-path/${path.slug}`}
                        className={styles.titleLink}
                      >
                        {path.title}
                      </Link>
                    </h2>
                    <p className={styles.copy}>{path.goal}</p>
                    <p className={styles.meta}>
                      {stats.total === 0
                        ? 'Just started'
                        : `${stats.explored} of ${stats.total} concepts explored`}
                      <span aria-hidden> · </span>
                      {path.circle.members.length > 0
                        ? `${path.circle.members.length} in the circle`
                        : 'No circle yet'}
                    </p>
                  </li>
                )
              })}
            </ul>
            )}
          </div>
        </div>

        <div className={styles.concepts}>
          <div className={styles.bar}>
            <span>
              <span className={styles.barLabel}>Concepts</span>
              <span className={styles.barCount}>
                ({filteredConcepts.length})
              </span>
            </span>
            <span className={styles.barHint}>Trending now</span>
          </div>
          <p className={styles.conceptsLede}>
            A concept is an atomic unit a learning path can contain — one idea,
            only as deep as the goal requires. Attach resources and your notes
            to a concept, detail which part of the resource helped the concept
            click.
          </p>
          {filteredConcepts.length === 0 ? (
            <p className={styles.empty}>No matching concepts.</p>
          ) : (
          <ul className={styles.conceptGrid}>
            {filteredConcepts.map((concept, index) => (
              <li key={concept.id} className={styles.item}>
                <p className={styles.kicker}>
                  Trending · {index + 1}
                </p>
                <h2 className={styles.itemTitle}>
                  <Link
                    href={`/learning-path/${concept.pathSlug}`}
                    className={styles.titleLink}
                  >
                    {concept.label}
                  </Link>
                </h2>
                <p className={styles.copy}>{concept.blurb}</p>
                <p className={styles.meta}>
                  On {formatCount(concept.onPaths)} paths
                  <span aria-hidden> · </span>
                  {formatCount(concept.exploring)} exploring
                  <span aria-hidden> · </span>
                  In {concept.pathTitle}
                </p>
              </li>
            ))}
          </ul>
          )}
        </div>

        <div className={styles.invite}>
          <p className={styles.inviteCopy}>
            Have a goal of your own? Map the concepts you need, how deep to go,
            and leave traces for whoever comes next.
          </p>
          <button
            type='button'
            className={styles.inviteBtn}
            onClick={() => setCreateOpen(true)}
          >
            Create your own learning path
          </button>
        </div>
        </div>
      </div>

      <CreateLearningPathModal open={createOpen} onClose={closeCreate} />
    </section>
  )
}
