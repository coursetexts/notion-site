import type { User } from '@supabase/supabase-js'

export type { User }

export interface Profile {
  id: string
  user_id: string
  display_name: string | null
  avatar_url: string | null
  /** Shown next to usernames; how it changes is TBD (see lib/karma.ts). */
  karma_score?: number
  created_at: string
  updated_at: string
}

export interface AuthState {
  user: User | null
  profile: Profile | null
  isLoading: boolean
  error: string | null
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}
