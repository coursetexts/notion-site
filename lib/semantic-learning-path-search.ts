/**
 * Client-side merge helpers for semantic catalog search (learning paths +
 * Notion university courses). Pure functions only — safe to unit test.
 */
import {
  CATALOG_RESULT_KINDS,
  type CatalogResultKind,
  type CatalogSearchHit,
  type CatalogSearchItem,
  type GroupedCatalogSearch,
  catalogGroupLabel,
  scoreCatalogItem
} from '@/lib/catalog-search'

export const SEMANTIC_PATH_SCORE_THRESHOLD = 80
export const SEMANTIC_SEARCH_MIN_QUERY_LENGTH = 3
export const SEMANTIC_SEARCH_DEBOUNCE_MS = 300

export type SemanticCatalogKind = 'learning-path' | 'university-course'

export type SemanticCatalogMatch = {
  kind: SemanticCatalogKind
  id: string
  slug?: string
}

/** @deprecated Prefer SemanticCatalogMatch with kind. */
export type SemanticLearningPathMatch = {
  id: string
  slug: string
  kind?: 'learning-path'
}

export type SemanticCardLike = {
  id: string
  href: string
}

export function learningPathHrefSlug(href: string, fallbackId = ''): string {
  return href.split('/').filter(Boolean).pop() || fallbackId
}

export function bestLexicalScoreForKinds(
  items: CatalogSearchItem[],
  query: string,
  kinds: CatalogResultKind[]
): number {
  const kindSet = new Set(kinds)
  let best = 0
  for (const item of items) {
    if (!kindSet.has(item.kind)) continue
    const score = scoreCatalogItem(item, query)
    if (score > best) best = score
  }
  return best
}

export function bestLearningPathLexicalScore(
  items: CatalogSearchItem[],
  query: string
): number {
  return bestLexicalScoreForKinds(items, query, ['learning-path'])
}

export function shouldRequestSemanticSearch(trimmedQuery: string): boolean {
  return trimmedQuery.trim().length >= SEMANTIC_SEARCH_MIN_QUERY_LENGTH
}

/** @deprecated Prefer shouldRequestSemanticSearch. */
export function shouldRequestSemanticLearningPaths(
  trimmedQuery: string
): boolean {
  return shouldRequestSemanticSearch(trimmedQuery)
}

function matchSlug(
  match: SemanticCatalogMatch | SemanticLearningPathMatch
): string {
  return typeof match.slug === 'string' ? match.slug : ''
}

export function cardMatchesSemanticResult(
  card: SemanticCardLike,
  match: SemanticCatalogMatch | SemanticLearningPathMatch
): boolean {
  if (card.id === match.id) return true
  const slug = matchSlug(match)
  if (!slug) return false
  return learningPathHrefSlug(card.href, card.id) === slug
}

export function findCardForSemanticMatch<T extends SemanticCardLike>(
  match: SemanticCatalogMatch | SemanticLearningPathMatch,
  cards: T[]
): T | null {
  for (const card of cards) {
    if (cardMatchesSemanticResult(card, match)) return card
  }
  return null
}

export function shouldApplySemanticResponse(
  requestId: number,
  latestRequestId: number
): boolean {
  return requestId === latestRequestId
}

/**
 * Put cards that appear in semantic matches first (API order).
 * Unmatched cards keep their relative order afterward.
 */
export function orderCardsBySemanticMatches<T extends SemanticCardLike>(
  cards: T[],
  matches: Array<SemanticCatalogMatch | SemanticLearningPathMatch>
): T[] {
  if (matches.length === 0 || cards.length === 0) return cards

  const remaining = [...cards]
  const ranked: T[] = []
  const used = new Set<string>()

  for (const match of matches) {
    const index = remaining.findIndex(
      (card) => !used.has(card.id) && cardMatchesSemanticResult(card, match)
    )
    if (index < 0) continue
    const [card] = remaining.splice(index, 1)
    used.add(card.id)
    ranked.push(card)
  }

  return [...ranked, ...remaining]
}

function isPromotableSemanticKind(
  kind: CatalogResultKind | undefined
): kind is SemanticCatalogKind {
  return kind === 'learning-path' || kind === 'university-course'
}

function mergeKindHits(params: {
  kind: SemanticCatalogKind
  lexical: GroupedCatalogSearch
  semanticHits: CatalogSearchHit[]
  bestMatch: CatalogSearchHit | null
  promoteSemanticBest: boolean
}): CatalogSearchHit[] {
  const { kind, lexical, semanticHits, bestMatch, promoteSemanticBest } = params
  const lexicalGroup = lexical.groups.find((group) => group.kind === kind)
  const usedIds = new Set<string>()
  if (bestMatch?.kind === kind) {
    usedIds.add(bestMatch.id)
  }

  const merged: CatalogSearchHit[] = []
  for (const hit of semanticHits) {
    if (hit.kind !== kind) continue
    if (usedIds.has(hit.id)) continue
    usedIds.add(hit.id)
    merged.push(hit)
  }

  if (
    promoteSemanticBest &&
    lexical.bestMatch &&
    lexical.bestMatch.kind === kind &&
    !usedIds.has(lexical.bestMatch.id)
  ) {
    usedIds.add(lexical.bestMatch.id)
    merged.push(lexical.bestMatch)
  }

  for (const hit of lexicalGroup?.hits ?? []) {
    if (usedIds.has(hit.id)) continue
    usedIds.add(hit.id)
    merged.push(hit)
  }

  return merged
}

