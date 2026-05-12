/**
 * Resolves how a community-wall link should look in the card preview area.
 *
 * Order: YouTube (icon, no thumbnail) → explicit hero image → tweet (X
 * placeholder) → http(s) website (favicon / iMessage-style tile) → generic
 * chain icon.
 *
 * To add more types (e.g. Reddit, GitHub accent, Open Graph image via /api):
 * branch here before `website` using the URL host or path.
 */

import { isTwitterPostUrl } from '@/lib/twitter-post-link'
import { extractYouTubeVideoId } from '@/lib/youtube-thumbnail'

export type LinkPreviewVisual =
  | { kind: 'image'; src: string }
  | { kind: 'youtube' }
  | { kind: 'twitter' }
  | { kind: 'website'; faviconUrl: string; hostname: string }
  | { kind: 'generic' }

/** Normalize host for display / favicon services (no leading www.). */
export function websiteHostnameFromUrl(
  raw: string | null | undefined
): string | null {
  if (!raw || typeof raw !== 'string') return null
  const s = raw.trim()
  if (!s) return null
  try {
    const href = /^https?:\/\//i.test(s)
      ? s
      : s.startsWith('//')
        ? `https:${s}`
        : `https://${s}`
    const u = new URL(href)
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null
    const h = u.hostname.toLowerCase()
    if (!h || h === 'localhost') return null
    return h.replace(/^www\./, '')
  } catch {
    return null
  }
}

/**
 * Favicon URL suitable for <img> (no CORS issues). Uses Google’s favicon cache.
 * @see https://www.google.com/s2/favicons — common pattern for link previews.
 */
export function faviconUrlForHostname(
  hostname: string,
  sizePx = 128
): string {
  const h = hostname.replace(/^www\./, '').toLowerCase()
  return `https://www.google.com/s2/favicons?sz=${sizePx}&domain=${encodeURIComponent(h)}`
}

export function resolveLinkPreviewVisual(
  link: string | null | undefined,
  previewImage: string | null | undefined
): LinkPreviewVisual {
  if (extractYouTubeVideoId(link)) return { kind: 'youtube' }

  if (previewImage) return { kind: 'image', src: previewImage }

  if (isTwitterPostUrl(link)) return { kind: 'twitter' }

  const host = websiteHostnameFromUrl(link)
  if (host) {
    return {
      kind: 'website',
      faviconUrl: faviconUrlForHostname(host),
      hostname: host
    }
  }

  return { kind: 'generic' }
}
