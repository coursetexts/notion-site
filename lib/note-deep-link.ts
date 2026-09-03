import { learningPathHref } from '@/lib/learning-path-bookmark-link'

export function firstQueryParam(value: unknown): string {
  const raw = Array.isArray(value) ? value[0] : value
  return typeof raw === 'string' ? raw.trim() : ''
}

export function parseNotesPanelQuery(value: unknown): boolean {
  const raw = firstQueryParam(value).toLowerCase()
  return raw === '1' || raw === 'true' || raw === 'notes' || raw === 'open'
}

export function parseAnnotationsPanelQuery(value: unknown): boolean {
  const raw = firstQueryParam(value).toLowerCase()
  return (
    raw === '1' ||
    raw === 'true' ||
    raw === 'annotations' ||
    raw === 'annotate' ||
    raw === 'discussions' ||
    raw === 'discussion' ||
    raw === 'open'
  )
}

export function readSearchParam(name: string): string {
  if (typeof window === 'undefined') return ''
  return new URLSearchParams(window.location.search).get(name)?.trim() || ''
}

/** Update the current URL without a navigation. Keeps other query flags. */
export function replaceSearchParams(
  updates: Record<string, string | null | undefined>
) {
  if (typeof window === 'undefined') return
  const url = new URL(window.location.href)
  let changed = false
  for (const [key, value] of Object.entries(updates)) {
    const current = url.searchParams.get(key)
    if (value == null || value === '') {
      if (current != null) {
        url.searchParams.delete(key)
        changed = true
      }
      continue
    }
    if (current !== value) {
      url.searchParams.set(key, value)
      changed = true
    }
  }
  if (!changed) return
  const next = `${url.pathname}${url.search}${url.hash}`
  window.history.replaceState(window.history.state, '', next)
}

export function urlWantsNotesPanel(): boolean {
  return parseNotesPanelQuery(readSearchParam('notes'))
}

export function urlWantsAnnotationsPanel(): boolean {
  return (
    parseAnnotationsPanelQuery(readSearchParam('annotations')) ||
    parseAnnotationsPanelQuery(readSearchParam('discussions'))
  )
}

export function pathSlugFromCourseNotesId(courseId: string): string | null {
  const id = courseId.trim()
  if (id.startsWith('learning-path:')) {
    return id.slice('learning-path:'.length) || null
  }
  if (id.startsWith('course-learning-path:')) {
    return id.slice('course-learning-path:'.length) || null
  }
  return null
}

export function learningPathNoteHref(slug: string, nodeId: string): string {
  const params = new URLSearchParams()
  if (nodeId) params.set('node', nodeId)
  params.set('notes', '1')
  return `${learningPathHref(slug)}?${params.toString()}`
}

export function coursePageNoteHref(
  coursePageId: string,
  topicId: string
): string {
  const params = new URLSearchParams()
  if (topicId) params.set('topic', topicId)
  params.set('notes', '1')
  return `/course/${coursePageId}?${params.toString()}`
}

export function topicNoteOpenHref(input: {
  sourceKind: 'course' | 'path'
  courseId?: string
  pathSlug?: string
  topicId: string
}): string | null {
  const slug =
    (input.pathSlug || '').trim() ||
    pathSlugFromCourseNotesId(input.courseId || '')
  if (slug) return learningPathNoteHref(slug, input.topicId)
  const courseId = (input.courseId || '').trim()
  if (!courseId) return null
  return coursePageNoteHref(courseId, input.topicId)
}

export function courseTopicLabelFromKey(topicKey: string): string {
  const parts = topicKey
    .split('::')
    .map((part) => part.trim())
    .filter(Boolean)
  return parts[parts.length - 1] || ''
}
