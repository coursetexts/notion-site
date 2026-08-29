import * as React from 'react'

import cs from 'classnames'

import { SiteNotesEditor } from '@/components/SiteNotesEditor'
import {
  cacheCourseNote,
  getCourseNote,
  saveCourseNote
} from '@/lib/course-notes-db'
import {
  NOTEBOOK_EMPTY_DOC,
  type NotebookDocJson
} from '@/lib/notebook-editor-default'
import { registerPersistBeforeSignOut } from '@/lib/persist-before-sign-out'

import styles from './CourseNotesPanel.module.css'

const SAVE_MS = 700

export interface CourseNotesPanelProps {
  coursePageId?: string
  courseTitle?: string
  topicId?: string
  topicTitle?: string
  signedIn?: boolean
  onSignIn?: () => void
  onHide?: () => void
  sheetLayout?: boolean
}

function topicStorageKey(courseId: string, topic: string) {
  return `${courseId}::${topic}`
}

export function CourseNotesPanel({
  coursePageId,
  courseTitle,
  topicId = '',
  topicTitle,
  signedIn = false,
  onSignIn,
  onHide,
  sheetLayout = false
}: CourseNotesPanelProps) {
  const courseId = (coursePageId ?? '').trim()
  const topic = (topicId ?? '').trim()
  const currentKey = topicStorageKey(courseId, topic)
  const [loadedKey, setLoadedKey] = React.useState('')
  const [initialContent, setInitialContent] = React.useState<NotebookDocJson>(
    NOTEBOOK_EMPTY_DOC as unknown as NotebookDocJson
  )
  const [saveState, setSaveState] = React.useState<
    'idle' | 'saving' | 'saved' | 'error'
  >('idle')
  const saveTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const latestJson = React.useRef<NotebookDocJson>(
    NOTEBOOK_EMPTY_DOC as unknown as NotebookDocJson
  )
  const courseIdRef = React.useRef(courseId)
  const topicIdRef = React.useRef(topic)
  const signedInRef = React.useRef(signedIn)
  courseIdRef.current = courseId
  topicIdRef.current = topic
  signedInRef.current = signedIn

  React.useLayoutEffect(() => {
    let cancelled = false
    const id = courseId
    const topicKey = topic
    setLoadedKey('')
    setSaveState('idle')
    latestJson.current = NOTEBOOK_EMPTY_DOC as unknown as NotebookDocJson
    ;(async () => {
      const content = await getCourseNote(id, topicKey)
      if (cancelled) return
      latestJson.current = content
      setInitialContent(content)
      setLoadedKey(topicStorageKey(id, topicKey))
    })()
    return () => {
      cancelled = true
      if (saveTimer.current) {
        clearTimeout(saveTimer.current)
        saveTimer.current = null
      }
      if (id && signedInRef.current) {
        void saveCourseNote(id, latestJson.current, topicKey)
      }
    }
  }, [courseId, topic, signedIn])

  const flushSave = React.useCallback(async () => {
    if (!signedInRef.current) return
    if (saveTimer.current) {
      clearTimeout(saveTimer.current)
      saveTimer.current = null
    }
    const id = courseIdRef.current
    const topicKey = topicIdRef.current
    const doc = latestJson.current
    if (!id) return
    setSaveState('saving')
    const ok = await saveCourseNote(id, doc, topicKey)
    setSaveState(ok ? 'saved' : 'error')
  }, [])

  const scheduleSave = React.useCallback((json: NotebookDocJson) => {
    if (!signedInRef.current) return
    const id = courseIdRef.current
    const topicKey = topicIdRef.current
    latestJson.current = json
    cacheCourseNote(id, json, topicKey)
    setSaveState('idle')
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      saveTimer.current = null
      setSaveState('saving')
      void saveCourseNote(id, json, topicKey).then((ok) => {
        setSaveState(ok ? 'saved' : 'error')
      })
    }, SAVE_MS)
  }, [])

  React.useEffect(() => {
    return registerPersistBeforeSignOut(() => flushSave())
  }, [flushSave])

  const saveLabel =
    signedIn && saveState === 'saving'
      ? 'Saving…'
      : signedIn && saveState === 'saved'
      ? 'Saved'
      : signedIn && saveState === 'error'
      ? 'Save failed'
      : ''

  const showEditor = loadedKey === currentKey && Boolean(currentKey !== '::')
  const ariaLabel = topicTitle
    ? `Notes for ${topicTitle}`
    : courseTitle
    ? `Notes for ${courseTitle}`
    : 'Course notes'

  return (
    <aside
      className={cs(styles.root, sheetLayout && styles.rootSheet)}
      aria-label='Your notes'
    >
      <div className={styles.header}>
        <h2 className={styles.title}>Your Notes</h2>
        <div className={styles.headerActions}>
          {saveLabel ? (
            <span className={styles.saveStatus} aria-live='polite'>
              {saveLabel}
            </span>
          ) : null}
          <button
            type='button'
            className={styles.hideBtn}
            onClick={onHide}
            aria-label='Hide your notes'
          >
            Hide
          </button>
        </div>
      </div>

      <div className={styles.meta}>
        {topicTitle ? (
          <p className={styles.topicTitle}>{topicTitle}</p>
        ) : null}
        <p className={styles.courseTitle}>{courseTitle || 'Untitled course'}</p>
      </div>

      <div className={styles.body}>
        {showEditor ? (
          <SiteNotesEditor
            key={loadedKey}
            value={initialContent}
            onChange={scheduleSave}
            placeholder='Write your notes for this topic…'
            ariaLabel={ariaLabel}
            expandTitle='Your Notes'
            expandTopic={topicTitle || courseTitle}
            fillHeight
            locked={!signedIn}
            lockedMessage='Sign in to add your notes'
            onUnlock={onSignIn}
            className={styles.notesEditorWrap}
          />
        ) : (
          <p className={styles.loading}>Loading notes…</p>
        )}
      </div>
    </aside>
  )
}
