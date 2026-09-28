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
            <div className={styles.body}>
              <p>
                Are you a professor who has created a course curriculum or have
                taught a course? We on the Coursetexts team would love to allow
                learners from all around the world to learn from your expertise!
              </p>
              <p>
                We have worked directly with over 50 professors from
                universities such as Harvard and Yale to open-access their course
                materials. You can see examples of previous courses we&apos;ve
                open-accessed{' '}
                <Link href='/all-courses' legacyBehavior>
                  <a className={styles.inlineLink}>here</a>
                </Link>
                .
              </p>
              <p>
                CourseTexts handles permissions, licensing, distribution,
                attribution, and copyright protection for you. Open-accessing a
                course can take less than an hour of your time to benefit
                thousands of students and self-learners.
              </p>
              <p>
                If you&apos;d like to know more, please reach out to our team by
                emailing{' '}
                <a
                  className={styles.inlineLink}
                  href='mailto:coursetexts.info@gmail.com'
                >
                  coursetexts.info@gmail.com
                </a>
                !
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
