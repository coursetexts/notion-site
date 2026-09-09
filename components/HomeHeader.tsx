import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'

import { useAuthOptional } from '@/contexts/AuthContext'
import { IoClose } from '@react-icons/all-files/io5/IoClose'
import { AnimatePresence, motion } from 'framer-motion'
import { createPortal, flushSync } from 'react-dom'

import { getCachedAuth } from '@/lib/auth-cache'
import { currentAuthRedirectPath, signInPageHref } from '@/lib/auth-redirect'

import { CoursetextsBookIcon } from './CoursetextsBookIcon'
import { CreateLearningPathModal } from './CreateLearningPathModal'
import styles from './HomeHeader.module.css'
import { PinnedCoursesNav } from './PinnedCoursesNav'

type AboutNavChild = {
  label: string
  description: string
  href: string
  external?: boolean
}

type NavItem =
  | {
      kind: 'link'
      label: string
      href: string
      external?: boolean
    }
  | {
      kind: 'action'
      label: string
      action: 'create-path'
    }
  | {
      kind: 'menu'
      label: string
      children: AboutNavChild[]
    }

const aboutChildren: AboutNavChild[] = [
  {
    label: 'Why Coursetexts',
    description:
      'Mission, manifesto, origins, team, advisors, and nonprofit status.',
    href: '/manifesto'
  },
  {
    label: 'For Professors',
    description: 'Contribute materials or publish a course.',
    href: '/professors'
  },
  {
    label: 'Blog & Research',
    description: 'Product research, educational interfaces and project updates.',
    href: 'https://blog.coursetexts.org',
    external: true
  },
  {
    label: 'Support Coursetexts',
    description: 'Donation page and explanation of how funding is used.',
    href: '/support'
  }
]

const navItems: NavItem[] = [
  { kind: 'link', label: 'Explore', href: '/all-courses' },
  { kind: 'action', label: 'Create a path', action: 'create-path' },
  { kind: 'link', label: 'Community', href: '/community' },
  { kind: 'menu', label: 'About', children: aboutChildren }
]

function AboutChildLink({
  child,
  className,
  onNavigate
}: {
  child: AboutNavChild
  className: string
  onNavigate?: () => void
}) {
  const inner = (
    <>
      <span className={styles.aboutLinkTitle}>{child.label}</span>
      <span className={styles.aboutLinkDesc}>{child.description}</span>
    </>
  )

  if (child.external) {
    return (
      <a
        href={child.href}
        target='_blank'
        rel='noreferrer'
        className={className}
        role='menuitem'
        onClick={onNavigate}
      >
        {inner}
      </a>
    )
  }

  return (
    <Link href={child.href} legacyBehavior>
      <a className={className} role='menuitem' onClick={onNavigate}>
        {inner}
      </a>
    </Link>
  )
}

