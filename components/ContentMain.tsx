import React from 'react'
import {
  AnimatePresence,
  motion,
  type Transition,
  useReducedMotion
} from 'framer-motion'

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
  hasNextSection = true
}) => {
  const showViewBar = Boolean(onShowAnnotations || onShowChat)
  const isPdf = Boolean(embedUrl && /\.pdf(?:$|[?#])/i.test(embedUrl))
  const isCompleted = sectionStatus?.isCompleted ?? false
  const isBookmarked = sectionStatus?.isBookmarked ?? false
  const shouldReduceMotion = useReducedMotion()

  const buttonSpring: Transition = React.useMemo(() => {
    if (shouldReduceMotion) return { duration: 0 }
    return { type: 'spring', stiffness: 520, damping: 38, mass: 0.7 }
  }, [shouldReduceMotion])

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
        {embedTitle && <h2 className={styles.pdfTitle}>{embedTitle}</h2>}
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
              {onToggleComplete && (
                <motion.button
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
                  layout
                  transition={buttonSpring}
                >
                  <span className={styles.markCompleteIcon} aria-hidden>
                    <AnimatePresence mode='wait' initial={false}>
                      <motion.span
                        key={isCompleted ? 'done' : 'todo'}
                        initial={
                          shouldReduceMotion
                            ? { opacity: 1, scale: 1 }
                            : { opacity: 0, scale: 0.85 }
                        }
                        animate={{
                          opacity: 1,
                          scale: isCompleted ? 1.12 : 1
                        }}
                        exit={
                          shouldReduceMotion
                            ? { opacity: 1, scale: 1 }
                            : { opacity: 0, scale: 0.9 }
                        }
                        transition={buttonSpring}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
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
                              d='M4.87499 8.99999C4.77559 8.99864 4.68029 8.96018 4.6078 8.89217L1.9828 6.26717C1.923 6.19431 1.89244 6.10181 1.89706 6.00767C1.90169 5.91352 1.94116 5.82447 2.00781 5.75781C2.07447 5.69116 2.16352 5.65169 2.25767 5.64706C2.35181 5.64244 2.44431 5.673 2.51717 5.7328L4.87499 8.0953L9.8578 3.1078C9.93066 3.048 10.0232 3.01744 10.1173 3.02206C10.2114 3.02669 10.3005 3.06616 10.3672 3.13281C10.4338 3.19947 10.4733 3.28852 10.4779 3.38267C10.4825 3.47681 10.452 3.56931 10.3922 3.64217L5.14217 8.89217C5.06968 8.96018 4.97438 8.99864 4.87499 8.99999Z'
                              fill='#ffffff'
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
                              d='M4.87499 8.99999C4.77559 8.99864 4.68029 8.96018 4.6078 8.89217L1.9828 6.26717C1.923 6.19431 1.89244 6.10181 1.89706 6.00767C1.90169 5.91352 1.94116 5.82447 2.00781 5.75781C2.07447 5.69116 2.16352 5.65169 2.25767 5.64706C2.35181 5.64244 2.44431 5.673 2.51717 5.7328L4.87499 8.0953L9.8578 3.1078C9.93066 3.048 10.0232 3.01744 10.1173 3.02206C10.2114 3.02669 10.3005 3.06616 10.3672 3.13281C10.4338 3.19947 10.4733 3.28852 10.4779 3.38267C10.4825 3.47681 10.452 3.56931 10.3922 3.64217L5.14217 8.89217C5.06968 8.96018 4.97438 8.99864 4.87499 8.99999Z'
                              fill='#9ca3af'
                            />
                          </svg>
                        )}
                      </motion.span>
                    </AnimatePresence>
                  </span>
                  <motion.span
                    className={styles.markCompleteText}
                    layout
                    transition={buttonSpring}
                  >
                    {isCompleted ? 'Completed' : 'Mark as Completed'}
                  </motion.span>
                </motion.button>
              )}
              {onToggleBookmark && (
                <motion.button
                  type='button'
                  className={
                    isBookmarked ? styles.bookmarkBtnActive : styles.bookmarkBtn
                  }
                  aria-label={
                    isBookmarked ? 'Remove bookmark' : 'Bookmark this item'
                  }
                  onClick={() => onToggleBookmark(!isBookmarked)}
                  layout
                  transition={buttonSpring}
                >
                  <span className={styles.bookmarkIcon} aria-hidden>
                    <AnimatePresence mode='wait' initial={false}>
                      <motion.span
                        key={isBookmarked ? 'saved' : 'unsaved'}
                        initial={
                          shouldReduceMotion
                            ? { opacity: 1, scale: 1 }
                            : { opacity: 0, scale: 0.85 }
                        }
                        animate={{ opacity: 1, scale: 1 }}
                        exit={
                          shouldReduceMotion
                            ? { opacity: 1, scale: 1 }
                            : { opacity: 0, scale: 0.9 }
                        }
                        transition={buttonSpring}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {isBookmarked ? (
                          <svg
                            xmlns='http://www.w3.org/2000/svg'
                            width='12'
                            height='12'
                            viewBox='0 0 24 24'
                            fill='none'
                            aria-hidden
                          >
                            <path
                              d='M6 2h12a2 2 0 0 1 2 2v18l-8-4-8 4V4a2 2 0 0 1 2-2z'
                              fill='#0089C4'
                            />
                          </svg>
                        ) : (
                          <span className={styles.bookmarkIconStack} aria-hidden>
                            <svg
                              className={styles.bookmarkIconFilled}
                              xmlns='http://www.w3.org/2000/svg'
                              width='12'
                              height='12'
                              viewBox='0 0 24 24'
                              fill='none'
                              aria-hidden
                            >
                              <path
                                d='M6 2h12a2 2 0 0 1 2 2v18l-8-4-8 4V4a2 2 0 0 1 2-2z'
                                fill='#0089C4'
                              />
                            </svg>
                            <svg
                              className={styles.bookmarkIconOutline}
                              xmlns='http://www.w3.org/2000/svg'
                              width='12'
                              height='12'
                              viewBox='0 0 12 12'
                              fill='none'
                              aria-hidden
                            >
                              <path
                                d='M9 10.5L6 8.625L3 10.5V2.25C3 2.15054 3.03951 2.05516 3.10984 1.98484C3.18016 1.91451 3.27554 1.875 3.375 1.875H8.625C8.72446 1.875 8.81984 1.91451 8.89017 1.98484C8.96049 2.05516 9 2.15054 9 2.25V10.5Z'
                                stroke='currentColor'
                                strokeLinecap='round'
                                strokeLinejoin='round'
                              />
                            </svg>
                          </span>
                        )}
                      </motion.span>
                    </AnimatePresence>
                  </span>
                  <motion.span
                    className={styles.bookmarkText}
                    layout
                    transition={buttonSpring}
                  >
                    {isBookmarked ? 'Bookmarked' : 'Bookmark'}
                  </motion.span>
                </motion.button>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
