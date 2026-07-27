/**
 * Subscribe / unsubscribe to a course Community Wall (for profile feed updates).
 */
import { getOrCreateCourse } from '@/lib/course-activity-db'
import { getSupabaseClient } from '@/lib/supabase'

export async function getCommunityWallSubscribed(
  coursePageId: string
): Promise<boolean> {
  const supabase = getSupabaseClient()
  if (!supabase || !coursePageId) return false
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return false
  const { data } = await supabase
    .from('community_wall_subscriptions')
    .select('course_id')
    .eq('subscriber_id', user.id)
    .eq('course_id', coursePageId)
    .maybeSingle()
  return !!data
}

/**
 * Ensures the course row exists, then subscribes or unsubscribes the current user.
 */
export async function setCommunityWallSubscribed(
  coursePageId: string,
  courseTitle: string,
  courseUrl: string | undefined,
  subscribed: boolean
): Promise<boolean> {
  const supabase = getSupabaseClient()
  if (!supabase || !coursePageId) return false
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return false

  const created = await getOrCreateCourse(coursePageId, courseTitle, courseUrl)
  if (!created) return false

  if (subscribed) {
    const { error } = await supabase.from('community_wall_subscriptions').upsert(
      { subscriber_id: user.id, course_id: coursePageId },
      { onConflict: 'subscriber_id,course_id' }
    )
    return !error
  }

  const { error } = await supabase
    .from('community_wall_subscriptions')
    .delete()
    .eq('subscriber_id', user.id)
    .eq('course_id', coursePageId)
  return !error
}
