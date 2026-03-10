import React from 'react'

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

const ANNOTATION_COUNT = 20

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
  const [contentSlotReady, setContentSlotReady] = React.useState(false)
  const [tocItems, setTocItems] = React.useState<TocItem[]>([])
  const [embedUrl, setEmbedUrl] = React.useState<string | undefined>(undefined)
  const [embedTitle, setEmbedTitle] = React.useState<string | undefined>(
    undefined
  )
  const [hideContentUnderEmbed, setHideContentUnderEmbed] =
    React.useState(false)
  const contentSlotRef = React.useRef<HTMLDivElement | null>(null)
  const [sectionProgress, setSectionProgress] = React.useState<
    Record<string, SectionProgressStatus>
  >({})

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

  const handleSelectedItemChange = React.useCallback((label: string | null) => {
    setEmbedTitle(label ?? undefined)
  }, [])

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

  const currentSectionLabel = embedTitle ?? tocItems[0]?.label ?? 'Overview'
  const currentStatus = sectionProgress[currentSectionLabel] ?? {
    isCompleted: false,
    isBookmarked: false
  }

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

  return (
    <div className={styles.wrapper}>
      <div
        className={
          rightPanel !== 'none'
            ? `${styles.root} ${styles.rootWithRightPanel}`
            : styles.root
        }
      >
        <aside className={styles.sidebar}>
          <TableOfContents
            contentRef={contentSlotRef}
            items={tocItems}
            onLinkClick={handleTocLink}
            onSelectionClearPdf={handleSelectionClearPdf}
            onSelectedItemChange={handleSelectedItemChange}
            sectionProgress={sectionProgress}
          />
        </aside>
        <ContentMain
          innerRef={setSlotRef}
          showAnnotations={rightPanel === 'annotations'}
          onShowAnnotations={() => setRightPanel('annotations')}
          annotationCount={ANNOTATION_COUNT}
          showChat={rightPanel === 'chat'}
          onShowChat={() => setRightPanel('chat')}
          embedUrl={embedUrl}
          embedTitle={embedTitle}
          hideContentUnderEmbed={hideContentUnderEmbed}
          sectionStatus={currentStatus}
          onToggleComplete={(completed) =>
            handleToggleComplete(currentSectionLabel, completed)
          }
          onToggleBookmark={(bookmarked) =>
            handleToggleBookmark(currentSectionLabel, bookmarked)
          }
        >
          {children}
        </ContentMain>
        {rightPanel === 'annotations' && (
          <div className={styles.annotationsColumn}>
            <AnnotationWidget
              courseUrl={courseUrl}
              courseTitle={courseTitle}
              coursePageId={coursePageId}
              sectionId={currentSectionLabel}
              onHide={() => setRightPanel('none')}
            />
          </div>
        )}
        {rightPanel === 'chat' && (
          <div className={styles.annotationsColumn}>
            <CourseChatPanel
              courseTitle={courseTitle}
              courseDescription={courseDescription}
              onHide={() => setRightPanel('none')}
            />
          </div>
        )}
      </div>
      <div className={styles.activitySection}>
        <CourseActivity
          coursePageId={coursePageId}
          courseTitle={courseTitle}
          courseUrl={courseUrl}
        />
      </div>
    </div>
  )
}
