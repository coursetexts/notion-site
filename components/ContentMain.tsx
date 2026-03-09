import React from 'react'
import styles from './ContentMain.module.css'
import { PdfEmbed } from './PdfEmbed'
import { WebEmbed } from './WebEmbed'
import { ViewAnnotationsButton } from './ViewAnnotationsButton'

export interface ContentMainProps {
  children?: React.ReactNode
  /** Ref forwarded to the slot so DOM can be appended (e.g. from Notion) */
  innerRef?: React.Ref<HTMLDivElement>
  showAnnotations?: boolean
  onShowAnnotations?: () => void
  annotationCount?: number
  /** Optional URL to embed at the top of the content main section */
  embedUrl?: string
  /** Item name to show above the viewer (e.g. selected TOC link label) */
  embedTitle?: string
}

export const ContentMain: React.FC<ContentMainProps> = ({
  children,
  innerRef,
  showAnnotations = false,
  onShowAnnotations,
  annotationCount = 0,
  embedUrl,
  embedTitle
}) => {
  const showViewBar = onShowAnnotations && !showAnnotations
  const isPdf = Boolean(embedUrl && /\.pdf(?:$|[?#])/i.test(embedUrl))

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
        {embedTitle && (
          <h2 className={styles.pdfTitle}>{embedTitle}</h2>
        )}
        {embedUrl && (
          <div className={styles.pdfWrap}>
            {isPdf ? (
              <PdfEmbed url={embedUrl} title="Course PDF" />
            ) : (
              <WebEmbed url={embedUrl} title={embedTitle || 'Embedded content'} />
            )}
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
