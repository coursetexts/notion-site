import type { PathTreeItem } from '@/lib/learning-path-graph-layout'

/** Left-nav / main-panel section for the recommended path overview. */
export const LEARNING_PATH_RECOMMENDED_SECTION_ID = 'recommended-path'

/** Left-nav / main-panel section for the path mental map. */
export const LEARNING_PATH_MENTAL_MAP_SECTION_ID = 'mental-map'

/** User-facing name for the mental-map section in the outline. */
export const LEARNING_PATH_MENTAL_MAP_LABEL = 'General Approach'

/** Left-nav / main-panel section for topics learned after finishing the path. */
export const LEARNING_PATH_KNOWLEDGE_SECTION_ID = 'knowledge-gained'

export function isLearningPathRecommendedSelection(id: string) {
  return id === LEARNING_PATH_RECOMMENDED_SECTION_ID
}

export function isLearningPathMentalMapSelection(id: string) {
  return id === LEARNING_PATH_MENTAL_MAP_SECTION_ID
}

export function isLearningPathKnowledgeSelection(id: string) {
  return id === LEARNING_PATH_KNOWLEDGE_SECTION_ID
}

export function isLearningPathSectionSelection(id: string) {
  return (
    isLearningPathRecommendedSelection(id) ||
    isLearningPathMentalMapSelection(id) ||
    isLearningPathKnowledgeSelection(id)
  )
}

/** Outline under General Approach / Recommended Path — the goal lives on General Approach. */
export function outlineTreeWithoutGoal(items: PathTreeItem[]): PathTreeItem[] {
  const out: PathTreeItem[] = []
  for (const item of items) {
    if (item.node.kind === 'goal') out.push(...item.children)
    else out.push(item)
  }
  return out
}
