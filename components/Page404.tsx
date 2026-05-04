import * as React from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'

import * as types from '@/lib/types'

import { HomeFooterSection } from '@/components/HomeFooterSection'
import { HomeHeader } from '@/components/HomeHeader'

import { PageHead } from './PageHead'
import styles from './styles.module.css'

const homeChromeVars = {
  '--home-side': 'clamp(20px, 4.03vw, 58px)',
  '--home-main-max': '1324px',
  '--home-content-max': '1000px',
  '--home-footer-side': 'max(28px, 15.28vw)'
} as React.CSSProperties

const LUCKY_QUERIES = [
  'linear algebra',
  'organic chemistry',
  'microeconomics',
  'machine learning',
  'philosophy of mind',
  'cell biology',
  'thermodynamics',
  'constitutional law'
]

function SearchFieldIcon() {
  return (
    <svg
      aria-hidden='true'
      width='18'
      height='18'
      viewBox='0 0 18 18'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        d='M8.15625 14.0625C11.4182 14.0625 14.0625 11.4182 14.0625 8.15625C14.0625 4.89432 11.4182 2.25 8.15625 2.25C4.89432 2.25 2.25 4.89432 2.25 8.15625C2.25 11.4182 4.89432 14.0625 8.15625 14.0625Z'
        stroke='currentColor'
        strokeWidth='1.25'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='M12.3328 12.3328L15.75 15.75'
        stroke='currentColor'
        strokeWidth='1.25'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

export const Page404: React.FC<types.PageProps> = ({ site, pageId, error }) => {
  const router = useRouter()
  const title = 'Page not found'
  const [query, setQuery] = React.useState('')

  const goToAllCourses = React.useCallback(
    (q: string) => {
      const trimmed = q.trim()
      const href = trimmed
        ? `/all-courses?q=${encodeURIComponent(trimmed)}`
        : '/all-courses'
      void router.push(href)
    },
    [router]
  )

  const handleSearchSubmit = React.useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      goToAllCourses(query)
    },
    [goToAllCourses, query]
  )

  const handleFeelingLucky = React.useCallback(() => {
    const pick =
      LUCKY_QUERIES[Math.floor(Math.random() * LUCKY_QUERIES.length)] ??
      'physics'
    void router.push(`/all-courses?q=${encodeURIComponent(pick)}`)
  }, [router])

  return (
    <>
      <PageHead site={site} title={title} />

      <Head>
        <link rel='preconnect' href='https://use.typekit.net' />
        <link rel='preconnect' href='https://p.typekit.net' />
        <link rel='stylesheet' href='https://use.typekit.net/vxh3dki.css' />
      </Head>

      <div
        className={styles.notFoundPageContainer}
        style={homeChromeVars}
      >
        <HomeHeader />
        <main className={styles.notFoundPage}>
          <div className={styles.notFoundCore}>
            <h1 className={styles.notFoundTitle}>
              We haven&apos;t made this page yet.
            </h1>

            <form
              className={styles.notFoundSearchForm}
              role='search'
              onSubmit={handleSearchSubmit}
            >
              <div className={styles.notFoundSearchWrap}>
                <span className={styles.notFoundSearchIcon}>
                  <SearchFieldIcon />
                </span>
                <input
                  type='search'
                  name='q'
                  className={styles.notFoundSearchInput}
                  placeholder='What are you curious about?'
                  aria-label='What are you curious about?'
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  autoComplete='off'
                />
                <button type='submit' className={styles.notFoundSearchButton}>
                  Search
                </button>
              </div>
            </form>

            <button
              type='button'
              className={styles.notFoundLucky}
              onClick={handleFeelingLucky}
            >
              <img
                src='/images/404/heart.png'
                alt=''
                width={22}
                height={22}
              />
              <span className={styles.notFoundLuckyLabel}>
                I&apos;m Feeling Lucky
              </span>
            </button>

            {(error || pageId) && (
              <p className={styles.notFoundMeta}>
                {error
                  ? `Problem: ${error.message}`
                  : `Notion page “${pageId}” may be missing or not public.`}
              </p>
            )}
          </div>
        </main>
        <HomeFooterSection />
      </div>
    </>
  )
}
