/**
 * Profile Updates — tweet-like posts on /profile and /profile/[userId].
 * Likes use votes.target_type = 'profile_update' (upvote-only in UI).
 * Comments/replies use polymorphic comments with the same target_type.
 * Repost / quote: new rows with repost_of_id / quote_of_id embedding an original.
 */
import {
  type ThreadedComment,
  addPolymorphicComment,
  getPolymorphicCommentThread,
  setPolymorphicCommentVote
} from '@/lib/community-comments-db'
import { getSupabaseClient } from '@/lib/supabase'

export type ProfileUpdateType = 'Video' | 'Code' | 'Presentation' | 'Document'

export type ProfileUpdateOriginal = {
  id: string
  userId: string
  displayName: string
  avatarUrl: string | null
  body: string
  url: string
  createdAt: string
}

export type ProfileUpdate = {
  id: string
  userId: string
  title: string
  description: string
  type: ProfileUpdateType
  url: string
  tags: string[]
  createdAt: string
  likeCount: number
  likedByMe: boolean
  commentCount: number
  repostOfId: string | null
  quoteOfId: string | null
  original?: ProfileUpdateOriginal | null
}

export type ProfileUpdateDraft = {
  title: string
  description: string
  type: ProfileUpdateType
  url: string
  tags: string[]
}

const UPDATE_TYPES = new Set<ProfileUpdateType>([
  'Video',
  'Code',
  'Presentation',
  'Document'
])

const UPDATE_SELECT =
  'id, user_id, title, description, type, url, tags, created_at, repost_of_id, quote_of_id'

function normalizeType(value: string | null | undefined): ProfileUpdateType {
  if (value && UPDATE_TYPES.has(value as ProfileUpdateType)) {
    return value as ProfileUpdateType
  }
  return 'Document'
}

function normalizeTags(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  const out: string[] = []
  const seen = new Set<string>()
  for (const item of value) {
    if (typeof item !== 'string') continue
    const tag = item.trim().replace(/\s+/g, ' ')
    if (!tag) continue
    const key = tag.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(tag)
  }
  return out.slice(0, 12)
}

type UpdateRow = {
  id: string
  user_id: string
  title: string | null
  description: string | null
  type: string | null
  url: string | null
  tags: string[] | null
  created_at: string
  repost_of_id?: string | null
  quote_of_id?: string | null
}

function bodyFromRow(row: {
  title: string | null
  description: string | null
}): string {
  const description = (row.description ?? '').trim()
  const title = (row.title ?? '').trim()
  return description || title
}

async function getLikeSummaries(
  updateIds: string[]
): Promise<Record<string, { count: number; likedByMe: boolean }>> {
  const supabase = getSupabaseClient()
  const empty: Record<string, { count: number; likedByMe: boolean }> = {}
  updateIds.forEach((id) => {
    empty[id] = { count: 0, likedByMe: false }
  })
  if (!supabase || updateIds.length === 0) return empty

  const {
    data: { user }
  } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('votes')
    .select('user_id, target_id, value')
    .eq('target_type', 'profile_update')
    .in('target_id', updateIds)
    .eq('value', 1)
  if (error || !Array.isArray(data)) return empty

  for (const row of data as Array<{
    user_id: string
    target_id: string
    value: number
  }>) {
    const bucket = empty[row.target_id]
    if (!bucket) continue
    bucket.count += 1
    if (user && row.user_id === user.id) bucket.likedByMe = true
  }
  return empty
}

async function getCommentCounts(
  updateIds: string[]
): Promise<Record<string, number>> {
  const supabase = getSupabaseClient()
  const counts: Record<string, number> = {}
  updateIds.forEach((id) => {
    counts[id] = 0
  })
  if (!supabase || updateIds.length === 0) return counts

  const { data, error } = await supabase
    .from('comments')
    .select('target_id')
    .eq('target_type', 'profile_update')
    .in('target_id', updateIds)
  if (error || !Array.isArray(data)) return counts

  for (const row of data as Array<{ target_id: string }>) {
    if (!row.target_id) continue
    counts[row.target_id] = (counts[row.target_id] ?? 0) + 1
  }
  return counts
}

