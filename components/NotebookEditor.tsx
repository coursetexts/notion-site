import React, { useCallback, useEffect, useMemo, useRef } from 'react'

import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Mathematics, { defaultShouldRender } from '@tiptap/extension-mathematics'
import Placeholder from '@tiptap/extension-placeholder'
import Table from '@tiptap/extension-table'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import TableRow from '@tiptap/extension-table-row'
import Youtube from '@tiptap/extension-youtube'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import 'katex/dist/katex.min.css'

import { NotesEditorToolbar } from '@/components/NotesEditorToolbar'
import { NOTEBOOK_EMPTY_DOC } from '@/lib/notebook-editor-default'
import type { NotebookDocJson } from '@/lib/notebook-editor-default'
import {
  handleEditorImageDrop,
  handleEditorImagePaste,
  insertImageFile
} from '@/lib/tiptap-editor-image'
import { NotebookPdf } from '@/lib/tiptap-notebook-pdf'
import { notesFormatExtensions } from '@/lib/tiptap-notes-blocks'
import styles from '@/styles/notebook.module.css'

const SAVE_MS = 700

type NotebookEditorProps = {
  tabId: string
  initialContent: NotebookDocJson
  onSave: (json: NotebookDocJson) => Promise<void>
  onSaveState?: (state: 'idle' | 'saving' | 'saved' | 'error') => void
  /** When false, editor is view-only (no toolbar, no saves). Default true. */
  editable?: boolean
  /**
   * Parent-owned ref filled with `flushSave` while mounted. Use this instead
   * of `ref` when the editor is wrapped in `next/dynamic` (refs are not forwarded).
   */
  flushSaveRef?: React.MutableRefObject<(() => Promise<void>) | null>
}

export function NotebookEditor({
  tabId,
  initialContent,
  onSave,
  onSaveState,
  flushSaveRef,
  editable = true
}: NotebookEditorProps) {
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const editableRef = useRef(editable)
  editableRef.current = editable
  const latestJson = useRef<NotebookDocJson>(
    initialContent ?? (NOTEBOOK_EMPTY_DOC as unknown as NotebookDocJson)
  )
  const onSaveRef = useRef(onSave)
  onSaveRef.current = onSave
  const imageInputRef = useRef<HTMLInputElement>(null)
  const [saveStatus, setSaveStatus] = React.useState<
    'saving' | 'saved' | null
  >(null)

  const flushSave = useCallback(async () => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current)
      saveTimer.current = null
    }
    onSaveState?.('saving')
    setSaveStatus('saving')
    try {
      await onSaveRef.current(latestJson.current)
      onSaveState?.('saved')
      setSaveStatus('saved')
    } catch {
      onSaveState?.('error')
    }
  }, [onSaveState])

  const scheduleSave = useCallback(
    (json: NotebookDocJson) => {
      if (!editableRef.current) return
      latestJson.current = json
      onSaveState?.('idle')
      setSaveStatus('saving')
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => {
        saveTimer.current = null
        void flushSave()
      }, SAVE_MS)
    },
    [flushSave, onSaveState]
  )

  useEffect(() => {
    if (!flushSaveRef) return
    if (!editable) {
      flushSaveRef.current = null
      return
    }
    flushSaveRef.current = () => flushSave()
    return () => {
      flushSaveRef.current = null
    }
  }, [flushSave, flushSaveRef, editable])

  const extensions = useMemo(
    () => [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] }
      }),
      Link.configure({
        openOnClick: true,
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: {
          rel: 'noopener noreferrer nofollow',
          target: '_blank'
        }
      }),
      Image.configure({
        inline: false,
        allowBase64: true
      }),
      Mathematics.configure({
        katexOptions: { throwOnError: false },
        shouldRender: defaultShouldRender,
        regex: /\$\$([\s\S]*?)\$\$|\$([^$\n]+)\$/g
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: { class: 'notebookTable' }
      }),
      TableRow,
      TableHeader,
      TableCell,
      Youtube.configure({
        controls: true,
        nocookie: true,
        width: 640,
        height: 360
      }),
      NotebookPdf.configure({
        frameMinHeight: 520,
        addPasteHandler: true
      }),
      Placeholder.configure({
        placeholder: editable ? 'Start writing…' : ''
      }),
      ...notesFormatExtensions()
    ],
    [editable]
  )

  const editor = useEditor({
    editable,
    extensions,
    content: (initialContent ?? NOTEBOOK_EMPTY_DOC) as unknown as Record<
      string,
      unknown
    >,
    editorProps: {
      attributes: {
        spellcheck: 'true'
      },
      handlePaste: (view, event) => {
        if (!editableRef.current) return false
        return handleEditorImagePaste(view, event)
      },
      handleDrop: (view, event, _slice, moved) => {
        if (!editableRef.current) return false
        return handleEditorImageDrop(view, event, moved)
      }
    },
    onUpdate: ({ editor }) => {
      if (!editableRef.current) return
      scheduleSave(editor.getJSON() as NotebookDocJson)
    }
  })

  useEffect(() => {
    if (!editor) return
    editor.setEditable(editable)
  }, [editor, editable])

  useEffect(() => {
    return () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current)
        saveTimer.current = null
      }
      if (editableRef.current) {
        void onSaveRef.current(latestJson.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!editor) return
    const next =
      initialContent ?? (NOTEBOOK_EMPTY_DOC as unknown as NotebookDocJson)
    const cur = editor.getJSON() as NotebookDocJson
    if (JSON.stringify(cur) !== JSON.stringify(next)) {
      editor.commands.setContent(next as Record<string, unknown>, false)
      latestJson.current = next
    }
  }, [tabId, editor, initialContent])

  if (!editor) {
    return <p className={styles.saveStatus}>Loading editor…</p>
  }

  return (
    <div>
      {editable ? (
        <>
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
          <NotesEditorToolbar
            editor={editor}
            imageInputRef={imageInputRef}
            headingLevels={[1, 2, 3]}
            showYoutube
            showPdf
            saveStatus={saveStatus}
            className={styles.editorToolbar}
          />
        </>
      ) : null}
      <div className={styles.editorSurface}>
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
