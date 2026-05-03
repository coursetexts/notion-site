import * as React from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'

import { AllCoursesNewGridSection } from '@/components/AllCoursesNewGridSection'
import { AllCoursesNewTopSection } from '@/components/AllCoursesNewTopSection'
import type { HomeCourseCard } from '@/components/HomeCoursesSection'
import type { NotionHomeDebugPayload } from './index'
import { HomeFooterSection } from '@/components/HomeFooterSection'
import { HomeHeader } from '@/components/HomeHeader'

type AllCoursesPageProps = {
  courses: HomeCourseCard[]
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

export { getStaticProps } from './index'

export default function AllCoursesPage({
  courses,
  notionHomeDebug
}: AllCoursesPageProps) {
  const router = useRouter()
  const [query, setQuery] = React.useState('')
  const [activeSubjects, setActiveSubjects] = React.useState<HomeSubject[]>([])

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
    if (!router.isReady) return

    const urlQuery = Array.isArray(router.query.q)
      ? router.query.q[0] || ''
      : (router.query.q as string | undefined) || ''
    const urlSubjects = parseSubjectsParam(
      router.query.subjects as string | string[] | undefined
    )

    setQuery((current) => (current === urlQuery ? current : urlQuery))
    setActiveSubjects((current) =>
      sameSubjects(current, urlSubjects) ? current : urlSubjects
    )
  }, [router.isReady, router.query.q, router.query.subjects])

  const updateUrl = React.useCallback(
    (nextQuery: string, nextSubjects: HomeSubject[]) => {
      if (!router.isReady) return

      const trimmedQuery = nextQuery.trim()
      const nextRouteQuery: Record<string, string> = {}

      if (trimmedQuery) {
        nextRouteQuery.q = trimmedQuery
      }

      if (nextSubjects.length > 0) {
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
    updateUrl(query, activeSubjects)
  }, [activeSubjects, query, updateUrl])

  const handleSubjectToggle = React.useCallback(
    (subject: string) => {
      if (!SUBJECT_OPTIONS.includes(subject as HomeSubject)) return

      setActiveSubjects((current) => {
        const typedSubject = subject as HomeSubject
        const next = current.includes(typedSubject)
          ? current.filter((item) => item !== typedSubject)
          : [...current, typedSubject]
        const ordered = SUBJECT_OPTIONS.filter((item) => next.includes(item))

        updateUrl(query, ordered)
        return ordered
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
          href='https://fonts.googleapis.com/css2?family=Bad+Script&family=Hanken+Grotesk:ital,wght@0,100..900;1,100..900&display=swap'
          rel='stylesheet'
        />
      </Head>

      <main
        style={
          {
            '--home-side': 'clamp(20px, 4.03vw, 58px)',
            '--home-main-max': '1324px',
            '--home-content-max': '640px',
            '--home-footer-side': 'max(28px, 15.28vw)',
            minHeight: '100vh',
            background: 'var(--footer, #F8F7F4)',
            display: 'flex',
            flexDirection: 'column'
          } as React.CSSProperties
        }
      >
        <HomeHeader />
        <section style={{ flex: 1 }} aria-label='All courses workspace'>
          <AllCoursesNewTopSection
            query={query}
            activeSubjects={activeSubjects}
            onQueryChange={setQuery}
            onSubjectToggle={handleSubjectToggle}
            onSearchSubmit={handleSearchSubmit}
          />
          <AllCoursesNewGridSection courses={filteredCourses} />
        </section>
        <HomeFooterSection />
      </main>
    </>
  )
}
