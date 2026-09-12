import * as React from 'react'

import {
  extractUrlsFromText,
  type LinkPreviewData
} from '@/lib/link-preview'
import styles from './LinkPreviewCard.module.css'

const previewCache = new Map<string, LinkPreviewData | null>()
const previewInflight = new Map<string, Promise<LinkPreviewData | null>>()

async function loadLinkPreview(url: string): Promise<LinkPreviewData | null> {
  if (previewCache.has(url)) return previewCache.get(url) ?? null
  const existing = previewInflight.get(url)
  if (existing) return existing

  const request = (async () => {
    try {
      const res = await fetch(
        `/api/link-preview?url=${encodeURIComponent(url)}`
      )
      if (!res.ok) {
        previewCache.set(url, null)
        return null
      }
      const data = (await res.json()) as LinkPreviewData
      previewCache.set(url, data)
      return data
    } catch {
      previewCache.set(url, null)
      return null
    } finally {
      previewInflight.delete(url)
    }
  })()

  previewInflight.set(url, request)
  return request
}

/** Turn plain text into nodes with clickable http(s) links. */
export function LinkifiedText({ text }: { text: string }) {
  const parts: React.ReactNode[] = []
  const re = /\bhttps?:\/\/[^\s<>"'`)\]]+/gi
  let lastIndex = 0
  let match: RegExpExecArray | null
  let key = 0
  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }
    const href = match[0].replace(/[.,;:!?)]+$/g, '')
    const trailing = match[0].slice(href.length)
    parts.push(
      <a
        key={`u-${key++}`}
        href={href}
        target='_blank'
        rel='noopener noreferrer'
        className={styles.inlineUrl}
      >
        {href}
      </a>
    )
    if (trailing) parts.push(trailing)
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex))
  if (parts.length === 0) return <>{text}</>
  return <>{parts}</>
}

type LinkPreviewCardProps = {
  url: string
  className?: string
  /** When false, hide while loading / on failure (feed cards). */
  showPlaceholder?: boolean
}

export function LinkPreviewCard({
  url,
  className,
  showPlaceholder = false
}: LinkPreviewCardProps) {
  const [preview, setPreview] = React.useState<LinkPreviewData | null>(() =>
    previewCache.has(url) ? previewCache.get(url) ?? null : null
  )
  const [status, setStatus] = React.useState<'idle' | 'loading' | 'ready' | 'error'>(
    () => (previewCache.has(url) ? (previewCache.get(url) ? 'ready' : 'error') : 'idle')
  )

  React.useEffect(() => {
    let cancelled = false
    const trimmed = url.trim()
    if (!trimmed) {
      setPreview(null)
      setStatus('error')
      return
    }
    if (previewCache.has(trimmed)) {
      const cached = previewCache.get(trimmed) ?? null
      setPreview(cached)
      setStatus(cached ? 'ready' : 'error')
      return
    }
    setStatus('loading')
    void loadLinkPreview(trimmed).then((data) => {
      if (cancelled) return
      setPreview(data)
      setStatus(data ? 'ready' : 'error')
    })
    return () => {
      cancelled = true
    }
  }, [url])

  if (status === 'loading' && showPlaceholder) {
    return (
      <div
        className={`${styles.card} ${styles.cardLoading}${
          className ? ` ${className}` : ''
        }`}
        aria-busy='true'
        aria-label='Loading link preview'
      />
    )
  }

  if (!preview || status !== 'ready') return null

  const domain = (() => {
    try {
      return new URL(preview.url).hostname.replace(/^www\./i, '')
    } catch {
      return preview.siteName || preview.url
    }
  })()

  return (
    <a
      href={preview.url}
      target='_blank'
      rel='noopener noreferrer'
      className={`${styles.card}${className ? ` ${className}` : ''}`}
    >
      {preview.image ? (
        <span className={styles.imageWrap}>
          <img
            src={preview.image}
            alt=''
            className={styles.image}
            loading='lazy'
            referrerPolicy='no-referrer'
            onError={(event) => {
              const wrap = event.currentTarget.parentElement
              if (wrap) wrap.hidden = true
            }}
          />
        </span>
      ) : null}
      <span className={styles.copy}>
        <span className={styles.domain}>
          {preview.favicon ? (
            <img
              src={preview.favicon}
              alt=''
              className={styles.favicon}
              width={14}
              height={14}
              loading='lazy'
              referrerPolicy='no-referrer'
              onError={(event) => {
                event.currentTarget.style.display = 'none'
              }}
            />
          ) : null}
          {domain}
        </span>
        <span className={styles.title}>{preview.title}</span>
        {preview.description ? (
          <span className={styles.description}>{preview.description}</span>
        ) : null}
      </span>
    </a>
  )
}

export function useFirstUrlFromText(text: string, debounceMs = 500): string {
  const [url, setUrl] = React.useState(() => extractUrlsFromText(text)[0] ?? '')

  React.useEffect(() => {
    const handle = window.setTimeout(() => {
      setUrl(extractUrlsFromText(text)[0] ?? '')
    }, debounceMs)
    return () => window.clearTimeout(handle)
  }, [text, debounceMs])

  return url
}
