import type { PathTreeItem } from '@/lib/learning-path-graph-layout'

/** Combined General Approach + Recommended Path in the outline. */
export const LEARNING_PATH_OVERVIEW_SECTION_ID = 'overview'

/** User-facing name for the combined overview section. */
export const LEARNING_PATH_OVERVIEW_LABEL = 'Overview'

/** @deprecated Old recommended-path URL; treated as Overview. */
export const LEARNING_PATH_RECOMMENDED_SECTION_ID = 'recommended-path'

/** Left-nav / main-panel section for the path mental map (course paths). */
export const LEARNING_PATH_MENTAL_MAP_SECTION_ID = 'mental-map'

/** User-facing name for the mental-map section on course learning paths. */
export const LEARNING_PATH_MENTAL_MAP_LABEL = 'General Approach'

/** Left-nav / main-panel section for topics learned after finishing the path. */
export const LEARNING_PATH_KNOWLEDGE_SECTION_ID = 'knowledge-gained'

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

export function canonicalizeLearningPathSectionId(id: string) {
  return isLearningPathOverviewSelection(id)
    ? LEARNING_PATH_OVERVIEW_SECTION_ID
    : id
}

export function isLearningPathKnowledgeSelection(id: string) {
  return id === LEARNING_PATH_KNOWLEDGE_SECTION_ID
}

export function isLearningPathSectionSelection(id: string) {
  return (
    isLearningPathOverviewSelection(id) ||
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
