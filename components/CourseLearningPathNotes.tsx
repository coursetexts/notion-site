import * as React from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Mathematics, {
  defaultShouldRender
} from '@tiptap/extension-mathematics'
import Placeholder from '@tiptap/extension-placeholder'
import StarterKit from '@tiptap/starter-kit'

import {
  getCourseLearningPathNote,
  saveCourseLearningPathNote
} from '@/lib/course-learning-path-notes-db'
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
  const nodeIdRef = React.useRef(nodeId)
  const courseSlugRef = React.useRef(courseSlug)
  nodeIdRef.current = nodeId
  courseSlugRef.current = courseSlug

  React.useEffect(() => {
    let cancelled = false
    setReady(false)
    setSaveState('idle')
    setOpen(false)
    ;(async () => {
      const content = await getCourseLearningPathNote(nodeId, courseSlug)
      if (cancelled) return
      latestJson.current = content
      setInitialContent(content)
      setReady(true)
    })()
    return () => {
      cancelled = true
    }
  }, [nodeId, courseSlug, signedIn])

  const flushSave = React.useCallback(async () => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current)
      saveTimer.current = null
    }
    setSaveState('saving')
    const ok = await saveCourseLearningPathNote(
      nodeIdRef.current,
      courseSlugRef.current,
      latestJson.current
    )
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
          placeholder: 'Write notes for this topic…'
        })
      ],
      content: (NOTEBOOK_EMPTY_DOC as unknown) as Record<string, unknown>,
      editorProps: {
        attributes: {
          spellcheck: 'true',
          class: styles.notesProseMirror,
          'aria-label': topicTitle
            ? `Notes for ${topicTitle}`
            : 'Topic notes'
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
  }, [editor, ready, initialContent, nodeId])

  React.useEffect(() => {
    return () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current)
        saveTimer.current = null
      }
      void saveCourseLearningPathNote(
        nodeIdRef.current,
        courseSlugRef.current,
        latestJson.current
      )
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
    <section aria-labelledby='course-learning-path-notes-heading'>
      <div
        className={`${styles.videosHeader}${
          open ? '' : ` ${styles.videosHeaderCollapsed}`
        }`}
      >
        <h2 id='course-learning-path-notes-heading' className={styles.videosTitle}>
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
          {!signedIn && (
            <p className={styles.notesHint}>
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

          {!editor || !ready ? (
            <p className={styles.notesLoading}>Loading notes…</p>
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
                  onClick={() =>
                    editor.chain().focus().toggleBulletList().run()
                  }
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
                  onClick={() =>
                    editor.chain().focus().toggleOrderedList().run()
                  }
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
                  onClick={() =>
                    editor.chain().focus().toggleBlockquote().run()
                  }
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
