/**
 * Community platform data layer — adapted for the legacy course-page DB
 * after migration 025_community_page_platform.sql.
 *
 * Conventions:
 *   - profiles.user_id IS the auth user id (profiles.id is a separate PK)
 *   - resources / knowledge_components are site-wide community tables
 *   - comments are polymorphic via (target_type, target_id) for community,
 *     while course comments continue to use course_id
 *   - votes.target_type includes 'resource' in addition to comment/annotation
 *   - profiles.karma_score is display-only (rules TBD; see lib/karma.ts)
 */
import { applyKarmaForVote } from './karma'
import { getSupabaseClient } from './supabase'

/** resources.type enum values in the database. */
export const RESOURCE_TYPES = [
  'textbook',
  'video',
  'paper',
  'slides',
  'problem_set'
] as const
export type ResourceDbType = (typeof RESOURCE_TYPES)[number]

export interface CommentAuthor {
  display_name: string | null
  avatar_url: string | null
  /** From profiles.karma_score; shown next to the username. */
  karma_score: number
}

export interface ThreadedComment {
  id: string
  user_id: string
  parent_comment_id: string | null
  body: string
  created_at: string
  author: CommentAuthor | null
  score: number
  user_vote: 1 | -1 | null
  replies: ThreadedComment[]
}

type CommentRow = {
  id: string
  user_id: string
  parent_comment_id: string | null
  body: string
  created_at: string
}

/** Arrange a flat comment list into a tree, chronological within siblings. */
function buildThread(
  rows: CommentRow[],
  authorByUser: Record<string, CommentAuthor>,
  votes: Record<string, { score: number; user_vote: 1 | -1 | null }>
): ThreadedComment[] {
  const nodes: Record<string, ThreadedComment> = {}
  rows.forEach((r) => {
    nodes[r.id] = {
      ...r,
      author: authorByUser[r.user_id] ?? null,
      score: votes[r.id]?.score ?? 0,
      user_vote: votes[r.id]?.user_vote ?? null,
      replies: []
    }
  })
  const roots: ThreadedComment[] = []
  rows.forEach((r) => {
    const node = nodes[r.id]
    const parent = r.parent_comment_id ? nodes[r.parent_comment_id] : null
    if (parent) parent.replies.push(node)
    else roots.push(node)
  })
  return roots
}

async function getAuthorsByIds(
  userIds: string[]
): Promise<Record<string, CommentAuthor>> {
  const supabase = getSupabaseClient()
  if (!supabase || userIds.length === 0) return {}
  const { data } = await supabase
    .from('profiles')
    .select('user_id, display_name, avatar_url, karma_score')
    .in('user_id', userIds)
  const byId: Record<string, CommentAuthor> = {}
  ;(data || []).forEach((p: any) => {
    byId[p.user_id] = {
      display_name: p.display_name,
      avatar_url: p.avatar_url,
      karma_score: p.karma_score ?? 0
    }
  })
  return byId
}

async function getVoteSummaries(
  targetType: 'resource' | 'comment',
  targetIds: string[]
): Promise<Record<string, { score: number; user_vote: 1 | -1 | null }>> {
  const supabase = getSupabaseClient()
  if (!supabase || targetIds.length === 0) return {}
  const {
    data: { user }
  } = await supabase.auth.getUser()
  const { data: rows, error } = await supabase
    .from('votes')
    .select('user_id, target_id, value')
    .eq('target_type', targetType)
    .in('target_id', targetIds)
  if (error) return {}
  const byId: Record<string, { score: number; user_vote: 1 | -1 | null }> = {}
  targetIds.forEach((id) => (byId[id] = { score: 0, user_vote: null }))
  ;(rows || []).forEach(
    (r: { user_id: string; target_id: string; value: number }) => {
      if (!byId[r.target_id]) return
      byId[r.target_id].score += r.value
      if (user && r.user_id === user.id) {
        byId[r.target_id].user_vote = r.value as 1 | -1
      }
    }
  )
  return byId
}

/** Full comment thread for a resource, with authors, karma, and vote state. */
export async function getResourceCommentThread(
  resourceId: string
): Promise<ThreadedComment[]> {
  const supabase = getSupabaseClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('comments')
    .select('id, user_id, parent_comment_id, body, created_at')
    .eq('target_type', 'resource')
    .eq('target_id', resourceId)
    .order('created_at', { ascending: true })
  if (error) throw error
  if (!data?.length) return []
  const rows = data as CommentRow[]

  const [authorByUser, voteMap] = await Promise.all([
    getAuthorsByIds([...new Set(rows.map((r) => r.user_id))]),
    getVoteSummaries(
      'comment',
      rows.map((r) => r.id)
    )
  ])

  return buildThread(rows, authorByUser, voteMap)
}