function AboutFlyout({ onNavigate }: { onNavigate?: () => void }) {
  const wrapRef = React.useRef<HTMLDivElement>(null)
  const [open, setOpen] = React.useState(false)

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'Escape') return
    setOpen(false)
    wrapRef.current?.querySelector('button')?.focus()
  }

  function handleBlur(event: React.FocusEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node)) {
      setOpen(false)
    }
  }

  return (
    <div
      ref={wrapRef}
      className={styles.communityFlyout}
      data-open={open ? 'true' : 'false'}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
    >
      <button
        type='button'
        className={`${styles.middleItem} ${styles.interactiveLink}`}
        aria-haspopup='menu'
        aria-expanded={open}
      >
        About
      </button>
      <div className={styles.communityPanel} role='menu' aria-label='About'>
        <div
          className={`${styles.communityPanelInner} ${styles.aboutPanelInner}`}
        >
          {aboutChildren.map((child) => (
            <AboutChildLink
              key={child.href}
              child={child}
              className={`${styles.communityLink} ${styles.aboutLink}`}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

type HomeHeaderProps = {
  className?: string
  style?: React.CSSProperties
  sidePadding?: string
  maxWidth?: string
}

function HeaderAccountAction({
  isLoggedIn,
  isOwnProfilePage,
  accountHref,
  accountLabel,
  className,
  onNavigate,
  onSignOut
}: {
  isLoggedIn: boolean
  isOwnProfilePage: boolean
  accountHref: string
  accountLabel: string
  className: string
  onNavigate?: () => void
  onSignOut: () => void
}) {
  if (isLoggedIn && isOwnProfilePage) {
    return (
      <button type='button' className={className} onClick={onSignOut}>
        Sign out
      </button>
    )
  }
  return (
    <Link href={accountHref} legacyBehavior>
      <a
        className={className}
        onClick={(event) => {
          onNavigate?.()
          if (isLoggedIn) return
          event.preventDefault()
          window.location.assign(signInPageHref(currentAuthRedirectPath()))
        }}
      >
        {accountLabel}
      </a>
    </Link>
  )
}

export function HomeHeader({
  className,
  style,
  sidePadding = 'clamp(20px, 4.03vw, 58px)',
  maxWidth = '1324px'
}: HomeHeaderProps) {
  const router = useRouter()
  const auth = useAuthOptional()
  const cached = React.useMemo(() => getCachedAuth(), [])
  const user = auth?.user ?? cached.user
  const isLoggedIn = Boolean(user)
  const isOwnProfilePage = router.pathname === '/profile'
  const accountHref = isLoggedIn ? '/profile' : signInPageHref(router.asPath)
  const accountLabel = isLoggedIn ? 'Your Profile' : 'Sign in'

  const [menuOpen, setMenuOpen] = React.useState(false)
  const [aboutMenuOpen, setAboutMenuOpen] = React.useState(false)
  const [createPathOpen, setCreatePathOpen] = React.useState(false)
  const [portalReady, setPortalReady] = React.useState(false)
  const [searchDraft, setSearchDraft] = React.useState('')
  const [expandRect, setExpandRect] = React.useState<DOMRect | null>(null)
  const [collapseRect, setCollapseRect] = React.useState<DOMRect | null>(null)
  const menuBtnRef = React.useRef<HTMLButtonElement>(null)
  const expandRectRef = React.useRef<DOMRect | null>(null)
  const closeBtnRef = React.useRef<HTMLButtonElement>(null)

  const cssVars = {
    '--home-side': sidePadding,
    '--home-main-max': maxWidth,
    ...style
  } as React.CSSProperties

  const focusSearch = React.useCallback(() => {
    const target =
      document.getElementById('home-search') ||
      document.getElementById('all-courses-search') ||
      document.getElementById('degrees-search')

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

  const openCreatePath = React.useCallback(() => {
    setCreatePathOpen(true)
  }, [])

  React.useEffect(() => {
    setPortalReady(true)
  }, [])

  React.useEffect(() => {
    if (!menuOpen) {
      setAboutMenuOpen(false)
      return
    }
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  const closeMenu = React.useCallback(() => {
    const r =
      menuBtnRef.current?.getBoundingClientRect() ?? expandRectRef.current
    flushSync(() => {
      setCollapseRect(r ?? null)
    })
    setMenuOpen(false)
  }, [])

  const handleSignOut = React.useCallback(async () => {
    closeMenu()
    if (auth?.signOut) await auth.signOut()
    void router.replace('/')
  }, [auth, closeMenu, router])

  const openMenu = React.useCallback(() => {
    const r = menuBtnRef.current?.getBoundingClientRect() ?? null
    expandRectRef.current = r
    setExpandRect(r)
    setCollapseRect(null)
    setMenuOpen(true)
  }, [])

  React.useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen, closeMenu])

  React.useEffect(() => {
    if (!menuOpen) return
    router.events.on('routeChangeStart', closeMenu)
    return () => {
      router.events.off('routeChangeStart', closeMenu)
    }
  }, [menuOpen, router.events, closeMenu])

  React.useEffect(() => {
    if (menuOpen) {
      closeBtnRef.current?.focus()
    }
  }, [menuOpen])

  const handleMenuSearchSubmit = React.useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      const q = searchDraft.trim()
      closeMenu()
      if (q) {
        void router.push(`/all-courses?q=${encodeURIComponent(q)}`)
        setSearchDraft('')
        return
      }
      scrollToSearch()
    },
    [closeMenu, router, scrollToSearch, searchDraft]
  )

  const expandSpring = {
    type: 'spring' as const,
    damping: 34,
    stiffness: 300,
    mass: 0.82
  }

  const mobileMenu = portalReady ? (
    <AnimatePresence mode='wait'>
      {menuOpen ? (
        <motion.div
          key='home-mobile-menu'
          id='home-mobile-nav-dialog'
          className={styles.menuRoot}
          role='dialog'
          aria-modal='true'
          aria-label='Site menu'
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <motion.button
            type='button'
            className={styles.menuBackdrop}
            aria-label='Close menu'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            onClick={closeMenu}
          />
          <motion.div
            className={styles.menuPanelOuter}
            initial={{
              left: expandRect?.left ?? 0,
              top: expandRect?.top ?? 0,
              width: expandRect?.width ?? 40,
              height: expandRect?.height ?? 40,
              borderRadius: 8
            }}
            animate={{
              left: 0,
              top: 0,
              width: '100vw',
              height: '100dvh',
              borderRadius: 0
            }}
            exit={{
              left: collapseRect?.left ?? 0,
              top: collapseRect?.top ?? 0,
              width: collapseRect?.width ?? 40,
              height: collapseRect?.height ?? 40,
              borderRadius: 8
            }}
            transition={expandSpring}
          >
            <div className={styles.menuPanelInner}>
              <div className={styles.menuPanelHeader}>
                <p className={styles.menuPanelTitle}>Menu</p>
                <button
                  ref={closeBtnRef}
                  type='button'
                  className={styles.menuCloseBtn}
                  onClick={closeMenu}
                  aria-label='Close menu'
                >
                  <IoClose aria-hidden className={styles.menuCloseIcon} />
                </button>
              </div>

              <form
                className={styles.menuSearchForm}
                onSubmit={handleMenuSearchSubmit}
                role='search'
              >
                <span className={styles.menuSearchIcon} aria-hidden>
                  <svg
                    width='18'
                    height='18'
                    viewBox='0 0 18 18'
                    fill='none'
                    xmlns='http://www.w3.org/2000/svg'
                  >
                    <path
                      d='M8.15625 14.0625C11.4182 14.0625 14.0625 11.4182 14.0625 8.15625C14.0625 4.89432 11.4182 2.25 8.15625 2.25C4.89432 2.25 2.25 4.89432 2.25 8.15625C2.25 11.4182 4.89432 14.0625 8.15625 14.0625Z'
                      stroke='currentColor'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                    />
                    <path
                      d='M12.3328 12.3328L15.75 15.75'
                      stroke='currentColor'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                    />
                  </svg>
                </span>
                <input
                  type='search'
                  className={styles.menuSearchInput}
                  placeholder='SEARCH'
                  value={searchDraft}
                  onChange={(e) => setSearchDraft(e.target.value)}
                  aria-label='Search courses'
                />
              </form>

              <nav className={styles.menuNav} aria-label='Home page navigation'>
                {navItems.map((item) => {
                  if (item.kind === 'menu') {
                    return (
                      <div key={item.label} className={styles.menuNavGroup}>
                        <button
                          type='button'
                          className={styles.menuNavToggle}
                          onClick={() => setAboutMenuOpen((open) => !open)}
                          aria-expanded={aboutMenuOpen}
                        >
                          <span>{item.label}</span>
                          <span
                            className={`${styles.menuNavChevron}${
                              aboutMenuOpen ? ` ${styles.menuNavChevronOpen}` : ''
                            }`}
                            aria-hidden
                          >
                            <svg
                              xmlns='http://www.w3.org/2000/svg'
                              width='12'
                              height='12'
                              viewBox='0 0 12 12'
                              fill='none'
                            >
                              <path
                                d='M4.5 2.5L8 6L4.5 9.5'
                                stroke='currentColor'
                                strokeWidth='1.3'
                                strokeLinecap='round'
                                strokeLinejoin='round'
                              />
                            </svg>
                          </span>
                        </button>
                        <div
                          className={`${styles.menuNavSubmenu}${
                            aboutMenuOpen ? ` ${styles.menuNavSubmenuOpen}` : ''
                          }`}
                          aria-hidden={!aboutMenuOpen}
                        >
                          <div className={styles.menuNavSubmenuInner}>
                            {item.children.map((child) =>
                              child.external ? (
                                <a
                                  key={child.href}
                                  href={child.href}
                                  target='_blank'
                                  rel='noreferrer'
                                  className={styles.menuNavChild}
                                  onClick={closeMenu}
                                  tabIndex={aboutMenuOpen ? undefined : -1}
                                >
                                  <span className={styles.aboutLinkTitle}>
                                    {child.label}
                                  </span>
                                  <span className={styles.aboutLinkDesc}>
                                    {child.description}
                                  </span>
                                </a>
                              ) : (
                                <Link
                                  key={child.href}
                                  href={child.href}
                                  legacyBehavior
                                >
                                  <a
                                    className={styles.menuNavChild}
                                    onClick={closeMenu}
                                    tabIndex={aboutMenuOpen ? undefined : -1}
                                  >
                                    <span className={styles.aboutLinkTitle}>
                                      {child.label}
                                    </span>
                                    <span className={styles.aboutLinkDesc}>
                                      {child.description}
                                    </span>
                                  </a>
                                </Link>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  }

                  if (item.kind === 'action') {
                    return (
                      <button
                        key={item.label}
                        type='button'
                        className={`${styles.resetButton} ${styles.menuNavLink}`}
                        onClick={() => {
                          closeMenu()
                          openCreatePath()
                        }}
                      >
                        {item.label}
                      </button>
                    )
                  }

                  if (item.external) {
                    return (
                      <a
                        key={item.label}
                        href={item.href}
                        target='_blank'
                        rel='noreferrer'
                        className={styles.menuNavLink}
                        onClick={closeMenu}
                      >
                        {item.label}
                      </a>
                    )
                  }

                  return (
                    <Link key={item.label} href={item.href} legacyBehavior>
                      <a className={styles.menuNavLink} onClick={closeMenu}>
                        {item.label}
                      </a>
                    </Link>
                  )
                })}
              </nav>

              <div className={styles.menuFooter}>
                <HeaderAccountAction
                  isLoggedIn={isLoggedIn}
                  isOwnProfilePage={isOwnProfilePage}
                  accountHref={accountHref}
                  accountLabel={accountLabel}
                  className={styles.menuSignUp}
                  onNavigate={closeMenu}
                  onSignOut={() => {
                    void handleSignOut()
                  }}
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  ) : null

  return (
    <>
      <section className={className} style={cssVars} data-site-header=''>
        <div className={styles.headerArea}>
          <header className={styles.header}>
            <Link href='/' legacyBehavior>
              <a className={`${styles.brand} ${styles.brandLink}`}>
                <CoursetextsBookIcon className={styles.brandIcon} />
                Coursetexts
              </a>
            </Link>

            <div className={styles.headerDesktopOnly}>
              <nav
                className={styles.middleItems}
                aria-label='Home page navigation'
              >
                {navItems.map((item) => {
                  if (item.kind === 'menu') {
                    return <AboutFlyout key={item.label} />
                  }

                  if (item.kind === 'action') {
                    return (
                      <button
                        key={item.label}
                        type='button'
                        className={`${styles.middleItem} ${styles.interactiveLink}`}
                        onClick={openCreatePath}
                      >
                        {item.label}
                      </button>
                    )
                  }

                  if (item.external) {
                    return (
                      <a
                        key={item.label}
                        href={item.href}
                        target='_blank'
                        rel='noreferrer'
                        className={`${styles.middleItem} ${styles.interactiveLink}`}
                      >
                        {item.label}
                      </a>
                    )
                  }

                  return (
                    <Link key={item.label} href={item.href} legacyBehavior>
                      <a
                        className={`${styles.middleItem} ${styles.interactiveLink}`}
                      >
                        {item.label}
                      </a>
                    </Link>
                  )
                })}

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
            </div>

            <div className={styles.headerEnd}>
              {isLoggedIn && <PinnedCoursesNav />}
              <div className={styles.headerDesktopOnly}>
                <HeaderAccountAction
                  isLoggedIn={isLoggedIn}
                  isOwnProfilePage={isOwnProfilePage}
                  accountHref={accountHref}
                  accountLabel={accountLabel}
                  className={styles.signUp}
                  onSignOut={() => {
                    void handleSignOut()
                  }}
                />
              </div>
              <button
                ref={menuBtnRef}
                type='button'
                className={styles.mobileMenuBtn}
                onClick={openMenu}
                aria-expanded={menuOpen}
                aria-controls='home-mobile-nav-dialog'
                aria-label='Open menu'
              >
                <span className={styles.mobileMenuBar} aria-hidden />
                <span className={styles.mobileMenuBar} aria-hidden />
              </button>
            </div>
          </header>

          <div className={styles.divider} />
        </div>
      </section>

      {portalReady && createPortal(mobileMenu, document.body)}
      <CreateLearningPathModal
        open={createPathOpen}
        onClose={() => setCreatePathOpen(false)}
      />
    </>
  )
}
