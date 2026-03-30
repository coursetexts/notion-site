import * as React from 'react'
import { createPortal, flushSync } from 'react-dom'
import Link from 'next/link'
import { useRouter } from 'next/router'

import * as types from 'notion-types'
import { AnimatePresence, motion } from 'framer-motion'
import { IoClose } from '@react-icons/all-files/io5/IoClose'
import { IoMoonSharp } from '@react-icons/all-files/io5/IoMoonSharp'
import { IoSunnyOutline } from '@react-icons/all-files/io5/IoSunnyOutline'
import cs from 'classnames'
import { Header, Search, useNotionContext } from 'react-notion-x'

import { getCachedAuth, subscribeToAuthCache } from '@/lib/auth-cache'
import { authDebug } from '@/lib/auth-debug'
import {
  isSearchEnabled,
  navigationLinks,
  navigationStyle,
  rootNotionPageId,
  name as siteName
} from '@/lib/config'
import {
  getUnreadReplyCount,
  subscribeReplyNotificationUpdates
} from '@/lib/reply-notifications'
import { useDarkMode } from '@/lib/use-dark-mode'

import { useAuthOptional } from '../contexts/AuthContext'
import { CoursetextsBookIcon } from './CoursetextsBookIcon'
import styles from './NotionPageHeader.module.css'

const ToggleThemeButton = ({ className }: { className?: string }) => {
  const [hasMounted, setHasMounted] = React.useState(false)
  const { isDarkMode, toggleDarkMode } = useDarkMode()

  React.useEffect(() => {
    setHasMounted(true)
  }, [])

  const onToggleTheme = React.useCallback(() => {
    toggleDarkMode()
  }, [toggleDarkMode])

  return (
    <div
      className={cs(
        styles.headerIconBtn,
        className,
        !hasMounted && styles.hidden
      )}
      onClick={onToggleTheme}
      role='button'
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onToggleTheme()}
      aria-label='Toggle theme'
    >
      {hasMounted && isDarkMode ? <IoMoonSharp /> : <IoSunnyOutline />}
    </div>
  )
}

