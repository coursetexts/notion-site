import type { Editor } from '@tiptap/core'
import type { EditorView } from '@tiptap/pm/view'

/** Keep pasted/uploaded images small enough for JSON notes in Postgres. */
export const MAX_NOTE_IMAGE_BYTES = 1.5 * 1024 * 1024

export function isAllowedImageSrc(src: string): boolean {
  const trimmed = src.trim()
  if (trimmed.startsWith('data:image/')) return true
  try {
    const u = new URL(trimmed)
    return u.protocol === 'https:' || u.protocol === 'http:'
  } catch {
    return false
  }
}

function insertImageSrc(view: EditorView, src: string): boolean {
  const image = view.state.schema.nodes.image
  if (!image) return false
  view.dispatch(view.state.tr.replaceSelectionWith(image.create({ src })))
  return true
}

function firstImageFile(
  files: FileList | File[] | null | undefined
): File | null {
  if (!files) return null
  return Array.from(files).find((file) => file.type.startsWith('image/')) ?? null
}

export async function insertImageFile(
  view: EditorView,
  file: File
): Promise<boolean> {
  if (!file.type.startsWith('image/')) {
    window.alert('Please choose an image file.')
    return false
  }
  if (file.size > MAX_NOTE_IMAGE_BYTES) {
    window.alert('Please use an image under 1.5 MB.')
    return false
  }
  const src = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
  if (!src || !isAllowedImageSrc(src)) return false
  return insertImageSrc(view, src)
}

export function handleEditorImagePaste(
  view: EditorView,
  event: ClipboardEvent
): boolean {
  const file = firstImageFile(event.clipboardData?.files)
  if (!file) return false
  event.preventDefault()
  void insertImageFile(view, file)
  return true
}

export function handleEditorImageDrop(
  view: EditorView,
  event: DragEvent,
  moved: boolean
): boolean {
  if (moved) return false
  const file = firstImageFile(event.dataTransfer?.files)
  if (!file) return false
  event.preventDefault()
  void insertImageFile(view, file)
  return true
}

export function setLinkFromUrlPrompt(editor: Editor): void {
  const prev = editor.getAttributes('link').href as string | undefined
  const url = window.prompt('Link URL', prev ?? 'https://')
  if (url === null) return
  const trimmed = url.trim()
  if (trimmed === '') {
    editor.chain().focus().extendMarkRange('link').unsetLink().run()
    return
  }
  let href = trimmed
  if (
    !/^https?:\/\//i.test(href) &&
    !href.startsWith('mailto:') &&
    !href.startsWith('/')
  ) {
    href = `https://${href}`
  }
  editor.chain().focus().extendMarkRange('link').setLink({ href }).run()
}

export function setImageFromUrlOrFile(
  editor: Editor,
  pickFile: () => void
): void {
  const url = window.prompt(
    'Image URL, or leave empty to upload from your computer',
    ''
  )
  if (url === null) return
  const trimmed = url.trim()
  if (!trimmed) {
    pickFile()
    return
  }
  if (!isAllowedImageSrc(trimmed) || trimmed.startsWith('data:')) {
    window.alert('Please paste an http(s) image URL.')
    return
  }
  editor.chain().focus().setImage({ src: trimmed }).run()
}

export function insertInlineMathPrompt(editor: Editor): void {
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

export function insertBlockMathPrompt(editor: Editor): void {
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
