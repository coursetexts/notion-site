/**
 * Recognize profile “Saved links” rows that point at /notebook/:id
 * so we can pin notebooks into the Bookmarks tab.
 */

const NOTEBOOK_PATH_RE = /\/notebook\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i

export function notebookProfilePath(notebookId: string): string {
  return `/notebook/${notebookId}`
}

/** Returns notebook id if URL path ends with /notebook/<uuid> (absolute or relative). */
export function parseNotebookIdFromUserLinkUrl(url: string): string | null {
  const trimmed = url.trim()
  if (!trimmed) return null
  try {
    const pathOnly = trimmed.startsWith('http')
      ? new URL(trimmed).pathname
      : trimmed.split('?')[0] ?? trimmed
    const m = pathOnly.match(NOTEBOOK_PATH_RE)
    return m?.[1] ?? null
  } catch {
    return null
  }
}

export function notebookAbsoluteUrl(notebookId: string, origin: string): string {
  const base = origin.replace(/\/$/, '')
  return `${base}${notebookProfilePath(notebookId)}`
}

/** Path + query for Next `<Link href>` from a stored user_links URL. */
export function notebookUserLinkHref(url: string): string {
  try {
    const t = url.trim()
    if (t.startsWith('http')) {
      const u = new URL(t)
      return `${u.pathname}${u.search}`
    }
    return t.startsWith('/') ? t : `/${t}`
  } catch {
    return '/'
  }
}
