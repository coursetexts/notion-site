/**
 * Community search — calls the `search_community` RPC added by
 * supabase/live/002_community_search.sql (Postgres FTS over resources and
 * knowledge_components, ranked by relevance with vote-score tie-break).
 *
 * No external services in the search path: this is a single round-trip to
 * our own Postgres. Returns null when Supabase is unavailable or the RPC
 * errors, so callers can fall back to local filtering.
 */
import { type ResourceDbType } from './community-comments-db'
import { getSupabaseClient } from './supabase'

export interface CommunitySearchHit {
  kind: 'resource' | 'knowledge_component'
  id: string
  title: string
  description: string | null
  url: string | null
  type: ResourceDbType | null
  created_at: string
  score: number
}

export async function searchCommunity(
  q: string,
  opts?: { signal?: AbortSignal }
): Promise<CommunitySearchHit[] | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null
  const query = q.trim()
  if (!query) return []

  try {
    let req = supabase.rpc('search_community', { q: query, max_results: 30 })
    if (opts?.signal) req = req.abortSignal(opts.signal)
    const { data, error } = await req
    if (error) return null
    return ((data as any[]) || []).map((r) => ({
      kind: r.kind === 'knowledge_component' ? 'knowledge_component' : 'resource',
      id: r.id,
      title: r.title ?? '',
      description: r.description,
      url: r.url,
      type: r.type ?? null,
      created_at: r.created_at,
      score: Number(r.score ?? 0)
    }))
  } catch {
    // Aborted mid-flight or network failure — caller keeps its current list.
    return null
  }
}
