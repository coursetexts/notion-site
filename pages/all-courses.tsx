import * as React from 'react'
import type { GetStaticProps } from 'next'
import Head from 'next/head'
import { useRouter } from 'next/router'

import { CourseCardGrid, type HomeCourseCard } from '@/components/HomeCoursesSection'
import { HomeFooterSection } from '@/components/HomeFooterSection'
import { HomeHeader } from '@/components/HomeHeader'

import type { NotionHomeDebugPayload } from './index'
import styles from '@/components/AllCoursesOfficial.module.css'

const SUBJECT_OPTIONS = [
  {
    id: 'Science',
    label: 'Science',
    icon: '/images/home/science.png'
  },
  {
    id: 'Math',
    label: 'Math',
    icon: '/images/home/math.png'
  },
  {
    id: 'Art',
    label: 'Art',
    icon: '/images/home/sociology.png'
  },
  {
    id: 'Sociology',
    label: 'Sociology',
    icon: '/images/home/sociology.png'
  },
  {
    id: 'English',
    label: 'English',
    icon: '/images/home/english.png'
  }
] as const
type HomeSubject = (typeof SUBJECT_OPTIONS)[number]['id']

const SCHOOL_FILTERS = [
  {
    id: 'Stanford',
    label: 'Stanford University',
    icon: '/images/home/stanford.png'
  },
  {
    id: 'Harvard',
    label: 'Harvard University',
    icon: '/images/home/harvard-red.png'
  },
  {
    id: 'Yale',
    label: 'Yale University',
    icon: '/images/home/yale.png'
  },
  {
    id: 'Columbia',
    label: 'Columbia University',
    icon: '/images/home/columbia.png'
  },
  {
    id: 'Princeton',
    label: 'Princeton University',
    icon: '/images/home/princeton.png'
  }
] as const

type AllCoursesPageProps = {
  courses: HomeCourseCard[]
  notionHomeDebug?: NotionHomeDebugPayload | null
}

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
  return SUBJECT_OPTIONS.filter((subject) => selected.has(subject.id)).map(
    (subject) => subject.id
  )
}

function matchesCourseSubjects(
  course: HomeCourseCard,
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

function courseMatchesQuery(course: HomeCourseCard, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return `${course.title} ${course.meta} ${course.description}`
    .toLowerCase()
    .includes(q)
}

export const getStaticProps: GetStaticProps<AllCoursesPageProps> = async (
  ctx
) => {
  const { getStaticProps: getHomeStaticProps } = await import('./index')
  const home = await getHomeStaticProps(ctx)
  if (!('props' in home)) return home
  const props = home.props as AllCoursesPageProps
  return {
    props: {
      courses: props.courses,
      notionHomeDebug: props.notionHomeDebug ?? null
    },
    revalidate: 120
  }
}

export default function OfficialAllCoursesPage({
  courses,
  notionHomeDebug
}: AllCoursesPageProps) {
  const router = useRouter()
  const [query, setQuery] = React.useState('')
  const [activeSubjects, setActiveSubjects] = React.useState<HomeSubject[]>([])

  React.useEffect(() => {
    if (notionHomeDebug && typeof window !== 'undefined') {
      console.log(
        '%c[Coursetexts] Notion home debug (all-courses)',
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
    setQuery(urlQuery)
    setActiveSubjects(urlSubjects)
  }, [router.isReady, router.query.q, router.query.subjects])

  const updateUrl = React.useCallback(
    (next: { q?: string; subjects?: HomeSubject[] }) => {
      const params = new URLSearchParams()
      const q = next.q ?? query
      const subjects = next.subjects ?? activeSubjects
      if (q.trim()) params.set('q', q.trim())
      if (subjects.length > 0) params.set('subjects', subjects.join(','))
      const qs = params.toString()
      void router.replace(
        qs ? `/all-courses?${qs}` : '/all-courses',
        undefined,
        { shallow: true, scroll: false }
      )
    },
    [activeSubjects, query, router]
  )

  const handleSearchSubmit = React.useCallback(
    (event: React.FormEvent) => {
      event.preventDefault()
      updateUrl({ q: query })
    },
    [query, updateUrl]
  )

  const handleSubjectToggle = React.useCallback(
    (subject: HomeSubject) => {
      const next = activeSubjects.includes(subject)
        ? activeSubjects.filter((item) => item !== subject)
        : [...activeSubjects, subject]
      const ordered = SUBJECT_OPTIONS.filter((item) =>
        next.includes(item.id)
      ).map((item) => item.id)
      setActiveSubjects(ordered)
      updateUrl({ subjects: ordered })
    },
    [activeSubjects, updateUrl]
  )

  const filtered = React.useMemo(
    () =>
      courses.filter(
        (course) =>
          courseMatchesQuery(course, query) &&
          matchesCourseSubjects(course, activeSubjects)
      ),
    [activeSubjects, courses, query]
  )

  return (
    <>
      <Head>
        <title>All Courses | Coursetexts</title>
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
        <section className={styles.section} aria-label='All courses'>
          <div className={styles.topBand}>
            <div className={styles.topContent}>
              <h1 className={styles.title}>All Courses</h1>

              <form
                id='all-courses-search'
                className={styles.searchWrap}
                onSubmit={handleSearchSubmit}
              >
                <input
                  className={styles.searchInput}
                  type='search'
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder='What are you curious about?'
                  aria-label='Search courses'
                />
                <button type='submit' className={styles.searchButton}>
                  Search
                </button>
              </form>

              <div className={styles.subjectRow}>
                {SUBJECT_OPTIONS.map((subject) => {
                  const selected = activeSubjects.includes(subject.id)
                  return (
                    <button
                      key={subject.id}
                      type='button'
                      className={`${styles.subjectChip}${
                        selected ? ` ${styles.subjectChipSelected}` : ''
                      }`}
                      aria-pressed={selected}
                      onClick={() => handleSubjectToggle(subject.id)}
                    >
                      <img
                        src={subject.icon}
                        alt=''
                        className={styles.subjectIcon}
                        aria-hidden
                      />
                      <span>{subject.label}</span>
                    </button>
                  )
                })}
              </div>

              <div className={styles.schoolRow}>
                {SCHOOL_FILTERS.map((school) => (
                  <button
                    key={school.id}
                    type='button'
                    className={styles.schoolChip}
                    onClick={() => {
                      setQuery(school.id)
                      updateUrl({ q: school.id })
                    }}
                  >
                    <img
                      src={school.icon}
                      alt=''
                      className={styles.schoolIcon}
                      aria-hidden
                    />
                    <span>{school.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className={styles.gridBand}>
            <div className={styles.gridContent}>
              <CourseCardGrid
                className={styles.courseGridSpacious}
                cards={filtered}
                emptyMessage={
                  query.trim() || activeSubjects.length > 0
                    ? 'No courses matched your search.'
                    : 'No courses available yet.'
                }
              />
            </div>
          </div>
        </section>
        <HomeFooterSection />
      </main>
    </>
  )
}
