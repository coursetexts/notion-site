import React from 'react'
import {
  SECTION_ACTIVE_CLASS,
  SECTION_CLASS,
  type TocChild,
  type TocItem
} from '@/lib/courseContentSections'
import styles from './TableOfContents.module.css'

const DATA_TAB_INDEX = 'data-tab-index'

function Icon({ type }: { type: 'pdf' | 'lock' | 'check' }) {
  if (type === 'pdf') {
    return (
      <span className={styles.itemIcon} aria-hidden>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <path d="M8 13h2M8 17h2M14 13h2M14 17h2" />
        </svg>
      </span>
    )
  }
  if (type === 'lock') {
    return (
      <span className={styles.itemIcon} aria-hidden>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      </span>
    )
  }
  if (type === 'check') {
    return (
      <span className={styles.itemIcon} aria-hidden>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </span>
    )
  }
  return null
}

export type { TocChild, TocItem }

export interface TableOfContentsProps {
  /** Ref to the content slot (contains section wrappers with .course-content-section). */
  contentRef?: React.RefObject<HTMLDivElement | null>
  /** TOC entries (tabs + subtabs) from the heading-based section builder. */
  items?: TocItem[]
  /** When a TOC link is clicked: (href, label?). storage.googleapis URLs load in PDF viewer; others open in new tab. */
  onLinkClick?: (href: string, label?: string) => void
  /** Called when the selected item has no PDF link (e.g. parent tab or subtab without href). Hide the PDF viewer. */
  onSelectionClearPdf?: () => void
  /** Called with the label of the item that was clicked (parent tab or subtab). Use for the big title above content. */
  onSelectedItemChange?: (label: string | null) => void
  title?: string
}

export const TableOfContents: React.FC<TableOfContentsProps> = ({
  contentRef,
  items: itemsProp = [],
  onLinkClick,
  onSelectionClearPdf,
  onSelectedItemChange,
  title = 'Table of Contents'
}) => {
  const [search, setSearch] = React.useState('')
  const [activeTabIndex, setActiveTabIndex] = React.useState(0)
  const [activeSubtabId, setActiveSubtabId] = React.useState<string | null>(null)

  const items = itemsProp.map((item) => ({
    ...item,
    active: item.tabIndex === activeTabIndex
  }))

  const filteredItems = React.useMemo(() => {
    if (!search.trim()) return items
    const q = search.trim().toLowerCase()
    return items
      .map((item) => {
        const labelMatch = item.label.toLowerCase().includes(q)
        const childMatches = item.children?.filter((c) => c.label.toLowerCase().includes(q)) ?? []
        if (labelMatch) return item
        if (childMatches.length) return { ...item, children: childMatches }
        return null
      })
      .filter((x): x is TocItem => x !== null)
  }, [items, search])

  const handleTabClick = (tabIndex: number) => {
    setActiveTabIndex(tabIndex)
    setActiveSubtabId(null)
    onSelectionClearPdf?.()
    onSelectedItemChange?.(itemsProp[tabIndex]?.label ?? null)
    const container = contentRef?.current ?? null
    if (!container) return
    const root = container.closest('.course-content-mount') || container
    root.querySelectorAll(`.${SECTION_CLASS}`).forEach((section) => {
      const el = section as HTMLElement
      const idx = el.getAttribute(DATA_TAB_INDEX)
      if (idx === String(tabIndex)) {
        el.classList.add(SECTION_ACTIVE_CLASS)
      } else {
        el.classList.remove(SECTION_ACTIVE_CLASS)
      }
    })
  }

  const handleSubtabClick = (tabIndex: number, child: TocChild) => {
    if (tabIndex !== activeTabIndex) {
      handleTabClick(tabIndex)
    }
    setActiveSubtabId(child.id ?? null)
    onSelectedItemChange?.(child.label ?? null)
    if (child.href) {
      if (onLinkClick) {
        onLinkClick(child.href, child.label)
      } else {
        window.open(child.href, '_blank', 'noopener,noreferrer')
      }
      return
    }
    onSelectionClearPdf?.()
    if (child.id && contentRef?.current) {
      const root = contentRef.current.closest('.course-content-mount') || contentRef.current
      const el = root.querySelector(`[data-toc-id="${child.id}"]`)
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <nav className={styles.root} aria-label="Course table of contents">
      <h2 className={styles.heading}>{title}</h2>
      <div className={styles.searchWrap}>
        <input
          type="search"
          className={styles.search}
          placeholder="SEARCH"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search in table of contents"
        />
      </div>
      <ul className={styles.list}>
        {filteredItems.length === 0 && (
          <li className={styles.emptyState}>Loading sections…</li>
        )}
        {filteredItems.map((item) => (
          <li key={item.tabIndex}>
            <div
              className={item.active ? `${styles.item} ${styles.itemActive}` : styles.item}
              role="button"
              tabIndex={0}
              onClick={() => handleTabClick(item.tabIndex)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleTabClick(item.tabIndex)
                }
              }}
            >
              {item.icon && <Icon type={item.icon} />}
              <span>{item.label}</span>
            </div>
            {item.children && item.children.length > 0 && (
              <ul className={styles.itemChildren}>
                {item.children.map((child, j) => (
                  <li key={child.id ?? j}>
                    <div
                      className={
                        child.id === activeSubtabId
                          ? `${styles.childItem} ${styles.childItemActive}`
                          : styles.childItem
                      }
                      role="button"
                      tabIndex={0}
                      onClick={() => handleSubtabClick(item.tabIndex, child)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          handleSubtabClick(item.tabIndex, child)
                        }
                      }}
                    >
                      – {child.label}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </nav>
  )
}
