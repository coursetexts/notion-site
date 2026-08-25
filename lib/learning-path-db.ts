/**
 * Learning paths in Supabase: catalog rows, user-owned paths, and per-user
 * notes / resources / node status. Falls back to sessionStorage / localStorage
 * when signed out or when Supabase is unavailable.
 */
import {
  type LearningPathData,
  type LearningPathNodeStatus,
  type LearningPathUserResource,
  type StoredLearningPath,
  SEEDED_LEARNING_PATHS,
  applyNodeStatus,
  isCatalogLearningPathSlug,
  nodeStatusMap,
  readStoredLearningPaths,
  saveStoredLearningPath
} from '@/lib/learning-path-seed'
import { getSupabaseClient } from '@/lib/supabase'

export type LearningPathUserState = {
  notes: Record<string, string>
  resources: Record<string, LearningPathUserResource[]>
  nodeStatus: Record<string, LearningPathNodeStatus>
}

export type LearningPathRecord = {
  id: string
  slug: string
  ownerId: string | null
  isCatalog: boolean
  data: LearningPathData
}

type LearningPathRow = {
  id: string
  slug: string
  owner_id: string | null
  title: string
  goal: string
  summary: string
  data: LearningPathData
  is_catalog: boolean
}

type UserStateRow = {
  notes: Record<string, string> | null
  resources: Record<string, LearningPathUserResource[]> | null
  node_status: Record<string, LearningPathNodeStatus> | null
}

const USER_STATE_KEY_PREFIX = 'coursetexts.learning-path-user-state:'

function emptyUserState(): LearningPathUserState {
  return { notes: {}, resources: {}, nodeStatus: {} }
}

function userStateKey(slug: string) {
  return `${USER_STATE_KEY_PREFIX}${slug}`
}

export function readLocalUserState(slug: string): LearningPathUserState {
  if (typeof window === 'undefined') return emptyUserState()
  try {
    const raw = window.localStorage.getItem(userStateKey(slug))
    if (!raw) return emptyUserState()
    const parsed = JSON.parse(raw) as Partial<LearningPathUserState>
    return {
      notes:
        parsed.notes && typeof parsed.notes === 'object' ? parsed.notes : {},
      resources:
        parsed.resources && typeof parsed.resources === 'object'
          ? parsed.resources
          : {},
      nodeStatus:
        parsed.nodeStatus && typeof parsed.nodeStatus === 'object'
          ? parsed.nodeStatus
          : {}
    }
  } catch {
    return emptyUserState()
  }
}

export function writeLocalUserState(slug: string, state: LearningPathUserState) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(userStateKey(slug), JSON.stringify(state))
  } catch {
    /* quota / private mode */
  }
}

function rowToRecord(row: LearningPathRow): LearningPathRecord {
  const data: LearningPathData = {
    ...row.data,
    id: row.id,
    slug: row.slug,
    title: row.title || row.data?.title,
    goal: row.goal || row.data?.goal,
    summary: row.summary || row.data?.summary
  }
  return {
    id: row.id,
    slug: row.slug,
    ownerId: row.owner_id,
    isCatalog: row.is_catalog,
    data
  }
}

function pathPayload(path: LearningPathData) {
  const { id: _id, ...data } = path
  void _id
  return {
    slug: path.slug,
    title: path.title,
    goal: path.goal,
    summary: path.summary,
    data
  }
}

async function currentUserId() {
  const supabase = getSupabaseClient()
  if (!supabase) return { supabase: null, userId: null as string | null }
  const {
    data: { user }
  } = await supabase.auth.getUser()
  return { supabase, userId: user?.id ?? null }
}

export async function listCatalogLearningPaths(): Promise<LearningPathData[]> {
  const supabase = getSupabaseClient()
  if (supabase) {
    const { data, error } = await supabase
      .from('learning_paths')
      .select('id, slug, owner_id, title, goal, summary, data, is_catalog')
      .eq('is_catalog', true)
      .order('created_at', { ascending: true })
    if (!error && Array.isArray(data) && data.length > 0) {
      return (data as LearningPathRow[]).map((row) => rowToRecord(row).data)
    }
  }
  return SEEDED_LEARNING_PATHS
}

export async function listOwnedLearningPaths(): Promise<StoredLearningPath[]> {
  const { supabase, userId } = await currentUserId()
  if (supabase && userId) {
    const { data, error } = await supabase
      .from('learning_paths')
      .select('id, slug, owner_id, title, goal, summary, data, is_catalog')
      .eq('owner_id', userId)
      .eq('is_catalog', false)
      .order('updated_at', { ascending: false })
    if (!error && Array.isArray(data)) {
      return (data as LearningPathRow[]).map((row) => ({
        id: row.id,
        goal: row.goal,
        slug: row.slug,
        data: rowToRecord(row).data
      }))
    }
  }
  return readStoredLearningPaths().filter(
    (item) => !isCatalogLearningPathSlug(item.slug)
  )
}

