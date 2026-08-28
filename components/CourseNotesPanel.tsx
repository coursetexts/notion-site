import * as React from 'react'
import cs from 'classnames'
import { EditorContent, useEditor } from '@tiptap/react'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Mathematics, {
  defaultShouldRender
} from '@tiptap/extension-mathematics'
import Placeholder from '@tiptap/extension-placeholder'
import StarterKit from '@tiptap/starter-kit'
import 'katex/dist/katex.min.css'

import { getCourseNote, saveCourseNote } from '@/lib/course-notes-db'
import {
  NOTEBOOK_EMPTY_DOC,
  type NotebookDocJson
} from '@/lib/notebook-editor-default'
import {
  handleEditorImageDrop,
  handleEditorImagePaste,
  insertBlockMathPrompt,
  insertImageFile,
  insertInlineMathPrompt,
  setImageFromUrlOrFile,
  setLinkFromUrlPrompt
} from '@/lib/tiptap-editor-image'

import styles from './CourseNotesPanel.module.css'

const SAVE_MS = 700

export interface CourseNotesPanelProps {
  coursePageId?: string
  courseTitle?: string
  signedIn?: boolean
  onSignIn?: () => void
  onHide?: () => void
  sheetLayout?: boolean
}

export function CourseNotesPanel({
  coursePageId,
  courseTitle,
  signedIn = false,
  onSignIn,
  onHide,
  sheetLayout = false
}: CourseNotesPanelProps) {
  const courseId = (coursePageId ?? '').trim()
  const [ready, setReady] = React.useState(false)
  const [initialContent, setInitialContent] = React.useState<NotebookDocJson>(
    NOTEBOOK_EMPTY_DOC as unknown as NotebookDocJson
  )
  const [saveState, setSaveState] = React.useState<
    'idle' | 'saving' | 'saved' | 'error'
  >('idle')
  const imageInputRef = React.useRef<HTMLInputElement>(null)
  const saveTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const latestJson = React.useRef<NotebookDocJson>(
    NOTEBOOK_EMPTY_DOC as unknown as NotebookDocJson
  )
  const courseIdRef = React.useRef(courseId)
  courseIdRef.current = courseId

  React.useEffect(() => {
    let cancelled = false
    setReady(false)
    setSaveState('idle')
    ;(async () => {
      const content = await getCourseNote(courseId)
      if (cancelled) return
      latestJson.current = content
      setInitialContent(content)
      setReady(true)
    })()
    return () => {
      cancelled = true
    }
  }, [courseId, signedIn])

  const flushSave = React.useCallback(async () => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current)
      saveTimer.current = null
    }
    if (!courseIdRef.current) return
    setSaveState('saving')
    const ok = await saveCourseNote(courseIdRef.current, latestJson.current)
    setSaveState(ok ? 'saved' : 'error')
  }, [])

  const scheduleSave = React.useCallback(
    (json: NotebookDocJson) => {
      latestJson.current = json
      setSaveState('idle')
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => {
        saveTimer.current = null
        void flushSave()
      }, SAVE_MS)
    },
    [flushSave]
  )

  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({
          heading: { levels: [2, 3] },
          codeBlock: false
        }),
        Link.configure({
          openOnClick: false,
          autolink: true,
          linkOnPaste: true,
          HTMLAttributes: {
            rel: 'noopener noreferrer nofollow',
            target: '_blank'
          }
        }),
        Image.configure({
          inline: false,
          allowBase64: true,
          HTMLAttributes: {
            class: 'notesImage'
          }
        }),
        Mathematics.configure({
          katexOptions: { throwOnError: false },
          shouldRender: defaultShouldRender,
          regex: /\$\$([\s\S]*?)\$\$|\$([^$\n]+)\$/g
        }),
        Placeholder.configure({
          placeholder: 'Write your notes for this course…'
        })
      ],
      content: (NOTEBOOK_EMPTY_DOC as unknown) as Record<string, unknown>,
      editorProps: {
        attributes: {
          spellcheck: 'true',
          class: styles.notesProseMirror,
          'aria-label': courseTitle
            ? `Notes for ${courseTitle}`
            : 'Course notes'
        },
        handlePaste: (view, event) => handleEditorImagePaste(view, event),
        handleDrop: (view, event, _slice, moved) =>
          handleEditorImageDrop(view, event, moved)
      },
      onUpdate: ({ editor: ed }) => {
        scheduleSave(ed.getJSON() as NotebookDocJson)
      }
    },
    []
  )

  React.useEffect(() => {
    if (!editor || !ready) return
    const next = initialContent
    const cur = editor.getJSON() as NotebookDocJson
    if (JSON.stringify(cur) !== JSON.stringify(next)) {
      editor.commands.setContent(next as Record<string, unknown>, false)
      latestJson.current = next
    }
  }, [editor, ready, initialContent, courseId])

  React.useEffect(() => {
    return () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current)
        saveTimer.current = null
      }
      if (courseIdRef.current) {
        void saveCourseNote(courseIdRef.current, latestJson.current)
      }
    }
  }, [])

  const saveLabel =
    saveState === 'saving'
      ? 'Saving…'
      : saveState === 'saved'
        ? signedIn
          ? 'Saved'
          : 'Saved locally'
        : saveState === 'error'
          ? 'Save failed'
          : ''

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
        <p className={styles.courseTitle}>{courseTitle || 'Untitled course'}</p>
        {!signedIn && (
          <p className={styles.hint}>
            Notes save in this browser.{' '}
            <button
              type='button'
              className={styles.signInLink}
              onClick={() => onSignIn?.()}
            >
              Sign in
            </button>{' '}
            to sync across devices.
          </p>
        )}
      </div>

      <div className={styles.body}>
        {!editor || !ready ? (
          <p className={styles.loading}>Loading notes…</p>
        ) : (
          <>
            <input
              ref={imageInputRef}
              type='file'
              accept='image/*'
              className={styles.notesFileInput}
              aria-hidden
              tabIndex={-1}
              onChange={(event) => {
                const file = event.target.files?.[0]
                event.target.value = ''
                if (!file) return
                void insertImageFile(editor.view, file)
              }}
            />
            <div
              className={styles.notesToolbar}
              role='toolbar'
              aria-label='Note formatting'
            >
              <button
                type='button'
                className={`${styles.notesToolBtn}${
                  editor.isActive('bold') ? ` ${styles.notesToolBtnActive}` : ''
                }`}
                onClick={() => editor.chain().focus().toggleBold().run()}
                aria-pressed={editor.isActive('bold')}
              >
                Bold
              </button>
              <button
                type='button'
                className={`${styles.notesToolBtn}${
                  editor.isActive('italic')
                    ? ` ${styles.notesToolBtnActive}`
                    : ''
                }`}
                onClick={() => editor.chain().focus().toggleItalic().run()}
                aria-pressed={editor.isActive('italic')}
              >
                Italic
              </button>
              <button
                type='button'
                className={`${styles.notesToolBtn}${
                  editor.isActive('bulletList')
                    ? ` ${styles.notesToolBtnActive}`
                    : ''
                }`}
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                aria-pressed={editor.isActive('bulletList')}
              >
                Bullets
              </button>
              <button
                type='button'
                className={`${styles.notesToolBtn}${
                  editor.isActive('orderedList')
                    ? ` ${styles.notesToolBtnActive}`
                    : ''
                }`}
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                aria-pressed={editor.isActive('orderedList')}
              >
                Numbered
              </button>
              <button
                type='button'
                className={`${styles.notesToolBtn}${
                  editor.isActive('heading', { level: 2 })
                    ? ` ${styles.notesToolBtnActive}`
                    : ''
                }`}
                onClick={() =>
                  editor.chain().focus().toggleHeading({ level: 2 }).run()
                }
                aria-pressed={editor.isActive('heading', { level: 2 })}
              >
                Heading
              </button>
              <button
                type='button'
                className={`${styles.notesToolBtn}${
                  editor.isActive('blockquote')
                    ? ` ${styles.notesToolBtnActive}`
                    : ''
                }`}
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                aria-pressed={editor.isActive('blockquote')}
              >
                Quote
              </button>
              <button
                type='button'
                className={`${styles.notesToolBtn}${
                  editor.isActive('link') ? ` ${styles.notesToolBtnActive}` : ''
                }`}
                onClick={() => setLinkFromUrlPrompt(editor)}
                aria-pressed={editor.isActive('link')}
              >
                Link
              </button>
              <button
                type='button'
                className={styles.notesToolBtn}
                onClick={() =>
                  setImageFromUrlOrFile(editor, () =>
                    imageInputRef.current?.click()
                  )
                }
              >
                Image
              </button>
              <button
                type='button'
                className={styles.notesToolBtn}
                onClick={() => insertInlineMathPrompt(editor)}
              >
                LaTeX
              </button>
              <button
                type='button'
                className={styles.notesToolBtn}
                onClick={() => insertBlockMathPrompt(editor)}
              >
                LaTeX block
              </button>
            </div>
            <div className={styles.notesEditor}>
              <EditorContent editor={editor} />
            </div>
          </>
        )}
      </div>
    </aside>
  )
}
