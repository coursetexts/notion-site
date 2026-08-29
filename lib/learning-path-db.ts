/**
 * Learning paths in Supabase: catalog rows, user-owned paths, and per-user
 * notes / resources / node status. Falls back to sessionStorage / localStorage
 * when signed out or when Supabase is unavailable.
 */
import {
  type LearningPathData,
  type LearningPathKind,
  type LearningPathNodeStatus,
  type LearningPathUserResource,
  type StoredLearningPath,
  SEEDED_LEARNING_PATHS,
  applyNodeStatus,
  isCatalogLearningPathSlug,
  nodeStatusMap,
  parseLearningPathKind,
  readStoredLearningPaths,
  saveStoredLearningPath,
  writeStoredLearningPaths
} from '@/lib/learning-path-seed'
import { storedNotebookNoteHasContent } from '@/lib/notebook-editor-default'
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
  isPrivate: boolean
  kind: LearningPathKind
  data: LearningPathData
  createdAt: string | null
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
  is_private?: boolean
  kind?: string
  created_at?: string | null
}

const PATH_COLUMNS =
  'id, slug, owner_id, title, goal, summary, data, is_catalog, is_private, kind, created_at'

const PATH_COLUMNS_WITHOUT_KIND =
  'id, slug, owner_id, title, goal, summary, data, is_catalog, is_private, created_at'

const PATH_COLUMNS_MINIMAL =
  'id, slug, owner_id, title, goal, summary, data, is_catalog, created_at'

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

function isPathUuid(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    id
  )
}

function normalizeNotes(
  notes: Record<string, unknown> | null | undefined
): Record<string, string> {
  if (!notes || typeof notes !== 'object') return {}
  const out: Record<string, string> = {}
  for (const [key, value] of Object.entries(notes)) {
    if (typeof value === 'string') out[key] = value
    else if (value && typeof value === 'object') {
      try {
        out[key] = JSON.stringify(value)
      } catch {
        /* skip */
      }
    }
  }
  return out
}

function normalizeResources(
  resources: Record<string, LearningPathUserResource[]> | null | undefined
): Record<string, LearningPathUserResource[]> {
  if (!resources || typeof resources !== 'object') return {}
  const out: Record<string, LearningPathUserResource[]> = {}
  for (const [key, value] of Object.entries(resources)) {
    if (Array.isArray(value)) out[key] = value
  }
  return out
}

function notesHaveContent(notes: Record<string, string>) {
  return Object.values(notes).some((value) =>
    storedNotebookNoteHasContent(value)
  )
}

function resourcesHaveContent(
  resources: Record<string, LearningPathUserResource[]>
) {
  return Object.values(resources).some(
    (items) => Array.isArray(items) && items.length > 0
  )
}

function preferFilledUserState(
  local: LearningPathUserState,
  remote: LearningPathUserState
): LearningPathUserState {
  return {
    notes: notesHaveContent(remote.notes) ? remote.notes : local.notes,
    resources: resourcesHaveContent(remote.resources)
      ? remote.resources
      : local.resources,
    nodeStatus: {
      ...local.nodeStatus,
      ...remote.nodeStatus
    }
  }
}

