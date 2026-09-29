import * as React from 'react'
import type { GetStaticProps } from 'next'
import Head from 'next/head'
import { useRouter } from 'next/router'

import {
  AllCoursesNewGridSection,
  catalogHitToCard
} from '@/components/AllCoursesNewGridSection'
import {
  AllCoursesNewTopSection,
  type AllCoursesView
} from '@/components/AllCoursesNewTopSection'
import type { HomeCourseCard } from '@/components/HomeCoursesSection'
import { HomeFooterSection } from '@/components/HomeFooterSection'
import { HomeHeader } from '@/components/HomeHeader'
import {
  type CatalogSearchItem,
  formatCatalogStats,
  groupCatalogHits,
  searchCatalog
} from '@/lib/catalog-search'
import type { LearningPathSearchExtras } from '@/lib/catalog-search-index'
import { listCourseLearningPaths } from '@/lib/course-learning-path-db'
import { getCourseLearningPathSubject } from '@/lib/course-learning-path-subject'
import { listNonCourseLearningPaths } from '@/lib/learning-path-db'
import { learningPathKicker } from '@/lib/learning-path-kind-ui'
import {
  type LearningPathTopicId,
  learningPathTopics,
  parseLearningPathTopicId
} from '@/lib/learning-path-topic'
import { PATHS_BASE, pathsLearningPathHref } from '@/lib/paths-routes'
import {
  SEMANTIC_SEARCH_DEBOUNCE_MS,
  type SemanticCatalogMatch,
  findCardForSemanticMatch,
  isSemanticCatalogMatch,
  mergeSemanticCatalogSearch,
  normalizeSemanticCatalogMatch,
  orderCardsBySemanticMatches,
  shouldApplySemanticResponse,
  shouldRequestSemanticSearch
} from '@/lib/semantic-learning-path-search'

const SCIENCE_DEGREE_IDS = new Set([
  'aerospace-engineering',
  'biomedical-engineering',
  'chemical-engineering',
  'civil-engineering',
  'industrial-engineering',
  'electrical-engineering',
  'mechanical-engineering',
  'computer-science',
  'computer-engineering',
  'information-technology',
  'engineering-general',
  'physics',
  'chemistry',
  'biology',
  'environmental-science'
])

const SOCIOLOGY_DEGREE_IDS = new Set([
  'accounting',
  'finance',
  'economics',
  'business-admin'
])

function homeSubjectsForAcademic(
  degreeId: string,
  title: string,
  description: string
): string[] {
  const text = `${degreeId.replace(/-/g, ' ')} ${title} ${description}`.toLowerCase()
  const subjects: string[] = []

  if (
    SCIENCE_DEGREE_IDS.has(degreeId) ||
    /\b(science|biology|biological|chemistry|chemical|physics|neuroscience|engineering|astronomy|geology|biochem|ecology|genetics|medicine|computer)\b/.test(
      text
    )
  ) {
    subjects.push('Science')
  }

  if (
    degreeId === 'mathematics' ||
    /\b(math|maths|mathematics|calculus|algebra|geometry|trigonometry|probability|statistics|statistical|topology|number theory|linear algebra)\b/.test(
      text
    )
  ) {
    subjects.push('Math')
  }

  if (
    SOCIOLOGY_DEGREE_IDS.has(degreeId) ||
    /\b(sociology|social|anthropology|politics|political|history|economics|economic|psychology|culture|public policy|law|philosophy|ethics)\b/.test(
      text
    )
  ) {
    subjects.push('Sociology')
  }

  if (
    /\b(english|writing|literature|poetry|grammar|rhetoric|linguistics|language|composition|creative writing)\b/.test(
      text
    )
  ) {
    subjects.push('English')
  }

  return subjects
}

function coursePathToCard(path: {
  id: string
  slug: string
  title: string
  description: string
  area?: string | null
}): HomeCourseCard {
  const subject = getCourseLearningPathSubject(path.slug, path.title, path.area)
  return {
    id: path.id,
    href: pathsLearningPathHref(path.slug),
    meta: subject.label,
    title: path.title,
    description: path.description,
    subjects: homeSubjectsForAcademic(
      subject.degreeId,
      path.title,
      path.description
    ),
    subjectDegreeId: subject.degreeId
  }
}

