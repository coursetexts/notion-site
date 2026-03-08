import * as React from 'react'

import * as types from 'notion-types'
import { IoMoonSharp } from '@react-icons/all-files/io5/IoMoonSharp'
import { IoSunnyOutline } from '@react-icons/all-files/io5/IoSunnyOutline'
import Link from 'next/link'
import cs from 'classnames'
import { Header, Search, useNotionContext } from 'react-notion-x'

import { getCachedAuth, subscribeToAuthCache } from '@/lib/auth-cache'
import { authDebug } from '@/lib/auth-debug'
import { useAuthOptional } from '../contexts/AuthContext'
import {
  isSearchEnabled,
  name as siteName,
  navigationLinks,
  navigationStyle,
  rootNotionPageId
} from '@/lib/config'
import { useDarkMode } from '@/lib/use-dark-mode'

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
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onToggleTheme()}
      aria-label="Toggle theme"
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

  React.useEffect(() => {
    return subscribeToAuthCache(() => setCached(getCachedAuth()))
  }, [])

  if (navigationStyle === 'default') {
    return <Header block={block} />
  }

  const rootUrl = mapPageUrl(rootNotionPageId)
  const user = auth?.user ?? cached.user
  const isLoggedIn = Boolean(user)

  React.useEffect(() => {
    authDebug('header:auth-state', {
      authUser: auth?.user?.id ?? null,
      cachedUser: cached.user?.id ?? null,
      effectiveUser: user?.id ?? null,
      isLoggedIn
    })
  }, [auth?.user?.id, cached.user?.id, user?.id, isLoggedIn])

  return (
    <header className={cs(styles.headerBar, 'notion-header')}>
      <div className={styles.headerInner}>
        <Link href={rootUrl} className={styles.headerLogo} aria-label="Home">
          {siteName}
        </Link>

        <nav className={styles.headerNav} aria-label="Main">
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

        <div className={styles.headerRhs}>
          <ToggleThemeButton />
          {isSearchEnabled && (
            <div className={styles.headerSearchWrap}>
              <Search block={block} title={null} />
            </div>
          )}
          <Link
            href={isLoggedIn ? '/profile' : '/signin'}
            className={styles.signUpBtn}
          >
            {isLoggedIn ? 'Profile' : 'Sign in'}
          </Link>
        </div>
      </div>
    </header>
  )
}
