/**
 * Private topic notes for the signed-in user: Notion course_notes plus
 * learning_path_user_state (and leftover curated_course_notes).
 */
import { getCachedAuth } from '@/lib/auth-cache'
import { saveCourseLearningPathNote } from '@/lib/course-learning-path-notes-db'
import { saveCourseNote } from '@/lib/course-notes-db'
import {
  type NotebookDocJson,
  isNotebookDocEmpty,
  notebookDocPlainText,
  parseStoredNotebookNote
} from '@/lib/notebook-editor-default'
import { topicNoteOpenHref } from '@/lib/note-deep-link'
import {
  SEEDED_LEARNING_PATHS_BY_SLUG,
  readStoredLearningPaths
} from '@/lib/learning-path-seed'
import { getSupabaseClient } from '@/lib/supabase'

const USER_STATE_KEY_PREFIX = 'coursetexts.learning-path-user-state:'
const SNIPPET_MAX = 100

export type ProfileTopicNote = {
  id: string
  topicLabel: string
  sourceTitle: string
  sourceHref: string | null
  sourceKind: 'course' | 'path'
  snippet: string
  content: NotebookDocJson
  updatedAt: string
  topicId: string
  courseId?: string
  pathSlug?: string
  nodeId?: string
}

function tableMissing(error: { code?: string; message?: string } | null) {
  if (!error) return false
  return (
    error.code === '42P01' ||
    error.code === 'PGRST205' ||
    /schema cache|does not exist/i.test(error.message || '')
  )
}

function snippetFromDoc(doc: NotebookDocJson): string {
  const text = notebookDocPlainText(doc)
  if (!text) return 'Untitled note'
  if (text.length <= SNIPPET_MAX) return text
  return `${text.slice(0, SNIPPET_MAX - 1).trim()}…`
}

function formatCourseTopicLabel(topicId: string): string {
  const parts = topicId
    .split('::')
    .map((part) => part.trim())
    .filter(Boolean)
  if (parts.length === 0) return 'Course notes'
  return parts.join(' · ')
}

function topicLabelFromPathData(data: unknown, nodeId: string): string | null {
  if (!data || typeof data !== 'object') return null
  const row = data as Record<string, unknown>
  if (Array.isArray(row.nodes)) {
    for (const node of row.nodes) {
      if (!node || typeof node !== 'object') continue
      const item = node as { id?: unknown; label?: unknown }
      if (item.id === nodeId && typeof item.label === 'string') {
        const label = item.label.trim()
        if (label) return label
      }
    }
  }
  function walkTopics(nodes: unknown): string | null {
    if (!Array.isArray(nodes)) return null
    for (const node of nodes) {
      if (!node || typeof node !== 'object') continue
      const item = node as {
        id?: unknown
        title?: unknown
        children?: unknown
      }
      if (item.id === nodeId && typeof item.title === 'string') {
        const title = item.title.trim()
        if (title) return title
      }
      const nested = walkTopics(item.children)
      if (nested) return nested
    }
    return null
  }
  return walkTopics(row.topics)
}

function pathTitleFallback(slug: string, title?: string | null): string {
  const named = (title || '').trim()
  if (named) return named
  const seeded = SEEDED_LEARNING_PATHS_BY_SLUG[slug]
  if (seeded?.title) return seeded.title
  const stored = readStoredLearningPaths().find((path) => path.slug === slug)
  return stored?.data?.title || 'Learning path'
}

function noteFromContent(input: {
  id: string
  topicLabel: string
  sourceTitle: string
  sourceKind: 'course' | 'path'
  content: NotebookDocJson
  updatedAt: string
  topicId: string
  courseId?: string
  pathSlug?: string
  nodeId?: string
}): ProfileTopicNote | null {
  if (isNotebookDocEmpty(input.content)) return null
  return {
    id: input.id,
    topicLabel: input.topicLabel,
    sourceTitle: input.sourceTitle,
    sourceHref: topicNoteOpenHref({
      sourceKind: input.sourceKind,
      courseId: input.courseId,
      pathSlug: input.pathSlug,
      topicId: input.topicId
    }),
    sourceKind: input.sourceKind,
    snippet: snippetFromDoc(input.content),
    content: input.content,
    updatedAt: input.updatedAt,
    topicId: input.topicId,
    courseId: input.courseId,
    pathSlug: input.pathSlug,
    nodeId: input.nodeId
  }
}

export function profileNoteAfterSave(
  note: ProfileTopicNote,
  content: NotebookDocJson
): ProfileTopicNote {
  return {
    ...note,
    content,
    snippet: snippetFromDoc(content),
    updatedAt: new Date().toISOString()
  }
}

