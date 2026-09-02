import got from 'got'

import type { SupabaseClient } from '@supabase/supabase-js'

import {
  type KnowledgeGraphEdgeDraft,
  type KnowledgeTopicRecord,
  isKnowledgeEdgeKind,
  mergeEdgeDrafts
} from '@/lib/knowledge-graph'
import type { KnowledgeHarvest } from '@/lib/knowledge-graph-harvest'
import { extractJsonObject } from '@/lib/learning-path-fill'
import { normalizeKnowledgeTopicLabel } from '@/lib/learning-path-knowledge'

/** Used by the disabled daily cron. Enable via docs/knowledge.md. */
export const KNOWLEDGE_GRAPH_LLM_TOPIC_LIMIT = 8
export const KNOWLEDGE_GRAPH_LLM_CANDIDATE_LIMIT = 14
export const KNOWLEDGE_GRAPH_LLM_MIN_CONFIDENCE = 0.55

type GeminiPart = { text?: string }

type GeminiGenerateContentResponse = {
  candidates?: Array<{
    content?: { parts?: GeminiPart[] }
  }>
  promptFeedback?: { blockReason?: string }
}

const SYSTEM_PROMPT = [
  'You link existing Coursetexts knowledge topics into a graph.',
  'Only use the topic labels provided. Do not invent topics.',
  'Return JSON only: {"edges":[{"from":string,"to":string,"kind":"prerequisite"|"related"|"part_of","confidence":number}]}',
  'kind prerequisite: "from" is needed before "to".',
  'kind part_of: "from" is a part or subtopic of "to".',
  'kind related: the two topics are useful together but neither contains the other.',
  'confidence is 0 to 1. Omit weak or speculative links.',
  'Prefer precision over coverage. Skip homonyms and coincidental word overlap.'
].join('\n')

export const KNOWLEDGE_GRAPH_LLM_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    edges: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          from: { type: 'string' },
          to: { type: 'string' },
          kind: {
            type: 'string',
            enum: ['prerequisite', 'related', 'part_of']
          },
          confidence: { type: 'number' }
        },
        required: ['from', 'to', 'kind']
      }
    }
  },
  required: ['edges']
}

function textFromGemini(data: GeminiGenerateContentResponse) {
  const parts = data.candidates?.[0]?.content?.parts ?? []
  return parts
    .map((part) => (typeof part.text === 'string' ? part.text : ''))
    .join('')
    .trim()
}

function hashString(value: string) {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0
  }
  return hash
}

function neighborsForTopic(
  topic: string,
  harvest: KnowledgeHarvest
): string[] {
  const found = new Set<string>()
  for (const group of harvest.groups) {
    if (!group.includes(topic)) continue
    for (const other of group) {
      if (other !== topic) found.add(other)
    }
  }
  return [...found]
}

export function pickLlmFocusTopics(
  topics: KnowledgeTopicRecord[],
  lastLlmAt: Map<string, string | null>,
  limit: number
): KnowledgeTopicRecord[] {
  const yesterday = Date.now() - 20 * 60 * 60 * 1000
  const ranked = [...topics].sort((a, b) => {
    const aAt = lastLlmAt.get(a.normalizedLabel)
    const bAt = lastLlmAt.get(b.normalizedLabel)
    const aNeeds = !aAt || new Date(aAt).getTime() < yesterday
    const bNeeds = !bAt || new Date(bAt).getTime() < yesterday
    if (aNeeds !== bNeeds) return aNeeds ? -1 : 1
    const aTime = aAt ? new Date(aAt).getTime() : 0
    const bTime = bAt ? new Date(bAt).getTime() : 0
    return aTime - bTime
  })
  return ranked.slice(0, limit)
}

