import React from 'react'

import styles from './ContentMain.module.css'
import { PdfEmbed } from './PdfEmbed'
import { StepNavBar } from './StepNavBar'
import { ViewAnnotationsButton } from './ViewAnnotationsButton'
import { ViewYourNotesButton } from './ViewYourNotesButton'
import { WebEmbed } from './WebEmbed'

export interface ContentMainProps {
  children?: React.ReactNode
  /** Ref forwarded to the slot so DOM can be appended (e.g. from Notion) */
  innerRef?: React.Ref<HTMLDivElement>
  showAnnotations?: boolean
  onShowAnnotations?: () => void
  annotationCount?: number
  showNotes?: boolean
  onShowNotes?: () => void
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
  /** Hide the Discussions / Your Notes buttons; bar strip remains (e.g. Community Wall). */
  hideAnnotationsChatButtons?: boolean
  /** Hide Mark as explored in the step bar (e.g. Community Wall tab). */
  hideCompleteBookmark?: boolean
  /** Slot before Next (e.g. Commit & Remind Me on General). */
  beforeNext?: React.ReactNode
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
  onShowNotes,
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
  beforeNext,
  titleRowAddon,
  titleRowTrailing
}) => {
  const showViewBar = Boolean(
    (onShowAnnotations || onShowNotes) && !hideAnnotationsChatButtons
  )
  const isPdf = Boolean(embedUrl && /\.pdf(?:$|[?#])/i.test(embedUrl))
  const isCompleted = sectionStatus?.isCompleted ?? false
  const stepCurrent = isOnChildTab
    ? currentChildIndex ?? 1
    : currentSectionIndex
  const stepTotal = isOnChildTab ? totalChildren : totalSections
  const showExplored = Boolean(onToggleComplete) && !hideCompleteBookmark
  const showStepBar = Boolean(
    onToggleComplete ??
      onToggleBookmark ??
      onNextSection ??
      onPreviousSection ??
      beforeNext
  )

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
          {onShowNotes && <ViewYourNotesButton onClick={onShowNotes} />}
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
        {showStepBar ? (
          <div className={styles.sectionActionsWrap}>
            <StepNavBar
              current={stepCurrent}
              total={stepTotal}
              hasPrevious={Boolean(onPreviousSection && hasPreviousSection)}
              isLastStep={!hasNextSection}
              onPrevious={onPreviousSection}
              onNext={onNextSection}
              explored={isCompleted}
              onToggleExplored={
                showExplored
                  ? () => onToggleComplete?.(!isCompleted)
                  : undefined
              }
              showExplored={showExplored}
              beforeNext={beforeNext}
            />
          </div>
        ) : null}
      </div>
    </main>
  )
}
