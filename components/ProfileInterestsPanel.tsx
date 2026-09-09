import Link from 'next/link'
import React, { useEffect, useState } from 'react'

import {
  getProfileInterestsByUserId,
  replaceProfileInterestsForUser
} from '@/lib/profile-interests-db'
import styles from '@/styles/profile.module.css'

type ProfileInterestsPanelProps = {
  userId: string
  editable: boolean
  initialTags: string[]
  /** Called after a successful save (own profile) so parent state stays in sync. */
  onTagsChange?: (tags: string[]) => void
  /** Lighter wrapper when used under the sidebar meta divider. */
  nested?: boolean
  /**
   * When true, renders remove controls inline with the existing chips
   * (meant for the sidebar preview “above the line”).
   */
  inline?: boolean
}

export function ProfileInterestsPanel({
  userId,
  editable,
  initialTags,
  onTagsChange,
  nested = false,
  inline = false
}: ProfileInterestsPanelProps) {
  const [tags, setTags] = useState<string[]>(initialTags)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setTags(initialTags)
  }, [initialTags])

  const persist = async (next: string[]) => {
    if (!editable) return
    setSaving(true)
    const ok = await replaceProfileInterestsForUser(userId, next)
    if (!ok) {
      window.alert('Could not save interests.')
      setSaving(false)
      return
    }
    const fresh = await getProfileInterestsByUserId(userId)
    setTags(fresh)
    onTagsChange?.(fresh)
    setSaving(false)
  }

  const save = async () => {
    if (!editable) return
    await persist(tags)
  }

  if (!editable && tags.length === 0) {
    return null
  }

  if (editable && tags.length === 0) {
    return null
  }

  const wrapClass = nested
    ? styles.sidebarMetaEditorPanel
    : styles.sidebarPersonalLinksBlock

  if (inline) {
    return (
      <div className={nested ? styles.sidebarMetaEditorPanel : undefined}>
        <div className={styles.profileInterestTags}>
          {tags.map((t) => (
            <span key={t} className={styles.profileInterestTagRow}>
              <Link
                href={{ pathname: '/users', query: { interest: t } }}
                legacyBehavior={false}
                className={styles.profileInterestTag}
              >
                {t}
              </Link>
              {editable ? (
                <button
                  type='button'
                  className={styles.profileInterestRemove}
                  aria-label={`Remove ${t}`}
                  onClick={() => {
                    const next = tags.filter((x) => x !== t)
                    setTags(next)
                    void persist(next)
                  }}
                  disabled={saving}
                >
                  ×
                </button>
              ) : null}
            </span>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={wrapClass}>
      {editable ? (
        <div className={styles.sidebarPersonalLinkAdd}>
          <div className={styles.sidebarPersonalLinkEditActions}>
            <button
              type='button'
              className={styles.sidebarPersonalLinkPrimaryBtn}
              onClick={() => void save()}
              disabled={saving}
            >
              {saving ? '…' : 'Save interests'}
            </button>
          </div>
        </div>
      ) : null}
      {tags.length > 0 ? (
        <div
          className={`${styles.profileInterestTags} ${styles.profileInterestTagsBelowAdd}`}
        >
          {tags.map((t) => (
            <span key={t} className={styles.profileInterestTagRow}>
              <Link
                href={{ pathname: '/users', query: { interest: t } }}
                legacyBehavior={false}
                className={styles.profileInterestTag}
              >
                {t}
              </Link>
              {editable ? (
                <button
                  type='button'
                  className={styles.profileInterestRemove}
                  aria-label={`Remove ${t}`}
                  onClick={() => setTags((prev) => prev.filter((x) => x !== t))}
                >
                  ×
                </button>
              ) : null}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  )
}
