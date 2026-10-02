import type { PathTreeItem } from '@/lib/learning-path-graph-layout'

/** Combined General Approach + Recommended Path in the outline. */
export const LEARNING_PATH_OVERVIEW_SECTION_ID = 'overview'

/** User-facing name for the combined overview section. */
export const LEARNING_PATH_OVERVIEW_LABEL = 'Overview'

/** Primary action on Overview — opens the first path step. */
export const LEARNING_PATH_START_LABEL = 'Start learning path'

/** @deprecated Old recommended-path URL; treated as Overview. */
export const LEARNING_PATH_RECOMMENDED_SECTION_ID = 'recommended-path'

/** @deprecated Old General Approach URL; treated as Overview on course paths. */
export const LEARNING_PATH_MENTAL_MAP_SECTION_ID = 'mental-map'

/** Legacy General Approach label; outline search still finds Overview. */
export const LEARNING_PATH_MENTAL_MAP_LABEL = 'General Approach'

/** Left-nav / main-panel section for topics learned after finishing the path. */
export const LEARNING_PATH_KNOWLEDGE_SECTION_ID = 'knowledge-gained'

/** Left-nav / main-panel for textbooks, websites, and video channels. */
export const LEARNING_PATH_RESOURCES_SECTION_ID = 'resources'

/** User-facing name for the general resources outline tab. */
export const LEARNING_PATH_GENERAL_RESOURCES_LABEL = 'General Resources'

export type LearningPathGeneralResourceKind =
  | 'textbook'
  | 'website'
  | 'youtube'

export type LearningPathResourceSection = {
  kind: LearningPathGeneralResourceKind
  id: string
  label: string
}

export const LEARNING_PATH_RESOURCE_SECTIONS: readonly LearningPathResourceSection[] =
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

export function isLearningPathRecommendedSelection(id: string) {
  return id === LEARNING_PATH_RECOMMENDED_SECTION_ID
}

export function isLearningPathMentalMapSelection(id: string) {
  return id === LEARNING_PATH_MENTAL_MAP_SECTION_ID
}

export function isLearningPathOverviewSelection(id: string) {
  return (
    id === LEARNING_PATH_OVERVIEW_SECTION_ID ||
    isLearningPathRecommendedSelection(id) ||
    isLearningPathMentalMapSelection(id)
  )
}

export function isLearningPathResourceSelection(id: string) {
  return (
    id === LEARNING_PATH_RESOURCES_SECTION_ID ||
    LEARNING_PATH_RESOURCE_SECTIONS.some((section) => section.id === id)
  )
}

export function getLearningPathResourceSection(
  id: string
): LearningPathResourceSection | null {
  return (
    LEARNING_PATH_RESOURCE_SECTIONS.find((section) => section.id === id) ?? null
  )
}

export function canonicalizeLearningPathSectionId(id: string) {
  if (isLearningPathOverviewSelection(id)) {
    return LEARNING_PATH_OVERVIEW_SECTION_ID
  }
  if (isLearningPathResourceSelection(id)) {
    return LEARNING_PATH_RESOURCES_SECTION_ID
  }
  return id
}

export function isLearningPathKnowledgeSelection(id: string) {
  return id === LEARNING_PATH_KNOWLEDGE_SECTION_ID
}

export function isLearningPathSectionSelection(id: string) {
  return (
    isLearningPathOverviewSelection(id) ||
    isLearningPathResourceSelection(id) ||
    isLearningPathKnowledgeSelection(id)
  )
}

/** Outline under Overview — the goal lives on the Overview page. */
export function outlineTreeWithoutGoal(items: PathTreeItem[]): PathTreeItem[] {
  const out: PathTreeItem[] = []
  for (const item of items) {
    if (item.node.kind === 'goal') out.push(...item.children)
    else out.push(item)
  }
  return out
}
