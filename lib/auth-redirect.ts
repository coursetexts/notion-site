const AUTH_REDIRECT_KEY = 'coursetexts.authRedirect'

export function isSafeAuthRedirect(path: string) {
  return path.startsWith('/') && !path.startsWith('//') && !path.includes('\\')
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
