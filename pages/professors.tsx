import * as React from 'react'
import Head from 'next/head'
import Link from 'next/link'

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

export default function ProfessorsPage() {
  return (
    <>
      <Head>
        <title>For Professors · Coursetexts</title>
        <meta
          name='description'
          content='Contribute materials or publish a course with Coursetexts.'
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

        <section className={styles.section} aria-labelledby='professors-title'>
          <div className={styles.container}>
            <h1 id='professors-title' className={styles.title}>
              For Professors
            </h1>
            <p className={styles.lede}>
              Contribute materials or publish a course.
            </p>
            <div className={styles.body}>
              <p>
                Coursetexts works with professors to publish advanced course
                notes as open, durable texts. We handle partnership, permissions,
                licensing, and provenance so students can read the material
                without a paywall or a decaying LMS.
              </p>
              <p>
                If you would like us to open-source lecture notes, problem sets,
                or a full course, write to us. We will walk through rights,
                attribution, and how the course would appear on the site.
              </p>
            </div>
            <div className={styles.actions}>
              <a
                className={styles.primary}
                href='mailto:coursetexts.info@gmail.com?subject=Publish%20a%20course%20on%20Coursetexts'
              >
                Get in touch
              </a>
              <Link href='/process' legacyBehavior>
                <a className={styles.secondary}>How we publish →</a>
              </Link>
            </div>
          </div>
        </section>

        <HomeFooterSection />
      </main>
    </>
  )
}
