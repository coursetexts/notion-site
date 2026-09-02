import * as React from 'react'

import { createPortal } from 'react-dom'

import {
  LEARNING_PATH_PUBLISH_MIN_RESOURCES,
  type LearningPathPublishTopicGap
} from '@/lib/learning-path-publish'
import type { LearningPathVisibility } from '@/lib/learning-path-seed'

import styles from './LearningPathPublishModal.module.css'

function visibilityLabel(
  visibility: Extract<LearningPathVisibility, 'public' | 'collaborative'>
) {
  return visibility === 'collaborative' ? 'collaborative' : 'public'
}

function gapDetail(gap: LearningPathPublishTopicGap) {
  const parts: string[] = []
  if (gap.needed > 0) {
    parts.push(
      `${gap.resourceCount} of ${LEARNING_PATH_PUBLISH_MIN_RESOURCES} resources`
    )
  }
  if (gap.missingWhy) parts.push('Needs why')
  return parts.join(' · ')
}

export function LearningPathPublishModal({
  open,
  intendedVisibility,
  needsTopics,
  gaps,
  onClose,
  onSelectTopic
}: {
  open: boolean
  intendedVisibility: Extract<
    LearningPathVisibility,
    'public' | 'collaborative'
  >
  needsTopics: boolean
  gaps: LearningPathPublishTopicGap[]
  onClose: () => void
  onSelectTopic?: (gap: LearningPathPublishTopicGap) => void
}) {
  const dialogRef = React.useRef<HTMLDivElement>(null)
  const closeRef = React.useRef(onClose)
  closeRef.current = onClose

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

  if (typeof document === 'undefined' || !open) return null

  const target = visibilityLabel(intendedVisibility)

  return createPortal(
    <div
      className={styles.backdrop}
      role='presentation'
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        ref={dialogRef}
        className={styles.modal}
        role='dialog'
        aria-modal='true'
        aria-labelledby='publish-path-title'
        tabIndex={-1}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className={styles.header}>
          <h2 id='publish-path-title' className={styles.title}>
            Finish topics to publish
          </h2>
          <button
            type='button'
            className={styles.close}
            onClick={onClose}
            aria-label='Close'
          >
            ×
          </button>
        </div>
        <p className={styles.intro}>
          A {target} path needs a filled “Why is this on the learning path” on
          every topic, and at least {LEARNING_PATH_PUBLISH_MIN_RESOURCES}{' '}
          resources on each, so the next person inherits a real trail instead of
          an empty outline.
        </p>
        {needsTopics ? (
          <p className={styles.empty}>
            This path does not have any topics yet. Add topics first, then write
            why each belongs and attach resources to each one.
          </p>
        ) : (
          <ul className={styles.list}>
            {gaps.map((gap) => {
              const canOpen = Boolean(onSelectTopic)
              const detail = gapDetail(gap)
              const inner = (
                <>
                  <span className={styles.label}>{gap.label}</span>
                  <span className={styles.count}>{detail}</span>
                </>
              )
              return (
                <li key={gap.id} className={styles.item}>
                  {canOpen ? (
                    <button
                      type='button'
                      className={styles.itemBtn}
                      onClick={() => onSelectTopic?.(gap)}
                    >
                      {inner}
                    </button>
                  ) : (
                    <div className={styles.itemStatic}>{inner}</div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
        <div className={styles.actions}>
          <button
            type='button'
            className={styles.keepPrivate}
            onClick={onClose}
          >
            Keep private
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
