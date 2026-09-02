/**
 * Learning paths in Supabase: catalog rows, user-owned paths, and per-user
 * notes / resources / node status. Falls back to localStorage when Supabase
 * is unavailable. Notes are always private to the signed-in owner: local
 * caches are keyed by user id, and signed-out sessions never read or write
 * notes.
 */
import {
  type LearningPathData,
  type LearningPathKind,
  type LearningPathNodeStatus,
  type LearningPathUserResource,
  type LearningPathVisibility,
  type StoredLearningPath,
  SEEDED_LEARNING_PATHS,
  applyNodeStatus,
  isCatalogLearningPathSlug,
  nodeStatusMap,
  parseLearningPathKind,
  parseLearningPathVisibility,
  readStoredLearningPaths,
  saveStoredLearningPath,
  writeStoredLearningPaths
} from '@/lib/learning-path-seed'
import { getCachedAuth } from '@/lib/auth-cache'
import { storedNotebookNoteHasContent } from '@/lib/notebook-editor-default'
import { recordNewlyExploredLearningPathNodes } from '@/lib/learning-path-progress-events-db'
import { slugifyLearningPathName } from '@/lib/learning-path-slug'
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
  visibility: LearningPathVisibility
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
  visibility?: string
  kind?: string
  created_at?: string | null
}

const PATH_COLUMNS =
  'id, slug, owner_id, title, goal, summary, data, is_catalog, is_private, kind, visibility, created_at'

const PATH_COLUMNS_WITHOUT_VISIBILITY =
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

function userStateKey(slug: string, userId: string | null) {
  if (userId) return `${USER_STATE_KEY_PREFIX}${userId}:${slug}`
  return `${USER_STATE_KEY_PREFIX}${slug}`
}

function resolveLocalUserId(userId?: string | null) {
  if (userId !== undefined) return userId
  return getCachedAuth().user?.id ?? null
}

