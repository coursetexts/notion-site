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
         */
        lock: processLock,
        lockAcquireTimeout: -1
      }
      // `lock` / negative timeout: types may lag auth-js; keep cast narrow.
    } as Parameters<typeof createClient>[2])
  }
  return browserClient
}
