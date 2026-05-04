import Head from 'next/head'
import React from 'react'
import { motion, useReducedMotion } from 'framer-motion'

import { HomeFooterSection } from '@/components/HomeFooterSection'
import { discord, donate } from '@/lib/config'
import styles from '@/styles/manifesto.module.css'

const tocItems = [
  { href: '#introduction', label: 'Introduction' },
  { href: '#why-ocw', label: 'Why OCW' },
  { href: '#institutional-freedom', label: 'Institutional Freedom' }
]

const principles = [
  {
    title: 'Knowledge is a public good, not a gated asset.',
    body: 'The best teaching shouldn’t be trapped behind logins, paywalls, or brittle interfaces. Graduate-level and “frontier” material is too often passed around as private notes, Canvas exports, and half-forgotten lecture videos. We work to pull these materials into the open internet and keep them usable.'
  },
  {
    title: 'Self-directed doesn’t mean solitary.',
    body: 'Many of the most curious people are learning outside of the status quo. The communities that shaped the Coursetexts team, (like Socratica, Hacklodge, Interact, didn’t just provide resources. They showed us what was possible. We want Coursetexts to carry a wondrous and encouraging feeling via shared materials, shared questions, and visible traces of other minds.'
  },
  {
    title: 'Universities are partners.',
    body: "We respect professors' rights immensely, and work within their constraints. The goal is to give their best work a longer, wider life, with consent, credit, and context."
  },
  {
    title: 'Learning software should be evergreen',
    body: 'When education companies optimize for growth and revenue, experience quality usually collapses. Coursetexts is “forever green”: we are fully volunteer run, our north star is better learning, and we will never monetize.'
  },
  {
    title: 'Open by default, careful by principle.',
    body: 'When we put materials on the internet, we assume they will be scraped, remixed, and fed into models. We will not sell private course data to labs, and we will be honest with professors about the tradeoffs of open-source. When we ask professors for consent to put their course up, they default to the Creative Commons BY-NC-SA 4.0 license (this is the standard one that OCW uses).'
  },
  {
    title: 'Curiosity is an end in itself.',
    body: 'We are building for people just like ourselves, whose greatest fear is losing their curiosity. Coursetexts aims to help more people, students, dropouts, working engineers, retirees, find it natural to keep seriously and unseriously learning hard things and making multidisciplinary connections for the rest of their lives.'
  }
]

const lookingForwardCards = [
  {
    image: '/images/manifesto/left-bookcase.png',
    text: 'The internet library is a living repository for humans.'
  },
  {
    image: '/images/manifesto/middle-brain.png',
    text: 'Your brain is your most complex organ, structured with folds that dramatically increase surface area.'
  },
  {
    image: '/images/manifesto/right-origami.png',
    text: 'Coursecrane increases the nourishing educational surface area of your exposure, with world-class material that should be public.'
  }
] as const

const gratitudeCopy =
  "Coursetexts is 100% volunteer-run and nonprofit, by student volunteers from MIT, harvard, waterloo, laurier, and purdue. we're grateful to michael nielsen and the institute for their grant support, and to lawrence lessig and peter suber for their advisorship. if you want to collaborate, we'd love to hear from you."

const manifestoNotes = [
  '[1] MIT OpenCourseWare annual operating cost (~$2.7M for 2,300+ courses) from MIT OCW fundraising pages. Cited figure is total operational cost including infrastructure, publishing, and rights clearance staffing, not a per-image clearance rate. Source: ocw.mit.edu/give. The $1,170/course/year figure is a simple division; actual per-course clearance labor varies significantly by discipline (art history >> computer science).',
  `[2] MIT OCW's own FAQ states that course packs containing proprietary content "cannot be provided under our license." Source: mitocw.zendesk.com.`,
  '17 U.S.C. § 107 (fair use). Campbell v. Acuff-Rose Music, Inc., 510 U.S. 569 (1994), the decision that established transformativeness as the primary analytical lens for factor 1 analysis.',
  'Article was written in collaboration with Aileen Luo.'
] as const

