/**
 * Per-user “committed” flags on learning paths and official courses.
 * Later this will drive reminders to finish the path. Until then it is
 * only a profile tag + filter.
 *
 * Keys: `learning-path:{slug}` or `course:{notion_page_id}`.
 * Falls back to localStorage if Supabase is missing or 030 is not applied.
 */

import { getSupabaseClient } from '@/lib/supabase'

const STORAGE_KEY = 'coursetexts.learning-path-commitments'

export function learningPathCommitmentKey(slug: string): string {
  return `learning-path:${slug}`
}

export function officialCourseCommitmentKey(pageId: string): string {
  return `course:${pageId}`
}

function readLocalCommitmentKeys(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter((key): key is string => typeof key === 'string')
  } catch {
    return []
  }
}

function writeLocalCommitmentKeys(keys: string[]) {
  if (typeof window === 'undefined') return
  const unique = [...new Set(keys)]
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(unique))
}

async function currentUser() {
  const supabase = getSupabaseClient()
  if (!supabase) return { supabase: null, userId: null as string | null }
  const {
    data: { user }
  } = await supabase.auth.getUser()
  return { supabase, userId: user?.id ?? null }
}

export async function listMyLearningPathCommitments(): Promise<string[]> {
  const local = readLocalCommitmentKeys()
  const { supabase, userId } = await currentUser()
  if (!supabase || !userId) return local
  const { data, error } = await supabase
    .from('learning_path_commitments')
    .select('target_key')
    .eq('user_id', userId)
  if (error || !Array.isArray(data)) return local
  const keys = data
    .map((row) => (row as { target_key?: string }).target_key)
    .filter((key): key is string => Boolean(key))
  writeLocalCommitmentKeys(keys)
  return keys
}

export async function setLearningPathCommitted(
  targetKey: string,
  committed: boolean
): Promise<boolean> {
  const key = targetKey.trim()
  if (!key) return false
  const local = new Set(readLocalCommitmentKeys())
  if (committed) local.add(key)
  else local.delete(key)
  writeLocalCommitmentKeys([...local])

  const { supabase, userId } = await currentUser()
  if (!supabase || !userId) return true

  if (committed) {
    const { error } = await supabase.from('learning_path_commitments').insert({
      user_id: userId,
      target_key: key
    })
    if (error && error.code !== '23505') {
      return true
    }
    return true
  }

  await supabase
    .from('learning_path_commitments')
    .delete()
    .eq('user_id', userId)
    .eq('target_key', key)
  return true
}
