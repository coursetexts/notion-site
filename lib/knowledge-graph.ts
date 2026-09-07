/**
 * Shared knowledge catalog types and extractors.
 * Labels are unique on normalized_label. Edges come from path structure or the LLM job.
 */

import type {
  LearningPathData,
  LearningPathKind
} from '@/lib/learning-path-seed'
import {
  type CourseLearningPathData,
  type CourseLearningPathNode,
  type CourseLearningPathNodeType,
  isCourseLearningPathPayload
} from '@/lib/course-learning-path-types'
import { normalizeKnowledgeTopicLabel } from '@/lib/learning-path-knowledge'

export type KnowledgeEdgeKind = 'prerequisite' | 'related' | 'part_of'
export type KnowledgeEdgeSource = 'path_structure' | 'llm'

export type KnowledgeTopicRecord = {
  id: string
  label: string
  normalizedLabel: string
}

export type KnowledgeGraphEdgeDraft = {
  fromNormalized: string
  toNormalized: string
  kind: KnowledgeEdgeKind
}

export type KnowledgeGraphViewEdge = {
  fromId: string
  toId: string
  kind: KnowledgeEdgeKind
}

export type KnowledgeNodeKind = CourseLearningPathNodeType | 'path_node'

export type KnowledgePathRef = {
  id: string
  slug: string
  title: string
  kind: LearningPathKind
}

export type HarvestedTopicLabel = {
  label: string
  nodeKind: KnowledgeNodeKind
}

const NODE_KIND_RANK: Record<KnowledgeNodeKind, number> = {
  topic: 3,
  subtopic: 2,
  concept: 2,
  path_node: 1
}

export function isKnowledgePathKind(value: unknown): value is LearningPathKind {
  return value === 'community' || value === 'research' || value === 'course'
}

export function isKnowledgeNodeKind(value: unknown): value is KnowledgeNodeKind {
  return (
    value === 'topic' ||
    value === 'subtopic' ||
    value === 'concept' ||
    value === 'path_node'
  )
}

export function preferKnowledgeNodeKind(
  current: KnowledgeNodeKind,
  next: KnowledgeNodeKind
): KnowledgeNodeKind {
  return NODE_KIND_RANK[next] > NODE_KIND_RANK[current] ? next : current
}

export function isKnowledgeEdgeKind(value: unknown): value is KnowledgeEdgeKind {
  return (
    value === 'prerequisite' || value === 'related' || value === 'part_of'
  )
}

export function canonicalizeRelatedEdge(
  fromNormalized: string,
  toNormalized: string,
  kind: KnowledgeEdgeKind
): KnowledgeGraphEdgeDraft | null {
  if (!fromNormalized || !toNormalized || fromNormalized === toNormalized) {
    return null
  }
  if (kind !== 'related') {
    return { fromNormalized, toNormalized, kind }
  }
  if (fromNormalized < toNormalized) {
    return { fromNormalized, toNormalized, kind }
  }
  return {
    fromNormalized: toNormalized,
    toNormalized: fromNormalized,
    kind
  }
}

