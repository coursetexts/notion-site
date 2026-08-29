/** Empty Tiptap / ProseMirror document (StarterKit-compatible). */
export const NOTEBOOK_EMPTY_DOC = {
  type: 'doc',
  content: [{ type: 'paragraph' }]
} as const

export type NotebookDocJson = Record<string, unknown>

export function emptyNotebookDoc(): NotebookDocJson {
  return {
    type: 'doc',
    content: [{ type: 'paragraph' }]
  }
}

function nodeHasVisibleContent(node: unknown): boolean {
  if (!node || typeof node !== 'object') return false
  const n = node as Record<string, unknown>
  const type = n.type
  if (type === 'text') {
    return typeof n.text === 'string' && n.text.trim().length > 0
  }
  if (type === 'image') {
    const attrs = n.attrs as { src?: string } | undefined
    return Boolean(attrs?.src)
  }
  if (type === 'horizontalRule' || type === 'table') return true
  if (Array.isArray(n.content)) {
    return n.content.some(nodeHasVisibleContent)
  }
  return false
}

export function isNotebookDocEmpty(
  doc: NotebookDocJson | null | undefined
): boolean {
  if (!doc || typeof doc !== 'object') return true
  const content = doc.content
  if (!Array.isArray(content) || content.length === 0) return true
  return !content.some(nodeHasVisibleContent)
}

/** Parse a stored note: TipTap JSON, or legacy plain text. */
export function parseStoredNotebookNote(
  raw: string | null | undefined
): NotebookDocJson {
  if (!raw?.trim()) return emptyNotebookDoc()
  try {
    const parsed = JSON.parse(raw) as NotebookDocJson
    if (parsed && typeof parsed === 'object' && parsed.type === 'doc') {
      return parsed
    }
  } catch {
    /* legacy plain text */
  }
  return {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [{ type: 'text', text: raw }]
      }
    ]
  }
}

export function serializeStoredNotebookNote(
  doc: NotebookDocJson
): string | null {
  if (isNotebookDocEmpty(doc)) return null
  return JSON.stringify(doc)
}

export function storedNotebookNoteHasContent(
  raw: string | null | undefined
): boolean {
  return !isNotebookDocEmpty(parseStoredNotebookNote(raw))
}

export function notebookNoteWithAttribution(
  raw: string | null | undefined,
  attribution: string
): string {
  const paragraph = {
    type: 'paragraph',
    content: [{ type: 'text', text: attribution }]
  }
  const doc = parseStoredNotebookNote(raw)
  if (isNotebookDocEmpty(doc)) {
    return JSON.stringify({ type: 'doc', content: [paragraph] })
  }
  const content = Array.isArray(doc.content)
    ? [...doc.content, paragraph]
    : [paragraph]
  return JSON.stringify({ ...doc, content })
}