/** Post a comment; pass parentCommentId to reply. Returns the new node. */
export async function addResourceComment(
  resourceId: string,
  body: string,
  parentCommentId?: string | null
): Promise<ThreadedComment | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('comments')
    .insert({
      user_id: user.id,
      target_type: 'resource',
      target_id: resourceId,
      body,
      parent_comment_id: parentCommentId ?? null
    })
    .select('id, user_id, parent_comment_id, body, created_at')
    .single()
  if (error || !data) return null

  const authors = await getAuthorsByIds([user.id])
  return {
    ...(data as CommentRow),
    author: authors[user.id] ?? null,
    score: 0,
    user_vote: null,
    replies: []
  }
}

/**
 * Vote on a comment (value null clears the vote). Returns the new score.
 */
export async function setResourceCommentVote(
  comment: { id: string; user_id: string; user_vote: 1 | -1 | null },
  value: 1 | -1 | null
): Promise<number | null> {
  const score = await setVote('comment', comment.id, value)
  if (score === null) return null
  // Karma is display-only for now; this is a no-op stub (rules TBD).
  const supabase = getSupabaseClient()
  if (supabase) {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (user) {
      await applyKarmaForVote({
        recipientUserId: comment.user_id,
        voterUserId: user.id,
        targetType: 'resource_comment',
        targetId: comment.id,
        value,
        previousValue: comment.user_vote
      })
    }
  }
  return score
}

/** Vote on a resource (value null clears). Returns the new score. */
export async function setResourceVote(
  resourceId: string,
  value: 1 | -1 | null
): Promise<number | null> {
  return setVote('resource', resourceId, value)
}

async function setVote(
  targetType: 'resource' | 'comment',
  targetId: string,
  value: 1 | -1 | null
): Promise<number | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return null

  if (value === null) {
    const { error } = await supabase
      .from('votes')
      .delete()
      .eq('user_id', user.id)
      .eq('target_type', targetType)
      .eq('target_id', targetId)
    if (error) return null
  } else {
    const { error } = await supabase.from('votes').upsert(
      {
        user_id: user.id,
        target_type: targetType,
        target_id: targetId,
        value
      },
      { onConflict: 'user_id,target_type,target_id' }
    )
    if (error) return null
  }

  const { data: rows, error: scoreError } = await supabase
    .from('votes')
    .select('value')
    .eq('target_type', targetType)
    .eq('target_id', targetId)
  if (scoreError) return null
  return (rows || []).reduce((s, r) => s + (r as { value: number }).value, 0)
}

/* ------------------------------------------------ */
/* Community page resources — the `resources` table */
/* ------------------------------------------------ */

export interface CommunityPageResource {
  id: string
  type: ResourceDbType
  title: string
  description: string | null
  url: string
  author_name: string | null
  score: number
  user_vote: 1 | -1 | null
  comment_count: number
  created_at: string
}

/** Resources on the /community page, newest first, with votes and counts. */
export async function getCommunityPageResources(): Promise<
  CommunityPageResource[]
> {
  const supabase = getSupabaseClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('resources')
    .select('id, title, url, type, description, submitted_by, created_at')
    .order('created_at', { ascending: false })
  if (error) throw error
  if (!data?.length) return []

  const rows = data as Array<{
    id: string
    title: string
    url: string
    type: ResourceDbType
    description: string | null
    submitted_by: string
    created_at: string
  }>
  const resourceIds = rows.map((r) => r.id)

  const [authorByUser, voteMap, { data: commentRows }] = await Promise.all([
    getAuthorsByIds([...new Set(rows.map((r) => r.submitted_by))]),
    getVoteSummaries('resource', resourceIds),
    supabase
      .from('comments')
      .select('target_id')
      .eq('target_type', 'resource')
      .in('target_id', resourceIds)
  ])

  const counts: Record<string, number> = {}
  ;(commentRows || []).forEach((c: { target_id: string }) => {
    counts[c.target_id] = (counts[c.target_id] ?? 0) + 1
  })

  return rows.map((r) => ({
    id: r.id,
    type: r.type,
    title: r.title,
    description: r.description,
    url: r.url,
    author_name: authorByUser[r.submitted_by]?.display_name ?? null,
    score: voteMap[r.id]?.score ?? 0,
    user_vote: voteMap[r.id]?.user_vote ?? null,
    comment_count: counts[r.id] ?? 0,
    created_at: r.created_at
  }))
}

/** Share a resource. Returns the new resource, or null if signed out/error. */
export async function addCommunityPageResource(input: {
  title: string
  description: string
  url: string
  type: ResourceDbType
}): Promise<CommunityPageResource | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('resources')
    .insert({
      title: input.title,
      description: input.description,
      url: input.url,
      type: input.type,
      submitted_by: user.id
    })
    .select('id, title, url, type, description, submitted_by, created_at')
    .single()
  if (error || !data) return null

  const authors = await getAuthorsByIds([user.id])
  return {
    id: data.id,
    type: data.type,
    title: data.title,
    description: data.description,
    url: data.url,
    author_name: authors[user.id]?.display_name ?? null,
    score: 0,
    user_vote: null,
    comment_count: 0,
    created_at: data.created_at
  }
}
