import * as React from 'react'
import Link from 'next/link'
import cs from 'classnames'

import {
  OWN_PROFILE_TAB_LINKS,
  type OwnProfileMainTab,
  ownProfileTabHref
} from '@/lib/profile-tabs'
import {
  ProfileAnnouncementIcon,
  ProfileBookmarkIcon,
  ProfileCommentIcon,
  ProfileLightbulbIcon,
  ProfileNoteIcon,
  ProfilePathIcon
} from '@/components/ProfileTabItemIcons'
import styles from './ProfileNavDropdown.module.css'

function TabIcon({ id }: { id: OwnProfileMainTab }) {
  switch (id) {
    case 'learning-path':
      return <ProfilePathIcon />
    case 'knowledge':
      return <ProfileLightbulbIcon />
    case 'notes':
      return <ProfileNoteIcon />
    case 'activity':
      return <ProfileAnnouncementIcon />
    case 'bookmarks':
      return <ProfileBookmarkIcon />
    case 'notifications':
      return <ProfileCommentIcon />
    default:
      return null
  }
}

type ProfileNavDropdownProps = {
  isLoggedIn: boolean
  accountHref: string
  accountLabel: string
  unreadCount?: number
  className?: string
  linkClassName?: string
  onAccountClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void
  onNavigate?: () => void
}

export function ProfileNavDropdown({
  isLoggedIn,
  accountHref,
  accountLabel,
  unreadCount = 0,
  className,
  linkClassName,
  onAccountClick,
  onNavigate
}: ProfileNavDropdownProps) {
  const trigger = (
    <Link href={accountHref} legacyBehavior>
      <a
        className={cs(styles.accountBtn, linkClassName)}
        onClick={(event) => {
          onNavigate?.()
          onAccountClick?.(event)
        }}
      >
        <span className={styles.triggerInner}>
          <span>{accountLabel}</span>
          {isLoggedIn && unreadCount > 0 ? (
            <span
              className={styles.badge}
              aria-label={`${unreadCount} unread replies`}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          ) : null}
        </span>
      </a>
    </Link>
  )

  if (!isLoggedIn) {
    return <div className={className}>{trigger}</div>
  }

  return (
    <div className={cs(styles.wrap, className)}>
      {trigger}
      <div className={styles.dropdown} role='menu' aria-label='Profile sections'>
        <div className={styles.dropdownInner}>
          {OWN_PROFILE_TAB_LINKS.map((tab) => (
            <React.Fragment key={tab.slug}>
              {tab.id === 'activity' ? (
                <div className={styles.dropdownDivider} aria-hidden />
              ) : null}
              <Link href={ownProfileTabHref(tab.slug)} legacyBehavior>
                <a
                  className={styles.dropdownItem}
                  role='menuitem'
                  onClick={() => onNavigate?.()}
                >
                  <span className={styles.dropdownIcon} aria-hidden>
                    <TabIcon id={tab.id} />
                  </span>
                  <span className={styles.dropdownLabel}>{tab.label}</span>
                </a>
              </Link>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  )
}
