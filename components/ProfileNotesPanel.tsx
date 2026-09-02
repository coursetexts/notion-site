import * as React from 'react'
import Link from 'next/link'

import { ProfileBackArrow } from '@/components/ProfileBackArrow'
import { SiteNotesEditor } from '@/components/SiteNotesEditor'
import type { NotebookDocJson } from '@/lib/notebook-editor-default'
import {
  type ProfileTopicNote,
  profileNoteAfterSave,
  saveProfileTopicNote
} from '@/lib/profile-notes-db'
import { registerPersistBeforeSignOut } from '@/lib/persist-before-sign-out'
import styles from '@/styles/profile.module.css'

const SAVE_MS = 700

export function ProfileNotesPanel({
  notes,
  loading = false,
  onNoteChange
}: {
  notes: ProfileTopicNote[]
  loading?: boolean
  onNoteChange?: (note: ProfileTopicNote) => void
}) {
  const [query, setQuery] = React.useState('')
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const [saveState, setSaveState] = React.useState<
    'idle' | 'saving' | 'saved' | 'error'
  >('idle')
  const saveTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const latestJson = React.useRef<NotebookDocJson | null>(null)
  const selectedRef = React.useRef<ProfileTopicNote | null>(null)

  const selected = notes.find((note) => note.id === selectedId) || null
  selectedRef.current = selected

  React.useEffect(() => {
    if (selectedId && !notes.some((note) => note.id === selectedId)) {
      setSelectedId(null)
    }
  }, [notes, selectedId])

  React.useEffect(() => {
    if (!selectedId) {
      latestJson.current = null
      return
    }
    const noteForSave = selectedRef.current
    latestJson.current = noteForSave?.content ?? null
    setSaveState('idle')
    return () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current)
        saveTimer.current = null
      }
      const doc = latestJson.current
      if (noteForSave && doc) {
        void saveProfileTopicNote(noteForSave, doc)
      }
    }
  }, [selectedId])

  const flushSave = React.useCallback(async () => {
    const note = selectedRef.current
    const doc = latestJson.current
    if (!note || !doc) return
    if (saveTimer.current) {
      clearTimeout(saveTimer.current)
      saveTimer.current = null
    }
    setSaveState('saving')
    const ok = await saveProfileTopicNote(note, doc)
    setSaveState(ok ? 'saved' : 'error')
    if (ok) onNoteChange?.(profileNoteAfterSave(note, doc))
  }, [onNoteChange])

  const scheduleSave = React.useCallback(
    (json: NotebookDocJson) => {
      const note = selectedRef.current
      if (!note) return
      latestJson.current = json
      onNoteChange?.(profileNoteAfterSave(note, json))
      setSaveState('idle')
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => {
        saveTimer.current = null
        setSaveState('saving')
        void saveProfileTopicNote(note, json).then((ok) => {
          setSaveState(ok ? 'saved' : 'error')
        })
      }, SAVE_MS)
    },
    [onNoteChange]
  )

  React.useEffect(() => {
    return registerPersistBeforeSignOut(() => flushSave())
  }, [flushSave])

  const needle = query.trim().toLowerCase()
  const visible = needle
    ? notes.filter((note) => {
        const haystack = `${note.snippet} ${note.topicLabel} ${note.sourceTitle}`
        return haystack.toLowerCase().includes(needle)
      })
    : notes

  const saveLabel =
    saveState === 'saving'
      ? 'Saving…'
      : saveState === 'saved'
      ? 'Saved'
      : saveState === 'error'
      ? 'Save failed'
      : ''

  if (selected) {
    return (
      <div className={styles.tabPanel}>
        <button
          type='button'
          className={styles.backToProfile}
          onClick={() => {
            void flushSave()
            setSelectedId(null)
          }}
        >
          <ProfileBackArrow className={styles.sidebarBackArrow} />
          Notes
        </button>
        <h2 className={styles.mainSerifTitle}>{selected.topicLabel}</h2>
        <p className={styles.noteSource}>
          Saved in {selected.sourceTitle}
          {selected.sourceHref ? (
            <>
              {' · '}
              <Link
                href={selected.sourceHref}
                className={styles.inlineLink}
                onClick={() => {
                  void flushSave()
                }}
              >
                Open
              </Link>
            </>
          ) : null}
          {saveLabel ? (
            <>
              {' · '}
              <span className={styles.noteSaveStatus} aria-live='polite'>
                {saveLabel}
              </span>
            </>
          ) : null}
        </p>
        <div className={styles.noteBody}>
          <SiteNotesEditor
            key={selected.id}
            value={selected.content}
            onChange={scheduleSave}
            placeholder='Write your notes for this topic…'
            variant='default'
            allowExpand
            fillHeight
            expandTitle='Your Notes'
            expandTopic={selected.topicLabel}
            ariaLabel={`Note on ${selected.topicLabel}`}
          />
        </div>
      </div>
    )
  }

  return (
    <div className={styles.tabPanel}>
      <div className={styles.tabPanelHeaderRow}>
        <h2 className={styles.mainSerifTitle}>Notes</h2>
      </div>
      <div className={styles.filterSearchBlock}>
        <div className={styles.panelSearchWrap}>
          <input
            id='profile-notes-search'
            type='search'
            className={styles.panelSearchInput}
            placeholder='SEARCH'
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label='Search notes'
          />
        </div>
      </div>
      {loading ? (
        <p className={styles.placeholder}>Loading…</p>
      ) : notes.length === 0 ? (
        <p className={styles.placeholder}>
          Notes you write on course and learning-path topics will show up here.
        </p>
      ) : visible.length === 0 ? (
        <p className={styles.placeholder}>No matching notes.</p>
      ) : (
        <ul className={styles.notebooksList}>
          {visible.map((note) => (
            <li key={note.id} className={styles.notebooksListItemWrap}>
              <button
                type='button'
                className={styles.noteListBtn}
                onClick={() => setSelectedId(note.id)}
              >
                <span className={styles.notebooksListTitle}>
                  <span className={styles.notebooksListTitleText}>
                    {note.topicLabel}
                  </span>
                </span>
                <span className={styles.notebooksListMeta}>
                  {note.sourceTitle}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