export function candidatesForTopic(
  topic: KnowledgeTopicRecord,
  catalog: KnowledgeTopicRecord[],
  harvest: KnowledgeHarvest,
  limit: number
): KnowledgeTopicRecord[] {
  const byKey = new Map(
    catalog.map((item) => [item.normalizedLabel, item])
  )
  const picked: KnowledgeTopicRecord[] = []
  const seen = new Set<string>([topic.normalizedLabel])
  for (const key of neighborsForTopic(topic.normalizedLabel, harvest)) {
    const item = byKey.get(key)
    if (!item || seen.has(item.normalizedLabel)) continue
    seen.add(item.normalizedLabel)
    picked.push(item)
    if (picked.length >= limit) return picked
  }
  const rest = catalog
    .filter((item) => !seen.has(item.normalizedLabel))
    .sort(
      (a, b) =>
        hashString(`${topic.normalizedLabel}:${a.normalizedLabel}`) -
        hashString(`${topic.normalizedLabel}:${b.normalizedLabel}`)
    )
  for (const item of rest) {
    picked.push(item)
    if (picked.length >= limit) break
  }
  return picked
}

function parseLlmEdges(
  raw: unknown,
  allowed: Set<string>
): KnowledgeGraphEdgeDraft[] {
  const record =
    raw && typeof raw === 'object' && !Array.isArray(raw)
      ? (raw as { edges?: unknown })
      : { edges: raw }
  if (!Array.isArray(record.edges)) return []
  const drafts: KnowledgeGraphEdgeDraft[] = []
  for (const item of record.edges) {
    if (!item || typeof item !== 'object') continue
    const row = item as {
      from?: unknown
      to?: unknown
      kind?: unknown
      confidence?: unknown
    }
    const from = normalizeKnowledgeTopicLabel(String(row.from || ''))
    const to = normalizeKnowledgeTopicLabel(String(row.to || ''))
    if (!from || !to || from === to) continue
    if (!allowed.has(from) || !allowed.has(to)) continue
    if (!isKnowledgeEdgeKind(row.kind)) continue
    const confidence =
      typeof row.confidence === 'number' ? row.confidence : 0.7
    if (confidence < KNOWLEDGE_GRAPH_LLM_MIN_CONFIDENCE) continue
    drafts.push({ fromNormalized: from, toNormalized: to, kind: row.kind })
  }
  return mergeEdgeDrafts(drafts)
}