/**
 * Merge semantic learning-path + university-course matches into a lexical
 * grouped result. Degree / research groups stay lexical-only.
 */
export function mergeSemanticCatalogSearch(
  lexical: GroupedCatalogSearch,
  semanticMatches: Array<SemanticCatalogMatch | SemanticLearningPathMatch>,
  resolveItem: (
    match: SemanticCatalogMatch | SemanticLearningPathMatch
  ) => CatalogSearchItem | null,
  options?: { promotableKinds?: SemanticCatalogKind[] }
): GroupedCatalogSearch {
  const promotableKinds = new Set<SemanticCatalogKind>(
    options?.promotableKinds ?? ['learning-path', 'university-course']
  )
  const semanticHits: CatalogSearchHit[] = []
  const seenSemanticIds = new Set<string>()

  for (const match of semanticMatches) {
    const item = resolveItem(match)
    if (!item || !isPromotableSemanticKind(item.kind)) continue
    if (!promotableKinds.has(item.kind)) continue
    if (seenSemanticIds.has(item.id)) continue
    seenSemanticIds.add(item.id)
    semanticHits.push({
      ...item,
      score: SEMANTIC_PATH_SCORE_THRESHOLD,
      match: 'query'
    })
  }

  if (semanticHits.length === 0) return lexical

  let bestMatch = lexical.bestMatch
  let semanticForGroups = semanticHits

  const promoteSemanticBest =
    !bestMatch ||
    (isPromotableSemanticKind(bestMatch.kind) &&
      promotableKinds.has(bestMatch.kind) &&
      bestMatch.score < SEMANTIC_PATH_SCORE_THRESHOLD)

  if (promoteSemanticBest) {
    bestMatch = semanticHits[0]
    semanticForGroups = semanticHits.slice(1)
  }

  const mergedPathHits = mergeKindHits({
    kind: 'learning-path',
    lexical,
    semanticHits: semanticForGroups,
    bestMatch,
    promoteSemanticBest
  })
  const mergedCourseHits = mergeKindHits({
    kind: 'university-course',
    lexical,
    semanticHits: semanticForGroups,
    bestMatch,
    promoteSemanticBest
  })

  const groups = []
  for (const kind of CATALOG_RESULT_KINDS) {
    if (kind === 'learning-path') {
      if (mergedPathHits.length > 0) {
        groups.push({
          kind,
          label: catalogGroupLabel(kind, true),
          hits: mergedPathHits
        })
      }
      continue
    }
    if (kind === 'university-course') {
      if (mergedCourseHits.length > 0) {
        groups.push({
          kind,
          label: catalogGroupLabel(kind, true),
          hits: mergedCourseHits
        })
      }
      continue
    }
    const group = lexical.groups.find((entry) => entry.kind === kind)
    if (group) groups.push(group)
  }

  return { bestMatch, groups }
}

/**
 * Merge semantic learning-path matches into a lexical grouped result.
 * University-course / degree / research groups are left alone unless they
 * appear in matches (prefer mergeSemanticCatalogSearch for mixed kinds).
 */
export function mergeSemanticLearningPathSearch(
  lexical: GroupedCatalogSearch,
  semanticMatches: Array<SemanticCatalogMatch | SemanticLearningPathMatch>,
  resolveItem: (
    match: SemanticCatalogMatch | SemanticLearningPathMatch
  ) => CatalogSearchItem | null
): GroupedCatalogSearch {
  const pathOnly = semanticMatches.map((match) => ({
    ...match,
    kind: 'learning-path' as const
  }))
  return mergeSemanticCatalogSearch(
    lexical,
    pathOnly,
    (match) => {
      const item = resolveItem(match)
      if (!item || item.kind !== 'learning-path') return null
      return item
    },
    { promotableKinds: ['learning-path'] }
  )
}

export function isSemanticCatalogMatch(
  value: unknown
): value is SemanticCatalogMatch {
  if (!value || typeof value !== 'object') return false
  const row = value as { kind?: unknown; id?: unknown; slug?: unknown }
  if (typeof row.id !== 'string' || !row.id) return false
  if (row.kind === 'university-course') return true
  if (row.kind === 'learning-path') {
    return typeof row.slug === 'string' && Boolean(row.slug)
  }
  // Legacy response without kind: treat as learning-path when slug present.
  if (row.kind == null && typeof row.slug === 'string' && row.slug) {
    return true
  }
  return false
}

export function normalizeSemanticCatalogMatch(
  value: SemanticCatalogMatch | SemanticLearningPathMatch
): SemanticCatalogMatch {
  if (value.kind === 'university-course') {
    return { kind: 'university-course', id: value.id }
  }
  return {
    kind: 'learning-path',
    id: value.id,
    slug: matchSlug(value)
  }
}