export function mergeEdgeDrafts(
  drafts: KnowledgeGraphEdgeDraft[]
): KnowledgeGraphEdgeDraft[] {
  const seen = new Set<string>()
  const out: KnowledgeGraphEdgeDraft[] = []
  for (const raw of drafts) {
    const edge = canonicalizeRelatedEdge(
      raw.fromNormalized,
      raw.toNormalized,
      raw.kind
    )
    if (!edge) continue
    const key = `${edge.fromNormalized}\0${edge.toNormalized}\0${edge.kind}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(edge)
  }
  return out
}

export function structuralKnowledgeEdgesFromLearningPath(
  path: LearningPathData
): KnowledgeGraphEdgeDraft[] {
  const byId = Object.fromEntries(path.nodes.map((node) => [node.id, node]))
  const drafts: KnowledgeGraphEdgeDraft[] = []
  for (const edge of path.edges) {
    const from = byId[edge.from]
    const to = byId[edge.to]
    if (!from || !to) continue
    if (from.kind === 'goal' || to.kind === 'goal') continue
    const fromNormalized = normalizeKnowledgeTopicLabel(from.label)
    const toNormalized = normalizeKnowledgeTopicLabel(to.label)
    const kind: KnowledgeEdgeKind =
      from.kind === 'prerequisite' ? 'prerequisite' : 'related'
    const next = canonicalizeRelatedEdge(fromNormalized, toNormalized, kind)
    if (next) drafts.push(next)
  }
  return mergeEdgeDrafts(drafts)
}

function walkCourseStructuralEdges(
  nodes: CourseLearningPathNode[],
  parent: CourseLearningPathNode | null,
  drafts: KnowledgeGraphEdgeDraft[]
) {
  nodes.forEach((node, index) => {
    const normalized = normalizeKnowledgeTopicLabel(node.title)
    if (parent) {
      const parentNormalized = normalizeKnowledgeTopicLabel(parent.title)
      const partOf = canonicalizeRelatedEdge(
        normalized,
        parentNormalized,
        'part_of'
      )
      if (partOf) drafts.push(partOf)
    }
    if (index > 0) {
      const prevNormalized = normalizeKnowledgeTopicLabel(nodes[index - 1].title)
      const related = canonicalizeRelatedEdge(
        prevNormalized,
        normalized,
        'related'
      )
      if (related) drafts.push(related)
    }
    if (node.children?.length) {
      walkCourseStructuralEdges(node.children, node, drafts)
    }
  })
}

export function structuralKnowledgeEdgesFromCourseLearningPath(
  course: CourseLearningPathData
): KnowledgeGraphEdgeDraft[] {
  const drafts: KnowledgeGraphEdgeDraft[] = []
  walkCourseStructuralEdges(course.topics, null, drafts)
  return mergeEdgeDrafts(drafts)
}

export type HarvestedPathGraph = {
  labels: string[]
  topics: HarvestedTopicLabel[]
  edges: KnowledgeGraphEdgeDraft[]
}

function addHarvestedTopic(
  topics: HarvestedTopicLabel[],
  byKey: Map<string, number>,
  label: string,
  nodeKind: KnowledgeNodeKind
) {
  const trimmed = label.trim()
  const key = normalizeKnowledgeTopicLabel(trimmed)
  if (!trimmed || !key) return
  const existing = byKey.get(key)
  if (existing == null) {
    byKey.set(key, topics.length)
    topics.push({ label: trimmed, nodeKind })
    return
  }
  topics[existing].nodeKind = preferKnowledgeNodeKind(
    topics[existing].nodeKind,
    nodeKind
  )
}

function walkCourseHarvestTopics(
  nodes: CourseLearningPathNode[],
  topics: HarvestedTopicLabel[],
  byKey: Map<string, number>
) {
  for (const node of nodes) {
    const nodeKind: KnowledgeNodeKind =
      node.type === 'topic' || node.type === 'subtopic' || node.type === 'concept'
        ? node.type
        : 'concept'
    addHarvestedTopic(topics, byKey, node.title, nodeKind)
    if (node.children?.length) {
      walkCourseHarvestTopics(node.children, topics, byKey)
    }
  }
}

export function harvestGraphFromLearningPathData(
  data: unknown
): HarvestedPathGraph | null {
  if (!data || typeof data !== 'object') return null
  if (isCourseLearningPathPayload(data)) {
    const topics: HarvestedTopicLabel[] = []
    walkCourseHarvestTopics(data.topics, topics, new Map())
    return {
      labels: topics.map((topic) => topic.label),
      topics,
      edges: structuralKnowledgeEdgesFromCourseLearningPath(data)
    }
  }
  const row = data as { nodes?: unknown; edges?: unknown }
  if (!Array.isArray(row.nodes) || !Array.isArray(row.edges)) return null
  const path = data as LearningPathData
  const topics: HarvestedTopicLabel[] = []
  const byKey = new Map<string, number>()
  for (const node of path.nodes) {
    if (node.kind === 'goal') continue
    addHarvestedTopic(topics, byKey, node.label || '', 'path_node')
  }
  return {
    labels: topics.map((topic) => topic.label),
    topics,
    edges: structuralKnowledgeEdgesFromLearningPath(path)
  }
}

export function isPublicLearningPathRow(row: {
  is_catalog?: boolean | null
  visibility?: string | null
  is_private?: boolean | null
}): boolean {
  if (row.is_catalog) return true
  if (row.visibility === 'public' || row.visibility === 'collaborative') {
    return true
  }
  if (row.visibility === 'private') return false
  return row.is_private !== true
}
