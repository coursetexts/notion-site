import React from 'react'

import { useAuthOptional } from '@/contexts/AuthContext'

import styles from './ContentMain.module.css'
import { PdfEmbed } from './PdfEmbed'
import { ViewAnnotationsButton } from './ViewAnnotationsButton'
import { ViewCourseChatButton } from './ViewCourseChatButton'
import { WebEmbed } from './WebEmbed'

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
  /** Parent tab name to show above the title when viewing a subtab (e.g. "Readings") */
  embedParentTitle?: string
  /** Hide section text while the embed is visible (used for standalone link-only rows). */
  hideContentUnderEmbed?: boolean
  /** Optional status for the current section */
  sectionStatus?: { isCompleted?: boolean; isBookmarked?: boolean }
  onToggleComplete?: (completed: boolean) => void
  onToggleBookmark?: (bookmarked: boolean) => void
  /** Current child/subtab index (1-based) within the current parent — e.g. "2" of "Aug. 27", "Sept. 3" under Readings */
  currentChildIndex?: number
  /** Total number of children (subtabs) under the current parent */
  totalChildren?: number
  /** When true, we are viewing a child tab — show children counter only. When false, show parent counter only. */
  isOnChildTab?: boolean
  /** Current parent tab index (1-based) for display e.g. "1" of General, Readings, … */
  currentSectionIndex?: number
  /** Total number of parent sections */
  totalSections?: number
  /** Go to previous section */
  onPreviousSection?: () => void
  /** When false, hide the Previous button */
  hasPreviousSection?: boolean
  /** Go to next section (always visible, e.g. Next button) */
  onNextSection?: () => void
  /** When false, hide the Next button (e.g. on last section) */
  hasNextSection?: boolean
  /** Hide only the Annotations and Course chat buttons; bar strip remains (e.g. Community Wall). */
  hideAnnotationsChatButtons?: boolean
  /** Hide Completed? / Bookmark in the section footer (e.g. Community Wall tab). */
  hideCompleteBookmark?: boolean
  /** Rendered after the main title heading on the same row (e.g. Subscribe). */
  titleRowAddon?: React.ReactNode
  /** Rendered at the end of the title row (e.g. + Add Resource). */
  titleRowTrailing?: React.ReactNode
}

