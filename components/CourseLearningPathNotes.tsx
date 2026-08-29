import * as React from 'react'

import { SiteNotesEditor } from '@/components/SiteNotesEditor'
import {
  cacheCourseLearningPathNote,
  getCourseLearningPathNote,
  saveCourseLearningPathNote
} from '@/lib/course-learning-path-notes-db'
import {
  NOTEBOOK_EMPTY_DOC,
  type NotebookDocJson
} from '@/lib/notebook-editor-default'
import { registerPersistBeforeSignOut } from '@/lib/persist-before-sign-out'

import styles from './CourseLearningPath.module.css'
import { CourseLearningPathSectionToggle } from './CourseLearningPathLinkSection'

const SAVE_MS = 700

export interface CourseLearningPathNotesProps {
  nodeId: string
  courseSlug: string
  topicTitle?: string
  signedIn?: boolean
  onSignIn?: () => void
}

function noteStorageKey(courseSlug: string, nodeId: string) {
  return `${courseSlug}::${nodeId}`
}

/**
 * Collapsible rich-text notes for a syllabus topic (bold, lists, images, LaTeX, links).
 */
export function CourseLearningPathNotes({
  nodeId,
  courseSlug,
  topicTitle,
  signedIn = false,
  onSignIn
}: CourseLearningPathNotesProps) {
  const [open, setOpen] = React.useState(false)
  const currentKey = noteStorageKey(courseSlug, nodeId)
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
  const nodeIdRef = React.useRef(nodeId)
  const courseSlugRef = React.useRef(courseSlug)
  const signedInRef = React.useRef(signedIn)
  nodeIdRef.current = nodeId
  courseSlugRef.current = courseSlug
  signedInRef.current = signedIn

  React.useLayoutEffect(() => {
    let cancelled = false
    const id = nodeId
    const slug = courseSlug
    setLoadedKey('')
    setSaveState('idle')
    latestJson.current = NOTEBOOK_EMPTY_DOC as unknown as NotebookDocJson
    ;(async () => {
      const content = await getCourseLearningPathNote(id, slug)
      if (cancelled) return
      latestJson.current = content
      setInitialContent(content)
      setLoadedKey(noteStorageKey(slug, id))
    })()
    return () => {
      cancelled = true
      if (saveTimer.current) {
        clearTimeout(saveTimer.current)
        saveTimer.current = null
      }
      if (id && signedInRef.current) {
        void saveCourseLearningPathNote(id, slug, latestJson.current)
      }
    }
  }, [nodeId, courseSlug, signedIn])

  const flushSave = React.useCallback(async () => {
    if (!signedInRef.current) return
    if (saveTimer.current) {
      clearTimeout(saveTimer.current)
      saveTimer.current = null
    }
    const id = nodeIdRef.current
    const slug = courseSlugRef.current
    const doc = latestJson.current
    if (!id) return
    setSaveState('saving')
    const ok = await saveCourseLearningPathNote(id, slug, doc)
    setSaveState(ok ? 'saved' : 'error')
  }, [])

  const scheduleSave = React.useCallback((json: NotebookDocJson) => {
    if (!signedInRef.current) return
    const id = nodeIdRef.current
    const slug = courseSlugRef.current
    latestJson.current = json
    cacheCourseLearningPathNote(slug, id, json)
    setSaveState('idle')
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      saveTimer.current = null
      setSaveState('saving')
      void saveCourseLearningPathNote(id, slug, json).then((ok) => {
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

  const showEditor = loadedKey === currentKey && Boolean(nodeId)
  const ariaLabel = topicTitle
    ? `Notes for ${topicTitle}`
    : 'Topic notes'

  return (
    <section aria-labelledby='course-learning-path-notes-heading'>
      <div
        className={`${styles.videosHeader}${
          open ? '' : ` ${styles.videosHeaderCollapsed}`
        }`}
      >
        <h2
          id='course-learning-path-notes-heading'
          className={styles.videosTitle}
        >
          <span style={{ color: '#0089c4', display: 'inline-flex' }}>
            <NoteIcon />
          </span>
          Your Notes
        </h2>
        <div className={styles.videosHeaderActions}>
          {open && saveLabel ? (
            <span className={styles.videosMeta} aria-live='polite'>
              {saveLabel}
            </span>
          ) : null}
          <CourseLearningPathSectionToggle
            open={open}
            label='Your Notes'
            onToggle={() => setOpen((value) => !value)}
          />
        </div>
      </div>

      {open ? (
        <div id='course-learning-path-notes-body' className={styles.notesBody}>
          {showEditor ? (
            <SiteNotesEditor
              key={loadedKey}
              value={initialContent}
              onChange={scheduleSave}
              placeholder='Write notes for this topic…'
              ariaLabel={ariaLabel}
              expandTitle='Your Notes'
              expandTopic={topicTitle}
              locked={!signedIn}
              lockedMessage='Sign in to add your notes'
              onUnlock={onSignIn}
            />
          ) : (
            <p className={styles.notesLoading}>Loading notes…</p>
          )}
        </div>
      ) : null}
    </section>
  )
}

function NoteIcon() {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='20'
      height='20'
      viewBox='0 0 16 16'
      fill='none'
      aria-hidden
    >
      <path
        d='M3.5 2.5h7l2 2V13.5h-9V2.5Z'
        stroke='currentColor'
        strokeWidth='1.2'
        strokeLinejoin='round'
      />
      <path
        d='M10.5 2.5V4.5H12.5'
        stroke='currentColor'
        strokeWidth='1.2'
        strokeLinejoin='round'
      />
      <path
        d='M5.5 7H10.5M5.5 9.5H10.5M5.5 12H8.5'
        stroke='currentColor'
        strokeWidth='1.2'
        strokeLinecap='round'
      />
    </svg>
  )
}
