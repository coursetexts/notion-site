/** Empty Tiptap / ProseMirror document (StarterKit-compatible). */
export const NOTEBOOK_EMPTY_DOC = {
  type: 'doc',
  content: [{ type: 'paragraph' }]
} as const

export type NotebookDocJson = Record<string, unknown>
