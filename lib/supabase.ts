import { processLock } from '@supabase/auth-js'
import { SupabaseClient, createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

let browserClient: SupabaseClient | null = null

/**
 * Browser Supabase client (singleton). Use only in client-side code.
 * Returns null if env vars are missing so the app can still render without Supabase.
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (typeof window === 'undefined') return null
  if (!supabaseUrl || !supabaseAnonKey) return null
  if (!browserClient) {
    browserClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        /**
         * Default `navigatorLock` can hit `AbortError: Lock broken by another
         * request with the 'steal' option` when auth races (Strict Mode, many
         * parallel `getUser`/`getSession` calls on profile). `processLock` uses an
         * in-process promise queue instead of `navigator.locks`, avoiding steal.
         *
         * supabase-js does not forward `lockAcquireTimeout` to GoTrueClient, so
         * it runs with the 5s default and bursts of queries (e.g. Community
         * page mount) throw ProcessLockAcquireTimeoutError. Enforce infinite
         * wait here instead. Keep an explicit 0 (auto-refresh tick) as-is: it
         * means "skip if busy" and its timeout error is handled internally.
         */
        lock: (name, acquireTimeout, fn) =>
          processLock(name, acquireTimeout === 0 ? 0 : -1, fn)
      }
    })
  }
  return browserClient
}
