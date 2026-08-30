/**
 * TipTap notes for syllabus nodes. Stored in learning_path_user_state.notes
 * keyed by node id. Falls back to curated_course_notes, then localStorage.
 */
import {
  getLearningPathRecord,
  loadLearningPathUserState,
  saveLearningPathUserState
} from './learning-path-db'
import { NOTEBOOK_EMPTY_DOC, type NotebookDocJson } from './notebook-editor-default'
import { getSupabaseClient } from './supabase'

function localKey(courseSlug: string, nodeId: string): string {
  return `curated-course-notes:${courseSlug}:${nodeId}`
}

function parseNoteContent(value: unknown): NotebookDocJson | null {
  if (!value) return null
  if (typeof value === 'object') return value as NotebookDocJson
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  try {
    const parsed = JSON.parse(trimmed) as NotebookDocJson
    if (parsed && typeof parsed === 'object') return parsed
  } catch {
    return null
  }
  return null
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

async function loadNoteFromCuratedTable(
  nodeId: string
): Promise<NotebookDocJson | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data, error } = await supabase
    .from('curated_course_notes')
    .select('content')
    .eq('user_id', user.id)
    .eq('node_id', nodeId)
    .maybeSingle()
  if (error || !data?.content || typeof data.content !== 'object') return null
  return data.content as NotebookDocJson
}

/** Load note content for a syllabus node (DB if signed in, else localStorage). */
export async function getCourseLearningPathNote(
  nodeId: string,
  courseSlug: string
): Promise<NotebookDocJson> {
  const empty = NOTEBOOK_EMPTY_DOC as unknown as NotebookDocJson
  if (!nodeId) return empty

  const record = courseSlug ? await getLearningPathRecord(courseSlug) : null
  if (record?.id) {
    const state = await loadLearningPathUserState(record.id, courseSlug)
    const fromState = parseNoteContent(state.notes[nodeId])
    if (fromState) return fromState
  }

  const fromCurated = await loadNoteFromCuratedTable(nodeId)
  if (fromCurated) return fromCurated

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

  const record = courseSlug ? await getLearningPathRecord(courseSlug) : null
  if (record?.id) {
    const state = await loadLearningPathUserState(record.id, courseSlug)
    const next = {
      ...state,
      notes: {
        ...state.notes,
        [nodeId]: JSON.stringify(content)
      }
    }
    const savedId = await saveLearningPathUserState(record.id, courseSlug, next)
    return Boolean(savedId)
  }

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
