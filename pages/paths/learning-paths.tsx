import * as React from 'react'
import Head from 'next/head'

import { HomeFooterSection } from '@/components/HomeFooterSection'
import { HomeHeader } from '@/components/HomeHeader'
import { LearningPathsIndex } from '@/components/LearningPathsIndex'

export default function LearningPathsPage() {
  return (
    <>
      <Head>
        <title>Learning paths | Coursetexts</title>
        <meta
          name='description'
          content='Browse learning paths and study circles the community is joining — or start from your own goal.'
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
        <LearningPathsIndex />
        <HomeFooterSection />
      </main>
    </>
  )
}
