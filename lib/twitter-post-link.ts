const TWITTER_HOSTS = new Set([
  'twitter.com',
  'mobile.twitter.com',
  'x.com',
  'mobile.x.com'
])

function normalizeHref(raw: string): string {
  const s = raw.trim()
  if (/^https?:\/\//i.test(s)) return s
  if (s.startsWith('//')) return `https:${s}`
  return `https://${s}`
}

/**
 * True for tweet / post permalinks (paths containing /status/{numeric_id}).
 * Matches twitter.com, x.com, and mobile hosts.
 */
export function isTwitterPostUrl(raw: string | null | undefined): boolean {
  if (!raw || typeof raw !== 'string') return false
  const t = raw.trim()
  if (!t) return false

  try {
    const u = new URL(normalizeHref(t))
    const host = u.hostname.replace(/^www\./, '').toLowerCase()
    if (!TWITTER_HOSTS.has(host)) return false
    return /\/status\/\d+/i.test(u.pathname)
  } catch {
    return false
  }
}
