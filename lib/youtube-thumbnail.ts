/** YouTube watch / share URLs use 11-character video ids ([A-Za-z0-9_-]). */
const YOUTUBE_VIDEO_ID_RE = /^[\w-]{11}$/

/**
 * Parse a YouTube video id from common URL shapes (watch, youtu.be, embed, shorts, live).
 */
export function extractYouTubeVideoId(
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
    const host = u.hostname.replace(/^www\./, '').toLowerCase()

    if (host === 'youtu.be') {
      const id = u.pathname.split('/').filter(Boolean)[0] ?? ''
      return YOUTUBE_VIDEO_ID_RE.test(id) ? id : null
    }

    if (host.endsWith('youtube.com')) {
      const v = u.searchParams.get('v')
      if (v && YOUTUBE_VIDEO_ID_RE.test(v)) return v

      const path = u.pathname
      const embed = path.match(/^\/embed\/([\w-]{11})(?:\/|$)/)
      if (embed?.[1]) return embed[1]

      const shorts = path.match(/^\/shorts\/([\w-]{11})(?:\/|$)/)
      if (shorts?.[1]) return shorts[1]

      const live = path.match(/^\/live\/([\w-]{11})(?:\/|$)/)
      if (live?.[1]) return live[1]
    }
  } catch {
    /* not a valid absolute URL */
  }

  if (YOUTUBE_VIDEO_ID_RE.test(s)) return s
  return null
}

export type YouTubeThumbQuality = 'maxres' | 'hq' | 'mq' | 'default'

export function getYouTubeThumbnailUrl(
  videoId: string,
  quality: YouTubeThumbQuality = 'hq'
): string {
  const file =
    quality === 'maxres'
      ? 'maxresdefault'
      : quality === 'hq'
        ? 'hqdefault'
        : quality === 'mq'
          ? 'mqdefault'
          : 'default'
  return `https://img.youtube.com/vi/${videoId}/${file}.jpg`
}

/** Public thumbnail URL for a link string, or null if not a recognizable YouTube URL. */
export function youtubeThumbnailFromUrl(
  link: string | null | undefined
): string | null {
  const id = extractYouTubeVideoId(link)
  return id ? getYouTubeThumbnailUrl(id, 'hq') : null
}
