import React from 'react'

import { AnimatePresence, motion } from 'framer-motion'

import { getAnnotations, getOrCreateCourse } from '@/lib/course-activity-db'
import {
  type SectionProgressStatus,
  getSectionProgressMap,
  updateSectionProgress
} from '@/lib/course-section-progress'
import {
  type TocItem,
  buildSectionsFromHeadings
} from '@/lib/courseContentSections'

import { AnnotationWidget } from './AnnotationWidget'
import { ContentMain } from './ContentMain'
import { CourseActivity } from './CourseActivity'
import { CourseChatPanel } from './CourseChatPanel'
import styles from './CourseContent.module.css'
import { TableOfContents } from './TableOfContents'

export interface CourseContentProps {
  /** Optional ref for the main content container so existing DOM can be moved into it */
  mainRef?: React.Ref<HTMLDivElement>
  children?: React.ReactNode
  /** Course identity for activity (comments, bookmarks, annotations) */
  coursePageId?: string
  courseTitle?: string
  courseDescription?: string
  courseUrl?: string
}

export const CourseContent: React.FC<CourseContentProps> = ({
  mainRef,
  children,
  coursePageId,
  courseTitle,
  courseDescription,
  courseUrl
}) => {
  const [rightPanel, setRightPanel] = React.useState<
    'none' | 'annotations' | 'chat'
  >('none')
  const [isRightPanelExiting, setIsRightPanelExiting] = React.useState(false)
  const [contentSlotReady, setContentSlotReady] = React.useState(false)
  const [tocItems, setTocItems] = React.useState<TocItem[]>([])
  const [embedUrl, setEmbedUrl] = React.useState<string | undefined>(undefined)
  const [embedTitle, setEmbedTitle] = React.useState<string | undefined>(
    undefined
  )
  const [embedParentTitle, setEmbedParentTitle] = React.useState<
    string | undefined
  >(undefined)
  const [hideContentUnderEmbed, setHideContentUnderEmbed] =
    React.useState(false)
  const contentSlotRef = React.useRef<HTMLDivElement | null>(null)
  const tocRef = React.useRef<{
    goToNextSection: () => void
    goToPreviousSection: () => void
    goToSectionByLabel: (label: string) => void
  } | null>(null)
  const [sectionIndex, setSectionIndex] = React.useState(1)
  const [sectionTotal, setSectionTotal] = React.useState(0)
  const [childSectionIndex, setChildSectionIndex] = React.useState<number>(1)
  const [childSectionTotal, setChildSectionTotal] = React.useState(0)
  const [isOnChildTab, setIsOnChildTab] = React.useState(false)
  const [sectionProgress, setSectionProgress] = React.useState<
    Record<string, SectionProgressStatus>
  >({})
  const [annotationCount, setAnnotationCount] = React.useState(0)
  const [activityRefreshNonce, setActivityRefreshNonce] = React.useState(0)

  const bumpActivityRefresh = React.useCallback(() => {
    setActivityRefreshNonce((n) => n + 1)
  }, [])

  const handleTocLink = React.useCallback(
    (href: string, _label?: string, hideContent?: boolean) => {
      const isHttp = /^https?:\/\//i.test(href)
      if (isHttp) {
        setEmbedUrl(href)
        setHideContentUnderEmbed(Boolean(hideContent))
      } else {
        setEmbedUrl(undefined)
        setHideContentUnderEmbed(false)
        window.open(href, '_blank', 'noopener,noreferrer')
      }
    },
    []
  )

  const handleSelectionClearPdf = React.useCallback(() => {
    setEmbedUrl(undefined)
    setHideContentUnderEmbed(false)
  }, [])

  const handleSelectedItemChange = React.useCallback(
    (label: string | null, parentLabel?: string | null) => {
      setEmbedTitle(label ?? undefined)
      setEmbedParentTitle(parentLabel ?? undefined)
    },
    []
  )

  const setSlotRef = React.useCallback(
    (el: HTMLDivElement | null) => {
      contentSlotRef.current = el
      setContentSlotReady(!!el)
      if (typeof mainRef === 'function') mainRef(el)
      else if (mainRef && el)
        (mainRef as React.MutableRefObject<HTMLDivElement | null>).current = el
    },
    [mainRef]
  )

  React.useEffect(() => {
    if (!contentSlotReady || !contentSlotRef.current) return
    const container = contentSlotRef.current
    if (!container.firstElementChild) return
    const items = buildSectionsFromHeadings(container)
    if (items.length) setTocItems(items)
  }, [contentSlotReady])

  React.useEffect(() => {
    if (!contentSlotReady || tocItems.length > 0) return
    const timer = setTimeout(() => {
      const container = contentSlotRef.current
      if (container?.firstElementChild) {
        const items = buildSectionsFromHeadings(container)
        if (items.length) setTocItems(items)
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [contentSlotReady, tocItems.length])

  /**
   * Citation links with icons: mark then restructure into a 2-column layout
   * (icon col + text col) so wrapped lines never sit under the icon.
   */
  React.useEffect(() => {
    if (!contentSlotReady || !contentSlotRef.current) return
    const root =
      contentSlotRef.current.closest('.course-content-mount') ??
      contentSlotRef.current

    const ICON_SELECTOR =
      '.notion-page-icon-inline, .notion-page-icon-span, .notion-page-icon-image'

    /**
     * Lock icons are injected by NotionPage as the FIRST CHILD of .notion-text
     * (see lockSvg + insertBefore(notionTextParent.firstChild)) — not inside the link.
     * Wrap those paragraphs into the same 2-column layout.
     */
    const layoutLockIconParagraphs = () => {
      root.querySelectorAll<HTMLElement>('.notion-text').forEach((textEl) => {
        if (textEl.getAttribute('data-citation-row') === 'lock') return
        const first = textEl.firstElementChild
        if (!first || !first.classList.contains('lock-icon')) return
        if (textEl.querySelector('.notion-text-citation-row')) return

        const row = document.createElement('div')
        row.className = 'notion-text-citation-row'

        const iconCol = document.createElement('span')
        iconCol.className = 'citation-icon-col'
        iconCol.setAttribute('aria-hidden', 'true')

        const textCol = document.createElement('span')
        textCol.className = 'citation-text-col'

        iconCol.appendChild(first)
        while (textEl.firstChild) {
          if (textEl.firstChild === row) break
          textCol.appendChild(textEl.firstChild)
        }
        row.appendChild(iconCol)
        row.appendChild(textCol)
        textEl.appendChild(row)
        textEl.setAttribute('data-citation-row', 'lock')
      })
    }

    const markLinks = () => {
      root.querySelectorAll<HTMLAnchorElement>('a.notion-link').forEach((a) => {
        if (a.classList.contains('notion-link-citation')) return
        const hasIcon =
          a.querySelector(ICON_SELECTOR) ||
          (a.firstElementChild && a.firstElementChild.tagName === 'IMG')
        if (hasIcon) a.classList.add('notion-link-citation')
      })
    }

    /** Wrap icon + remaining content into two columns inside the link */
    const layoutCitationTwoColumn = () => {
      root
        .querySelectorAll<HTMLAnchorElement>('a.notion-link-citation')
        .forEach((a) => {
          if (a.getAttribute('data-citation-layout') === 'grid') return
          const iconEl =
            a.querySelector<HTMLElement>(ICON_SELECTOR) ||
            (a.firstElementChild?.tagName === 'IMG'
              ? (a.firstElementChild as HTMLElement)
              : null)
          if (!iconEl || !a.contains(iconEl)) return
          if (a.querySelector('.citation-icon-col')) return

          const iconCol = document.createElement('span')
          iconCol.className = 'citation-icon-col'
          iconCol.setAttribute('aria-hidden', 'true')

          const textCol = document.createElement('span')
          textCol.className = 'citation-text-col'

          iconCol.appendChild(iconEl)

          while (a.firstChild) {
            const node = a.firstChild
            if (node === iconCol || node === textCol) break
            textCol.appendChild(node)
          }

          a.appendChild(iconCol)
          a.appendChild(textCol)
          a.setAttribute('data-citation-layout', 'grid')
          a.classList.add('notion-link-citation-layout')
        })
    }

    markLinks()
    layoutCitationTwoColumn()
    layoutLockIconParagraphs()
    const t = window.setTimeout(() => {
      markLinks()
      layoutCitationTwoColumn()
      layoutLockIconParagraphs()
    }, 500)
    const t2 = window.setTimeout(layoutLockIconParagraphs, 1200)
    return () => {
      window.clearTimeout(t)
      window.clearTimeout(t2)
    }
  }, [contentSlotReady, tocItems.length, children])

  const PREFERRED_FIRST_SUB_LABELS = [
    'course overview',
    'course syllabus',
    'syllabus'
  ]
  React.useEffect(() => {
    if (tocItems.length === 0) return
    setEmbedTitle((prev) => {
      if (prev !== undefined) return prev
      const first = tocItems[0]
      const children = first?.children ?? []
      if (children.length === 0) return first?.label
      const preferred = children.find((c) =>
        PREFERRED_FIRST_SUB_LABELS.includes(c.label.trim().toLowerCase())
      )
      const target = preferred ?? children[0]
      return target.label
    })
    setEmbedParentTitle((prev) => {
      if (prev !== undefined) return prev
      const first = tocItems[0]
      if (!first?.children?.length) return undefined
      return first.label
    })
  }, [tocItems.length])

  const handleSectionChange = React.useCallback(
    (
      parentIndex: number,
      parentTotal: number,
      childIndex?: number,
      childTotal?: number,
      onChildTab?: boolean
    ) => {
      setSectionIndex(parentIndex)
      setSectionTotal(parentTotal)
      setChildSectionIndex(childIndex ?? 1)
      setChildSectionTotal(childTotal ?? 0)
      setIsOnChildTab(onChildTab ?? false)
    },
    []
  )

  const hasNextSection = React.useMemo(() => {
    if (tocItems.length === 0) return false
    const currentLabel = embedTitle ?? tocItems[0]?.label ?? ''
    const parentLabel = embedParentTitle
    if (parentLabel != null && parentLabel !== '') {
      const tabIndex = tocItems.findIndex((item) => item.label === parentLabel)
      if (tabIndex < 0) return tocItems.length > 1
      const item = tocItems[tabIndex]
      const children = item?.children ?? []
      const childIndex = children.findIndex((c) => c.label === currentLabel)
      if (childIndex >= 0 && childIndex < children.length - 1) return true
      return tabIndex < tocItems.length - 1
    }
    const tabIndex = tocItems.findIndex((item) => item.label === currentLabel)
    if (tabIndex < 0)
      return tocItems.length > 1 || (tocItems[0]?.children?.length ?? 0) > 0
    const item = tocItems[tabIndex]
    const children = item?.children ?? []
    if (children.length > 0) return true
    return tabIndex < tocItems.length - 1
  }, [tocItems, embedTitle, embedParentTitle])

  const hasPreviousSection =
    (childSectionTotal > 0 && childSectionIndex > 1) || sectionIndex > 1

  const currentSectionLabel = embedTitle ?? tocItems[0]?.label ?? ''
  const currentStatus = sectionProgress[currentSectionLabel] ?? {
    isCompleted: false,
    isBookmarked: false
  }

  const handleAnnotationCountChange = React.useCallback((n: number) => {
    setAnnotationCount(n)
  }, [])

  React.useEffect(() => {
    if (
      !coursePageId ||
      !courseTitle ||
      currentSectionLabel === '' ||
      currentSectionLabel == null
    ) {
      setAnnotationCount(0)
      return
    }
    let cancelled = false
    ;(async () => {
      const result = await getOrCreateCourse(
        coursePageId,
        courseTitle,
        courseUrl
      )
      if (!result || cancelled) return
      const list = await getAnnotations(result.courseId, currentSectionLabel)
      if (!cancelled) setAnnotationCount(list.length)
    })()
    return () => {
      cancelled = true
    }
  }, [coursePageId, courseTitle, courseUrl, currentSectionLabel])

  React.useEffect(() => {
    if (!coursePageId) return
    ;(async () => {
      const map = await getSectionProgressMap(coursePageId)
      setSectionProgress(map)
    })()
  }, [coursePageId])

  const handleToggleComplete = React.useCallback(
    async (label: string, completed: boolean) => {
      if (!coursePageId) return
      const next = await updateSectionProgress(coursePageId, label, {
        isCompleted: completed
      })
      if (!next) return
      setSectionProgress((prev) => ({
        ...prev,
        [label]: next
      }))
    },
    [coursePageId]
  )

  const handleToggleBookmark = React.useCallback(
    async (label: string, bookmarked: boolean) => {
      if (!coursePageId) return
      const next = await updateSectionProgress(coursePageId, label, {
        isBookmarked: bookmarked
      })
      if (!next) return
      setSectionProgress((prev) => ({
        ...prev,
        [label]: next
      }))
    },
    [coursePageId]
  )

  const openRightPanel = React.useCallback((panel: 'annotations' | 'chat') => {
    setIsRightPanelExiting(false)
    setRightPanel(panel)
  }, [])

  const closeRightPanel = React.useCallback(() => {
    setIsRightPanelExiting(true)
    setRightPanel('none')
  }, [])

  const rightPanelTransition = React.useMemo(
    () => ({ duration: 0.28, ease: [0.22, 1, 0.36, 1] as const }),
    []
  )

  return (
    <div className={styles.wrapper}>
      <div
        className={
          rightPanel !== 'none' || isRightPanelExiting
            ? `${styles.root} ${styles.rootWithRightPanel}`
            : styles.root
        }
      >
        <aside className={styles.sidebar}>
          <TableOfContents
            ref={tocRef}
            contentRef={contentSlotRef}
            items={tocItems}
            onLinkClick={handleTocLink}
            onSelectionClearPdf={handleSelectionClearPdf}
            onSelectedItemChange={handleSelectedItemChange}
            onSectionChange={handleSectionChange}
            sectionProgress={sectionProgress}
          />
        </aside>
        <ContentMain
          innerRef={setSlotRef}
          showAnnotations={rightPanel === 'annotations'}
          onShowAnnotations={() => openRightPanel('annotations')}
          annotationCount={annotationCount}
          showChat={rightPanel === 'chat'}
          onShowChat={() => openRightPanel('chat')}
          embedUrl={embedUrl}
          embedTitle={embedTitle}
          embedParentTitle={embedParentTitle}
          hideContentUnderEmbed={hideContentUnderEmbed}
          sectionStatus={currentStatus}
          onToggleComplete={(completed) =>
            handleToggleComplete(currentSectionLabel, completed)
          }
          onToggleBookmark={(bookmarked) =>
            handleToggleBookmark(currentSectionLabel, bookmarked)
          }
          currentChildIndex={childSectionIndex}
          totalChildren={childSectionTotal}
          isOnChildTab={isOnChildTab}
          currentSectionIndex={sectionIndex}
          totalSections={sectionTotal}
          onPreviousSection={() => tocRef.current?.goToPreviousSection()}
          hasPreviousSection={hasPreviousSection}
          onNextSection={() => tocRef.current?.goToNextSection()}
          hasNextSection={hasNextSection}
        >
          {children}
        </ContentMain>
        <AnimatePresence
          mode='wait'
          initial={false}
          onExitComplete={() => setIsRightPanelExiting(false)}
        >
          {rightPanel !== 'none' && (
            <motion.div
              key={rightPanel}
              className={styles.annotationsColumn}
              initial={{ x: 28, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 28, opacity: 0 }}
              transition={rightPanelTransition}
            >
              {rightPanel === 'annotations' ? (
                <AnnotationWidget
                  courseUrl={courseUrl}
                  courseTitle={courseTitle}
                  coursePageId={coursePageId}
                  sectionId={currentSectionLabel}
                  onHide={closeRightPanel}
                  onAnnotationCountChange={handleAnnotationCountChange}
                  onActivityPosted={bumpActivityRefresh}
                />
              ) : (
                <CourseChatPanel
                  courseTitle={courseTitle}
                  courseDescription={courseDescription}
                  onHide={closeRightPanel}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className={styles.activitySection}>
        <CourseActivity
          coursePageId={coursePageId}
          courseTitle={courseTitle}
          courseUrl={courseUrl}
          activityRefreshNonce={activityRefreshNonce}
          onSectionClick={(label) => {
            tocRef.current?.goToSectionByLabel?.(label)
            const mount = contentSlotRef.current?.closest(
              '.course-content-mount'
            )
            if (mount) {
              const top = mount.getBoundingClientRect().top + window.scrollY
              window.scrollTo({
                top: top - 56,
                behavior: 'smooth'
              })
            } else {
              contentSlotRef.current?.scrollIntoView?.({
                behavior: 'smooth',
                block: 'start'
              })
            }
          }}
        />
      </div>
    </div>
  )
}
