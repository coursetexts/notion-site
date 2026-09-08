import * as React from 'react'

import styles from './StepNavBar.module.css'

function ChevronLeftIcon() {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='12'
      height='12'
      viewBox='0 0 12 12'
      fill='none'
      aria-hidden
    >
      <path
        d='M7.64535 1.90314C7.57608 1.87612 7.50058 1.86927 7.42758 1.88337C7.35458 1.89747 7.28707 1.93195 7.23285 1.98282L3.48285 5.73283C3.41243 5.80392 3.37292 5.89994 3.37292 6.00001C3.37292 6.10008 3.41243 6.1961 3.48285 6.2672L7.23285 10.0172C7.30483 10.086 7.40046 10.1246 7.50003 10.125C7.5498 10.1248 7.59909 10.1153 7.64535 10.0969C7.7136 10.0682 7.77183 10.02 7.8127 9.95822C7.85358 9.89649 7.87527 9.82405 7.87503 9.75001V2.25001C7.87527 2.17598 7.85358 2.10353 7.8127 2.0418C7.77183 1.98007 7.7136 1.93183 7.64535 1.90314Z'
        fill='currentColor'
      />
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='12'
      height='12'
      viewBox='0 0 12 12'
      fill='none'
      aria-hidden
    >
      <path
        d='M8.51719 5.73283L4.76719 1.98282C4.71297 1.93195 4.64545 1.89747 4.57246 1.88337C4.49946 1.86927 4.42396 1.87612 4.35469 1.90314C4.28644 1.93183 4.22821 1.98007 4.18733 2.0418C4.14646 2.10353 4.12477 2.17598 4.125 2.25001V9.75001C4.12477 9.82405 4.14646 9.89649 4.18733 9.95822C4.22821 10.02 4.28644 10.0682 4.35469 10.0969C4.40095 10.1153 4.45023 10.1248 4.5 10.125C4.59958 10.1246 4.69521 10.086 4.76719 10.0172L8.51719 6.2672C8.58761 6.1961 8.62711 6.10008 8.62711 6.00001C8.62711 5.89994 8.58761 5.80392 8.51719 5.73283Z'
        fill='currentColor'
      />
    </svg>
  )
}

function CheckIcon() {
  return (
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
        stroke='currentColor'
        strokeWidth='1.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

export function StepNavBar({
  current,
  total,
  hasPrevious,
  isLastStep,
  onPrevious,
  onNext,
  nextLabel: nextLabelProp,
  explored = false,
  onToggleExplored,
  showExplored = false,
  beforeNext
}: {
  current: number
  total: number
  hasPrevious: boolean
  isLastStep: boolean
  onPrevious?: () => void
  onNext?: () => void
  /** Overrides the default Next / Finish path label. */
  nextLabel?: string
  explored?: boolean
  onToggleExplored?: () => void
  showExplored?: boolean
  beforeNext?: React.ReactNode
}) {
  const showCount = total > 0
  const showBar = Boolean(
    onPrevious ||
      onNext ||
      (showExplored && onToggleExplored) ||
      showCount ||
      beforeNext
  )
  if (!showBar) return null

  const nextLabel =
    nextLabelProp ?? (isLastStep ? 'Finish path' : 'Next')

  return (
    <div className={styles.bar} role='navigation' aria-label='Step'>
      <div className={styles.left}>
        {onPrevious && hasPrevious ? (
          <button
            type='button'
            className={styles.secondaryBtn}
            onClick={onPrevious}
            aria-label='Go to previous step'
          >
            <span className={styles.btnIcon} aria-hidden>
              <ChevronLeftIcon />
            </span>
            <span>Previous</span>
          </button>
        ) : (
          <span className={styles.placeholder} aria-hidden />
        )}
      </div>

      <div className={styles.center}>
        {showCount ? (
          <span className={styles.count}>
            {current} of {total}
          </span>
        ) : null}
      </div>

      <div className={styles.right}>
        {beforeNext ? <div className={styles.slot}>{beforeNext}</div> : null}
        {showExplored && onToggleExplored ? (
          <button
            type='button'
            className={
              explored ? styles.secondaryBtn : styles.primaryBtn
            }
            onClick={onToggleExplored}
            aria-label={
              explored ? 'Marked as explored' : 'Mark as explored'
            }
          >
            {explored ? (
              <>
                <span className={styles.btnIcon} aria-hidden>
                  <CheckIcon />
                </span>
                <span>Explored</span>
              </>
            ) : (
              'Mark as explored'
            )}
          </button>
        ) : null}
        {onNext ? (
          <button
            type='button'
            className={styles.primaryBtn}
            onClick={onNext}
            aria-label={nextLabel}
          >
            <span>{nextLabel}</span>
            {isLastStep ? null : (
              <span className={styles.btnIcon} aria-hidden>
                <ChevronRightIcon />
              </span>
            )}
          </button>
        ) : null}
      </div>
    </div>
  )
}
