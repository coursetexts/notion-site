/**
 * Collective knowledge-graph harvest + Gemini edges.
 * Implemented but disabled: no Vercel cron, and the handler no-ops unless
 * KNOWLEDGE_GRAPH_CRON_ENABLED=true. See docs/knowledge.md.
 */
import type { NextApiRequest, NextApiResponse } from 'next'

import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { harvestPublicKnowledgeGraph } from '@/lib/knowledge-graph-harvest'
import { applyLlmKnowledgeEdges } from '@/lib/knowledge-graph-llm'

export const config = {
  maxDuration: 60
}

function isCronEnabled() {
  return process.env.KNOWLEDGE_GRAPH_CRON_ENABLED === 'true'
}

function isCronAuthorized(req: NextApiRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const header = req.headers.authorization
  return typeof header === 'string' && header === `Bearer ${secret}`
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }
  if (!isCronEnabled()) {
    return res.status(200).json({
      ok: true,
      disabled: true,
      message:
        'Collective knowledge-graph cron is disabled. Set KNOWLEDGE_GRAPH_CRON_ENABLED=true and restore the Vercel cron in vercel.json to run it. See docs/knowledge.md.'
    })
  }
  if (!isCronAuthorized(req)) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const admin = getSupabaseAdmin()
  if (!admin) {
    return res.status(500).json({
      error: 'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY'
    })
  }

  try {
    const harvested = await harvestPublicKnowledgeGraph(admin)
    const llm = await applyLlmKnowledgeEdges(
      admin,
      harvested.harvest,
      harvested.topics
    )
    return res.status(200).json({
      ok: true,
      topics: harvested.topicCount,
      structuralEdges: harvested.edgeCount,
      llm
    })
  } catch (error: unknown) {
    console.error('[rebuild-knowledge-graph]', error)
    return res.status(500).json({ error: 'Knowledge graph rebuild failed' })
  }
}
