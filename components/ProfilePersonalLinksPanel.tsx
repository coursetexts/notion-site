import * as React from 'react'

import {
  MAX_PROFILE_PERSONAL_LINKS,
  type ProfilePersonalLink,
  deletePersonalLink,
  insertPersonalLink,
  updatePersonalLink
} from '@/lib/profile-personal-links-db'
import styles from '@/styles/profile.module.css'

export function PersonalLinkExternalArrowIcon() {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='12'
      height='12'
      viewBox='0 0 12 12'
      fill='none'
      aria-hidden
    >
      <path
        d='M3 9L9 3'
        stroke='#5D534B'
        strokeWidth='1'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='M4.125 3H9V7.875'
        stroke='#5D534B'
        strokeWidth='1'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

/** Read-only link row (label + title + arrow) for personal social cards. */
export function ProfilePersonalLinkAnchorRow({
  link: l,
  hideArrow = false
}: {
  link: ProfilePersonalLink
  hideArrow?: boolean
}) {
  return (
    <a
      href={l.url}
      target='_blank'
      rel='noopener noreferrer'
      className={styles.sidebarPersonalLinkAnchor}
    >
      <span className={styles.sidebarPersonalLinkAnchorMain}>
        <span className={styles.linkCardLabel}>
          {personalLinkKindLabel(l.url)}
        </span>
        <span className={styles.sidebarPersonalLinkTitle}>
          {personalLinkDisplayTitle(l.url, l.title)}
        </span>
      </span>
      {!hideArrow ? (
        <span className={styles.sidebarPersonalLinkArrow} aria-hidden>
          <PersonalLinkExternalArrowIcon />
        </span>
      ) : null}
    </a>
  )
}

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
  /** Lighter wrapper when used under the sidebar meta divider. */
  nested?: boolean
  /**
   * Inline editing mode: render controls directly in the card list
   * (meant for the sidebar preview “above the line”).
   */
  inline?: boolean
}

export function ProfilePersonalLinksPanel({
  links,
  editable,
  onRefresh,
  nested = false,
  inline = false
}: ProfilePersonalLinksPanelProps) {
  const [urlDraft, setUrlDraft] = React.useState('')
  const [titleDraft, setTitleDraft] = React.useState('')
  const [adding, setAdding] = React.useState(false)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [editUrl, setEditUrl] = React.useState('')
  const [editTitle, setEditTitle] = React.useState('')
  const [busy, setBusy] = React.useState(false)
  const [showNewLinkInput, setShowNewLinkInput] = React.useState(false)

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

  const cancelNewLinkInput = () => {
    setShowNewLinkInput(false)
    setUrlDraft('')
    setTitleDraft('')
  }

  if (inline) {
    if (!editable && links.length === 0) return null
    return (
      <div className={nested ? styles.sidebarMetaEditorPanel : undefined}>
        <div className={styles.sidebarPersonalLinksInlineWrap}>
          {links.length > 0 ? (
            <ul className={styles.sidebarPersonalLinksList}>
              {links.map((l) => (
                <li key={l.id} className={styles.sidebarPersonalLinkItem}>
                  <div className={styles.sidebarPersonalLinkCard}>
                    <ProfilePersonalLinkAnchorRow link={l} hideArrow />
                    {editable ? (
                      <button
                        type='button'
                        className={styles.sidebarPersonalLinkRemoveX}
                        aria-label={`Remove ${personalLinkDisplayTitle(l.url, l.title)}`}
                        title='Remove'
                        onClick={() => void handleDelete(l.id)}
                        disabled={busy || adding}
                      >
                        ×
                      </button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          ) : null}

          {editable && links.length < MAX_PROFILE_PERSONAL_LINKS ? (
            <div className={styles.sidebarPersonalLinksInlineAddRow}>
              {showNewLinkInput ? (
                <input
                  type='url'
                  value={urlDraft}
                  onChange={(e) => setUrlDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      void handleAdd()
                    }
                    if (e.key === 'Escape') {
                      e.preventDefault()
                      cancelNewLinkInput()
                    }
                  }}
                  onBlur={() => {
                    window.setTimeout(() => {
                      if (adding) return
                      cancelNewLinkInput()
                    }, 0)
                  }}
                  placeholder='https://…'
                  className={`${styles.linkFilterNewTagInput} ${styles.sidebarPersonalLinksInlineInput}`}
                  aria-label='Add personal link URL'
                  autoComplete='off'
                  disabled={adding}
                  autoFocus
                />
              ) : (
                <button
                  type='button'
                  className={styles.linkFilterBtnNew}
                  onClick={() => setShowNewLinkInput(true)}
                  disabled={adding}
                >
                  + New link
                </button>
              )}
            </div>
          ) : null}
        </div>
      </div>
    )
  }

  return (
    <div className={wrapClass}>
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
                  <ProfilePersonalLinkAnchorRow link={l} />
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
