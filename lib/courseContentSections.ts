/**
 * Build course content sections from the Notion doc: each heading starts a new tab,
 * and we group content until the next heading or the end of the doc (no more notion
 * blocks/text). h3 (and h1/h2) start top-level tabs; h4 headings become sub-tabs
 * under the current section. Drives the stylized Table of Contents and section visibility.
 */

const HEADING_SELECTOR =
  'h1[class*="notion"], h2[class*="notion"], h3[class*="notion"]'

/** h4 starts a sub-section (sub-tab) under the current top-level section */
const H4_SELECTOR = 'h4[class*="notion"], .notion-h4'

const DATA_TAB_INDEX = 'data-tab-index'
const DATA_TOC_ID = 'data-toc-id'
export const SECTION_CLASS = 'course-content-section'
export const SECTION_ACTIVE_CLASS = 'content-section-active'
/** Wrapper for content before first h4 (shown when tab selected, no sub-tab) */
export const MAIN_CONTENT_CLASS = 'course-content-main'
/** Wrapper for h4 sub-section content (sub-tab) */
export const SUBSECTION_CLASS = 'course-content-subsection'

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

function isH4(el: Element): boolean {
  return el.matches(H4_SELECTOR)
}

function getHeadingText(node: HTMLElement): string {
  return (
    (node.querySelector('.notion-h-title') || node).textContent?.trim() ||
    node.textContent?.trim() ||
    ''
  )
}

function normalizeText(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

/**
 * True when this row is essentially "one big link" with no other visible text.
 * We only auto-embed those rows; mixed text+link rows remain regular content.
 */
function isStandaloneLinkOnly(linkEl: HTMLElement): boolean {
  const block = linkEl.closest(
    '.notion-text, .notion-callout-text'
  ) as HTMLElement | null
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
  const inner = container.querySelector(
    '.notion-page-content-inner'
  ) as HTMLElement
  if (inner) return inner
  const first = container.firstElementChild as HTMLElement
  return first &&
    (first.classList.contains('notion-page-content-inner') ||
      first.children.length > 0)
    ? first
    : null
}

/**
 * Build sections from headings: wrap content under each heading until next heading or end of doc.
 * Returns TOC items and mutates the DOM (wraps nodes in section divs).
 */
export function buildSectionsFromHeadings(
  container: HTMLElement | null
): TocItem[] {
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
      const label =
        (node.querySelector('.notion-h-title') || node).textContent?.trim() ||
        node.textContent?.trim() ||
        `Section ${sections.length + 1}`
      if (preHeading.length > 0) {
        current = { label, nodes: [...preHeading, node] }
        preHeading = []
      } else {
        current = { label, nodes: [node] }
      }
      sections.push(current)
    } else if (current) {
      current.nodes.push(node)
    } else {
      preHeading.push(node)
    }
  }

  /* No synthetic "Overview" section: content before first heading is folded into the first section. */

  if (sections.length === 0) return []

  inner.setAttribute('data-course-sections-built', 'true')
  inner.innerHTML = ''

  const items: TocItem[] = []

  sections.forEach((sec, tabIndex) => {
    const wrapper = document.createElement('div')
    wrapper.className = SECTION_CLASS
    wrapper.setAttribute(DATA_TAB_INDEX, String(tabIndex))
    if (tabIndex === 0) wrapper.classList.add(SECTION_ACTIVE_CLASS)

    const nodes = sec.nodes as HTMLElement[]

    // Split section content by h4: content before first h4 = main; each h4 + following nodes = sub-section
    const mainNodes: HTMLElement[] = []
    const subSections: { label: string; nodes: HTMLElement[] }[] = []
    let i = 0
    while (i < nodes.length && !isH4(nodes[i])) {
      mainNodes.push(nodes[i])
      i++
    }
    while (i < nodes.length) {
      if (!isH4(nodes[i])) {
        i++
        continue
      }
      const h4El = nodes[i]
      const label = getHeadingText(h4El)
      i++
      const subNodes: HTMLElement[] = [h4El]
      while (i < nodes.length && !isH4(nodes[i])) {
        subNodes.push(nodes[i])
        i++
      }
      subSections.push({
        label: label || `Section ${subSections.length + 1}`,
        nodes: subNodes
      })
    }

    const children: TocChild[] = []

    if (subSections.length > 0) {
      // Build wrapper: main content in a div (shown when tab only), then each h4 block in a div with data-toc-id (sub-tab)
      const mainWrapper = document.createElement('div')
      mainWrapper.className = MAIN_CONTENT_CLASS
      mainWrapper.setAttribute(DATA_TOC_ID, `toc-${tabIndex}-main`)
      mainNodes.forEach((n) => mainWrapper.appendChild(n))
      wrapper.appendChild(mainWrapper)
      subSections.forEach((sub, j) => {
        const id = `toc-${tabIndex}-sub-${j}`
        const subWrapper = document.createElement('div')
        subWrapper.className = SUBSECTION_CLASS
        subWrapper.setAttribute(DATA_TOC_ID, id)
        sub.nodes.forEach((n) => subWrapper.appendChild(n))
        wrapper.appendChild(subWrapper)
        children.push({ id, label: sub.label })
      })
    } else {
      // No h4s: keep previous behavior — all nodes in wrapper, children from h2/h3 and links
      nodes.forEach((n) => wrapper.appendChild(n))

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
        const text = getHeadingText(el)
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
          href: standaloneLinkOnly
            ? el.getAttribute('href') || undefined
            : undefined,
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
    }

    items.push({
      tabIndex,
      label: sec.label,
      children: children.length > 0 ? children : undefined
    })

    inner.appendChild(wrapper)
  })

  return items
}