export async function saveProfileTopicNote(
  note: ProfileTopicNote,
  content: NotebookDocJson
): Promise<boolean> {
  if (note.sourceKind === 'course' && note.courseId) {
    return saveCourseNote(note.courseId, content, note.topicId)
  }
  const slug = (note.pathSlug || '').trim()
  const nodeId = (note.nodeId || note.topicId || '').trim()
  if (slug && nodeId) {
    return saveCourseLearningPathNote(nodeId, slug, content)
  }
  return false
}

function parseNotesMap(notes: unknown): Record<string, string> {
  if (!notes || typeof notes !== 'object') return {}
  const out: Record<string, string> = {}
  for (const [key, value] of Object.entries(notes as Record<string, unknown>)) {
    if (typeof value === 'string') out[key] = value
    else if (value && typeof value === 'object') {
      try {
        out[key] = JSON.stringify(value)
      } catch {
        /* skip */
      }
    }
  }
  return out
}

async function listCourseNotes(): Promise<ProfileTopicNote[]> {
  const supabase = getSupabaseClient()
  if (!supabase) return []
  const { data, error } = await supabase
    .from('course_notes')
    .select('id, course_id, topic_id, content, updated_at')
    .order('updated_at', { ascending: false })
  if (error) {
    if (!tableMissing(error)) console.error('listCourseNotes failed', error)
    return []
  }
  const rows = (data || []) as Array<{
    id: string
    course_id: string
    topic_id: string | null
    content: unknown
    updated_at: string | null
  }>
  const courseIds = [
    ...new Set(rows.map((row) => row.course_id).filter(Boolean))
  ]
  const titles = new Map<string, string>()
  if (courseIds.length > 0) {
    const { data: courses } = await supabase
      .from('courses')
      .select('notion_page_id, name')
      .in('notion_page_id', courseIds)
    for (const course of courses || []) {
      const row = course as { notion_page_id?: string; name?: string | null }
      if (row.notion_page_id && row.name) titles.set(row.notion_page_id, row.name)
    }
  }
  const notes: ProfileTopicNote[] = []
  for (const row of rows) {
    const content =
      row.content && typeof row.content === 'object'
        ? (row.content as NotebookDocJson)
        : parseStoredNotebookNote(
            typeof row.content === 'string' ? row.content : null
          )
    const note = noteFromContent({
      id: `course:${row.id}`,
      topicLabel: formatCourseTopicLabel(row.topic_id || ''),
      sourceTitle: titles.get(row.course_id) || 'Course',
      sourceKind: 'course',
      content,
      updatedAt: row.updated_at || '',
      topicId: row.topic_id || '',
      courseId: row.course_id
    })
    if (note) notes.push(note)
  }
  return notes
}

async function listPathNotes(
  seen: Set<string>
): Promise<ProfileTopicNote[]> {
  const supabase = getSupabaseClient()
  if (!supabase) return []
  const { data, error } = await supabase
    .from('learning_path_user_state')
    .select('path_id, notes, updated_at')
    .order('updated_at', { ascending: false })
  if (error) {
    if (!tableMissing(error)) console.error('listPathNotes failed', error)
    return []
  }
  const rows = (data || []) as Array<{
    path_id?: string
    notes?: unknown
    updated_at?: string | null
  }>
  const pathIds = [
    ...new Set(rows.map((row) => row.path_id).filter((id): id is string => Boolean(id)))
  ]
  const pathById = new Map<
    string,
    { slug: string; title: string; data: unknown }
  >()
  if (pathIds.length > 0) {
    const { data: paths } = await supabase
      .from('learning_paths')
      .select('id, slug, title, data')
      .in('id', pathIds)
    for (const path of paths || []) {
      const row = path as {
        id?: string
        slug?: string
        title?: string
        data?: unknown
      }
      if (!row.id || !row.slug) continue
      pathById.set(row.id, {
        slug: row.slug,
        title: pathTitleFallback(row.slug, row.title),
        data: row.data
      })
    }
  }
  const notes: ProfileTopicNote[] = []
  for (const row of rows) {
    const path = row.path_id ? pathById.get(row.path_id) : undefined
    const slug = path?.slug || ''
    const title = path?.title || pathTitleFallback(slug)
    const map = parseNotesMap(row.notes)
    for (const [nodeId, rawNote] of Object.entries(map)) {
      const key = `path:${row.path_id || slug}:${nodeId}`
      if (seen.has(key)) continue
      const content = parseStoredNotebookNote(rawNote)
      const topicLabel =
        topicLabelFromPathData(path?.data, nodeId) || 'Topic'
      const note = noteFromContent({
        id: key,
        topicLabel,
        sourceTitle: title,
        sourceKind: 'path',
        content,
        updatedAt: row.updated_at || '',
        topicId: nodeId,
        pathSlug: slug,
        nodeId
      })
      if (!note) continue
      seen.add(key)
      notes.push(note)
    }
  }
  return notes
}

