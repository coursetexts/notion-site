import { Extension, Mark, mergeAttributes } from '@tiptap/core'
import type { CommandProps, Editor } from '@tiptap/core'
import Table from '@tiptap/extension-table'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import TableRow from '@tiptap/extension-table-row'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    highlight: {
      toggleHighlight: () => ReturnType
      setHighlight: () => ReturnType
      unsetHighlight: () => ReturnType
    }
    underline: {
      toggleUnderline: () => ReturnType
      setUnderline: () => ReturnType
      unsetUnderline: () => ReturnType
    }
    notesIndent: {
      indentNotes: () => ReturnType
      outdentNotes: () => ReturnType
    }
  }
}

const INDENT_TYPES = ['paragraph', 'heading', 'blockquote']
const MAX_INDENT = 8

function clampIndent(value: number) {
  return Math.max(0, Math.min(MAX_INDENT, value))
}

function applyIndentDelta(delta: number) {
  return ({ state, dispatch, tr }: CommandProps) => {
    const { from, to } = state.selection
    let changed = false
    state.doc.nodesBetween(from, to, (node, pos) => {
      if (!INDENT_TYPES.includes(node.type.name)) return
      const current = Number(node.attrs.indent) || 0
      const next = clampIndent(current + delta)
      if (next === current) return
      changed = true
      if (dispatch) {
        tr.setNodeMarkup(pos, undefined, { ...node.attrs, indent: next })
      }
    })
    if (!changed) return false
    dispatch?.(tr)
    return true
  }
}

export const NotesHighlight = Mark.create({
  name: 'highlight',
  addOptions() {
    return {
      HTMLAttributes: { class: 'notesHighlight' }
    }
  },
  parseHTML() {
    return [{ tag: 'mark' }]
  },
  renderHTML({ HTMLAttributes }) {
    return [
      'mark',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
      0
    ]
  },
  addCommands() {
    return {
      setHighlight:
        () =>
        ({ commands }) =>
          commands.setMark(this.name),
      toggleHighlight:
        () =>
        ({ commands }) =>
          commands.toggleMark(this.name),
      unsetHighlight:
        () =>
        ({ commands }) =>
          commands.unsetMark(this.name)
    }
  }
})

export const NotesUnderline = Mark.create({
  name: 'underline',
  addOptions() {
    return {
      HTMLAttributes: { class: 'notesUnderline' }
    }
  },
  parseHTML() {
    return [
      { tag: 'u' },
      {
        style: 'text-decoration',
        consuming: false,
        getAttrs: (style) =>
          typeof style === 'string' && style.includes('underline') ? {} : false
      }
    ]
  },
  renderHTML({ HTMLAttributes }) {
    return [
      'u',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
      0
    ]
  },
  addCommands() {
    return {
      setUnderline:
        () =>
        ({ commands }) =>
          commands.setMark(this.name),
      toggleUnderline:
        () =>
        ({ commands }) =>
          commands.toggleMark(this.name),
      unsetUnderline:
        () =>
        ({ commands }) =>
          commands.unsetMark(this.name)
    }
  },
  addKeyboardShortcuts() {
    return {
      'Mod-u': () => this.editor.commands.toggleUnderline()
    }
  }
})

export const NotesIndent = Extension.create({
  name: 'notesIndent',
  addGlobalAttributes() {
    return [
      {
        types: INDENT_TYPES,
        attributes: {
          indent: {
            default: 0,
            parseHTML: (element) => {
              const raw = element.getAttribute('data-indent')
              const n = raw ? Number.parseInt(raw, 10) : 0
              return Number.isFinite(n) ? n : 0
            },
            renderHTML: (attributes) => {
              const indent = Number(attributes.indent) || 0
              if (!indent) return {}
              return {
                'data-indent': String(indent),
                style: `margin-left: ${indent * 1.5}rem`
              }
            }
          }
        }
      }
    ]
  },
  addCommands() {
    return {
      indentNotes:
        () =>
        (props) => {
          if (props.commands.sinkListItem('listItem')) return true
          return applyIndentDelta(1)(props)
        },
      outdentNotes:
        () =>
        (props) => {
          if (props.commands.liftListItem('listItem')) return true
          return applyIndentDelta(-1)(props)
        }
    }
  },
  addKeyboardShortcuts() {
    return {
      Tab: () => this.editor.commands.indentNotes(),
      'Shift-Tab': () => this.editor.commands.outdentNotes()
    }
  }
})

export function notesTableExtensions(className = 'notesTable') {
  return [
    Table.configure({
      resizable: false,
      HTMLAttributes: { class: className }
    }),
    TableRow,
    TableHeader,
    TableCell
  ]
}

export function notesFormatExtensions() {
  return [NotesHighlight, NotesUnderline, NotesIndent]
}

export function insertNotesTable(editor: Editor) {
  editor
    .chain()
    .focus()
    .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
    .run()
}

export function insertNotesDivider(editor: Editor) {
  editor.chain().focus().setHorizontalRule().run()
}

export function toggleNotesHighlight(editor: Editor) {
  editor.chain().focus().toggleHighlight().run()
}

export function toggleNotesUnderline(editor: Editor) {
  editor.chain().focus().toggleUnderline().run()
}

export function indentNotesBlock(editor: Editor) {
  editor.chain().focus().indentNotes().run()
}

export function outdentNotesBlock(editor: Editor) {
  editor.chain().focus().outdentNotes().run()
}
