import * as React from 'react'
import Head from 'next/head'

import { HomeFooterSection } from '@/components/HomeFooterSection'
import { HomeHeader } from '@/components/HomeHeader'
import { KnowledgeGraphExplorer } from '@/components/KnowledgeGraphExplorer'

export default function KnowledgeGraphRoutePage() {
  return (
    <>
      <Head>
        <title>Knowledge graph | Coursetexts</title>
        <meta
          name='description'
          content='A map of knowledge components across Coursetexts learning paths, and the paths each topic reoccurs in.'
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
        <KnowledgeGraphExplorer />
        <HomeFooterSection />
      </main>
    </>
  )
}
