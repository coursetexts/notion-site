import * as React from 'react'

import styles from './HomeDonateSection.module.css'

export function HomeDonateSection() {
  return (
    <section className={styles.section}>
      <div className={styles.content}>
        <div className={styles.leftPane}>
          <h2 className={styles.heading}>Your donation makes a difference</h2>

          <p className={styles.body}>
            Coursetexts is a registered 501(c)(3) non-profit doing open research
            on self-learning, educational interfaces, and scaling open source
            software.
            <br />
            <br />
            Proceeds go fully towards the cost of open-sourcing courses.
          </p>

          <a
            href='https://hcb.hackclub.com/donations/start/coursetexts'
            target='_blank'
            rel='noreferrer'
            className={styles.ctaBar}
          >
            <span className={styles.ctaContent}>
              <img
                src='/images/home/heart.png'
                alt=''
                className={styles.heartIcon}
                aria-hidden='true'
              />
              <span className={styles.ctaText}>Send a Donation</span>
            </span>
            <span className={styles.arrowBox} aria-hidden='true'>
              <svg
                width='14'
                height='14'
                viewBox='0 0 14 14'
                fill='none'
                xmlns='http://www.w3.org/2000/svg'
              >
                <path
                  d='M5.25 11.375L9.625 7L5.25 2.625'
                  stroke='#5D534B'
                  strokeWidth='1.60417'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                />
              </svg>
            </span>
          </a>
        </div>

        <div className={styles.rightPane}>
          <a
            href='https://hcb.hackclub.com/donations/start/coursetexts'
            target='_blank'
            rel='noreferrer'
            className={styles.supportRow}
          >
            <img
              src='/images/home/donation-badge.png?v=2'
              alt='Donation badge'
              className={styles.donationBadge}
            />

            <span className={styles.supportCopy}>
              <p className={styles.supportText}>Support us monthly</p>
              <p className={styles.getStartedText}>Get Started →</p>
            </span>
          </a>

          <div className={styles.previewClip}>
            <img
              src='/images/home/donation-preview.png'
              alt='Donation preview'
              className={styles.previewImage}
            />
          </div>
        </div>
      </div>
    </section>
  )
}
