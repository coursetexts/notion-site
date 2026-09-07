/**
 * Public knowledge-graph payload: one node per normalized topic, with the
 * learning paths that topic appears on. Exact-match recurrence is stored now;
 * an LLM pass can later cluster similar labels onto the same topic.
 */

import type {
  KnowledgeGraphViewEdge,
  KnowledgeNodeKind,
  KnowledgePathRef,
  KnowledgeTopicRecord
} from '@/lib/knowledge-graph'
import { preferKnowledgeNodeKind } from '@/lib/knowledge-graph'
import {
  type KnowledgeHarvest,
  type KnowledgeTopicOccurrenceDraft
} from '@/lib/knowledge-graph-harvest'
import { normalizeKnowledgeTopicLabel } from '@/lib/learning-path-knowledge'

export type KnowledgeGraphTopicView = {
  id: string
  label: string
  normalizedLabel: string
  nodeKind: KnowledgeNodeKind
  paths: KnowledgePathRef[]
}

export type KnowledgeGraphView = {
  source: 'catalog' | 'live_harvest' | 'snapshot'
  topics: KnowledgeGraphTopicView[]
  paths: KnowledgePathRef[]
  edges: KnowledgeGraphViewEdge[]
  stats: {
    topicCount: number
    pathCount: number
    recurringCount: number
    recurringTopicCount: number
  }
}

const SCAFFOLD_NORMALIZED = new Set([
  'specific terms and concepts',
  'procedures, calculations, or analytic moves',
  'common cases, pitfalls, and checks',
  'applications',
  'conceptual foundation',
  'methods and problem-solving workflow',
  'applications, interpretation, and common pitfalls',
  'applications, interpretation, and pitfalls'
])

export function isKnowledgeGraphScaffoldLabel(label: string) {
  return SCAFFOLD_NORMALIZED.has(normalizeKnowledgeTopicLabel(label))
}

export function knowledgeGraphPathNodeId(slug: string) {
  return `path:${slug}`
}

export function topicIsGraphDefault(topic: KnowledgeGraphTopicView) {
  if (topic.paths.length < 2) return false
  if (isKnowledgeGraphScaffoldLabel(topic.label)) return false
  return topic.nodeKind === 'topic' || topic.nodeKind === 'path_node'
}

function preferPathRef(current: KnowledgePathRef, next: KnowledgePathRef) {
  if (current.id === next.id) {
    return next.title && current.title === current.slug ? next : current
  }
  if (current.id === current.slug && next.id !== next.slug) return next
  return current
}

function includeTopicInView(topic: KnowledgeGraphTopicView) {
  if (topic.paths.length === 0) return false
  if (isKnowledgeGraphScaffoldLabel(topic.label)) return false
  if (topic.paths.length >= 2) return true
  return topic.nodeKind === 'topic' || topic.nodeKind === 'path_node'
}

