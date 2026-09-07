import type { SupabaseClient } from '@supabase/supabase-js'

import { courseLearningPathIsFilled } from '@/lib/course-learning-path-types'
import {
  type HarvestedPathGraph,
  type KnowledgeEdgeKind,
  type KnowledgeEdgeSource,
  type KnowledgeGraphEdgeDraft,
  type KnowledgeNodeKind,
  type KnowledgePathRef,
  type KnowledgeTopicRecord,
  harvestGraphFromLearningPathData,
  isKnowledgeNodeKind,
  isKnowledgePathKind,
  isPublicLearningPathRow,
  mergeEdgeDrafts,
  preferKnowledgeNodeKind
} from '@/lib/knowledge-graph'
import { normalizeKnowledgeTopicLabel } from '@/lib/learning-path-knowledge'
import { SEEDED_LEARNING_PATHS } from '@/lib/learning-path-seed'

const TOPIC_UPSERT_CHUNK = 200
const EDGE_UPSERT_CHUNK = 200
const OCCURRENCE_UPSERT_CHUNK = 200

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const PATH_HARVEST_COLUMNS =
  'id, slug, title, kind, visibility, is_catalog, is_private, data'

export function isKnowledgePathUuid(
  id: string | null | undefined
): id is string {
  return Boolean(id && UUID_RE.test(id))
}

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

export type KnowledgeTopicOccurrenceDraft = {
  normalizedLabel: string
  label: string
  nodeKind: KnowledgeNodeKind
  path: KnowledgePathRef
}

export type KnowledgeHarvest = {
  labels: Map<string, string>
  edges: KnowledgeGraphEdgeDraft[]
  groups: string[][]
  occurrences: Map<string, KnowledgeTopicOccurrenceDraft>
}

function occurrenceKey(normalizedLabel: string, pathSlug: string) {
  return `${normalizedLabel}\0${pathSlug}`
}

export function emptyKnowledgeHarvest(): KnowledgeHarvest {
  return {
    labels: new Map(),
    edges: [],
    groups: [],
    occurrences: new Map()
  }
}

export function knowledgeHarvestOccurrenceList(
  harvest: KnowledgeHarvest
): KnowledgeTopicOccurrenceDraft[] {
  return [...harvest.occurrences.values()]
}

function addLabel(labels: Map<string, string>, raw: string) {
  const label = raw.trim().slice(0, 120)
  const key = normalizeKnowledgeTopicLabel(label)
  if (!label || !key) return
  if (!labels.has(key)) labels.set(key, label)
}

export function knowledgePathRefFromRow(row: {
  id?: string | null
  slug?: string | null
  title?: string | null
  kind?: string | null
}): KnowledgePathRef | null {
  const slug = (row.slug || '').trim()
  if (!slug) return null
  const kind = isKnowledgePathKind(row.kind) ? row.kind : 'community'
  const title = (row.title || slug).trim() || slug
  return {
    id: (row.id || slug).trim() || slug,
    slug,
    title,
    kind
  }
}

function addOccurrence(
  harvest: KnowledgeHarvest,
  label: string,
  nodeKind: KnowledgeNodeKind,
  path: KnowledgePathRef
) {
  const trimmed = label.trim().slice(0, 120)
  const normalized = normalizeKnowledgeTopicLabel(trimmed)
  const slug = path.slug.trim()
  if (!trimmed || !normalized || !slug) return
  addLabel(harvest.labels, trimmed)
  const key = occurrenceKey(normalized, slug)
  const existing = harvest.occurrences.get(key)
  if (existing) {
    existing.nodeKind = preferKnowledgeNodeKind(existing.nodeKind, nodeKind)
    if (
      !isKnowledgePathUuid(existing.path.id) &&
      isKnowledgePathUuid(path.id)
    ) {
      existing.path = path
    } else if (path.title && existing.path.title === existing.path.slug) {
      existing.path = { ...existing.path, title: path.title }
    }
    return
  }
  harvest.occurrences.set(key, {
    normalizedLabel: normalized,
    label: harvest.labels.get(normalized) || trimmed,
    nodeKind,
    path: {
      id: path.id,
      slug,
      title: path.title.trim() || slug,
      kind: path.kind
    }
  })
}

export function mergeHarvested(
  harvest: KnowledgeHarvest,
  graph: HarvestedPathGraph,
  path?: KnowledgePathRef | null
) {
  const group: string[] = []
  const seen = new Set<string>()
  const topics =
    graph.topics.length > 0
      ? graph.topics
      : graph.labels.map((label) => ({
          label,
          nodeKind: 'path_node' as const
        }))
  for (const item of topics) {
    addLabel(harvest.labels, item.label)
    const key = normalizeKnowledgeTopicLabel(item.label)
    if (key && !seen.has(key)) {
      seen.add(key)
      group.push(key)
    }
    if (path) addOccurrence(harvest, item.label, item.nodeKind, path)
  }
  if (group.length > 0) harvest.groups.push(group)
  harvest.edges.push(...graph.edges)
}

export function collectSeededHarvest(): KnowledgeHarvest {
  const harvest = emptyKnowledgeHarvest()
  for (const path of SEEDED_LEARNING_PATHS) {
    const graph = harvestGraphFromLearningPathData(path)
    if (!graph) continue
    mergeHarvested(harvest, graph, {
      id: path.id || path.slug,
      slug: path.slug,
      title: path.title,
      kind: 'community'
    })
  }
  return harvest
}

