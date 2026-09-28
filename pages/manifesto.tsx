import Head from 'next/head'
import Link from 'next/link'
import React from 'react'
import { motion, useReducedMotion } from 'framer-motion'

import { AutodidactTerm } from '@/components/AutodidactTerm'
import { GlossaryTerm } from '@/components/GlossaryTerm'
import { HomeFooterSection } from '@/components/HomeFooterSection'
import { HomeHeader } from '@/components/HomeHeader'
import { LearningPathsTutorialButton } from '@/components/LearningPathsTutorialButton'
import { discord, donate } from '@/lib/config'
import styles from '@/styles/manifesto.module.css'

const tocItems = [
  { href: '#introduction', label: 'Introduction' },
  { href: '#what-is-coursetexts', label: 'What is CourseTexts?' },
  { href: '#how-it-works', label: 'How Does CourseTexts Work?' },
  { href: '#history', label: 'CourseTexts History' },
  { href: '#acknowledgements', label: 'Acknowledgements' }
]

const BLOG_PIPELINE_URL =
  'https://blog.coursetexts.org/automating-copyright-compliance-for-open-courseware'

function ExternalLink({
  href,
  children
}: {
  href: string
  children: React.ReactNode
}) {
  return (
    <a
      className={styles.inlineLink}
      href={href}
      target='_blank'
      rel='noreferrer'
    >
      {children}
    </a>
  )
}

function ArrowLeftIcon() {
  return (
    <svg
      aria-hidden='true'
      fill='none'
      height='12'
      viewBox='0 0 12 12'
      width='12'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        d='M7.5 2.25L3.75 6L7.5 9.75'
        stroke='currentColor'
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth='1.25'
      />
    </svg>
  )
}

function ShareIcon() {
  return (
    <svg
      aria-hidden='true'
      className={styles.shareIcon}
      fill='none'
      height='20'
      viewBox='0 0 20 20'
      width='20'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        d='M13.7501 12.5002C13.3332 12.4995 12.9205 12.5829 12.5366 12.7453C12.1527 12.9077 11.8055 13.1459 11.5157 13.4455L7.91413 11.133C8.19527 10.404 8.19527 9.59643 7.91413 8.86739L11.5157 6.55489C12.0224 7.07306 12.6934 7.39902 13.4139 7.47698C14.1344 7.55495 14.8596 7.38008 15.4654 6.98229C16.0711 6.5845 16.5198 5.98854 16.7346 5.2964C16.9494 4.60426 16.917 3.85897 16.6429 3.18811C16.3688 2.51724 15.87 1.9625 15.232 1.61884C14.5939 1.27517 13.8563 1.16395 13.1453 1.3042C12.4343 1.44446 11.7941 1.82747 11.3344 2.38769C10.8746 2.94791 10.6239 3.6505 10.6251 4.3752C10.6263 4.76245 10.6978 5.14627 10.836 5.50802L7.23444 7.82052C6.80084 7.37504 6.24422 7.06902 5.63576 6.94158C5.02731 6.81413 4.39467 6.87106 3.81874 7.10508C3.24281 7.33909 2.74976 7.73957 2.40265 8.25529C2.05553 8.77101 1.87012 9.37854 1.87012 10.0002C1.87012 10.6219 2.05553 11.2294 2.40265 11.7451C2.74976 12.2608 3.24281 12.6613 3.81874 12.8953C4.39467 13.1293 5.02731 13.1863 5.63576 13.0588C6.24422 12.9314 6.80084 12.6254 7.23444 12.1799L10.836 14.4924C10.6978 14.8541 10.6263 15.238 10.6251 15.6252C10.6251 16.2433 10.8083 16.8475 11.1517 17.3614C11.4951 17.8753 11.9832 18.2758 12.5542 18.5123C13.1252 18.7489 13.7535 18.8107 14.3597 18.6902C14.9659 18.5696 15.5227 18.272 15.9598 17.8349C16.3968 17.3979 16.6944 16.8411 16.815 16.2349C16.9356 15.6287 16.8737 15.0003 16.6372 14.4293C16.4007 13.8583 16.0001 13.3702 15.4862 13.0269C14.9723 12.6835 14.3681 12.5002 13.7501 12.5002Z'
        fill='#2C1A0C'
      />
    </svg>
  )
}

type RevealProps = {
  children: React.ReactNode
  className?: string
  delay?: number
}

