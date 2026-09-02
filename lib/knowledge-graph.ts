/**
 * Shared knowledge catalog types and extractors.
 * Labels are unique on normalized_label. Edges come from path structure or the LLM job.
 */

import type { LearningPathData } from '@/lib/learning-path-seed'
import {
  type CourseLearningPathData,
  type CourseLearningPathNode,
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
  edges: KnowledgeGraphEdgeDraft[]
}

export function harvestGraphFromLearningPathData(
  data: unknown
): HarvestedPathGraph | null {
  if (!data || typeof data !== 'object') return null
  if (isCourseLearningPathPayload(data)) {
    const labels: string[] = []
    const seen = new Set<string>()
    const collect = (nodes: CourseLearningPathNode[]) => {
      for (const node of nodes) {
        const label = node.title.trim()
        const key = normalizeKnowledgeTopicLabel(label)
        if (label && key && !seen.has(key)) {
          seen.add(key)
          labels.push(label)
        }
        if (node.children?.length) collect(node.children)
      }
    }
    collect(data.topics)
    return {
      labels,
      edges: structuralKnowledgeEdgesFromCourseLearningPath(data)
    }
  }
  const row = data as { nodes?: unknown; edges?: unknown }
  if (!Array.isArray(row.nodes) || !Array.isArray(row.edges)) return null
  const path = data as LearningPathData
  const labels: string[] = []
  const seen = new Set<string>()
  for (const node of path.nodes) {
    if (node.kind === 'goal') continue
    const label = (node.label || '').trim()
    const key = normalizeKnowledgeTopicLabel(label)
    if (!label || !key || seen.has(key)) continue
    seen.add(key)
    labels.push(label)
  }
  return {
    labels,
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
