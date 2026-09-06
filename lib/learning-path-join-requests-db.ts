import { getSupabaseClient } from '@/lib/supabase'
import {
  inviteLearningPathCollaborator,
  normalizeLearningPathInviteEmail,
  type LearningPathInvite
} from '@/lib/learning-path-invites-db'

export type LearningPathJoinRequest = {
  id: string
  pathId: string
  pathSlug: string
  pathTitle: string
  ownerId: string
  email: string
  userId: string
  displayName: string | null
  createdAt: string
}

export type RequestLearningPathJoinResult =
  | { ok: true; already: boolean }
  | {
      ok: false
      error:
        | 'signed-out'
        | 'no-email'
        | 'missing'
        | 'not-private'
        | 'owner'
        | 'already-invited'
        | 'failed'
    }

const JOIN_REQUESTS_EVENT = 'learning-path-join-requests-update'

function emitJoinRequestUpdate() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(JOIN_REQUESTS_EVENT))
  }
}

export function subscribeLearningPathJoinRequestUpdates(
  callback: () => void
): () => void {
  if (typeof window === 'undefined') return () => undefined
  window.addEventListener(JOIN_REQUESTS_EVENT, callback)
  return () => window.removeEventListener(JOIN_REQUESTS_EVENT, callback)
}

type JoinRequestRow = {
  id: string
  path_id: string
  requester_user_id: string
  requester_email: string
  created_at: string
}

async function withPathAndNames(
  rows: JoinRequestRow[]
): Promise<LearningPathJoinRequest[]> {
  const supabase = getSupabaseClient()
  if (!supabase || rows.length === 0) return []

  const pathIds = [...new Set(rows.map((row) => row.path_id))]
  const userIds = [...new Set(rows.map((row) => row.requester_user_id))]
  const [pathsRes, profilesRes] = await Promise.all([
    supabase
      .from('learning_paths')
      .select('id, slug, title, goal, owner_id')
      .in('id', pathIds),
    supabase
      .from('profiles')
      .select('user_id, display_name')
      .in('user_id', userIds)
  ])

  const paths: Record<
    string,
    { slug: string; title: string; ownerId: string }
  > = {}
  if (!pathsRes.error && Array.isArray(pathsRes.data)) {
    for (const row of pathsRes.data as Array<{
      id?: string
      slug?: string
      title?: string
      goal?: string
      owner_id?: string | null
    }>) {
      if (!row.id) continue
      paths[row.id] = {
        slug: row.slug || '',
        title: (row.title || row.goal || '').trim() || 'Learning path',
        ownerId: row.owner_id || ''
      }
    }
  }

  const names: Record<string, string> = {}
  if (!profilesRes.error && Array.isArray(profilesRes.data)) {
    for (const row of profilesRes.data as Array<{
      user_id?: string
      display_name?: string | null
    }>) {
      if (!row.user_id) continue
      const name = row.display_name?.trim()
      if (name) names[row.user_id] = name
    }
  }

  return rows.map((row) => {
    const path = paths[row.path_id]
    return {
      id: row.id,
      pathId: row.path_id,
      pathSlug: path?.slug ?? '',
      pathTitle: path?.title ?? 'Learning path',
      ownerId: path?.ownerId ?? '',
      email: row.requester_email,
      userId: row.requester_user_id,
      displayName: names[row.requester_user_id] ?? null,
      createdAt: row.created_at
    }
  })
}

export async function requestLearningPathJoin(
  slug: string
): Promise<RequestLearningPathJoinResult> {
  const supabase = getSupabaseClient()
  if (!supabase || !slug) return { ok: false, error: 'failed' }
  const { data, error } = await supabase.rpc('request_learning_path_join', {
    p_slug: slug
  })
  if (error || !data || typeof data !== 'object' || Array.isArray(data)) {
    console.error('requestLearningPathJoin failed', error)
    return { ok: false, error: 'failed' }
  }
  const row = data as { ok?: boolean; already?: boolean; error?: string }
  if (row.ok) {
    emitJoinRequestUpdate()
    return { ok: true, already: Boolean(row.already) }
  }
  if (
    row.error === 'signed-out' ||
    row.error === 'no-email' ||
    row.error === 'missing' ||
    row.error === 'not-private' ||
    row.error === 'owner' ||
    row.error === 'already-invited'
  ) {
    return { ok: false, error: row.error }
  }
  return { ok: false, error: 'failed' }
}

export async function listLearningPathJoinRequests(
  pathId?: string
): Promise<LearningPathJoinRequest[]> {
  const supabase = getSupabaseClient()
  if (!supabase) return []
  let query = supabase
    .from('learning_path_join_requests')
    .select('id, path_id, requester_user_id, requester_email, created_at')
    .order('created_at', { ascending: false })
  if (pathId) query = query.eq('path_id', pathId)
  const { data, error } = await query
  if (error || !Array.isArray(data)) return []
  return withPathAndNames(data as JoinRequestRow[])
}

export async function listOwnedLearningPathJoinRequests(): Promise<
  LearningPathJoinRequest[]
> {
  const supabase = getSupabaseClient()
  if (!supabase) return []
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return []
  const rows = await listLearningPathJoinRequests()
  return rows.filter((row) => row.ownerId === user.id)
}

export async function dismissLearningPathJoinRequest(
  requestId: string
): Promise<boolean> {
  const supabase = getSupabaseClient()
  if (!supabase || !requestId) return false
  const { error } = await supabase
    .from('learning_path_join_requests')
    .delete()
    .eq('id', requestId)
  if (error) {
    console.error('dismissLearningPathJoinRequest failed', error)
    return false
  }
  emitJoinRequestUpdate()
  return true
}

export async function acceptLearningPathJoinRequest(
  request: LearningPathJoinRequest
): Promise<
  | { ok: true; invite: LearningPathInvite }
  | { ok: false; error: 'failed' | 'already' | 'not-found' | 'self' }
> {
  const result = await inviteLearningPathCollaborator(
    request.pathId,
    request.email
  )
  if ('error' in result) {
    if (result.error === 'already') {
      await dismissLearningPathJoinRequest(request.id)
      return { ok: false, error: 'already' }
    }
    return { ok: false, error: result.error === 'self' ? 'self' : result.error === 'not-found' ? 'not-found' : 'failed' }
  }
  await dismissLearningPathJoinRequest(request.id)
  return { ok: true, invite: result.invite }
}

export async function deleteJoinRequestsForInvite(
  pathId: string,
  email: string
): Promise<void> {
  const supabase = getSupabaseClient()
  const normalized = normalizeLearningPathInviteEmail(email)
  if (!supabase || !pathId || !normalized) return
  const { error } = await supabase
    .from('learning_path_join_requests')
    .delete()
    .eq('path_id', pathId)
    .eq('requester_email', normalized)
  if (!error) emitJoinRequestUpdate()
}
