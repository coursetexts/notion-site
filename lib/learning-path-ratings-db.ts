/**
 * Topic / path ratings after completion. Signed-in rows go to Supabase
 * (migration 038). Always mirrored in localStorage.
 */
import { getCachedAuth } from '@/lib/auth-cache'
import {
  type LearningPathRating,
  saveLocalLearningPathRating
} from '@/lib/learning-path-ratings'
import { getSupabaseClient } from '@/lib/supabase'

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function isUuid(id: string | null | undefined): id is string {
  return Boolean(id && UUID_RE.test(id))
}

function tableMissing(error: { code?: string; message?: string } | null) {
  if (!error) return false
  return (
    error.code === '42P01' ||
    error.code === 'PGRST205' ||
    /learning_path_ratings/i.test(error.message || '')
  )
}

export async function submitLearningPathRating(
  input: LearningPathRating
): Promise<void> {
  const rating = Math.round(input.rating)
  if (rating < 0 || rating > 100) return
  const saved: LearningPathRating = {
    ...input,
    rating,
    durationMs: Math.max(0, Math.round(input.durationMs))
  }
  saveLocalLearningPathRating(saved)

  const supabase = getSupabaseClient()
  if (!supabase) return
  const {
    data: { user }
  } = await supabase.auth.getUser()
  const cached = getCachedAuth()
  const userId = user?.id || cached.user?.id
  if (!userId) return

  const { error } = await supabase.from('learning_path_ratings').upsert(
    {
      user_id: userId,
      path_id: isUuid(saved.pathId) ? saved.pathId : null,
      path_slug: saved.pathSlug,
      target_type: saved.targetType,
      target_id: saved.targetId,
      target_title: saved.targetTitle,
      rating: saved.rating,
      duration_ms: saved.durationMs,
      updated_at: new Date().toISOString()
    },
    { onConflict: 'user_id,path_slug,target_type,target_id' }
  )
  if (error && !tableMissing(error)) {
    console.error('submitLearningPathRating failed', error)
  }
}
