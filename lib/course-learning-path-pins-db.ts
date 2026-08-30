/**
 * Per-user pinned course learning paths (header dropdown + syllabus nav).
 */
import { getSupabaseClient } from './supabase'

const PINS_CHANGED_EVENT = 'ct:course-learning-path-pins-changed'

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isCourseLearningPathPinId(id: string | undefined | null): boolean {
  return Boolean(id && UUID_RE.test(id))
}

export interface PinnedCourseLearningPath {
  pinId: string
  courseId: string
  slug: string
  title: string
}

export function notifyCourseLearningPathPinsChanged() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(PINS_CHANGED_EVENT))
}

export function subscribeCourseLearningPathPins(listener: () => void): () => void {
  if (typeof window === 'undefined') {
    return () => undefined
  }
  window.addEventListener(PINS_CHANGED_EVENT, listener)
  return () => window.removeEventListener(PINS_CHANGED_EVENT, listener)
}

function pathForSlug(slug: string): string {
  return `/learning-path/${slug}`
}

type PathJoin = { id: string; slug: string; title: string; kind?: string }

function unwrapPath(value: PathJoin | PathJoin[] | null | undefined): PathJoin | null {
  if (!value) return null
  return Array.isArray(value) ? value[0] ?? null : value
}

/** Current user's pinned course learning paths, newest first. */
export async function listMyCourseLearningPathPins(): Promise<
  PinnedCourseLearningPath[]
> {
  const supabase = getSupabaseClient()
  if (!supabase) return []
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return []

  const fromPaths = await supabase
    .from('learning_path_pins')
    .select('id, path_id, learning_paths!path_id ( id, slug, title, kind )')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (!fromPaths.error && Array.isArray(fromPaths.data)) {
    const rows: PinnedCourseLearningPath[] = []
    for (const row of fromPaths.data as Array<{
      id: string
      path_id: string
      learning_paths: PathJoin | PathJoin[] | null
    }>) {
      const path = unwrapPath(row.learning_paths)
      if (!path?.slug || !path.title) continue
      if (path.kind && path.kind !== 'course') continue
      rows.push({
        pinId: row.id,
        courseId: path.id,
        slug: path.slug,
        title: path.title
      })
    }
    return rows
  }

  const { data, error } = await supabase
    .from('curated_course_pins')
    .select('id, course_id, curated_courses!course_id ( id, slug, title )')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error || !data) {
    if (error) console.error('listMyCourseLearningPathPins failed', error)
    return []
  }

  const rows: PinnedCourseLearningPath[] = []
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

export function courseLearningPathHref(slug: string): string {
  return pathForSlug(slug)
}

export async function isCourseLearningPathPinned(
  courseId: string
): Promise<boolean> {
  if (!isCourseLearningPathPinId(courseId)) return false
  const supabase = getSupabaseClient()
  if (!supabase) return false
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return false

  const fromPaths = await supabase
    .from('learning_path_pins')
    .select('id')
    .eq('user_id', user.id)
    .eq('path_id', courseId)
    .maybeSingle()
  if (!fromPaths.error) return Boolean(fromPaths.data)

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
export async function setCourseLearningPathPinned(
  courseId: string,
  pinned: boolean
): Promise<boolean | null> {
  if (!isCourseLearningPathPinId(courseId)) return null
  const supabase = getSupabaseClient()
  if (!supabase) return null
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return null

  if (pinned) {
    const insertPath = await supabase.from('learning_path_pins').insert({
      user_id: user.id,
      path_id: courseId
    })
    if (!insertPath.error || insertPath.error.code === '23505') {
      notifyCourseLearningPathPinsChanged()
      return pinned
    }
    const { error } = await supabase.from('curated_course_pins').insert({
      user_id: user.id,
      course_id: courseId
    })
    if (error && error.code !== '23505') {
      console.error('setCourseLearningPathPinned insert failed', error)
      return null
    }
  } else {
    const deletePath = await supabase
      .from('learning_path_pins')
      .delete()
      .eq('user_id', user.id)
      .eq('path_id', courseId)
    if (deletePath.error) {
      const { error } = await supabase
        .from('curated_course_pins')
        .delete()
        .eq('user_id', user.id)
        .eq('course_id', courseId)
      if (error) {
        console.error('setCourseLearningPathPinned delete failed', error)
        return null
      }
    }
  }

  notifyCourseLearningPathPinsChanged()
  return pinned
}
