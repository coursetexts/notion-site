import { Node, mergeAttributes, nodePasteRule } from '@tiptap/core'

/** Loose match for pasted PDF links (direct file URLs). */
const PDF_URL_REGEX_GLOBAL =
  /https?:\/\/[^\s<>"']+\.pdf(?:\?[^\s<>"']*)?/gi

export function isAllowedPdfEmbedUrl(url: string): boolean {
  try {
    const u = new URL(url.trim())
    return u.protocol === 'https:' || u.protocol === 'http:'
  } catch {
    return false
  }
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    notebookPdf: {
      setNotebookPdf: (attrs: {
        src: string
        title?: string | null
      }) => ReturnType
    }
  }
}

export type NotebookPdfOptions = {
  /** Default iframe height in px (width is always 100%). */
  frameMinHeight: number
  addPasteHandler: boolean
  HTMLAttributes: Record<string, unknown>
}

export const NotebookPdf = Node.create<NotebookPdfOptions>({
  name: 'notebookPdf',

  group: 'block',

  atom: true,

  draggable: true,

  addOptions() {
    return {
      frameMinHeight: 520,
      addPasteHandler: true,
      HTMLAttributes: {}
    }
  },

  addAttributes() {
    return {
      src: {
        default: null
      },
      title: {
        default: null
      }
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-notebook-pdf]',
        getAttrs: (el) => {
          if (typeof el === 'string') return false
          const iframe = el.querySelector('iframe')
          const src = iframe?.getAttribute('src')
          if (!src) return false
          return {
            src,
            title: iframe.getAttribute('title')
          }
        }
      },
      {
        tag: 'iframe[data-notebook-pdf-frame]',
        getAttrs: (el) => {
          if (typeof el === 'string') return false
          const src = el.getAttribute('src')
          if (!src) return false
          return {
            src,
            title: el.getAttribute('title')
          }
        }
      }
    ]
  },

  renderHTML({ HTMLAttributes }) {
    const src = HTMLAttributes.src as string | undefined
    const title =
      (HTMLAttributes.title as string | undefined) || 'Embedded PDF'
    const minH = this.options.frameMinHeight
    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, {
        'data-notebook-pdf': '',
        class: 'notebookPdfWrap'
      }),
      [
        'iframe',
        mergeAttributes({
          src,
          title,
          class: 'notebookPdfIframe',
          loading: 'lazy',
          referrerPolicy: 'no-referrer-when-downgrade',
          'data-notebook-pdf-frame': '',
          style: `width:100%;min-height:${minH}px;border:0;border-radius:8px`
        })
      ]
    ]
  },

  addCommands() {
    return {
      setNotebookPdf:
        (attrs: { src: string; title?: string | null }) =>
        ({ commands }) => {
          const src = attrs.src?.trim()
          if (!src || !isAllowedPdfEmbedUrl(src)) {
            return false
          }
          return commands.insertContent({
            type: this.name,
            attrs: {
              src,
              title: attrs.title ?? null
            }
          })
        }
    }
  },

  addPasteRules() {
    if (!this.options.addPasteHandler) {
      return []
    }
    return [
      nodePasteRule({
        find: PDF_URL_REGEX_GLOBAL,
        type: this.type,
        getAttributes: (match) => {
          const url = match[0]?.trim()
          if (!url || !isAllowedPdfEmbedUrl(url)) return false
          return { src: url, title: null }
        }
      })
    ]
  }
})