export type ProfileUpdateEngagement = {
  likeCount: number
  likedByMe: boolean
  commentCount: number
}

/** Like + comment counts for a batch of profile updates (feed / cards). */
export async function getProfileUpdateEngagement(
  updateIds: string[]
): Promise<Record<string, ProfileUpdateEngagement>> {
  const empty: Record<string, ProfileUpdateEngagement> = {}
  updateIds.forEach((id) => {
    empty[id] = { likeCount: 0, likedByMe: false, commentCount: 0 }
  })
  if (updateIds.length === 0) return empty
  const [likes, comments] = await Promise.all([
    getLikeSummaries(updateIds),
    getCommentCounts(updateIds)
  ])
  for (const id of updateIds) {
    empty[id] = {
      likeCount: likes[id]?.count ?? 0,
      likedByMe: likes[id]?.likedByMe ?? false,
      commentCount: comments[id] ?? 0
    }
  }
  return empty
}

function mapRow(
  row: UpdateRow,
  likes: { count: number; likedByMe: boolean },
  commentCount: number,
  original?: ProfileUpdateOriginal | null
): ProfileUpdate {
  return {
    id: row.id,
    userId: row.user_id,
    title: (row.title ?? '').trim(),
    description: (row.description ?? '').trim(),
    type: normalizeType(row.type),
    url: (row.url ?? '').trim(),
    tags: normalizeTags(row.tags),
    createdAt: row.created_at,
    likeCount: likes.count,
    likedByMe: likes.likedByMe,
    commentCount,
    repostOfId: row.repost_of_id ?? null,
    quoteOfId: row.quote_of_id ?? null,
    original: original ?? null
  }
}

async function hydrateOriginals(
  rows: UpdateRow[]
): Promise<Record<string, ProfileUpdateOriginal>> {
  const supabase = getSupabaseClient()
  const out: Record<string, ProfileUpdateOriginal> = {}
  if (!supabase) return out

  const originalIds = [
    ...new Set(
      rows
        .map((row) => row.repost_of_id || row.quote_of_id)
        .filter((id): id is string => Boolean(id))
    )
  ]
  if (originalIds.length === 0) return out

  const { data, error } = await supabase
    .from('profile_updates')
    .select(UPDATE_SELECT)
    .in('id', originalIds)
  if (error || !Array.isArray(data)) return out

  const originals = data as UpdateRow[]
  const userIds = [...new Set(originals.map((row) => row.user_id))]
  const { data: profiles } = await supabase
    .from('profiles')
    .select('user_id, display_name, avatar_url')
    .in('user_id', userIds)
  const profileByUser: Record<
    string,
    { display_name: string | null; avatar_url: string | null }
  > = {}
  for (const profile of (profiles || []) as Array<{
    user_id: string
    display_name: string | null
    avatar_url: string | null
  }>) {
    profileByUser[profile.user_id] = profile
  }

  for (const row of originals) {
    const profile = profileByUser[row.user_id]
    out[row.id] = {
      id: row.id,
      userId: row.user_id,
      displayName: profile?.display_name?.trim() || 'Someone',
      avatarUrl: profile?.avatar_url ?? null,
      body: bodyFromRow(row),
      url: (row.url ?? '').trim(),
      createdAt: row.created_at
    }
  }
  return out
}

