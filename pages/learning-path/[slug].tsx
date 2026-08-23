import * as React from 'react'
import Head from 'next/head'
import type { GetServerSideProps } from 'next'

import { HomeFooterSection } from '@/components/HomeFooterSection'
import { HomeHeader } from '@/components/HomeHeader'
import { LearningPath } from '@/components/LearningPath'
import { SEEDED_LEARNING_PATHS_BY_SLUG } from '@/lib/learning-path-seed'
import { titleFromSlug } from '@/lib/learning-path-slug'

type LearningPathPageProps = {
  slug: string
}

export const getServerSideProps: GetServerSideProps<
  LearningPathPageProps
> = async (context) => {
  const raw = context.params?.slug
  const slug = typeof raw === 'string' ? raw : ''
  if (!slug) {
    return { notFound: true }
  }
  return { props: { slug } }
}

export default function LearningPathPage({ slug }: LearningPathPageProps) {
  const seeded = SEEDED_LEARNING_PATHS_BY_SLUG[slug]
  const title = seeded?.title ?? titleFromSlug(slug)
  const description =
    seeded?.summary ??
    'Start with a goal and map the knowledge you need to reach it.'

  return (
    <>
      <Head>
        <title>{`${title} | Learning path | Coursetexts`}</title>
        <meta name='description' content={description} />
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
        <LearningPath key={slug} slug={slug} />
        <HomeFooterSection />
      </main>
    </>
  )
}
