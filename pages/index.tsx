import * as React from 'react'
import Head from 'next/head'
import { GetStaticProps } from 'next'
import { useRouter } from 'next/router'
import { ExtendedRecordMap } from 'notion-types'
import { getBlockParentPage, getBlockTitle, getPageProperty, idToUuid } from 'notion-utils'

import { HomeBlogSection } from '@/components/HomeBlogSection'
import { HomeCoursesSection, HomeCourseCard } from '@/components/HomeCoursesSection'
import { HomeDonateSection } from '@/components/HomeDonateSection'
import { HomeDotGrid } from '@/components/HomeDotGrid'
import { HomeHero } from '@/components/HomeHero'
import { HomeFooterSection } from '@/components/HomeFooterSection'
import { HomeLearnSection } from '@/components/HomeLearnSection'
import { HomeHeader } from '@/components/HomeHeader'
import { rootNotionPageId } from '@/lib/config'
import { getSiteMap } from '@/lib/get-site-map'

type HomePageProps = {
  courses: HomeCourseCard[]
}

const SUBJECT_OPTIONS = ['Science', 'Math', 'Sociology', 'English'] as const
const DEFAULT_COURSE_DESCRIPTION = 'Explore this course on Coursetexts.'
type HomeSubject = (typeof SUBJECT_OPTIONS)[number]

function toText(value: unknown): string {
  if (value == null) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }
  if (Array.isArray(value)) {
    return value.map((item) => toText(item)).filter(Boolean).join(' ').trim()
  }
  if (typeof value === 'object') {
    const candidate = (value as { name?: unknown }).name
    if (typeof candidate === 'string') return candidate
    try {
      return JSON.stringify(value)
    } catch {
      return ''
    }
  }
  return ''
}

function clip(text: string, max = 128): string {
  if (text.length <= max) return text
  return `${text.slice(0, max).trimEnd()}…`
}

function firstSentence(text: string, max = 150): string {
  const normalized = text.replace(/\s+/g, ' ').trim()
  if (!normalized) return ''

  const sentenceMatch = normalized.match(/^(.+?[.!?])(?:\s|$)/)
  const candidate = (sentenceMatch?.[1] || normalized).trim()
  return clip(candidate, max)
}

