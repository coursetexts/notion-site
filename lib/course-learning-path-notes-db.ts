/**
 * TipTap notes for course learning path nodes (`curated_course_notes`).
 * Falls back to localStorage when the user is signed out or Supabase is unavailable.
 */
import { NOTEBOOK_EMPTY_DOC, type NotebookDocJson } from './notebook-editor-default'
import { getSupabaseClient } from './supabase'

function localKey(courseSlug: string, nodeId: string): string {
  return `curated-course-notes:${courseSlug}:${nodeId}`
}

function readLocal(
  courseSlug: string,
  nodeId: string
): NotebookDocJson | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(localKey(courseSlug, nodeId))
    if (!raw) return null
    const parsed = JSON.parse(raw) as NotebookDocJson
    if (!parsed || typeof parsed !== 'object') return null
    return parsed
  } catch {
    return null
  }
}

function writeLocal(
  courseSlug: string,
  nodeId: string,
  content: NotebookDocJson
): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(
      localKey(courseSlug, nodeId),
      JSON.stringify(content)
    )
  } catch {
    /* quota / private mode */
  }
}

export function cacheCourseLearningPathNote(
  courseSlug: string,
  nodeId: string,
  content: NotebookDocJson
): void {
  if (!nodeId) return
  writeLocal(courseSlug, nodeId, content)
}

/** Load note content for a syllabus node (DB if signed in, else localStorage). */
export async function getCourseLearningPathNote(
  nodeId: string,
  courseSlug: string
): Promise<NotebookDocJson> {
  const empty = NOTEBOOK_EMPTY_DOC as unknown as NotebookDocJson
  if (!nodeId) return empty

  const supabase = getSupabaseClient()
  if (supabase) {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (user) {
      const { data, error } = await supabase
        .from('curated_course_notes')
        .select('content')
        .eq('user_id', user.id)
        .eq('node_id', nodeId)
        .maybeSingle()

      if (!error && data?.content && typeof data.content === 'object') {
        return data.content as NotebookDocJson
      }
    }
  }

  return readLocal(courseSlug, nodeId) ?? empty
}

/** Persist note content (DB upsert when signed in; always mirrors to localStorage). */
export async function saveCourseLearningPathNote(
  nodeId: string,
  courseSlug: string,
  content: NotebookDocJson
): Promise<boolean> {
  if (!nodeId) return false

  writeLocal(courseSlug, nodeId, content)

  const supabase = getSupabaseClient()
  if (!supabase) return true

  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return true

  const { error } = await supabase.from('curated_course_notes').upsert(
    {
      user_id: user.id,
      node_id: nodeId,
      course_slug: courseSlug || null,
      content,
      updated_at: new Date().toISOString()
    },
    { onConflict: 'user_id,node_id' }
  )

  if (error) {
    console.error('saveCourseLearningPathNote failed', error)
    return false
  }
  return true
}
