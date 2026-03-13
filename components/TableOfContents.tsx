import React from 'react'
import { AnimatePresence, motion } from 'framer-motion'

import type { SectionProgressStatus } from '@/lib/course-section-progress'
import {
  MAIN_CONTENT_CLASS,
  SECTION_ACTIVE_CLASS,
  SECTION_CLASS,
  SUBSECTION_CLASS,
  type TocChild,
  type TocItem
} from '@/lib/courseContentSections'

import styles from './TableOfContents.module.css'

const DATA_TAB_INDEX = 'data-tab-index'

const HEADING_HIGHLIGHT_CLASS = 'content-heading-highlight'
const HEADING_SELECTOR =
  'h1[class*="notion"], h2[class*="notion"], h3[class*="notion"]'
const H4_SELECTOR = 'h4[class*="notion"], .notion-h4'

function applyHeadingHighlight(root: Element, target: HTMLElement | null) {
  if (!target) return
  root.querySelectorAll(`.${HEADING_HIGHLIGHT_CLASS}`).forEach((el) => {
    el.classList.remove(HEADING_HIGHLIGHT_CLASS)
  })
  target.classList.add(HEADING_HIGHLIGHT_CLASS)
}

const DATA_CONTENT_VISIBLE = 'data-content-visible'

/** When activeSubtabId is null: show all content under the tab (main + all h4 blocks).
 *  When activeSubtabId is set: show only that subsection (one h4 block). */
function showOnlyContentBlock(
  root: Element,
  tabIndex: number,
  activeSubtabId: string | null
) {
  const section = root.querySelector(
    `.${SECTION_CLASS}[${DATA_TAB_INDEX}="${tabIndex}"]`
  ) as HTMLElement | null
  if (!section) return
  const main = section.querySelector(`.${MAIN_CONTENT_CLASS}`) as
    | HTMLElement
    | null
  const subsections = section.querySelectorAll<HTMLElement>(
    `.${SUBSECTION_CLASS}`
  )
  if (!main && subsections.length === 0) return
  main?.removeAttribute(DATA_CONTENT_VISIBLE)
  subsections.forEach((el) => el.removeAttribute(DATA_CONTENT_VISIBLE))
  if (main) main.style.display = activeSubtabId === null ? 'block' : 'none'
  subsections.forEach((el) => {
    el.style.display =
      activeSubtabId === null ||
      el.getAttribute('data-toc-id') === activeSubtabId
        ? 'block'
        : 'none'
  })
  if (activeSubtabId === null && main) main.setAttribute(DATA_CONTENT_VISIBLE, 'true')
  else
    subsections.forEach((el) => {
      if (el.getAttribute('data-toc-id') === activeSubtabId)
        el.setAttribute(DATA_CONTENT_VISIBLE, 'true')
    })
}

function Icon({ type }: { type: 'pdf' | 'lock' | 'check' | 'bookmark' }) {
  if (type === 'pdf') {
    return (
      <span className={styles.itemIcon} aria-hidden>
        <svg
          width='14'
          height='14'
          viewBox='0 0 24 24'
          fill='none'
          stroke='#dc2626'
          strokeWidth='2'
        >
          <path d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' />
          <polyline points='14 2 14 8 20 8' />
          <path d='M8 13h2M8 17h2M14 13h2M14 17h2' />
        </svg>
      </span>
    )
  }
  if (type === 'lock') {
    return (
      <span className={styles.itemIcon} aria-hidden>
        <svg
          width='14'
          height='14'
          viewBox='0 0 24 24'
          fill='none'
          stroke='#6b7280'
          strokeWidth='2'
        >
          <rect x='3' y='11' width='18' height='11' rx='2' ry='2' />
          <path d='M7 11V7a5 5 0 0 1 10 0v4' />
        </svg>
      </span>
    )
  }
  if (type === 'check') {
    return (
      <span className={styles.itemIconCheck} aria-hidden>
        <svg
          xmlns='http://www.w3.org/2000/svg'
          width='12'
          height='12'
          viewBox='0 0 12 12'
          fill='none'
        >
          <path
            d='M4.87499 8.99999C4.77559 8.99864 4.68029 8.96018 4.6078 8.89217L1.9828 6.26717C1.923 6.19431 1.89244 6.10181 1.89706 6.00767C1.90169 5.91352 1.94116 5.82447 2.00781 5.75781C2.07447 5.69116 2.16352 5.65169 2.25767 5.64706C2.35181 5.64244 2.44431 5.673 2.51717 5.7328L4.87499 8.0953L9.8578 3.1078C9.93066 3.048 10.0232 3.01744 10.1173 3.02206C10.2114 3.02669 10.3005 3.06616 10.3672 3.13281C10.4338 3.19947 10.4733 3.28852 10.4779 3.38267C10.4825 3.47681 10.452 3.56931 10.3922 3.64217L5.14217 8.89217C5.06968 8.96018 4.97438 8.99864 4.87499 8.99999Z'
            fill='#337A5D'
          />
        </svg>
      </span>
    )
  }
  if (type === 'bookmark') {
    return (
      <span className={styles.itemIconBookmark} aria-hidden>
        <svg
          xmlns='http://www.w3.org/2000/svg'
          width='12'
          height='12'
          viewBox='0 0 24 24'
          fill='none'
        >
          {/* Filled bookmark #0089C4 — matches bookmarked button ref */}
          <path
            d='M6 2h12a2 2 0 0 1 2 2v18l-8-4-8 4V4a2 2 0 0 1 2-2z'
            fill='#0089C4'
          />
        </svg>
      </span>
    )
  }
  return null
}

