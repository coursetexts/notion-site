/**
 * Per-course explored syllabus nodes.
 * localStorage only — same signed-out fallback as course learning path notes.
 */

function storageKey(courseSlug: string): string {
  return `curated-course-explored:${courseSlug}`
}

export function readCourseLearningPathExplored(courseSlug: string): Set<string> {
  if (typeof window === 'undefined' || !courseSlug) return new Set()
  try {
    const raw = window.localStorage.getItem(storageKey(courseSlug))
    if (!raw) return new Set()
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return new Set()
    return new Set(
      parsed.filter((id): id is string => typeof id === 'string' && id.length > 0)
    )
  } catch {
    return new Set()
  }
}

export function writeCourseLearningPathExplored(
  courseSlug: string,
  ids: Set<string>
): void {
  if (typeof window === 'undefined' || !courseSlug) return
  try {
    window.localStorage.setItem(
      storageKey(courseSlug),
      JSON.stringify([...ids])
    )
  } catch {
    /* quota / private mode */
  }
}
