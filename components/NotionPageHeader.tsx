import * as React from 'react'
import Link from 'next/link'

import * as types from 'notion-types'
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
import styles from './NotionPageHeader.module.css'

const ToggleThemeButton = () => {
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
      className={cs(styles.headerIconBtn, !hasMounted && styles.hidden)}
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
  const { components, mapPageUrl } = useNotionContext()
  const auth = useAuthOptional()
  const [cached, setCached] = React.useState(getCachedAuth)
  const [unreadReplies, setUnreadReplies] = React.useState(0)
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

  if (navigationStyle === 'default') {
    return <Header block={block} />
  }

  return (
    <header className={cs(styles.headerBar, 'notion-header')}>
      <div className={styles.headerInner}>
        <Link href={rootUrl} className={styles.headerLogo} aria-label='Home'>
          {siteName}
        </Link>

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
            <span className={cs(styles.profileLinkLabelWrap, styles.signUpBtn)}>
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
    </header>
  )
}
