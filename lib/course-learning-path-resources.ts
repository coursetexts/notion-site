/**
 * Resource sections for the course learning path left nav.
 * Data comes from degrees-page curriculum JSON (textbook / website / youtube).
 */
import { graduateDegrees } from '@/lib/graduate-degrees'
import {
  getCourseLearningPathSlug,
  undergraduateDegrees,
  type CourseResource,
  type CourseResourceKind
} from '@/lib/undergraduate-degrees'

export type CourseLearningPathResourceSectionKind = CourseResourceKind

export type CourseLearningPathResourceSection = {
  kind: CourseLearningPathResourceSectionKind
  /** Selection id used in syllabus nav / main panel. */
  id: string
  label: string
}

export const COURSE_LEARNING_PATH_RESOURCE_SECTIONS: readonly CourseLearningPathResourceSection[] =
  [
    {
      kind: 'textbook',
      id: 'resources:textbook',
      label: 'Core Textbooks'
    },
    {
      kind: 'website',
      id: 'resources:website',
      label: 'Websites and Open Resources'
    },
    {
      kind: 'youtube',
      id: 'resources:youtube',
      label: 'Video Channels'
    }
  ] as const

export const COURSE_LEARNING_PATH_RESOURCES_SECTION_ID = 'resources'

/** Selectable left-nav / main-panel section for the course syllabus overview. */
export const COURSE_LEARNING_PATH_SYLLABUS_SECTION_ID = 'syllabus:overview'

/** Selectable left-nav / main-panel section for the course mental map. */
export const COURSE_LEARNING_PATH_MENTAL_MAP_SECTION_ID = 'mental-map'

export function isCourseLearningPathResourceSelection(id: string): boolean {
  return COURSE_LEARNING_PATH_RESOURCE_SECTIONS.some((section) => section.id === id)
}

export function isCourseLearningPathSyllabusSelection(id: string): boolean {
  return id === COURSE_LEARNING_PATH_SYLLABUS_SECTION_ID
}

export function isCourseLearningPathMentalMapSelection(id: string): boolean {
  return id === COURSE_LEARNING_PATH_MENTAL_MAP_SECTION_ID
}

export function getMentalMapNotesNodeId(slug: string): string {
  return `${COURSE_LEARNING_PATH_MENTAL_MAP_SECTION_ID}:${slug}`
}

export function isMentalMapVideoNodeId(id: string): boolean {
  return (
    id === COURSE_LEARNING_PATH_MENTAL_MAP_SECTION_ID ||
    id.startsWith(`${COURSE_LEARNING_PATH_MENTAL_MAP_SECTION_ID}:`)
  )
}

export function getCourseLearningPathResourceSection(
  id: string
): CourseLearningPathResourceSection | null {
  return (
    COURSE_LEARNING_PATH_RESOURCE_SECTIONS.find((section) => section.id === id) ?? null
  )
}

/**
 * Look up curated resources for a course-learning-path slug from degrees curricula.
 * Prefers undergraduate matches; falls back to graduate.
 */
export function getCourseLearningPathResourcesBySlug(
  slug: string
): CourseResource[] {
  const needle = slug.trim().toLowerCase()
  if (!needle) return []

  for (const degrees of [undergraduateDegrees, graduateDegrees]) {
    for (const degree of degrees) {
      for (const course of degree.courses) {
        if (getCourseLearningPathSlug(course.name) !== needle) continue
        if (course.resources?.length) return course.resources
      }
    }
  }
  return []
}

export function resourcesForSection(
  resources: CourseResource[] | undefined,
  kind: CourseLearningPathResourceSectionKind
): CourseResource[] {
  return (resources ?? []).filter((r) => r.kind === kind)
}
