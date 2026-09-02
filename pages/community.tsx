import * as React from 'react'
import Head from 'next/head'
import Link from 'next/link'

import { CommunityLearning } from '@/components/CommunityLearning'
import {
  CommunitySchema,
  ResourceVoteSchemaDiagram
} from '@/components/CommunitySchema'
import { HomeFooterSection } from '@/components/HomeFooterSection'
import { HomeHeader } from '@/components/HomeHeader'

import styles from './community.module.css'

export default function CommunityPage() {
  return (
    <>
      <Head>
        <title>Community Learning Paths · Coursetexts</title>
        <meta
          name='description'
          content='Learning paths, study circles, frontier questions, and popular degrees and courses from the Coursetexts community.'
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

        <section
          className={styles.section}
          aria-label='Community Learning Paths'
        >
          <div className={styles.container}>
            <header className={styles.header}>
              <div className={styles.titleRow}>
                <h1 className={styles.title}>
                  Community <em>Learning Paths</em>
                </h1>
              </div>
              <div className={styles.lede}>
                <p>
                  University professors are remarkably good at turning a field
                  of knowledge into a course - deciding what matters, what
                  comes first, and what someone needs to understand next. We
                  belive that this kind of structure
                  should not be limited to universities. Anyone who has worked
                  their way through a subject, question, or goal should be able
                  to publish the path they took. We call these learning paths.
                </p>
                <p>
                  Thousands of people are teaching themselves new topics,
                  sitting with open questions, and working toward particular
                  goals. Much of that work is figuring out a structure: what to
                  learn first, which concepts matter, and which resources
                  finally made something click. This community keeps those
                  traces, so the next person can inherit a path that someone
                  else has already worked out.
                </p>
                <p>
                  Often, learning happens across a messy mix of LLM
                  conversations, YouTube videos, websites, papers, and notes.
                  It is easy to lose track of what you have learned, what
                  comes next, or simply stop and never return.{' '}
                  <em>
                    Learning paths are not only something you publish for
                    others - they are a structure for your own learning,
                    helping you keep everything organized, see your progress,
                    and actually finish what you set out to understand.
                  </em>
                </p>
              </div>
              <CommunitySchema />
            </header>

            <section
              className={styles.collabSection}
              aria-labelledby='collab-resources-heading'
            >
              <h2
                id='collab-resources-heading'
                className={styles.collabTitle}
              >
                Community <em>Collab Resources</em>
              </h2>
              <ResourceVoteSchemaDiagram />
              <div className={styles.collabCopy}>
                <div className={styles.collabLede}>
                  <p>
                    A learning path is only as good as the resources on each
                    concept: the lecture that ordered the ideas, the paper that
                    finally made something click, the problem set that proved you
                    understood it. Those traces usually stay in someone&apos;s
                    tabs.
                  </p>
                  <p>
                    When people attach those materials to a path, and others vote
                    on what actually helped, the list gets better than any one
                    person would assemble alone. You get the right order to
                    consume the resources, and you can be sure they are of good
                    quality - because the community has already used them, ranked
                    them, and kept the ones that worked. That is the work a great
                    professor does for a course - choosing what to read, in what
                    order, and why. Collaborative resources let a community do
                    that for any goal.
                  </p>
                  <p>
                    It is also a place to talk to other people about your goal.
                    Each step has annotations, so you can ask a question, leave a
                    note, or pick up a conversation right where someone else got
                    stuck - on that concept, not in a scattered chat.
                  </p>
                  <p>
                    <em>
                      Sharing a resource is not a side feature. It is how
                      Coursetexts compounds: every paper, video, or note that
                      helped you can shorten the path for whoever comes next.
                    </em>
                  </p>
                </div>
                <Link
                  href='/all-courses?view=learning-paths'
                  legacyBehavior
                >
                  <a className={styles.shareBtn}>Browse all learning paths</a>
                </Link>
              </div>
            </section>
          </div>

          <div className={styles.body}>
            <div className={styles.container}>
              <CommunityLearning />
            </div>
          </div>
        </section>

        <HomeFooterSection />
      </main>
    </>
  )
}
