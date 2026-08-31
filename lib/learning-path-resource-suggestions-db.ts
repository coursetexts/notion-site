/**
 * Suggested resources on collaborative learning paths.
 * Visitors propose items to the owner; they stay pending until accepted.
 * Falls back to localStorage if Supabase is missing or 032 is not applied.
 */

import { getSupabaseClient } from '@/lib/supabase'
import type { LearningPathResourceKind } from '@/lib/learning-path-seed'

const STORAGE_KEY = 'coursetexts.learning-path-resource-suggestions'

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const RESOURCE_KINDS: LearningPathResourceKind[] = [
  'article',
  'video',
  'book',
  'course',
  'paper',
  'exercise'
]

export type LearningPathResourceSuggestion = {
  id: string
  pathId: string
  nodeId: string
  userId: string
  kind: LearningPathResourceKind
  title: string
  href?: string
  passage: string
  why: string
  sequence?: number
}

type SuggestionInput = {
  pathId: string
  nodeId: string
  kind: LearningPathResourceKind
  title: string
  href?: string
  passage: string
  why: string
  sequence?: number
}

function isUuid(id: string | null | undefined): id is string {
  return Boolean(id && UUID_RE.test(id))
}

function parseKind(value: unknown): LearningPathResourceKind {
  if (
    typeof value === 'string' &&
    RESOURCE_KINDS.includes(value as LearningPathResourceKind)
  ) {
    return value as LearningPathResourceKind
  }
  return 'article'
}

function readLocalSuggestions(): LearningPathResourceSuggestion[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.flatMap((row) => {
      if (!row || typeof row !== 'object') return []
      const item = row as Record<string, unknown>
      if (
        typeof item.id !== 'string' ||
        typeof item.pathId !== 'string' ||
        typeof item.nodeId !== 'string' ||
        typeof item.title !== 'string'
      ) {
        return []
      }
      return [
        {
          id: item.id,
          pathId: item.pathId,
          nodeId: item.nodeId,
          userId: typeof item.userId === 'string' ? item.userId : '',
          kind: parseKind(item.kind),
          title: item.title,
          href: typeof item.href === 'string' ? item.href : undefined,
          passage: typeof item.passage === 'string' ? item.passage : '',
          why: typeof item.why === 'string' ? item.why : '',
          sequence:
            typeof item.sequence === 'number' ? item.sequence : undefined
        }
      ]
    })
  } catch {
    return []
  }
}

function writeLocalSuggestions(rows: LearningPathResourceSuggestion[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rows))
}

function rowFromDb(row: {
  id: string
  path_id: string
  node_id: string
  user_id: string
  kind: string
  title: string
  href: string | null
  passage: string | null
  why: string | null
  sequence: number | null
}): LearningPathResourceSuggestion {
  return {
    id: row.id,
    pathId: row.path_id,
    nodeId: row.node_id,
    userId: row.user_id,
    kind: parseKind(row.kind),
    title: row.title,
    href: row.href || undefined,
    passage: row.passage ?? '',
    why: row.why ?? '',
    sequence: row.sequence ?? undefined
  }
}

async function currentUser() {
  const supabase = getSupabaseClient()
  if (!supabase) return { supabase: null, userId: null as string | null }
  const {
    data: { user }
  } = await supabase.auth.getUser()
  return { supabase, userId: user?.id ?? null }
}

export async function listLearningPathResourceSuggestions(
  pathId: string
): Promise<LearningPathResourceSuggestion[]> {
  const local = readLocalSuggestions().filter((row) => row.pathId === pathId)
  if (!isUuid(pathId)) return local
  const { supabase } = await currentUser()
  if (!supabase) return local
  const { data, error } = await supabase
    .from('learning_path_resource_suggestions')
    .select(
      'id, path_id, node_id, user_id, kind, title, href, passage, why, sequence'
    )
    .eq('path_id', pathId)
    .order('created_at', { ascending: true })
  if (error || !Array.isArray(data)) return local
  const rows = data.map((row) =>
    rowFromDb(
      row as {
        id: string
        path_id: string
        node_id: string
        user_id: string
        kind: string
        title: string
        href: string | null
        passage: string | null
        why: string | null
        sequence: number | null
      }
    )
  )
  const others = readLocalSuggestions().filter((row) => row.pathId !== pathId)
  writeLocalSuggestions([...others, ...rows])
  return rows
}

export async function addLearningPathResourceSuggestion(
  input: SuggestionInput
): Promise<LearningPathResourceSuggestion | null> {
  const title = input.title.trim()
  const nodeId = input.nodeId.trim()
  if (!title || !nodeId) return null
  const { supabase, userId } = await currentUser()
  const localRow: LearningPathResourceSuggestion = {
    id: `sug_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    pathId: input.pathId,
    nodeId,
    userId: userId ?? '',
    kind: input.kind,
    title,
    href: input.href?.trim() || undefined,
    passage: input.passage.trim(),
    why: input.why.trim(),
    sequence: input.sequence
  }

  if (!supabase || !userId || !isUuid(input.pathId)) {
    writeLocalSuggestions([...readLocalSuggestions(), localRow])
    return localRow
  }

  const { data, error } = await supabase
    .from('learning_path_resource_suggestions')
    .insert({
      path_id: input.pathId,
      node_id: nodeId,
      user_id: userId,
      kind: input.kind,
      title,
      href: localRow.href ?? null,
      passage: localRow.passage,
      why: localRow.why,
      sequence: input.sequence ?? null
    })
    .select(
      'id, path_id, node_id, user_id, kind, title, href, passage, why, sequence'
    )
    .maybeSingle()

  if (error || !data) {
    if (error) console.error('addLearningPathResourceSuggestion failed', error)
    writeLocalSuggestions([...readLocalSuggestions(), localRow])
    return localRow
  }

  const row = rowFromDb(
    data as {
      id: string
      path_id: string
      node_id: string
      user_id: string
      kind: string
      title: string
      href: string | null
      passage: string | null
      why: string | null
      sequence: number | null
    }
  )
  writeLocalSuggestions([
    ...readLocalSuggestions().filter((item) => item.id !== row.id),
    row
  ])
  return row
}

export async function deleteLearningPathResourceSuggestion(
  suggestionId: string,
  pathId: string
): Promise<boolean> {
  writeLocalSuggestions(
    readLocalSuggestions().filter((row) => row.id !== suggestionId)
  )
  if (!isUuid(suggestionId) || !isUuid(pathId)) return true
  const { supabase, userId } = await currentUser()
  if (!supabase || !userId) return true
  const { error } = await supabase
    .from('learning_path_resource_suggestions')
    .delete()
    .eq('id', suggestionId)
    .eq('path_id', pathId)
  if (error) {
    console.error('deleteLearningPathResourceSuggestion failed', error)
    return false
  }
  return true
}
