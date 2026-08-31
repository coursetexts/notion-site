/**
 * Per-user “pin to top” flags for the header saved list.
 * Saved (bookmark / owned path) is separate; this only controls sort + pin icon.
 *
 * Keys: `learning-path:{slug}` or `course:{notion_page_id}`.
 * Falls back to localStorage if Supabase is missing or 031 is not applied.
 */

import { getSupabaseClient } from '@/lib/supabase'

const STORAGE_KEY = 'coursetexts.nav-pins'
const SEEDED_KEY = 'coursetexts.nav-pins.seeded'
const PINS_CHANGED_EVENT = 'ct:nav-pins-changed'

export function learningPathNavPinKey(slug: string): string {
  return `learning-path:${slug}`
}

export function officialCourseNavPinKey(pageId: string): string {
  return `course:${pageId}`
}

export function notifyNavPinsChanged() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(PINS_CHANGED_EVENT))
}

export function subscribeNavPins(listener: () => void): () => void {
  if (typeof window === 'undefined') {
    return () => undefined
  }
  window.addEventListener(PINS_CHANGED_EVENT, listener)
  return () => window.removeEventListener(PINS_CHANGED_EVENT, listener)
}

function uniqueKeys(keys: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const key of keys) {
    if (!key || seen.has(key)) continue
    seen.add(key)
    out.push(key)
  }
  return out
}

function readLocalNavPinKeys(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return uniqueKeys(
      parsed.filter((key): key is string => typeof key === 'string')
    )
  } catch {
    return []
  }
}

function writeLocalNavPinKeys(keys: string[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(uniqueKeys(keys)))
}

export function hasSeededNavPins(): boolean {
  if (typeof window === 'undefined') return true
  return window.localStorage.getItem(SEEDED_KEY) === '1'
}

export function markNavPinsSeeded() {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(SEEDED_KEY, '1')
}

async function currentUser() {
  const supabase = getSupabaseClient()
  if (!supabase) return { supabase: null, userId: null as string | null }
  const {
    data: { user }
  } = await supabase.auth.getUser()
  return { supabase, userId: user?.id ?? null }
}

export async function listMyNavPins(): Promise<string[]> {
  const local = readLocalNavPinKeys()
  const { supabase, userId } = await currentUser()
  if (!supabase || !userId) return local
  const { data, error } = await supabase
    .from('nav_pins')
    .select('target_key, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error || !Array.isArray(data)) return local
  const keys = uniqueKeys(
    data
      .map((row) => (row as { target_key?: string }).target_key)
      .filter((key): key is string => Boolean(key))
  )
  writeLocalNavPinKeys(keys)
  return keys
}

export async function setNavPinned(
  targetKey: string,
  pinned: boolean,
  options?: { notify?: boolean }
): Promise<boolean> {
  const key = targetKey.trim()
  if (!key) return false
  const local = readLocalNavPinKeys().filter((item) => item !== key)
  if (pinned) local.unshift(key)
  writeLocalNavPinKeys(local)

  const { supabase, userId } = await currentUser()
  if (supabase && userId) {
    if (pinned) {
      const { error } = await supabase.from('nav_pins').insert({
        user_id: userId,
        target_key: key
      })
      if (error && error.code !== '23505') {
        /* table may not exist yet; local list still updated */
      }
    } else {
      await supabase
        .from('nav_pins')
        .delete()
        .eq('user_id', userId)
        .eq('target_key', key)
    }
  }

  if (options?.notify !== false) notifyNavPinsChanged()
  return true
}
