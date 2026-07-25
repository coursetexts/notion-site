import * as React from 'react'
import type { GetStaticPaths, GetStaticProps } from 'next'
import Head from 'next/head'

import { HomeFooterSection } from '@/components/HomeFooterSection'
import { HomeHeader } from '@/components/HomeHeader'
import { DegreeCurriculumDetail } from '@/components/UndergraduateDegreesList'
import type { DegreeLevel } from '@/components/UndergraduateDegreesTopSection'
import { name as siteName } from '@/lib/config'
import { getDegreeDisplayName } from '@/lib/degrees-directory'
import { GRADUATE_DEGREE_SECTIONS } from '@/lib/graduate-degree-sections'
import { graduateDegrees } from '@/lib/graduate-degrees'
import { undergraduateDegrees } from '@/lib/undergraduate-degree-data'
import { UNDERGRADUATE_DEGREE_SECTIONS } from '@/lib/undergraduate-degree-sections'
import type { UndergraduateDegree } from '@/lib/undergraduate-degrees'

import styles from './DegreePage.module.css'

type DegreePageProps = {
  degree: UndergraduateDegree
  level: DegreeLevel
  sectionTitle: string
}

const LEVEL_LABELS: Record<DegreeLevel, string> = {
  undergraduate: 'Undergraduate Degrees',
  graduate: 'Graduate Degrees'
}

const LEVEL_COPY: Record<DegreeLevel, string> = {
  undergraduate:
    'A curated course sequence for self learners, with syllabus topics and links to world-class resources.',
  graduate:
    'A curated graduate course sequence for self learners, with syllabus topics and links to world-class resources.'
}

function getSectionTitle(level: DegreeLevel, degreeId: string): string {
  const sections =
    level === 'graduate'
      ? GRADUATE_DEGREE_SECTIONS
      : UNDERGRADUATE_DEGREE_SECTIONS

  return (
    sections.find((section) => section.degreeIds.includes(degreeId))?.title ??
    'Degree curriculum'
  )
}

export default function DegreePage({
  degree,
  level,
  sectionTitle
}: DegreePageProps) {
  const degreeName = getDegreeDisplayName(degree.name)
  const directoryUrl =
    level === 'graduate' ? '/degrees?level=graduate' : '/degrees'

  return (
    <>
      <Head>
        <title>{`${degreeName} – ${siteName}`}</title>
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
        <section className={styles.hero} aria-labelledby='degree-page-title'>
          <a href={directoryUrl} className={styles.backLink}>
            <span aria-hidden='true'>←</span>
            All {LEVEL_LABELS[level].toLowerCase()}
          </a>
          <p className={styles.eyebrow}>{sectionTitle}</p>
          <h1 id='degree-page-title' className={styles.title}>
            {degreeName}
          </h1>
          <p className={styles.intro}>{LEVEL_COPY[level]}</p>
          <p className={styles.courseCount}>
            {degree.courses.length}{' '}
            {degree.courses.length === 1 ? 'course' : 'courses'} in this
            curriculum
          </p>
        </section>
        <section className={styles.curriculum} aria-label='Course curriculum'>
          <DegreeCurriculumDetail degree={degree} sectionTitle={sectionTitle} />
        </section>
        <HomeFooterSection />
      </main>
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => ({
  paths: [
    ...undergraduateDegrees.map((degree) => ({
      params: { level: 'undergraduate', degreeId: degree.id }
    })),
    ...graduateDegrees.map((degree) => ({
      params: { level: 'graduate', degreeId: degree.id }
    }))
  ],
  fallback: false
})

export const getStaticProps: GetStaticProps<DegreePageProps> = async ({
  params
}) => {
  const level = params?.level === 'graduate' ? 'graduate' : 'undergraduate'
  const degreeId =
    typeof params?.degreeId === 'string' ? params.degreeId : undefined
  const degrees = level === 'graduate' ? graduateDegrees : undergraduateDegrees
  const degree = degrees.find((candidate) => candidate.id === degreeId)

  if (!degree) {
    return { notFound: true }
  }

  return {
    props: {
      degree,
      level,
      sectionTitle: getSectionTitle(level, degree.id)
    }
  }
}
