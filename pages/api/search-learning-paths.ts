import type { NextApiRequest, NextApiResponse } from 'next'

import { normalizeCatalogText } from '@/lib/catalog-search'
import {
  LEARNING_PATH_EMBED_DIM,
  embedLearningPathQuery
} from '@/lib/learning-path-embed'
import type {
  SemanticCatalogKind,
  SemanticCatalogMatch
} from '@/lib/semantic-learning-path-search'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export const config = {
  maxDuration: 60
}

const MATCH_COUNT = 12
const QUERY_MAX_LENGTH = 200
const CACHE_TTL_MS = 10 * 60 * 1000
const DEFAULT_KINDS: SemanticCatalogKind[] = ['learning-path']

type SearchSuccess = {
  matches: SemanticCatalogMatch[]
}

type SearchError = {
  error: string
}

type CacheEntry = {
  matches: SemanticCatalogMatch[]
  expiresAt: number
}

const searchCache = new Map<string, CacheEntry>()

type PathMatchRow = {
  path_id?: unknown
  slug?: unknown
  distance?: unknown
}

type NotionMatchRow = {
  notion_page_id?: unknown
  title?: unknown
  distance?: unknown
}

type RankedMatch = SemanticCatalogMatch & { distance: number }

function readQuery(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null
  const query = (body as { query?: unknown }).query
  if (typeof query !== 'string') return null
  return query.trim()
}

function readKinds(body: unknown): SemanticCatalogKind[] | null {
  if (!body || typeof body !== 'object') return DEFAULT_KINDS
  const raw = (body as { kinds?: unknown }).kinds
  if (raw == null) return DEFAULT_KINDS
  if (!Array.isArray(raw)) return null
  const kinds: SemanticCatalogKind[] = []
  const seen = new Set<SemanticCatalogKind>()
  for (const entry of raw) {
    if (entry !== 'learning-path' && entry !== 'university-course') continue
    if (seen.has(entry)) continue
    seen.add(entry)
    kinds.push(entry)
  }
  return kinds.length > 0 ? kinds : null
}

function formatVector(values: number[]): string {
  return `[${values.join(',')}]`
}

function cacheKeyFor(query: string, kinds: SemanticCatalogKind[]): string {
  return `${normalizeCatalogText(query)}|${kinds.slice().sort().join(',')}`
}

function getCachedMatches(cacheKey: string): SemanticCatalogMatch[] | null {
  const entry = searchCache.get(cacheKey)
  if (!entry) return null
  if (Date.now() >= entry.expiresAt) {
    searchCache.delete(cacheKey)
    return null
  }
  return entry.matches
}

function setCachedMatches(cacheKey: string, matches: SemanticCatalogMatch[]) {
  searchCache.set(cacheKey, {
    matches,
    expiresAt: Date.now() + CACHE_TTL_MS
  })
}

function readDistance(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? value
    : Number.POSITIVE_INFINITY
}

function pathRowsToRanked(rows: PathMatchRow[] | null): RankedMatch[] {
  if (!rows?.length) return []
  const matches: RankedMatch[] = []
  for (const row of rows) {
    const id = typeof row.path_id === 'string' ? row.path_id : ''
    const slug = typeof row.slug === 'string' ? row.slug : ''
    if (!id || !slug) continue
    matches.push({
      kind: 'learning-path',
      id,
      slug,
      distance: readDistance(row.distance)
    })
  }
  return matches
}

function notionRowsToRanked(rows: NotionMatchRow[] | null): RankedMatch[] {
  if (!rows?.length) return []
  const matches: RankedMatch[] = []
  for (const row of rows) {
    const id = typeof row.notion_page_id === 'string' ? row.notion_page_id : ''
    if (!id) continue
    matches.push({
      kind: 'university-course',
      id,
      distance: readDistance(row.distance)
    })
  }
  return matches
}

function interleaveByDistance(
  groups: RankedMatch[][],
  limit: number
): SemanticCatalogMatch[] {
  const merged = groups.flat().sort((a, b) => a.distance - b.distance)
  const out: SemanticCatalogMatch[] = []
  const seen = new Set<string>()
  for (const row of merged) {
    const key = `${row.kind}:${row.id}`
    if (seen.has(key)) continue
    seen.add(key)
    if (row.kind === 'learning-path') {
      out.push({ kind: 'learning-path', id: row.id, slug: row.slug })
    } else {
      out.push({ kind: 'university-course', id: row.id })
    }
    if (out.length >= limit) break
  }
  return out
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SearchSuccess | SearchError>
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const trimmed = readQuery(req.body)
  if (trimmed === null) {
    return res.status(400).json({ error: 'query must be a string' })
  }
  if (!trimmed) {
    return res.status(400).json({ error: 'query is required' })
  }

  const kinds = readKinds(req.body)
  if (!kinds) {
    return res.status(400).json({
      error:
        'kinds must be a non-empty array of learning-path and/or university-course'
    })
  }

  const query = trimmed.slice(0, QUERY_MAX_LENGTH)
  const cacheKey = cacheKeyFor(query, kinds)
  const cached = getCachedMatches(cacheKey)
  if (cached) {
    return res.status(200).json({ matches: cached })
  }

  const admin = getSupabaseAdmin()
  if (!admin) {
    console.error(
      'search-learning-paths: missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY'
    )
    return res.status(500).json({ error: 'Search is temporarily unavailable' })
  }

  let embedding: number[]
  try {
    embedding = await embedLearningPathQuery(query)
  } catch (error) {
    console.error('search-learning-paths: embedding failed', error)
    return res.status(500).json({ error: 'Search is temporarily unavailable' })
  }

  if (
    !Array.isArray(embedding) ||
    embedding.length !== LEARNING_PATH_EMBED_DIM ||
    !embedding.every(
      (value) => typeof value === 'number' && Number.isFinite(value)
    )
  ) {
    console.error(
      'search-learning-paths: unexpected embedding length',
      Array.isArray(embedding) ? embedding.length : typeof embedding
    )
    return res.status(500).json({ error: 'Search is temporarily unavailable' })
  }

  const queryEmbedding = formatVector(embedding)
  const wantPaths = kinds.includes('learning-path')
  const wantCourses = kinds.includes('university-course')
  const rankedGroups: RankedMatch[][] = []

  if (wantPaths) {
    const { data, error } = await admin.rpc('match_learning_path_embeddings', {
      query_embedding: queryEmbedding,
      match_count: MATCH_COUNT
    })
    if (error) {
      console.error(
        'search-learning-paths: path match RPC failed',
        error.message
      )
      return res
        .status(500)
        .json({ error: 'Search is temporarily unavailable' })
    }
    rankedGroups.push(pathRowsToRanked((data as PathMatchRow[] | null) ?? null))
  }

  if (wantCourses) {
    const { data, error } = await admin.rpc('match_notion_course_embeddings', {
      query_embedding: queryEmbedding,
      match_count: MATCH_COUNT
    })
    if (error) {
      console.error(
        'search-learning-paths: notion match RPC failed',
        error.message
      )
      return res
        .status(500)
        .json({ error: 'Search is temporarily unavailable' })
    }
    rankedGroups.push(
      notionRowsToRanked((data as NotionMatchRow[] | null) ?? null)
    )
  }

  const matches = interleaveByDistance(rankedGroups, MATCH_COUNT)
  setCachedMatches(cacheKey, matches)
  return res.status(200).json({ matches })
}
