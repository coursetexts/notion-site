import * as React from 'react'
import type { GetStaticProps } from 'next'
import Head from 'next/head'
import { useRouter } from 'next/router'

import { DegreesDirectory } from '@/components/DegreesDirectory'
import { HomeFooterSection } from '@/components/HomeFooterSection'
import { HomeHeader } from '@/components/HomeHeader'
import {
  type DegreeLevel,
  UndergraduateDegreesTopSection
} from '@/components/UndergraduateDegreesTopSection'
import { name as siteName } from '@/lib/config'
import {
  type DegreeDirectoryItem,
  createDegreeDirectoryItems
} from '@/lib/degrees-directory'
import { graduateDegrees } from '@/lib/graduate-degrees'
import { undergraduateDegrees } from '@/lib/undergraduate-degree-data'

type DegreesPageProps = {
  directories: Record<DegreeLevel, DegreeDirectoryItem[]>
}

function parseDegreeLevel(value: string | string[] | undefined): DegreeLevel {
  const raw = Array.isArray(value) ? value[0] : value
  return raw === 'graduate' ? 'graduate' : 'undergraduate'
}

export default function DegreesPage({ directories }: DegreesPageProps) {
  const router = useRouter()
  const [query, setQuery] = React.useState('')
  const [level, setLevel] = React.useState<DegreeLevel>('undergraduate')

  React.useEffect(() => {
    if (!router.isReady) return

    const urlQuery = Array.isArray(router.query.q)
      ? router.query.q[0] || ''
      : (router.query.q as string | undefined) || ''

    setQuery((current) => (current === urlQuery ? current : urlQuery))
    setLevel(parseDegreeLevel(router.query.level))
  }, [router.isReady, router.query.q, router.query.level])

  const updateUrl = React.useCallback(
    (nextQuery: string, nextLevel: DegreeLevel) => {
      if (!router.isReady) return

      const trimmedQuery = nextQuery.trim()
      const nextRouteQuery: Record<string, string> = {}

      if (trimmedQuery) {
        nextRouteQuery.q = trimmedQuery
      }

      if (nextLevel === 'graduate') {
        nextRouteQuery.level = 'graduate'
      }

      void router.replace(
        {
          pathname: '/degrees',
          query: nextRouteQuery
        },
        undefined,
        { shallow: true, scroll: false }
      )
    },
    [router]
  )

  const handleSearchSubmit = React.useCallback(() => {
    updateUrl(query, level)
  }, [query, level, updateUrl])

  const handleLevelChange = React.useCallback(
    (nextLevel: DegreeLevel) => {
      setLevel(nextLevel)
      updateUrl(query, nextLevel)
    },
    [query, updateUrl]
  )

  const degrees = directories[level]
  const pageTitle =
    level === 'graduate' ? 'Graduate Degrees' : 'Undergraduate Degrees'

  return (
    <>
      <Head>
        <title>{`${pageTitle} – ${siteName}`}</title>
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
        <section style={{ flex: 1 }} aria-label='Degrees workspace'>
          <UndergraduateDegreesTopSection
            level={level}
            onLevelChange={handleLevelChange}
            query={query}
            onQueryChange={setQuery}
            onSearchSubmit={handleSearchSubmit}
          />
          <DegreesDirectory degrees={degrees} level={level} query={query} />
        </section>
        <HomeFooterSection />
      </main>
    </>
  )
}

export const getStaticProps: GetStaticProps<DegreesPageProps> = async () => ({
  props: {
    directories: {
      undergraduate: createDegreeDirectoryItems(undergraduateDegrees),
      graduate: createDegreeDirectoryItems(graduateDegrees)
    }
  }
})
