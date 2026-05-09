import Link from 'next/link'
import React, { useEffect, useRef, useState } from 'react'

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
   * When true, renders the add/remove controls inline with the existing chips
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
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [showNewInterestInput, setShowNewInterestInput] = useState(false)
  const savingRef = useRef(false)
  useEffect(() => {
    savingRef.current = saving
  }, [saving])

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

  const addTag = () => {
    const t = draft.trim().replace(/,/g, '')
    if (!t) return
    const lower = t.toLowerCase()
    if (tags.some((x) => x.toLowerCase() === lower)) {
      setDraft('')
      return
    }
    if (tags.length >= 20) return
    const next = [...tags, t].sort((a, b) => a.localeCompare(b))
    setTags(next)
    setDraft('')
    if (inline) void persist(next)
  }

  const cancelNewInterestInput = () => {
    setShowNewInterestInput(false)
    setDraft('')
  }

  const save = async () => {
    if (!editable) return
    await persist(tags)
  }

  if (!editable && tags.length === 0) {
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

          {editable ? (
            showNewInterestInput ? (
              <input
                type='text'
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addTag()
                  }
                  if (e.key === 'Escape') {
                    e.preventDefault()
                    cancelNewInterestInput()
                  }
                }}
                onBlur={() => {
                  window.setTimeout(() => {
                    if (savingRef.current) return
                    cancelNewInterestInput()
                  }, 0)
                }}
                placeholder='New interest'
                className={`${styles.linkFilterNewTagInput} ${styles.profileInterestNewTagInput}`}
                aria-label='New interest tag'
                autoComplete='off'
                disabled={saving}
                autoFocus
              />
            ) : (
              <button
                type='button'
                className={styles.linkFilterBtnNew}
                onClick={() => setShowNewInterestInput(true)}
                disabled={saving}
              >
                + New interest
              </button>
            )
          ) : null}
        </div>
      </div>
    )
  }

  return (
    <div className={wrapClass}>
      {editable ? (
        <div className={styles.sidebarPersonalLinkAdd}>
          <div className={styles.profileInterestNewRow}>
            {showNewInterestInput ? (
              <input
                type='text'
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addTag()
                  }
                  if (e.key === 'Escape') {
                    e.preventDefault()
                    cancelNewInterestInput()
                  }
                }}
                onBlur={() => {
                  window.setTimeout(() => {
                    if (savingRef.current) return
                    cancelNewInterestInput()
                  }, 0)
                }}
                placeholder='e.g. machine learning'
                className={`${styles.linkFilterNewTagInput} ${styles.profileInterestNewTagInput}`}
                aria-label='New interest tag'
                autoComplete='off'
                disabled={saving}
                autoFocus
              />
            ) : (
              <button
                type='button'
                className={styles.linkFilterBtnNew}
                onClick={() => setShowNewInterestInput(true)}
              >
                + New interest
              </button>
            )}
          </div>
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
