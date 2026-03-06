import React from 'react'
import styles from './CourseContent.module.css'
import { buildSectionsFromHeadings, type TocItem } from '@/lib/courseContentSections'
import { AnnotationWidget } from './AnnotationWidget'
import { ContentMain } from './ContentMain'
import { TableOfContents } from './TableOfContents'

export interface CourseContentProps {
  /** Optional ref for the main content container so existing DOM can be moved into it */
  mainRef?: React.Ref<HTMLDivElement>
  children?: React.ReactNode
}

const ANNOTATION_COUNT = 20

/** Example PDF embed for course content; can later be driven by Notion or per-page config. */
const DEFAULT_PDF_URL =
  'https://storage.googleapis.com/course-texts-staging/127172/course%20files/Astro%2B16%2BSyllabus%2B%25282024%2529.pdf'

export const CourseContent: React.FC<CourseContentProps> = ({ mainRef, children }) => {
  const [showAnnotations, setShowAnnotations] = React.useState(false)
  const [contentSlotReady, setContentSlotReady] = React.useState(false)
  const [tocItems, setTocItems] = React.useState<TocItem[]>([])
  const contentSlotRef = React.useRef<HTMLDivElement | null>(null)

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

  return (
    <div
      className={
        showAnnotations ? `${styles.root} ${styles.rootWithAnnotations}` : styles.root
      }
    >
      <aside className={styles.sidebar}>
        <TableOfContents
          contentRef={contentSlotRef}
          items={tocItems}
        />
      </aside>
      <ContentMain
        innerRef={setSlotRef}
        showAnnotations={showAnnotations}
        onShowAnnotations={() => setShowAnnotations(true)}
        annotationCount={ANNOTATION_COUNT}
        pdfUrl={DEFAULT_PDF_URL}
      >
        {children}
      </ContentMain>
      {showAnnotations && (
        <div className={styles.annotationsColumn}>
          <AnnotationWidget
            count={ANNOTATION_COUNT}
            onHide={() => setShowAnnotations(false)}
          />
        </div>
      )}
    </div>
  )
}