export type { TocChild, TocItem }

export interface TableOfContentsRef {
  goToNextSection: () => void
  goToPreviousSection: () => void
  /** Open the tab (and optional subtab) that matches the given section label. */
  goToSectionByLabel: (label: string) => void
}

export interface TableOfContentsProps {
  /** Ref to the content slot (contains section wrappers with .course-content-section). */
  contentRef?: React.RefObject<HTMLDivElement | null>
  /** TOC entries (tabs + subtabs) from the heading-based section builder. */
  items?: TocItem[]
  /** When a TOC link is clicked: (href, label?). storage.googleapis URLs load in PDF viewer; others open in new tab. */
  onLinkClick?: (href: string, label?: string, hideContent?: boolean) => void
  /** Called when the selected item has no PDF link (e.g. parent tab or subtab without href). Hide the PDF viewer. */
  onSelectionClearPdf?: () => void
  /** Called with the label of the item that was clicked (parent tab or subtab), and optional parent tab label when a subtab is selected. */
  onSelectedItemChange?: (label: string | null, parentLabel?: string | null) => void
  /** Called when the active section changes: (parentIndex, parentTotal, childIndex?, childTotal?, isOnChildTab?). */
  onSectionChange?: (
    parentIndex: number,
    parentTotal: number,
    childIndex?: number,
    childTotal?: number,
    isOnChildTab?: boolean
  ) => void
  title?: string
  /** Optional per-section status (completion / bookmark) keyed by section label. */
  sectionProgress?: Record<string, SectionProgressStatus>
}

export const TableOfContents = React.forwardRef<
  TableOfContentsRef,
  TableOfContentsProps
