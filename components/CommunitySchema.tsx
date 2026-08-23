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

export function CommunitySchema() {
  return (
    <figure className={styles.figure} aria-label='How community knowledge is structured'>
      <div className={styles.layout}>
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
          </div>
        </div>

        <svg
          className={styles.brace}
          viewBox='0 0 36 100'
          preserveAspectRatio='none'
          aria-hidden
        >
          <path
            d='M0 50 H16 M16 23 V77 M16 23 H36 M16 77 H36'
            fill='none'
            stroke='#2c1a0c'
            strokeWidth='1.5'
            vectorEffect='non-scaling-stroke'
          />
        </svg>

        <div className={styles.cards}>
          <Link href='/degrees'>
            <a className={`${styles.card} ${styles.cardDegrees}`}>
              <span className={styles.cardTitle}>Degrees</span>
              <span className={styles.cardSub}>Seeded From Real Courses</span>
            </a>
          </Link>
          <Link href='/human-knowledge-atlas'>
            <a className={`${styles.card} ${styles.cardQuestions}`}>
              <span className={styles.cardTitle}>Research Questions</span>
              <span className={styles.cardSub}>Seeded From Open Questions</span>
            </a>
          </Link>
        </div>
      </div>
      <figcaption className={styles.note}>
        A learning path can be anything. We think there are two subsets of
        this that are special cases. Learning an academic degree — e.g.{' '}
        <em>I want to learn computer science</em> — the structure for this is
        generally standardized, and we can seed these learning paths. The
        other is open questions in research fields — e.g.{' '}
        <em>
          I want enough background to understand how general relativity and
          quantum mechanics reconcile
        </em>
        . These are popularly discussed questions, and there is a general
        consensus in these fields for the background someone needs, so we can
        seed them.
      </figcaption>
    </figure>
  )
}
