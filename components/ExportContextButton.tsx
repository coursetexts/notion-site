import React from 'react'
import { createPortal } from 'react-dom'

import buttonStyles from './ViewCourseChatButton.module.css'
import styles from './ExportContextButton.module.css'

async function writeClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

export function ExportContextButton({
  getText
}: {
  getText: () => string
}) {
  const [open, setOpen] = React.useState(false)
  const [text, setText] = React.useState('')
  const [copied, setCopied] = React.useState(false)
  const dialogRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!open) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const frame = window.requestAnimationFrame(() => {
      dialogRef.current?.focus()
    })
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.cancelAnimationFrame(frame)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  async function openDialog() {
    const next = getText().trim()
    if (!next) return
    setText(next)
    setCopied(false)
    setOpen(true)
    setCopied(await writeClipboard(next))
  }

  async function copyAgain() {
    if (!text) return
    setCopied(await writeClipboard(text))
  }

  function close() {
    setOpen(false)
  }

  return (
    <>
      <button
        type='button'
        className={buttonStyles.root}
        onClick={() => void openDialog()}
        aria-haspopup='dialog'
        aria-expanded={open}
        aria-label='Export learning path context for an LLM'
      >
        <span className={buttonStyles.icon} aria-hidden>
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
        <span>Context</span>
      </button>
      {typeof document !== 'undefined' && open
        ? createPortal(
            <div
              className={styles.backdrop}
              role='presentation'
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) close()
              }}
            >
              <div
                ref={dialogRef}
                className={styles.modal}
                role='dialog'
                aria-modal='true'
                aria-labelledby='export-context-title'
                tabIndex={-1}
                onMouseDown={(event) => event.stopPropagation()}
              >
                <div className={styles.header}>
                  <h2 id='export-context-title' className={styles.title}>
                    Context for your LLM
                  </h2>
                  <button
                    type='button'
                    className={styles.close}
                    onClick={close}
                    aria-label='Close'
                  >
                    ×
                  </button>
                </div>
                <p className={styles.intro}>
                  Paste this into ChatGPT, Claude, Gemini, or any other LLM so
                  it knows where you are on this learning path — the step you
                  are on, the rest of the outline, and your goal.
                </p>
                <ol className={styles.steps}>
                  <li>
                    {copied
                      ? 'This text is already on your clipboard.'
                      : 'Copy the text below with the button, or select it yourself.'}
                  </li>
                  <li>Open your favorite LLM in another tab.</li>
                  <li>
                    Paste it there, then ask about the step you are working on.
                  </li>
                </ol>
                <p
                  className={`${styles.status} ${
                    copied ? styles.statusCopied : styles.statusManual
                  }`}
                >
                  {copied
                    ? 'Copied to your clipboard.'
                    : 'Clipboard was blocked. Select the text below and copy it yourself.'}
                </p>
                <p className={styles.previewLabel}>What was copied</p>
                <pre
                  className={styles.preview}
                  onClick={(event) => {
                    const selection = window.getSelection()
                    if (!selection) return
                    const range = document.createRange()
                    range.selectNodeContents(event.currentTarget)
                    selection.removeAllRanges()
                    selection.addRange(range)
                  }}
                >
                  {text}
                </pre>
                <div className={styles.actions}>
                  <button
                    type='button'
                    className={styles.secondary}
                    onClick={close}
                  >
                    Done
                  </button>
                  <button
                    type='button'
                    className={styles.primary}
                    onClick={() => void copyAgain()}
                  >
                    {copied ? 'Copy again' : 'Copy to clipboard'}
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  )
}
