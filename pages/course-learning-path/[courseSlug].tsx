import * as React from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'

import { CourseLearningPath } from '@/components/CourseLearningPath'
import { HomeFooterSection } from '@/components/HomeFooterSection'
import { HomeHeader } from '@/components/HomeHeader'
import { DEFAULT_COURSE_LEARNING_PATH_SLUG } from '@/lib/course-learning-path-seed'

/**
 * Course learning path video library for a degrees-page course.
 * Path: /course-learning-path/[courseSlug]
 */
export default function CourseLearningPathPage() {
  const router = useRouter()
  const raw = router.query.courseSlug
  const slug =
    typeof raw === 'string' && raw.trim()
      ? raw.trim()
      : DEFAULT_COURSE_LEARNING_PATH_SLUG

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
            background: '#fff',
            display: 'flex',
            flexDirection: 'column'
          } as React.CSSProperties
        }
      >
        <HomeHeader />
        {router.isReady ? (
          <CourseLearningPath key={slug} slug={slug} />
        ) : (
          <div style={{ padding: '48px var(--home-side)' }}>Loading…</div>
        )}
        <HomeFooterSection />
      </main>
    </>
  )
}
