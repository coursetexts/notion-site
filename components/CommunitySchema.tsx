import * as React from 'react'
import Link from 'next/link'

import styles from './CommunitySchema.module.css'

function ArrowDown() {
  return (
    <svg
      className={styles.arrowDown}
      viewBox='0 0 10 16'
      fill='none'
      aria-hidden
    >
      <path
        d='M5 1v12M1.5 9.5L5 14l3.5-4.5'
        stroke='currentColor'
        strokeWidth='1.4'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

function ArrowRight() {
  return (
    <svg
      className={styles.arrowRight}
      viewBox='0 0 16 10'
      fill='none'
      aria-hidden
    >
      <path
        d='M1 5h12M9.5 1.5L14 5l-4.5 3.5'
        stroke='currentColor'
        strokeWidth='1.4'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

function ArrowUp() {
  return (
    <svg className={styles.arrowUp} viewBox='0 0 10 16' fill='none' aria-hidden>
      <path
        d='M5 15V3M1.5 6.5L5 2l3.5 4.5'
        stroke='currentColor'
        strokeWidth='1.4'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

export function CommunitySchema() {
  return (
    <>
      <figure
        className={styles.layout}
        aria-label='How community knowledge is structured'
      >
        <div className={styles.pathBox}>
          <p className={styles.pathLabel}>
            <strong>Learning Path:</strong>
            <em> my goal is to ...</em>
          </p>
          <div className={styles.pathGrid} aria-hidden>
            <span className={`${styles.chip} ${styles.chipResource}`}>
              Resource
            </span>
            <span />
            <span className={`${styles.chip} ${styles.chipResource}`}>
              Resource
            </span>
            <span />
            <span className={`${styles.chip} ${styles.chipResource}`}>
              Resource
            </span>

            <ArrowDown />
            <span />
            <ArrowDown />
            <span />
            <ArrowDown />

            <span className={`${styles.chip} ${styles.chipResource}`}>
              Resource
            </span>
            <span />
            <span className={`${styles.chip} ${styles.chipResource}`}>
              Resource
            </span>
            <span />
            <span className={`${styles.chip} ${styles.chipResource}`}>
              Resource
            </span>

            <ArrowDown />
            <span />
            <ArrowDown />
            <span />
            <ArrowDown />

            <span className={`${styles.chip} ${styles.chipConcept}`}>
              Concept
            </span>
            <ArrowRight />
            <span className={`${styles.chip} ${styles.chipConcept}`}>
              Concept
            </span>
            <ArrowRight />
            <span className={`${styles.chip} ${styles.chipConcept}`}>
              Concept
            </span>

            <ArrowUp />
            <span />
            <ArrowUp />
            <span />
            <ArrowUp />

            <span className={`${styles.chip} ${styles.chipNotes}`}>Notes</span>
            <span />
            <span className={`${styles.chip} ${styles.chipNotes}`}>Notes</span>
            <span />
            <span className={`${styles.chip} ${styles.chipNotes}`}>Notes</span>
          </div>
        </div>
      </figure>
      <p className={styles.notes}>
        A learning path can be anything. We think there are two subsets of
        this that are special cases.{' '}
        <Link href='/degrees' legacyBehavior>
          <a className={styles.notesLink}>Learning an academic degree</a>
        </Link>{' '}
        — e.g. <em>I want to learn computer science</em> — the structure for
        this is generally standardized, and we can seed these learning paths.
        The other is{' '}
        <Link href='/field-atlas' legacyBehavior>
          <a className={styles.notesLink}>
            open questions in research fields
          </a>
        </Link>{' '}
        — e.g.{' '}
        <em>
          I want enough background to understand how general relativity and
          quantum mechanics reconcile
        </em>
        . These are popularly discussed questions, and there is a general
        consensus in these fields for the background someone needs, so we can
        seed them.
      </p>
      <div className={styles.startPathWrap}>
        <Link href='/learning-path/new' legacyBehavior>
          <a className={styles.startPathBtn}>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              width='14'
              height='14'
              viewBox='0 0 14 14'
              fill='none'
              aria-hidden
            >
              <path
                d='M7 2.5V11.5M2.5 7H11.5'
                stroke='currentColor'
                strokeWidth='1.4'
                strokeLinecap='round'
              />
            </svg>
            Start a learning path
          </a>
        </Link>
      </div>
    </>
  )
}
