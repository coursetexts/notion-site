import * as React from 'react'

import { createPortal } from 'react-dom'

import { parseLearningPathFeedback } from '@/lib/learning-path-ratings'

import styles from './LearningPathRatingModal.module.css'

export function LearningPathFeedbackFields({
  hours,
  minutes,
  percent,
  durationLabel,
  enjoyLabel,
  onHours,
  onMinutes,
  onPercent
}: {
  hours: string
  minutes: string
  percent: string
  durationLabel: string
  enjoyLabel: string
  onHours: (value: string) => void
  onMinutes: (value: string) => void
  onPercent: (value: string) => void
}) {
  const sliderValue = percent === '' ? 0 : Number(percent)
  const sliderSafe =
    Number.isFinite(sliderValue) && sliderValue >= 0 && sliderValue <= 100
      ? sliderValue
      : 0

  return (
    <div className={styles.fields}>
      <p className={styles.prompt}>{durationLabel}</p>
      <div className={styles.durationRow}>
        <label className={styles.durationField}>
          <input
            className={styles.durationInput}
            type='number'
            min={0}
            step={1}
            inputMode='numeric'
            placeholder='0'
            value={hours}
            onChange={(event) => onHours(event.target.value)}
            aria-label='Hours'
          />
          <span className={styles.durationUnit}>hr</span>
        </label>
        <label className={styles.durationField}>
          <input
            className={styles.durationInput}
            type='number'
            min={0}
            step={1}
            inputMode='numeric'
            placeholder='0'
            value={minutes}
            onChange={(event) => onMinutes(event.target.value)}
            aria-label='Minutes'
          />
          <span className={styles.durationUnit}>min</span>
        </label>
      </div>
      <p className={styles.prompt}>{enjoyLabel}</p>
      <div className={styles.percentRow}>
        <input
          className={styles.percentSlider}
          type='range'
          min={0}
          max={100}
          step={1}
          value={sliderSafe}
          onChange={(event) => onPercent(event.target.value)}
          aria-label={enjoyLabel}
        />
        <label className={styles.percentValue}>
          <input
            className={styles.percentInput}
            type='number'
            min={0}
            max={100}
            step={1}
            inputMode='numeric'
            placeholder='—'
            value={percent}
            onChange={(event) => onPercent(event.target.value)}
            aria-label='Enjoyment percent'
          />
          <span className={styles.percentUnit}>%</span>
        </label>
      </div>
    </div>
  )
}

export function LearningPathRatingModal({
  open,
  badge,
  title,
  durationLabel = 'How long did this take you?',
  enjoyLabel = 'How enjoyable was learning this module using the given resources?',
  onSkip,
  onSubmit
}: {
  open: boolean
  badge: string
  title: string
  durationLabel?: string
  enjoyLabel?: string
  onSkip: () => void
  onSubmit: (rating: number, durationMs: number) => void
}) {
  const [hours, setHours] = React.useState('')
  const [minutes, setMinutes] = React.useState('')
  const [percent, setPercent] = React.useState('')
  const dialogRef = React.useRef<HTMLDivElement>(null)
  const skipRef = React.useRef(onSkip)
  skipRef.current = onSkip
  const parsed = parseLearningPathFeedback(hours, minutes, percent)

  React.useEffect(() => {
    if (!open) return
    setHours('')
    setMinutes('')
    setPercent('')
  }, [open, title])

  React.useEffect(() => {
    if (!open) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const frame = window.requestAnimationFrame(() => {
      dialogRef.current?.focus()
    })
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') skipRef.current()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.cancelAnimationFrame(frame)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (typeof document === 'undefined' || !open) return null

  return createPortal(
    <div
      className={styles.backdrop}
      role='presentation'
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onSkip()
      }}
    >
      <div
        ref={dialogRef}
        className={styles.modal}
        role='dialog'
        aria-modal='true'
        aria-labelledby='topic-rating-title'
        tabIndex={-1}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className={styles.header}>
          <div>
            <span className={styles.badge}>{badge}</span>
            <h2 id='topic-rating-title' className={styles.title}>
              {title}
            </h2>
          </div>
          <button
            type='button'
            className={styles.close}
            onClick={onSkip}
            aria-label='Skip rating'
          >
            ×
          </button>
        </div>
        <div className={styles.body}>
          <LearningPathFeedbackFields
            hours={hours}
            minutes={minutes}
            percent={percent}
            durationLabel={durationLabel}
            enjoyLabel={enjoyLabel}
            onHours={setHours}
            onMinutes={setMinutes}
            onPercent={setPercent}
          />
          <div className={styles.actions}>
            <button type='button' className={styles.skip} onClick={onSkip}>
              Skip
            </button>
            <button
              type='button'
              className={styles.submit}
              disabled={!parsed}
              onClick={() => {
                if (!parsed) return
                onSubmit(parsed.rating, parsed.durationMs)
              }}
            >
              Submit
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