function isLikelyInstructorLine(text: string): boolean {
  const normalized = text.replace(/\s+/g, ' ').trim()
  if (!normalized) return true

  if (
    /\b(professor|instructor|lecturer|teaching assistant|ta|faculty|staff)\b/i.test(
      normalized
    )
  ) {
    return true
  }

  if (/^(dr|prof)\.?\s+/i.test(normalized)) {
    return true
  }

  // Most descriptions are sentence-like; this catches short "Firstname Lastname" lines.
  if (
    !/[.!?]/.test(normalized) &&
    /^[A-Z][a-z'`.-]+(?:\s+[A-Z][a-z'`.-]+){1,3}$/.test(normalized)
  ) {
    return true
  }

  return false
}

function isUsableDescriptionSentence(text: string): boolean {
  const normalized = text.replace(/\s+/g, ' ').trim()
  if (!normalized) return false
  if (isLikelySchoolDateLine(normalized) || isLikelyInstructorLine(normalized)) {
    return false
  }
  if (normalized.split(/\s+/).length < 5) return false
  return true
}

function cleanCourseTitle(rawTitle: string): string {
  const trimmed = rawTitle.trim()

  const withoutTrailingCode = trimmed.replace(
    /\s*\(([A-Z]{2,}\s*\d{1,4}[A-Z0-9-]*)\)\s*$/i,
    ''
  )

  const withoutLeadingCode = withoutTrailingCode.replace(
    /^\(?([A-Z]{2,}\s*\d{1,4}[A-Z0-9-]*)\)?\s*[:\-–]\s*/i,
    ''
  )

  return withoutLeadingCode.trim()
}

function isLikelySchoolDateLine(text: string): boolean {
  const value = text.trim()
  if (!value) return false

  const hasTerm = /(spring|summer|fall|winter|semester|quarter|\b20\d{2}\b)/i.test(
    value
  )
  const hasSeparator = /[|/]/.test(value)
  const hasSchool =
    /\b(university|college|institute|mit|harvard|stanford|waterloo|princeton|nyu|yale|columbia|cornell|berkeley)\b/i.test(
      value
    )

  return (hasTerm && hasSeparator) || (hasTerm && hasSchool)
}

function getChildBlockText(
  recordMap: ExtendedRecordMap,
  childId: string | undefined
): string {
  if (!childId) return ''
  const child = recordMap.block?.[childId]?.value
  if (!child) return ''
  return (getBlockTitle(child, recordMap) || '').replace(/\s+/g, ' ').trim()
}

function extractCourseFallbackContent(
  block: any,
  recordMap: ExtendedRecordMap
): {
  schoolDate: string
  descriptionSentence: string
} {
  const childIds = Array.isArray(block?.content) ? block.content : []
  const firstBlockText = getChildBlockText(recordMap, childIds[0])
  const thirdBlockText = getChildBlockText(recordMap, childIds[2])

  const schoolDate = isLikelySchoolDateLine(firstBlockText) ? firstBlockText : ''
  const thirdSentence = thirdBlockText ? firstSentence(thirdBlockText) : ''
  if (isUsableDescriptionSentence(thirdSentence)) {
    return { schoolDate, descriptionSentence: thirdSentence }
  }

  for (const childId of childIds.slice(1, 24)) {
    const childText = getChildBlockText(recordMap, childId)
    if (!childText || isLikelySchoolDateLine(childText)) continue
    const sentence = firstSentence(childText)
    if (isUsableDescriptionSentence(sentence)) {
      return { schoolDate, descriptionSentence: sentence }
    }
  }

  return { schoolDate, descriptionSentence: '' }
}

function looksLikeTerm(value: string): boolean {
  return /(spring|summer|fall|winter|semester|quarter|term|\b20\d{2}\b)/i.test(
    value
  )
}

function inferSchoolFromText(text: string): string {
  const normalized = text.toLowerCase()

  const schools: Array<[RegExp, string]> = [
    [/\bharvard\b/i, 'Harvard University'],
    [/\bstanford\b/i, 'Stanford University'],
    [/\bwaterloo\b/i, 'University of Waterloo'],
    [/\bubc\b|\bbritish columbia\b/i, 'University of British Columbia'],
    [/\bprinceton\b/i, 'Princeton University'],
    [/\bnew york university\b|\bnyu\b/i, 'New York University'],
    [/\bmassachusetts institute of technology\b|\bmit\b/i, 'MIT']
  ]

  for (const [pattern, name] of schools) {
    if (pattern.test(normalized)) return name
  }

  return ''
}

function parseSchoolDate(raw: string): { school: string; term: string } {
  const value = raw.replace(/\s+/g, ' ').trim()
  if (!value) return { school: '', term: '' }

  const segments = value
    .split(/[|/]/)
    .map((item) => item.trim())
    .filter(Boolean)

  if (segments.length >= 2) {
    const first = segments[0]
    const second = segments[1]
    const firstTerm = looksLikeTerm(first)
    const secondTerm = looksLikeTerm(second)

    if (firstTerm && !secondTerm) return { school: second, term: first }
    if (secondTerm && !firstTerm) return { school: first, term: second }
    return { school: first, term: second }
  }

  if (looksLikeTerm(value)) {
    return { school: '', term: value }
  }

  return { school: value, term: '' }
}

function formatSchoolDisplayName(school: string): string {
  const trimmed = school.trim()
  if (!trimmed) return ''

  if (/^harvard university$/i.test(trimmed)) return 'Harvard'
  if (/^princeton university$/i.test(trimmed)) return 'Princeton'
  if (/^yale university$/i.test(trimmed)) return 'Yale'
  if (/^columbia university$/i.test(trimmed)) return 'Columbia'

  return trimmed
}

function buildCourseMeta(params: {
  schoolDate: string
  school: string
  term: string
  title: string
  pagePath: string
  description: string
}): string {
  const parsed = parseSchoolDate(params.schoolDate)

  let school = parsed.school || params.school.trim()
  const term = parsed.term || params.term.trim()

  if (/^course$/i.test(school)) {
    school = ''
  }

  if (!school) {
    school = inferSchoolFromText(
      `${params.title} ${params.pagePath} ${params.description}`
    )
  }

  school = formatSchoolDisplayName(school)

  if (school && term) return `${school} / ${term}`
  if (school) return school
  if (term) return term

  return (
    inferSchoolFromText(`${params.title} ${params.pagePath}`) ||
    'Harvard / Spring 2024'
  )
}

function pickRandom<T>(items: T[], count: number): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy.slice(0, count)
}

function fallbackCourses(): HomeCourseCard[] {
  const fallbackMeta = [
    'Harvard University / Fall 2024',
    'Stanford University / Fall 2024',
    'University of Waterloo / Winter 2025',
    'MIT / Spring 2025'
  ]

  return Array.from({ length: 8 }).map((_, index) => ({
    id: `fallback-${index + 1}`,
    href: '/',
    meta: fallbackMeta[index % fallbackMeta.length],
    title: 'Global & Visual Digital Culture',
    description:
      'Investigate digital media as a convergence-point where technical-systems, economic-imperatives, and power-structures collide',
    subjects: [SUBJECT_OPTIONS[index % SUBJECT_OPTIONS.length]]
  }))
}

function parseSubjectsParam(value: string | string[] | undefined): HomeSubject[] {
  const raw = Array.isArray(value) ? value.join(',') : value || ''

  if (!raw.trim()) return []

  const normalized = raw
    .split(',')
    .map((subject) => subject.trim().toLowerCase())
    .filter(Boolean)

  return SUBJECT_OPTIONS.filter((subject) =>
    normalized.includes(subject.toLowerCase())
  )
}

function sameSubjects(a: HomeSubject[], b: HomeSubject[]): boolean {
  if (a.length !== b.length) return false
  return a.every((subject, index) => subject === b[index])
}

function inferSubjects(params: {
  fallbackSeed: string
  pagePath: string
  title: string
  description: string
  schoolDate: string
  subjectHints: string
}): HomeSubject[] {
  const text = `${params.subjectHints} ${params.title} ${params.description} ${params.pagePath} ${params.schoolDate}`
    .toLowerCase()
    .replace(/\s+/g, ' ')

  const results: HomeSubject[] = []

  if (
    /\b(science|biology|biological|chemistry|chemical|physics|neuroscience|engineering|astronomy|geology|biochem|ecology|genetics|medicine)\b/.test(
      text
    )
  ) {
    results.push('Science')
  }

  if (
    /\b(math|maths|mathematics|calculus|algebra|geometry|trigonometry|probability|statistics|statistical|topology|number theory|linear algebra)\b/.test(
      text
    )
  ) {
    results.push('Math')
  }

  if (
    /\b(sociology|social|anthropology|politics|political|history|economics|economic|psychology|culture|public policy|law|philosophy|ethics)\b/.test(
      text
    )
  ) {
    results.push('Sociology')
  }

  if (
    /\b(english|writing|literature|poetry|grammar|rhetoric|linguistics|language|composition|creative writing)\b/.test(
      text
    )
  ) {
    results.push('English')
  }

  if (results.length > 0) {
    return SUBJECT_OPTIONS.filter((subject) => results.includes(subject))
  }

  let hash = 0
  for (let index = 0; index < params.fallbackSeed.length; index += 1) {
    hash = (hash << 5) - hash + params.fallbackSeed.charCodeAt(index)
    hash |= 0
  }
  const deterministicSubject =
    SUBJECT_OPTIONS[Math.abs(hash) % SUBJECT_OPTIONS.length]
  return [deterministicSubject]
}

export const getStaticProps: GetStaticProps<HomePageProps> = async () => {
  try {
    const siteMap = await getSiteMap()
    const excludedPaths = new Set([
      '',
      'why',
      'about',
      'process',
      'feed',
      'profile',
      'signin',
      'privacy-policy',
      'terms-of-service'
    ])

    const pool: HomeCourseCard[] = []

    for (const [pagePath, pageId] of Object.entries(siteMap.canonicalPageMap)) {
      if (excludedPaths.has(pagePath)) continue

      const recordMap = siteMap.pageMap[pageId] as ExtendedRecordMap
      if (!recordMap?.block) continue

      const keys = Object.keys(recordMap.block)
      const block = recordMap.block?.[keys[0]]?.value
      if (!block || block.type !== 'page') continue

      const title = (getBlockTitle(block, recordMap) || '').trim()
      if (!title) continue

      const parentPage = getBlockParentPage(block, recordMap)
      const isBlogPost =
        block.parent_table === 'collection' &&
        parentPage?.id === idToUuid(rootNotionPageId)

      const published = getPageProperty<number>('Published', block, recordMap)
      if (isBlogPost || !!published) continue

      const descriptionRaw =
        getPageProperty<string>('Description', block, recordMap) ??
        getPageProperty<string>('Summary', block, recordMap) ??
        ''
      const description = toText(descriptionRaw).replace(/\s+/g, ' ').trim()
      const fallbackContent = extractCourseFallbackContent(block, recordMap)
      const descriptionSentence = firstSentence(description)

      const safeDescriptionSentence = isUsableDescriptionSentence(
        descriptionSentence
      )
        ? descriptionSentence
        : ''

      const schoolDateRaw =
        getPageProperty<string>('School | Date', block, recordMap) ??
        getPageProperty<string>('School / Date', block, recordMap) ??
        getPageProperty<string>('School', block, recordMap) ??
        ''
      const schoolDate = toText(schoolDateRaw).trim() || fallbackContent.schoolDate

      const schoolRaw =
        getPageProperty<string>('School', block, recordMap) ??
        getPageProperty<string>('University', block, recordMap) ??
        getPageProperty<string>('Institution', block, recordMap) ??
        ''
      const school = toText(schoolRaw).trim()

      const termRaw =
        getPageProperty<string>('Term', block, recordMap) ??
        getPageProperty<string>('Semester', block, recordMap) ??
        getPageProperty<string>('Quarter', block, recordMap) ??
        getPageProperty<string>('Season', block, recordMap) ??
        getPageProperty<string>('Year', block, recordMap) ??
        getPageProperty<string>('Date', block, recordMap) ??
        ''
      const term = toText(termRaw).trim()

      const subjectHintsRaw =
        getPageProperty<string>('Subject', block, recordMap) ??
        getPageProperty<string>('Subjects', block, recordMap) ??
        getPageProperty<string>('Topic', block, recordMap) ??
        getPageProperty<string>('Topics', block, recordMap) ??
        getPageProperty<string>('Field', block, recordMap) ??
        getPageProperty<string>('Department', block, recordMap) ??
        ''
      const subjectHints = toText(subjectHintsRaw).trim()

      const looksLikeCourse =
        /[a-z]{2,}[-\s]?\d{2,}/i.test(title) ||
        /course|lecture|syllabus|module|seminar/i.test(description) ||
        description.length > 30

      if (!looksLikeCourse) continue

      pool.push({
        id: pageId,
        href: `/${pagePath}`,
        meta: buildCourseMeta({
          schoolDate,
          school,
          term,
          title,
          pagePath,
          description
        }),
        title: clip(cleanCourseTitle(title) || title, 64),
        description: clip(
          safeDescriptionSentence ||
            fallbackContent.descriptionSentence ||
            DEFAULT_COURSE_DESCRIPTION,
          150
        ),
        subjects: inferSubjects({
          fallbackSeed: pageId,
          pagePath,
          title,
          description,
          schoolDate,
          subjectHints
        })
      })
    }

    const courses = pool.length > 0 ? pickRandom(pool, pool.length) : fallbackCourses()

    return {
      props: { courses },
      revalidate: 600
    }
  } catch (error) {
    console.error('home page courses load failed', error)
    return {
      props: { courses: fallbackCourses() },
      revalidate: 120
    }
  }
}

export default function HomePage({ courses }: HomePageProps) {
  const router = useRouter()

  React.useEffect(() => {
    if (!router.isReady) return

    const legacySubjectRaw = router.query.subject
    const legacySchoolRaw = router.query.school

    const legacySubject = Array.isArray(legacySubjectRaw)
      ? legacySubjectRaw[0]
      : legacySubjectRaw
    const legacySchool = Array.isArray(legacySchoolRaw)
      ? legacySchoolRaw[0]
      : legacySchoolRaw

    if (!legacySubject && !legacySchool) return

    const nextQuery: Record<string, string> = {}

    if (legacySubject?.trim()) {
      const normalizedSubject = /^maths$/i.test(legacySubject.trim())
        ? 'Math'
        : legacySubject.trim()
      nextQuery.subjects = normalizedSubject
    }

    if (legacySchool?.trim()) {
      nextQuery.q = legacySchool.trim()
    }

    void router.replace(
      {
        pathname: '/all-courses',
        query: nextQuery
      },
      undefined,
      { shallow: true }
    )
  }, [router])

  const querySubjects = React.useMemo(
    () => parseSubjectsParam(router.query.subjects as string | string[] | undefined),
    [router.query.subjects]
  )
  const [activeSubjects, setActiveSubjects] = React.useState<HomeSubject[]>(querySubjects)

  React.useEffect(() => {
    if (!router.isReady) return
    setActiveSubjects((current) =>
      sameSubjects(current, querySubjects) ? current : querySubjects
    )
  }, [querySubjects, router.isReady])

  React.useEffect(() => {
    if (!router.isReady || sameSubjects(querySubjects, activeSubjects)) return

    const nextQuery: Record<string, string | string[]> = {
      ...router.query
    } as Record<string, string | string[]>

    if (activeSubjects.length > 0) {
      nextQuery.subjects = activeSubjects.join(',')
    } else {
      delete nextQuery.subjects
    }

    void router.replace(
      {
        pathname: router.pathname,
        query: nextQuery
      },
      undefined,
      { shallow: true, scroll: false }
    )
  }, [activeSubjects, querySubjects, router])

  const handleSubjectToggle = React.useCallback((subject: string) => {
    if (!SUBJECT_OPTIONS.includes(subject as HomeSubject)) return

    setActiveSubjects((current) => {
      const typedSubject = subject as HomeSubject
      const next = current.includes(typedSubject)
        ? current.filter((item) => item !== typedSubject)
        : [...current, typedSubject]

      return SUBJECT_OPTIONS.filter((item) => next.includes(item))
    })
  }, [])

  const filteredCourses = React.useMemo(() => {
    const subset =
      activeSubjects.length === 0
        ? courses
        : courses.filter((course) =>
            (course.subjects || []).some((subject) =>
              activeSubjects.includes(subject as HomeSubject)
            )
          )

    return subset.slice(0, 8)
  }, [activeSubjects, courses])

  return (
    <>
      <Head>
        <title>Coursetexts</title>
        <link rel='preconnect' href='https://use.typekit.net' />
        <link rel='preconnect' href='https://p.typekit.net' />
        <link rel='stylesheet' href='https://use.typekit.net/vxh3dki.css' />
        <link rel='preconnect' href='https://fonts.googleapis.com' />
        <link rel='preconnect' href='https://fonts.gstatic.com' crossOrigin='' />
        <link
          href='https://fonts.googleapis.com/css2?family=Bad+Script&family=Hanken+Grotesk:ital,wght@0,100..900;1,100..900&display=swap'
          rel='stylesheet'
        />
      </Head>

      <main
        style={{
          '--home-side': 'clamp(20px, 4.03vw, 58px)',
          '--home-main-max': '1324px',
          '--home-content-max': '640px',
          '--home-footer-side': 'max(28px, 15.28vw)',
          minHeight: '100vh',
          background: 'var(--footer, #F8F7F4)',
          display: 'flex',
          flexDirection: 'column'
        } as React.CSSProperties}
      >
        <HomeHeader />
        <HomeHero
          activeSubjects={activeSubjects}
          onSubjectToggle={handleSubjectToggle}
        />
        <HomeDotGrid />
        <HomeCoursesSection
          courses={filteredCourses}
          activeSubjects={activeSubjects}
          onSubjectToggle={handleSubjectToggle}
        />
        <HomeLearnSection />
        <HomeDonateSection />
        <HomeBlogSection />
        <HomeFooterSection />
      </main>
    </>
  )
}
