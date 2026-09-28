import * as React from 'react'
import Head from 'next/head'

import { HomeFooterSection } from '@/components/HomeFooterSection'
import { HomeHeader } from '@/components/HomeHeader'

import styles from './professors.module.css'

const homeChromeVars = {
  '--home-side': 'clamp(20px, 4.03vw, 58px)',
  '--home-main-max': '1324px',
  '--home-content-max': '640px',
  '--home-footer-side': 'max(28px, 15.28vw)',
  minHeight: '100vh',
  background: 'var(--footer, #F8F7F4)',
  display: 'flex',
  flexDirection: 'column'
} as React.CSSProperties

export default function TeamPage() {
  return (
    <>
      <Head>
        <title>Team · Coursetexts</title>
        <meta
          name='description'
          content='About us, and how you can join as a contributor.'
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

        <section className={styles.section} aria-labelledby='team-title'>
          <div className={styles.container}>
            <h1 id='team-title' className={styles.title}>
              The CourseTexts Team
            </h1>
            <div className={styles.body}>
              <p>
                If you&apos;d like to join our team of volunteers as a
                contributor, please{' '}
                <a
                  className={styles.inlineLink}
                  href='https://discord.gg/6xBECjtC55'
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  join our Discord
                </a>{' '}
                and say hi!
              </p>
            </div>
          </div>
        </section>

        <HomeFooterSection />
      </main>
    </>
  )
}
