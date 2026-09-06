import { getCachedAuth } from '@/lib/auth-cache'
import { getSupabaseClient } from '@/lib/supabase'
import type { LearningPathUserResource } from '@/lib/learning-path-seed'

export type LearningPathInvite = {
  id: string
  pathId: string
  email: string
  userId: string | null
  displayName: string | null
  createdAt: string | null
}

export type InviteLearningPathCollaboratorResult =
  | { ok: true; invite: LearningPathInvite }
  | {
      ok: false
      error: 'invalid' | 'not-found' | 'self' | 'already' | 'failed'
    }

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function normalizeLearningPathInviteEmail(value: string) {
  return value.trim().toLowerCase()
}

export function isValidLearningPathInviteEmail(value: string) {
  const email = normalizeLearningPathInviteEmail(value)
  if (!email || /[%_]/.test(email)) return false
  return EMAIL_PATTERN.test(email)
}

async function currentAuth() {
  const supabase = getSupabaseClient()
  if (!supabase) return { supabase: null, userId: null as string | null, email: null as string | null }
  const {
    data: { user }
  } = await supabase.auth.getUser()
  return {
    supabase,
    userId: user?.id ?? null,
    email: user?.email ? normalizeLearningPathInviteEmail(user.email) : null
  }
}

type ProfileEmailRow = {
  user_id?: string
  email?: string | null
  display_name?: string | null
}

export async function findCoursetextsUserByEmail(email: string): Promise<{
  userId: string
  email: string
  displayName: string | null
} | null> {
  const normalized = normalizeLearningPathInviteEmail(email)
  if (!isValidLearningPathInviteEmail(normalized)) return null
  const supabase = getSupabaseClient()
  if (!supabase) return null
  const { data, error } = await supabase
    .from('profiles')
    .select('user_id, email, display_name')
    .ilike('email', normalized)
    .limit(2)
  if (error || !Array.isArray(data) || data.length === 0) return null
  const row = data[0] as ProfileEmailRow
  if (!row.user_id) return null
  return {
    userId: row.user_id,
    email: normalizeLearningPathInviteEmail(row.email || normalized),
    displayName: row.display_name?.trim() || null
  }
}

type InviteRow = {
  id: string
  path_id: string
  invited_email: string
  invited_user_id: string | null
  created_at?: string | null
}

async function withDisplayNames(
  rows: InviteRow[]
): Promise<LearningPathInvite[]> {
  const supabase = getSupabaseClient()
  const names: Record<string, string> = {}
  const userIds = [
    ...new Set(rows.map((row) => row.invited_user_id).filter(Boolean))
  ] as string[]
  if (supabase && userIds.length > 0) {
    const { data, error } = await supabase
      .from('profiles')
      .select('user_id, display_name')
      .in('user_id', userIds)
    if (!error && Array.isArray(data)) {
      for (const row of data as Array<{
        user_id?: string
        display_name?: string | null
      }>) {
        if (!row.user_id) continue
        const name = row.display_name?.trim()
        if (name) names[row.user_id] = name
      }
    }
  }
  return rows.map((row) => ({
    id: row.id,
    pathId: row.path_id,
    email: row.invited_email,
    userId: row.invited_user_id,
    displayName: row.invited_user_id ? names[row.invited_user_id] ?? null : null,
    createdAt: row.created_at ?? null
  }))
}

export async function listLearningPathInvites(
  pathId: string
): Promise<LearningPathInvite[]> {
  const supabase = getSupabaseClient()
  if (!supabase || !pathId) return []
  const { data, error } = await supabase
    .from('learning_path_invites')
    .select('id, path_id, invited_email, invited_user_id, created_at')
    .eq('path_id', pathId)
    .order('created_at', { ascending: true })
  if (error || !Array.isArray(data)) return []
  return withDisplayNames(data as InviteRow[])
}