export function readLocalUserState(slug: string): LearningPathUserState {
  if (typeof window === 'undefined') return emptyUserState()
  try {
    const raw = window.localStorage.getItem(userStateKey(slug))
    if (!raw) return emptyUserState()
    const parsed = JSON.parse(raw) as Partial<LearningPathUserState>
    return {
      notes: normalizeNotes(
        parsed.notes as Record<string, unknown> | undefined
      ),
      resources: normalizeResources(
        parsed.resources as Record<string, LearningPathUserResource[]> | undefined
      ),
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
  const createdAt = row.created_at || row.data?.createdAt || null
  const data: LearningPathData = {
    ...row.data,
    id: row.id,
    slug: row.slug,
    title: row.title || row.data?.title,
    goal: row.goal || row.data?.goal,
    summary: row.summary || row.data?.summary,
    createdAt: createdAt || undefined
  }
  return {
    id: row.id,
    slug: row.slug,
    ownerId: row.owner_id,
    isCatalog: row.is_catalog,
    isPrivate: row.is_catalog ? false : row.is_private !== false,
    kind: parseLearningPathKind(row.kind),
    data,
    createdAt
  }
}

function storedKindForSlug(slug: string): LearningPathKind {
  const item = readStoredLearningPaths().find((row) => row.slug === slug)
  return parseLearningPathKind(item?.kind)
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
    const columnSets = [
      PATH_COLUMNS,
      PATH_COLUMNS_WITHOUT_KIND,
      PATH_COLUMNS_MINIMAL
    ]
    for (const columns of columnSets) {
      const { data, error } = await supabase
        .from('learning_paths')
        .select(columns)
        .eq('is_catalog', true)
        .order('created_at', { ascending: true })
      if (!error && Array.isArray(data) && data.length > 0) {
        return (data as unknown as LearningPathRow[]).map(
          (row) => rowToRecord(row).data
        )
      }
      if (!error) break
    }
  }
  return SEEDED_LEARNING_PATHS
}

function rowsToOwnedItems(rows: LearningPathRow[]): StoredLearningPath[] {
  return rows.map((row) => {
    const record = rowToRecord(row)
    return {
      id: row.id,
      goal: row.goal,
      slug: row.slug,
      data: record.data,
      isPrivate: record.isPrivate,
      kind: record.kind,
      createdAt: record.createdAt ?? undefined
    }
  })
}

export async function listOwnedLearningPathsByUserId(
  userId: string,
  includePrivate = false
): Promise<StoredLearningPath[]> {
  if (!userId) return []
  const supabase = getSupabaseClient()
  if (!supabase) return []
  const columnSets = [
    PATH_COLUMNS,
    PATH_COLUMNS_WITHOUT_KIND,
    PATH_COLUMNS_MINIMAL
  ]
  for (let i = 0; i < columnSets.length; i += 1) {
    let query = supabase
      .from('learning_paths')
      .select(columnSets[i])
      .eq('owner_id', userId)
      .eq('is_catalog', false)
      .order('updated_at', { ascending: false })
    if (!includePrivate) {
      if (i === 2) return []
      query = query.eq('is_private', false)
    }
    const { data, error } = await query
    if (!error && Array.isArray(data)) {
      return rowsToOwnedItems(data as unknown as LearningPathRow[])
    }
  }
  return []
}

export async function listOwnedLearningPaths(): Promise<StoredLearningPath[]> {
  const { userId } = await currentUserId()
  if (userId) {
    const owned = await listOwnedLearningPathsByUserId(userId, true)
    if (owned.length > 0) return owned
  }
  return readStoredLearningPaths()
    .filter((item) => !isCatalogLearningPathSlug(item.slug))
    .map((item) => ({
      ...item,
      isPrivate: item.isPrivate ?? true,
      kind: parseLearningPathKind(item.kind)
    }))
}

export async function getLearningPathKindsBySlugs(
  slugs: string[]
): Promise<Record<string, LearningPathKind>> {
  const unique = [...new Set(slugs.filter(Boolean))]
  const out: Record<string, LearningPathKind> = {}
  for (const slug of unique) {
    if (isCatalogLearningPathSlug(slug)) out[slug] = 'community'
  }
  const need = unique.filter((slug) => !(slug in out))
  if (need.length === 0) return out
  const supabase = getSupabaseClient()
  if (!supabase) return out
  const { data, error } = await supabase
    .from('learning_paths')
    .select('slug, kind')
    .in('slug', need)
  if (error || !Array.isArray(data)) return out
  for (const row of data as Array<{ slug: string; kind?: string }>) {
    out[row.slug] = parseLearningPathKind(row.kind)
  }
  return out
}

export async function attachLearningPathKinds(
  items: StoredLearningPath[]
): Promise<StoredLearningPath[]> {
  const missing = items
    .filter((item) => item.kind !== 'research' && item.kind !== 'community')
    .map((item) => item.slug)
  const kinds =
    missing.length > 0 ? await getLearningPathKindsBySlugs(missing) : {}
  return items.map((item) => ({
    ...item,
    kind: parseLearningPathKind(item.kind ?? kinds[item.slug])
  }))
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
  const columnSets = [
    PATH_COLUMNS,
    PATH_COLUMNS_WITHOUT_KIND,
    PATH_COLUMNS_MINIMAL
  ]
  for (const columns of columnSets) {
    const result = await supabase
      .from('learning_paths')
      .select(columns)
      .eq('slug', slug)
      .maybeSingle()
    if (!result.error) {
      return result.data
        ? rowToRecord(result.data as unknown as LearningPathRow)
        : null
    }
  }
  return null
}

export async function upsertOwnedLearningPath(
  path: LearningPathData,
  options?: { kind?: LearningPathKind }
): Promise<string | null> {
  saveStoredLearningPath(path, { kind: options?.kind })
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

  const insertKind = parseLearningPathKind(
    options?.kind ?? storedKindForSlug(path.slug)
  )
  const insertPayload = { ...payload, kind: insertKind }
  const first = await supabase
    .from('learning_paths')
    .insert(insertPayload)
    .select('id')
    .maybeSingle()
  if (!first.error) return first.data?.id ?? null

  const retry = await supabase
    .from('learning_paths')
    .insert(payload)
    .select('id')
    .maybeSingle()
  if (retry.error) {
    console.error('upsertOwnedLearningPath insert failed', retry.error)
    return null
  }
  return retry.data?.id ?? null
}

export async function setOwnedLearningPathPrivate(
  pathId: string,
  isPrivate: boolean,
  slug?: string
): Promise<boolean> {
  if (!pathId) return false
  const localOnly = pathId.startsWith('path-')
  const { supabase, userId } = await currentUserId()
  if (supabase && userId && !localOnly) {
    const { error } = await supabase
      .from('learning_paths')
      .update({
        is_private: isPrivate,
        updated_at: new Date().toISOString()
      })
      .eq('id', pathId)
      .eq('owner_id', userId)
      .eq('is_catalog', false)
    if (error) {
      console.error('setOwnedLearningPathPrivate failed', error)
      return false
    }
  }
  if (slug) {
    const stored = readStoredLearningPaths()
    writeStoredLearningPaths(
      stored.map((item) =>
        item.slug === slug || item.id === pathId
          ? { ...item, isPrivate }
          : item
      )
    )
  }
  return true
}

export async function loadLearningPathUserState(
  pathId: string | null | undefined,
  slug: string
): Promise<LearningPathUserState> {
  const local = readLocalUserState(slug)
  if (!pathId || !isPathUuid(pathId)) return local

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
  const remote: LearningPathUserState = {
    notes: normalizeNotes(row.notes as Record<string, unknown> | null),
    resources: normalizeResources(row.resources),
    nodeStatus:
      row.node_status && typeof row.node_status === 'object'
        ? row.node_status
        : {}
  }
  const state = preferFilledUserState(local, remote)
  writeLocalUserState(slug, state)
  return state
}

export async function saveLearningPathUserState(
  pathId: string | null | undefined,
  slug: string,
  state: LearningPathUserState
): Promise<string | null> {
  writeLocalUserState(slug, state)

  let id = pathId && isPathUuid(pathId) ? pathId : null
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
