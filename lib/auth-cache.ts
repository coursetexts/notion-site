/**
 * Module-level auth cache so user state persists across AuthProvider remounts
 * and across React roots (e.g. header in notion-x tree, course content in createRoot).
 * Ensures consistent auth context throughout the app until sign out.
 */

import type { User } from '@supabase/supabase-js'
import type { Profile } from './supabase-types'

const AUTH_CACHE_EVENT = 'auth-cache-update'

let cachedUser: User | null = null
let cachedProfile: Profile | null = null

export function getCachedAuth(): { user: User | null; profile: Profile | null } {
  return { user: cachedUser, profile: cachedProfile }
}

export function setCachedAuth(user: User | null, profile: Profile | null): void {
  cachedUser = user
  cachedProfile = profile
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(AUTH_CACHE_EVENT))
  }
}

export function clearCachedAuth(): void {
  cachedUser = null
  cachedProfile = null
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(AUTH_CACHE_EVENT))
  }
}

/** Subscribe to cache updates (e.g. for components in a different React root). */
export function subscribeToAuthCache(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener(AUTH_CACHE_EVENT, callback)
  return () => window.removeEventListener(AUTH_CACHE_EVENT, callback)
}
