import * as React from 'react'
import Head from 'next/head'
import Link from 'next/link'

import { HomeFooterSection } from '@/components/HomeFooterSection'
import { HomeHeader } from '@/components/HomeHeader'
import { discord, donate } from '@/lib/config'

import styles from './about.module.css'

const homeChromeVars = {
  '--home-side': 'clamp(20px, 4.03vw, 58px)',
  '--home-main-max': '1324px',
  '--home-content-max': '720px',
  '--home-footer-side': 'max(28px, 15.28vw)',
  minHeight: '100vh',
  background: 'var(--footer, #F8F7F4)',
  display: 'flex',
  flexDirection: 'column'
} as React.CSSProperties

const BLOG_PIPELINE_URL =
  'https://blog.coursetexts.org/automating-copyright-compliance-for-open-courseware'

export default function AboutPage() {
  return (
    <>
      <Head>
        <title>About · Coursetexts</title>
        <meta
          name='description'
          content='Coursetexts is a community of learners, a home for pedagogical materials, and an applied learning science lab.'
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

        <section className={styles.section} aria-label='About Coursetexts'>
          <div className={styles.container}>
            <p className={styles.copy}>
              CourseTexts is a community of learners, a home for pedagogical
              materials, and an applied learning science lab. We design new
              interaction paradigms to support learning and metacognitive
              development.
            </p>

            <div className={styles.actions}>
              <Link href='/all-courses' legacyBehavior>
                <a className={styles.button}>Graduate courses library</a>
              </Link>
              <Link href='/paths' legacyBehavior>
                <a className={styles.button}>
                  Paths, a new educational interface
                </a>
              </Link>
              <a
                className={styles.button}
                href={donate || '/support'}
                {...(donate ? { target: '_blank', rel: 'noreferrer' } : {})}
              >
                Donate
              </a>
            </div>

            <div className={styles.rule} aria-hidden />

            <article className={styles.essay}>
              <p>
                Welcome to CourseTexts! If you&apos;ve found us, you likely care
                deeply about learning and connecting with other learners.
                We&apos;re on a journey to foster a{' '}
                <strong>community for autodidacts</strong> like you who enjoy
                exploring rabbit holes and other personal curiosities outside of
                the traditional classroom environment.
              </p>
              <p>
                In this inaugural essay, we outline what we hope to achieve with
                CourseTexts, provide a bit of relevant history about the
                organization, and open up some discussion about where we&apos;re
                headed next.
              </p>
              <p>
                We hope you&apos;ll join us in our journey, whether it be as a{' '}
                <Link href='/signin' legacyBehavior>
                  <a className={styles.inlineLink}>fellow learner</a>
                </Link>{' '}
                or{' '}
                <a
                  className={styles.inlineLink}
                  href={discord || 'https://discord.gg/6xBECjtC55'}
                  target='_blank'
                  rel='noreferrer'
                >
                  contributor
                </a>
                !
              </p>
              <p className={styles.signoff}>—The CourseTexts team</p>

              <h2 className={styles.essayHeading}>What is CourseTexts?</h2>
              <p>
                CourseTexts is a community of learners, a home for pedagogical
                materials, and an applied learning science lab. We design new
                interaction paradigms to support learning and metacognitive
                development.
              </p>
              <p>
                Our approach to improving our collective ability of learning to
                learn decomposes the problem into two separate subskills:
              </p>
              <p>
                (1) identifying learning objectives, current knowledge gaps, and
                the necessary skills to address these conceptual deficiencies;
              </p>
              <p>
                (2) reading textbooks, watching videos, listening to lectures,
                chatting with AI, and solving problems to absorb the intended
                concepts through expert guidance.
              </p>
              <p>
                While we observe the second skill to be significantly more
                prevalent among learners than the first, we identify that the
                first skill will become increasingly more meaningful in a world
                where everyone has access to tools-for-thought and other
                pedagogical mediums that accelerate and extend one&apos;s
                ability to learn.
              </p>
              <p className={styles.essayCallout}>
                We hypothesize that by building foundational computing mediums
                that learners can modify and extend by specifying the behavior
                of their desired learning tool, we can shift the bottleneck from
                gathering and retaining information to choosing what to learn
                and where to learn the information from.
              </p>
              <p>
                There currently isn&apos;t a place where autodidacts can
                congregate, exchange resources, decide what and how to learn,
                and develop their ability to understand and retain knowledge.
                Many exceptional historical figures—poets, academics, authors,
                musicians, and scientists—were surrounded by a vibrant
                intellectual milieu during their adolescence and periods of deep
                learning. Instead of viewing learning as a means of getting into
                university, finding a job, or earning a promotion, exceptional
                children followed their own curiosities, often without
                institutional barriers, by immersing themselves in an
                intellectually vivacious community of other learners. This was
                often done through a mix of private tutoring, conversations with
                peers, and self-directed learning. The CourseTexts
                community&apos;s structure mirrors some of these same conditions
                that are known to incubate intellectual growth.
              </p>
              <p className={styles.essayCallout}>
                An additional benefit of curating a community of autodidacts is
                that we can pilot pedagogical and epistemic tools in real time
                with members of our community, which we feel is an important
                focus as AI becomes increasingly capable.
              </p>
              <p>
                One specific example of this is our upcoming experiment to
                encode Learning Paths: nonconventional progression through
                resources that have allowed a successful self-learner to achieve
                a goal such as learning a language or understanding a famous
                mathematical proof. Once we&apos;re more established, we intend
                to evolve the platform, community, data, and associated feedback
                into the foundations for a learning science laboratory to
                produce research findings within this problem space.
              </p>

              <h2 className={styles.essayHeading}>CourseTexts History</h2>
              <p>
                CourseTexts began in 2024 as an open-source publishing pipeline
                where we allowed professors at MIT, Yale, Princeton, and Harvard
                to seamlessly upload their course materials and syllabi to be
                publicly available on our website. We grew out of MIT SOUL, a
                non-profit student organization at MIT that works to accelerate,
                experiment with, and build a stronger culture of open education
                at institutions of higher education.
              </p>
              <p>
                To increase the number of publicly available courses and reduce
                the friction associated with publishing them, we developed a
                content pipeline that (1) engaged interested professors to gain
                consent for publishing their courses; (2) accessed and
                aggregated course materials, lectures, syllabi, and assignments;
                (3) processing materials and videos to remove possible copyright
                infractions. These three processes have connected us with more
                than 70 professors and made the aggregation and publication of
                materials (mostly) seamless, an order of magnitude less
                expensive, and significantly faster. You can read more about the
                publishing pipeline in{' '}
                <a
                  className={styles.inlineLink}
                  href={BLOG_PIPELINE_URL}
                  target='_blank'
                  rel='noreferrer'
                >
                  our blog post on the subject
                </a>
                .
              </p>
              <p>
                We continue to maintain and offer this publishing pipeline as a
                core component of our community platform. We believe that
                first-party open access materials are a useful starting point to
                demonstrate the bar of content quality we intend to continue
                curating, both in-house and through community contributions over
                time.
              </p>

              <h2 className={styles.essayHeading}>
                How Does CourseTexts Work?
              </h2>
              <p>
                CourseTexts currently supports learners and educators through
                two primary interfaces: the Course Catalog and the Learning
                Paths community. We intend to expand our scope of offerings
                through further explorations and experiments in upcoming
                releases.
              </p>

              <h3 className={styles.essaySubheading}>The Course Catalog</h3>
              <p>
                CourseTexts works directly with more than 70 professors across
                Harvard, Princeton, Yale, Columbia, Stanford, and MIT to open
                source their course syllabus, materials, assignments, and other
                resources that are helpful to autodidacts. Only a small fraction
                of courses at top universities are publicly available today; we
                want to work towards a world where anyone can learn anything for
                free from world-class experts, no matter the subject.
              </p>
              <p>
                After speaking with some professors, we learned that one of the
                primary reasons for not publishing their courses publicly is
                that it takes too much time. Many of the bottlenecks to open
                sourcing courses revolve around copyright concerns and the
                friction associated with transferring materials from Canvas to
                an open source medium, like MIT OpenCourseWare.
              </p>
              <p>
                We solved this problem for professors and course staff by
                creating a copyright and publication pipeline that connects
                directly to their Canvas courses, removes copyrighted sources,
                and uploads the materials approved by the professors to
                CourseTexts. Because many lower-division and introductory
                courses have already been made publicly available through past
                initiatives, we primarily focus on more advanced or obscure
                coursework, such as Superhero Theory and Cartography.
              </p>

              <h3 className={styles.essaySubheading}>Learning Paths</h3>
              <p>
                We draw inspiration from existing intellectual communities such
                as LessWrong, Math Stack Exchange, and the Art of Problem
                Solving to build a community forum where learners and professors
                can share textbooks, videos, blogs, educators, and other helpful
                resources for learning different concepts across subjects.
              </p>
              <p>
                We recognize that a key challenge in autodidactic learning is
                knowing what to learn and where to learn it from: notably,
                subfields have nuanced prerequisites and not all learning
                materials offer the same level of rigor and intuition. Hence,
                instead of creating a list of resources for all courses, we have
                aggregated some resources that we have previously used to learn
                and will crowdsource additional resources and advice from
                members of our community.
              </p>
              <p>
                We have structured the CourseTexts Community around two primary
                contributions:
              </p>
              <p>
                1. Building prerequisite/corerequisite dependency trees at a
                granular level for the topics within a course or learning
                resource.
              </p>
              <p>
                2. Curating resources that have previously been successful for
                autodidactic learning. Instead of using AI to aggregate
                resources, we are creating an environment that makes it seamless
                for all community members to share insights from past
                engagements with learning materials.
              </p>
              <p>
                Our primary goal of the Forum is to facilitate the structure and
                growth of a comprehensive mapping of learning paths to encode
                the journeys that past learners successfully went through to
                accomplish their learning goals in a way that prospective
                learners can reproduce. We aim to accomplish this by creating a
                platform that is primarily beneficial to learners themselves
                through personalized tools and aids we won&apos;t be able to
                learn without, with the free positive externality that using the
                tools also grows our collective database of learning paths for
                others to iterate upon.
              </p>

              <h2 className={styles.essayHeading}>Acknowledgements</h2>
              <p>
                CourseTexts was founded by Aayush and Selena and is now
                maintained by Eesha, Hudson, Ben, and Aayush. We&apos;d like to
                thank all past (and future!) contributors, including Aileen,
                Advikaa, Cherish, Akshith, Yassine, and Josh. If you&apos;d like
                to join our team of volunteers as a contributor, please{' '}
                <a
                  className={styles.inlineLink}
                  href={discord || 'https://discord.gg/6xBECjtC55'}
                  target='_blank'
                  rel='noreferrer'
                >
                  join our Discord
                </a>{' '}
                and say hi!
              </p>
              <p>
                We&apos;re grateful for support from Michael Nielsen, Hack Club,
                The Institute, Austin Chen, and other financial contributors. If
                you&apos;d like to support our work, please consider making a
                tax-deductible{' '}
                <a
                  className={styles.inlineLink}
                  href={donate || '/support'}
                  {...(donate ? { target: '_blank', rel: 'noreferrer' } : {})}
                >
                  donation here
                </a>
                .
              </p>

              <h2 className={styles.essayHeading}>
                Who is the Coursetexts team?
              </h2>
              <p>
                Coursetexts is a small team led by students from Harvard and
                MIT. Here&apos;s more on Selena and Aayush. Thank you also to
                Jeremiah, Eesha, Anna, Ezra, Liam, Rigo, Milo, Edward, Raffi and
                Ashay for their contributions.
              </p>
              <p>
                We&apos;re a 501(c)(3) nonprofit fiscally sponsored by Hack
                Club, and donations are tax deductible.
              </p>
              <p>
                We&apos;re generously advised by professors Lawrence Lessig,
                Peter Suber, and Justin Reich. Thank you also to Brewster Kahle,
                Adam D&apos;Angelo, and Michael Nielsen for their support and
                advice.
              </p>
            </article>
          </div>
        </section>

        <HomeFooterSection />
      </main>
    </>
  )
}
