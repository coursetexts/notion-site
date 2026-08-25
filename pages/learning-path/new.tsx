import * as React from 'react'
import Head from 'next/head'
import type { GetServerSideProps } from 'next'

import { HomeFooterSection } from '@/components/HomeFooterSection'
import { HomeHeader } from '@/components/HomeHeader'
import { LearningPathBuilder } from '@/components/LearningPathBuilder'

type NewLearningPathPageProps = {
  initialGoal: string
}

export const getServerSideProps: GetServerSideProps<
  NewLearningPathPageProps
> = async (context) => {
  const raw = context.query.goal
  const initialGoal = typeof raw === 'string' ? raw.trim() : ''

  return { props: { initialGoal } }
}

export default function NewLearningPathPage({
  initialGoal
}: NewLearningPathPageProps) {
  return (
    <>
      <Head>
        <title>New learning path | Coursetexts</title>
        <meta
          name='description'
          content='Arrange the knowledge you need into an ordered outline, then follow the path.'
        />
        <link rel='preconnect' href='https://fonts.googleapis.com' />
        <link
          rel='preconnect'
          href='https://fonts.gstatic.com'
          crossOrigin='anonymous'
        />
        <link
          href='https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400..700;1,9..144,400..600&family=Inter:wght@300..700&display=swap'
          rel='stylesheet'
        />
      </Head>

      <main
        style={
          {
            '--home-side': 'clamp(20px, 4.03vw, 58px)',
            '--home-main-max': '1324px',
            '--home-content-max': '720px',
            '--home-footer-side': 'max(28px, 15.28vw)',
            minHeight: '100vh',
            background: 'var(--footer, #F8F7F4)',
            display: 'flex',
            flexDirection: 'column'
          } as React.CSSProperties
        }
      >
        <HomeHeader />
        <LearningPathBuilder initialGoal={initialGoal} />
        <HomeFooterSection />
      </main>
    </>
  )
}
