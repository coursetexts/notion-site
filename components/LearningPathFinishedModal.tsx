import * as React from 'react'

import { createPortal } from 'react-dom'

import { ConfettiBurst } from '@/components/ConfettiBurst'
import { LearningPathFeedbackFields } from '@/components/LearningPathRatingModal'
import ratingStyles from '@/components/LearningPathRatingModal.module.css'
import type { KnowledgeTopicItem } from '@/lib/learning-path-knowledge'
import { parseLearningPathFeedback } from '@/lib/learning-path-ratings'

import styles from './LearningPathFinishedModal.module.css'

export function LearningPathFinishedModal({
  open,
  pathTitle,
  topics,
  kindLabel = 'path',
  showRating = true,
  onClose,
  onSelectTopic,
  onSubmitRating
}: {
  open: boolean
  pathTitle: string
  topics: KnowledgeTopicItem[]
  kindLabel?: 'path' | 'course'
  showRating?: boolean
  onClose: () => void
  onSelectTopic?: (id: string) => void
  onSubmitRating?: (rating: number, durationMs: number) => void
}) {
  const [hours, setHours] = React.useState('')
  const [minutes, setMinutes] = React.useState('')
  const [percent, setPercent] = React.useState('')
  const dialogRef = React.useRef<HTMLDivElement>(null)
  const closeRef = React.useRef(onClose)
  closeRef.current = onClose
  const parsed = parseLearningPathFeedback(hours, minutes, percent)

  React.useEffect(() => {
    if (!open) return
    setHours('')
    setMinutes('')
    setPercent('')
  }, [open, pathTitle])

  React.useEffect(() => {
    if (!open) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const frame = window.requestAnimationFrame(() => {
      dialogRef.current?.focus()
    })
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') closeRef.current()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.cancelAnimationFrame(frame)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  function handleContinue() {
    if (showRating && parsed) onSubmitRating?.(parsed.rating, parsed.durationMs)
    onClose()
  }

  if (typeof document === 'undefined' || !open) return null

  const wholeLabel = kindLabel === 'course' ? 'course' : 'learning path'

  return createPortal(
    <>
      <ConfettiBurst active />
      <div
        className={styles.backdrop}
        role='presentation'
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) handleContinue()
        }}
      >
        <div
          ref={dialogRef}
          className={styles.modal}
          role='dialog'
          aria-modal='true'
          aria-labelledby='path-finished-title'
          tabIndex={-1}
          onMouseDown={(event) => event.stopPropagation()}
        >
          <div className={styles.header}>
            <div>
              <span className={styles.badge}>
                {kindLabel === 'course' ? 'Course complete' : 'Path complete'}
              </span>
              <h2 id='path-finished-title' className={styles.title}>
                You finished {pathTitle}
              </h2>
            </div>
            <button
              type='button'
              className={styles.close}
              onClick={onClose}
              aria-label='Close'
            >
              ×
            </button>
          </div>
          <p className={styles.intro}>Here is what you learned:</p>
          {topics.length === 0 ? (
            <p className={styles.empty}>No topics on this path yet.</p>
          ) : (
            <ol className={styles.list}>
              {topics.map((topic, index) => (
                <li key={topic.id} className={styles.item}>
                  {onSelectTopic ? (
                    <button
                      type='button'
                      className={styles.itemBtn}
                      onClick={() => onSelectTopic(topic.id)}
                    >
                      <span className={styles.index}>{index + 1}</span>
                      <span className={styles.label}>{topic.label}</span>
                    </button>
                  ) : (
                    <span className={styles.itemStatic}>
                      <span className={styles.index}>{index + 1}</span>
                      <span className={styles.label}>{topic.label}</span>
                    </span>
                  )}
                </li>
              ))}
            </ol>
          )}
          {showRating ? (
            <div className={ratingStyles.finishFields}>
              <LearningPathFeedbackFields
                hours={hours}
                minutes={minutes}
                percent={percent}
                durationLabel={`How long did this ${wholeLabel} take you?`}
                enjoyLabel={`How enjoyable was learning this ${wholeLabel} using the given resources?`}
                onHours={setHours}
                onMinutes={setMinutes}
                onPercent={setPercent}
              />
            </div>
          ) : null}
          <div className={styles.actions}>
            {showRating ? (
              <button
                type='button'
                className={ratingStyles.skip}
                onClick={onClose}
              >
                Skip
              </button>
            ) : null}
            <button
              type='button'
              className={styles.continue}
              disabled={showRating && !parsed}
              onClick={handleContinue}
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}
