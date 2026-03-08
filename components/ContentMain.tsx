import React from 'react'
import styles from './ContentMain.module.css'
import { PdfEmbed } from './PdfEmbed'
import { ViewAnnotationsButton } from './ViewAnnotationsButton'

export interface ContentMainProps {
  children?: React.ReactNode
  /** Ref forwarded to the slot so DOM can be appended (e.g. from Notion) */
  innerRef?: React.Ref<HTMLDivElement>
  showAnnotations?: boolean
  onShowAnnotations?: () => void
  annotationCount?: number
  /** Optional PDF URL to embed at the top of the content main section */
  pdfUrl?: string
  /** Item name to show above the PDF viewer (e.g. selected TOC link label) */
  pdfTitle?: string
}

export const ContentMain: React.FC<ContentMainProps> = ({
  children,
  innerRef,
  showAnnotations = false,
  onShowAnnotations,
  annotationCount = 0,
  pdfUrl,
  pdfTitle
}) => {
  const showViewBar = onShowAnnotations && !showAnnotations

  return (
    <main className={styles.root}>
      {showViewBar && (
        <div className={styles.viewBar}>
          <ViewAnnotationsButton
            count={annotationCount}
            onClick={onShowAnnotations}
          />
        </div>
      )}
      <div className={styles.slot}>
        {pdfTitle && (
          <h2 className={styles.pdfTitle}>{pdfTitle}</h2>
        )}
        {pdfUrl && (
          <div className={styles.pdfWrap}>
            <PdfEmbed url={pdfUrl} title="Course PDF" />
            <div className={styles.markCompleteWrap}>
              <button type="button" className={styles.markCompleteBtn} aria-label="Mark as completed">
                <span className={styles.markCompleteIcon} aria-hidden>✓</span>
                <span className={styles.markCompleteText}>Mark as Completed</span>
              </button>
            </div>
          </div>
        )}
        <div ref={innerRef} className={styles.slotContent}>
          {children}
        </div>
      </div>
    </main>
  )
}
