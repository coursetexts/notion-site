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
                    viewBox='0 0 20 20'
                    fill='none'
                    xmlns='http://www.w3.org/2000/svg'
                    aria-hidden='true'
                    className={styles.socialIcon}
                  >
                    <path
                      d='M19.1953 6.07039L16.8359 8.42195C16.3672 13.8829 11.7578 18.1251 6.24999 18.1251C5.11718 18.1251 4.17968 17.9454 3.46874 17.5938C2.89843 17.3048 2.66406 17.0001 2.60156 16.9063C2.54985 16.8278 2.51652 16.7386 2.50408 16.6454C2.49163 16.5522 2.50037 16.4573 2.52966 16.368C2.55894 16.2786 2.60802 16.197 2.67322 16.1293C2.73842 16.0615 2.81808 16.0093 2.90624 15.9766C2.92187 15.9688 4.76562 15.2657 5.96093 13.9141C5.21964 13.3863 4.56808 12.7427 4.03124 12.0079C2.96093 10.5548 1.82812 8.03132 2.50781 4.2657C2.52917 4.15375 2.58038 4.04965 2.65601 3.96439C2.73164 3.87913 2.82889 3.81589 2.93749 3.78132C3.04644 3.74565 3.1631 3.74063 3.27471 3.76681C3.38633 3.79299 3.48859 3.84936 3.57031 3.92976C3.59374 3.96101 6.19531 6.52351 9.37499 7.35164V6.87507C9.37806 6.37954 9.47871 5.88945 9.67118 5.43281C9.86365 4.97617 10.1442 4.56191 10.4968 4.21369C10.8493 3.86547 11.267 3.59011 11.726 3.40332C12.185 3.21653 12.6763 3.12199 13.1719 3.12507C13.8223 3.13435 14.4591 3.31193 15.0205 3.64053C15.5818 3.96912 16.0485 4.43751 16.375 5.00007H18.75C18.8734 4.99969 18.9941 5.03583 19.097 5.10396C19.1999 5.17208 19.2803 5.26913 19.3281 5.38289C19.3731 5.49833 19.3846 5.62416 19.3611 5.74583C19.3376 5.86749 19.2801 5.98002 19.1953 6.07039Z'
                      fill='#0089C4'
                    />
                  </svg>
                  <span className={styles.socialText}>Twitter</span>
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
                  <span className={styles.socialText}>Email</span>
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
