import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import Link from '@tiptap/extension-link'
import Mathematics, {
  defaultShouldRender
} from '@tiptap/extension-mathematics'
import Placeholder from '@tiptap/extension-placeholder'
import StarterKit from '@tiptap/starter-kit'
import Table from '@tiptap/extension-table'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import TableRow from '@tiptap/extension-table-row'
import Youtube from '@tiptap/extension-youtube'
import 'katex/dist/katex.min.css'

import { NOTEBOOK_EMPTY_DOC } from '@/lib/notebook-editor-default'
import type { NotebookDocJson } from '@/lib/notebook-editor-default'

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

function isYoutubeUrl(url: string): boolean {
  try {
    const u = new URL(url.trim())
    const h = u.hostname.replace(/^www\./, '')
    return (
      h === 'youtube.com' ||
      h === 'youtu.be' ||
      h === 'm.youtube.com' ||
      h === 'www.youtube-nocookie.com'
    )
  } catch {
    return false
  }
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

  const flushSave = useCallback(async () => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current)
      saveTimer.current = null
    }
    onSaveState?.('saving')
    try {
      await onSaveRef.current(latestJson.current)
      onSaveState?.('saved')
    } catch {
      onSaveState?.('error')
    }
  }, [onSaveState])

  const scheduleSave = useCallback(
    (json: NotebookDocJson) => {
      if (!editableRef.current) return
      latestJson.current = json
      onSaveState?.('idle')
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
      Placeholder.configure({
        placeholder: editable ? 'Start writing…' : ''
      })
    ],
    [editable]
  )

  const editor = useEditor({
    editable,
    extensions,
    content: (initialContent ??
      NOTEBOOK_EMPTY_DOC) as unknown as Record<string, unknown>,
    editorProps: {
      attributes: {
        spellcheck: 'true'
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

  const setHeading = (level: 1 | 2 | 3) => {
    editor?.chain().focus().toggleHeading({ level }).run()
  }

  const setBullet = () => {
    editor?.chain().focus().toggleBulletList().run()
  }

  const setLink = () => {
    if (!editor) return
    const prev = editor.getAttributes('link').href as string | undefined
    const url = window.prompt('Link URL', prev ?? 'https://')
    if (url === null) return
    const trimmed = url.trim()
    if (trimmed === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor
      .chain()
      .focus()
      .extendMarkRange('link')
      .setLink({ href: trimmed })
      .run()
  }

  const setYoutube = () => {
    if (!editor) return
    const url = window.prompt('YouTube URL')
    if (url === null || !url.trim()) return
    const trimmed = url.trim()
    if (!isYoutubeUrl(trimmed)) {
      window.alert('Please paste a valid YouTube link.')
      return
    }
    editor.chain().focus().setYoutubeVideo({ src: trimmed }).run()
  }

  const insertTable = () => {
    if (!editor) return
    editor
      .chain()
      .focus()
      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      .run()
  }

  const insertInlineMath = () => {
    if (!editor) return
    const raw = window.prompt(
      'LaTeX for inline math (no outer $). Example: x^2 or \\alpha',
      'x^2'
    )
    if (raw === null) return
    let inner = raw.trim()
    if (!inner) return
    if (inner.startsWith('$') && inner.endsWith('$')) {
      inner = inner.slice(1, -1).trim()
    }
    editor.chain().focus().insertContent(`$${inner}$`).run()
  }

  const insertBlockMath = () => {
    if (!editor) return
    const raw = window.prompt(
      'LaTeX for block math (own paragraph). Example: \\int_0^1 x\\,dx',
      '\\sum_{i=1}^{n} i'
    )
    if (raw === null) return
    let inner = raw.trim()
    if (!inner) return
    inner = inner.replace(/^\$\$/, '').replace(/\$\$$/, '').trim()
    editor
      .chain()
      .focus()
      .insertContent({
        type: 'paragraph',
        content: [{ type: 'text', text: `$$${inner}$$` }]
      })
      .run()
  }

  if (!editor) {
    return <p className={styles.saveStatus}>Loading editor…</p>
  }

  return (
    <div>
      {editable ? (
        <div className={styles.toolbar} role='toolbar' aria-label='Formatting'>
        <button
          type='button'
          className={
            editor.isActive('heading', { level: 1 })
              ? `${styles.toolBtn} ${styles.toolBtnActive}`
              : styles.toolBtn
          }
          onClick={() => setHeading(1)}
        >
          H1
        </button>
        <button
          type='button'
          className={
            editor.isActive('heading', { level: 2 })
              ? `${styles.toolBtn} ${styles.toolBtnActive}`
              : styles.toolBtn
          }
          onClick={() => setHeading(2)}
        >
          H2
        </button>
        <button
          type='button'
          className={
            editor.isActive('heading', { level: 3 })
              ? `${styles.toolBtn} ${styles.toolBtnActive}`
              : styles.toolBtn
          }
          onClick={() => setHeading(3)}
        >
          H3
        </button>
        <button
          type='button'
          className={
            editor.isActive('bulletList')
              ? `${styles.toolBtn} ${styles.toolBtnActive}`
              : styles.toolBtn
          }
          onClick={setBullet}
        >
          Bullets
        </button>
        <button type='button' className={styles.toolBtn} onClick={setLink}>
          Link
        </button>
        <button type='button' className={styles.toolBtn} onClick={setYoutube}>
          YouTube
        </button>
        <button type='button' className={styles.toolBtn} onClick={insertTable}>
          Table
        </button>
        <button
          type='button'
          className={styles.toolBtn}
          onClick={insertInlineMath}
        >
          LaTeX
        </button>
        <button
          type='button'
          className={styles.toolBtn}
          onClick={insertBlockMath}
        >
          LaTeX block
        </button>
        </div>
      ) : null}
      <div className={styles.editorSurface}>
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