export function knowledgeGraphViewFromOccurrences(
  input: {
    topics: KnowledgeTopicRecord[]
    occurrences: KnowledgeTopicOccurrenceDraft[]
    edges: KnowledgeGraphViewEdge[]
    source: KnowledgeGraphView['source']
  }
): KnowledgeGraphView {
  const catalogByNormalized = new Map(
    input.topics.map((topic) => [topic.normalizedLabel, topic])
  )
  const byNormalized = new Map<string, KnowledgeGraphTopicView>()
  for (const occurrence of input.occurrences) {
    if (isKnowledgeGraphScaffoldLabel(occurrence.label)) continue
    const catalog = catalogByNormalized.get(occurrence.normalizedLabel)
    const existing = byNormalized.get(occurrence.normalizedLabel)
    const next: KnowledgeGraphTopicView = existing ?? {
      id: catalog?.id ?? occurrence.normalizedLabel,
      label: catalog?.label ?? occurrence.label,
      normalizedLabel: occurrence.normalizedLabel,
      nodeKind: occurrence.nodeKind,
      paths: []
    }
    if (!existing) {
      byNormalized.set(occurrence.normalizedLabel, next)
    } else {
      next.nodeKind = preferKnowledgeNodeKind(next.nodeKind, occurrence.nodeKind)
    }
    const already = next.paths.find((path) => path.slug === occurrence.path.slug)
    if (already) {
      const index = next.paths.indexOf(already)
      next.paths[index] = preferPathRef(already, occurrence.path)
    } else {
      next.paths.push(occurrence.path)
    }
  }

  const topics = [...byNormalized.values()]
    .map((topic) => ({
      ...topic,
      paths: [...topic.paths].sort((a, b) =>
        a.title.localeCompare(b.title, undefined, { sensitivity: 'base' })
      )
    }))
    .filter(includeTopicInView)
    .sort((a, b) => {
      if (b.paths.length !== a.paths.length) return b.paths.length - a.paths.length
      return a.label.localeCompare(b.label, undefined, { sensitivity: 'base' })
    })

  const pathMap = new Map<string, KnowledgePathRef>()
  for (const topic of topics) {
    for (const path of topic.paths) {
      const prior = pathMap.get(path.slug)
      pathMap.set(path.slug, prior ? preferPathRef(prior, path) : path)
    }
  }
  const paths = [...pathMap.values()].sort((a, b) =>
    a.title.localeCompare(b.title, undefined, { sensitivity: 'base' })
  )

  const allowed = new Set(topics.map((topic) => topic.id))
  const edges: KnowledgeGraphViewEdge[] = []
  const seen = new Set<string>()
  for (const edge of input.edges) {
    if (!allowed.has(edge.fromId) || !allowed.has(edge.toId)) continue
    const key = `${edge.fromId}\0${edge.toId}\0${edge.kind}`
    if (seen.has(key)) continue
    seen.add(key)
    edges.push(edge)
  }

  const recurring = topics.filter((topic) => topic.paths.length >= 2)
  return {
    source: input.source,
    topics,
    paths,
    edges,
    stats: {
      topicCount: topics.length,
      pathCount: paths.length,
      recurringCount: recurring.length,
      recurringTopicCount: recurring.filter(topicIsGraphDefault).length
    }
  }
}

export function compactKnowledgeGraphView(
  graph: KnowledgeGraphView,
  includeConcepts: boolean
): KnowledgeGraphView {
  const topics = graph.topics.filter((topic) => {
    if (topic.paths.length < 2) return false
    if (includeConcepts) return !isKnowledgeGraphScaffoldLabel(topic.label)
    return topicIsGraphDefault(topic)
  })
  const pathMap = new Map<string, KnowledgePathRef>()
  for (const topic of topics) {
    for (const path of topic.paths) {
      const prior = pathMap.get(path.slug)
      pathMap.set(path.slug, prior ? preferPathRef(prior, path) : path)
    }
  }
  const paths = [...pathMap.values()].sort((a, b) =>
    a.title.localeCompare(b.title, undefined, { sensitivity: 'base' })
  )
  const allowed = new Set(topics.map((topic) => topic.id))
  return {
    ...graph,
    topics,
    paths,
    edges: graph.edges.filter(
      (edge) => allowed.has(edge.fromId) && allowed.has(edge.toId)
    )
  }
}

export function knowledgeGraphViewFromHarvest(
  harvest: KnowledgeHarvest,
  options?: {
    topics?: Map<string, KnowledgeTopicRecord>
    source?: KnowledgeGraphView['source']
  }
): KnowledgeGraphView {
  const catalog = options?.topics
  const topicRecords: KnowledgeTopicRecord[] = catalog
    ? [...catalog.values()]
    : [...harvest.labels.entries()].map(([normalizedLabel, label]) => ({
        id: normalizedLabel,
        label,
        normalizedLabel
      }))
  const idByNormalized = new Map(
    topicRecords.map((topic) => [topic.normalizedLabel, topic.id])
  )
  const edges: KnowledgeGraphViewEdge[] = []
  for (const edge of harvest.edges) {
    const fromId = idByNormalized.get(edge.fromNormalized)
    const toId = idByNormalized.get(edge.toNormalized)
    if (!fromId || !toId || fromId === toId) continue
    edges.push({ fromId, toId, kind: edge.kind })
  }
  return knowledgeGraphViewFromOccurrences({
    topics: topicRecords,
    occurrences: [...harvest.occurrences.values()],
    edges,
    source: options?.source ?? 'live_harvest'
  })
}
