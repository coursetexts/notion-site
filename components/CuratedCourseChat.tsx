import * as React from 'react'

import styles from './CuratedCourse.module.css'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface CuratedCourseChatProps {
  courseTitle: string
  courseDescription?: string
  /** Current syllabus node title for context. */
  topicTitle?: string
  topicDescription?: string
}

/**
 * Minimizable AI chat for the curated-course topic view.
 * Uses the same `/api/course-chat` endpoint as course pages.
 */
export function CuratedCourseChat({
  courseTitle,
  courseDescription,
  topicTitle,
  topicDescription
}: CuratedCourseChatProps) {
  const [minimized, setMinimized] = React.useState(false)
  const [messages, setMessages] = React.useState<ChatMessage[]>(() => [
    {
      role: 'assistant',
      content: greetingFor(courseTitle, topicTitle)
    }
  ])
  const [inputValue, setInputValue] = React.useState('')
  const [isSending, setIsSending] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const listRef = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    setMessages([
      {
        role: 'assistant',
        content: greetingFor(courseTitle, topicTitle)
      }
    ])
    setInputValue('')
    setError(null)
  }, [courseTitle, topicTitle])

  React.useEffect(() => {
    if (minimized || !listRef.current) return
    listRef.current.scrollTop = listRef.current.scrollHeight
  }, [messages, isSending, minimized])

  const contextDescription = React.useMemo(() => {
    const parts = [
      courseDescription?.trim(),
      topicTitle
        ? `Current syllabus section: ${topicTitle}${
            topicDescription ? ` — ${topicDescription}` : ''
          }`
        : null
    ].filter(Boolean)
    return parts.join('\n\n')
  }, [courseDescription, topicDescription, topicTitle])

  const sendMessage = React.useCallback(async () => {
    const trimmed = inputValue.trim()
    if (!trimmed || isSending) return

    const nextMessages: ChatMessage[] = [
      ...messages,
      { role: 'user', content: trimmed }
    ]
    setMessages(nextMessages)
    setInputValue('')
    setError(null)
    setIsSending(true)

    try {
      const response = await fetch('/api/course-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages,
          courseTitle,
          courseDescription: contextDescription
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
  }, [
    contextDescription,
    courseTitle,
    inputValue,
    isSending,
    messages
  ])

  return (
    <section
      className={`${styles.chatSection}${
        minimized ? ` ${styles.chatSectionMinimized}` : ''
      }`}
      aria-label='AI course chat'
    >
      <header className={styles.chatHeader}>
        <button
          type='button'
          className={styles.chatToggle}
          onClick={() => setMinimized((v) => !v)}
          aria-expanded={!minimized}
          aria-controls='curated-course-chat-body'
        >
          <span className={styles.chatToggleIcon} aria-hidden>
            <ChevronIcon open={!minimized} />
          </span>
          <span className={styles.chatTitle}>
            <span className={styles.chatTitleAccent} aria-hidden>
              <ChatIcon />
            </span>
            AI chat
          </span>
        </button>
        <span className={styles.chatHeaderMeta}>
          {minimized
            ? 'Ask about this section'
            : topicTitle
              ? `About: ${topicTitle}`
              : courseTitle}
        </span>
        <button
          type='button'
          className={styles.chatMinBtn}
          onClick={() => setMinimized((v) => !v)}
          aria-label={minimized ? 'Expand AI chat' : 'Minimize AI chat'}
        >
          {minimized ? 'Expand' : 'Minimize'}
        </button>
      </header>

      {!minimized && (
        <div id='curated-course-chat-body' className={styles.chatBody}>
          <div ref={listRef} className={styles.chatList}>
            {messages.map((message, idx) => (
              <div
                key={`${message.role}-${idx}`}
                className={
                  message.role === 'user'
                    ? `${styles.chatBubbleWrap} ${styles.chatUserWrap}`
                    : `${styles.chatBubbleWrap} ${styles.chatAssistantWrap}`
                }
              >
                <div
                  className={
                    message.role === 'user'
                      ? `${styles.chatBubble} ${styles.chatUserBubble}`
                      : `${styles.chatBubble} ${styles.chatAssistantBubble}`
                  }
                >
                  {message.content}
                </div>
              </div>
            ))}
            {isSending && <p className={styles.chatPending}>Thinking…</p>}
          </div>

          {error && <p className={styles.chatError}>{error}</p>}

          <div className={styles.chatComposer}>
            <textarea
              className={styles.chatInput}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder='Ask a question about this course or section…'
              rows={2}
              disabled={isSending}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  void sendMessage()
                }
              }}
            />
            <button
              type='button'
              className={styles.chatSend}
              onClick={() => void sendMessage()}
              disabled={isSending || !inputValue.trim()}
              aria-label={isSending ? 'Sending message' : 'Send message'}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

function greetingFor(courseTitle: string, topicTitle?: string): string {
  if (topicTitle) {
    return `Ask me anything about “${topicTitle}” in ${
      courseTitle || 'this course'
    }.`
  }
  return `Ask me anything about ${courseTitle || 'this course'}.`
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='14'
      height='14'
      viewBox='0 0 16 16'
      fill='none'
      aria-hidden
      style={{
        transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
        transition: 'transform 160ms ease'
      }}
    >
      <path
        d='M6 3.5L10.5 8L6 12.5'
        stroke='currentColor'
        strokeWidth='1.4'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

function ChatIcon() {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='16'
      height='16'
      viewBox='0 0 16 16'
      fill='none'
      aria-hidden
    >
      <path
        d='M2.5 3.5h11v7.5H8.2L5 13.5v-2.5H2.5V3.5Z'
        stroke='currentColor'
        strokeWidth='1.2'
        strokeLinejoin='round'
      />
    </svg>
  )
}
