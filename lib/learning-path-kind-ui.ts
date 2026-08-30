/**
 * Kind-specific chrome for the shared /learning-path/{slug} shell.
 * Official Notion courses are not a kind yet (they stay at /course/{pageId}).
 * When they migrate, add `official` here — kicker + outline slot only.
 */
import type { LearningPathKind } from '@/lib/learning-path-seed'

export function learningPathKicker(kind: LearningPathKind): string {
  switch (kind) {
    case 'course':
      return 'Course Learning Path'
    case 'research':
      return 'Research Learning Path'
    default:
      return 'Learning Path'
  }
}

export function learningPathOutlineHint(kind: LearningPathKind): string {
  if (kind === 'course') {
    return 'Hover a topic to see its children · click a node to read it'
  }
  return 'Hover a step to see its children · click a node to read it'
}

/** Profile Courses filter: `kind=course` syllabi. Official Notion pages are a separate list. */
export function isCourseKindPath(
  kind: LearningPathKind | string | undefined | null
): boolean {
  return kind === 'course'
}
