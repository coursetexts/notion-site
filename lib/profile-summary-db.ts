import { getSupabaseClient } from './supabase'

const MAX_LEN = 500

export type ProfileSummary = {
  bio: string | null
  learning_now: string | null
  learning_learned: string | null
}

const EMPTY_SUMMARY: ProfileSummary = {
  bio: null,
  learning_now: null,
  learning_learned: null
}

function trimField(value: string | null | undefined): string | null {
  const trimmed = (value ?? '').trim().slice(0, MAX_LEN)
  return trimmed || null
}

export async function getProfileSummaryByUserId(
  userId: string
): Promise<ProfileSummary> {
  const supabase = getSupabaseClient()
  if (!supabase) return EMPTY_SUMMARY
  const { data, error } = await supabase
    .from('profiles')
    .select('bio, learning_now, learning_learned')
    .eq('user_id', userId)
    .maybeSingle()
  if (error || !data) return EMPTY_SUMMARY
  const row = data as ProfileSummary
  return {
    bio: row.bio?.trim() || null,
    learning_now: row.learning_now?.trim() || null,
    learning_learned: row.learning_learned?.trim() || null
  }
}

/** Updates public profile summary fields for the signed-in owner. */
export async function updateOwnProfileSummary(
  userId: string,
  input: {
    bio?: string | null
    learning_now?: string | null
    learning_learned?: string | null
  }
): Promise<boolean> {
  const supabase = getSupabaseClient()
  if (!supabase) return false
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user || user.id !== userId) return false

  const patch: Record<string, string | null> = {}
  if ('bio' in input) patch.bio = trimField(input.bio)
  if ('learning_now' in input) patch.learning_now = trimField(input.learning_now)
  if ('learning_learned' in input) {
    patch.learning_learned = trimField(input.learning_learned)
  }

  const { error } = await supabase
    .from('profiles')
    .update(patch)
    .eq('user_id', userId)
  return !error
}
