/**
 * Client-safe URL helpers for profile Updates link previews.
 * Server fetch lives in `link-preview-server.ts` (got is Node-only).
 */

/** First http(s) URL in free text (composer + legacy posts without stored url). */
const URL_IN_TEXT_RE = /\bhttps?:\/\/[^\s<>"'`)\]]+/gi

export function extractUrlsFromText(text: string): string[] {
  const raw = text.match(URL_IN_TEXT_RE) || []
  const out: string[] = []
  const seen = new Set<string>()
  for (const match of raw) {
    const cleaned = match.replace(/[.,;:!?)]+$/g, '')
    if (!cleaned || seen.has(cleaned)) continue
    seen.add(cleaned)
    out.push(cleaned)
  }
  return out
}

export function extractFirstHttpUrl(text: string): string | null {
  return extractUrlsFromText(text)[0] ?? null
}

export function resolveUpdateLinkUrl(
  storedUrl: string | null | undefined,
  body: string
): string {
  const stored = (storedUrl ?? '').trim()
  if (stored && /^https?:\/\//i.test(stored)) return stored
  return extractFirstHttpUrl(body) ?? ''
}

function isPrivateHostname(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/\.$/, '')
  if (
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host.endsWith('.local') ||
    host.endsWith('.internal') ||
    host === '0.0.0.0' ||
    host === '::1'
  ) {
    return true
  }

  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
  if (ipv4) {
    const parts = ipv4.slice(1).map((part) => Number(part))
    if (parts.some((n) => Number.isNaN(n) || n > 255)) return true
    const [a, b] = parts
    if (a === 10 || a === 127 || a === 0) return true
    if (a === 169 && b === 254) return true
    if (a === 172 && b >= 16 && b <= 31) return true
    if (a === 192 && b === 168) return true
    if (a === 100 && b >= 64 && b <= 127) return true
    return false
  }

  if (host.includes(':')) {
    if (host === '::1' || host.startsWith('fc') || host.startsWith('fd')) {
      return true
    }
    if (host.startsWith('fe80') || host.startsWith('::ffff:127.')) return true
  }

  return false
}

export function isAllowedPreviewUrl(raw: string): boolean {
  try {
    const parsed = new URL(raw.trim())
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false
    }
    if (!parsed.hostname) return false
    if (isPrivateHostname(parsed.hostname)) return false
    return true
  } catch {
    return false
  }
}

export type LinkPreviewData = {
  url: string
  title: string
  description: string
  image: string | null
  siteName: string
  favicon: string | null
}
