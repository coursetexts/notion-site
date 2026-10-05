/**
 * Resource sections for the course learning path left nav.
 * Data comes from degrees-page curriculum JSON (textbook / website / youtube).
 */
import { graduateDegrees } from '@/lib/graduate-degrees'
import type {
  CourseLearningPathTopicResource,
  CourseLearningPathTopicResourceKind
} from '@/lib/course-learning-path-types'
import { isLearningPathOverviewSelection } from '@/lib/learning-path-sections'
import {
  type CourseResource,
  type CourseResourceKind,
  getCourseLearningPathSlug,
  isResourceUrl,
  undergraduateDegrees
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

/** Left-nav label for textbooks, websites, and video channels. */
export const COURSE_LEARNING_PATH_GENERAL_RESOURCES_LABEL = 'General Resources'

/** Canonical left-nav / main-panel id for course Overview (`syllabus:overview`). */
export const COURSE_LEARNING_PATH_SYLLABUS_SECTION_ID = 'syllabus:overview'

/** Legacy General Approach URL; treated as Overview. */
export const COURSE_LEARNING_PATH_MENTAL_MAP_SECTION_ID = 'mental-map'

/** Selectable left-nav / main-panel section for topics learned after finishing. */
export const COURSE_LEARNING_PATH_KNOWLEDGE_SECTION_ID = 'knowledge-gained'

export function isCourseLearningPathResourceSelection(id: string): boolean {
  return (
    id === COURSE_LEARNING_PATH_RESOURCES_SECTION_ID ||
    COURSE_LEARNING_PATH_RESOURCE_SECTIONS.some(
      (section) => section.id === id
    )
  )
}

export function isCourseLearningPathSyllabusSelection(id: string): boolean {
  return id === COURSE_LEARNING_PATH_SYLLABUS_SECTION_ID
}

export function isCourseLearningPathMentalMapSelection(id: string): boolean {
  return id === COURSE_LEARNING_PATH_MENTAL_MAP_SECTION_ID
}

/** Overview tab: Recommended Syllabus, General Approach, or `?node=overview`. */
export function isCourseLearningPathOverviewSelection(id: string): boolean {
  return (
    id === COURSE_LEARNING_PATH_SYLLABUS_SECTION_ID ||
    isLearningPathOverviewSelection(id)
  )
}

export function canonicalizeCourseLearningPathSectionId(id: string): string {
  if (isCourseLearningPathOverviewSelection(id)) {
    return COURSE_LEARNING_PATH_SYLLABUS_SECTION_ID
  }
  if (isCourseLearningPathResourceSelection(id)) {
    return COURSE_LEARNING_PATH_RESOURCES_SECTION_ID
  }
  return id
}

export function isCourseLearningPathKnowledgeSelection(id: string): boolean {
  return id === COURSE_LEARNING_PATH_KNOWLEDGE_SECTION_ID
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
    COURSE_LEARNING_PATH_RESOURCE_SECTIONS.find(
      (section) => section.id === id
    ) ?? null
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

/** Stable id so votes/bookmarks survive remounts for degrees-page curated rows. */
export function curatedGeneralResourceId(
  kind: CourseLearningPathResourceSectionKind,
  index: number,
  title: string
): string {
  const slug = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
  return `curated:${kind}:${index}:${slug || 'resource'}`
}

export function isCuratedGeneralResourceId(id: string): boolean {
  return id.startsWith('curated:')
}

function topicKindForResourceSection(
  kind: CourseLearningPathResourceSectionKind
): CourseLearningPathTopicResourceKind {
  if (kind === 'textbook') return 'book'
  if (kind === 'youtube') return 'video'
  return 'article'
}

/**
 * Migrate degrees-page curriculum resources into path topic-resource cards:
 * description → passage ("The part that helped and why"), keep list order.
 */
export function courseCurriculumResourcesToTopicResources(
  resources: CourseResource[],
  kind: CourseLearningPathResourceSectionKind
): CourseLearningPathTopicResource[] {
  const topicKind = topicKindForResourceSection(kind)
  return resources.map((resource, index) => {
    const link = resource.linkOrSite.trim()
    const description = resource.description.trim()
    const url = isResourceUrl(link) ? link : undefined
    // Non-URL linkOrSite is a publisher/source — keep it with the helped text.
    const passage = [!url && link ? link : '', description]
      .map((part) => part.trim())
      .filter(Boolean)
      .join('\n\n')
    return {
      id: curatedGeneralResourceId(kind, index, resource.title),
      kind: topicKind,
      position: index + 1,
      title: resource.title.trim() || 'Untitled resource',
      url,
      passage: passage || undefined
    }
  })
}

/** Curated curriculum cards first, then learner-added — one numbered list. */
export function mergeGeneralResourceTopicLists(
  curated: CourseLearningPathTopicResource[],
  added: CourseLearningPathTopicResource[]
): CourseLearningPathTopicResource[] {
  const curatedIds = new Set(curated.map((item) => item.id))
  const extras = added.filter((item) => !curatedIds.has(item.id))
  return [
    ...curated.map((item, index) => ({ ...item, position: index + 1 })),
    ...extras.map((item, index) => ({
      ...item,
      position: curated.length + index + 1
    }))
  ]
}
