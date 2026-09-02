import type { SupabaseClient } from '@supabase/supabase-js'

import {
  type HarvestedPathGraph,
  type KnowledgeEdgeKind,
  type KnowledgeEdgeSource,
  type KnowledgeGraphEdgeDraft,
  type KnowledgeTopicRecord,
  harvestGraphFromLearningPathData,
  isPublicLearningPathRow,
  mergeEdgeDrafts
} from '@/lib/knowledge-graph'
import { normalizeKnowledgeTopicLabel } from '@/lib/learning-path-knowledge'
import { SEEDED_LEARNING_PATHS } from '@/lib/learning-path-seed'

const TOPIC_UPSERT_CHUNK = 200
const EDGE_UPSERT_CHUNK = 200

type PathRow = {
  id: string
  slug: string
  title?: string | null
  kind?: string | null
  visibility?: string | null
  is_catalog?: boolean | null
  is_private?: boolean | null
  data?: unknown
}

export type KnowledgeHarvest = {
  labels: Map<string, string>
  edges: KnowledgeGraphEdgeDraft[]
  groups: string[][]
}

function addLabel(labels: Map<string, string>, raw: string) {
  const label = raw.trim().slice(0, 120)
  const key = normalizeKnowledgeTopicLabel(label)
  if (!label || !key) return
  if (!labels.has(key)) labels.set(key, label)
}

function mergeHarvested(
  harvest: KnowledgeHarvest,
  graph: HarvestedPathGraph
) {
  const group: string[] = []
  const seen = new Set<string>()
  for (const label of graph.labels) {
    addLabel(harvest.labels, label)
    const key = normalizeKnowledgeTopicLabel(label)
    if (key && !seen.has(key)) {
      seen.add(key)
      group.push(key)
    }
  }
  if (group.length > 0) harvest.groups.push(group)
  harvest.edges.push(...graph.edges)
}

export function collectSeededHarvest(): KnowledgeHarvest {
  const harvest: KnowledgeHarvest = {
    labels: new Map(),
    edges: [],
    groups: []
  }
  for (const path of SEEDED_LEARNING_PATHS) {
    const graph = harvestGraphFromLearningPathData(path)
    if (graph) mergeHarvested(harvest, graph)
  }
  return harvest
}

export function collectHarvestFromPathRows(
  rows: PathRow[],
  harvest: KnowledgeHarvest
) {
  for (const row of rows) {
    if (!isPublicLearningPathRow(row)) continue
    const graph = harvestGraphFromLearningPathData(row.data)
    if (graph) mergeHarvested(harvest, graph)
  }
}

export async function collectPublicPathHarvest(
  admin: SupabaseClient
): Promise<KnowledgeHarvest> {
  const harvest = collectSeededHarvest()
  const { data, error } = await admin
    .from('learning_paths')
    .select('id, slug, title, kind, visibility, is_catalog, is_private, data')
    .limit(2000)
  if (error || !Array.isArray(data)) return harvest
  collectHarvestFromPathRows(data as PathRow[], harvest)
  const { data: userTopics } = await admin
    .from('user_knowledge_topics')
    .select('label')
    .limit(8000)
  if (Array.isArray(userTopics)) {
    for (const row of userTopics) {
      if (row && typeof row.label === 'string') addLabel(harvest.labels, row.label)
    }
  }
  harvest.edges = mergeEdgeDrafts(harvest.edges)
  return harvest
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size))
  }
  return out
}

export async function upsertKnowledgeTopics(
  admin: SupabaseClient,
  labels: Iterable<string>
): Promise<Map<string, KnowledgeTopicRecord>> {
  const now = new Date().toISOString()
  const rows: { label: string; normalized_label: string; last_seen_at: string }[] =
    []
  const seen = new Set<string>()
  for (const raw of labels) {
    const label = raw.trim().slice(0, 120)
    const normalized = normalizeKnowledgeTopicLabel(label)
    if (!label || !normalized || seen.has(normalized)) continue
    seen.add(normalized)
    rows.push({
      label,
      normalized_label: normalized,
      last_seen_at: now
    })
  }
  for (const part of chunk(rows, TOPIC_UPSERT_CHUNK)) {
    if (part.length === 0) continue
    const { error } = await admin.from('knowledge_topics').upsert(part, {
      onConflict: 'normalized_label'
    })
    if (error && error.code !== '42P01' && error.code !== 'PGRST205') {
      console.error('upsertKnowledgeTopics failed', error)
    }
  }
  return listKnowledgeTopicsMap(admin)
}

export async function listKnowledgeTopicsMap(
  admin: SupabaseClient
): Promise<Map<string, KnowledgeTopicRecord>> {
  const map = new Map<string, KnowledgeTopicRecord>()
  const { data, error } = await admin
    .from('knowledge_topics')
    .select('id, label, normalized_label')
    .limit(20000)
  if (error || !Array.isArray(data)) return map
  for (const row of data) {
    const rec = row as {
      id: string
      label: string
      normalized_label: string
    }
    map.set(rec.normalized_label, {
      id: rec.id,
      label: rec.label,
      normalizedLabel: rec.normalized_label
    })
  }
  return map
}

export async function upsertStructuralEdges(
  admin: SupabaseClient,
  drafts: KnowledgeGraphEdgeDraft[],
  topics: Map<string, KnowledgeTopicRecord>
) {
  const now = new Date().toISOString()
  const rows: {
    from_id: string
    to_id: string
    kind: KnowledgeEdgeKind
    source: KnowledgeEdgeSource
    confidence: number
    updated_at: string
  }[] = []
  for (const edge of mergeEdgeDrafts(drafts)) {
    const from = topics.get(edge.fromNormalized)
    const to = topics.get(edge.toNormalized)
    if (!from || !to || from.id === to.id) continue
    rows.push({
      from_id: from.id,
      to_id: to.id,
      kind: edge.kind,
      source: 'path_structure',
      confidence: 1,
      updated_at: now
    })
  }
  for (const part of chunk(rows, EDGE_UPSERT_CHUNK)) {
    if (part.length === 0) continue
    const { error } = await admin.from('knowledge_topic_edges').upsert(part, {
      onConflict: 'from_id,to_id,kind'
    })
    if (error && error.code !== '42P01' && error.code !== 'PGRST205') {
      console.error('upsertStructuralEdges failed', error)
    }
  }
}

export async function harvestPublicKnowledgeGraph(
  admin: SupabaseClient
): Promise<{
  harvest: KnowledgeHarvest
  topics: Map<string, KnowledgeTopicRecord>
  topicCount: number
  edgeCount: number
}> {
  const harvest = await collectPublicPathHarvest(admin)
  const topics = await upsertKnowledgeTopics(admin, harvest.labels.values())
  await upsertStructuralEdges(admin, harvest.edges, topics)
  return {
    harvest,
    topics,
    topicCount: topics.size,
    edgeCount: harvest.edges.length
  }
}

export async function ingestKnowledgeLabelsAndEdges(
  admin: SupabaseClient,
  input: {
    labels: string[]
    edges?: KnowledgeGraphEdgeDraft[]
  }
) {
  const topics = await upsertKnowledgeTopics(admin, input.labels)
  if (input.edges?.length) {
    await upsertStructuralEdges(admin, input.edges, topics)
  }
  return topics
}