/** Resolve to root original so nests stay one level deep. */
async function resolveRootUpdateId(updateId: string): Promise<string | null> {
  const supabase = getSupabaseClient()
  if (!supabase || !updateId) return null
  const { data, error } = await supabase
    .from('profile_updates')
    .select('id, user_id, repost_of_id, quote_of_id')
    .eq('id', updateId)
    .maybeSingle()
  if (error || !data) return null
  const row = data as {
    id: string
    user_id: string
    repost_of_id: string | null
    quote_of_id: string | null
  }
  const nested = row.repost_of_id || row.quote_of_id
  if (!nested) return row.id
  const { data: root } = await supabase
    .from('profile_updates')
    .select('id')
    .eq('id', nested)
    .maybeSingle()
  return (root as { id: string } | null)?.id ?? nested
}

/** Profile updates for a user, newest first. */
export async function listProfileUpdatesByUserId(
  userId: string
): Promise<ProfileUpdate[]> {
  const supabase = getSupabaseClient()
  if (!supabase || !userId) return []

  const { data, error } = await supabase
    .from('profile_updates')
    .select(UPDATE_SELECT)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('listProfileUpdatesByUserId failed', error)
    return []
  }
  if (!Array.isArray(data) || data.length === 0) return []

  const rows = data as UpdateRow[]
  const ids = rows.map((row) => row.id)
  const [likes, comments, originals] = await Promise.all([
    getLikeSummaries(ids),
    getCommentCounts(ids),
    hydrateOriginals(rows)
  ])

  return rows.map((row) => {
    const originalId = row.repost_of_id || row.quote_of_id
    return mapRow(
      row,
      likes[row.id] ?? { count: 0, likedByMe: false },
      comments[row.id] ?? 0,
      originalId ? originals[originalId] ?? null : null
    )
  })
}

export async function createProfileUpdate(
  draft: ProfileUpdateDraft
): Promise<ProfileUpdate | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return null

  const title = draft.title.trim().slice(0, 200)
  const description = draft.description.trim().slice(0, 4000)
  if (!title && !description) return null

  const { data, error } = await supabase
    .from('profile_updates')
    .insert({
      user_id: user.id,
      title: title || description.slice(0, 72),
      description: description || title,
      type: normalizeType(draft.type),
      url: draft.url.trim().slice(0, 2000),
      tags: normalizeTags(draft.tags)
    })
    .select(UPDATE_SELECT)
    .single()

  if (error || !data) {
    console.error('createProfileUpdate failed', error)
    return null
  }

  return mapRow(data as UpdateRow, { count: 0, likedByMe: false }, 0, null)
}

/** One-click reshare: new empty row pointing at the root original. No self-repost. */
export async function createProfileUpdateRepost(
  originalId: string
): Promise<ProfileUpdate | null> {
  const supabase = getSupabaseClient()
  if (!supabase || !originalId) return null
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return null

  const rootId = await resolveRootUpdateId(originalId)
  if (!rootId) return null

  const { data: original, error: originalError } = await supabase
    .from('profile_updates')
    .select(UPDATE_SELECT)
    .eq('id', rootId)
    .maybeSingle()
  if (originalError || !original) return null
  const originalRow = original as UpdateRow
  if (originalRow.user_id === user.id) return null

  const { data, error } = await supabase
    .from('profile_updates')
    .insert({
      user_id: user.id,
      title: '',
      description: '',
      type: 'Document',
      url: '',
      tags: [],
      repost_of_id: rootId,
      quote_of_id: null
    })
    .select(UPDATE_SELECT)
    .single()

  if (error || !data) {
    console.error('createProfileUpdateRepost failed', error)
    return null
  }

  const originals = await hydrateOriginals([data as UpdateRow])
  return mapRow(
    data as UpdateRow,
    { count: 0, likedByMe: false },
    0,
    originals[rootId] ?? null
  )
}

