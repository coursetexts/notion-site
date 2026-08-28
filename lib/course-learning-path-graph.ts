import { clamp, layoutHoverGraph } from '@/lib/learning-path-graph-layout'
import type {
  LearningPathData,
  LearningPathEdge,
  LearningPathNode,
  LearningPathNodeStatus
} from '@/lib/learning-path-seed'
import type {
  CourseLearningPathData,
  CourseLearningPathNode
} from '@/lib/course-learning-path-types'

export const MENTAL_MAP_GOAL_ID = '__mental_map_goal__'

function layoutX(index: number, total: number) {
  if (total <= 1) return 50
  const span = 64
  const start = 50 - span / 2
  return start + (span * index) / (total - 1)
}

function typeSub(type: CourseLearningPathNode['type']): string {
  if (type === 'topic') return 'Topic'
  if (type === 'subtopic') return 'Subtopic'
  return 'Concept'
}

function statusFor(
  id: string,
  exploredIds: Set<string>,
  exploringId: string | null
): LearningPathNodeStatus {
  if (exploredIds.has(id)) return 'explored'
  if (exploringId === id) return 'exploring'
  return 'next'
}

function firstUnexploredId(
  nodes: CourseLearningPathNode[],
  exploredIds: Set<string>
): string | null {
  for (const node of nodes) {
    if (!exploredIds.has(node.id)) return node.id
    if (node.children?.length) {
      const nested = firstUnexploredId(node.children, exploredIds)
      if (nested) return nested
    }
  }
  return null
}

/**
 * Syllabus tree as a learning-path graph: course goal, chained topics,
 * nested subtopics/concepts as expandable prerequisites.
 */
export function courseLearningPathToGraphData(
  course: CourseLearningPathData,
  exploredIds: Set<string>
): LearningPathData {
  const exploringId = firstUnexploredId(course.topics, exploredIds)
  const nodes: LearningPathNode[] = [
    {
      id: MENTAL_MAP_GOAL_ID,
      label: course.title,
      kind: 'goal',
      sub: 'Your course',
      status: 'exploring',
      x: 50,
      y: 12,
      description: course.description,
      why: '',
      resources: []
    }
  ]
  const edges: LearningPathEdge[] = []
  const topics = course.topics

  function addChildren(
    parent: CourseLearningPathNode,
    parentX: number,
    depth: number
  ) {
    const kids = parent.children ?? []
    const y = depth === 1 ? 58 : clamp(76 + (depth - 2) * 10, 58, 90)
    const spread = depth === 1 ? 12 : 8
    kids.forEach((child, index) => {
      const x = clamp(
        parentX + (index - (kids.length - 1) / 2) * spread,
        12,
        88
      )
      nodes.push({
        id: child.id,
        label: child.title,
        kind: 'prerequisite',
        sub: typeSub(child.type),
        status: statusFor(child.id, exploredIds, exploringId),
        sequence: index + 1,
        x,
        y,
        description: child.description ?? '',
        why: '',
        resources: []
      })
      edges.push({ from: parent.id, to: child.id })
      addChildren(child, x, depth + 1)
    })
  }

  topics.forEach((topic, index) => {
    const x = layoutX(index, topics.length)
    nodes.push({
      id: topic.id,
      label: topic.title,
      kind: 'milestone',
      sub: `Topic ${index + 1}`,
      status: statusFor(topic.id, exploredIds, exploringId),
      sequence: index + 1,
      x,
      y: 36,
      description: topic.description ?? '',
      why: '',
      resources: []
    })
    edges.push({
      from: index === 0 ? MENTAL_MAP_GOAL_ID : topics[index - 1].id,
      to: topic.id
    })
    addChildren(topic, x, 1)
  })

  return {
    slug: course.slug,
    title: course.title,
    goal: course.title,
    summary: course.description,
    nodes,
    edges,
    circle: { name: '', description: '', members: [] }
  }
}

export const layoutMentalMapGraph = layoutHoverGraph

