import * as React from 'react'

import styles from './CreatePathStepper.module.css'

export const CREATE_PATH_STEPS = [
  'Describe your goal',
  'Build a path',
  'Add resources',
  'Collaborate or publish'
] as const

export type CreatePathStep = 1 | 2 | 3 | 4

type CreatePathStepperProps = {
  currentStep: CreatePathStep
  /** Full-bleed page strip under the nav vs compact in the modal. */
  variant?: 'page' | 'modal'
  /** Sits on the same row as the steps (modal close button). */
  trailing?: React.ReactNode
}

export function CreatePathStepper({
  currentStep,
  variant = 'page',
  trailing
}: CreatePathStepperProps) {
  return (
    <nav
      className={`${styles.wrap} ${
        variant === 'modal' ? styles.wrapModal : styles.wrapPage
      }`}
      aria-label='Create path steps'
    >
      <div className={styles.bar}>
      <ol className={styles.list}>
        {CREATE_PATH_STEPS.map((label, index) => {
          const step = (index + 1) as CreatePathStep
          const state =
            step === currentStep
              ? 'current'
              : step < currentStep
                ? 'done'
                : 'upcoming'
          const stateClass =
            state === 'current'
              ? styles.stepCurrent
              : state === 'done'
                ? styles.stepDone
                : styles.stepUpcoming
          const connectorDone = step <= currentStep

          return (
            <li
              key={label}
              className={`${styles.step} ${stateClass}`}
              aria-current={state === 'current' ? 'step' : undefined}
            >
              {index > 0 ? (
                <span
                  className={`${styles.connector}${
                    connectorDone ? ` ${styles.connectorDone}` : ''
                  }`}
                  aria-hidden
                />
              ) : null}
              <span className={styles.marker}>
                {state === 'done' ? (
                  <svg
                    className={styles.check}
                    width='9'
                    height='9'
                    viewBox='0 0 12 12'
                    fill='none'
                    aria-hidden
                  >
                    <path
                      d='M2.5 6.2L4.8 8.5L9.5 3.5'
                      stroke='currentColor'
                      strokeWidth='1.6'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                    />
                  </svg>
                ) : (
                  <span className={styles.number}>{step}</span>
                )}
              </span>
              <span className={styles.label}>{label}</span>
            </li>
          )
        })}
      </ol>
      {trailing}
      </div>
    </nav>
  )
}
