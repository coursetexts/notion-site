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
import { ProfileNavDropdown } from './ProfileNavDropdown'
import styles from './HomeHeader.module.css'
import { PinnedCoursesNav } from './PinnedCoursesNav'
import {
  ProfileAcademicIcon,
  ProfileAnnouncementIcon,
  ProfilePathIcon
} from '@/components/ProfileTabItemIcons'
import {
  isPathsProductPathname,
  pathsCatalogHref,
  pathsCommunityHref,
  pathsHomeHref,
  pathsProfileHref
} from '@/lib/paths-routes'
import { getUnreadProfileNotificationCount } from '@/lib/profile-notifications-db'
import { subscribeReplyNotificationUpdates } from '@/lib/reply-notifications'
import { ownProfileTabHref } from '@/lib/profile-tabs'

type NavMenuChild = {
  label: string
  description: string
  href: string
  icon: React.ReactNode
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
      href?: string
      children: NavMenuChild[]
    }

const navIconProps = {
  width: 16,
  height: 16,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true as const
}

function NavManifestoIcon() {
  return (
    <svg {...navIconProps}>
      <path d='M6 4h9l3 3v13H6V4z' />
      <path d='M15 4v3h3' />
      <path d='M9 12h6' />
      <path d='M9 16h6' />
    </svg>
  )
}

function NavProfessorsIcon() {
  return (
    <svg {...navIconProps}>
      <path d='M4 19V7a2 2 0 0 1 2-2h12' />
      <path d='M8 19h12V9H8v10z' />
      <path d='M11 12h6' />
      <path d='M11 15h4' />
    </svg>
  )
}

function NavBlogIcon() {
  return (
    <svg {...navIconProps}>
      <path d='M5 5h14v14H5z' />
      <path d='M8 9h8' />
      <path d='M8 13h8' />
      <path d='M8 17h5' />
    </svg>
  )
}

function NavSupportIcon() {
  return (
    <svg {...navIconProps}>
      <path d='M12 20s-7-4.4-7-9.2A3.8 3.8 0 0 1 12 8.2a3.8 3.8 0 0 1 7 2.6C19 15.6 12 20 12 20z' />
    </svg>
  )
}

const communityChildren: NavMenuChild[] = [
  {
    label: 'Feed',
    description: 'Updates and activity from people you follow.',
    href: ownProfileTabHref('feed'),
    icon: <ProfileAnnouncementIcon />
  }
]

const aboutChildren: NavMenuChild[] = [
  {
    label: 'Why Coursetexts',
    description:
      'Mission, manifesto, origins, team, advisors, and nonprofit status.',
    href: '/manifesto',
    icon: <NavManifestoIcon />
  },
  {
    label: 'For Professors',
    description: 'Contribute materials or publish a course.',
    href: '/professors',
    icon: <NavProfessorsIcon />
  },
  {
    label: 'Blog & Research',
    description: 'Product research, educational interfaces and project updates.',
    href: 'https://blog.coursetexts.org',
    external: true,
    icon: <NavBlogIcon />
  },
  {
    label: 'Support Coursetexts',
    description: 'Donation page and explanation of how funding is used.',
    href: '/support',
    icon: <NavSupportIcon />
  }
]

const defaultNavItems: NavItem[] = [
  { kind: 'link', label: 'All courses', href: '/all-courses' },
  { kind: 'link', label: 'Paths', href: pathsHomeHref() },
  { kind: 'menu', label: 'About', href: '/about', children: aboutChildren }
]

function pathsExploreChildren(): NavMenuChild[] {
  return [
    {
      label: 'Academic courses',
      description: 'University courses from partner schools and departments.',
      href: pathsCatalogHref({ view: 'courses' }),
      icon: <ProfileAcademicIcon />
    },
    {
      label: 'Goals',
      description: 'Community learning paths organized around goals.',
      href: pathsCatalogHref({ view: 'learning-paths' }),
      icon: <ProfilePathIcon />
    }
  ]
}

function pathsNavItems(): NavItem[] {
  return [
    {
      kind: 'menu',
      label: 'Explore paths',
      href: pathsCatalogHref({ view: 'all' }),
      children: pathsExploreChildren()
    },
    { kind: 'action', label: 'Create a path', action: 'create-path' },
    {
      kind: 'menu',
      label: 'Community',
      href: pathsCommunityHref(),
      children: communityChildren
    },
    { kind: 'menu', label: 'About', href: '/about', children: aboutChildren }
  ]
}

