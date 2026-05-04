/**
 * Profile personal links (e.g. Twitter, portfolio) — not the same as bookmarked user_links.
 */
import { getSupabaseClient } from './supabase'

export const MAX_PROFILE_PERSONAL_LINKS = 10

export type ProfilePersonalLink = {
  id: string
  user_id: string
  url: string
  title: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

function normalizeUrl(raw: string): string | null {
  const t = raw.trim()
  if (!t) return null
  try {
    const u = new URL(t.includes('://') ? t : `https://${t}`)
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null
    return u.toString()
  } catch {
    return null
  }
}

export async function listPersonalLinksByUserId(
  userId: string
): Promise<ProfilePersonalLink[]> {
  const supabase = getSupabaseClient()
  if (!supabase) return []
  const { data, error } = await supabase
    .from('profile_personal_links')
    .select('id, user_id, url, title, sort_order, created_at, updated_at')
    .eq('user_id', userId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })
  if (error || !data) return []
  return data as ProfilePersonalLink[]
}

export async function listMyPersonalLinks(): Promise<ProfilePersonalLink[]> {
  const supabase = getSupabaseClient()
  if (!supabase) return []
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return []
  return listPersonalLinksByUserId(user.id)
}

export async function insertPersonalLink(
  url: string,
  title: string | null
): Promise<ProfilePersonalLink | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return null
  const normalized = normalizeUrl(url)
  if (!normalized) return null
  const existing = await listMyPersonalLinks()
  if (existing.length >= MAX_PROFILE_PERSONAL_LINKS) return null
  const nextOrder =
    existing.length === 0
      ? 0
      : Math.max(...existing.map((r) => r.sort_order)) + 1
  const titleTrim = title?.trim() || null
  const { data, error } = await supabase
    .from('profile_personal_links')
    .insert({
      user_id: user.id,
      url: normalized,
      title: titleTrim,
      sort_order: nextOrder
    })
    .select('id, user_id, url, title, sort_order, created_at, updated_at')
    .single()
  if (error || !data) return null
  return data as ProfilePersonalLink
}

export async function updatePersonalLink(
  id: string,
  patch: { url?: string; title?: string | null }
): Promise<boolean> {
  const supabase = getSupabaseClient()
  if (!supabase) return false
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return false
  const row: Record<string, unknown> = {
    updated_at: new Date().toISOString()
  }
  if (patch.url !== undefined) {
    const n = normalizeUrl(patch.url)
    if (!n) return false
    row.url = n
  }
  if (patch.title !== undefined) {
    row.title = patch.title?.trim() || null
  }
  const { error } = await supabase
    .from('profile_personal_links')
    .update(row)
    .eq('id', id)
    .eq('user_id', user.id)
  return !error
}

export async function deletePersonalLink(id: string): Promise<boolean> {
  const supabase = getSupabaseClient()
  if (!supabase) return false
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return false
  const { error } = await supabase
    .from('profile_personal_links')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
  return !error
}
