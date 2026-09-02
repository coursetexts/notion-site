/**
 * Client reads of the shared knowledge graph, plus ingest of new labels/edges.
 */

import { getSupabaseClient } from '@/lib/supabase'
import {
  type KnowledgeGraphEdgeDraft,
  type KnowledgeGraphViewEdge,
  type KnowledgeTopicRecord
} from '@/lib/knowledge-graph'

export type KnowledgeGraphSubsetTopic = {
  id: string
  label: string
  normalizedLabel: string
}

export type KnowledgeGraphSubset = {
  nodes: KnowledgeTopicRecord[]
  edges: KnowledgeGraphViewEdge[]
}

export function subsetFromUserTopics(
  topics: KnowledgeGraphSubsetTopic[]
): KnowledgeGraphSubset {
  return {
    nodes: topics.map((topic) => ({
      id: topic.id,
      label: topic.label,
      normalizedLabel: topic.normalizedLabel
    })),
    edges: []
  }
}

export async function listKnowledgeGraphSubset(
  topics: KnowledgeGraphSubsetTopic[]
): Promise<KnowledgeGraphSubset> {
  const fallback = subsetFromUserTopics(topics)
  if (topics.length === 0) return fallback
  const supabase = getSupabaseClient()
  if (!supabase) return fallback
  const labels = topics.map((topic) => topic.normalizedLabel)
  const { data: catalog, error: catalogError } = await supabase
    .from('knowledge_topics')
    .select('id, label, normalized_label')
    .in('normalized_label', labels)
  if (catalogError || !Array.isArray(catalog) || catalog.length === 0) {
    return fallback
  }
  const catalogNodes: KnowledgeTopicRecord[] = catalog.map((row) => {
    const rec = row as {
      id: string
      label: string
      normalized_label: string
    }
    return {
      id: rec.id,
      label: rec.label,
      normalizedLabel: rec.normalized_label
    }
  })
  const byNormalized = new Map(
    catalogNodes.map((node) => [node.normalizedLabel, node])
  )
  const nodes: KnowledgeTopicRecord[] = topics.map((topic) => {
    const catalogNode = byNormalized.get(topic.normalizedLabel)
    return catalogNode
      ? { ...catalogNode, label: topic.label }
      : {
          id: topic.id,
          label: topic.label,
          normalizedLabel: topic.normalizedLabel
        }
  })
  const catalogIds = catalogNodes.map((node) => node.id)
  const { data: edgeRows, error: edgeError } = await supabase
    .from('knowledge_topic_edges')
    .select('from_id, to_id, kind')
    .in('from_id', catalogIds)
  if (edgeError || !Array.isArray(edgeRows)) {
    return { nodes, edges: [] }
  }
  const allowed = new Set(catalogIds)
  const edges: KnowledgeGraphViewEdge[] = []
  const seen = new Set<string>()
  for (const row of edgeRows) {
    const rec = row as { from_id: string; to_id: string; kind: KnowledgeGraphViewEdge['kind'] }
    if (!allowed.has(rec.from_id) || !allowed.has(rec.to_id)) continue
    const key = `${rec.from_id}\0${rec.to_id}\0${rec.kind}`
    if (seen.has(key)) continue
    seen.add(key)
    edges.push({
      fromId: rec.from_id,
      toId: rec.to_id,
      kind: rec.kind
    })
  }
  return { nodes, edges }
}

export async function ingestKnowledgeGraph(input: {
  labels: string[]
  edges?: KnowledgeGraphEdgeDraft[]
}): Promise<void> {
  if (typeof window === 'undefined') return
  const labels = input.labels.map((label) => label.trim()).filter(Boolean)
  if (labels.length === 0) return
  const supabase = getSupabaseClient()
  const session = supabase
    ? (await supabase.auth.getSession()).data.session
    : null
  const accessToken = session?.access_token
  if (!accessToken) return
  try {
    await fetch('/api/knowledge-graph/ingest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        labels,
        edges: input.edges ?? []
      })
    })
  } catch {
    /* ingest is best-effort; the daily job will catch up */
  }
}