export const NotionPageHeader: React.FC<{
  block: types.CollectionViewPageBlock | types.PageBlock
}> = ({ block }) => {
  const router = useRouter()
  const { components, mapPageUrl } = useNotionContext()
  const auth = useAuthOptional()
  const [cached, setCached] = React.useState(getCachedAuth)
  const [unreadReplies, setUnreadReplies] = React.useState(0)
  const [menuOpen, setMenuOpen] = React.useState(false)
  const [portalReady, setPortalReady] = React.useState(false)
  const [expandRect, setExpandRect] = React.useState<DOMRect | null>(null)
  const [collapseRect, setCollapseRect] = React.useState<DOMRect | null>(null)
  const menuBtnRef = React.useRef<HTMLButtonElement>(null)
  const expandRectRef = React.useRef<DOMRect | null>(null)
  const closeBtnRef = React.useRef<HTMLButtonElement>(null)
  const user = auth?.user ?? cached.user
  const isLoggedIn = Boolean(user)

  React.useEffect(() => {
    return subscribeToAuthCache(() => setCached(getCachedAuth()))
  }, [])
  const rootUrl = mapPageUrl(rootNotionPageId)

  React.useEffect(() => {
    if (navigationStyle === 'default') return
    if (!user) {
      setUnreadReplies(0)
      return
    }
    let cancelled = false
    const load = async () => {
      const count = await getUnreadReplyCount(user.id)
      if (!cancelled) setUnreadReplies(count)
    }
    load()
    const unsub = subscribeReplyNotificationUpdates(load)
    return () => {
      cancelled = true
      unsub()
    }
  }, [user?.id])

  React.useEffect(() => {
    if (navigationStyle === 'default') return
    authDebug('header:auth-state', {
      authUser: auth?.user?.id ?? null,
      cachedUser: cached.user?.id ?? null,
      effectiveUser: user?.id ?? null,
      isLoggedIn
    })
  }, [auth?.user?.id, cached.user?.id, user?.id, isLoggedIn])

  React.useEffect(() => {
    setPortalReady(true)
  }, [])

  React.useEffect(() => {
    if (!menuOpen) return
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

  if (navigationStyle === 'default') {
    return <Header block={block} />
  }

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
          key='mobile-menu'
          id='mobile-nav-dialog'
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

              {isSearchEnabled && (
                <div className={styles.menuSearchWrap}>
                  <Search block={block} title={null} />
                </div>
              )}

              <nav className={styles.menuNav} aria-label='Main'>
                {navigationLinks
                  ?.map((link, index) => {
                    if (!link.pageId && !link.url) return null
                    if (link.pageId) {
                      return (
                        <components.PageLink
                          href={mapPageUrl(link.pageId)}
                          key={index}
                          className={styles.menuNavLink}
                          onClick={closeMenu}
                        >
                          {link.title}
                        </components.PageLink>
                      )
                    }
                    return (
                      <components.Link
                        href={link.url!}
                        key={index}
                        className={styles.menuNavLink}
                        onClick={closeMenu}
                      >
                        {link.title}
                      </components.Link>
                    )
                  })
                  .filter(Boolean)}
              </nav>

              <div className={styles.menuFooter}>
                <div className={styles.menuThemeRow}>
                  <span className={styles.menuThemeLabel}>Theme</span>
                  <ToggleThemeButton className={styles.menuThemeToggle} />
                </div>
                <Link
                  href={isLoggedIn ? '/profile' : '/signin'}
                  className={styles.menuProfileLink}
                  onClick={closeMenu}
                >
                  <span className={styles.menuProfileInner}>
                    <span>{isLoggedIn ? 'Profile' : 'Sign in'}</span>
                    {isLoggedIn && unreadReplies > 0 && (
                      <span
                        className={styles.profileAlertBadge}
                        aria-label={`${unreadReplies} unread replies`}
                      >
                        {unreadReplies > 99 ? '99+' : unreadReplies}
                      </span>
                    )}
                  </span>
                </Link>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  ) : null

  return (
    <>
      <header className={cs(styles.headerBar, 'notion-header')}>
        <div className={styles.headerInner}>
          <Link href={rootUrl} className={styles.headerLogo} aria-label='Home'>
            <span className={styles.headerLogoInner}>
              <CoursetextsBookIcon className={styles.headerLogoIcon} />
              {siteName}
            </span>
          </Link>

          <div className={styles.headerDesktopOnly}>
            <div className={styles.headerCenter}>
              <nav className={styles.headerNav} aria-label='Main'>
                {navigationLinks
                  ?.map((link, index) => {
                    if (!link.pageId && !link.url) return null
                    if (link.pageId) {
                      return (
                        <components.PageLink
                          href={mapPageUrl(link.pageId)}
                          key={index}
                          className={styles.headerNavLink}
                        >
                          {link.title}
                        </components.PageLink>
                      )
                    }
                    return (
                      <components.Link
                        href={link.url!}
                        key={index}
                        className={styles.headerNavLink}
                      >
                        {link.title}
                      </components.Link>
                    )
                  })
                  .filter(Boolean)}
              </nav>
              {isSearchEnabled && (
                <div className={styles.headerSearchWrap}>
                  <Search block={block} title={null} />
                </div>
              )}
            </div>

            <div className={styles.headerRhs}>
              <ToggleThemeButton />
              <Link
                href={isLoggedIn ? '/profile' : '/signin'}
                className={styles.profileLink}
              >
                <span
                  className={cs(styles.profileLinkLabelWrap, styles.signUpBtn)}
                >
                  <span>{isLoggedIn ? 'Profile' : 'Sign in'}</span>
                  {isLoggedIn && unreadReplies > 0 && (
                    <span
                      className={styles.profileAlertBadge}
                      aria-label={`${unreadReplies} unread replies`}
                    >
                      {unreadReplies > 99 ? '99+' : unreadReplies}
                    </span>
                  )}
                </span>
              </Link>
            </div>
          </div>

          <button
            ref={menuBtnRef}
            type='button'
            className={styles.mobileMenuBtn}
            onClick={openMenu}
            aria-expanded={menuOpen}
            aria-controls='mobile-nav-dialog'
            aria-label='Open menu'
          >
            <span className={styles.mobileMenuBar} aria-hidden />
            <span className={styles.mobileMenuBar} aria-hidden />
          </button>
        </div>
      </header>

      {portalReady &&
        createPortal(mobileMenu, document.body)}
    </>
  )
}