function Reveal({ children, className, delay = 0 }: RevealProps) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : { opacity: 0, y: 20 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={
        reduceMotion
          ? undefined
          : {
              duration: 1.4,
              delay,
              ease: [0.22, 1, 0.36, 1]
            }
      }
    >
      {children}
    </motion.div>
  )
}

const homeChromeVars = {
  '--home-side': 'clamp(20px, 4.03vw, 58px)',
  '--home-main-max': '1324px',
  '--home-content-max': '1000px',
  '--home-footer-side': 'max(28px, 15.28vw)'
} as React.CSSProperties

export default function ManifestoPage() {
  const [copyState, setCopyState] = React.useState<'idle' | 'copied' | 'error'>(
    'idle'
  )

  React.useEffect(() => {
    if (copyState === 'idle') return

    const timeout = window.setTimeout(() => {
      setCopyState('idle')
    }, 2400)

    return () => window.clearTimeout(timeout)
  }, [copyState])

  const copyLink = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopyState('copied')
    } catch {
      setCopyState('error')
    }
  }, [])

  const shareLink = React.useCallback(async () => {
    const url = window.location.href

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Why Coursetexts',
          text: 'Why Coursetexts',
          url
        })
        return
      } catch (error) {
        if ((error as Error).name === 'AbortError') return
      }
    }

    await copyLink()
  }, [copyLink])

  const [activeSection, setActiveSection] = React.useState('introduction')

  React.useEffect(() => {
    const sectionIds = tocItems.map(item => item.href.slice(1))
    const intersecting = new Set<string>()

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            intersecting.add(entry.target.id)
          } else {
            intersecting.delete(entry.target.id)
          }
        })
        const active = sectionIds.find(id => intersecting.has(id))
        if (active) setActiveSection(active)
      },
      { rootMargin: '0px 0px -50% 0px' }
    )

    sectionIds
      .map(id => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null)
      .forEach(el => observer.observe(el))

    return () => observer.disconnect()
  }, [])

  return (
    <>
      <Head>
        <title>Why Coursetexts | Coursetexts</title>
        <meta
          content='Coursetexts is a community of learners, a home for pedagogical materials, and an applied learning science lab.'
          name='description'
        />
        <link rel='preconnect' href='https://use.typekit.net' />
        <link rel='preconnect' href='https://p.typekit.net' />
        <link rel='stylesheet' href='https://use.typekit.net/vxh3dki.css' />
      </Head>

      <div className={styles.page}>
        <svg
          aria-hidden='true'
          className={styles.noiseFilterSvg}
          focusable='false'
        >
          <filter id='grain'>
            <feTurbulence
              baseFrequency='0.8'
              numOctaves='3'
              stitchTiles='stitch'
              type='fractalNoise'
            />
          </filter>
        </svg>

        {/* Static grain: animating this layer + SVG feTurbulence forced repaints every frame and made scrolling feel heavy. */}
        <div aria-hidden='true' className={styles.globalGrain} />

        <div className={styles.pageLayer} style={homeChromeVars}>
          <HomeHeader />

          <main className={styles.main}>
            <a className={styles.backLink} href='/'>
              <ArrowLeftIcon />
              <span>Back to Home</span>
            </a>

            <div className={styles.articleLayout}>
              <aside aria-label='Table of contents' className={styles.toc}>
                <span className={styles.tocTitle}>Table of Contents</span>
                <ul className={styles.tocList}>
                  {tocItems.map((item) => (
                    <li key={item.href}>
                      <a
                        className={
                          activeSection === item.href.slice(1)
                            ? styles.tocCurrent
                            : `${styles.tocLink} ${styles.tocMuted}`
                        }
                        href={item.href}
                      >
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </aside>

              <div className={styles.articleContent}>
                <Reveal className={styles.heroPanel}>
                  <img
                    alt='Origami crane illustration'
                    className={styles.heroImage}
                    height={928}
                    src='/images/manifesto/hero.png'
                    width={1232}
                  />
                </Reveal>

                <article className={styles.article}>
                <Reveal>
                  <div className={styles.headingRow}>
                    <h1 className={styles.title}>Why Coursetexts</h1>
                  </div>

                  <blockquote className={styles.quoteBlock}>
                    <p>
                      CourseTexts is a community of learners, a home for{' '}
                      <GlossaryTerm term='pedagogicalMaterials'>
                        pedagogical materials
                      </GlossaryTerm>
                      , and an applied learning science lab. We design new{' '}
                      <GlossaryTerm term='interactionParadigms'>
                        interaction paradigms
                      </GlossaryTerm>{' '}
                      to support learning and{' '}
                      <GlossaryTerm term='metacognitiveDevelopment'>
                        metacognitive development
                      </GlossaryTerm>
                      .
                    </p>
                  </blockquote>
                </Reveal>

                <Reveal delay={0.05}>
                  <section className={styles.lead} id='introduction'>
                    <p>
                      Welcome to CourseTexts! If you&apos;ve found us, you
                      likely care deeply about learning and connecting with
                      other learners. We&apos;re on a journey to foster a{' '}
                      <strong>
                        community for{' '}
                        <AutodidactTerm>autodidacts</AutodidactTerm>
                      </strong>{' '}
                      like you who enjoy exploring rabbit holes and other
                      personal curiosities outside of the traditional classroom
                      environment.
                    </p>
                    <p>
                      In this inaugural essay, we outline what we hope to
                      achieve with CourseTexts, provide a bit of relevant
                      history about the organization, and open up some
                      discussion about where we&apos;re headed next.
                    </p>
                    <p>
                      We hope you&apos;ll join us in our journey, whether it be
                      as a{' '}
                      <Link href='/signin' legacyBehavior>
                        <a className={styles.inlineLink}>fellow learner</a>
                      </Link>{' '}
                      or{' '}
                      <ExternalLink
                        href={discord || 'https://discord.gg/6xBECjtC55'}
                      >
                        contributor
                      </ExternalLink>
                      !
                    </p>
                    <p className={styles.signoff}>—The CourseTexts team</p>
                  </section>
                </Reveal>

                <Reveal delay={0.08}>
                  <section
                    className={styles.contentSection}
                    id='what-is-coursetexts'
                  >
                    <h2 className={styles.sectionHeading}>
                      What is CourseTexts?
                    </h2>
                    <p className={styles.bodyText}>
                      CourseTexts is a community of learners, a home for{' '}
                      <GlossaryTerm term='pedagogicalMaterials'>
                        pedagogical materials
                      </GlossaryTerm>
                      , and an applied learning science lab. We design new{' '}
                      <GlossaryTerm term='interactionParadigms'>
                        interaction paradigms
                      </GlossaryTerm>{' '}
                      to support learning and{' '}
                      <GlossaryTerm term='metacognitiveDevelopment'>
                        metacognitive development
                      </GlossaryTerm>
                      .
                    </p>
                    <p className={styles.bodyText}>
                      Our approach to improving our collective ability of
                      learning to learn decomposes the problem into two separate
                      subskills:
                    </p>
                    <p className={styles.bodyText}>
                      (1) identifying learning objectives, current knowledge
                      gaps, and the necessary skills to address these{' '}
                      <GlossaryTerm term='conceptualDeficiencies'>
                        conceptual deficiencies
                      </GlossaryTerm>
                      ;
                    </p>
                    <p className={styles.bodyText}>
                      (2) reading textbooks, watching videos, listening to
                      lectures, chatting with AI, and solving problems to absorb
                      the intended topics through expert guidance.
                    </p>
                    <p className={styles.bodyText}>
                      While we observe the second skill to be significantly more
                      prevalent among learners than the first, we identify that
                      the first skill will become increasingly more meaningful
                      in a world where everyone has access to tools-for-thought
                      and other{' '}
                      <GlossaryTerm term='pedagogicalMediums'>
                        pedagogical mediums
                      </GlossaryTerm>{' '}
                      that accelerate and extend one&apos;s ability to learn.
                    </p>
                    <blockquote className={styles.quoteBlock}>
                      <p>
                        We hypothesize that by building{' '}
                        <GlossaryTerm term='foundationalComputingMediums'>
                          foundational computing mediums
                        </GlossaryTerm>{' '}
                        that learners can modify and extend by specifying the
                        behavior of their desired learning tool, we can shift
                        the bottleneck from gathering and retaining information
                        to choosing what to learn and where to learn the
                        information from.
                      </p>
                    </blockquote>
                    <p className={styles.bodyText}>
                      There currently isn&apos;t a place where{' '}
                      <AutodidactTerm>autodidacts</AutodidactTerm> can
                      congregate, exchange resources, decide what and how to
                      learn, and develop their ability to understand and retain
                      knowledge. Many exceptional historical figures—poets,
                      academics, authors, musicians, and scientists—were
                      surrounded by a vibrant{' '}
                      <GlossaryTerm term='intellectualMilieu'>
                        intellectual milieu
                      </GlossaryTerm>{' '}
                      during their adolescence and periods of deep learning.
                      Instead of viewing learning as a means of getting into
                      university, finding a job, or earning a promotion,
                      exceptional children followed their own curiosities, often
                      without{' '}
                      <GlossaryTerm term='institutionalBarriers'>
                        institutional barriers
                      </GlossaryTerm>
                      , by immersing themselves in an intellectually{' '}
                      <GlossaryTerm term='vivaciousCommunity'>
                        vivacious community
                      </GlossaryTerm>{' '}
                      of other learners. This was often done through a mix of
                      private tutoring, conversations with peers, and
                      self-directed learning. The CourseTexts community&apos;s
                      structure mirrors some of these same conditions that are
                      known to incubate intellectual growth.
                    </p>
                    <blockquote className={styles.quoteBlock}>
                      <p>
                        An additional benefit of curating a community of{' '}
                        <AutodidactTerm>autodidacts</AutodidactTerm> is that we
                        can pilot pedagogical and{' '}
                        <GlossaryTerm term='epistemicTools'>
                          epistemic tools
                        </GlossaryTerm>{' '}
                        in real time with members of our community, which we
                        feel is an important focus as AI becomes increasingly
                        capable.
                      </p>
                    </blockquote>
                    <p className={styles.bodyText}>
                      One specific example of this is our upcoming experiment to
                      encode Learning Paths: nonconventional progression through
                      resources that have allowed a successful self-learner to
                      achieve a goal such as learning a language or
                      understanding a famous mathematical proof. Once we&apos;re
                      more established, we intend to evolve the platform,
                      community, data, and associated feedback into the
                      foundations for a learning science laboratory to produce
                      research findings within this problem space.
                    </p>
                  </section>
                </Reveal>

                <Reveal delay={0.1}>
                  <section className={styles.contentSection} id='how-it-works'>
                    <h2 className={styles.sectionHeading}>
                      How Does CourseTexts Work?
                    </h2>
                    <p className={styles.bodyText}>
                      CourseTexts currently supports learners and educators
                      through two primary interfaces: the Course Catalog and the
                      Learning Paths community. We intend to expand our scope of
                      offerings through further explorations and experiments in
                      upcoming releases.
                    </p>

                    <h3 className={styles.subHeading}>The Course Catalog</h3>
                    <p className={styles.bodyText}>
                      CourseTexts works directly with more than 70 professors
                      across Harvard, Princeton, Yale, Columbia, Stanford, and
                      MIT to open source their course syllabus, materials,
                      assignments, and other resources that are helpful to{' '}
                      <AutodidactTerm>autodidacts</AutodidactTerm>. Only a small
                      fraction of courses at top universities are publicly
                      available today; we want to work towards a world where
                      anyone can learn anything for free from world-class
                      experts, no matter the subject.
                    </p>
                    <p className={styles.bodyText}>
                      After speaking with some professors, we learned that one
                      of the primary reasons for not publishing their courses
                      publicly is that it takes too much time. Many of the
                      bottlenecks to open sourcing courses revolve around
                      copyright concerns and the friction associated with
                      transferring materials from Canvas to an open source
                      medium, like MIT OpenCourseWare.
                    </p>
                    <p className={styles.bodyText}>
                      We solved this problem for professors and course staff by
                      creating a copyright and publication pipeline that
                      connects directly to their Canvas courses, removes
                      copyrighted sources, and uploads the materials approved by
                      the professors to CourseTexts. Because many lower-division
                      and introductory courses have already been made publicly
                      available through past initiatives, we primarily focus on
                      more advanced or obscure coursework, such as Superhero
                      Theory and Cartography.
                    </p>
                    <div className={styles.articleActions}>
                      <Link href='/' legacyBehavior>
                        <a className={styles.primaryActionButton}>
                          Browse the course catalog
                        </a>
                      </Link>
                    </div>

                    <h3 className={styles.subHeading}>Learning Paths</h3>
                    <p className={styles.bodyText}>
                      We draw inspiration from existing intellectual communities
                      such as LessWrong, Math Stack Exchange, and the Art of
                      Problem Solving to build a community forum where learners
                      and professors can share textbooks, videos, blogs,
                      educators, and other helpful resources for learning
                      different topics across subjects.
                    </p>
                    <p className={styles.bodyText}>
                      We recognize that a key challenge in autodidactic learning
                      is knowing what to learn and where to learn it from:
                      notably, subfields have nuanced prerequisites and not all
                      learning materials offer the same level of rigor and
                      intuition. Hence, instead of creating a list of resources
                      for all courses, we have aggregated some resources that we
                      have previously used to learn and will crowdsource
                      additional resources and advice from members of our
                      community.
                    </p>
                    <p className={styles.bodyText}>
                      We have structured the CourseTexts Community around two
                      primary contributions:
                    </p>
                    <p className={styles.bodyText}>
                      1. Building prerequisite/corerequisite dependency trees at
                      a granular level for the topics within a course or
                      learning resource.
                    </p>
                    <p className={styles.bodyText}>
                      2. Curating resources that have previously been successful
                      for autodidactic learning. Instead of using AI to
                      aggregate resources, we are creating an environment that
                      makes it seamless for all community members to share
                      insights from past engagements with learning materials.
                    </p>
                    <p className={styles.bodyText}>
                      Our primary goal of the Forum is to facilitate the
                      structure and growth of a comprehensive mapping of
                      learning paths to encode the journeys that past learners
                      successfully went through to accomplish their learning
                      goals in a way that prospective learners can reproduce. We
                      aim to accomplish this by creating a platform that is
                      primarily beneficial to learners themselves through
                      personalized tools and aids we won&apos;t be able to learn
                      without, with the free positive externality that using the
                      tools also grows our collective database of learning paths
                      for others to iterate upon.
                    </p>
                    <div className={styles.articleActions}>
                      <LearningPathsTutorialButton />
                      <Link href='/paths' legacyBehavior>
                        <a className={styles.primaryActionButton}>
                          Explore Learning Paths
                        </a>
                      </Link>
                    </div>
                  </section>
                </Reveal>

                <Reveal delay={0.12}>
                  <section
                    className={`${styles.contentSection} ${styles.birdRow}`}
                    id='history'
                  >
                    <img
                      alt=''
                      aria-hidden='true'
                      className={styles.birdMark}
                      height={928}
                      src='/images/manifesto/bird.png'
                      width={1232}
                    />
                    <h2 className={styles.sectionHeading}>
                      CourseTexts History
                    </h2>
                    <p className={styles.bodyText}>
                      CourseTexts began in 2024 as an open-source publishing
                      pipeline where we allowed professors at MIT, Yale,
                      Princeton, and Harvard to seamlessly upload their course
                      materials and syllabi to be publicly available on our
                      website. We grew out of MIT SOUL, a non-profit student
                      organization at MIT that works to accelerate, experiment
                      with, and build a stronger culture of open education at
                      institutions of higher education.
                    </p>
                    <p className={styles.bodyText}>
                      To increase the number of publicly available courses and
                      reduce the friction associated with publishing them, we
                      developed a content pipeline that (1) engaged interested
                      professors to gain consent for publishing their courses;
                      (2) accessed and aggregated course materials, lectures,
                      syllabi, and assignments; (3) processing materials and
                      videos to remove possible copyright infractions. These
                      three processes have connected us with more than 70
                      professors and made the aggregation and publication of
                      materials (mostly) seamless, an order of magnitude less
                      expensive, and significantly faster. You can read more
                      about the publishing pipeline in{' '}
                      <ExternalLink href={BLOG_PIPELINE_URL}>
                        our blog post on the subject
                      </ExternalLink>
                      .
                    </p>
                    <p className={styles.bodyText}>
                      We continue to maintain and offer this publishing pipeline
                      as a core component of our community platform. We believe
                      that first-party open access materials are a useful
                      starting point to demonstrate the bar of content quality
                      we intend to continue curating, both in-house and through
                      community contributions over time.
                    </p>
                  </section>
                </Reveal>

                <Reveal delay={0.12}>
                  <section
                    className={styles.contentSection}
                    id='acknowledgements'
                  >
                    <h2 className={styles.sectionHeading}>Acknowledgements</h2>
                    <p className={styles.bodyText}>
                      Coursetexts was founded by{' '}
                      <ExternalLink href='https://selena.fyi/'>
                        Selena
                      </ExternalLink>{' '}
                      and{' '}
                      <ExternalLink href='http://aayushg.com/'>
                        Aayush
                      </ExternalLink>
                      . It is now maintained by{' '}
                      <ExternalLink href='https://x.com/eeshau'>
                        Eesha
                      </ExternalLink>
                      ,{' '}
                      <ExternalLink href='https://hudsonmp.github.io/'>
                        Hudson
                      </ExternalLink>
                      , and{' '}
                      <ExternalLink href='https://bencuan.me'>Ben</ExternalLink>
                      .
                    </p>
                    <p className={styles.bodyText}>
                      Thank you also to{' '}
                      <ExternalLink href='https://www.jeremiahvuong.com/'>
                        Jeremiah
                      </ExternalLink>
                      ,{' '}
                      <ExternalLink href='https://abrandenberger.github.io/'>
                        Anna
                      </ExternalLink>
                      ,{' '}
                      <ExternalLink href='https://github.com/genthegreat'>
                        Ezra
                      </ExternalLink>
                      ,{' '}
                      <ExternalLink href='https://liamhz.com/'>Liam</ExternalLink>
                      ,{' '}
                      <ExternalLink href='https://github.com/bert0rm'>
                        Rigo
                      </ExternalLink>
                      ,{' '}
                      <ExternalLink href='https://www.linkedin.com/in/milo-cress-4279a0193'>
                        Milo
                      </ExternalLink>
                      ,{' '}
                      <ExternalLink href='https://www.linkedin.com/in/edwardkangafe/'>
                        Edward
                      </ExternalLink>
                      ,{' '}
                      <ExternalLink href='https://rhotter.com/'>
                        Raffi
                      </ExternalLink>
                      ,{' '}
                      <ExternalLink href='https://www.linkedin.com/in/ashay-athalye-842605172/'>
                        Ashay
                      </ExternalLink>
                      ,{' '}
                      <ExternalLink href='https://aileenis.online'>
                        Aileen
                      </ExternalLink>
                      , Advikaa, Cherish, Akshith, Yassine, and Josh for their
                      past (and future!) contributions.
                    </p>
                    <p className={styles.bodyText}>
                      We&apos;re a 501(c)3 nonprofit fiscally sponsored by Hack
                      Club, and{' '}
                      <ExternalLink href={donate || '/support'}>
                        donations are tax deductible
                      </ExternalLink>
                      .
                    </p>
                    <p className={styles.bodyText}>
                      We&apos;re generously advised by professors{' '}
                      <ExternalLink href='https://hls.harvard.edu/faculty/lawrence-lessig/'>
                        Lawrence Lessig
                      </ExternalLink>
                      ,{' '}
                      <ExternalLink href='https://library.harvard.edu/staff/peter-suber'>
                        Peter Suber
                      </ExternalLink>
                      , and{' '}
                      <ExternalLink href='https://tsl.mit.edu/team/justin-reich/'>
                        Justin Reich
                      </ExternalLink>
                      . Thank you also to Brewster Kahle, Adam D&apos;Angelo,
                      and Michael Nielsen for their support and advice.
                    </p>
                  </section>
                </Reveal>

                <Reveal delay={0.15}>
                  <div className={styles.doorwayWrap}>
                    <img
                      alt='Open doorway in a painted landscape'
                      className={styles.doorwayImage}
                      height={928}
                      src='/images/manifesto/doorway.png'
                      width={1232}
                    />
                  </div>
                </Reveal>
                <Reveal className={styles.manifestoEndSection} delay={0.05}>
                  <div className={styles.manifestoEndActions}>
                    <button
                      type='button'
                      onClick={shareLink}
                      className={styles.shareButton}
                    >
                      <ShareIcon />
                      <span className={styles.shareButtonText}>
                        Share article
                      </span>
                    </button>

                    <div className={styles.actionButtonGroup}>
                      <Link href='/all-courses' legacyBehavior>
                        <a className={styles.secondaryActionButton}>
                          Graduate courses library
                        </a>
                      </Link>
                      <Link href='/paths' legacyBehavior>
                        <a className={styles.secondaryActionButton}>
                          Paths, a new educational interface
                        </a>
                      </Link>
                      <a
                        className={styles.primaryActionButton}
                        href={donate || '/support'}
                        {...(donate
                          ? { target: '_blank', rel: 'noreferrer' }
                          : {})}
                      >
                        Donate
                      </a>
                    </div>
                  </div>
                </Reveal>
              </article>
              </div>
            </div>
          </main>

          <div className={styles.footerWrap}>
            <HomeFooterSection />
          </div>
        </div>

        {copyState !== 'idle' && (
          <div className={styles.copyToast}>
            {copyState === 'copied' ? 'Link copied' : 'Copy failed'}
          </div>
        )}
      </div>
    </>
  )
}