/** Quote: commentary required; embeds root original. */
export async function createProfileUpdateQuote(
  originalId: string,
  commentary: string
): Promise<ProfileUpdate | null> {
  const supabase = getSupabaseClient()
  if (!supabase || !originalId) return null
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return null

  const body = commentary.trim().slice(0, 4000)
  if (!body) return null

  const rootId = await resolveRootUpdateId(originalId)
  if (!rootId) return null

  const { data: original, error: originalError } = await supabase
    .from('profile_updates')
    .select('id')
    .eq('id', rootId)
    .maybeSingle()
  if (originalError || !original) return null

  const { data, error } = await supabase
    .from('profile_updates')
    .insert({
      user_id: user.id,
      title: body.slice(0, 72),
      description: body,
      type: 'Document',
      url: '',
      tags: [],
      repost_of_id: null,
      quote_of_id: rootId
    })
    .select(UPDATE_SELECT)
    .single()

  if (error || !data) {
    console.error('createProfileUpdateQuote failed', error)
    return null
  }

  const originals = await hydrateOriginals([data as UpdateRow])
  return mapRow(
    data as UpdateRow,
    { count: 0, likedByMe: false },
    0,
    originals[rootId] ?? null
  )
}

/** Fetch a single update with engagement + original (for feed helpers). */
export async function getProfileUpdateById(
  updateId: string
): Promise<ProfileUpdate | null> {
  const supabase = getSupabaseClient()
  if (!supabase || !updateId) return null
  const { data, error } = await supabase
    .from('profile_updates')
    .select(UPDATE_SELECT)
    .eq('id', updateId)
    .maybeSingle()
  if (error || !data) return null
  const row = data as UpdateRow
  const [likes, comments, originals] = await Promise.all([
    getLikeSummaries([row.id]),
    getCommentCounts([row.id]),
    hydrateOriginals([row])
  ])
  const originalId = row.repost_of_id || row.quote_of_id
  return mapRow(
    row,
    likes[row.id] ?? { count: 0, likedByMe: false },
    comments[row.id] ?? 0,
    originalId ? originals[originalId] ?? null : null
  )
}

/** Toggle like on an update. Returns the resulting liked state + count, or null. */
export async function setProfileUpdateLiked(
  updateId: string,
  liked: boolean
): Promise<{ likedByMe: boolean; likeCount: number } | null> {
  const supabase = getSupabaseClient()
  if (!supabase || !updateId) return null
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return null

  if (liked) {
    const { error } = await supabase.from('votes').upsert(
      {
        user_id: user.id,
        target_type: 'profile_update',
        target_id: updateId,
        value: 1
      },
      { onConflict: 'user_id,target_type,target_id' }
    )
    if (error) {
      console.error('setProfileUpdateLiked upsert failed', error)
      return null
    }
  } else {
    const { error } = await supabase
      .from('votes')
      .delete()
      .eq('user_id', user.id)
      .eq('target_type', 'profile_update')
      .eq('target_id', updateId)
    if (error) {
      console.error('setProfileUpdateLiked delete failed', error)
      return null
    }
  }

  const likes = await getLikeSummaries([updateId])
  const summary = likes[updateId] ?? { count: 0, likedByMe: false }
  return { likedByMe: summary.likedByMe, likeCount: summary.count }
}

export async function getProfileUpdateCommentThread(
  updateId: string
): Promise<ThreadedComment[]> {
  return getPolymorphicCommentThread('profile_update', updateId)
}

export async function addProfileUpdateComment(
  updateId: string,
  body: string,
  parentCommentId?: string | null
): Promise<ThreadedComment | null> {
  return addPolymorphicComment(
    'profile_update',
    updateId,
    body,
    parentCommentId
  )
}

export async function setProfileUpdateCommentVote(
  comment: { id: string; user_id: string; user_vote: 1 | -1 | null },
  value: 1 | -1 | null
): Promise<number | null> {
  return setPolymorphicCommentVote(comment, value)
}

/** Exported for feed hydration of nested originals. */
export async function hydrateProfileUpdateOriginals(
  rows: Array<{
    repost_of_id?: string | null
    quote_of_id?: string | null
  }>
): Promise<Record<string, ProfileUpdateOriginal>> {
  return hydrateOriginals(rows as UpdateRow[])
}
