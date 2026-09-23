import * as React from 'react'
import { GetStaticProps } from 'next'
import Head from 'next/head'

import { CoursesHomeHero } from '@/components/CoursesHomeHero'
import { HomeBlogSection } from '@/components/HomeBlogSection'
import type { HomeCourseCard } from '@/components/HomeCoursesSection'
import { HomeDonateSection } from '@/components/HomeDonateSection'
import { HomeFooterSection } from '@/components/HomeFooterSection'
import { HomeHeader } from '@/components/HomeHeader'
import { HomeOpenCoursesSection } from '@/components/HomeOpenCoursesSection'
import { getCourseLearningPathSubject } from '@/lib/course-learning-path-subject'
import {
  type NotionHomeDebugPayload,
  fallbackNotionHomeCourses,
  loadNotionHomePageCourses
} from '@/lib/load-notion-home-courses'

export type { NotionHomeDebugPayload }

type HomePageProps = {
  courses: HomeCourseCard[]
  academicCourses?: HomeCourseCard[]
  notionHomeDebug?: NotionHomeDebugPayload | null
}

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
  const text = `${degreeId.replace(
    /-/g,
    ' '
  )} ${title} ${description}`.toLowerCase()
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

function coursePathToHomeCard(path: {
  id: string
  slug: string
  title: string
  description: string
  area?: string
}): HomeCourseCard {
  const subject = getCourseLearningPathSubject(path.slug, path.title, path.area)
  return {
    id: path.id,
    href: `/paths/learning-path/${path.slug}`,
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

async function loadHomeAcademicCourses(): Promise<HomeCourseCard[]> {
  const { listFilledCuratedCourseCatalog } = await import(
    '@/lib/curated-course-catalog'
  )
  return listFilledCuratedCourseCatalog().map(coursePathToHomeCard)
}

export const getStaticProps: GetStaticProps<HomePageProps> = async () => {
  try {
    const { courses, notionHomeDebug } = await loadNotionHomePageCourses()
    const academicCourses = await loadHomeAcademicCourses()

    return {
      props: { courses, academicCourses, notionHomeDebug },
      revalidate: 600
    }
  } catch (error) {
    console.error('home page courses load failed', error)
    const courses = fallbackNotionHomeCourses()
    const academicCourses = await loadHomeAcademicCourses().catch(() => [])
    console.log('[getStaticProps] courses (fallback)', courses)
    return {
      props: { courses, academicCourses, notionHomeDebug: null },
      revalidate: 120
    }
  }
}

export default function HomePage({ courses, notionHomeDebug }: HomePageProps) {
  React.useEffect(() => {
    if (notionHomeDebug && typeof window !== 'undefined') {
      console.log(
        '%c[Coursetexts] Notion home debug (from getStaticProps)',
        'color:#2563eb;font-weight:bold;',
        notionHomeDebug
      )
    }
  }, [notionHomeDebug])

  return (
    <>
      <Head>
        <title>Coursetexts</title>
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
          href='https://fonts.googleapis.com/css2?family=Hanken+Grotesk:ital,wght@0,100..900;1,100..900&family=Inter:wght@400;600&display=swap'
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
        <CoursesHomeHero courses={courses} />
        <HomeOpenCoursesSection courses={courses} />
        <HomeDonateSection />
        <HomeBlogSection />
        <HomeFooterSection />
      </main>
    </>
  )
}
