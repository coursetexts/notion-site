/**
 * Build course content sections from the Notion doc: each heading starts a new tab,
 * and we group content until the next heading or the end of the doc (no more notion
 * blocks/text). Drives the stylized Table of Contents and section visibility.
 */

const HEADING_SELECTOR =
  'h1[class*="notion"], h2[class*="notion"], h3[class*="notion"]'

const DATA_TAB_INDEX = 'data-tab-index'
const DATA_TOC_ID = 'data-toc-id'
export const SECTION_CLASS = 'course-content-section'
export const SECTION_ACTIVE_CLASS = 'content-section-active'

export interface TocChild {
  id?: string
  label: string
  href?: string
  hideContentUnderEmbed?: boolean
}

export interface TocItem {
  tabIndex: number
  label: string
  children?: TocChild[]
}

function isHeading(el: Element): boolean {
  return el.matches(HEADING_SELECTOR)
}

function normalizeText(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

/**
 * True when this row is essentially "one big link" with no other visible text.
 * We only auto-embed those rows; mixed text+link rows remain regular content.
 */
function isStandaloneLinkOnly(linkEl: HTMLElement): boolean {
  const block = linkEl.closest('.notion-text, .notion-callout-text') as HTMLElement | null
  if (!block) return false

  const links = block.querySelectorAll('a.notion-link, a.notion-page-link')
  if (links.length !== 1 || links[0] !== linkEl) return false

  const blockText = normalizeText(block.textContent || '')
  const linkText = normalizeText(linkEl.textContent || '')
  if (!blockText || !linkText) return false

  return blockText === linkText
}

/**
 * Find the article container to walk (notion-page-content-inner or slot’s first child).
 */
function getArticleInner(container: HTMLElement): HTMLElement | null {
  const inner = container.querySelector('.notion-page-content-inner') as HTMLElement
  if (inner) return inner
  const first = container.firstElementChild as HTMLElement
  return first && (first.classList.contains('notion-page-content-inner') || first.children.length > 0)
    ? first
    : null
}

/**
 * Build sections from headings: wrap content under each heading until next heading or end of doc.
 * Returns TOC items and mutates the DOM (wraps nodes in section divs).
 */
export function buildSectionsFromHeadings(container: HTMLElement | null): TocItem[] {
  if (!container) return []

  const inner = getArticleInner(container)
  if (!inner) return []

  if (inner.hasAttribute('data-course-sections-built')) return []

  const children = Array.from(inner.children) as HTMLElement[]
  if (children.length === 0) return []

  const sections: { label: string; nodes: HTMLElement[] }[] = []
  let current: { label: string; nodes: HTMLElement[] } | null = null
  let preHeading: HTMLElement[] = []

  for (let i = 0; i < children.length; i++) {
    const node = children[i]
    if (isHeading(node)) {
      if (preHeading.length > 0) {
        sections.push({ label: 'Overview', nodes: preHeading })
        preHeading = []
      }
      const label = (node.querySelector('.notion-h-title') || node).textContent?.trim() || node.textContent?.trim() || `Section ${sections.length + 1}`
      current = { label, nodes: [node] }
      sections.push(current)
    } else if (current) {
      current.nodes.push(node)
    } else {
      preHeading.push(node)
    }
  }

  if (preHeading.length > 0) {
    sections.push({ label: 'Overview', nodes: preHeading })
  }

  if (sections.length === 0) return []

  inner.setAttribute('data-course-sections-built', 'true')
  inner.innerHTML = ''

  const items: TocItem[] = []

  sections.forEach((sec, tabIndex) => {
    const wrapper = document.createElement('div')
    wrapper.className = SECTION_CLASS
    wrapper.setAttribute(DATA_TAB_INDEX, String(tabIndex))
    if (tabIndex === 0) wrapper.classList.add(SECTION_ACTIVE_CLASS)

    sec.nodes.forEach((n) => wrapper.appendChild(n))

    const children: TocChild[] = []
    type Candidate = {
      el: HTMLElement
      label: string
      href?: string
      hideContentUnderEmbed?: boolean
    }
    const candidates: Candidate[] = []

    const subHeadings = wrapper.querySelectorAll<HTMLElement>(
      '.notion-h2, .notion-h3, h2[class*="notion"], h3[class*="notion"]'
    )
    subHeadings.forEach((el) => {
      const text = (el.querySelector('.notion-h-title') || el).textContent?.trim() || el.textContent?.trim()
      if (text) candidates.push({ el, label: text })
    })

    const linkEls = wrapper.querySelectorAll<HTMLElement>(
      'a.notion-link, a.notion-page-link, .notion-text a.notion-link, .notion-text a.notion-page-link'
    )
    linkEls.forEach((el) => {
      if (el.closest(`[${DATA_TOC_ID}]`)) return
      const text = el.textContent?.trim()
      if (!text) return
      const standaloneLinkOnly = isStandaloneLinkOnly(el)
      candidates.push({
        el,
        label: text,
        href: standaloneLinkOnly ? el.getAttribute('href') || undefined : undefined,
        hideContentUnderEmbed: standaloneLinkOnly
      })
    })

    candidates.sort((a, b) => {
      const pos = a.el.compareDocumentPosition(b.el)
      if (pos & Node.DOCUMENT_POSITION_FOLLOWING) return -1
      if (pos & Node.DOCUMENT_POSITION_PRECEDING) return 1
      return 0
    })

    const seen = new Set<string>()
    const sectionLabelNorm = sec.label.trim().toLowerCase()
    candidates.forEach((c, j) => {
      const labelNorm = c.label.trim().toLowerCase()
      if (seen.has(labelNorm)) return
      if (labelNorm === sectionLabelNorm) return
      seen.add(labelNorm)
      const id = `toc-${tabIndex}-${j}`
      c.el.setAttribute(DATA_TOC_ID, id)
      children.push({
        id,
        label: c.label,
        href: c.href,
        hideContentUnderEmbed: c.hideContentUnderEmbed
      })
    })

    items.push({
      tabIndex,
      label: sec.label,
      children: children.length > 0 ? children : undefined
    })

    inner.appendChild(wrapper)
  })

  return items
}
