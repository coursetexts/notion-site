import type { PathTreeItem } from '@/lib/learning-path-graph-layout'

/** Left-nav / main-panel section for the recommended path overview. */
export const LEARNING_PATH_RECOMMENDED_SECTION_ID = 'recommended-path'

/** Left-nav / main-panel section for the path mental map. */
export const LEARNING_PATH_MENTAL_MAP_SECTION_ID = 'mental-map'

export function isLearningPathRecommendedSelection(id: string) {
  return id === LEARNING_PATH_RECOMMENDED_SECTION_ID
}

export function isLearningPathMentalMapSelection(id: string) {
  return id === LEARNING_PATH_MENTAL_MAP_SECTION_ID
}

export function isLearningPathSectionSelection(id: string) {
  return (
    isLearningPathRecommendedSelection(id) ||
    isLearningPathMentalMapSelection(id)
  )
}

/** Outline under Recommended Path / Mental Map — the goal lives on Mental Map. */
export function outlineTreeWithoutGoal(items: PathTreeItem[]): PathTreeItem[] {
  const out: PathTreeItem[] = []
  for (const item of items) {
    if (item.node.kind === 'goal') out.push(...item.children)
    else out.push(item)
  }
  return out
}
