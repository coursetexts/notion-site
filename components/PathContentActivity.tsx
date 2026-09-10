import * as React from 'react'

import { AnimatePresence, motion } from 'framer-motion'
import { createPortal } from 'react-dom'

import { getAnnotations, getOrCreateCourse } from '@/lib/course-activity-db'
import {
  replaceSearchParams,
  urlWantsAnnotationsPanel,
  urlWantsNotesPanel
} from '@/lib/note-deep-link'

import { AnnotationWidget } from './AnnotationWidget'
import contentMainStyles from './ContentMain.module.css'
import { NotesPanelChromeProvider, NotesPanelChromeSlot } from './NotesPanelChrome'
import notesStyles from './CourseNotesPanel.module.css'
import styles from './PathContentActivity.module.css'
import { ExportContextButton } from './ExportContextButton'
import { ViewAnnotationsButton } from './ViewAnnotationsButton'
import { ViewYourNotesButton } from './ViewYourNotesButton'

type RightPanel = 'none' | 'annotations' | 'notes'

export function PathContentActivity({
  coursePageId,
  courseTitle,
  courseUrl,
  sectionId,
  notesEditor,
  notesTopicTitle,
  className,
  contentClassName,
  contentRef,
  style,
  children,
  onActivityPosted,
  onExportContext,
  footer,
  viewBarLeading
}: {
  coursePageId: string
  courseTitle: string
  courseUrl: string
  sectionId: string
  notesEditor?: React.ReactNode
  notesTopicTitle?: string
  className?: string
  contentClassName?: string
  contentRef?: React.Ref<HTMLDivElement>
  style?: React.CSSProperties
  children: React.ReactNode
  onActivityPosted?: () => void
  /** Opens a dialog with LLM-ready path context (current step, outline, whys, goal). */
  onExportContext?: () => string
  /** Pinned under the scrolling article (shared step bar). */
  footer?: React.ReactNode
  /** Rendered first in the sticky action bar (e.g. mobile path outline toggle). */
  viewBarLeading?: React.ReactNode
}) {
  const [rightPanel, setRightPanel] = React.useState<RightPanel>('none')
  const [annotationCount, setAnnotationCount] = React.useState(0)
  const [isCompactLayout, setIsCompactLayout] = React.useState(false)
  const [portalReady, setPortalReady] = React.useState(false)

  const openRightPanel = React.useCallback((panel: 'annotations' | 'notes') => {
    setRightPanel(panel)
    replaceSearchParams({
      notes: panel === 'notes' ? '1' : null,
      annotations: panel === 'annotations' ? '1' : null,
      discussions: null
    })
  }, [])

  const closeRightPanel = React.useCallback(() => {
    setRightPanel('none')
    replaceSearchParams({ notes: null, annotations: null, discussions: null })
  }, [])

  React.useEffect(() => setPortalReady(true), [])

  React.useEffect(() => {
    if (urlWantsNotesPanel()) {
      openRightPanel('notes')
      return
    }
    if (urlWantsAnnotationsPanel()) {
      openRightPanel('annotations')
    }
  }, [openRightPanel])

  React.useEffect(() => {
    const mq = window.matchMedia('(max-width: 1100px)')
    const sync = () => setIsCompactLayout(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  React.useEffect(() => {
    if (!coursePageId || !courseTitle || !sectionId) {
      setAnnotationCount(0)
      return
    }
    let cancelled = false
    ;(async () => {
      const result = await getOrCreateCourse(
        coursePageId,
        courseTitle,
        courseUrl
      )
      if (!result || cancelled) return
      const list = await getAnnotations(result.courseId, sectionId)
      if (!cancelled) setAnnotationCount(list.length)
    })()
    return () => {
      cancelled = true
    }
  }, [coursePageId, courseTitle, courseUrl, sectionId])

  const showDesktopRightPanel = !isCompactLayout && rightPanel !== 'none'
  const showMobileRightPanel = isCompactLayout && rightPanel !== 'none'
  const hideViewBarActions = rightPanel !== 'none'

  React.useEffect(() => {
    if (!showMobileRightPanel) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [showMobileRightPanel])

  React.useEffect(() => {
    if (!showMobileRightPanel) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeRightPanel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showMobileRightPanel, closeRightPanel])

  const RIGHT_PANEL_WIDTH = 360
  const rightPanelTransition = React.useMemo(
    () => ({ duration: 0.28, ease: [0.22, 1, 0.36, 1] as const }),
    []
  )
  const mobileSheetTransition = React.useMemo(
    () => ({ duration: 0.34, ease: [0.22, 1, 0.36, 1] as const }),
    []
  )

  const renderRightPanel = (sheetLayout: boolean) => {
    if (rightPanel === 'annotations') {
      return (
        <AnnotationWidget
          courseUrl={courseUrl}
          courseTitle={courseTitle}
          coursePageId={coursePageId}
          sectionId={sectionId}
          sectionTitle={notesTopicTitle}
          onHide={closeRightPanel}
          onAnnotationCountChange={setAnnotationCount}
          onActivityPosted={onActivityPosted}
          sheetLayout={sheetLayout}
        />
      )
    }
    if (rightPanel === 'notes') {
      return (
        <NotesPanelChromeProvider showEditorSave>
          <aside
            className={`${notesStyles.root}${
              sheetLayout ? ` ${notesStyles.rootSheet}` : ''
            }`}
            aria-label='Your notes'
          >
            <div className={notesStyles.header}>
              <h2 className={notesStyles.title}>Your Notes</h2>
              <div className={notesStyles.headerActions}>
                <NotesPanelChromeSlot />
                <button
                  type='button'
                  className={notesStyles.hideBtn}
                  onClick={closeRightPanel}
                  aria-label='Hide your notes'
                >
                  Hide
                </button>
              </div>
            </div>
            <div className={notesStyles.meta}>
              {notesTopicTitle ? (
                <p className={notesStyles.topicTitle}>{notesTopicTitle}</p>
              ) : null}
              <p className={notesStyles.courseTitle}>{courseTitle}</p>
            </div>
            <div className={notesStyles.body}>
              {notesEditor ? (
                <div className={notesStyles.notesEditorWrap}>{notesEditor}</div>
              ) : (
                <p className={notesStyles.loading}>
                  Select a topic to take notes.
                </p>
              )}
            </div>
          </aside>
        </NotesPanelChromeProvider>
      )
    }
    return null
  }

  return (
    <>
      <div
        ref={contentRef}
        className={`${styles.contentColumn}${className ? ` ${className}` : ''}`}
        style={style}
      >
        <div
          className={`${contentMainStyles.viewBar}${
            viewBarLeading ? ` ${styles.viewBarWithLeading}` : ''
          }`}
        >
          {viewBarLeading}
          <div
            className={`${styles.viewBarActions}${
              hideViewBarActions ? ` ${styles.viewBarActionsHidden}` : ''
            }`}
            aria-hidden={hideViewBarActions}
          >
            <ViewAnnotationsButton
              count={annotationCount}
              onClick={() => openRightPanel('annotations')}
            />
            <ViewYourNotesButton onClick={() => openRightPanel('notes')} />
            {onExportContext ? (
              <ExportContextButton getText={onExportContext} />
            ) : null}
          </div>
        </div>
        <div
          className={`${styles.contentBody}${
            contentClassName ? ` ${contentClassName}` : ''
          }`}
        >
          {children}
        </div>
        {footer ? <div className={styles.contentFooter}>{footer}</div> : null}
      </div>
      <AnimatePresence mode='wait' initial={false}>
        {showDesktopRightPanel ? (
          <motion.div
            key={rightPanel}
            className={styles.annotationsColumnSlot}
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: RIGHT_PANEL_WIDTH, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={rightPanelTransition}
          >
            <div className={styles.annotationsColumn}>
              {renderRightPanel(false)}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
      {portalReady
        ? createPortal(
            <AnimatePresence initial={false}>
              {showMobileRightPanel ? (
                <>
                  <motion.button
                    key='mobile-right-backdrop'
                    type='button'
                    className={styles.mobilePanelBackdrop}
                    aria-label='Close panel'
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.22 }}
                    onClick={closeRightPanel}
                  />
                  <motion.div
                    key='mobile-right-sheet'
                    role='dialog'
                    aria-modal='true'
                    aria-label={
                      rightPanel === 'annotations'
                        ? 'Discussions'
                        : 'Your notes'
                    }
                    className={styles.mobilePanelSheet}
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={mobileSheetTransition}
                  >
                    <div className={styles.mobilePanelHandle} aria-hidden />
                    <div className={styles.mobilePanelSheetBody}>
                      {renderRightPanel(true)}
                    </div>
                  </motion.div>
                </>
              ) : null}
            </AnimatePresence>,
            document.body
          )
        : null}
    </>
  )
}
