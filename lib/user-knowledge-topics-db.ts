/**
 * Topics the signed-in user has gained by finishing learning paths.
 * Falls back to localStorage if Supabase is missing or 035 is not applied.
 */

import { getSupabaseClient } from '@/lib/supabase'
import { getCachedAuth } from '@/lib/auth-cache'
import { ingestKnowledgeGraph } from '@/lib/knowledge-graph-db'
import type { KnowledgeGraphEdgeDraft } from '@/lib/knowledge-graph'
import { normalizeKnowledgeTopicLabel } from '@/lib/learning-path-knowledge'

const STORAGE_PREFIX = 'coursetexts.user-knowledge-topics:'

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function isUuid(id: string | null | undefined): id is string {
  return Boolean(id && UUID_RE.test(id))
}

export type UserKnowledgeTopic = {
  id: string
  userId: string
  label: string
  normalizedLabel: string
  sourcePathSlug: string | null
  sourcePathTitle: string | null
  createdAt: string
}

function storageKey(userId: string) {
  return `${STORAGE_PREFIX}${userId}`
}

function readLocalTopics(userId: string): UserKnowledgeTopic[] {
  if (typeof window === 'undefined' || !userId) return []
  try {
    const raw = window.localStorage.getItem(storageKey(userId))
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.flatMap((row) => {
      if (!row || typeof row !== 'object') return []
      const item = row as Record<string, unknown>
      if (typeof item.id !== 'string' || typeof item.label !== 'string') {
        return []
      }
      const label = item.label.trim()
      if (!label) return []
      return [
        {
          id: item.id,
          userId:
            typeof item.userId === 'string' && item.userId
              ? item.userId
              : userId,
          label,
          normalizedLabel:
            typeof item.normalizedLabel === 'string' && item.normalizedLabel
              ? item.normalizedLabel
              : normalizeKnowledgeTopicLabel(label),
          sourcePathSlug:
            typeof item.sourcePathSlug === 'string'
              ? item.sourcePathSlug
              : null,
          sourcePathTitle:
            typeof item.sourcePathTitle === 'string'
              ? item.sourcePathTitle
              : null,
          createdAt:
            typeof item.createdAt === 'string'
              ? item.createdAt
              : new Date().toISOString()
        }
      ]
    })
  } catch {
    return []
  }
}

function writeLocalTopics(userId: string, rows: UserKnowledgeTopic[]) {
  if (typeof window === 'undefined' || !userId) return
  window.localStorage.setItem(storageKey(userId), JSON.stringify(rows))
}

function mergeTopics(rows: UserKnowledgeTopic[]): UserKnowledgeTopic[] {
  const byKey = new Map<string, UserKnowledgeTopic>()
  for (const row of rows) {
    const existing = byKey.get(row.normalizedLabel)
    if (!existing) {
      byKey.set(row.normalizedLabel, row)
      continue
    }
    if (new Date(row.createdAt).getTime() < new Date(existing.createdAt).getTime()) {
      byKey.set(row.normalizedLabel, row)
    }
  }
  return [...byKey.values()].sort((a, b) =>
    a.label.localeCompare(b.label, undefined, { sensitivity: 'base' })
  )
}

function rowFromDb(row: {
  id: string
  user_id: string
  label: string
  normalized_label: string
  source_path_slug: string | null
  source_path_title: string | null
  created_at: string
}): UserKnowledgeTopic {
  return {
    id: row.id,
    userId: row.user_id,
    label: row.label,
    normalizedLabel: row.normalized_label,
    sourcePathSlug: row.source_path_slug,
    sourcePathTitle: row.source_path_title,
    createdAt: row.created_at
  }
}

async function currentUserId(): Promise<string | null> {
  const supabase = getSupabaseClient()
  if (supabase) {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (user?.id) return user.id
  }
  return getCachedAuth().user?.id ?? null
}

export async function listKnowledgeTopicsByUserId(
  userId: string
): Promise<UserKnowledgeTopic[]> {
  if (!userId) return []
  const local = readLocalTopics(userId)
  const supabase = getSupabaseClient()
  if (!supabase) return mergeTopics(local)
  const { data, error } = await supabase
    .from('user_knowledge_topics')
    .select(
      'id, user_id, label, normalized_label, source_path_slug, source_path_title, created_at'
    )
    .eq('user_id', userId)
    .order('label', { ascending: true })
  if (error || !Array.isArray(data)) return mergeTopics(local)
  const remote = data.map((row) =>
    rowFromDb(
      row as {
        id: string
        user_id: string
        label: string
        normalized_label: string
        source_path_slug: string | null
        source_path_title: string | null
        created_at: string
      }
    )
  )
  const merged = mergeTopics([...local, ...remote])
  writeLocalTopics(userId, merged)
  return merged
}

export async function listMyKnowledgeTopics(): Promise<UserKnowledgeTopic[]> {
  const userId = await currentUserId()
  if (!userId) return []
  return listKnowledgeTopicsByUserId(userId)
}

export async function addMyKnowledgeTopics(
  labels: string[],
  source?: {
    pathId?: string | null
    pathSlug?: string | null
    pathTitle?: string | null
    graphEdges?: KnowledgeGraphEdgeDraft[]
  }
): Promise<UserKnowledgeTopic[]> {
  const userId = await currentUserId()
  if (!userId) return []
  const createdAt = new Date().toISOString()
  const incoming: UserKnowledgeTopic[] = []
  const seen = new Set<string>()
  for (const raw of labels) {
    const label = raw.trim().slice(0, 120)
    const normalizedLabel = normalizeKnowledgeTopicLabel(label)
    if (!label || !normalizedLabel || seen.has(normalizedLabel)) continue
    seen.add(normalizedLabel)
    incoming.push({
      id: `kt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      userId,
      label,
      normalizedLabel,
      sourcePathSlug: source?.pathSlug?.trim() || null,
      sourcePathTitle: source?.pathTitle?.trim() || null,
      createdAt
    })
  }
  if (incoming.length === 0) return listKnowledgeTopicsByUserId(userId)

  const merged = mergeTopics([...readLocalTopics(userId), ...incoming])
  writeLocalTopics(userId, merged)

  const supabase = getSupabaseClient()
  if (!supabase) return merged

  const pathId = isUuid(source?.pathId) ? source.pathId : null
  const rows = incoming.map((topic) => ({
    user_id: userId,
    label: topic.label,
    normalized_label: topic.normalizedLabel,
    source_path_id: pathId,
    source_path_slug: topic.sourcePathSlug,
    source_path_title: topic.sourcePathTitle
  }))
  const { error } = await supabase.from('user_knowledge_topics').upsert(rows, {
    onConflict: 'user_id,normalized_label',
    ignoreDuplicates: true
  })
  if (error && error.code !== '42P01' && error.code !== 'PGRST205') {
    console.error('addMyKnowledgeTopics failed', error)
  }
  void ingestKnowledgeGraph({
    labels: incoming.map((topic) => topic.label),
    edges: source?.graphEdges
  })
  return listKnowledgeTopicsByUserId(userId)
}

export async function addKnowledgeTopicsFromCompletedPath(input: {
  labels: string[]
  pathId?: string | null
  pathSlug?: string | null
  pathTitle?: string | null
  graphEdges?: KnowledgeGraphEdgeDraft[]
}): Promise<UserKnowledgeTopic[]> {
  return addMyKnowledgeTopics(input.labels, {
    pathId: input.pathId,
    pathSlug: input.pathSlug,
    pathTitle: input.pathTitle,
    graphEdges: input.graphEdges
  })
}