export function collectHarvestFromPathRows(
  rows: PathRow[],
  harvest: KnowledgeHarvest
) {
  for (const row of rows) {
    if (!isPublicLearningPathRow(row)) continue
    if (row.kind === 'course' && !courseLearningPathIsFilled(row.data)) {
      continue
    }
    const graph = harvestGraphFromLearningPathData(row.data)
    if (!graph) continue
    mergeHarvested(harvest, graph, knowledgePathRefFromRow(row))
  }
}

async function selectPublicPathRows(
  admin: SupabaseClient,
  query: { kind?: string | string[]; filledCourses?: boolean }
): Promise<PathRow[]> {
  let request = admin.from('learning_paths').select(PATH_HARVEST_COLUMNS)
  if (query.filledCourses) {
    request = request.eq('kind', 'course').eq('is_filled', true)
  } else if (typeof query.kind === 'string') {
    request = request.eq('kind', query.kind)
  } else if (Array.isArray(query.kind)) {
    request = request.in('kind', query.kind)
  }
  const { data, error } = await request.limit(2000)
  if (error || !Array.isArray(data)) return []
  return data as PathRow[]
}

export async function collectPublicPathHarvest(
  admin: SupabaseClient
): Promise<KnowledgeHarvest> {
  const harvest = collectSeededHarvest()
  const filledCourses = await selectPublicPathRows(admin, {
    filledCourses: true
  })
  if (filledCourses.length > 0) {
    collectHarvestFromPathRows(filledCourses, harvest)
  } else {
    collectHarvestFromPathRows(
      await selectPublicPathRows(admin, { kind: 'course' }),
      harvest
    )
  }
  collectHarvestFromPathRows(
    await selectPublicPathRows(admin, { kind: ['community', 'research'] }),
    harvest
  )
  const { data: userTopics } = await admin
    .from('user_knowledge_topics')
    .select('label')
    .limit(8000)
  if (Array.isArray(userTopics)) {
    for (const row of userTopics) {
      if (row && typeof row.label === 'string') {
        addLabel(harvest.labels, row.label)
      }
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
  const page = 1000
  let from = 0
  for (;;) {
    const { data, error } = await admin
      .from('knowledge_topics')
      .select('id, label, normalized_label')
      .range(from, from + page - 1)
    if (error || !Array.isArray(data) || data.length === 0) return map
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
    if (data.length < page) break
    from += page
    if (from > 80000) break
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

export async function upsertTopicPathOccurrences(
  admin: SupabaseClient,
  drafts: Iterable<KnowledgeTopicOccurrenceDraft>,
  topics: Map<string, KnowledgeTopicRecord>,
  replaceAll = false
) {
  if (replaceAll) {
    const { error: deleteError } = await admin
      .from('knowledge_topic_path_occurrences')
      .delete()
      .not('id', 'is', null)
    if (
      deleteError &&
      deleteError.code !== '42P01' &&
      deleteError.code !== 'PGRST205'
    ) {
      console.error('upsertTopicPathOccurrences delete failed', deleteError)
    }
  }
  const now = new Date().toISOString()
  const rows: {
    topic_id: string
    path_id: string | null
    path_slug: string
    path_title: string
    path_kind: KnowledgePathRef['kind']
    node_kind: KnowledgeNodeKind
    updated_at: string
  }[] = []
  const seen = new Set<string>()
  for (const draft of drafts) {
    const topic = topics.get(draft.normalizedLabel)
    const slug = draft.path.slug.trim()
    if (!topic || !slug) continue
    const key = `${topic.id}\0${slug}`
    if (seen.has(key)) continue
    seen.add(key)
    rows.push({
      topic_id: topic.id,
      path_id: isKnowledgePathUuid(draft.path.id) ? draft.path.id : null,
      path_slug: slug,
      path_title: draft.path.title.trim() || slug,
      path_kind: draft.path.kind,
      node_kind: isKnowledgeNodeKind(draft.nodeKind)
        ? draft.nodeKind
        : 'path_node',
      updated_at: now
    })
  }
  for (const part of chunk(rows, OCCURRENCE_UPSERT_CHUNK)) {
    if (part.length === 0) continue
    const { error } = await admin
      .from('knowledge_topic_path_occurrences')
      .upsert(part, {
        onConflict: 'topic_id,path_slug'
      })
    if (error && error.code !== '42P01' && error.code !== 'PGRST205') {
      console.error('upsertTopicPathOccurrences failed', error)
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
  occurrenceCount: number
}> {
  const harvest = await collectPublicPathHarvest(admin)
  const topics = await upsertKnowledgeTopics(admin, harvest.labels.values())
  await upsertStructuralEdges(admin, harvest.edges, topics)
  await upsertTopicPathOccurrences(
    admin,
    harvest.occurrences.values(),
    topics,
    true
  )
  return {
    harvest,
    topics,
    topicCount: topics.size,
    edgeCount: harvest.edges.length,
    occurrenceCount: harvest.occurrences.size
  }
}

export async function ingestKnowledgeLabelsAndEdges(
  admin: SupabaseClient,
  input: {
    labels: string[]
    edges?: KnowledgeGraphEdgeDraft[]
    path?: KnowledgePathRef | null
    nodeKind?: KnowledgeNodeKind
  }
) {
  const topics = await upsertKnowledgeTopics(admin, input.labels)
  if (input.edges?.length) {
    await upsertStructuralEdges(admin, input.edges, topics)
  }
  if (input.path?.slug) {
    const nodeKind = input.nodeKind ?? 'path_node'
    const harvest = emptyKnowledgeHarvest()
    for (const label of input.labels) {
      addOccurrence(harvest, label, nodeKind, input.path)
    }
    await upsertTopicPathOccurrences(admin, harvest.occurrences.values(), topics)
  }
  return topics
}