export const ContentMain: React.FC<ContentMainProps> = ({
  children,
  innerRef,
  onShowAnnotations,
  annotationCount = 0,
  onShowChat,
  embedUrl,
  embedTitle,
  embedParentTitle,
  hideContentUnderEmbed = false,
  sectionStatus,
  onToggleComplete,
  onToggleBookmark,
  currentChildIndex,
  totalChildren = 0,
  isOnChildTab = false,
  currentSectionIndex = 1,
  totalSections = 0,
  onPreviousSection,
  hasPreviousSection = false,
  onNextSection,
  hasNextSection = true,
  hideAnnotationsChatButtons = false,
  hideCompleteBookmark = false,
  titleRowAddon,
  titleRowTrailing
}) => {
  const auth = useAuthOptional()
  const isSignedIn = Boolean(auth?.user)
  const showViewBar = Boolean(
    (onShowAnnotations || onShowChat) && !hideAnnotationsChatButtons
  )
  const isPdf = Boolean(embedUrl && /\.pdf(?:$|[?#])/i.test(embedUrl))
  const isCompleted = sectionStatus?.isCompleted ?? false
  const isBookmarked = sectionStatus?.isBookmarked ?? false
  const canShowProgressButtons =
    isSignedIn && Boolean(onToggleComplete || onToggleBookmark)

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
          {onShowChat && <ViewCourseChatButton onClick={onShowChat} />}
        </div>
      )}
      <div className={styles.slot}>
        {embedParentTitle && (
          <div className={styles.embedParentTitle}>{embedParentTitle}</div>
        )}
        {embedTitle &&
          (titleRowAddon != null || titleRowTrailing != null ? (
            <div className={styles.communityTitleRow}>
              <div className={styles.communityTitleLeft}>
                <h2 className={styles.pdfTitle}>{embedTitle}</h2>
                {titleRowAddon}
              </div>
              {titleRowTrailing ? (
                <div className={styles.communityTitleRight}>
                  {titleRowTrailing}
                </div>
              ) : null}
            </div>
          ) : (
            <h2 className={styles.pdfTitle}>{embedTitle}</h2>
          ))}
        {embedUrl && (
          <div className={styles.pdfWrap}>
            {isPdf ? (
              <PdfEmbed url={embedUrl} title='Course PDF' />
            ) : (
              <WebEmbed
                url={embedUrl}
                title={embedTitle || 'Embedded content'}
              />
            )}
          </div>
        )}
        <div
          ref={innerRef}
          className={styles.slotContent}
          style={
            hideContentUnderEmbed && embedUrl ? { display: 'none' } : undefined
          }
        >
          {children}
        </div>
        {(onToggleComplete ??
          onToggleBookmark ??
          onNextSection ??
          onPreviousSection) && (
          <div className={styles.sectionActionsWrap}>
            <div className={styles.sectionActionsLeft}>
              {isOnChildTab && totalChildren > 0 && (
                <>
                  <span className={styles.sectionCount}>
                    {currentChildIndex ?? 1}/{totalChildren}
                  </span>
                  <span className={styles.sectionCountDivider} aria-hidden />
                </>
              )}
              {!isOnChildTab && totalSections > 0 && (
                <>
                  <span className={styles.sectionCount}>
                    {currentSectionIndex}/{totalSections}
                  </span>
                  <span className={styles.sectionCountDivider} aria-hidden />
                </>
              )}
              {(onPreviousSection ?? onNextSection) && (
                <>
                  {onPreviousSection && hasPreviousSection && (
                    <button
                      type='button'
                      className={styles.navBtn}
                      onClick={onPreviousSection}
                      aria-label='Go to previous section'
                    >
                      <span className={styles.navBtnIcon} aria-hidden>
                        <svg
                          xmlns='http://www.w3.org/2000/svg'
                          width='12'
                          height='12'
                          viewBox='0 0 12 12'
                          fill='none'
                        >
                          <path
                            d='M7.64535 1.90314C7.57608 1.87612 7.50058 1.86927 7.42758 1.88337C7.35458 1.89747 7.28707 1.93195 7.23285 1.98282L3.48285 5.73283C3.41243 5.80392 3.37292 5.89994 3.37292 6.00001C3.37292 6.10008 3.41243 6.1961 3.48285 6.2672L7.23285 10.0172C7.30483 10.086 7.40046 10.1246 7.50003 10.125C7.5498 10.1248 7.59909 10.1153 7.64535 10.0969C7.7136 10.0682 7.77183 10.02 7.8127 9.95822C7.85358 9.89649 7.87527 9.82405 7.87503 9.75001V2.25001C7.87527 2.17598 7.85358 2.10353 7.8127 2.0418C7.77183 1.98007 7.7136 1.93183 7.64535 1.90314Z'
                            fill='#5D534B'
                          />
                        </svg>
                      </span>
                      <span>Previous</span>
                    </button>
                  )}
                  {onNextSection && hasNextSection && (
                    <button
                      type='button'
                      className={styles.navBtn}
                      onClick={onNextSection}
                      aria-label='Go to next section'
                    >
                      <span>Next</span>
                      <span className={styles.navBtnIcon} aria-hidden>
                        <svg
                          xmlns='http://www.w3.org/2000/svg'
                          width='12'
                          height='12'
                          viewBox='0 0 12 12'
                          fill='none'
                        >
                          <path
                            d='M8.51719 5.73283L4.76719 1.98282C4.71297 1.93195 4.64545 1.89747 4.57246 1.88337C4.49946 1.86927 4.42396 1.87612 4.35469 1.90314C4.28644 1.93183 4.22821 1.98007 4.18733 2.0418C4.14646 2.10353 4.12477 2.17598 4.125 2.25001V9.75001C4.12477 9.82405 4.14646 9.89649 4.18733 9.95822C4.22821 10.02 4.28644 10.0682 4.35469 10.0969C4.40095 10.1153 4.45023 10.1248 4.5 10.125C4.59958 10.1246 4.69521 10.086 4.76719 10.0172L8.51719 6.2672C8.58761 6.1961 8.62711 6.10008 8.62711 6.00001C8.62711 5.89994 8.58761 5.80392 8.51719 5.73283Z'
                            fill='#5D534B'
                          />
                        </svg>
                      </span>
                    </button>
                  )}
                </>
              )}
            </div>
            <div className={styles.sectionActionsRight}>
              {canShowProgressButtons &&
                !hideCompleteBookmark &&
                onToggleComplete && (
                <button
                  type='button'
                  className={
                    isCompleted
                      ? `${styles.markCompleteBtn} ${styles.markCompleteBtnDone}`
                      : styles.markCompleteBtn
                  }
                  aria-label={
                    isCompleted ? 'Marked as completed' : 'Mark as completed'
                  }
                  onClick={() => onToggleComplete(!isCompleted)}
                >
                  <span className={styles.markCompleteIcon} aria-hidden>
                    {isCompleted ? (
                      <svg
                        xmlns='http://www.w3.org/2000/svg'
                        width='12'
                        height='12'
                        viewBox='0 0 12 12'
                        fill='none'
                        aria-hidden
                      >
                        <path
                          d='M10.125 3.375L4.875 8.625L2.25 6'
                          stroke='#FDFDFD'
                          strokeWidth='1.5'
                          strokeLinecap='round'
                          strokeLinejoin='round'
                        />
                      </svg>
                    ) : (
                      <svg
                        xmlns='http://www.w3.org/2000/svg'
                        width='12'
                        height='12'
                        viewBox='0 0 12 12'
                        fill='none'
                        aria-hidden
                      >
                        <path
                          d='M10.125 3.375L4.875 8.625L2.25 6'
                          stroke='#242424'
                          strokeWidth='1.5'
                          strokeLinecap='round'
                          strokeLinejoin='round'
                        />
                      </svg>
                    )}
                  </span>
                  <span className={styles.markCompleteText}>
                    {isCompleted ? 'Completed' : 'Completed?'}
                  </span>
                </button>
              )}
              {canShowProgressButtons &&
                !hideCompleteBookmark &&
                onToggleBookmark && (
                <button
                  type='button'
                  className={
                    isBookmarked ? styles.bookmarkBtnActive : styles.bookmarkBtn
                  }
                  aria-label={
                    isBookmarked ? 'Remove bookmark' : 'Bookmark this item'
                  }
                  onClick={() => onToggleBookmark(!isBookmarked)}
                >
                  <span className={styles.bookmarkIcon} aria-hidden>
                    {isBookmarked ? (
                      <svg
                        xmlns='http://www.w3.org/2000/svg'
                        width='12'
                        height='12'
                        viewBox='-4 -4 20 20'
                        fill='none'
                        aria-hidden
                      >
                        <path
                          d='M8.625 1.5H3.375C3.17609 1.5 2.98532 1.57902 2.84467 1.71967C2.70402 1.86032 2.625 2.05109 2.625 2.25V10.5C2.62536 10.5668 2.64331 10.6322 2.67706 10.6899C2.7108 10.7475 2.75913 10.7952 2.81719 10.8281C2.8728 10.8599 2.93596 10.8761 3 10.875C3.06961 10.8751 3.13784 10.8556 3.19687 10.8188L6 9.06562L8.79844 10.8188C8.85621 10.8535 8.92201 10.8726 8.98939 10.8742C9.05677 10.8759 9.12342 10.86 9.18281 10.8281C9.24087 10.7952 9.2892 10.7475 9.32294 10.6899C9.35669 10.6322 9.37464 10.5668 9.375 10.5V2.25C9.375 2.05109 9.29598 1.86032 9.15533 1.71967C9.01468 1.57902 8.82391 1.5 8.625 1.5Z'
                          fill='#F8F7F4'
                        />
                      </svg>
                    ) : (
                      <span
                        className={styles.bookmarkIconStack}
                        aria-hidden
                      >
                        <svg
                          className={styles.bookmarkIconFilled}
                          xmlns='http://www.w3.org/2000/svg'
                          width='12'
                          height='12'
                          viewBox='-4 -4 20 20'
                          fill='none'
                          aria-hidden
                        >
                          <path
                            d='M8.625 1.5H3.375C3.17609 1.5 2.98532 1.57902 2.84467 1.71967C2.70402 1.86032 2.625 2.05109 2.625 2.25V10.5C2.62536 10.5668 2.64331 10.6322 2.67706 10.6899C2.7108 10.7475 2.75913 10.7952 2.81719 10.8281C2.8728 10.8599 2.93596 10.8761 3 10.875C3.06961 10.8751 3.13784 10.8556 3.19687 10.8188L6 9.06562L8.79844 10.8188C8.85621 10.8535 8.92201 10.8726 8.98939 10.8742C9.05677 10.8759 9.12342 10.86 9.18281 10.8281C9.24087 10.7952 9.2892 10.7475 9.32294 10.6899C9.35669 10.6322 9.37464 10.5668 9.375 10.5V2.25C9.375 2.05109 9.29598 1.86032 9.15533 1.71967C9.01468 1.57902 8.82391 1.5 8.625 1.5Z'
                            fill='#0089C4'
                          />
                        </svg>
                        <svg
                          className={styles.bookmarkIconOutline}
                          xmlns='http://www.w3.org/2000/svg'
                          width='12'
                          height='12'
                          viewBox='-4 -4 20 20'
                          fill='none'
                          aria-hidden
                        >
                          <path
                            d='M8.625 1.5H3.375C3.17609 1.5 2.98532 1.57902 2.84467 1.71967C2.70402 1.86032 2.625 2.05109 2.625 2.25V10.5C2.62536 10.5668 2.64331 10.6322 2.67706 10.6899C2.7108 10.7475 2.75913 10.7952 2.81719 10.8281C2.8728 10.8599 2.93596 10.8761 3 10.875C3.06961 10.8751 3.13784 10.8556 3.19687 10.8188L6 9.06562L8.79844 10.8188C8.85621 10.8535 8.92201 10.8726 8.98939 10.8742C9.05677 10.8759 9.12342 10.86 9.18281 10.8281C9.24087 10.7952 9.2892 10.7475 9.32294 10.6899C9.35669 10.6322 9.37464 10.5668 9.375 10.5V2.25C9.375 2.05109 9.29598 1.86032 9.15533 1.71967C9.01468 1.57902 8.82391 1.5 8.625 1.5Z'
                            fill='none'
                            stroke='currentColor'
                            strokeWidth='0.85'
                            strokeLinejoin='round'
                          />
                        </svg>
                      </span>
                    )}
                  </span>
                  <span className={styles.bookmarkText}>
                    {isBookmarked ? 'Bookmarked' : 'Bookmark'}
                  </span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
