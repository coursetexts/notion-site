import React from 'react'
import styles from './CourseContent.module.css'
import { buildSectionsFromHeadings, type TocItem } from '@/lib/courseContentSections'
import { AnnotationWidget } from './AnnotationWidget'
import { ContentMain } from './ContentMain'
import { CourseActivity } from './CourseActivity'
import { TableOfContents } from './TableOfContents'

export interface CourseContentProps {
  /** Optional ref for the main content container so existing DOM can be moved into it */
  mainRef?: React.Ref<HTMLDivElement>
  children?: React.ReactNode
  /** Course identity for activity (comments, bookmarks, annotations) */
  coursePageId?: string
  courseTitle?: string
  courseUrl?: string
}

const ANNOTATION_COUNT = 20

const STORAGE_GOOGLEAPIS_PREFIX = 'https://storage.googleapis.com/'

export const CourseContent: React.FC<CourseContentProps> = ({
  mainRef,
  children,
  coursePageId,
  courseTitle,
  courseUrl
}) => {
  const [showAnnotations, setShowAnnotations] = React.useState(false)
  const [contentSlotReady, setContentSlotReady] = React.useState(false)
  const [tocItems, setTocItems] = React.useState<TocItem[]>([])
  const [pdfUrl, setPdfUrl] = React.useState<string | undefined>(undefined)
  const [pdfTitle, setPdfTitle] = React.useState<string | undefined>(undefined)
  const contentSlotRef = React.useRef<HTMLDivElement | null>(null)

  const handleTocLink = React.useCallback((href: string) => {
    if (href.startsWith(STORAGE_GOOGLEAPIS_PREFIX)) {
      setPdfUrl(href)
    } else {
      setPdfUrl(undefined)
      window.open(href, '_blank', 'noopener,noreferrer')
    }
  }, [])

  const handleSelectionClearPdf = React.useCallback(() => {
    setPdfUrl(undefined)
  }, [])

  const handleSelectedItemChange = React.useCallback((label: string | null) => {
    setPdfTitle(label ?? undefined)
  }, [])

  const setSlotRef = React.useCallback(
    (el: HTMLDivElement | null) => {
      contentSlotRef.current = el
      setContentSlotReady(!!el)
      if (typeof mainRef === 'function') mainRef(el)
      else if (mainRef && el) (mainRef as React.MutableRefObject<HTMLDivElement | null>).current = el
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

  const currentSectionLabel = pdfTitle ?? tocItems[0]?.label ?? 'Overview'

  return (
    <div className={styles.wrapper}>
      <div
        className={
          showAnnotations ? `${styles.root} ${styles.rootWithAnnotations}` : styles.root
        }
      >
        <aside className={styles.sidebar}>
          <TableOfContents
            contentRef={contentSlotRef}
            items={tocItems}
            onLinkClick={handleTocLink}
            onSelectionClearPdf={handleSelectionClearPdf}
            onSelectedItemChange={handleSelectedItemChange}
          />
        </aside>
        <ContentMain
          innerRef={setSlotRef}
          showAnnotations={showAnnotations}
          onShowAnnotations={() => setShowAnnotations(true)}
          annotationCount={ANNOTATION_COUNT}
          pdfUrl={pdfUrl}
          pdfTitle={pdfTitle}
        >
          {children}
        </ContentMain>
        {showAnnotations && (
          <div className={styles.annotationsColumn}>
            <AnnotationWidget
              courseUrl={courseUrl}
              courseTitle={courseTitle}
              coursePageId={coursePageId}
              sectionId={currentSectionLabel}
              onHide={() => setShowAnnotations(false)}
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