export async function listAllLearningPathSlugs(): Promise<string[]> {
  const [catalog, owned] = await Promise.all([
    listCatalogLearningPaths(),
    listOwnedLearningPaths()
  ])
  return [
    ...catalog.map((path) => path.slug),
    ...owned.map((item) => item.slug)
  ]
}

export async function getLearningPathRecord(
  slug: string
): Promise<LearningPathRecord | null> {
  const supabase = getSupabaseClient()
  if (!supabase || !slug) return null
  const { data, error } = await supabase
    .from('learning_paths')
    .select('id, slug, owner_id, title, goal, summary, data, is_catalog')
    .eq('slug', slug)
    .maybeSingle()
  if (error || !data) return null
  return rowToRecord(data as LearningPathRow)
}

export async function upsertOwnedLearningPath(
  path: LearningPathData
): Promise<string | null> {
  saveStoredLearningPath(path)
  if (isCatalogLearningPathSlug(path.slug)) {
    const existing = await getLearningPathRecord(path.slug)
    return existing?.id ?? null
  }

  const { supabase, userId } = await currentUserId()
  if (!supabase || !userId) return path.id ?? null

  const payload = {
    ...pathPayload(path),
    owner_id: userId,
    is_catalog: false,
    updated_at: new Date().toISOString()
  }

  const existing =
    path.id && !path.id.startsWith('path-')
      ? path.id
      : (await getLearningPathRecord(path.slug))?.id

  if (existing) {
    const { data, error } = await supabase
      .from('learning_paths')
      .update(payload)
      .eq('id', existing)
      .eq('owner_id', userId)
      .select('id')
      .maybeSingle()
    if (error) {
      console.error('upsertOwnedLearningPath update failed', error)
      return existing
    }
    return data?.id ?? existing
  }

  const { data, error } = await supabase
    .from('learning_paths')
    .insert(payload)
    .select('id')
    .maybeSingle()
  if (error) {
    console.error('upsertOwnedLearningPath insert failed', error)
    return null
  }
  return data?.id ?? null
}

export async function loadLearningPathUserState(
  pathId: string | null | undefined,
  slug: string
): Promise<LearningPathUserState> {
  const local = readLocalUserState(slug)
  if (!pathId) return local

  const { supabase, userId } = await currentUserId()
  if (!supabase || !userId) return local

  const { data, error } = await supabase
    .from('learning_path_user_state')
    .select('notes, resources, node_status')
    .eq('user_id', userId)
    .eq('path_id', pathId)
    .maybeSingle()

  if (error || !data) return local
  const row = data as UserStateRow
  const state: LearningPathUserState = {
    notes: row.notes && typeof row.notes === 'object' ? row.notes : {},
    resources:
      row.resources && typeof row.resources === 'object' ? row.resources : {},
    nodeStatus:
      row.node_status && typeof row.node_status === 'object'
        ? row.node_status
        : {}
  }
  writeLocalUserState(slug, state)
  return state
}

export async function saveLearningPathUserState(
  pathId: string | null | undefined,
  slug: string,
  state: LearningPathUserState
): Promise<string | null> {
  writeLocalUserState(slug, state)

  let id = pathId
  if (!id) {
    const record = await getLearningPathRecord(slug)
    id = record?.id ?? null
  }
  if (!id) return null

  const { supabase, userId } = await currentUserId()
  if (!supabase || !userId) return id

  const { error } = await supabase.from('learning_path_user_state').upsert(
    {
      user_id: userId,
      path_id: id,
      notes: state.notes,
      resources: state.resources,
      node_status: state.nodeStatus,
      updated_at: new Date().toISOString()
    },
    { onConflict: 'user_id,path_id' }
  )

  if (error) {
    console.error('saveLearningPathUserState failed', error)
  }
  return id
}

export function overlayUserState(
  path: LearningPathData,
  state: LearningPathUserState
): LearningPathData {
  return applyNodeStatus(path, state.nodeStatus)
}

export function userStateFromPath(
  path: LearningPathData,
  notes: Record<string, string>,
  resources: Record<string, LearningPathUserResource[]>
): LearningPathUserState {
  return {
    notes,
    resources,
    nodeStatus: nodeStatusMap(path)
  }
}
