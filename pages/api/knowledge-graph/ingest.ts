import type { NextApiRequest, NextApiResponse } from 'next'

import { getApiUser } from '@/lib/api-user'
import {
  type KnowledgeGraphEdgeDraft,
  isKnowledgeEdgeKind,
  mergeEdgeDrafts
} from '@/lib/knowledge-graph'
import { ingestKnowledgeLabelsAndEdges } from '@/lib/knowledge-graph-harvest'
import { normalizeKnowledgeTopicLabel } from '@/lib/learning-path-knowledge'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

function readDrafts(raw: unknown): KnowledgeGraphEdgeDraft[] {
  if (!Array.isArray(raw)) return []
  const drafts: KnowledgeGraphEdgeDraft[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const row = item as {
      fromNormalized?: unknown
      toNormalized?: unknown
      kind?: unknown
    }
    const fromNormalized = normalizeKnowledgeTopicLabel(
      String(row.fromNormalized || '')
    )
    const toNormalized = normalizeKnowledgeTopicLabel(
      String(row.toNormalized || '')
    )
    if (!isKnowledgeEdgeKind(row.kind)) continue
    drafts.push({ fromNormalized, toNormalized, kind: row.kind })
  }
  return mergeEdgeDrafts(drafts)
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const auth = await getApiUser(req)
  if (!auth) {
    return res.status(401).json({ error: 'Sign in to update the knowledge graph.' })
  }

  const admin = getSupabaseAdmin()
  if (!admin) {
    return res.status(204).end()
  }

  const body = req.body && typeof req.body === 'object' ? req.body : {}
  const labelsRaw = (body as { labels?: unknown }).labels
  const labels = Array.isArray(labelsRaw)
    ? labelsRaw
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 400)
    : []
  if (labels.length === 0) {
    return res.status(400).json({ error: 'labels are required' })
  }

  try {
    await ingestKnowledgeLabelsAndEdges(admin, {
      labels,
      edges: readDrafts((body as { edges?: unknown }).edges)
    })
    return res.status(200).json({ ok: true })
  } catch (error: unknown) {
    console.error('[knowledge-graph/ingest]', error)
    return res.status(500).json({ error: 'Could not ingest knowledge topics' })
  }
}
