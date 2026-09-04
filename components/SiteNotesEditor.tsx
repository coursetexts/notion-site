import * as React from 'react'

import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Mathematics, { defaultShouldRender } from '@tiptap/extension-mathematics'
import Placeholder from '@tiptap/extension-placeholder'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import 'katex/dist/katex.min.css'
import { createPortal } from 'react-dom'

import { NotesEditorToolbar } from '@/components/NotesEditorToolbar'
import { exportRenderedNoteToPdf } from '@/lib/export-note-pdf'
import {
  type NotebookDocJson,
  emptyNotebookDoc,
  parseStoredNotebookNote
} from '@/lib/notebook-editor-default'
import {
  handleEditorImageDrop,
  handleEditorImagePaste,
  insertImageFile
} from '@/lib/tiptap-editor-image'
import {
  notesFormatExtensions,
  notesTableExtensions
} from '@/lib/tiptap-notes-blocks'

import styles from './SiteNotesEditor.module.css'

export interface SiteNotesEditorProps {
  value: NotebookDocJson
  onChange?: (doc: NotebookDocJson) => void
  editable?: boolean
  placeholder?: string
  ariaLabel?: string
  compact?: boolean
  variant?: 'default' | 'preview'
  className?: string
  allowExpand?: boolean
  expandTitle?: string
  expandTopic?: string
  fillHeight?: boolean
  /** Blocks typing and shows a sign-in overlay (Your Notes when signed out). */
  locked?: boolean
  lockedMessage?: string
  onUnlock?: () => void
}

function notesExpandAriaLabel(
  expandTitle: string | undefined,
  expandTopic: string | undefined,
  ariaLabel: string
): string {
  const title = expandTitle?.trim() || ariaLabel
  const topic = expandTopic?.trim()
  return topic ? `${title} | ${topic}` : title
}

/**
 * Shared TipTap notes editor (bold, lists, images, LaTeX, links).
 * Remount with `key` when swapping documents so the cursor is not reset mid-edit.
 */
