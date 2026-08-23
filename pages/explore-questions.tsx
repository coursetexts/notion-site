import * as React from 'react'
import Head from 'next/head'

import { ExploreQuestions } from '@/components/ExploreQuestions'
import { HomeFooterSection } from '@/components/HomeFooterSection'
import { HomeHeader } from '@/components/HomeHeader'

export default function ExploreQuestionsPage() {
  return (
    <>
      <Head>
        <title>Explore Questions | Coursetexts</title>
        <meta
          name='description'
          content='Search open questions, attach a reading list, and join the discussion.'
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
        <ExploreQuestions />
        <HomeFooterSection />
      </main>
    </>
  )
}
