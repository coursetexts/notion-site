import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'

import styles from './HomeHeader.module.css'

const navItems = [
  { label: 'All Courses', href: '/all-courses' },
  { label: 'Resources', href: '/about' },
  {
    label: 'Commmunities',
    href: 'https://discord.gg/6xBECjtC55',
    external: true
  },
  {
    label: 'Donate',
    href: 'https://hcb.hackclub.com/donations/start/coursetexts',
    external: true
  }
]

type HomeHeaderProps = {
  className?: string
  style?: React.CSSProperties
  sidePadding?: string
  maxWidth?: string
}

export function HomeHeader({
  className,
  style,
  sidePadding = 'clamp(20px, 4.03vw, 58px)',
  maxWidth = '1324px'
}: HomeHeaderProps) {
  const router = useRouter()

  const cssVars = {
    '--home-side': sidePadding,
    '--home-main-max': maxWidth,
    ...style
  } as React.CSSProperties

  const focusSearch = React.useCallback(() => {
    const target =
      document.getElementById('home-search') ||
      document.getElementById('all-courses-search')

    if (!target) return false

    target.dispatchEvent(new CustomEvent('ct:search-pulse'))
    target.scrollIntoView({ behavior: 'smooth', block: 'center' })
    const input = target.querySelector('input') as HTMLInputElement | null
    input?.focus()
    return true
  }, [])

  const scrollToSearch = React.useCallback(() => {
    if (focusSearch()) return
    void router.push('/all-courses#all-courses-search')
  }, [focusSearch, router])

  return (
    <section className={className} style={cssVars}>
      <div className={styles.headerArea}>
        <header className={styles.header}>
          <Link href='/' legacyBehavior>
            <a className={`${styles.brand} ${styles.brandLink}`}>Coursetexts</a>
          </Link>

          <nav className={styles.middleItems} aria-label='Home page navigation'>
            {navItems.map((item) =>
              item.external ? (
                <a
                  key={item.label}
                  href={item.href}
                  target='_blank'
                  rel='noreferrer'
                  className={`${styles.middleItem} ${styles.interactiveLink}`}
                >
                  {item.label}
                </a>
              ) : (
                <Link key={item.label} href={item.href} legacyBehavior>
                  <a className={`${styles.middleItem} ${styles.interactiveLink}`}>
                    {item.label}
                  </a>
                </Link>
              )
            )}

            <button
              type='button'
              className={`${styles.searchIcon} ${styles.resetButton}`}
              onClick={scrollToSearch}
              aria-label='Jump to search'
            >
              <svg
                width='18'
                height='18'
                viewBox='0 0 18 18'
                fill='none'
                xmlns='http://www.w3.org/2000/svg'
              >
                <path
                  d='M8.15625 14.0625C11.4182 14.0625 14.0625 11.4182 14.0625 8.15625C14.0625 4.89432 11.4182 2.25 8.15625 2.25C4.89432 2.25 2.25 4.89432 2.25 8.15625C2.25 11.4182 4.89432 14.0625 8.15625 14.0625Z'
                  stroke='black'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                />
                <path
                  d='M12.3328 12.3328L15.75 15.75'
                  stroke='black'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                />
              </svg>
            </button>
          </nav>

          <Link href='/signin' legacyBehavior>
            <a className={styles.signUp}>Sign Up</a>
          </Link>
        </header>

        <div className={styles.divider} />
      </div>
    </section>
  )
}
