import type { User } from '@supabase/supabase-js'

export type { User }

export interface Profile {
  id: string
  user_id: string
  display_name: string | null
  avatar_url: string | null
  /** Optional; added by migration 025 for Community display. */
  email?: string | null
  /** Optional; display-only until karma rules land (see lib/karma.ts). */
  karma_score?: number
  created_at: string
  updated_at: string
}

export interface AuthState {
  user: User | null
  profile: Profile | null
  isLoading: boolean
  error: string | null
  signInWithGoogle: (nextPath?: string) => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}
