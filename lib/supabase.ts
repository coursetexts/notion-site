import { createClient, SupabaseClient } from '@supabase/supabase-js'

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
    browserClient = createClient(supabaseUrl, supabaseAnonKey)
  }
  return browserClient
}
