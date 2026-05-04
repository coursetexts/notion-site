import * as React from 'react'

import {
  MAX_PROFILE_PERSONAL_LINKS,
  type ProfilePersonalLink,
  deletePersonalLink,
  insertPersonalLink,
  updatePersonalLink
} from '@/lib/profile-personal-links-db'
import styles from '@/styles/profile.module.css'

export function personalLinkKindLabel(url: string): string {
  try {
    const h = new URL(url).hostname.toLowerCase().replace(/^www\./, '')
    if (h === 'x.com' || h.includes('twitter.')) return 'Twitter / X'
    if (h.includes('linkedin.')) return 'LinkedIn'
    if (h.includes('github.')) return 'GitHub'
    if (h.includes('instagram.')) return 'Instagram'
    return 'Link'
  } catch {
    return 'Link'
  }
}

export function personalLinkDisplayTitle(url: string, title: string | null): string {
  const t = title?.trim()
  if (t) return t
  try {
    const u = new URL(url)
    const path = u.pathname.replace(/\/$/, '')
    const base = u.hostname.replace(/^www\./, '')
    return path && path !== '/' ? `${base}${path}` : base
  } catch {
    return url
  }
}

type ProfilePersonalLinksPanelProps = {
  links: ProfilePersonalLink[]
  editable: boolean
  onRefresh: () => void
  /** When false, omit the “Personal links” heading (parent shows a shared editor title). */
  showHeading?: boolean
  /** Lighter wrapper when used under the sidebar meta divider. */
  nested?: boolean
}

export function ProfilePersonalLinksPanel({
  links,
  editable,
  onRefresh,
  showHeading = true,
  nested = false
}: ProfilePersonalLinksPanelProps) {
  const [urlDraft, setUrlDraft] = React.useState('')
  const [titleDraft, setTitleDraft] = React.useState('')
  const [adding, setAdding] = React.useState(false)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [editUrl, setEditUrl] = React.useState('')
  const [editTitle, setEditTitle] = React.useState('')
  const [busy, setBusy] = React.useState(false)

  if (!editable && links.length === 0) {
    return null
  }

  const startEdit = (l: ProfilePersonalLink) => {
    setEditingId(l.id)
    setEditUrl(l.url)
    setEditTitle(l.title ?? '')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditUrl('')
    setEditTitle('')
  }

  const saveEdit = async () => {
    if (!editingId) return
    setBusy(true)
    const ok = await updatePersonalLink(editingId, {
      url: editUrl,
      title: editTitle || null
    })
    setBusy(false)
    if (ok) {
      cancelEdit()
      onRefresh()
    } else {
      window.alert('Could not update link. Check the URL.')
    }
  }

  const handleAdd = async () => {
    if (!urlDraft.trim()) return
    setAdding(true)
    const row = await insertPersonalLink(urlDraft, titleDraft || null)
    setAdding(false)
    if (row) {
      setUrlDraft('')
      setTitleDraft('')
      onRefresh()
    } else {
      window.alert(
        `Could not add link. Use a valid http(s) URL (max ${MAX_PROFILE_PERSONAL_LINKS} links).`
      )
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Remove this personal link?')) return
    setBusy(true)
    const ok = await deletePersonalLink(id)
    setBusy(false)
    if (ok) onRefresh()
    else window.alert('Could not delete link.')
  }

  const wrapClass = nested
    ? styles.sidebarMetaEditorPanel
    : styles.sidebarPersonalLinksBlock

  return (
    <div className={wrapClass}>
      {showHeading ? (
        <h2 className={styles.sidebarPersonalLinksHeading}>Personal links</h2>
      ) : null}
      {links.length > 0 ? (
        <ul className={styles.sidebarPersonalLinksList}>
          {links.map((l) => (
            <li key={l.id} className={styles.sidebarPersonalLinkItem}>
              {editable && editingId === l.id ? (
                <div className={styles.sidebarPersonalLinkEditCard}>
                  <label className={styles.sidebarPersonalLinkField}>
                    <span>URL</span>
                    <input
                      type='url'
                      value={editUrl}
                      onChange={(e) => setEditUrl(e.target.value)}
                      className={styles.sidebarPersonalLinkInput}
                      autoComplete='off'
                    />
                  </label>
                  <label className={styles.sidebarPersonalLinkField}>
                    <span>Label (optional)</span>
                    <input
                      type='text'
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder='e.g. My Twitter'
                      className={styles.sidebarPersonalLinkInput}
                      autoComplete='off'
                    />
                  </label>
                  <div className={styles.sidebarPersonalLinkEditActions}>
                    <button
                      type='button'
                      className={styles.sidebarPersonalLinkPrimaryBtn}
                      onClick={() => void saveEdit()}
                      disabled={busy}
                    >
                      Save
                    </button>
                    <button
                      type='button'
                      className={styles.sidebarPersonalLinkGhostBtn}
                      onClick={cancelEdit}
                      disabled={busy}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className={styles.sidebarPersonalLinkCard}>
                  <a
                    href={l.url}
                    target='_blank'
                    rel='noopener noreferrer'
                    className={styles.sidebarPersonalLinkAnchor}
                  >
                    <span className={styles.linkCardLabel}>
                      {personalLinkKindLabel(l.url)}
                    </span>
                    <span className={styles.sidebarPersonalLinkTitle}>
                      {personalLinkDisplayTitle(l.url, l.title)}
                    </span>
                  </a>
                  {editable ? (
                    <div className={styles.sidebarPersonalLinkActions}>
                      <button
                        type='button'
                        className={styles.sidebarPersonalLinkGhostBtn}
                        onClick={() => startEdit(l)}
                        disabled={busy}
                      >
                        Edit
                      </button>
                      <button
                        type='button'
                        className={styles.sidebarPersonalLinkGhostBtn}
                        onClick={() => void handleDelete(l.id)}
                        disabled={busy}
                      >
                        Remove
                      </button>
                    </div>
                  ) : null}
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : null}

      {editable && links.length < MAX_PROFILE_PERSONAL_LINKS ? (
        <div className={styles.sidebarPersonalLinkAdd}>
          <label className={styles.sidebarPersonalLinkField}>
            <span>Add URL</span>
            <input
              type='url'
              value={urlDraft}
              onChange={(e) => setUrlDraft(e.target.value)}
              placeholder='https://…'
              className={styles.sidebarPersonalLinkInput}
              autoComplete='off'
            />
          </label>
          <label className={styles.sidebarPersonalLinkField}>
            <span>Label (optional)</span>
            <input
              type='text'
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              placeholder='e.g. Portfolio'
              className={styles.sidebarPersonalLinkInput}
              autoComplete='off'
            />
          </label>
          <button
            type='button'
            className={styles.sidebarPersonalLinkPrimaryBtn}
            onClick={() => void handleAdd()}
            disabled={adding || !urlDraft.trim()}
          >
            {adding ? '…' : 'Add link'}
          </button>
        </div>
      ) : null}
    </div>
  )
}
