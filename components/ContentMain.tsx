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
}

export const ContentMain: React.FC<ContentMainProps> = ({
  children,
  innerRef,
  showAnnotations = false,
  onShowAnnotations,
  annotationCount = 0,
  pdfUrl
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
        {pdfUrl && (
          <div className={styles.pdfWrap}>
            <PdfEmbed url={pdfUrl} title="Course PDF" />
          </div>
        )}
        <div ref={innerRef} className={styles.slotContent}>
          {children}
        </div>
      </div>
    </main>
  )
}
