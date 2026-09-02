import type { LearningPathData } from '@/lib/learning-path-seed'
import {
  type CourseLearningPathData,
  flattenCourseLearningPathNodes
} from '@/lib/course-learning-path-types'

export type KnowledgeTopicItem = {
  id: string
  label: string
}

export function normalizeKnowledgeTopicLabel(label: string): string {
  return label.trim().toLowerCase().replace(/\s+/g, ' ')
}

export function knowledgeTopicItemsFromLearningPath(
  path: LearningPathData
): KnowledgeTopicItem[] {
  const seen = new Set<string>()
  const items: KnowledgeTopicItem[] = []
  for (const node of path.nodes) {
    if (node.kind === 'goal') continue
    const label = node.label.trim()
    const key = normalizeKnowledgeTopicLabel(label)
    if (!label || !key || seen.has(key)) continue
    seen.add(key)
    items.push({ id: node.id, label })
  }
  return items
}

export function knowledgeTopicsFromLearningPath(
  path: LearningPathData
): string[] {
  return knowledgeTopicItemsFromLearningPath(path).map((item) => item.label)
}

export function isLearningPathFinished(path: LearningPathData): boolean {
  const topics = path.nodes.filter((node) => node.kind !== 'goal')
  if (topics.length === 0) return false
  return topics.every((node) => node.status === 'explored')
}

export function knowledgeTopicItemsFromCourseLearningPath(
  course: CourseLearningPathData
): KnowledgeTopicItem[] {
  const seen = new Set<string>()
  const items: KnowledgeTopicItem[] = []
  for (const node of flattenCourseLearningPathNodes(course)) {
    const label = node.title.trim()
    const key = normalizeKnowledgeTopicLabel(label)
    if (!label || !key || seen.has(key)) continue
    seen.add(key)
    items.push({ id: node.id, label })
  }
  return items
}

export function knowledgeTopicsFromCourseLearningPath(
  course: CourseLearningPathData
): string[] {
  return knowledgeTopicItemsFromCourseLearningPath(course).map(
    (item) => item.label
  )
}

export function isCourseLearningPathFinished(
  course: CourseLearningPathData,
  exploredIds: Set<string>
): boolean {
  const nodes = flattenCourseLearningPathNodes(course)
  if (nodes.length === 0) return false
  return nodes.every((node) => exploredIds.has(node.id))
}
