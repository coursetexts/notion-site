const NOTE_PDF_WIDTH_PX = 720
const NOTE_PDF_MARGIN_PT = 36

const NOTE_PDF_CSS = `
.note-pdf-export-root {
  box-sizing: border-box;
  width: ${NOTE_PDF_WIDTH_PX}px;
  padding: 28px 32px 40px;
  background: #fff;
  color: #25272b;
  font-family: 'Hanken Grotesk', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 15px;
  line-height: 1.55;
  text-align: left;
}
.note-pdf-export-root *,
.note-pdf-export-root *::before,
.note-pdf-export-root *::after {
  box-sizing: border-box;
}
.note-pdf-export-root .note-header {
  margin: 0 0 18px;
  padding: 0 0 12px;
  border-bottom: 1px solid #d8d4cc;
}
.note-pdf-export-root .note-kicker {
  margin: 0 0 6px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #6b7280;
}
.note-pdf-export-root .note-title {
  margin: 0;
  font-family: Fraunces, Georgia, 'Times New Roman', serif;
  font-size: 28px;
  font-weight: 400;
  line-height: 1.25;
  color: #000;
}
.note-pdf-export-root .note-sub {
  margin: 8px 0 0;
  font-size: 14px;
  color: #5d534b;
}
.note-pdf-export-root .note-body p { margin: 0 0 0.7em; }
.note-pdf-export-root .note-body p:last-child { margin-bottom: 0; }
.note-pdf-export-root .note-body h2 {
  margin: 0.85em 0 0.4em;
  font-family: Fraunces, Georgia, 'Times New Roman', serif;
  font-size: 20px;
  font-weight: 400;
  color: #000;
}
.note-pdf-export-root .note-body h3 {
  margin: 0.75em 0 0.35em;
  font-family: Fraunces, Georgia, 'Times New Roman', serif;
  font-size: 17px;
  font-weight: 400;
  color: #000;
}
.note-pdf-export-root .note-body ul,
.note-pdf-export-root .note-body ol {
  margin: 0 0 0.7em;
  padding-left: 1.35em;
}
.note-pdf-export-root .note-body li { margin: 0.12em 0; }
.note-pdf-export-root .note-body blockquote {
  margin: 0 0 0.7em;
  padding: 0.15em 0 0.15em 0.75em;
  border-left: 2px solid #0089c4;
  color: #5d534b;
}
.note-pdf-export-root .note-body a { color: #0089c4; }
.note-pdf-export-root .note-body mark,
.note-pdf-export-root .note-body mark.notesHighlight {
  background: #fff3a0;
  color: inherit;
}
.note-pdf-export-root .note-body table {
  border-collapse: collapse;
  width: 100%;
  margin: 0.7em 0;
  font-size: 0.95em;
}
.note-pdf-export-root .note-body th,
.note-pdf-export-root .note-body td {
  border: 1px solid #d8d8d6;
  padding: 0.3em 0.5em;
  vertical-align: top;
}
.note-pdf-export-root .note-body th { background: #f4f3f0; }
.note-pdf-export-root .note-body hr {
  border: none;
  border-top: 1px solid #d8d4cc;
  margin: 1em 0;
}
.note-pdf-export-root .note-body img {
  display: block;
  max-width: 100%;
  height: auto;
  margin: 0.7em 0;
}
.note-pdf-export-root .note-body .Tiptap-mathematics-editor {
  display: none !important;
}
.note-pdf-export-root .note-body .Tiptap-mathematics-render {
  display: inline-block;
  margin: 0 0.12em;
  vertical-align: middle;
}
.note-pdf-export-root .note-body .ProseMirror-trailingBreak {
  display: none;
}
.note-pdf-export-root p.is-editor-empty:first-child::before {
  content: none !important;
}
`

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function notePdfFilename(parts: Array<string | undefined | null>): string {
  const slug = parts
    .map((part) => (part ?? '').trim())
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
  return `${slug || 'notes'}.pdf`
}

function waitForImages(root: ParentNode): Promise<void> {
  const images = Array.from(root.querySelectorAll('img'))
  if (images.length === 0) return Promise.resolve()
  return Promise.all(
    images.map(
      (img) =>
        img.complete
          ? Promise.resolve()
          : new Promise<void>((resolve) => {
              img.addEventListener('load', () => resolve(), { once: true })
              img.addEventListener('error', () => resolve(), { once: true })
            })
    )
  ).then(() => undefined)
}

