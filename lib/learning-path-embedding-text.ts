/**
 * Build the embedding input string for a learning_paths row.
 * Type-specific text construction only — not an eligibility gate.
 */
import {
  type CourseLearningPathData,
  type CourseLearningPathNode,
  isCourseLearningPathPayload
} from '@/lib/course-learning-path-types'
import type {
  LearningPathData,
  LearningPathNode
} from '@/lib/learning-path-seed'

export type LearningPathEmbeddingTextRow = {
  title?: string | null
  goal?: string | null
  summary?: string | null
  kind?: string | null
  data?: unknown
}

function collectCourseTitles(
  nodes: CourseLearningPathNode[] | undefined,
  out: string[]
): void {
  if (!nodes?.length) return
  for (const node of nodes) {
    if (!node) continue
    const title = typeof node.title === 'string' ? node.title.trim() : ''
    if (title) out.push(title)
    collectCourseTitles(node.children, out)
  }
}

function goalStyleEmbeddingText(row: LearningPathEmbeddingTextRow): string {
  const data =
    row.data && typeof row.data === 'object'
      ? (row.data as Partial<LearningPathData>)
      : null
  const title = (data?.title ?? row.title ?? '').trim()
  const goal = (data?.goal ?? row.goal ?? '').trim()
  const summary = (data?.summary ?? row.summary ?? '').trim()
  const nodes: LearningPathNode[] = Array.isArray(data?.nodes)
    ? (data.nodes as LearningPathNode[])
    : []
  const labels = nodes
    .filter((node) => node && node.kind !== 'goal')
    .map((node) => (typeof node.label === 'string' ? node.label.trim() : ''))
    .filter(Boolean)
  return `${title}. ${goal}. ${summary}. Topics: ${labels.join(', ')}`
}

function courseStyleEmbeddingText(row: LearningPathEmbeddingTextRow): string {
  let title = (row.title ?? '').trim()
  let description = (row.summary ?? '').trim()
  let topics: CourseLearningPathNode[] = []

  if (isCourseLearningPathPayload(row.data)) {
    const data = row.data as CourseLearningPathData
    title = (data.title || title).trim()
    description = (data.description || description).trim()
    topics = Array.isArray(data.topics) ? data.topics : []
  }

  const titles: string[] = []
  collectCourseTitles(topics, titles)
  return `${title}. ${description}. Topics: ${titles.join(', ')}`
}

/**
 * Prefer course-style text when the row is a course syllabus OR the JSON
 * payload looks like CourseLearningPathData. Everything else uses goal-style
 * title/goal/summary/node labels.
 */
export function learningPathEmbeddingText(
  row: LearningPathEmbeddingTextRow
): string {
  if (row.kind === 'course' || isCourseLearningPathPayload(row.data)) {
    return courseStyleEmbeddingText(row)
  }
  return goalStyleEmbeddingText(row)
}