export async function listInvitedLearningPathIds(): Promise<string[]> {
  const { supabase, userId, email } = await currentAuth()
  if (!supabase || !userId) return []
  const clauses = [`invited_user_id.eq.${userId}`]
  if (email) clauses.push(`invited_email.eq.${email}`)
  const { data, error } = await supabase
    .from('learning_path_invites')
    .select('path_id')
    .or(clauses.join(','))
  if (error || !Array.isArray(data)) return []
  return [
    ...new Set(
      (data as Array<{ path_id?: string }>)
        .map((row) => row.path_id)
        .filter((id): id is string => Boolean(id))
    )
  ]
}

export async function isCurrentUserLearningPathInvitee(
  pathId: string
): Promise<boolean> {
  const { supabase, userId, email } = await currentAuth()
  if (!supabase || !userId || !pathId) return false
  const clauses = [`invited_user_id.eq.${userId}`]
  if (email) clauses.push(`invited_email.eq.${email}`)
  const { data, error } = await supabase
    .from('learning_path_invites')
    .select('id')
    .eq('path_id', pathId)
    .or(clauses.join(','))
    .maybeSingle()
  return !error && Boolean(data)
}

export async function inviteLearningPathCollaborator(
  pathId: string,
  email: string
): Promise<InviteLearningPathCollaboratorResult> {
  if (!isValidLearningPathInviteEmail(email)) {
    return { ok: false, error: 'invalid' }
  }
  const { supabase, userId, email: ownerEmail } = await currentAuth()
  if (!supabase || !userId || !pathId) return { ok: false, error: 'failed' }
  const normalized = normalizeLearningPathInviteEmail(email)
  if (ownerEmail && ownerEmail === normalized) {
    return { ok: false, error: 'self' }
  }
  const person = await findCoursetextsUserByEmail(normalized)
  if (!person) return { ok: false, error: 'not-found' }
  if (person.userId === userId) return { ok: false, error: 'self' }

  const { data, error } = await supabase
    .from('learning_path_invites')
    .insert({
      path_id: pathId,
      invited_email: person.email,
      invited_user_id: person.userId,
      invited_by: userId
    })
    .select('id, path_id, invited_email, invited_user_id, created_at')
    .maybeSingle()

  if (error || !data) {
    if (error?.code === '23505') return { ok: false, error: 'already' }
    console.error('inviteLearningPathCollaborator failed', error)
    return { ok: false, error: 'failed' }
  }
  const [invite] = await withDisplayNames([data as InviteRow])
  return {
    ok: true,
    invite: {
      ...invite,
      displayName: invite.displayName ?? person.displayName
    }
  }
}

export async function removeLearningPathInvite(
  inviteId: string
): Promise<boolean> {
  const supabase = getSupabaseClient()
  if (!supabase || !inviteId) return false
  const { error } = await supabase
    .from('learning_path_invites')
    .delete()
    .eq('id', inviteId)
  if (error) {
    console.error('removeLearningPathInvite failed', error)
    return false
  }
  return true
}

function normalizeOverlayResources(
  value: unknown
): Record<string, LearningPathUserResource[]> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  const out: Record<string, LearningPathUserResource[]> = {}
  for (const [key, items] of Object.entries(
    value as Record<string, unknown>
  )) {
    if (Array.isArray(items)) out[key] = items as LearningPathUserResource[]
  }
  return out
}

export async function loadLearningPathOwnerOverlayResources(
  pathId: string
): Promise<Record<string, LearningPathUserResource[]>> {
  const supabase = getSupabaseClient()
  const userId = getCachedAuth().user?.id ?? null
  if (!supabase || !pathId || !userId) return {}
  const { data, error } = await supabase.rpc(
    'learning_path_owner_overlay_resources',
    { p_path_id: pathId }
  )
  if (error) {
    console.error('loadLearningPathOwnerOverlayResources failed', error)
    return {}
  }
  return normalizeOverlayResources(data)
}
