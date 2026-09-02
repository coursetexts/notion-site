import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Service-role client for server routes (cron, ingest). Bypasses RLS.
 * Never import this from client components.
 */
export function getSupabaseAdmin(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  })
}