function mergeCoursePathCards(
  base: HomeCourseCard[],
  extra: HomeCourseCard[]
): HomeCourseCard[] {
  if (extra.length === 0) return base
  const byHref = new Map(base.map((card) => [card.href, card]))
  for (const card of extra) {
    const prior = byHref.get(card.href)
    byHref.set(card.href, {
      ...prior,
      ...card,
      subjectDegreeId: card.subjectDegreeId || prior?.subjectDegreeId,
      statsLine: card.statsLine || prior?.statsLine,
      communityMark: card.communityMark ?? prior?.communityMark
    })
  }
  return [...byHref.values()].sort((a, b) =>
    a.title.localeCompare(b.title, undefined, { sensitivity: 'base' })
  )
}

function nonCoursePathToCard(
  path: {
    id: string
    slug: string
    title: string
    description: string
    kind: 'community' | 'research' | 'course'
  },
  extrasBySlug: Record<string, LearningPathSearchExtras>
): HomeCourseCard {
  const extras = extrasBySlug[path.slug]
  return {
    id: path.id,
    href: pathsLearningPathHref(path.slug),
    meta: learningPathKicker(path.kind),
    title: path.title,
    description: path.description,
    communityMark: true,
    statsLine: extras ? formatCatalogStats(extras.stats) : undefined
  }
}

function learningPathCardSlug(path: HomeCourseCard) {
  return path.href.split('/').filter(Boolean).pop() || path.id
}

function parseViewParam(
  value: string | string[] | undefined,
  topic: string | string[] | undefined,
  subjects?: string | string[] | undefined,
  hasQuery?: boolean
): AllCoursesView {
  const raw = Array.isArray(value) ? value[0] || '' : value || ''
  if (raw === 'goals' || raw === 'learning-paths' || raw === 'paths') {
    return 'goals'
  }
  if (raw === 'academic' || raw === 'courses' || raw === 'university') {
    return 'academic'
  }
  if (raw === 'degrees' || raw === 'degree') return 'degrees'
  if (raw === 'research' || raw === 'questions') return 'research'
  if (raw === 'all') return 'all'
  const topicRaw = Array.isArray(topic) ? topic[0] || '' : topic || ''
  if (topicRaw) return 'goals'
  const subjectRaw = Array.isArray(subjects)
    ? subjects.join(',')
    : subjects || ''
  if (subjectRaw.trim() && !hasQuery) return 'academic'
  return 'all'
}

function withRelatedTerms(
  extra: string | undefined,
  terms: string[] | undefined
): string | undefined {
  const cleaned = (terms || []).map((term) => term.trim()).filter(Boolean)
  if (cleaned.length === 0) return extra
  if (!extra?.trim()) return cleaned.join(' ')
  return `${extra} ${cleaned.join(' ')}`
}

function communityPathToItem(
  path: HomeCourseCard,
  extrasBySlug: Record<string, LearningPathSearchExtras>,
  relatedTermsByItemId: Record<string, string[]> = {}
): CatalogSearchItem {
  const slug = learningPathCardSlug(path)
  const extras = extrasBySlug[slug]
  const related =
    relatedTermsByItemId[path.id] || relatedTermsByItemId[slug] || []
  return {
    id: path.id,
    kind: 'learning-path',
    href: path.href,
    title: path.title,
    description: path.description,
    meta: path.meta,
    extra: withRelatedTerms(extras?.extra, related),
    relatedTerms: [...(extras?.relatedTerms || []), ...related],
    stats: extras?.stats,
    communityMark: true
  }
}

function syllabusToItem(
  path: HomeCourseCard,
  relatedTermsByItemId: Record<string, string[]> = {}
): CatalogSearchItem {
  const slug = learningPathCardSlug(path)
  const related =
    relatedTermsByItemId[path.id] || relatedTermsByItemId[slug] || []
  return {
    id: path.id,
    kind: 'learning-path',
    href: path.href,
    title: path.title,
    description: path.description,
    meta: path.meta,
    extra: withRelatedTerms(`${path.title} ${path.description}`, related),
    relatedTerms: [path.title, ...related],
    subjectDegreeId: path.subjectDegreeId
  }
}

type AllCoursesPageProps = {
  coursePaths?: HomeCourseCard[]
  learningPaths?: HomeCourseCard[]
  degrees?: CatalogSearchItem[]
  research?: CatalogSearchItem[]
  pathExtrasBySlug?: Record<string, LearningPathSearchExtras>
  relatedTermsByItemId?: Record<string, string[]>
}

const SUBJECT_OPTIONS = [
  'Science',
  'Math',
  'Art',
  'Sociology',
  'English'
] as const
type HomeSubject = (typeof SUBJECT_OPTIONS)[number]

