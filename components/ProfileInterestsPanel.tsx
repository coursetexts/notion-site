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
  /** When false, omit the “Interests” heading (parent shows a shared editor title). */
  showHeading?: boolean
  /** Lighter wrapper when used under the sidebar meta divider. */
  nested?: boolean
}

export function ProfileInterestsPanel({
  userId,
  editable,
  initialTags,
  onTagsChange,
  showHeading = true,
  nested = false
}: ProfileInterestsPanelProps) {
  const [tags, setTags] = useState<string[]>(initialTags)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setTags(initialTags)
  }, [initialTags])

  const addTag = () => {
    const t = draft.trim().replace(/,/g, '')
    if (!t) return
    const lower = t.toLowerCase()
    if (tags.some((x) => x.toLowerCase() === lower)) {
      setDraft('')
      return
    }
    if (tags.length >= 20) return
    setTags((prev) => [...prev, t].sort((a, b) => a.localeCompare(b)))
    setDraft('')
  }

  const save = async () => {
    if (!editable) return
    setSaving(true)
    const ok = await replaceProfileInterestsForUser(userId, tags)
    if (!ok) {
      window.alert('Could not save interests.')
    } else {
      const fresh = await getProfileInterestsByUserId(userId)
      setTags(fresh)
      onTagsChange?.(fresh)
    }
    setSaving(false)
  }

  if (!editable && tags.length === 0) {
    return null
  }

  const wrapClass = nested
    ? styles.sidebarMetaEditorPanel
    : styles.sidebarPersonalLinksBlock

  return (
    <div className={wrapClass}>
      {showHeading ? (
        <h2 className={styles.sidebarPersonalLinksHeading}>Interests</h2>
      ) : null}
      {editable ? (
        <div className={styles.sidebarPersonalLinkAdd}>
          <label className={styles.sidebarPersonalLinkField}>
            <span>New interest</span>
            <input
              type='text'
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addTag()
                }
              }}
              placeholder='e.g. machine learning'
              className={styles.sidebarPersonalLinkInput}
              aria-label='New interest tag'
              autoComplete='off'
            />
          </label>
          <div className={styles.sidebarPersonalLinkEditActions}>
            <button
              type='button'
              className={styles.sidebarPersonalLinkGhostBtn}
              onClick={addTag}
            >
              Add tag
            </button>
            <button
              type='button'
              className={styles.sidebarPersonalLinkPrimaryBtn}
              onClick={() => void save()}
              disabled={saving}
            >
              {saving ? '…' : 'Save'}
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
