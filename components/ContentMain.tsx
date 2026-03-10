import React from 'react'
import styles from './ContentMain.module.css'
import { PdfEmbed } from './PdfEmbed'
import { WebEmbed } from './WebEmbed'
import { ViewAnnotationsButton } from './ViewAnnotationsButton'
import { ViewCourseChatButton } from './ViewCourseChatButton'

export interface ContentMainProps {
  children?: React.ReactNode
  /** Ref forwarded to the slot so DOM can be appended (e.g. from Notion) */
  innerRef?: React.Ref<HTMLDivElement>
  showAnnotations?: boolean
  onShowAnnotations?: () => void
  annotationCount?: number
  showChat?: boolean
  onShowChat?: () => void
  /** Optional URL to embed at the top of the content main section */
  embedUrl?: string
  /** Item name to show above the viewer (e.g. selected TOC link label) */
  embedTitle?: string
  /** Hide section text while the embed is visible (used for standalone link-only rows). */
  hideContentUnderEmbed?: boolean
  /** Optional status for the current section */
  sectionStatus?: { isCompleted?: boolean; isBookmarked?: boolean }
  onToggleComplete?: (completed: boolean) => void
  onToggleBookmark?: (bookmarked: boolean) => void
}

export const ContentMain: React.FC<ContentMainProps> = ({
  children,
  innerRef,
  showAnnotations = false,
  onShowAnnotations,
  annotationCount = 0,
  showChat = false,
  onShowChat,
  embedUrl,
  embedTitle,
  hideContentUnderEmbed = false,
  sectionStatus,
  onToggleComplete,
  onToggleBookmark
}) => {
  const showViewBar = (onShowAnnotations || onShowChat) && !showAnnotations && !showChat
  const isPdf = Boolean(embedUrl && /\.pdf(?:$|[?#])/i.test(embedUrl))
  const isCompleted = sectionStatus?.isCompleted ?? false
  const isBookmarked = sectionStatus?.isBookmarked ?? false

  return (
    <main className={styles.root}>
      {showViewBar && (
        <div className={styles.viewBar}>
          {onShowAnnotations && (
            <ViewAnnotationsButton
              count={annotationCount}
              onClick={onShowAnnotations}
            />
          )}
          {onShowChat && (
            <ViewCourseChatButton onClick={onShowChat} />
          )}
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
              <button
                type="button"
                className={
                  isCompleted ? `${styles.markCompleteBtn} ${styles.markCompleteBtnDone}` : styles.markCompleteBtn
                }
                aria-label={isCompleted ? 'Marked as completed' : 'Mark as completed'}
                onClick={() => onToggleComplete?.(!isCompleted)}
              >
                <span className={styles.markCompleteIcon} aria-hidden>
                  ✓
                </span>
                <span className={styles.markCompleteText}>
                  {isCompleted ? 'Completed' : 'Mark as Completed'}
                </span>
              </button>
              <button
                type="button"
                className={isBookmarked ? styles.bookmarkBtnActive : styles.bookmarkBtn}
                aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark this item'}
                onClick={() => onToggleBookmark?.(!isBookmarked)}
              >
                <span className={styles.bookmarkIcon} aria-hidden>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={isBookmarked ? '#eab308' : '#9ca3af'}
                    strokeWidth="2"
                  >
                    <path d="M7 3h10a1 1 0 0 1 1 1v16l-6-4-6 4V4a1 1 0 0 1 1-1z" />
                  </svg>
                </span>
                <span className={styles.bookmarkText}>{isBookmarked ? 'Bookmarked' : 'Bookmark'}</span>
              </button>
            </div>
          </div>
        )}
        <div
          ref={innerRef}
          className={styles.slotContent}
          style={hideContentUnderEmbed && embedUrl ? { display: 'none' } : undefined}
        >
          {children}
        </div>
      </div>
    </main>
  )
}
