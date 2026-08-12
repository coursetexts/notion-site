import * as React from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'

import { CuratedCourse } from '@/components/CuratedCourse'
import { HomeFooterSection } from '@/components/HomeFooterSection'
import { HomeHeader } from '@/components/HomeHeader'
import { DEFAULT_CURATED_COURSE_SLUG } from '@/lib/curated-course-seed'

/**
 * Standalone syllabus + curated video library page.
 * Query: ?slug=fluid-mechanics (defaults to Fluid Mechanics seed / DB row).
 */
export default function CuratedCourseLegacyPage() {
  const router = useRouter()
  const slugParam = router.query.slug
  const slug =
    typeof slugParam === 'string' && slugParam.trim()
      ? slugParam.trim()
      : DEFAULT_CURATED_COURSE_SLUG

  return (
    <>
      <Head>
        <title>Course Videos | Coursetexts</title>
        <meta
          name='description'
          content='Browse a course syllabus with curated, ordered videos for each topic.'
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
        <CuratedCourse key={slug} slug={slug} />
        <HomeFooterSection />
      </main>
    </>
  )
}