async function generateLinks(
  apiKey: string,
  model: string,
  userPrompt: string,
  withSchema: boolean
) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model
  )}:generateContent`
  return got
    .post(url, {
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      json: {
        systemInstruction: {
          parts: [{ text: SYSTEM_PROMPT }]
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: userPrompt }]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 4096,
          responseMimeType: 'application/json',
          ...(withSchema
            ? { responseSchema: KNOWLEDGE_GRAPH_LLM_RESPONSE_SCHEMA }
            : {})
        }
      },
      timeout: { request: 40000 }
    })
    .json<GeminiGenerateContentResponse>()
}

function buildUserPrompt(
  focus: Array<{ topic: KnowledgeTopicRecord; candidates: KnowledgeTopicRecord[] }>
) {
  const blocks = focus.map((item, index) => {
    const candidateLines = item.candidates
      .map((candidate) => `- ${candidate.label}`)
      .join('\n')
    return [
      `Focus ${index + 1}: ${item.topic.label}`,
      'Candidates:',
      candidateLines || '- (none)'
    ].join('\n')
  })
  return [
    'Propose edges among these existing topics.',
    'from and to must be labels from Focus or Candidates (same spelling).',
    '',
    blocks.join('\n\n')
  ].join('\n')
}

export async function applyLlmKnowledgeEdges(
  admin: SupabaseClient,
  harvest: KnowledgeHarvest,
  topics: Map<string, KnowledgeTopicRecord>
): Promise<{ focusCount: number; edgeCount: number; skipped: boolean }> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return { focusCount: 0, edgeCount: 0, skipped: true }
  }
  const catalog = [...topics.values()]
  if (catalog.length < 2) {
    return { focusCount: 0, edgeCount: 0, skipped: true }
  }

  const { data: llmRows } = await admin
    .from('knowledge_topics')
    .select('normalized_label, last_llm_at')
    .limit(20000)
  const lastLlmAt = new Map<string, string | null>()
  if (Array.isArray(llmRows)) {
    for (const row of llmRows) {
      const rec = row as { normalized_label?: string; last_llm_at?: string | null }
      if (typeof rec.normalized_label === 'string') {
        lastLlmAt.set(rec.normalized_label, rec.last_llm_at ?? null)
      }
    }
  }

  const focusTopics = pickLlmFocusTopics(
    catalog,
    lastLlmAt,
    KNOWLEDGE_GRAPH_LLM_TOPIC_LIMIT
  )
  const focus = focusTopics.map((topic) => ({
    topic,
    candidates: candidatesForTopic(
      topic,
      catalog,
      harvest,
      KNOWLEDGE_GRAPH_LLM_CANDIDATE_LIMIT
    )
  }))
  const allowed = new Set<string>()
  for (const item of focus) {
    allowed.add(item.topic.normalizedLabel)
    for (const candidate of item.candidates) {
      allowed.add(candidate.normalizedLabel)
    }
  }

  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash'
  const prompt = buildUserPrompt(focus)
  let completion: GeminiGenerateContentResponse
  try {
    try {
      completion = await generateLinks(apiKey, model, prompt, true)
    } catch {
      completion = await generateLinks(apiKey, model, prompt, false)
    }
  } catch (error: unknown) {
    console.error('applyLlmKnowledgeEdges generate failed', error)
    return { focusCount: focusTopics.length, edgeCount: 0, skipped: true }
  }
  if (completion.promptFeedback?.blockReason) {
    return { focusCount: focusTopics.length, edgeCount: 0, skipped: true }
  }
  const rawText = textFromGemini(completion)
  if (!rawText) {
    return { focusCount: focusTopics.length, edgeCount: 0, skipped: true }
  }
  let parsed: unknown
  try {
    parsed = extractJsonObject(rawText)
  } catch {
    return { focusCount: focusTopics.length, edgeCount: 0, skipped: true }
  }
  const drafts = parseLlmEdges(parsed, allowed)
  const focusIds = focusTopics
    .map((topic) => topic.id)
    .filter(Boolean)
  if (focusIds.length > 0) {
    await admin
      .from('knowledge_topic_edges')
      .delete()
      .eq('source', 'llm')
      .in('from_id', focusIds)
    await admin
      .from('knowledge_topic_edges')
      .delete()
      .eq('source', 'llm')
      .in('to_id', focusIds)
  }

  const now = new Date().toISOString()
  const rows = drafts.flatMap((edge) => {
    const from = topics.get(edge.fromNormalized)
    const to = topics.get(edge.toNormalized)
    if (!from || !to || from.id === to.id) return []
    return [
      {
        from_id: from.id,
        to_id: to.id,
        kind: edge.kind,
        source: 'llm' as const,
        confidence: 0.75,
        updated_at: now
      }
    ]
  })
  if (rows.length > 0) {
    const { error } = await admin.from('knowledge_topic_edges').upsert(rows, {
      onConflict: 'from_id,to_id,kind',
      ignoreDuplicates: true
    })
    if (error && error.code !== '42P01' && error.code !== 'PGRST205') {
      console.error('applyLlmKnowledgeEdges upsert failed', error)
    }
  }

  const { error: stampError } = await admin
    .from('knowledge_topics')
    .update({ last_llm_at: now })
    .in(
      'id',
      focusTopics.map((topic) => topic.id)
    )
  if (stampError && stampError.code !== '42P01' && stampError.code !== 'PGRST205') {
    console.error('applyLlmKnowledgeEdges stamp failed', stampError)
  }

  return {
    focusCount: focusTopics.length,
    edgeCount: rows.length,
    skipped: false
  }
}