function parseSubjectsParam(
  value: string | string[] | undefined
): HomeSubject[] {
  const raw = Array.isArray(value) ? value.join(',') : value || ''

  if (!raw.trim()) return []

  const normalized = raw
    .split(',')
    .map((subject) => subject.trim().toLowerCase())
    .filter(Boolean)

  const aliases: Record<string, HomeSubject> = {
    science: 'Science',
    math: 'Math',
    maths: 'Math',
    art: 'Art',
    sociology: 'Sociology',
    english: 'English'
  }

  const selected = new Set<HomeSubject>()

  for (const subject of normalized) {
    const resolved = aliases[subject]
    if (resolved) selected.add(resolved)
  }

  return SUBJECT_OPTIONS.filter((subject) => selected.has(subject))
}

function sameSubjects(a: HomeSubject[], b: HomeSubject[]): boolean {
  if (a.length !== b.length) return false
  return a.every((subject, index) => subject === b[index])
}

function matchesCourseSubjects(
  course: Pick<HomeCourseCard, 'subjects'>,
  activeSubjects: HomeSubject[]
): boolean {
  if (activeSubjects.length === 0) return true
  const subjectMatchMap: Record<HomeSubject, string[]> = {
    Science: ['Science'],
    Math: ['Math'],
    Art: ['Art', 'Sociology'],
    Sociology: ['Sociology', 'Art'],
    English: ['English']
  }

  return activeSubjects.some((selected) => {
    const matches = subjectMatchMap[selected] || [selected]
    return (course.subjects || []).some((subject) => matches.includes(subject))
  })
}

export const getStaticProps: GetStaticProps<AllCoursesPageProps> = async () => {
  const { listFilledCuratedCourseCatalog } = await import(
    '@/lib/curated-course-catalog'
  )
  const {
    listDegreeCatalogItems,
    listResearchCatalogItems,
    listSeededLearningPathExtras
  } = await import('@/lib/catalog-search-index')
  const coursePaths = listFilledCuratedCourseCatalog().map(coursePathToCard)
  const pathExtrasBySlug = listSeededLearningPathExtras()
  const { listCatalogRelatedTermsByKind } = await import(
    '@/lib/catalog-related-terms-db'
  )
  const relatedTermsByItemId = await listCatalogRelatedTermsByKind(
    'learning-path'
  )
  const { SEEDED_LEARNING_PATHS } = await import('@/lib/learning-path-seed')
  const learningPaths = SEEDED_LEARNING_PATHS.map((path) =>
    nonCoursePathToCard(
      {
        id: path.id || path.slug,
        slug: path.slug,
        title: path.title,
        description: path.summary || path.goal,
        kind: 'community'
      },
      pathExtrasBySlug
    )
  )

  return {
    props: {
      coursePaths,
      learningPaths,
      degrees: listDegreeCatalogItems(),
      research: listResearchCatalogItems(),
      pathExtrasBySlug,
      relatedTermsByItemId
    },
    revalidate: 600
  }
}