function parseStoredUserState(raw: string | null): LearningPathUserState {
  if (!raw) return emptyUserState()
  try {
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

function withoutNotes(state: LearningPathUserState): LearningPathUserState {
  return { ...state, notes: {} }
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

export function readLocalUserState(
  slug: string,
  userId?: string | null
): LearningPathUserState {
  if (typeof window === 'undefined') return emptyUserState()
  const id = resolveLocalUserId(userId)
  const stored = parseStoredUserState(
    window.localStorage.getItem(userStateKey(slug, id))
  )
  if (!id) return withoutNotes(stored)
  return stored
}

export function writeLocalUserState(
  slug: string,
  state: LearningPathUserState,
  userId?: string | null
) {
  if (typeof window === 'undefined') return
  const id = resolveLocalUserId(userId)
  const toStore = id ? state : withoutNotes(state)
  try {
    window.localStorage.setItem(userStateKey(slug, id), JSON.stringify(toStore))
  } catch {
    /* quota / private mode */
  }
}

function rowToRecord(row: LearningPathRow): LearningPathRecord {
  const createdAt = row.created_at || row.data?.createdAt || null
  const visibility = parseLearningPathVisibility(
    row.visibility,
    row.is_private,
    row.is_catalog
  )
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
    isPrivate: visibility === 'private',
    visibility,
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

function withSeededCatalog(paths: LearningPathData[]): LearningPathData[] {
  const seen = new Set(paths.map((path) => path.slug))
  const extra = SEEDED_LEARNING_PATHS.filter((path) => !seen.has(path.slug))
  return extra.length === 0 ? paths : [...paths, ...extra]
}

export async function listCatalogLearningPaths(): Promise<LearningPathData[]> {
  const supabase = getSupabaseClient()
  if (supabase) {
    const columnSets = [
      PATH_COLUMNS,
      PATH_COLUMNS_WITHOUT_VISIBILITY,
      PATH_COLUMNS_WITHOUT_KIND,
      PATH_COLUMNS_MINIMAL
    ]
    for (let i = 0; i < columnSets.length; i += 1) {
      let query = supabase
        .from('learning_paths')
        .select(columnSets[i])
        .eq('is_catalog', true)
        .order('created_at', { ascending: true })
      if (i === 0 || i === 1) {
        query = query.eq('kind', 'community')
      }
      const { data, error } = await query
      if (!error && Array.isArray(data) && data.length > 0) {
        const fromDb = (data as unknown as LearningPathRow[]).map(
          (row) => rowToRecord(row).data
        )
        return withSeededCatalog(fromDb)
      }
      if (!error) break
    }
  }
  return SEEDED_LEARNING_PATHS
}

export type NonCourseLearningPathCard = {
  id: string
  slug: string
  title: string
  description: string
  kind: LearningPathKind
}

const NON_COURSE_LIST_COLUMNS =
  'id, slug, title, goal, summary, kind, visibility, created_at'
const NON_COURSE_LIST_COLUMNS_WITHOUT_VISIBILITY =
  'id, slug, title, goal, summary, kind, is_private, created_at'

function seededNonCourseLearningPathCards(): NonCourseLearningPathCard[] {
  return SEEDED_LEARNING_PATHS.map((path) => ({
    id: path.id || path.slug,
    slug: path.slug,
    title: path.title,
    description: path.summary || path.goal,
    kind: 'community' as const
  }))
}

function withSeededNonCourseCards(
  cards: NonCourseLearningPathCard[]
): NonCourseLearningPathCard[] {
  const seen = new Set(cards.map((card) => card.slug))
  const extra = seededNonCourseLearningPathCards().filter(
    (card) => !seen.has(card.slug)
  )
  const merged = extra.length === 0 ? cards : [...cards, ...extra]
  return merged.sort((a, b) =>
    a.title.localeCompare(b.title, undefined, { sensitivity: 'base' })
  )
}

function rowToNonCourseCard(row: {
  id?: string
  slug?: string
  title?: string
  goal?: string
  summary?: string
  kind?: string
  visibility?: string
  is_private?: boolean
}): NonCourseLearningPathCard | null {
  if (!row.slug) return null
  const kind = parseLearningPathKind(row.kind)
  if (kind === 'course') return null
  if (row.visibility === 'private') return null
  if (row.visibility == null && row.is_private === true) return null
  return {
    id: row.id || row.slug,
    slug: row.slug,
    title: row.title || row.slug,
    description: (row.summary || row.goal || '').trim(),
    kind
  }
}

/** Public community + research paths. Excludes kind=course (including empty stubs). */
export async function listNonCourseLearningPaths(): Promise<
  NonCourseLearningPathCard[]
> {
  const seeded = seededNonCourseLearningPathCards()
  const supabase = getSupabaseClient()
  if (supabase) {
    const columnSets = [
      NON_COURSE_LIST_COLUMNS,
      NON_COURSE_LIST_COLUMNS_WITHOUT_VISIBILITY
    ]
    for (const columns of columnSets) {
      const { data, error } = await supabase
        .from('learning_paths')
        .select(columns)
        .in('kind', ['community', 'research'])
        .order('title', { ascending: true })
        .limit(1000)
      if (!error && Array.isArray(data)) {
        const cards = (
          data as Array<{
            id?: string
            slug?: string
            title?: string
            goal?: string
            summary?: string
            kind?: string
            visibility?: string
            is_private?: boolean
          }>
        )
          .map(rowToNonCourseCard)
          .filter((card): card is NonCourseLearningPathCard => card != null)
        return withSeededNonCourseCards(cards)
      }
    }
  }
  return withSeededNonCourseCards(seeded)
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
      visibility: record.visibility,
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
    PATH_COLUMNS_WITHOUT_VISIBILITY,
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
      if (i === 3) return []
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
      visibility: item.visibility,
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
    .filter(
      (item) =>
        item.kind !== 'research' &&
        item.kind !== 'community' &&
        item.kind !== 'course'
    )
    .map((item) => item.slug)
  const kinds =
    missing.length > 0 ? await getLearningPathKindsBySlugs(missing) : {}
  return items.map((item) => ({
    ...item,
    kind: parseLearningPathKind(item.kind ?? kinds[item.slug])
  }))
}

export async function listAllLearningPathSlugs(): Promise<string[]> {
  const slugs = new Set<string>()
  const supabase = getSupabaseClient()
  if (supabase) {
    const { data, error } = await supabase.from('learning_paths').select('slug')
    if (!error && Array.isArray(data)) {
      for (const row of data as Array<{ slug?: string }>) {
        if (row.slug) slugs.add(row.slug)
      }
    }
  }
  for (const path of SEEDED_LEARNING_PATHS) slugs.add(path.slug)
  const owned = await listOwnedLearningPaths()
  for (const item of owned) slugs.add(item.slug)
  return [...slugs]
}

export async function getLearningPathRecord(
  slug: string
): Promise<LearningPathRecord | null> {
  const supabase = getSupabaseClient()
  if (!supabase || !slug) return null
  const columnSets = [
    PATH_COLUMNS,
    PATH_COLUMNS_WITHOUT_VISIBILITY,
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
  const insertPayload = {
    ...payload,
    kind: insertKind,
    visibility: 'private' as const,
    is_private: true
  }
  const first = await supabase
    .from('learning_paths')
    .insert(insertPayload)
    .select('id')
    .maybeSingle()
  if (!first.error) return first.data?.id ?? null

  const retryKind = await supabase
    .from('learning_paths')
    .insert({ ...payload, kind: insertKind, is_private: true })
    .select('id')
    .maybeSingle()
  if (!retryKind.error) return retryKind.data?.id ?? null

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

export async function setOwnedLearningPathVisibility(
  pathId: string,
  visibility: LearningPathVisibility,
  slug?: string
): Promise<boolean> {
  if (!pathId) return false
  const isPrivate = visibility === 'private'
  const localOnly = pathId.startsWith('path-')
  const { supabase, userId } = await currentUserId()
  if (supabase && userId && !localOnly) {
    const withVisibility = await supabase
      .from('learning_paths')
      .update({
        visibility,
        updated_at: new Date().toISOString()
      })
      .eq('id', pathId)
      .eq('owner_id', userId)
      .eq('is_catalog', false)
    if (withVisibility.error) {
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
        console.error('setOwnedLearningPathVisibility failed', error)
        return false
      }
    }
  }
  if (slug) {
    const stored = readStoredLearningPaths()
    writeStoredLearningPaths(
      stored.map((item) =>
        item.slug === slug || item.id === pathId
          ? { ...item, isPrivate, visibility }
          : item
      )
    )
  }
  return true
}

export async function setOwnedLearningPathPrivate(
  pathId: string,
  isPrivate: boolean,
  slug?: string
): Promise<boolean> {
  return setOwnedLearningPathVisibility(
    pathId,
    isPrivate ? 'private' : 'public',
    slug
  )
}

export async function loadLearningPathUserState(
  pathId: string | null | undefined,
  slug: string
): Promise<LearningPathUserState> {
  const { supabase, userId } = await currentUserId()
  const local = readLocalUserState(slug, userId)
  if (!userId) return withoutNotes(local)
  if (!pathId || !isPathUuid(pathId) || !supabase) return local

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
  writeLocalUserState(slug, state, userId)
  return state
}

export async function saveLearningPathUserState(
  pathId: string | null | undefined,
  slug: string,
  state: LearningPathUserState,
  expectedUserId?: string | null
): Promise<string | null> {
  const { supabase, userId } = await currentUserId()
  if (expectedUserId !== undefined && expectedUserId !== userId) {
    return pathId && isPathUuid(pathId) ? pathId : null
  }

  writeLocalUserState(slug, userId ? state : withoutNotes(state), userId)

  let id = pathId && isPathUuid(pathId) ? pathId : null
  if (!id) {
    const record = await getLearningPathRecord(slug)
    id = record?.id ?? null
  }
  if (!id) return null
  if (!supabase || !userId) return id

  const { data: previousRow } = await supabase
    .from('learning_path_user_state')
    .select('node_status')
    .eq('user_id', userId)
    .eq('path_id', id)
    .maybeSingle()

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
    return id
  }

  const previousStatus =
    previousRow &&
    previousRow.node_status &&
    typeof previousRow.node_status === 'object'
      ? (previousRow.node_status as Record<string, string>)
      : null
  void recordNewlyExploredLearningPathNodes({
    userId,
    pathId: id,
    previousStatus,
    nextStatus: state.nodeStatus
  })
  return id
}

/**
 * Public research path for a Field Atlas question. Matched by the prefilled
 * goal string or the slug derived from it, so a published path from that
 * question surfaces on the atlas even if punctuation differs.
 */
export async function findPublicResearchLearningPathSlugByGoal(
  goal: string
): Promise<string | null> {
  const trimmed = goal.trim()
  if (!trimmed) return null
  const slug = slugifyLearningPathName(trimmed)

  const supabase = getSupabaseClient()
  if (supabase) {
    const bySlugVis = await supabase
      .from('learning_paths')
      .select('slug')
      .eq('visibility', 'public')
      .eq('kind', 'research')
      .eq('slug', slug)
      .maybeSingle()
    if (
      !bySlugVis.error &&
      bySlugVis.data &&
      typeof bySlugVis.data.slug === 'string'
    ) {
      return bySlugVis.data.slug
    }

    const bySlug = await supabase
      .from('learning_paths')
      .select('slug')
      .eq('is_private', false)
      .eq('kind', 'research')
      .eq('slug', slug)
      .maybeSingle()
    if (!bySlug.error && bySlug.data && typeof bySlug.data.slug === 'string') {
      return bySlug.data.slug
    }

    const withKindVis = await supabase
      .from('learning_paths')
      .select('slug')
      .eq('visibility', 'public')
      .eq('kind', 'research')
      .eq('goal', trimmed)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (
      !withKindVis.error &&
      withKindVis.data &&
      typeof withKindVis.data.slug === 'string'
    ) {
      return withKindVis.data.slug
    }

    const withKind = await supabase
      .from('learning_paths')
      .select('slug')
      .eq('is_private', false)
      .eq('kind', 'research')
      .eq('goal', trimmed)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (
      !withKind.error &&
      withKind.data &&
      typeof withKind.data.slug === 'string'
    ) {
      return withKind.data.slug
    }

    const withoutKind = await supabase
      .from('learning_paths')
      .select('slug, kind')
      .eq('is_private', false)
      .eq('slug', slug)
      .maybeSingle()
    if (!withoutKind.error && withoutKind.data) {
      const row = withoutKind.data as { slug?: string; kind?: string }
      if (
        row.slug &&
        (parseLearningPathKind(row.kind) === 'research' || !row.kind)
      ) {
        return row.slug
      }
    }
  }

  const local = readStoredLearningPaths().find(
    (item) =>
      parseLearningPathKind(item.kind) === 'research' &&
      item.isPrivate === false &&
      (item.visibility ? item.visibility === 'public' : true) &&
      (item.slug === slug || item.goal.trim() === trimmed)
  )
  return local?.slug ?? null
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
