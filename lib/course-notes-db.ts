/**
 * TipTap notes for Notion database courses (`course_notes`).
 * Falls back to localStorage when the user is signed out or Supabase is unavailable.
 */
import {
  NOTEBOOK_EMPTY_DOC,
  type NotebookDocJson
} from './notebook-editor-default'
import { getSupabaseClient } from './supabase'

function localKey(courseId: string): string {
  return `course-notes:${courseId}`
}

function readLocal(courseId: string): NotebookDocJson | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(localKey(courseId))
    if (!raw) return null
    const parsed = JSON.parse(raw) as NotebookDocJson
    if (!parsed || typeof parsed !== 'object') return null
    return parsed
  } catch {
    return null
  }
}

function writeLocal(courseId: string, content: NotebookDocJson): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(localKey(courseId), JSON.stringify(content))
  } catch {
    /* quota / private mode */
  }
}

export async function getCourseNote(
  courseId: string
): Promise<NotebookDocJson> {
  const empty = NOTEBOOK_EMPTY_DOC as unknown as NotebookDocJson
  if (!courseId) return empty

  const supabase = getSupabaseClient()
  if (supabase) {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (user) {
      const { data, error } = await supabase
        .from('course_notes')
        .select('content')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .maybeSingle()

      if (!error && data?.content && typeof data.content === 'object') {
        return data.content as NotebookDocJson
      }
    }
  }

  return readLocal(courseId) ?? empty
}

export async function saveCourseNote(
  courseId: string,
  content: NotebookDocJson
): Promise<boolean> {
  if (!courseId) return false

  writeLocal(courseId, content)

  const supabase = getSupabaseClient()
  if (!supabase) return true

  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return true

  const { error } = await supabase.from('course_notes').upsert(
    {
      user_id: user.id,
      course_id: courseId,
      content,
      updated_at: new Date().toISOString()
    },
    { onConflict: 'user_id,course_id' }
  )

  if (error) {
    console.error('saveCourseNote failed', error)
    return false
  }
  return true
}
