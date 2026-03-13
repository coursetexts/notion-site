import * as React from 'react'
import cs from 'classnames'
import { HomeLicenseBar } from './HomeLicenseBar'
import styles from './HomeFooter.module.css'

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
      href: '/about'
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
    { label: 'University of British Columbia', href: '/all-courses?q=British+Columbia' },
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
    { label: 'Press', href: '/about' },
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
    <footer className={cs(styles.footer, variant === 'course' && styles.footerCourse)}>
      <div className={styles.contentShell}>
        <div className={styles.content}>
          <p className={styles.heading}>Learn more, learn better.</p>

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
                        ? 'Donate to support'
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

          <div className={styles.topRightCard}>
            <div className={styles.topRightGrid}>
              <svg
                width='66'
                height='59'
                viewBox='0 0 66 59'
                fill='none'
                xmlns='http://www.w3.org/2000/svg'
                className={styles.topRightScribble}
              >
                <path
                  d='M48.6099 2.21801C42.6079 3.53137 29.2591 6.83058 26.2696 8.18817C21.8197 10.2089 18.4311 15.2318 17.099 18.5951C15.0712 23.7148 13.0609 28.6159 6.68825 35.9735C2.73953 40.5325 1.31347 43.9699 1.10809 45.4388C0.7546 47.9669 1.3145 51.2002 2.09753 53.9503C2.61778 55.7775 4.19464 56.5249 5.30052 57.0592C8.13451 58.4284 12.9026 57.1455 16.5727 55.4009C22.0703 52.7875 25.9452 45.4835 29.2843 38.3163C30.145 36.4689 30.7925 35.479 32.1098 34.4989C36.3822 31.3198 43.5 31.0755 47.7486 30.1618C52.2404 29.1958 56.3456 26.2193 60.4853 22.3592C64.1348 18.9561 64.6036 12.5826 64.7754 6.09573C64.8175 4.50234 63.8379 3.62438 62.8528 2.77343C60.7706 0.974715 57.8118 1.06427 54.3663 1.00058C53.5511 1.05173 52.9978 1.1614 52.4522 1.28294C51.9067 1.40447 51.3855 1.53454 49.778 2.15622'
                  stroke='#0089C4'
                  strokeWidth='2'
                  strokeLinecap='round'
                />
                <path
                  d='M7.62506 44.5211C7.03747 44.5211 5.68253 44.7205 4.08652 45.484C2.51843 46.2342 3.94856 48.9518 4.76292 50.6902C5.31048 51.8591 6.43026 52.342 7.4752 52.7162C10.0494 53.6381 12.8517 52.8986 13.7413 52.487C15.8775 51.4986 14.2453 47.954 14.0597 46.4016C13.9495 45.4796 17.4204 45.4365 20.9426 45.1612C22.2228 45.0612 22.336 44.3355 22.4118 43.7841C22.6965 41.714 20.6271 39.3095 19.8448 36.489C19.4935 35.2222 20.7066 34.1205 21.8184 33.3779C22.8951 32.6588 24.2573 32.7049 25.3589 32.8653C26.5919 33.045 27.465 34.0374 28.1753 34.288C31.1172 35.326 28.7613 27.7947 29.4864 25.9098C29.6744 25.4213 30.2694 25.1384 30.8199 24.9596C33.0222 24.2446 35.2121 25.7294 37.1081 27.1324C38.3393 28.0435 38.8075 29.3935 39.6649 29.8838C40.0642 30.1122 40.6283 29.8497 41.0182 29.2863C43.6703 25.4544 42.5415 19.968 44.0561 18.1901C44.7676 17.3548 46.2028 17.5455 47.1626 17.7774C49.0932 18.2438 49.1857 20.9592 50.8001 22.4578C51.2055 22.8341 51.7664 22.9948 52.2847 23.096C52.803 23.1972 53.3379 23.1583 53.8043 22.9002C55.7974 21.797 55.4997 18.2978 56.2176 15.8683C56.5406 14.7754 58.9046 14.9465 60.4841 14.7196C61.1535 14.6235 61.4227 14.1293 61.4563 13.6317C61.619 11.2239 57.7791 9.2582 56.0826 7.17605C53.5038 4.01094 51.5694 2.91706 49.8698 2.36046C49.1409 2.12175 48.5276 2.47647 48.1082 2.79973C46.4709 4.06189 46.7264 7.19433 47.3343 9.47256C47.582 10.4006 48.8771 10.8478 49.3391 11.4713C49.5392 11.7413 48.9257 12.1243 48.1456 12.2871C46.2918 12.6741 44.297 12.3091 42.8673 11.9611C40.5429 11.3954 39.1875 9.50972 36.8872 9.37486C34.6001 9.24077 32.7111 11.1861 31.1877 12.2709C28.6702 14.0635 37.8998 15.0905 39.1951 16.7302C39.8579 17.5693 39.2011 18.833 38.6523 19.7496C38.3805 20.2034 37.58 20.2928 36.9678 20.242C34.1204 20.0059 31.0525 16.9487 28.2416 16.1169C26.1926 15.5107 24.2118 16.1167 23.12 16.5443C22.043 16.966 21.2081 17.7936 20.7159 18.5483C19.7551 20.0217 25.4849 23.0703 26.5952 26.2852C27.2028 28.0444 22.0622 26.4361 19.4104 26.2675C18.7797 26.2274 18.2049 26.6261 17.779 26.9782C15.8067 28.6087 16.4644 32.1677 17.1281 34.0553C17.5047 35.1264 16.8002 36.4446 16.0132 37.4978C14.673 39.2913 11.2934 37.5701 10.3507 37.8902C9.43722 39.9939 9.25487 42.3943 8.88575 44.111C8.51798 44.6754 7.78384 44.617 6.59151 44.4066'
                  stroke='#0089C4'
                  strokeWidth='2'
                  strokeLinecap='round'
                />
              </svg>
              <div className={styles.scriptStack}>
                <p className={styles.scriptText}>
                  the mitochondria is the powerhouse of the cell
                </p>
                <p className={styles.nonProfitText}>501(c)(3) Non-profit.</p>
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

                <a href='mailto:coursetexts.info@gmail.com' className={styles.socialBox}>
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
                    <a key={item.label} href={item.href} className={styles.footerLinkItem}>
                      {item.label}
                    </a>
                  ))}
                </div>
              </div>

              <div className={styles.footerColumn}>
                <p className={styles.footerHeading}>Schools</p>
                <div className={styles.footerLinksColumn}>
                  {schoolLinks.map((item) => (
                    <a key={item.label} href={item.href} className={styles.footerLinkItem}>
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
                        target={item.href.startsWith('http') ? '_blank' : undefined}
                        rel={item.href.startsWith('http') ? 'noreferrer' : undefined}
                        className={styles.footerLinkItem}
                      >
                        {item.label}
                      </a>
                    ) : (
                      <a key={item.label} href={item.href} className={styles.footerLinkItem}>
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
            <p className={styles.disclaimerHeading}>Disclaimers and footnotes</p>

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
