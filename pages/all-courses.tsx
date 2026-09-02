import * as React from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import type { GetStaticProps } from 'next'

import { AllCoursesNewGridSection } from '@/components/AllCoursesNewGridSection'
import {
  AllCoursesNewTopSection,
  type AllCoursesView
} from '@/components/AllCoursesNewTopSection'
import type { HomeCourseCard } from '@/components/HomeCoursesSection'
import { listCourseLearningPaths } from '@/lib/course-learning-path-db'
import { getCourseLearningPathSubject } from '@/lib/course-learning-path-subject'
import { listNonCourseLearningPaths } from '@/lib/learning-path-db'
import { learningPathKicker } from '@/lib/learning-path-kind-ui'
import {
  learningPathTopics,
  parseLearningPathTopicId,
  type LearningPathTopicId
} from '@/lib/learning-path-topic'
import type { NotionHomeDebugPayload } from './index'
import { HomeFooterSection } from '@/components/HomeFooterSection'
import { HomeHeader } from '@/components/HomeHeader'

function coursePathToCard(path: {
  id: string
  slug: string
  title: string
  description: string
  area?: string | null
}): HomeCourseCard {
  const subject = getCourseLearningPathSubject(
    path.slug,
    path.title,
    path.area
  )
  return {
    id: path.id,
    href: `/learning-path/${path.slug}`,
    meta: `Coursetexts · ${subject.label}`,
    title: path.title,
    description: path.description,
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
      subjectDegreeId: card.subjectDegreeId || prior?.subjectDegreeId
    })
  }
  return [...byHref.values()].sort((a, b) =>
    a.title.localeCompare(b.title, undefined, { sensitivity: 'base' })
  )
}

function nonCoursePathToCard(path: {
  id: string
  slug: string
  title: string
  description: string
  kind: 'community' | 'research' | 'course'
}): HomeCourseCard {
  return {
    id: path.id,
    href: `/learning-path/${path.slug}`,
    meta: `Coursetexts · ${learningPathKicker(path.kind)}`,
    title: path.title,
    description: path.description,
    communityMark: true
  }
}

function learningPathCardSlug(path: HomeCourseCard) {
  return path.href.split('/').filter(Boolean).pop() || path.id
}

function parseViewParam(
  value: string | string[] | undefined
): AllCoursesView {
  const raw = Array.isArray(value) ? value[0] || '' : value || ''
  if (raw === 'learning-paths' || raw === 'paths') return 'learning-paths'
  return 'courses'
}

