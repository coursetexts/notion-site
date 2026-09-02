const AUTH_REDIRECT_KEY = 'coursetexts.authRedirect'
const AUTH_REDIRECT_MAX_AGE_MS = 30 * 60 * 1000

export type AuthRedirectParams = Record<string, string | null | undefined>

export function isSafeAuthRedirect(path: string) {
  if (!path.startsWith('/') || path.startsWith('//') || path.includes('\\')) {
    return false
  }
  if (path.includes('://')) return false
  return true
}

export function isAuthAppPath(path: string) {
  const pathname = path.split('?')[0].split('#')[0]
  return pathname === '/signin' || pathname.startsWith('/auth/')
}

export function mergeQueryIntoPath(
  path: string,
  extra?: AuthRedirectParams
): string {
  const hashIndex = path.indexOf('#')
  const hash = hashIndex >= 0 ? path.slice(hashIndex) : ''
  const withoutHash = hashIndex >= 0 ? path.slice(0, hashIndex) : path
  const qIndex = withoutHash.indexOf('?')
  const pathname = qIndex >= 0 ? withoutHash.slice(0, qIndex) : withoutHash
  const search = qIndex >= 0 ? withoutHash.slice(qIndex + 1) : ''
  const params = new URLSearchParams(search)
  if (extra) {
    for (const [key, value] of Object.entries(extra)) {
      if (value == null || value === '') params.delete(key)
      else params.set(key, value)
    }
  }
  const query = params.toString()
  return `${pathname}${query ? `?${query}` : ''}${hash}`
}

export function sanitizeAuthRedirect(
  path: string | undefined | null
): string | null {
  if (!path || !isSafeAuthRedirect(path) || isAuthAppPath(path)) return null
  return path
}

function searchParam(
  name: string,
  search = typeof window === 'undefined' ? '' : window.location.search
): string | null {
  const value = new URLSearchParams(search).get(name)
  return value && value.trim() ? value.trim() : null
}

/** `?redirect=` on /signin or `?next=` on /auth/callback. */
export function redirectParamFromLocation() {
  if (typeof window === 'undefined') return null
  return sanitizeAuthRedirect(searchParam('redirect') || searchParam('next'))
}

export function currentAuthRedirectPath(extra?: AuthRedirectParams) {
  if (typeof window === 'undefined') {
    return extra ? mergeQueryIntoPath('/', extra) : '/'
  }
  const fromAuthPage = redirectParamFromLocation()
  if (fromAuthPage && !extra) return fromAuthPage
  const path = `${window.location.pathname}${window.location.search}${window.location.hash}`
  if (isAuthAppPath(path)) {
    return extra
      ? sanitizeAuthRedirect(mergeQueryIntoPath(fromAuthPage || '/', extra)) ||
          '/'
      : fromAuthPage || '/'
  }
  const merged = extra ? mergeQueryIntoPath(path, extra) : path
  return sanitizeAuthRedirect(merged) || fromAuthPage || '/'
}

/** Where Google / /signin should send the user after auth. */
export function resolveAuthRedirect(path?: string | null) {
  return (
    sanitizeAuthRedirect(path) ||
    redirectParamFromLocation() ||
    currentAuthRedirectPath()
  )
}

export function signInPageHref(returnPath?: string) {
  const next = sanitizeAuthRedirect(returnPath) || resolveAuthRedirect()
  return `/signin?redirect=${encodeURIComponent(next)}`
}

/** Google OAuth return URL for this tab: localhost in dev, the live origin in prod. */
export function getAuthCallbackUrl() {
  if (typeof window === 'undefined') return undefined
  return `${window.location.origin}/auth/callback`
}

function readStoredAuthRedirect() {
  if (typeof window === 'undefined') return null
  const fromSession = sanitizeAuthRedirect(
    window.sessionStorage.getItem(AUTH_REDIRECT_KEY)
  )
  if (fromSession) return fromSession
  try {
    const raw = window.localStorage.getItem(AUTH_REDIRECT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { path?: unknown; at?: unknown }
    if (typeof parsed === 'string') {
      return sanitizeAuthRedirect(parsed)
    }
    if (typeof parsed?.path !== 'string' || typeof parsed?.at !== 'number') {
      return null
    }
    if (Date.now() - parsed.at > AUTH_REDIRECT_MAX_AGE_MS) return null
    return sanitizeAuthRedirect(parsed.path)
  } catch {
    return null
  }
}

export function setAuthRedirect(path: string | undefined | null) {
  if (typeof window === 'undefined') return
  const next = sanitizeAuthRedirect(path)
  if (!next) {
    clearAuthRedirect()
    return
  }
  window.sessionStorage.setItem(AUTH_REDIRECT_KEY, next)
  try {
    window.localStorage.setItem(
      AUTH_REDIRECT_KEY,
      JSON.stringify({ path: next, at: Date.now() })
    )
  } catch {
    // Private mode can block localStorage; sessionStorage is enough in-tab.
  }
}

export function clearAuthRedirect() {
  if (typeof window === 'undefined') return
  window.sessionStorage.removeItem(AUTH_REDIRECT_KEY)
  try {
    window.localStorage.removeItem(AUTH_REDIRECT_KEY)
  } catch {
    // ignore
  }
}

export function peekAuthRedirect() {
  return readStoredAuthRedirect()
}

export function takeAuthRedirect() {
  const path = readStoredAuthRedirect()
  clearAuthRedirect()
  return path
}

export function readCallbackAuthRedirect() {
  if (typeof window === 'undefined') return null
  return sanitizeAuthRedirect(searchParam('next')) || readStoredAuthRedirect()
}
