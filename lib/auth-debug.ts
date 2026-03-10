type AuthDebugPayload = Record<string, unknown>

export interface AuthDebugEntry {
  at: string
  label: string
  payload: AuthDebugPayload
}

function isEnabled(): boolean {
  if (typeof window === 'undefined') return false
  const search = new URLSearchParams(window.location.search)
  return search.get('authDebug') === '1' || window.localStorage.getItem('authDebug') === '1'
}

export function authDebug(label: string, payload: AuthDebugPayload = {}): void {
  if (!isEnabled() || typeof window === 'undefined') return
  const entry: AuthDebugEntry = {
    at: new Date().toISOString(),
    label,
    payload
  }
  const current = window.__authDebugEntries || []
  window.__authDebugEntries = [...current.slice(-199), entry]
  window.dispatchEvent(new CustomEvent('auth-debug-update'))
  // keep console noise scoped to debug mode
  console.log('[auth-debug]', entry)
}

export function subscribeAuthDebug(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => undefined
  window.addEventListener('auth-debug-update', callback)
  return () => window.removeEventListener('auth-debug-update', callback)
}

export function getAuthDebugEntries(): AuthDebugEntry[] {
  if (typeof window === 'undefined') return []
  return window.__authDebugEntries || []
}

export function clearAuthDebugEntries(): void {
  if (typeof window === 'undefined') return
  window.__authDebugEntries = []
  window.dispatchEvent(new CustomEvent('auth-debug-update'))
}