function LogoMark() {
  return (
    <svg
      aria-hidden='true'
      className={styles.brandMark}
      fill='none'
      height='21'
      viewBox='0 0 24 21'
      width='24'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        d='M21.9 18.3373L18.0187 3.84358C17.9155 3.45947 17.6639 3.13208 17.3194 2.93341C16.9748 2.73475 16.5654 2.68108 16.1813 2.78421L13.2844 3.56233L13.1906 3.59046C13.0509 3.40715 12.8708 3.25851 12.6643 3.15608C12.4578 3.05365 12.2305 3.00018 12 2.99983H9C8.73609 3.00054 8.47716 3.07175 8.25 3.20608C8.02284 3.07175 7.76391 3.00054 7.5 2.99983H4.5C4.10218 2.99983 3.72064 3.15787 3.43934 3.43917C3.15804 3.72048 3 4.10201 3 4.49983V19.4998C3 19.8977 3.15804 20.2792 3.43934 20.5605C3.72064 20.8418 4.10218 20.9998 4.5 20.9998H7.5C7.76391 20.9991 8.02284 20.9279 8.25 20.7936C8.47716 20.9279 8.73609 20.9991 9 20.9998H12C12.3978 20.9998 12.7794 20.8418 13.0607 20.5605C13.342 20.2792 13.5 19.8977 13.5 19.4998V10.1623L16.1063 19.8842C16.1912 20.2046 16.3798 20.4878 16.6427 20.6896C16.9056 20.8915 17.2279 21.0005 17.5594 20.9998C17.6888 20.9976 17.8176 20.9819 17.9437 20.953L20.8406 20.1748C21.2247 20.0716 21.5521 19.82 21.7508 19.4754C21.9495 19.1309 22.0031 18.7215 21.9 18.3373ZM16.5656 4.23733L17.1562 6.40296L14.2594 7.18108L13.6688 5.01546L16.5656 4.23733ZM12 4.49983V15.7498H9V4.49983H12ZM7.5 4.49983V6.74983H4.5V4.49983H7.5ZM12 19.4998H9V17.2498H12V19.4998ZM20.4562 18.7217L17.5594 19.4998L16.9688 17.3248L19.875 16.5467L20.4562 18.7217Z'
        fill='black'
      />
    </svg>
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

function SearchIcon() {
  return (
    <svg
      aria-hidden='true'
      fill='none'
      height='18'
      viewBox='0 0 18 18'
      width='18'
      xmlns='http://www.w3.org/2000/svg'
    >
      <circle
        cx='7.875'
        cy='7.875'
        r='5.625'
        stroke='currentColor'
        strokeWidth='1.5'
      />
      <path
        d='M11.85 11.85L15.75 15.75'
        stroke='currentColor'
        strokeLinecap='round'
        strokeWidth='1.5'
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

function ManifestoArticleFooter() {
  return (
    <div className={styles.articleFooter}>
      <div className={styles.articleFooterTop} />
      <div className={styles.articleFooterTopSecondary} />

      <div className={styles.articleFooterBody}>
        <div className={styles.articleFooterIdentity}>
          <div className={styles.articleFooterAuthorRow}>
            <img
              alt='Coursetexts Engineering Team'
              className={styles.articleFooterAvatar}
              height={38}
              src='/images/manifesto/blog-team.png'
              width={38}
            />
            <p className={styles.articleFooterName}>
              Coursetexts Engineering Team
            </p>
          </div>

          <a
            className={styles.articleFooterButton}
            href='https://coursetexts.org/why'
            rel='noreferrer'
            target='_blank'
          >
            Learn More
          </a>
        </div>

        <p className={styles.articleFooterDescription}>
          {gratitudeCopy}
        </p>
      </div>

      <div className={styles.articleFooterBottom} />
    </div>
  )
}

export default function ManifestoPage() {
  const communityHref = discord || '/why'
  const donateHref = donate || '/'
  const communityExternal = !!discord
  const donateExternal = !!donate
  const reduceMotion = useReducedMotion()
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
          title: 'The Coursecrane Manifesto',
          text: 'The Coursecrane Manifesto',
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
        <title>The Coursecrane Manifesto | Coursetexts</title>
        <meta
          content='Curated knowledge exists in extraordinary abundance, but the best of it still stays locked away.'
          name='description'
        />
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

        <motion.div
          aria-hidden='true'
          className={styles.globalGrain}
          animate={
            reduceMotion
              ? undefined
              : {
                  x: [0, -18, 10, 0],
                  y: [0, 14, -10, 0],
                  opacity: [0.16, 0.22, 0.18, 0.16]
                }
          }
          transition={
            reduceMotion
              ? undefined
              : { duration: 18, repeat: Infinity, ease: 'linear' }
          }
        />

        <div className={styles.pageLayer}>
          <div className={styles.topRule} />

          <header className={styles.header}>
            <a className={styles.brand} href='/'>
              <LogoMark />
              <span className={styles.brandText}>Coursetexts</span>
            </a>

            <nav aria-label='Primary' className={styles.headerNav}>
              <a className={styles.headerLink} href='/'>
                All Courses
              </a>
              <a className={styles.headerLink} href='/why'>
                Resources
              </a>
              <a
                className={styles.headerLink}
                href={communityHref}
                rel={communityExternal ? 'noreferrer' : undefined}
                target={communityExternal ? '_blank' : undefined}
              >
                Communities
              </a>
              <a
                className={styles.headerLink}
                href={donateHref}
                rel={donateExternal ? 'noreferrer' : undefined}
                target={donateExternal ? '_blank' : undefined}
              >
                Donate
              </a>
            </nav>

            <div className={styles.headerActions}>
              <a
                aria-label='Search all courses'
                className={styles.searchButton}
                href='/'
              >
                <SearchIcon />
              </a>
              <a className={styles.signUpButton} href='/signin'>
                Sign Up
              </a>
            </div>
          </header>

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
                    <h1 className={styles.title}>The Coursecrane Manifesto</h1>
                    <span className={styles.dateBadge}>March 19, 2026</span>
                  </div>

                  <blockquote className={styles.quoteBlock}>
                    <p>
                      &quot;When I was in high school, I searched everywhere for
                      materials on the physics of MRI. Every course I found was
                      aimed at medical students, high-level overviews, nothing
                      deeper.
                    </p>
                    <p>
                      Years later, I landed at Harvard and finally took a class
                      on how MRIs work. The lecture notes were incredible, but
                      only accessible to those in the class.
                    </p>
                    <p>
                      I would have done anything to have had those notes be
                      available in high school [1].&quot;
                    </p>
                  </blockquote>
                </Reveal>

                <Reveal delay={0.05}>
                  <section className={styles.lead} id='introduction'>
                    <p>
                      Curated knowledge exists in extraordinary abundance, at
                      universities across the world. The problem is that the
                      best of it stays locked inside canvas exports, private
                      lecture notes, and course videos that expire when semester
                      ends.
                    </p>
                    <p>
                      Only a small fraction of courses at universities are
                      publicly available. We want to live in a world where
                      anyone can learn higher-level subjects for free,
                      especially advanced and niche courses for which there are
                      no online equivalents.
                    </p>
                  </section>
                </Reveal>

                <Reveal delay={0.08}>
                  <section className={styles.contentSection} id='why-ocw'>
                    <h2 className={styles.sectionHeading}>
                      Professors spend lifetimes writing and distilling research
                      into digestible, teachable chunks.
                    </h2>
                    <p className={styles.bodyText}>
                      Access to their life&apos;s work ends for students when a
                      login expires. Coursecrane is the infrastructure for
                      bridging the gap between lifetime learners and the heavy
                      gates that must be pushed past to acquire institutional
                      knowledge.
                    </p>
                  </section>
                </Reveal>

                <Reveal delay={0.12}>
                  <section
                    className={`${styles.contentSection} ${styles.birdRow}`}
                    id='institutional-freedom'
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
                      Institutional freedom should not be a prerequisite for
                      deep learning.
                    </h2>
                    <p className={styles.sectionSubtext}>
                      The point is not to replace modern learning platforms. It
                      is to lower the global barrier to publishing online and
                      raise the collective ceiling of online learning.
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
              </article>
              </div>
            </div>
          </main>

          <section className={styles.legacySection}>
            <div className={`${styles.legacyTop} ${styles.noisySection}`}>
              <Reveal className={styles.legacyTopInner}>
                <h2 className={styles.legacyHeadline}>
                  <em>Cranetexts</em> began as Coursetexts; a free, open
                  library of Harvard lecture notes.
                </h2>
              </Reveal>
            </div>

            <div className={`${styles.legacyBottom} ${styles.noisySection}`}>
              <Reveal className={styles.legacyInner}>
                <div className={styles.legacyLead}>
                  <p className={styles.bottomText}>
                    By crowdsourcing their lecture notes, a group of 6 friends
                    from Harvard and MIT found a way to help make current
                    knowledge available to all curious people on the internet.
                  </p>
                </div>

                <img
                  alt='White origami crane'
                  className={styles.legacyCrane}
                  height={928}
                  src='/images/manifesto/crane-white.png'
                  width={1232}
                />

                <div className={styles.legacyClosing}>
                  <h2 className={styles.sectionHeading}>
                    Their initial dream continues with us, in 2026.
                  </h2>
                  <p className={styles.bottomSmall}>
                    Our goal is not to replace edX, Canvas or other learning
                    initiatives. Coursetexts should be complementary to them,
                    but to lower the global barrier to publishing online, and
                    thus to raise the collective ceiling of online learning.
                  </p>
                </div>
              </Reveal>
            </div>
          </section>

          <section className={styles.ocwSection} aria-labelledby='ocw-title'>
            <Reveal className={styles.ocwIntro}>
              <p className={styles.sectionHeading}>
                The average OpenCourseWare course, while extremely
                comprehensive, dates back to 2008.
              </p>

              <div className={styles.ocwSplit}>
                <div className={styles.ocwImageWrap}>
                  <img
                    alt=''
                    aria-hidden='true'
                    className={styles.ocwCube}
                    height={146}
                    src='/images/manifesto/averagehouse.png'
                    width={155}
                  />
                </div>

                <div className={styles.ocwAsideText}>
                  <p>
                    The culture around textbook publishing creates materials
                    that are old and prohibitively expensive.
                  </p>
                  <p>
                    Digitized courses that can exist online don&apos;t, not
                    because professors are unwilling, but because publishing
                    takes too much time.
                  </p>
                </div>
              </div>
            </Reveal>

            <Reveal className={styles.ocwBand}>
              <div className={styles.ocwBandInner}>
                <div className={styles.ocwImageWrap}>
                  <img
                    alt=''
                    aria-hidden='true'
                    className={styles.ocwDesk}
                    height={145}
                    src='/images/manifesto/ocw-cube.png'
                    width={155}
                  />
                </div>

                <div className={styles.ocwBandCopy}>
                  <h2 className={styles.sectionHeading} id='ocw-title'>
                    MIT OpenCourseWare runs on roughly $2.7M per year to
                    maintain 2,300+ courses, about $1,170 per course annually.
                  </h2>
                  <p className={styles.bodyText}>
                    Our tools aim to lower this cost by converting an existing
                    canvas site to a public page in minutes, licensed under
                    creative commons BY-NC-SA 4.0. Professors keep control by
                    reviewing, approving, and retaining credit with a fraction
                    of the projected time commitment.
                  </p>
                </div>
              </div>
            </Reveal>
          </section>

          <section
            className={`${styles.principlesSection} ${styles.noisySection}`}
            aria-labelledby='principles-title'
          >
            <Reveal className={styles.principlesInner}>
              <img
                alt='Open doorway in a painted landscape'
                className={styles.principlesImage}
                height={373}
                src='/images/manifesto/doorway.png'
                width={560}
              />

              <div className={styles.principlesContent}>
                <h2 className={styles.principlesTitle} id='principles-title'>
                  Our Principles
                </h2>

                <ol className={styles.principlesList}>
                  {principles.map((principle, index) => (
                    <li key={principle.title} className={styles.principleItem}>
                      <p className={styles.principleTitle}>
                        {index + 1}. {principle.title}
                      </p>
                      <p className={styles.principleBody}>{principle.body}</p>
                    </li>
                  ))}
                </ol>
              </div>
            </Reveal>
          </section>

          <section
            className={styles.lookingForwardSection}
            aria-labelledby='looking-forward-title'
          >
            <div className={styles.lookingForwardInner}>
              <Reveal>
                <h2
                  className={styles.lookingForwardTitle}
                  id='looking-forward-title'
                >
                  Looking forwards
                </h2>

                <img
                  alt='Origami crane in flight'
                  className={styles.lookingForwardHero}
                  height={505}
                  src='/images/manifesto/end-image.png'
                  width={670}
                />
              </Reveal>

              <Reveal className={styles.lookingForwardCopy} delay={0.05}>
                <p>
                  The Internet and the age of LLMs has made knowledge
                  plentiful. Why hasn&apos;t genuine learning followed the
                  Cambrian explosion in information? Our earlier theory of
                  change assumed that{' '}
                  <a
                    href='https://blog.aayushg.com/education/'
                    rel='noreferrer'
                    target='_blank'
                  >
                    advanced material
                  </a>{' '}
                  was the bottleneck for driven self-learners. Under that
                  theory of change, we focused on graduate-level STEM material.
                  Our current theory of change is that motivation and navigation
                  are more common bottlenecks for many self-directed learners,
                  not just access to advanced material, per se.
                </p>
                <p>
                  The internet has more content than anyone can consume. What it
                  starves for is legibility. A course outline can be a path
                  through ideas, experiments, and questions. Our job is to make
                  these stubby internet paths navigable: searchable,
                  annotatable, expandable, and remixable.
                </p>
              </Reveal>

              <div className={styles.lookingForwardCards}>
                {lookingForwardCards.map((card, index) => (
                  <Reveal
                    key={card.text}
                    className={styles.lookingForwardCard}
                    delay={0.07 * (index + 1)}
                  >
                    <div className={styles.lookingForwardCardImageWrap}>
                      <img
                        alt=''
                        aria-hidden='true'
                        className={styles.lookingForwardCardImage}
                        src={card.image}
                      />
                    </div>
                    <p className={styles.lookingForwardCardText}>{card.text}</p>
                  </Reveal>
                ))}
              </div>

              <Reveal className={styles.manifestoEndSection} delay={0.12}>
                <div className={styles.manifestoEndActions}>
                  <button
                    type='button'
                    onClick={shareLink}
                    className={styles.shareButton}
                  >
                    <ShareIcon />
                    <span className={styles.shareButtonText}>Share article</span>
                  </button>

                  <div className={styles.actionButtonGroup}>
                    <button
                      type='button'
                      onClick={() =>
                        window.open(
                          'mailto:coursetexts.info@gmail.com',
                          '_blank',
                          'noopener,noreferrer'
                        )
                      }
                      className={styles.primaryActionButton}
                    >
                      Email Us
                    </button>
                    <button
                      type='button'
                      onClick={copyLink}
                      className={styles.secondaryActionButton}
                    >
                      Copy link
                    </button>
                  </div>
                </div>

                <div className={styles.thankYouCard}>
                  <p className={styles.thankYouTitle}>
                    Thank you for reading with us.
                  </p>
                  <p className={styles.thankYouBody}>{gratitudeCopy}</p>
                </div>

                <div className={styles.manifestoNotes}>
                  {manifestoNotes.map((note, index) => (
                    <div key={note} className={styles.manifestoNoteItem}>
                      <span className={styles.manifestoNoteNumber}>
                        {index + 1}.
                      </span>
                      <p className={styles.manifestoNoteText}>{note}</p>
                    </div>
                  ))}
                </div>
              </Reveal>

              <Reveal delay={0.16}>
                <ManifestoArticleFooter />
              </Reveal>
            </div>
          </section>

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
