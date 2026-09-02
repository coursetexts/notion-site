import React from 'react'

import styles from './ViewCourseChatButton.module.css'

export function ExportContextButton({
  getText
}: {
  getText: () => string
}) {
  const [copied, setCopied] = React.useState(false)
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  React.useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  async function copy() {
    const text = getText().trim()
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      window.prompt('Copy this learning path context', text)
    }
    setCopied(true)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      setCopied(false)
      timer.current = null
    }, 2000)
  }

  return (
    <button
      type='button'
      className={styles.root}
      onClick={() => void copy()}
      aria-label={
        copied
          ? 'Learning path context copied to clipboard'
          : 'Export learning path context for an LLM'
      }
    >
      <span className={styles.icon} aria-hidden>
        <svg
          xmlns='http://www.w3.org/2000/svg'
          width='12'
          height='12'
          viewBox='0 0 12 12'
          fill='none'
        >
          <path
            d='M6 1.5v6M3.75 3.75L6 1.5l2.25 2.25'
            stroke='black'
            strokeWidth='1.1'
            strokeLinecap='round'
            strokeLinejoin='round'
          />
          <path
            d='M2.25 6.75v2.5h7.5v-2.5'
            stroke='black'
            strokeWidth='1.1'
            strokeLinecap='round'
            strokeLinejoin='round'
          />
        </svg>
      </span>
      <span>{copied ? 'Copied' : ' Context'}</span>
    </button>
  )
}
