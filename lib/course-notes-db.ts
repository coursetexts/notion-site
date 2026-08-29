/**
 * TipTap notes for Notion database courses (`course_notes`).
 * One document per course topic/tab. Falls back to localStorage when the user
 * is signed out or Supabase is unavailable.
 */
import {
  NOTEBOOK_EMPTY_DOC,
  type NotebookDocJson
} from './notebook-editor-default'
import { getSupabaseClient } from './supabase'

const TOPIC_ID_MAX = 200

function emptyDoc(): NotebookDocJson {
  return NOTEBOOK_EMPTY_DOC as unknown as NotebookDocJson
}

/** Stable key for a TOC tab, or parent::child for a sub-tab. */
export function courseNoteTopicKey(
  sectionLabel: string,
  parentLabel?: string | null
): string {
  const section = sectionLabel.trim()
  const parent = (parentLabel ?? '').trim()
  if (!section) return ''
  if (parent && parent !== section) {
    return `${parent}::${section}`.slice(0, TOPIC_ID_MAX)
  }
  return section.slice(0, TOPIC_ID_MAX)
}

function localKey(courseId: string, topicId: string): string {
  return topicId
    ? `course-notes:${courseId}:${topicId}`
    : `course-notes:${courseId}`
}

function readLocal(
  courseId: string,
  topicId: string
): NotebookDocJson | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(localKey(courseId, topicId))
    if (!raw) return null
    const parsed = JSON.parse(raw) as NotebookDocJson
    if (!parsed || typeof parsed !== 'object') return null
    return parsed
  } catch {
    return null
  }
}

function writeLocal(
  courseId: string,
  topicId: string,
  content: NotebookDocJson
): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(
      localKey(courseId, topicId),
      JSON.stringify(content)
    )
  } catch {
    /* quota / private mode */
  }
}

export function cacheCourseNote(
  courseId: string,
  content: NotebookDocJson,
  topicId = ''
): void {
  if (!courseId) return
  writeLocal(courseId, topicId.trim(), content)
}

async function fetchCourseNoteRow(
  courseId: string,
  topicId: string
): Promise<NotebookDocJson | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('course_notes')
    .select('content')
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .eq('topic_id', topicId)
    .maybeSingle()

  if (error || !data?.content || typeof data.content !== 'object') return null
  return data.content as NotebookDocJson
}

export async function getCourseNote(
  courseId: string,
  topicId = ''
): Promise<NotebookDocJson> {
  const empty = emptyDoc()
  if (!courseId) return empty
  const topic = topicId.trim()

  const fromDb = await fetchCourseNoteRow(courseId, topic)
  if (fromDb) return fromDb

  return readLocal(courseId, topic) ?? empty
}

export async function saveCourseNote(
  courseId: string,
  content: NotebookDocJson,
  topicId = ''
): Promise<boolean> {
  if (!courseId) return false
  const topic = topicId.trim()

  writeLocal(courseId, topic, content)

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
      topic_id: topic,
      content,
      updated_at: new Date().toISOString()
    },
    { onConflict: 'user_id,course_id,topic_id' }
  )

  if (error) {
    console.error('saveCourseNote failed', error)
    return false
  }
  return true
}