function NavMenuChildContent({ child }: { child: NavMenuChild }) {
  return (
    <>
      <span className={styles.aboutLinkIcon}>{child.icon}</span>
      <span className={styles.aboutLinkCopy}>
        <span className={styles.aboutLinkTitle}>{child.label}</span>
        <span className={styles.aboutLinkDesc}>{child.description}</span>
      </span>
    </>
  )
}

function NavMenuChildLink({
  child,
  className,
  onNavigate,
  tabIndex
}: {
  child: NavMenuChild
  className: string
  onNavigate?: () => void
  tabIndex?: number
}) {
  if (child.external) {
    return (
      <a
        href={child.href}
        target='_blank'
        rel='noreferrer'
        className={className}
        role='menuitem'
        onClick={onNavigate}
        tabIndex={tabIndex}
      >
        <NavMenuChildContent child={child} />
      </a>
    )
  }

  return (
    <Link href={child.href} legacyBehavior>
      <a
        className={className}
        role='menuitem'
        onClick={onNavigate}
        tabIndex={tabIndex}
      >
        <NavMenuChildContent child={child} />
      </a>
    </Link>
  )
}

function NavMenuFlyout({
  label,
  href,
  items,
  onNavigate
}: {
  label: string
  href?: string
  items: NavMenuChild[]
  onNavigate?: () => void
}) {
  const wrapRef = React.useRef<HTMLDivElement>(null)
  const [open, setOpen] = React.useState(false)

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'Escape') return
    setOpen(false)
    wrapRef.current
      ?.querySelector<HTMLElement>('a, button')
      ?.focus()
  }

  function handleBlur(event: React.FocusEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node)) {
      setOpen(false)
    }
  }

  const triggerClass = `${styles.middleItem} ${styles.interactiveLink}`

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
      {href ? (
        <Link href={href} legacyBehavior>
          <a
            className={triggerClass}
            aria-haspopup='menu'
            aria-expanded={open}
          >
            {label}
          </a>
        </Link>
      ) : (
        <button
          type='button'
          className={triggerClass}
          aria-haspopup='menu'
          aria-expanded={open}
        >
          {label}
        </button>
      )}
      <div className={styles.communityPanel} role='menu' aria-label={label}>
        <div
          className={`${styles.communityPanelInner} ${styles.aboutPanelInner}`}
        >
          {items.map((child) => (
            <NavMenuChildLink
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
  unreadCount,
  className,
  onNavigate,
  onSignOut
}: {
  isLoggedIn: boolean
  isOwnProfilePage: boolean
  accountHref: string
  accountLabel: string
  unreadCount: number
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
  if (isLoggedIn) {
    return (
      <ProfileNavDropdown
        isLoggedIn
        accountHref={accountHref}
        accountLabel={accountLabel}
        unreadCount={unreadCount}
        linkClassName={className}
        onNavigate={onNavigate}
      />
    )
  }
  return (
    <Link href={accountHref} legacyBehavior>
      <a
        className={className}
        onClick={(event) => {
          onNavigate?.()
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
  const onPaths = isPathsProductPathname(router.pathname)
  const navItems = React.useMemo(
    () => (onPaths ? pathsNavItems() : defaultNavItems),
    [onPaths]
  )
  const homeHref = onPaths ? pathsHomeHref() : '/'
  const brandLabel = onPaths ? 'Paths by Coursetexts' : 'Coursetexts'
  const isOwnProfilePage =
    router.pathname === '/profile' || router.pathname === '/paths/profile'
  const accountHref = isLoggedIn
    ? pathsProfileHref()
    : signInPageHref(router.asPath)
  const accountLabel = isLoggedIn ? 'Your Profile' : 'Sign in'

  const [menuOpen, setMenuOpen] = React.useState(false)
  const [openNavSubmenu, setOpenNavSubmenu] = React.useState<string | null>(
    null
  )
  const [createPathOpen, setCreatePathOpen] = React.useState(false)
  const [portalReady, setPortalReady] = React.useState(false)
  const [searchDraft, setSearchDraft] = React.useState('')
  const [unreadNotifications, setUnreadNotifications] = React.useState(0)
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
    const catalogHref = onPaths
      ? pathsCatalogHref()
      : '/all-courses'
    void router.push(`${catalogHref}#all-courses-search`)
  }, [focusSearch, onPaths, router])

  const openCreatePath = React.useCallback(() => {
    setCreatePathOpen(true)
  }, [])

  React.useEffect(() => {
    setPortalReady(true)
  }, [])

  React.useEffect(() => {
    if (!user) {
      setUnreadNotifications(0)
      return
    }
    let cancelled = false
    const load = async () => {
      const count = await getUnreadProfileNotificationCount(user.id)
      if (!cancelled) setUnreadNotifications(count)
    }
    void load()
    const unsub = subscribeReplyNotificationUpdates(() => {
      void load()
    })
    return () => {
      cancelled = true
      unsub()
    }
  }, [user?.id])

  React.useEffect(() => {
    if (!menuOpen) {
      setOpenNavSubmenu(null)
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
        const searchHref = onPaths
          ? pathsCatalogHref({ q })
          : `/all-courses?q=${encodeURIComponent(q)}`
        void router.push(searchHref)
        setSearchDraft('')
        return
      }
      scrollToSearch()
    },
    [closeMenu, onPaths, router, scrollToSearch, searchDraft]
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
                    const submenuOpen = openNavSubmenu === item.label
                    const toggleSubmenu = () =>
                      setOpenNavSubmenu((current) =>
                        current === item.label ? null : item.label
                      )
                    const chevron = (
                      <span
                        className={`${styles.menuNavChevron}${
                          submenuOpen ? ` ${styles.menuNavChevronOpen}` : ''
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
                    )
                    return (
                      <div key={item.label} className={styles.menuNavGroup}>
                        {item.href ? (
                          <div className={styles.menuNavToggle}>
                            <Link href={item.href} legacyBehavior>
                              <a
                                className={styles.menuNavToggleLink}
                                onClick={closeMenu}
                              >
                                {item.label}
                              </a>
                            </Link>
                            <button
                              type='button'
                              className={styles.menuNavChevronBtn}
                              onClick={toggleSubmenu}
                              aria-expanded={submenuOpen}
                              aria-label={`${submenuOpen ? 'Collapse' : 'Expand'} ${item.label} menu`}
                            >
                              {chevron}
                            </button>
                          </div>
                        ) : (
                          <button
                            type='button'
                            className={styles.menuNavToggle}
                            onClick={toggleSubmenu}
                            aria-expanded={submenuOpen}
                          >
                            <span>{item.label}</span>
                            {chevron}
                          </button>
                        )}
                        <div
                          className={`${styles.menuNavSubmenu}${
                            submenuOpen ? ` ${styles.menuNavSubmenuOpen}` : ''
                          }`}
                          aria-hidden={!submenuOpen}
                        >
                          <div className={styles.menuNavSubmenuInner}>
                            {item.children.map((child) => (
                              <NavMenuChildLink
                                key={child.href}
                                child={child}
                                className={styles.menuNavChild}
                                onNavigate={closeMenu}
                                tabIndex={submenuOpen ? undefined : -1}
                              />
                            ))}
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
                {isLoggedIn && !isOwnProfilePage ? (
                  <div className={styles.menuProfileGroup}>
                    <Link href={accountHref} legacyBehavior>
                      <a
                        className={styles.menuSignUp}
                        onClick={closeMenu}
                      >
                        <span className={styles.menuProfileInner}>
                          <span>{accountLabel}</span>
                          {unreadNotifications > 0 ? (
                            <span
                              className={styles.unreadDot}
                              aria-label={`${unreadNotifications} unread notification${
                                unreadNotifications === 1 ? '' : 's'
                              }`}
                            />
                          ) : null}
                        </span>
                      </a>
                    </Link>
                  </div>
                ) : (
                  <HeaderAccountAction
                    isLoggedIn={isLoggedIn}
                    isOwnProfilePage={isOwnProfilePage}
                    accountHref={accountHref}
                    accountLabel={accountLabel}
                    unreadCount={unreadNotifications}
                    className={styles.menuSignUp}
                    onNavigate={closeMenu}
                    onSignOut={() => {
                      void handleSignOut()
                    }}
                  />
                )}
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
            <Link href={homeHref} legacyBehavior>
              <a className={`${styles.brand} ${styles.brandLink}`}>
                <CoursetextsBookIcon className={styles.brandIcon} />
                {brandLabel}
              </a>
            </Link>

            <div className={styles.headerDesktopOnly}>
              <nav
                className={styles.middleItems}
                aria-label='Home page navigation'
              >
                {navItems.map((item) => {
                  if (item.kind === 'menu') {
                    return (
                      <NavMenuFlyout
                        key={item.label}
                        label={item.label}
                        href={item.href}
                        items={item.children}
                      />
                    )
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
                  unreadCount={unreadNotifications}
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
