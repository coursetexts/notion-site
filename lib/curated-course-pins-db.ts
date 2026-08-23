/**
 * Per-user pinned curated courses (header dropdown + syllabus nav).
 */
import { getSupabaseClient } from './supabase'

const PINS_CHANGED_EVENT = 'ct:curated-course-pins-changed'

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isCuratedCoursePinId(id: string | undefined | null): boolean {
  return Boolean(id && UUID_RE.test(id))
}

export interface PinnedCuratedCourse {
  pinId: string
  courseId: string
  slug: string
  title: string
}

export function notifyCuratedCoursePinsChanged() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(PINS_CHANGED_EVENT))
}

export function subscribeCuratedCoursePins(listener: () => void): () => void {
  if (typeof window === 'undefined') {
    return () => undefined
  }
  window.addEventListener(PINS_CHANGED_EVENT, listener)
  return () => window.removeEventListener(PINS_CHANGED_EVENT, listener)
}

function pathForSlug(slug: string): string {
  return `/curated-course/${slug}`
}

/** Current user's pinned curated courses, newest first. */
export async function listMyCuratedCoursePins(): Promise<
  PinnedCuratedCourse[]
> {
  const supabase = getSupabaseClient()
  if (!supabase) return []
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('curated_course_pins')
    .select('id, course_id, curated_courses!course_id ( id, slug, title )')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error || !data) {
    if (error) console.error('listMyCuratedCoursePins failed', error)
    return []
  }

  const rows: PinnedCuratedCourse[] = []
  for (const row of data as Array<{
    id: string
    course_id: string
    curated_courses:
      | { id: string; slug: string; title: string }
      | { id: string; slug: string; title: string }[]
      | null
  }>) {
    const course = Array.isArray(row.curated_courses)
      ? row.curated_courses[0]
      : row.curated_courses
    if (!course?.slug || !course.title) continue
    rows.push({
      pinId: row.id,
      courseId: course.id,
      slug: course.slug,
      title: course.title
    })
  }
  return rows
}

export function curatedCoursePath(slug: string): string {
  return pathForSlug(slug)
}

export async function isCuratedCoursePinned(
  courseId: string
): Promise<boolean> {
  if (!isCuratedCoursePinId(courseId)) return false
  const supabase = getSupabaseClient()
  if (!supabase) return false
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return false

  const { data, error } = await supabase
    .from('curated_course_pins')
    .select('id')
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .maybeSingle()
  if (error) return false
  return Boolean(data)
}

/** Pin or unpin. Returns the resulting pinned state, or null on failure. */
export async function setCuratedCoursePinned(
  courseId: string,
  pinned: boolean
): Promise<boolean | null> {
  if (!isCuratedCoursePinId(courseId)) return null
  const supabase = getSupabaseClient()
  if (!supabase) return null
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return null

  if (pinned) {
    const { error } = await supabase.from('curated_course_pins').insert({
      user_id: user.id,
      course_id: courseId
    })
    if (error && error.code !== '23505') {
      console.error('setCuratedCoursePinned insert failed', error)
      return null
    }
  } else {
    const { error } = await supabase
      .from('curated_course_pins')
      .delete()
      .eq('user_id', user.id)
      .eq('course_id', courseId)
    if (error) {
      console.error('setCuratedCoursePinned delete failed', error)
      return null
    }
  }

  notifyCuratedCoursePinsChanged()
  return pinned
}
