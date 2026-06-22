import * as React from 'react'

import cs from 'classnames'

import styles from './HomeFooter.module.css'
import { HomeLicenseBar } from './HomeLicenseBar'

type NavItem = {
  label: string
  href: string
  external?: boolean
}

type HomeFooterProps = {
  /** Use 'course' on course pages to match hero background and reduce gap above footer */
  variant?: 'default' | 'course'
}

export function HomeFooter({ variant = 'default' }: HomeFooterProps) {
  const supportCards: Array<NavItem & { image: string }> = [
    {
      image: '/images/home/footer-for-students.png',
      label: 'for students',
      href: 'https://hcb.hackclub.com/donations/start/coursetexts',
      external: true
    },
    {
      image: '/images/home/footer-for-professors.png',
      label: 'for professors',
      href: '/manifesto'
    }
  ]

  const subjectLinks: NavItem[] = [
    { label: 'Science', href: '/all-courses?subjects=Science' },
    { label: 'Maths', href: '/all-courses?subjects=Math' },
    { label: 'Art', href: '/all-courses?subjects=Art' },
    { label: 'English', href: '/all-courses?subjects=English' }
  ]

  const schoolLinks: NavItem[] = [
    { label: 'Harvard University', href: '/all-courses?q=Harvard' },
    { label: 'Stanford University', href: '/all-courses?q=Stanford' },
    { label: 'University of Waterloo', href: '/all-courses?q=Waterloo' },
    {
      label: 'University of British Columbia',
      href: '/all-courses?q=British+Columbia'
    },
    { label: 'Princeton University', href: '/all-courses?q=Princeton' },
    { label: 'New York University', href: '/all-courses?q=New+York+University' }
  ]

  const communityLinks: NavItem[] = [
    {
      label: 'Donate',
      href: 'https://hcb.hackclub.com/donations/start/coursetexts',
      external: true
    },
    { label: 'Blogs', href: 'https://blog.coursetexts.org', external: true },
    { label: 'Press', href: '/manifesto' },
    {
      label: 'Help',
      href: 'mailto:coursetexts.info@gmail.com',
      external: true
    },
    { label: 'Terms of Use', href: '/terms-of-service' },
    { label: 'Privacy Policy', href: '/privacy-policy' }
  ]

  const disclaimers = [
    {
      number: '1.',
      text: 'Coursetexts is a small team led by student volunteers from Harvard, Waterloo and MIT.'
    },
    {
      number: '2.',
      text: "Most professors retain ownership of their syllabi under their university's intellectual property policies. If you are a professor whose syllabus appears on Coursetexts and would like it removed, please contact us immediately at coursetexts@mit.edu"
    },
    {
      number: '3.',
      text: 'Coursetexts has neither sought nor received permission from any university to open-source courses that were taught at that university. It is not affiliated with, sponsored by, or endorsed by any university'
    }
  ]

  return (
    <footer
      className={cs(styles.footer, variant === 'course' && styles.footerCourse)}
    >
      <div className={styles.contentShell}>
        <div className={styles.content}>
          <p className={styles.heading}>Learn more, learn better.</p>

          <div className={styles.footerHeroRow}>
            <div className={styles.footerHeroLeft}>
              <div className={styles.supportCardsRow}>
                {supportCards.map((card) => {
                  const cardInner = (
                    <>
                      <img
                        src={card.image}
                        alt=''
                        aria-hidden='true'
                        className={styles.supportCardIcon}
                      />

                      <div className={styles.supportCardCopy}>
                        <p className={styles.supportCardLabel}>{card.label}</p>
                        <p className={styles.supportCardTitle}>
                          {card.label === 'for students'
                            ? 'Contribute'
                            : 'Contribute your material'}
                        </p>
                      </div>
                    </>
                  )

                  return (
                    <a
                      key={card.label}
                      href={card.href}
                      target={card.external ? '_blank' : undefined}
                      rel={card.external ? 'noreferrer' : undefined}
                      className={styles.supportCard}
                    >
                      {cardInner}
                    </a>
                  )
                })}
              </div>
            </div>
          </div>

          <div className={styles.footerColumnsRow}>
            <div className={styles.footerColumn}>
              <p className={styles.footerHeading}>Stay up to date</p>
              <div className={styles.socialRow}>
                <a
                  href='https://x.com/coursetexts'
                  target='_blank'
                  rel='noreferrer'
                  className={styles.socialBox}
                >
                  <svg
                    width='20'
                    height='20'
                    viewBox='0 0 24 24'
                    fill='none'
                    xmlns='http://www.w3.org/2000/svg'
                    aria-hidden='true'
                    className={styles.socialIcon}
                  >
                    <path
                      d='M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.66l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z'
                      fill='#0089C4'
                    />
                  </svg>
                  <span className={styles.socialText}>Share on X</span>
                </a>

                <a
                  href='mailto:coursetexts.info@gmail.com'
                  className={styles.socialBox}
                >
                  <svg
                    width='20'
                    height='20'
                    viewBox='0 0 20 20'
                    fill='none'
                    xmlns='http://www.w3.org/2000/svg'
                    aria-hidden='true'
                    className={styles.socialIcon}
                  >
                    <path
                      d='M2.5 4.375H17.5V15C17.5 15.1658 17.4342 15.3247 17.3169 15.4419C17.1997 15.5592 17.0408 15.625 16.875 15.625H3.125C2.95924 15.625 2.80027 15.5592 2.68306 15.4419C2.56585 15.3247 2.5 15.1658 2.5 15V4.375Z'
                      stroke='#0089C4'
                      strokeWidth='1.25'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                    />
                    <path
                      d='M17.5 4.375L10 11.25L2.5 4.375'
                      stroke='#0089C4'
                      strokeWidth='1.25'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                    />
                  </svg>
                  <span className={styles.socialText}>Email Us!</span>
                </a>
              </div>
            </div>

            <div className={styles.footerMainColumns}>
              <div className={styles.footerColumn}>
                <p className={styles.footerHeading}>Subjects</p>
                <div className={styles.footerLinksColumn}>
                  {subjectLinks.map((item) => (
                    <a
                      key={item.label}
                      href={item.href}
                      className={styles.footerLinkItem}
                    >
                      {item.label}
                    </a>
                  ))}
                </div>
              </div>

              <div className={styles.footerColumn}>
                <p className={styles.footerHeading}>Schools</p>
                <div className={styles.footerLinksColumn}>
                  {schoolLinks.map((item) => (
                    <a
                      key={item.label}
                      href={item.href}
                      className={styles.footerLinkItem}
                    >
                      {item.label}
                    </a>
                  ))}
                </div>
              </div>

              <div className={styles.footerColumn}>
                <p className={styles.footerHeading}>Community</p>
                <div className={styles.footerLinksColumn}>
                  {communityLinks.map((item) =>
                    item.external ? (
                      <a
                        key={item.label}
                        href={item.href}
                        target={
                          item.href.startsWith('http') ? '_blank' : undefined
                        }
                        rel={
                          item.href.startsWith('http')
                            ? 'noreferrer'
                            : undefined
                        }
                        className={styles.footerLinkItem}
                      >
                        {item.label}
                      </a>
                    ) : (
                      <a
                        key={item.label}
                        href={item.href}
                        className={styles.footerLinkItem}
                      >
                        {item.label}
                      </a>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className={styles.disclaimerDivider} aria-hidden='true' />

          <div className={styles.disclaimerBlock}>
            <p className={styles.disclaimerHeading}>
              Disclaimers and footnotes
            </p>

            <div className={styles.disclaimerTextBox}>
              {disclaimers.map((item) => (
                <div key={item.number} className={styles.disclaimerRow}>
                  <span className={styles.disclaimerNumber}>{item.number}</span>
                  <p className={styles.disclaimerText}>{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <HomeLicenseBar />
    </footer>
  )
}
