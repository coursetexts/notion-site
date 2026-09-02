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
 * Rich-text notes for a syllabus topic (bold, lists, images, LaTeX, links).
 * Used in the path content notes panel opened from the top nav.
 */
export function CourseLearningPathNotes({
  nodeId,
  courseSlug,
  topicTitle,
  signedIn = false,
  onSignIn
}: CourseLearningPathNotesProps) {
  const currentKey = noteStorageKey(courseSlug, nodeId)
  const [loadedKey, setLoadedKey] = React.useState('')
  const [initialContent, setInitialContent] = React.useState<NotebookDocJson>(
    NOTEBOOK_EMPTY_DOC as unknown as NotebookDocJson
  )

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
    const empty = NOTEBOOK_EMPTY_DOC as unknown as NotebookDocJson
    if (!signedIn) {
      latestJson.current = empty
      setInitialContent(empty)
      setLoadedKey(noteStorageKey(slug, id))
      return
    }
    setLoadedKey('')
    latestJson.current = empty
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
    await saveCourseLearningPathNote(id, slug, doc)
  }, [])

  const scheduleSave = React.useCallback((json: NotebookDocJson) => {
    if (!signedInRef.current) return
    const id = nodeIdRef.current
    const slug = courseSlugRef.current
    latestJson.current = json
    cacheCourseLearningPathNote(slug, id, json)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      saveTimer.current = null
      void saveCourseLearningPathNote(id, slug, json)
    }, SAVE_MS)
  }, [])

  React.useEffect(() => {
    return registerPersistBeforeSignOut(() => flushSave())
  }, [flushSave])

  const showEditor = loadedKey === currentKey && Boolean(nodeId)
  const editorKey = `${loadedKey}:${signedIn ? 'in' : 'out'}`
  const ariaLabel = topicTitle ? `Notes for ${topicTitle}` : 'Topic notes'

  if (!showEditor) {
    return <p>Loading notes…</p>
  }

  return (
    <SiteNotesEditor
      key={editorKey}
      value={initialContent}
      onChange={scheduleSave}
      placeholder='Write notes for this topic…'
      ariaLabel={ariaLabel}
      expandTitle='Your Notes'
      expandTopic={topicTitle}
      fillHeight
      locked={!signedIn}
      lockedMessage='Sign in to add your notes'
      onUnlock={onSignIn}
    />
  )
}
