/**
 * Build the embedding input string for a learning_paths row.
 * Type-specific text construction only — not an eligibility gate.
 */
import {
  type CourseLearningPathData,
  type CourseLearningPathNode,
  isCourseLearningPathPayload
} from '@/lib/course-learning-path-types'
import { appendRelatedTermsToEmbeddingText } from '@/lib/catalog-related-terms'
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

const MAX_TOPIC_DESCRIPTION_CHARS = 160
const MAX_EMBEDDING_TEXT_CHARS = 2400

function clipDescription(value: string): string {
  const trimmed = value.replace(/\s+/g, ' ').trim()
  if (trimmed.length <= MAX_TOPIC_DESCRIPTION_CHARS) return trimmed
  return `${trimmed.slice(0, MAX_TOPIC_DESCRIPTION_CHARS - 1).trimEnd()}…`
}

function formatTopicChunk(label: string, description?: string | null): string {
  const name = label.trim()
  if (!name) return ''
  const detail =
    typeof description === 'string' ? clipDescription(description) : ''
  return detail ? `${name}: ${detail}` : name
}

function collectCourseTopicChunks(
  nodes: CourseLearningPathNode[] | undefined,
  out: string[]
): void {
  if (!nodes?.length) return
  for (const node of nodes) {
    if (!node) continue
    const chunk = formatTopicChunk(
      typeof node.title === 'string' ? node.title : '',
      node.description
    )
    if (chunk) out.push(chunk)
    collectCourseTopicChunks(node.children, out)
  }
}

function clipEmbeddingText(text: string): string {
  if (text.length <= MAX_EMBEDDING_TEXT_CHARS) return text
  return `${text.slice(0, MAX_EMBEDDING_TEXT_CHARS - 1).trimEnd()}…`
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
  const topics = nodes
    .filter((node) => node && node.kind !== 'goal')
    .map((node) =>
      formatTopicChunk(
        typeof node.label === 'string' ? node.label : '',
        node.description
      )
    )
    .filter(Boolean)
  return clipEmbeddingText(
    `${title}. ${goal}. ${summary}. Topics: ${topics.join(', ')}`
  )
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

  const chunks: string[] = []
  collectCourseTopicChunks(topics, chunks)
  return clipEmbeddingText(
    `${title}. ${description}. Topics: ${chunks.join(', ')}`
  )
}

/**
 * Prefer course-style text when the row is a course syllabus OR the JSON
 * payload looks like CourseLearningPathData. Everything else uses goal-style
 * title/goal/summary/node labels.
 */
export function learningPathEmbeddingText(
  row: LearningPathEmbeddingTextRow,
  relatedTerms?: string[]
): string {
  const base =
    row.kind === 'course' || isCourseLearningPathPayload(row.data)
      ? courseStyleEmbeddingText(row)
      : goalStyleEmbeddingText(row)
  return appendRelatedTermsToEmbeddingText(base, relatedTerms)
}