>(function TableOfContents(
  {
    contentRef,
    items: itemsProp = [],
    onLinkClick,
    onSelectionClearPdf,
    onSelectedItemChange,
    onSectionChange,
    title = 'Table of Contents',
    sectionProgress
  },
  ref
) {
  const [search, setSearch] = React.useState('')
  const [activeTabIndex, setActiveTabIndex] = React.useState(0)
  const [activeSubtabId, setActiveSubtabId] = React.useState<string | null>(
    null
  )
  const [expandedTabIndexes, setExpandedTabIndexes] = React.useState<
    Set<number>
  >(() => new Set())
  const hasInitializedFirstSubtab = React.useRef(false)
  const hasInitializedExpanded = React.useRef(false)

  const items = itemsProp.map((item) => ({
    ...item,
    active: item.tabIndex === activeTabIndex
  }))
  type TocItemWithActive = TocItem & { active: boolean }

  const filteredItems = React.useMemo(() => {
    if (!search.trim()) return items
    const q = search.trim().toLowerCase()
    return items
      .map((item) => {
        const labelMatch = item.label.toLowerCase().includes(q)
        const childMatches =
          item.children?.filter((c) => c.label.toLowerCase().includes(q)) ?? []
        if (labelMatch) return item
        if (childMatches.length) return { ...item, children: childMatches }
        return null
      })
      .filter((x): x is TocItemWithActive => x !== null)
  }, [items, search])

  React.useEffect(() => {
    const container = contentRef?.current
    if (!container || itemsProp.length === 0) return
    const root = container.closest('.course-content-mount') || container
    showOnlyContentBlock(root, activeTabIndex, activeSubtabId)
    if (activeSubtabId != null) {
      const subsection = root.querySelector(
        `[data-toc-id="${activeSubtabId}"]`
      ) as HTMLElement | null
      const heading = subsection?.querySelector(H4_SELECTOR) as HTMLElement | null
      applyHeadingHighlight(root, heading ?? subsection)
    }
  }, [itemsProp.length, activeTabIndex, activeSubtabId, contentRef])

  React.useEffect(() => {
    if (itemsProp.length === 0) return
    const parentIndex = activeTabIndex + 1
    const parentTotal = itemsProp.length
    const item = itemsProp[activeTabIndex]
    const children = item?.children ?? []
    let childIndex: number | undefined
    let childTotal: number | undefined
    const isOnChildTab = children.length > 0 && activeSubtabId != null
    if (children.length > 0) {
      childTotal = children.length
      if (activeSubtabId != null) {
        const j = children.findIndex((c) => c.id === activeSubtabId)
        childIndex = j >= 0 ? j + 1 : 1
      } else {
        childIndex = 1
      }
    }
    onSectionChange?.(parentIndex, parentTotal, childIndex, childTotal, isOnChildTab)
  }, [activeTabIndex, activeSubtabId, itemsProp, onSectionChange])

  React.useEffect(() => {
    if (itemsProp.length === 0 || hasInitializedExpanded.current) return
    hasInitializedExpanded.current = true
    setExpandedTabIndexes((prev) => {
      const next = new Set(prev)
      next.add(0)
      if (itemsProp.length >= 2) next.add(1)
      return next
    })
  }, [itemsProp.length])

  const PREFERRED_FIRST_SUB_LABELS = [
    'course overview',
    'course syllabus',
    'syllabus'
  ]
  React.useLayoutEffect(() => {
    if (
      itemsProp.length === 0 ||
      hasInitializedFirstSubtab.current ||
      !itemsProp[0]?.children?.length
    )
      return
    const first = itemsProp[0]
    const children = first.children!.filter((c) => c.id)
    if (children.length === 0) return
    const preferred = children.find((c) =>
      PREFERRED_FIRST_SUB_LABELS.includes(c.label.trim().toLowerCase())
    )
    const targetChild = preferred ?? children[0]
    const subId = targetChild.id ?? null
    if (!subId) return
    hasInitializedFirstSubtab.current = true
    setActiveSubtabId(subId)
    onSelectedItemChange?.(targetChild.label, first.label)
    const container = contentRef?.current
    if (container) {
      const root = container.closest('.course-content-mount') || container
      if (subId.includes('-sub-')) {
        showOnlyContentBlock(root, 0, subId)
        const subsection = root.querySelector(
          `[data-toc-id="${subId}"]`
        ) as HTMLElement | null
        const heading = subsection?.querySelector(H4_SELECTOR) as HTMLElement | null
        applyHeadingHighlight(root, heading ?? subsection)
      }
    }
  }, [itemsProp, onSelectedItemChange, contentRef])

  const handleTabClick = (tabIndex: number) => {
    setActiveTabIndex(tabIndex)
    setActiveSubtabId(null)
    onSelectionClearPdf?.()
    onSelectedItemChange?.(itemsProp[tabIndex]?.label ?? null, null)
    const container = contentRef?.current ?? null
    if (!container) return
    const root = container.closest('.course-content-mount') || container
    root.querySelectorAll(`.${SECTION_CLASS}`).forEach((section) => {
      const el = section as HTMLElement
      const idx = el.getAttribute(DATA_TAB_INDEX)
      if (idx === String(tabIndex)) {
        el.classList.add(SECTION_ACTIVE_CLASS)
        const heading = el.querySelector(HEADING_SELECTOR) as HTMLElement | null
        applyHeadingHighlight(root, heading)
      } else {
        el.classList.remove(SECTION_ACTIVE_CLASS)
      }
    })
    showOnlyContentBlock(root, tabIndex, null)
  }

  const handleItemClick = (item: TocItem) => {
    handleTabClick(item.tabIndex)
    if (!item.children || item.children.length === 0) return
    setExpandedTabIndexes((prev) => {
      const next = new Set(prev)
      if (next.has(item.tabIndex)) next.delete(item.tabIndex)
      else next.add(item.tabIndex)
      return next
    })
  }

  const handleSubtabClick = (tabIndex: number, child: TocChild) => {
    if (tabIndex !== activeTabIndex) {
      handleTabClick(tabIndex)
    }
    setExpandedTabIndexes((prev) => {
      const next = new Set(prev)
      next.add(tabIndex)
      return next
    })
    setActiveSubtabId(child.id ?? null)
    onSelectedItemChange?.(
      child.label ?? null,
      itemsProp[tabIndex]?.label ?? null
    )
    if (child.href) {
      if (onLinkClick) {
        onLinkClick(child.href, child.label, child.hideContentUnderEmbed)
      } else {
        window.open(child.href, '_blank', 'noopener,noreferrer')
      }
      return
    }
    onSelectionClearPdf?.()
    if (contentRef?.current) {
      const root =
        contentRef.current.closest('.course-content-mount') ||
        contentRef.current
      showOnlyContentBlock(root, tabIndex, child.id ?? null)
      if (child.id) {
        const subsection = root.querySelector(
          `[data-toc-id="${child.id}"]`
        ) as HTMLElement | null
        const heading = subsection?.querySelector(H4_SELECTOR) as
          | HTMLElement
          | null
        applyHeadingHighlight(root, heading ?? subsection)
      }
    }
  }

  const handleGoToNextSection = React.useCallback(() => {
    if (itemsProp.length === 0) return
    const getFirstChild = (tabIndex: number) => {
      const item = itemsProp[tabIndex]
      const children = item?.children ?? []
      return children.find((c) => Boolean(c.id)) ?? children[0] ?? null
    }

    const item = itemsProp[activeTabIndex]
    const children = item?.children ?? []

    // If this tab has children and we're currently viewing the parent,
    // Next should take us into the first child.
    if (children.length > 0 && activeSubtabId == null) {
      const first = getFirstChild(activeTabIndex)
      if (first) {
        handleSubtabClick(activeTabIndex, first)
        return
      }
    }

    // If we're inside a child tab, advance to the next child; if we're at the end,
    // jump to the next parent tab's first child.
    if (children.length > 0 && activeSubtabId != null) {
      const j = children.findIndex((c) => c.id === activeSubtabId)
      if (j >= 0 && j < children.length - 1) {
        handleSubtabClick(activeTabIndex, children[j + 1])
        return
      }
      if (j === children.length - 1 && activeTabIndex < itemsProp.length - 1) {
        const nextTabIndex = activeTabIndex + 1
        const nextFirst = getFirstChild(nextTabIndex)
        if (nextFirst) {
          handleSubtabClick(nextTabIndex, nextFirst)
          return
        }
        handleTabClick(nextTabIndex)
        return
      }
    }

    // No children (or unknown activeSubtabId): advance to next parent tab.
    if (activeTabIndex < itemsProp.length - 1) {
      const nextTabIndex = activeTabIndex + 1
      const nextFirst = getFirstChild(nextTabIndex)
      if (nextFirst) {
        handleSubtabClick(nextTabIndex, nextFirst)
        return
      }
      handleTabClick(nextTabIndex)
    }
  }, [
    itemsProp,
    activeTabIndex,
    activeSubtabId,
    handleTabClick,
    handleSubtabClick
  ])

  const handleGoToPreviousSection = React.useCallback(() => {
    if (itemsProp.length === 0) return
    const item = itemsProp[activeTabIndex]
    const children = item?.children ?? []
    if (children.length > 0 && activeSubtabId != null) {
      const j = children.findIndex((c) => c.id === activeSubtabId)
      if (j > 0) {
        handleSubtabClick(activeTabIndex, children[j - 1])
        return
      }
    }
    if (activeTabIndex > 0) {
      handleTabClick(activeTabIndex - 1)
    }
  }, [
    itemsProp,
    activeTabIndex,
    activeSubtabId,
    handleTabClick,
    handleSubtabClick
  ])

  const handleGoToSectionByLabel = React.useCallback(
    (label: string) => {
      if (!label || itemsProp.length === 0) return
      const trimmed = label.trim()
      const parentIndex = itemsProp.findIndex((item) => item.label === trimmed)
      if (parentIndex >= 0) {
        handleTabClick(parentIndex)
        return
      }
      for (let i = 0; i < itemsProp.length; i++) {
        const item = itemsProp[i]
        const children = item?.children ?? []
        const child = children.find((c) => c.label === trimmed)
        if (child) {
          handleTabClick(i)
          handleSubtabClick(i, child)
          return
        }
      }
    },
    [itemsProp, handleTabClick, handleSubtabClick]
  )

  React.useImperativeHandle(
    ref,
    () => ({
      goToNextSection: handleGoToNextSection,
      goToPreviousSection: handleGoToPreviousSection,
      goToSectionByLabel: handleGoToSectionByLabel
    }),
    [
      handleGoToNextSection,
      handleGoToPreviousSection,
      handleGoToSectionByLabel
    ]
  )

  return (
    <nav className={styles.root} aria-label='Course table of contents'>
      <h2 className={styles.heading}>{title}</h2>
      <div className={styles.searchWrap}>
        <input
          type='search'
          className={styles.search}
          placeholder='SEARCH'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label='Search in table of contents'
        />
      </div>
      <ul className={styles.list}>
        {filteredItems.length === 0 && (
          <li className={styles.emptyState}>Loading sections…</li>
        )}
        {filteredItems.map((item) => {
          const status = sectionProgress?.[item.label]
          const itemCompleted = status?.isCompleted
          const itemBookmarked = status?.isBookmarked
          const itemIcon = (
            item as TocItem & { icon?: 'pdf' | 'lock' | 'check' | 'bookmark' }
          ).icon
          const showChildren =
            Boolean(item.children && item.children.length > 0) &&
            (search.trim() || expandedTabIndexes.has(item.tabIndex))
          return (
            <li key={item.tabIndex}>
              <div
                className={
                  item.active
                    ? `${styles.item} ${styles.itemActive}`
                    : styles.item
                }
                role='button'
                tabIndex={0}
                onClick={() => handleItemClick(item)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleItemClick(item)
                  }
                }}
              >
                {itemIcon && <Icon type={itemIcon} />}
                <span className={styles.itemLabel}>{item.label}</span>
                <span className={styles.itemStatusIcon}>
                  {itemCompleted && <Icon type='check' />}
                  {!itemCompleted && itemBookmarked && <Icon type='bookmark' />}
                </span>
                {item.children && item.children.length > 0 && (
                  <span className={styles.itemToggle} aria-hidden>
                    {search.trim()
                      ? '▾'
                      : expandedTabIndexes.has(item.tabIndex)
                      ? '▾'
                      : '▸'}
                  </span>
                )}
              </div>
              <AnimatePresence initial={false}>
                {showChildren && (
                  <motion.ul
                    key={`toc-children-${item.tabIndex}`}
                    className={styles.itemChildren}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    style={{ overflow: 'hidden' }}
                  >
                    {item.children!.map((child, j) => {
                      const childStatus = sectionProgress?.[child.label ?? '']
                      const childCompleted = childStatus?.isCompleted
                      const childBookmarked = childStatus?.isBookmarked
                      return (
                        <li key={child.id ?? j}>
                          <div
                            className={
                              child.id === activeSubtabId
                                ? `${styles.childItem} ${styles.childItemActive}`
                                : styles.childItem
                            }
                            role='button'
                            tabIndex={0}
                            onClick={() =>
                              handleSubtabClick(item.tabIndex, child)
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault()
                                handleSubtabClick(item.tabIndex, child)
                              }
                            }}
                          >
                            <span>{child.label}</span>
                            <span className={styles.childStatusIcon}>
                              {childCompleted && <Icon type='check' />}
                              {!childCompleted && childBookmarked && (
                                <Icon type='bookmark' />
                              )}
                            </span>
                          </div>
                        </li>
                      )
                    })}
                  </motion.ul>
                )}
              </AnimatePresence>
            </li>
          )
        })}
      </ul>
    </nav>
  )
})
