/**
 * Curated-course resource sections for the curated-course left nav.
 * Data comes from degrees-page curriculum JSON (textbook / website / youtube).
 */
import { graduateDegrees } from '@/lib/graduate-degrees'
import {
  getCuratedCourseSlug,
  undergraduateDegrees,
  type CourseResource,
  type CourseResourceKind
} from '@/lib/undergraduate-degrees'

export type CuratedCourseResourceSectionKind = CourseResourceKind

export type CuratedCourseResourceSection = {
  kind: CuratedCourseResourceSectionKind
  /** Selection id used in syllabus nav / main panel. */
  id: string
  label: string
}

export const CURATED_COURSE_RESOURCE_SECTIONS: readonly CuratedCourseResourceSection[] =
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

export const CURATED_COURSE_RESOURCES_SECTION_ID = 'resources'

/** Selectable left-nav / main-panel section for the course syllabus overview. */
export const CURATED_COURSE_SYLLABUS_SECTION_ID = 'syllabus:overview'

export function isCuratedCourseResourceSelection(id: string): boolean {
  return CURATED_COURSE_RESOURCE_SECTIONS.some((section) => section.id === id)
}

export function isCuratedCourseSyllabusSelection(id: string): boolean {
  return id === CURATED_COURSE_SYLLABUS_SECTION_ID
}

export function getCuratedCourseResourceSection(
  id: string
): CuratedCourseResourceSection | null {
  return (
    CURATED_COURSE_RESOURCE_SECTIONS.find((section) => section.id === id) ?? null
  )
}

/**
 * Look up curated resources for a curated-course slug from degrees curricula.
 * Prefers undergraduate matches; falls back to graduate.
 */
export function getCuratedCourseResourcesBySlug(
  slug: string
): CourseResource[] {
  const needle = slug.trim().toLowerCase()
  if (!needle) return []

  for (const degrees of [undergraduateDegrees, graduateDegrees]) {
    for (const degree of degrees) {
      for (const course of degree.courses) {
        if (getCuratedCourseSlug(course.name) !== needle) continue
        if (course.resources?.length) return course.resources
      }
    }
  }
  return []
}

export function resourcesForSection(
  resources: CourseResource[] | undefined,
  kind: CuratedCourseResourceSectionKind
): CourseResource[] {
  return (resources ?? []).filter((r) => r.kind === kind)
}
