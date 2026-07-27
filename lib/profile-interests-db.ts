import { getSupabaseClient } from './supabase'

const MAX_TAGS = 20
const MAX_TAG_LEN = 64

function normalizeTags(raw: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const t of raw) {
    const s = t.trim().slice(0, MAX_TAG_LEN)
    if (!s) continue
    const key = s.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(s)
    if (out.length >= MAX_TAGS) break
  }
  return out.sort((a, b) => a.localeCompare(b))
}

export async function getProfileInterestsByUserId(
  userId: string
): Promise<string[]> {
  const supabase = getSupabaseClient()
  if (!supabase) return []
  const { data, error } = await supabase
    .from('profile_interests')
    .select('tag')
    .eq('user_id', userId)
    .order('tag', { ascending: true })
  if (error || !data) return []
  return (data as { tag: string }[]).map((r) => r.tag)
}

/** Replaces all interests for the signed-in user (must match userId). */
export async function replaceProfileInterestsForUser(
  userId: string,
  tags: string[]
): Promise<boolean> {
  const supabase = getSupabaseClient()
  if (!supabase) return false
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user || user.id !== userId) return false
  const normalized = normalizeTags(tags)
  const { error: delErr } = await supabase
    .from('profile_interests')
    .delete()
    .eq('user_id', userId)
  if (delErr) return false
  if (normalized.length === 0) return true
  const rows = normalized.map((tag) => ({ user_id: userId, tag }))
  const { error: insErr } = await supabase.from('profile_interests').insert(rows)
  return !insErr
}
