const AUTH_REDIRECT_KEY = 'coursetexts.authRedirect'

export function isSafeAuthRedirect(path: string) {
  return path.startsWith('/') && !path.startsWith('//') && !path.includes('\\')
}

export function currentAuthRedirectPath() {
  if (typeof window === 'undefined') return '/'
  return `${window.location.pathname}${window.location.search}`
}

/** Google OAuth return URL for this tab: localhost in dev, the live origin in prod. */
export function getAuthCallbackUrl() {
  if (typeof window === 'undefined') return undefined
  return `${window.location.origin}/auth/callback`
}

export function setAuthRedirect(path: string | undefined | null) {
  if (typeof window === 'undefined') return
  if (!path || !isSafeAuthRedirect(path)) {
    window.sessionStorage.removeItem(AUTH_REDIRECT_KEY)
    return
  }
  window.sessionStorage.setItem(AUTH_REDIRECT_KEY, path)
}

export function takeAuthRedirect() {
  if (typeof window === 'undefined') return null
  const path = window.sessionStorage.getItem(AUTH_REDIRECT_KEY)
  window.sessionStorage.removeItem(AUTH_REDIRECT_KEY)
  if (!path || !isSafeAuthRedirect(path)) return null
  return path
}
