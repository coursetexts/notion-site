import * as React from 'react'
import { createPortal } from 'react-dom'

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'

import styles from './LearningPathFillOverlay.module.css'

const FILL_MESSAGES = ['Watering your path.', 'Creating your steps.'] as const

export function LearningPathFillOverlay({ open }: { open: boolean }) {
  const reduceMotion = useReducedMotion()
  const [mounted, setMounted] = React.useState(false)
  const [messageIndex, setMessageIndex] = React.useState(0)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    if (!open) {
      setMessageIndex(0)
      return
    }
    const id = window.setInterval(() => {
      setMessageIndex((current) => (current + 1) % FILL_MESSAGES.length)
    }, 2400)
    return () => window.clearInterval(id)
  }, [open])

  React.useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  if (!mounted || !open) return null

  const message = FILL_MESSAGES[messageIndex]

  return createPortal(
    <div
      className={styles.backdrop}
      role='dialog'
      aria-modal='true'
      aria-labelledby='learning-path-fill-status'
    >
      <div className={styles.card}>
        <div className={styles.scene} aria-hidden>
          <svg
            className={styles.svg}
            viewBox='0 0 240 200'
            fill='none'
            xmlns='http://www.w3.org/2000/svg'
          >
            <ellipse
              className={styles.ground}
              cx='112'
              cy='168'
              rx='62'
              ry='10'
              fill='#e8e2d4'
            />
            <g className={styles.plant}>
              <path
                className={styles.stem}
                d='M112 118C112 118 110 96 112 78C114 60 118 52 118 52'
                stroke='#3d7a4a'
                strokeWidth='3.2'
                strokeLinecap='round'
              />
              <path
                className={styles.leafLeft}
                d='M111 96C96 102 86 94 84 84C98 80 110 86 111 96Z'
                fill='#5aaa6c'
              />
              <path
                className={styles.leafRight}
                d='M114 86C130 78 138 84 138 96C122 98 114 92 114 86Z'
                fill='#4c9a5e'
              />
              <path
                className={styles.bloom}
                d='M118 52C118 52 112 46 116 40C120 46 118 52 118 52Z'
                fill='#f2c14e'
              />
              <path
                d='M118 52C118 52 124 44 128 48C122 52 118 52 118 52Z'
                fill='#f7d56a'
              />
              <path
                d='M118 52C118 52 112 56 108 52C114 48 118 52 118 52Z'
                fill='#f2c14e'
              />
              <circle cx='118' cy='50' r='3.2' fill='#fff4c8' />
            </g>
            <path
              d='M86 124C88 148 96 158 112 158C128 158 136 148 138 124C128 120 96 120 86 124Z'
              fill='#d4895a'
            />
            <ellipse cx='112' cy='124' rx='28' ry='8' fill='#e09a6a' />
            <ellipse cx='112' cy='126' rx='22' ry='5.5' fill='#6b4a32' />
            <g className={styles.drops}>
              <circle className={styles.drop} cx='148' cy='86' r='3.2' fill='#7ec8e8' />
              <circle
                className={styles.dropDelay}
                cx='140'
                cy='92'
                r='2.4'
                fill='#9ad6ef'
              />
              <circle
                className={styles.dropLate}
                cx='154'
                cy='94'
                r='2.1'
                fill='#b3def0'
              />
            </g>
            <g className={styles.can}>
              <path
                d='M168 58C168 58 186 52 192 62C198 72 192 86 176 90C160 94 154 80 158 70C160 64 168 58 168 58Z'
                fill='#6eb3d4'
              />
              <path
                d='M176 64C184 62 190 68 188 76'
                stroke='#3d8fb3'
                strokeWidth='2'
                strokeLinecap='round'
              />
              <path
                d='M158 72C148 76 142 82 138 90'
                stroke='#3d8fb3'
                strokeWidth='4.5'
                strokeLinecap='round'
              />
              <circle cx='136' cy='92' r='5' fill='#3d8fb3' />
              <circle cx='136' cy='92' r='2.2' fill='#9ad6ef' />
            </g>
          </svg>
        </div>
        <p id='learning-path-fill-status' className={styles.statusSr}>
          Creating your learning path
        </p>
        <div className={styles.captionWrap} aria-live='polite'>
          <AnimatePresence mode='wait' initial={false}>
            <motion.p
              key={message}
              className={styles.caption}
              initial={
                reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }
              }
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              {message}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
    </div>,
    document.body
  )
}
