import React from 'react'
import cs from 'classnames'

import styles from './CourseChatPanel.module.css'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface CourseChatPanelProps {
  onHide?: () => void
  courseTitle?: string
  courseDescription?: string
  /** Full-viewport sheet on small screens (no sidebar border / max-width). */
  sheetLayout?: boolean
}

export const CourseChatPanel: React.FC<CourseChatPanelProps> = ({
  onHide,
  courseTitle,
  courseDescription,
  sheetLayout = false
}) => {
  const [messages, setMessages] = React.useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: `Ask me anything about ${courseTitle || 'this course'}.`
    }
  ])
  const [inputValue, setInputValue] = React.useState('')
  const [isSending, setIsSending] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const listRef = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    if (!listRef.current) return
    listRef.current.scrollTop = listRef.current.scrollHeight
  }, [messages, isSending])

  const sendMessage = React.useCallback(async () => {
    const trimmed = inputValue.trim()
    if (!trimmed || isSending) return

    const nextMessages = [
      ...messages,
      { role: 'user' as const, content: trimmed }
    ]
    setMessages(nextMessages)
    setInputValue('')
    setError(null)
    setIsSending(true)

    try {
      const response = await fetch('/api/course-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: nextMessages,
          courseTitle,
          courseDescription
        })
      })

      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload?.error || 'Could not get a chat response.')
      }

      const assistantReply = String(payload?.reply || '').trim()
      if (!assistantReply) {
        throw new Error('Empty chat response.')
      }

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: assistantReply }
      ])
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not get a chat response.'
      )
    } finally {
      setIsSending(false)
    }
  }, [courseDescription, courseTitle, inputValue, isSending, messages])

  return (
    <aside
      className={cs(styles.root, sheetLayout && styles.rootSheet)}
      aria-label='Course chat'
    >
      <div className={styles.header}>
        <h2 className={styles.title}>Course Chat</h2>
        <button
          type='button'
          className={styles.hideBtn}
          onClick={onHide}
          aria-label='Hide course chat'
        >
          Hide
        </button>
      </div>

      <div className={styles.meta}>
        <p className={styles.courseTitle}>{courseTitle || 'Untitled course'}</p>
      </div>

      <div ref={listRef} className={styles.list}>
        {messages.map((message, idx) => (
          <div
            key={`${message.role}-${idx}`}
            className={
              message.role === 'user'
                ? `${styles.bubbleWrap} ${styles.userWrap}`
                : `${styles.bubbleWrap} ${styles.assistantWrap}`
            }
          >
            <div
              className={
                message.role === 'user'
                  ? `${styles.bubble} ${styles.userBubble}`
                  : `${styles.bubble} ${styles.assistantBubble}`
              }
            >
              {message.content}
            </div>
          </div>
        ))}
        {isSending && <p className={styles.pending}>Thinking...</p>}
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.addWrap}>
        <div className={styles.addWrapInner}>
          <textarea
            className={styles.addInput}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder='Ask a question about this course...'
            rows={3}
            disabled={isSending}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                sendMessage()
              }
            }}
          />
          <button
            type='button'
            className={styles.submitBtn}
            onClick={sendMessage}
            disabled={isSending || !inputValue.trim()}
            aria-label={isSending ? 'Sending message' : 'Send message'}
          >
            <span className={styles.submitBtnIcon} aria-hidden>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                width='14'
                height='14'
                viewBox='0 0 24 24'
                fill='none'
              >
                <path
                  d='M4 12h15'
                  stroke='#ffffff'
                  strokeWidth='2'
                  strokeLinecap='round'
                />
                <path
                  d='M13 5l7 7-7 7'
                  stroke='#ffffff'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                />
              </svg>
            </span>
          </button>
        </div>
      </div>
    </aside>
  )
}
