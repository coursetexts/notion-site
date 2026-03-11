import * as React from 'react'

import * as types from '@/lib/types'

import { Footer } from './Footer'
import { PageHead } from './PageHead'
import styles from './styles.module.css'

export const Page404: React.FC<types.PageProps> = ({ site, pageId, error }) => {
  const title = 'Page not found'

  return (
    <>
      <PageHead site={site} title={title} />

      <div className={styles.notFoundPageContainer}>
        <main className={styles.notFoundPage}>
          <h1>Lost?</h1>
          <h2>We haven&apos;t made this page yet...</h2>
          {/* we can't use next/link here because it breaks dom manipulation for home page,
          specifically the back button, so we set window.location.href instead */}
          <button onClick={() => (window.location.href = '/')}>
            GO HOME ➚
          </button>

          {error ? (
            <p>Problem: {error.message}</p>
          ) : (
            pageId && (
              <p>
                Make sure that Notion page &quot;{pageId}&quot; is publicly
                accessible.
              </p>
            )
          )}
        </main>
        <Footer />
      </div>
    </>
  )
}