function cloneNoteHtml(source: HTMLElement): string {
  const clone = source.cloneNode(true) as HTMLElement
  clone.removeAttribute('contenteditable')
  clone.removeAttribute('aria-label')
  clone.querySelectorAll('[data-placeholder]').forEach((node) => {
    node.removeAttribute('data-placeholder')
  })
  clone.querySelectorAll('.Tiptap-mathematics-editor').forEach((node) => {
    node.parentElement?.removeChild(node)
  })
  return clone.innerHTML.trim()
}

function buildExportHost(input: {
  title: string
  topic?: string
  bodyHtml: string
}): HTMLElement {
  const topic = (input.topic ?? '').trim()
  const heading = topic || input.title
  const sub =
    topic && topic !== input.title.trim() ? escapeHtml(input.title.trim()) : ''
  const host = document.createElement('div')
  host.className = 'note-pdf-export-root'
  host.setAttribute('aria-hidden', 'true')
  host.style.position = 'fixed'
  host.style.left = '-10000px'
  host.style.top = '0'
  host.style.zIndex = '-1'
  host.innerHTML = `
    <style>${NOTE_PDF_CSS}</style>
    <header class="note-header">
      <p class="note-kicker">Coursetexts notes</p>
      <h1 class="note-title">${escapeHtml(heading)}</h1>
      ${sub ? `<p class="note-sub">${sub}</p>` : ''}
    </header>
    <div class="note-body">${input.bodyHtml || '<p></p>'}</div>
  `
  return host
}

function addCanvasAsPdfPages(
  pdf: import('jspdf').jsPDF,
  canvas: HTMLCanvasElement
) {
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const contentWidth = pageWidth - NOTE_PDF_MARGIN_PT * 2
  const contentHeight = pageHeight - NOTE_PDF_MARGIN_PT * 2
  const imgWidth = contentWidth
  const imgHeight = (canvas.height * imgWidth) / canvas.width
  const imgData = canvas.toDataURL('image/jpeg', 0.92)
  let heightLeft = imgHeight
  let position = NOTE_PDF_MARGIN_PT

  pdf.addImage(imgData, 'JPEG', NOTE_PDF_MARGIN_PT, position, imgWidth, imgHeight)
  heightLeft -= contentHeight

  while (heightLeft > 0) {
    position = NOTE_PDF_MARGIN_PT - (imgHeight - heightLeft)
    pdf.addPage()
    pdf.addImage(
      imgData,
      'JPEG',
      NOTE_PDF_MARGIN_PT,
      position,
      imgWidth,
      imgHeight
    )
    heightLeft -= contentHeight
  }
}

export async function exportRenderedNoteToPdf(input: {
  title: string
  topic?: string
  source: HTMLElement
}): Promise<void> {
  const filename = notePdfFilename([input.topic, input.title, 'notes'])
  const host = buildExportHost({
    title: input.title.trim() || 'Your Notes',
    topic: input.topic,
    bodyHtml: cloneNoteHtml(input.source)
  })
  document.body.appendChild(host)

  try {
    const jspdfMod = await import('jspdf')
    const html2canvasMod = await import('html2canvas')
    const JsPDF =
      (jspdfMod as { jsPDF?: typeof import('jspdf').jsPDF }).jsPDF ||
      (jspdfMod as { default: typeof import('jspdf').jsPDF }).default
    const html2canvas =
      (html2canvasMod as { default?: typeof import('html2canvas').default })
        .default ||
      (html2canvasMod as unknown as typeof import('html2canvas').default)
    if (document.fonts?.ready) await document.fonts.ready
    await waitForImages(host)
    await new Promise((resolve) => window.setTimeout(resolve, 40))

    const canvas = await html2canvas(host, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: NOTE_PDF_WIDTH_PX,
      width: NOTE_PDF_WIDTH_PX,
      scrollX: 0,
      scrollY: 0
    })

    const pdf = new JsPDF({
      unit: 'pt',
      format: 'letter',
      orientation: 'portrait',
      compress: true
    })
    pdf.setProperties({
      title: filename.replace(/\.pdf$/i, ''),
      creator: 'Coursetexts'
    })
    addCanvasAsPdfPages(pdf, canvas)
    pdf.save(filename)
  } catch {
    window.alert('Could not export this note as a PDF. Try again.')
  } finally {
    host.remove()
  }
}