export function SiteNotesEditor({
  value,
  onChange,
  editable = true,
  placeholder = 'Write a note…',
  ariaLabel = 'Notes',
  compact = false,
  variant = 'default',
  className,
  allowExpand = true,
  expandTitle,
  expandTopic,
  fillHeight = false,
  locked = false,
  lockedMessage = 'Sign in to add your notes',
  onUnlock
}: SiteNotesEditorProps) {
  const imageInputRef = React.useRef<HTMLInputElement>(null)
  const onChangeRef = React.useRef(onChange)
  onChangeRef.current = onChange
  const isPreview = variant === 'preview'
  const isLocked = locked && !isPreview
  const canType = editable && !isPreview && !isLocked
  const canTypeRef = React.useRef(canType)
  canTypeRef.current = canType
  const canExpand = allowExpand && !isPreview && !isLocked
  const modalTitle = notesExpandAriaLabel(expandTitle, expandTopic, ariaLabel)
  const headingTitle = expandTitle?.trim() || ariaLabel
  const headingTopic = expandTopic?.trim() || ''
  const [expanded, setExpanded] = React.useState(false)
  const [portalReady, setPortalReady] = React.useState(false)
  const [exportingPdf, setExportingPdf] = React.useState(false)
  const [saveStatus, setSaveStatus] = React.useState<'saving' | 'saved' | null>(
    null
  )
  const saveStatusTimer = React.useRef<ReturnType<typeof setTimeout> | null>(
    null
  )

  React.useEffect(() => {
    setPortalReady(true)
  }, [])

  React.useEffect(() => {
    return () => {
      if (saveStatusTimer.current) clearTimeout(saveStatusTimer.current)
    }
  }, [])

  React.useEffect(() => {
    if (!expanded) return
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setExpanded(false)
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [expanded])

  React.useEffect(() => {
    if (isLocked) setExpanded(false)
  }, [isLocked])

  const editor = useEditor({
    immediatelyRender: false,
    editable: canType,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        codeBlock: false
      }),
      Link.configure({
        openOnClick: isPreview,
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
        placeholder: isPreview ? '' : placeholder
      }),
      ...notesTableExtensions(),
      ...notesFormatExtensions()
    ],
    content: (value ?? emptyNotebookDoc()) as Record<string, unknown>,
    editorProps: {
      attributes: {
        spellcheck: 'true',
        class: styles.proseMirror,
        'aria-label': ariaLabel
      },
      handlePaste: (view, event) =>
        canTypeRef.current ? handleEditorImagePaste(view, event) : false,
      handleDrop: (view, event, _slice, moved) =>
        canTypeRef.current ? handleEditorImageDrop(view, event, moved) : false
    },
    onUpdate: ({ editor: ed }) => {
      if (!canTypeRef.current) return
      onChangeRef.current?.(ed.getJSON() as NotebookDocJson)
      if (!onChangeRef.current) return
      setSaveStatus('saving')
      if (saveStatusTimer.current) clearTimeout(saveStatusTimer.current)
      saveStatusTimer.current = setTimeout(() => {
        saveStatusTimer.current = null
        setSaveStatus('saved')
      }, 700)
    }
  })

  React.useEffect(() => {
    if (!editor) return
    editor.setEditable(canType)
  }, [editor, canType])

  const exportPdf = React.useCallback(async () => {
    if (!editor || exportingPdf) return
    setExportingPdf(true)
    try {
      await exportRenderedNoteToPdf({
        title: headingTitle,
        topic: headingTopic || undefined,
        source: editor.view.dom
      })
    } finally {
      setExportingPdf(false)
    }
  }, [editor, exportingPdf, headingTitle, headingTopic])

  const editorClass = [
    styles.editor,
    compact && !expanded ? styles.editorCompact : '',
    fillHeight && !expanded ? styles.editorFill : '',
    isPreview ? styles.editorPreview : '',
    isLocked ? styles.editorLocked : '',
    expanded ? styles.editorExpanded : ''
  ]
    .filter(Boolean)
    .join(' ')

  const rootClass = [
    styles.root,
    isPreview ? styles.preview : '',
    fillHeight ? styles.rootFill : '',
    isLocked ? styles.rootLocked : '',
    className ?? ''
  ]
    .filter(Boolean)
    .join(' ')

  const fileInput = (
    <input
      ref={imageInputRef}
      type='file'
      accept='image/*'
      className={styles.fileInput}
      aria-hidden
      tabIndex={-1}
      onChange={(event) => {
        const file = event.target.files?.[0]
        event.target.value = ''
        if (!file || !editor) return
        void insertImageFile(editor.view, file)
      }}
    />
  )

  if (!editor) {
    return (
      <div className={rootClass}>
        <p className={styles.loading}>Loading notes…</p>
      </div>
    )
  }

  const lockOverlay = isLocked ? (
    onUnlock ? (
      <button
        type='button'
        className={styles.lockOverlay}
        onClick={() => onUnlock()}
      >
        <span className={styles.lockMessage}>{lockedMessage}</span>
      </button>
    ) : (
      <div className={styles.lockOverlay} aria-hidden>
        <span className={styles.lockMessage}>{lockedMessage}</span>
      </div>
    )
  ) : null

  const editorBody = (
    <>
      {!isPreview ? (
        <NotesEditorToolbar
          editor={editor}
          imageInputRef={imageInputRef}
          disabled={isLocked}
          saveStatus={isLocked ? null : saveStatus}
          onExportPdf={isLocked ? undefined : () => void exportPdf()}
          exportingPdf={exportingPdf}
          onExpand={
            canExpand && !expanded ? () => setExpanded(true) : undefined
          }
        />
      ) : null}
      <div className={editorClass}>
        <EditorContent editor={editor} />
      </div>
      {lockOverlay}
    </>
  )

  const expandedModal =
    expanded && portalReady
      ? createPortal(
          <div
            className={styles.modalBackdrop}
            role='presentation'
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setExpanded(false)
            }}
          >
            <div
              className={styles.modalCard}
              role='dialog'
              aria-modal='true'
              aria-label={modalTitle}
              onMouseDown={(event) => event.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>
                  {headingTitle}
                  {headingTopic ? (
                    <>
                      <span className={styles.modalTitleSep} aria-hidden>
                        |
                      </span>
                      {headingTopic}
                    </>
                  ) : null}
                </h2>
                <button
                  type='button'
                  className={styles.modalClose}
                  onClick={() => setExpanded(false)}
                  aria-label='Close expanded notes'
                >
                  ×
                </button>
              </div>
              <div className={styles.modalEditor}>{editorBody}</div>
            </div>
          </div>,
          document.body
        )
      : null

  return (
    <>
      {fileInput}
      <div className={rootClass}>
        {expanded ? (
          <p className={styles.expandedPlaceholder}>
            Notes are open in a larger window.
            <button
              type='button'
              className={styles.expandedPlaceholderBtn}
              onClick={() => setExpanded(true)}
            >
              Show expanded notes
            </button>
          </p>
        ) : (
          editorBody
        )}
      </div>
      {expandedModal}
    </>
  )
}

export function BookmarkNotePreview({
  note,
  className
}: {
  note: string | null | undefined
  className?: string
}) {
  const value = React.useMemo(() => parseStoredNotebookNote(note), [note])
  return (
    <SiteNotesEditor
      value={value}
      editable={false}
      variant='preview'
      ariaLabel='Bookmark note'
      className={className}
      allowExpand={false}
    />
  )
}
