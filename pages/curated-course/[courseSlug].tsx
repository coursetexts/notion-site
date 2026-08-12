import * as React from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'

import { CuratedCourse } from '@/components/CuratedCourse'
import { HomeFooterSection } from '@/components/HomeFooterSection'
import { HomeHeader } from '@/components/HomeHeader'
import { DEFAULT_CURATED_COURSE_SLUG } from '@/lib/curated-course-seed'

/**
 * Curated-course video library for a degrees-page course.
 * Path: /curated-course/[courseSlug]
 */
export default function CuratedCoursePage() {
  const router = useRouter()
  const raw = router.query.courseSlug
  const slug =
    typeof raw === 'string' && raw.trim()
      ? raw.trim()
      : DEFAULT_CURATED_COURSE_SLUG

  const titleLabel = slug
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')

  return (
    <>
      <Head>
        <title>
          {titleLabel ? `${titleLabel} Videos` : 'Course Videos'} | Coursetexts
        </title>
        <meta
          name='description'
          content={`Browse the curated video syllabus for ${
            titleLabel || 'this course'
          }.`}
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
        {router.isReady ? (
          <CuratedCourse key={slug} slug={slug} />
        ) : (
          <div style={{ padding: '48px var(--home-side)' }}>Loading…</div>
        )}
        <HomeFooterSection />
      </main>
    </>
  )
}
