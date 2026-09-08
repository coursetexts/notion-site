import * as React from 'react'
import Head from 'next/head'

import { HomeDonateSection } from '@/components/HomeDonateSection'
import { HomeFooterSection } from '@/components/HomeFooterSection'
import { HomeHeader } from '@/components/HomeHeader'

import styles from './support.module.css'

const homeChromeVars = {
  '--home-side': 'clamp(20px, 4.03vw, 58px)',
  '--home-main-max': '1324px',
  '--home-content-max': '1000px',
  '--home-footer-side': 'max(28px, 15.28vw)',
  minHeight: '100vh',
  background: 'var(--footer, #F8F7F4)',
  display: 'flex',
  flexDirection: 'column'
} as React.CSSProperties

export default function SupportPage() {
  return (
    <>
      <Head>
        <title>Support Coursetexts</title>
        <meta
          name='description'
          content='Donate to Coursetexts and see how funding is used.'
        />
        <link rel='preconnect' href='https://use.typekit.net' />
        <link rel='preconnect' href='https://p.typekit.net' />
        <link rel='stylesheet' href='https://use.typekit.net/vxh3dki.css' />
        <link rel='preconnect' href='https://fonts.googleapis.com' />
        <link
          rel='preconnect'
          href='https://fonts.gstatic.com'
          crossOrigin='anonymous'
        />
        <link
          href='https://fonts.googleapis.com/css2?family=Hanken+Grotesk:ital,wght@0,100..900;1,100..900&display=swap'
          rel='stylesheet'
        />
      </Head>

      <main style={homeChromeVars}>
        <HomeHeader />

        <section className={styles.intro} aria-labelledby='support-title'>
          <div className={styles.container}>
            <h1 id='support-title' className={styles.title}>
              Support Coursetexts
            </h1>
            <p className={styles.lede}>
              Coursetexts is a registered 501(c)(3). Donations pay for
              open-sourcing courses — the people and tools that turn lecture
              notes into a public text with permissions, licensing, and
              provenance intact.
            </p>
          </div>
        </section>

        <HomeDonateSection />
        <HomeFooterSection />
      </main>
    </>
  )
}
