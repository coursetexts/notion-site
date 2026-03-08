import React from 'react'
import { clearCachedAuth, getCachedAuth, subscribeToAuthCache } from '@/lib/auth-cache'
import {
  clearAuthDebugEntries,
  getAuthDebugEntries,
  subscribeAuthDebug
} from '@/lib/auth-debug'

function isEnabled(): boolean {
  if (typeof window === 'undefined') return false
  const search = new URLSearchParams(window.location.search)
  return search.get('authDebug') === '1' || window.localStorage.getItem('authDebug') === '1'
}

export const AuthDebugPanel: React.FC = () => {
  const [enabled, setEnabled] = React.useState(false)
  const [entries, setEntries] = React.useState(() => getAuthDebugEntries())
  const [cache, setCache] = React.useState(() => getCachedAuth())

  React.useEffect(() => {
    setEnabled(isEnabled())
    if (!isEnabled()) return
    const unsubDebug = subscribeAuthDebug(() => setEntries(getAuthDebugEntries()))
    const unsubCache = subscribeToAuthCache(() => setCache(getCachedAuth()))
    return () => {
      unsubDebug()
      unsubCache()
    }
  }, [])

  if (!enabled) return null

  return (
    <div
      style={{
        position: 'fixed',
        right: 8,
        bottom: 8,
        width: 420,
        maxWidth: '90vw',
        maxHeight: '45vh',
        overflow: 'auto',
        background: 'rgba(17, 24, 39, 0.95)',
        color: '#e5e7eb',
        border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: 8,
        padding: 10,
        fontSize: 12,
        zIndex: 99999,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <strong>Auth Debug</strong>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            type="button"
            onClick={() => {
              clearAuthDebugEntries()
              setEntries([])
            }}
            style={{ fontSize: 11 }}
          >
            clear logs
          </button>
          <button
            type="button"
            onClick={() => {
              clearCachedAuth()
              setCache(getCachedAuth())
            }}
            style={{ fontSize: 11 }}
          >
            clear cache
          </button>
        </div>
      </div>
      <div style={{ marginBottom: 8 }}>
        cache.user: {cache.user?.id ?? 'null'}
      </div>
      {entries.slice(-20).reverse().map((e, idx) => (
        <div key={`${e.at}-${idx}`} style={{ marginBottom: 8, whiteSpace: 'pre-wrap' }}>
          <div style={{ color: '#93c5fd' }}>
            {e.at} · {e.label}
          </div>
          <div>{JSON.stringify(e.payload)}</div>
        </div>
      ))}
    </div>
  )
}
