import Link from 'next/link'
import React from 'react'

import { ProfileBackArrow } from '@/components/ProfileBackArrow'
import styles from '@/styles/profile.module.css'

export function ProfileSidebarBackHome() {
  return (
    <Link href='/' legacyBehavior={false} className={styles.sidebarBack}>
      <ProfileBackArrow className={styles.sidebarBackArrow} />
      Back to Home
    </Link>
  )
}