async function listCuratedNotes(
  seen: Set<string>
): Promise<ProfileTopicNote[]> {
  const supabase = getSupabaseClient()
  if (!supabase) return []
  const { data, error } = await supabase
    .from('curated_course_notes')
    .select('id, node_id, course_slug, content, updated_at')
    .order('updated_at', { ascending: false })
  if (error) {
    if (!tableMissing(error)) console.error('listCuratedNotes failed', error)
    return []
  }
  const slugs = [
    ...new Set(
      ((data || []) as Array<{ course_slug?: string | null }>)
        .map((row) => row.course_slug)
        .filter((slug): slug is string => Boolean(slug))
    )
  ]
  const pathBySlug = new Map<
    string,
    { title: string; data: unknown }
  >()
  if (slugs.length > 0) {
    const { data: paths } = await supabase
      .from('learning_paths')
      .select('slug, title, data')
      .in('slug', slugs)
    for (const path of paths || []) {
      const row = path as { slug?: string; title?: string; data?: unknown }
      if (!row.slug) continue
      pathBySlug.set(row.slug, {
        title: pathTitleFallback(row.slug, row.title),
        data: row.data
      })
    }
  }
  const notes: ProfileTopicNote[] = []
  for (const raw of data || []) {
    const row = raw as {
      id: string
      node_id: string
      course_slug: string | null
      content: unknown
      updated_at: string | null
    }
    const slug = row.course_slug || ''
    const key = `path:${slug}:${row.node_id}`
    if (seen.has(key)) continue
    const path = slug ? pathBySlug.get(slug) : undefined
    const content =
      row.content && typeof row.content === 'object'
        ? (row.content as NotebookDocJson)
        : parseStoredNotebookNote(
            typeof row.content === 'string' ? row.content : null
          )
    const note = noteFromContent({
      id: `curated:${row.id}`,
      topicLabel: topicLabelFromPathData(path?.data, row.node_id) || 'Topic',
      sourceTitle: path?.title || pathTitleFallback(slug),
      sourceKind: 'path',
      content,
      updatedAt: row.updated_at || '',
      topicId: row.node_id,
      pathSlug: slug,
      nodeId: row.node_id
    })
    if (!note) continue
    seen.add(key)
    notes.push(note)
  }
  return notes
}

function listLocalPathNotes(userId: string, seen: Set<string>): ProfileTopicNote[] {
  if (typeof window === 'undefined') return []
  const prefix = `${USER_STATE_KEY_PREFIX}${userId}:`
  const notes: ProfileTopicNote[] = []
  for (let i = 0; i < window.localStorage.length; i += 1) {
    const storageKey = window.localStorage.key(i)
    if (!storageKey || !storageKey.startsWith(prefix)) continue
    const slug = storageKey.slice(prefix.length)
    if (!slug) continue
    try {
      const parsed = JSON.parse(
        window.localStorage.getItem(storageKey) || ''
      ) as { notes?: unknown }
      const map = parseNotesMap(parsed.notes)
      const stored = readStoredLearningPaths().find((path) => path.slug === slug)
      const data = stored?.data || SEEDED_LEARNING_PATHS_BY_SLUG[slug] || null
      const title = pathTitleFallback(slug, stored?.data?.title)
      for (const [nodeId, rawNote] of Object.entries(map)) {
        const key = `path:${slug}:${nodeId}`
        if (seen.has(key)) continue
        const content = parseStoredNotebookNote(rawNote)
        const note = noteFromContent({
          id: key,
          topicLabel: topicLabelFromPathData(data, nodeId) || 'Topic',
          sourceTitle: title,
          sourceKind: 'path',
          content,
          updatedAt: '',
          topicId: nodeId,
          pathSlug: slug,
          nodeId
        })
        if (!note) continue
        seen.add(key)
        notes.push(note)
      }
    } catch {
      /* ignore */
    }
  }
  return notes
}

export async function listMyTopicNotes(): Promise<ProfileTopicNote[]> {
  const supabase = getSupabaseClient()
  const cached = getCachedAuth()
  const userId = cached.user?.id
  if (supabase) {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user?.id && !userId) return []
  } else if (!userId) {
    return []
  }
  const seen = new Set<string>()
  const courseNotes = await listCourseNotes()
  const pathNotes = await listPathNotes(seen)
  const curatedNotes = await listCuratedNotes(seen)
  const local = userId ? listLocalPathNotes(userId, seen) : []
  const all = [...courseNotes, ...pathNotes, ...curatedNotes, ...local]
  all.sort((a, b) => {
    if (a.updatedAt && b.updatedAt) return b.updatedAt.localeCompare(a.updatedAt)
    if (a.updatedAt) return -1
    if (b.updatedAt) return 1
    return a.topicLabel.localeCompare(b.topicLabel)
  })
  return all
}