type AllCoursesPageProps = {
  courses: HomeCourseCard[]
  coursePaths?: HomeCourseCard[]
  learningPaths?: HomeCourseCard[]
  notionHomeDebug?: NotionHomeDebugPayload | null
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

export const getStaticProps: GetStaticProps<AllCoursesPageProps> = async (
  ctx
) => {
  const { getStaticProps: getHomeStaticProps } = await import('./index')
  const home = await getHomeStaticProps(ctx)
  if (!('props' in home)) return home

  const { listFilledCuratedCourseCatalog } = await import(
    '@/lib/curated-course-catalog'
  )
  const coursePaths = listFilledCuratedCourseCatalog().map(coursePathToCard)
  const { SEEDED_LEARNING_PATHS } = await import('@/lib/learning-path-seed')
  const learningPaths = SEEDED_LEARNING_PATHS.map((path) =>
    nonCoursePathToCard({
      id: path.id || path.slug,
      slug: path.slug,
      title: path.title,
      description: path.summary || path.goal,
      kind: 'community'
    })
  )

  return {
    ...home,
    props: {
      ...home.props,
      coursePaths,
      learningPaths
    }
  }
}

export default function AllCoursesPage({
  courses,
  coursePaths: initialCoursePaths = [],
  learningPaths: initialLearningPaths = [],
  notionHomeDebug
}: AllCoursesPageProps) {
  const router = useRouter()
  const [query, setQuery] = React.useState('')
  const [view, setView] = React.useState<AllCoursesView>('courses')
  const [activeSubjects, setActiveSubjects] = React.useState<HomeSubject[]>([])
  const [activeTopic, setActiveTopic] =
    React.useState<LearningPathTopicId | null>(null)
  const [coursePaths, setCoursePaths] =
    React.useState<HomeCourseCard[]>(initialCoursePaths)
  const [coursePathsReady, setCoursePathsReady] = React.useState(
    initialCoursePaths.length > 0
  )
  const [learningPaths, setLearningPaths] = React.useState<HomeCourseCard[]>(
    initialLearningPaths
  )
  const [learningPathsReady, setLearningPathsReady] = React.useState(
    initialLearningPaths.length > 0
  )

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
    if (notionHomeDebug && typeof window !== 'undefined') {
      console.log(
        '%c[Coursetexts] Notion home debug (shared getStaticProps with /)',
        'color:#2563eb;font-weight:bold;',
        notionHomeDebug
      )
    }
  }, [notionHomeDebug])

  React.useEffect(() => {
    if (view !== 'learning-paths') return
    let cancelled = false
    void listNonCourseLearningPaths()
      .then((rows) => {
        if (cancelled) return
        setLearningPaths((current) =>
          mergeCoursePathCards(current, rows.map(nonCoursePathToCard))
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
  }, [view])

  React.useEffect(() => {
    if (!router.isReady) return

    const urlQuery = Array.isArray(router.query.q)
      ? router.query.q[0] || ''
      : (router.query.q as string | undefined) || ''
    const urlSubjects = parseSubjectsParam(
      router.query.subjects as string | string[] | undefined
    )
    const urlView = parseViewParam(router.query.view)
    const urlTopic =
      urlView === 'learning-paths'
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

      if (nextView === 'learning-paths') {
        nextRouteQuery.view = 'learning-paths'
        if (nextTopic) nextRouteQuery.topic = nextTopic
      } else if (nextSubjects.length > 0) {
        nextRouteQuery.subjects = nextSubjects.join(',')
      }

      void router.replace(
        {
          pathname: '/all-courses',
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
      if (nextView === 'learning-paths') {
        updateUrl(query, [], nextView, activeTopic)
        return
      }
      setActiveTopic(null)
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

        updateUrl(query, ordered, view, null)
        return ordered
      })
    },
    [query, updateUrl, view]
  )

  const handleTopicToggle = React.useCallback(
    (topic: LearningPathTopicId) => {
      setActiveTopic((current) => {
        const next = current === topic ? null : topic
        updateUrl(query, [], 'learning-paths', next)
        return next
      })
    },
    [query, updateUrl]
  )

  const filteredCourses = React.useMemo(() => {
    const needle = query.trim().toLowerCase()
    const subjectMatchMap: Record<HomeSubject, string[]> = {
      Science: ['Science'],
      Math: ['Math'],
      Art: ['Art', 'Sociology'],
      Sociology: ['Sociology', 'Art'],
      English: ['English']
    }

    const subset = courses.filter((course) => {
      const matchesSubject =
        activeSubjects.length === 0 ||
        activeSubjects.some((selected) => {
          const matches = subjectMatchMap[selected] || [selected]
          return (course.subjects || []).some((subject) =>
            matches.includes(subject)
          )
        })
      if (!matchesSubject) return false

      if (!needle) return true
      const searchable =
        `${course.title} ${course.description} ${course.meta}`.toLowerCase()
      return searchable.includes(needle)
    })

    if (!needle && activeSubjects.length === 0) {
      return subset.slice(0, 14)
    }

    return subset
  }, [activeSubjects, courses, query])

  const filteredCoursePaths = React.useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return coursePaths
    return coursePaths.filter((course) => {
      const searchable =
        `${course.title} ${course.description} ${course.meta}`.toLowerCase()
      return searchable.includes(needle)
    })
  }, [coursePaths, query])

  const filteredLearningPaths = React.useMemo(() => {
    const needle = query.trim().toLowerCase()
    return learningPaths.filter((path) => {
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
  }, [activeTopic, learningPaths, query])

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
            view === 'learning-paths'
              ? 'All learning paths workspace'
              : 'All courses workspace'
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
            courses={filteredCourses}
            coursePaths={filteredCoursePaths}
            coursePathsReady={coursePathsReady}
            coursePathQuery={query.trim()}
            learningPaths={filteredLearningPaths}
            learningPathsReady={learningPathsReady}
            topicActive={Boolean(activeTopic)}
          />
        </section>
        <HomeFooterSection />
      </main>
    </>
  )
}