export default function AllCoursesPage({
  coursePaths: initialCoursePaths = [],
  learningPaths: initialLearningPaths = [],
  degrees = [],
  research = [],
  pathExtrasBySlug = {},
  relatedTermsByItemId = {}
}: AllCoursesPageProps) {
  const router = useRouter()
  const [query, setQuery] = React.useState('')
  const [view, setView] = React.useState<AllCoursesView>('all')
  const [activeSubjects, setActiveSubjects] = React.useState<HomeSubject[]>([])
  const [activeTopic, setActiveTopic] =
    React.useState<LearningPathTopicId | null>(null)
  const [coursePaths, setCoursePaths] =
    React.useState<HomeCourseCard[]>(initialCoursePaths)
  const [coursePathsReady, setCoursePathsReady] = React.useState(
    initialCoursePaths.length > 0
  )
  const [learningPaths, setLearningPaths] =
    React.useState<HomeCourseCard[]>(initialLearningPaths)
  const [learningPathsReady, setLearningPathsReady] = React.useState(
    initialLearningPaths.length > 0
  )
  const [semanticMatches, setSemanticMatches] = React.useState<
    SemanticCatalogMatch[]
  >([])
  const semanticRequestIdRef = React.useRef(0)

  React.useEffect(() => {
    let cancelled = false
    void listCourseLearningPaths()
      .then((rows) => {
        if (cancelled) return
        setCoursePaths((current) =>
          mergeCoursePathCards(current, rows.map(coursePathToCard))
        )
      })
      .catch(() => {
        /* Keep the JSON catalog from getStaticProps. */
      })
      .finally(() => {
        if (!cancelled) setCoursePathsReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  React.useEffect(() => {
    let cancelled = false
    void listNonCourseLearningPaths()
      .then((rows) => {
        if (cancelled) return
        setLearningPaths((current) =>
          mergeCoursePathCards(
            current,
            rows.map((row) => nonCoursePathToCard(row, pathExtrasBySlug))
          )
        )
      })
      .catch(() => {
        /* Keep seeded cards from getStaticProps. */
      })
      .finally(() => {
        if (!cancelled) setLearningPathsReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [pathExtrasBySlug])

  React.useEffect(() => {
    if (!router.isReady) return

    const urlQuery = Array.isArray(router.query.q)
      ? router.query.q[0] || ''
      : (router.query.q as string | undefined) || ''
    const urlSubjects = parseSubjectsParam(
      router.query.subjects as string | string[] | undefined
    )
    const urlView = parseViewParam(
      router.query.view,
      router.query.topic,
      router.query.subjects as string | string[] | undefined,
      Boolean(urlQuery.trim())
    )
    const urlTopic =
      urlView === 'goals'
        ? parseLearningPathTopicId(router.query.topic)
        : null

    setQuery((current) => (current === urlQuery ? current : urlQuery))
    setActiveSubjects((current) =>
      sameSubjects(current, urlSubjects) ? current : urlSubjects
    )
    setActiveTopic((current) => (current === urlTopic ? current : urlTopic))
    setView((current) => (current === urlView ? current : urlView))
  }, [
    router.isReady,
    router.query.q,
    router.query.subjects,
    router.query.topic,
    router.query.view
  ])

  const updateUrl = React.useCallback(
    (
      nextQuery: string,
      nextSubjects: HomeSubject[],
      nextView: AllCoursesView,
      nextTopic: LearningPathTopicId | null
    ) => {
      if (!router.isReady) return

      const trimmedQuery = nextQuery.trim()
      const nextRouteQuery: Record<string, string> = {}

      if (trimmedQuery) {
        nextRouteQuery.q = trimmedQuery
      }

      if (nextView === 'goals') {
        nextRouteQuery.view = 'goals'
        if (nextTopic) nextRouteQuery.topic = nextTopic
      } else if (nextView === 'academic') {
        nextRouteQuery.view = 'academic'
        if (nextSubjects.length > 0) {
          nextRouteQuery.subjects = nextSubjects.join(',')
        }
      } else if (nextView === 'degrees') {
        nextRouteQuery.view = 'degrees'
      } else if (nextView === 'research') {
        nextRouteQuery.view = 'research'
      } else {
        nextRouteQuery.view = 'all'
      }

      void router.replace(
        {
          pathname: `${PATHS_BASE}/all-paths`,
          query: nextRouteQuery
        },
        undefined,
        { shallow: true, scroll: false }
      )
    },
    [router]
  )

  const handleSearchSubmit = React.useCallback(() => {
    updateUrl(query, activeSubjects, view, activeTopic)
  }, [activeSubjects, activeTopic, query, updateUrl, view])

  const handleViewChange = React.useCallback(
    (nextView: AllCoursesView) => {
      setView(nextView)
      if (nextView === 'goals') {
        updateUrl(query, [], nextView, activeTopic)
        return
      }
      setActiveTopic(null)
      if (nextView !== 'academic') {
        setActiveSubjects([])
        updateUrl(query, [], nextView, null)
        return
      }
      updateUrl(query, activeSubjects, nextView, null)
    },
    [activeSubjects, activeTopic, query, updateUrl]
  )

  const handleSubjectToggle = React.useCallback(
    (subject: string) => {
      if (!SUBJECT_OPTIONS.includes(subject as HomeSubject)) return

      setActiveSubjects((current) => {
        const typedSubject = subject as HomeSubject
        const next = current.includes(typedSubject)
          ? current.filter((item) => item !== typedSubject)
          : [...current, typedSubject]
        const ordered = SUBJECT_OPTIONS.filter((item) => next.includes(item))

        updateUrl(query, ordered, 'academic', null)
        return ordered
      })
    },
    [query, updateUrl]
  )

  const handleTopicToggle = React.useCallback(
    (topic: LearningPathTopicId) => {
      setActiveTopic((current) => {
        const next = current === topic ? null : topic
        updateUrl(query, [], 'goals', next)
        return next
      })
    },
    [query, updateUrl]
  )

  const filteredCoursePaths = React.useMemo(() => {
    const needle = query.trim().toLowerCase()
    return coursePaths.filter((course) => {
      if (!matchesCourseSubjects(course, activeSubjects)) return false
      if (!needle) return true
      const searchable =
        `${course.title} ${course.description} ${course.meta}`.toLowerCase()
      return searchable.includes(needle)
    })
  }, [activeSubjects, coursePaths, query])

  const catalogItems = React.useMemo(() => {
    return [
      ...learningPaths.map((path) =>
        communityPathToItem(path, pathExtrasBySlug, relatedTermsByItemId)
      ),
      ...coursePaths.map((path) =>
        syllabusToItem(path, relatedTermsByItemId)
      ),
      ...research
    ]
  }, [
    coursePaths,
    learningPaths,
    pathExtrasBySlug,
    relatedTermsByItemId,
    research
  ])

  React.useEffect(() => {
    const trimmed = query.trim()
    if (!shouldRequestSemanticSearch(trimmed)) {
      semanticRequestIdRef.current += 1
      setSemanticMatches([])
      return
    }

    const requestId = semanticRequestIdRef.current + 1
    semanticRequestIdRef.current = requestId
    setSemanticMatches([])
    const timer = window.setTimeout(() => {
      void fetch('/api/search-learning-paths', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: trimmed,
          kinds: ['learning-path']
        })
      })
        .then(async (response) => {
          if (!response.ok) {
            throw new Error(`search-learning-paths ${response.status}`)
          }
          return response.json() as Promise<{
            matches?: unknown[]
          }>
        })
        .then((payload) => {
          if (
            !shouldApplySemanticResponse(
              requestId,
              semanticRequestIdRef.current
            )
          ) {
            return
          }
          const matches = Array.isArray(payload.matches)
            ? payload.matches
                .filter(isSemanticCatalogMatch)
                .map(normalizeSemanticCatalogMatch)
            : []
          setSemanticMatches(matches)
        })
        .catch(() => {
          if (
            shouldApplySemanticResponse(requestId, semanticRequestIdRef.current)
          ) {
            setSemanticMatches([])
          }
        })
    }, SEMANTIC_SEARCH_DEBOUNCE_MS)

    return () => {
      window.clearTimeout(timer)
    }
  }, [query])

  const filteredLearningPaths = React.useMemo(() => {
    const needle = query.trim().toLowerCase()
    const filtered = learningPaths.filter((path) => {
      const matchesTopic =
        activeTopic == null ||
        learningPathTopics({
          slug: learningPathCardSlug(path),
          title: path.title,
          summary: path.description
        }).includes(activeTopic)
      if (!matchesTopic) return false
      if (!needle) return true
      const searchable =
        `${path.title} ${path.description} ${path.meta}`.toLowerCase()
      return searchable.includes(needle)
    })
    const pathMatches = semanticMatches.filter(
      (match) => match.kind === 'learning-path'
    )
    return orderCardsBySemanticMatches(filtered, pathMatches)
  }, [activeTopic, learningPaths, query, semanticMatches])

  const unified = React.useMemo(() => {
    const needle = query.trim()
    if (needle) {
      const lexical = groupCatalogHits(
        searchCatalog(catalogItems, needle),
        true
      )
      if (semanticMatches.length === 0) return lexical

      const coursePathIds = new Set(coursePaths.map((path) => path.id))
      const coursePathHrefs = new Set(coursePaths.map((path) => path.href))
      const loadedPathCards = [...learningPaths, ...coursePaths]

      return mergeSemanticCatalogSearch(
        lexical,
        semanticMatches.filter((match) => match.kind === 'learning-path'),
        (match) => {
          if (match.kind !== 'learning-path') return null
          const card = findCardForSemanticMatch(match, loadedPathCards)
          if (!card) return null
          if (coursePathIds.has(card.id) || coursePathHrefs.has(card.href)) {
            return syllabusToItem(card, relatedTermsByItemId)
          }
          return communityPathToItem(
            card,
            pathExtrasBySlug,
            relatedTermsByItemId
          )
        }
      )
    }

    const browsePaths = learningPaths.slice(0, 12)
    const browseResearch = research.slice(0, 4)

    return {
      bestMatch: null,
      groups: [
        browsePaths.length > 0
          ? {
              kind: 'learning-path' as const,
              label: 'Learning paths',
              hits: browsePaths.map((path) => ({
                ...communityPathToItem(
                  path,
                  pathExtrasBySlug,
                  relatedTermsByItemId
                ),
                score: 0,
                match: 'query' as const
              }))
            }
          : null,
        browseResearch.length > 0
          ? {
              kind: 'research' as const,
              label: 'Research questions',
              hits: browseResearch.map((item) => ({
                ...item,
                score: 0,
                match: 'query' as const
              }))
            }
          : null
      ].filter((group): group is NonNullable<typeof group> => group != null)
    }
  }, [
    catalogItems,
    coursePaths,
    learningPaths,
    pathExtrasBySlug,
    query,
    relatedTermsByItemId,
    research,
    semanticMatches
  ])

  const unifiedGroups = unified.groups.map((group) => ({
    kind: group.kind,
    label: group.label,
    cards: group.hits.map(catalogHitToCard)
  }))

  const filteredDegrees = React.useMemo(() => {
    const needle = query.trim()
    const matched = needle ? searchCatalog(degrees, needle) : degrees
    const subjectFiltered =
      activeSubjects.length === 0
        ? matched
        : matched.filter((item) =>
            matchesCourseSubjects(
              {
                subjects: homeSubjectsForAcademic(
                  item.subjectDegreeId || '',
                  item.title,
                  item.description
                )
              },
              activeSubjects
            )
          )
    const limited =
      !needle && activeSubjects.length === 0
        ? subjectFiltered.slice(0, 24)
        : subjectFiltered
    return limited.map(catalogHitToCard)
  }, [activeSubjects, degrees, query])

  const filteredResearch = React.useMemo(() => {
    const needle = query.trim()
    if (!needle) return research.map(catalogHitToCard)
    return searchCatalog(research, needle).map(catalogHitToCard)
  }, [query, research])

  const gridCourses =
    view === 'degrees'
      ? filteredDegrees
      : view === 'research'
      ? filteredResearch
      : []

  return (
    <>
      <Head>
        <link rel='preconnect' href='https://use.typekit.net' />
        <link rel='preconnect' href='https://p.typekit.net' />
        <link rel='stylesheet' href='https://use.typekit.net/vxh3dki.css' />
        <link rel='preconnect' href='https://fonts.googleapis.com' />
        <link
          rel='preconnect'
          href='https://fonts.gstatic.com'
          crossOrigin=''
        />
        <link
          href='https://fonts.googleapis.com/css2?family=Hanken+Grotesk:ital,wght@0,100..900;1,100..900&display=swap'
          rel='stylesheet'
        />
      </Head>

      <main
        style={
          {
            '--home-side': 'clamp(20px, 4.03vw, 58px)',
            '--home-main-max': '1324px',
            '--home-content-max': '1000px',
            '--home-footer-side': 'max(28px, 15.28vw)',
            minHeight: '100vh',
            background: 'var(--footer, #F8F7F4)',
            display: 'flex',
            flexDirection: 'column'
          } as React.CSSProperties
        }
      >
        <HomeHeader />
        <section
          style={{ flex: 1 }}
          aria-label={
            view === 'goals'
              ? 'All learning paths workspace'
              : view === 'all'
              ? 'Discover workspace'
              : view === 'degrees'
              ? 'Degree curricula workspace'
              : view === 'research'
              ? 'Research questions workspace'
              : 'Academic courses workspace'
          }
        >
          <AllCoursesNewTopSection
            query={query}
            view={view}
            activeSubjects={activeSubjects}
            activeTopic={activeTopic}
            onQueryChange={setQuery}
            onViewChange={handleViewChange}
            onSubjectToggle={handleSubjectToggle}
            onTopicToggle={handleTopicToggle}
            onSearchSubmit={handleSearchSubmit}
          />
          <AllCoursesNewGridSection
            view={view}
            courses={gridCourses}
            coursePaths={filteredCoursePaths}
            coursePathsReady={coursePathsReady}
            coursePathQuery={query.trim()}
            learningPaths={filteredLearningPaths}
            learningPathsReady={learningPathsReady}
            topicActive={Boolean(activeTopic)}
            subjectsActive={activeSubjects.length > 0}
            unifiedHasQuery={Boolean(query.trim())}
            unifiedBestMatch={
              unified.bestMatch ? catalogHitToCard(unified.bestMatch) : null
            }
            unifiedGroups={unifiedGroups}
            unifiedReady={
              view !== 'all' || (learningPathsReady && coursePathsReady)
            }
            degreeCards={filteredDegrees}
          />
        </section>
        <HomeFooterSection />
      </main>
    </>
  )
}
