/**
 * Goal-first catalog search: score a query across learning paths,
 * university courses, degree curricula, and research questions, then
 * surface the best match and group the rest by type.
 */

export const CATALOG_RESULT_KINDS = [
  'learning-path',
  'university-course',
  'degree',
  'research'
] as const

export type CatalogResultKind = (typeof CATALOG_RESULT_KINDS)[number]

export type CatalogHitStats = {
  concepts?: number
  resources?: number
  learners?: number
}

export type CatalogSearchItem = {
  id: string
  kind: CatalogResultKind
  href: string
  title: string
  description: string
  meta: string
  goal?: string
  extra?: string
  relatedTerms?: string[]
  stats?: CatalogHitStats
  communityMark?: boolean
  subjectDegreeId?: string
  subjects?: string[]
}

export type CatalogSearchHit = CatalogSearchItem & {
  score: number
  match: 'query' | 'related'
}

export type CatalogSearchGroup = {
  kind: CatalogResultKind
  label: string
  hits: CatalogSearchHit[]
}

export type GroupedCatalogSearch = {
  bestMatch: CatalogSearchHit | null
  groups: CatalogSearchGroup[]
}

const KIND_TIEBREAK: Record<CatalogResultKind, number> = {
  'learning-path': 0,
  'university-course': 1,
  degree: 2,
  research: 3
}

const GOAL_TOKENS = new Set([
  'implement',
  'learn',
  'build',
  'write',
  'play',
  'understand',
  'host',
  'speak',
  'cook',
  'create',
  'make'
])

const SCHOOL_TOKENS = new Set([
  'stanford',
  'harvard',
  'waterloo',
  'mit',
  'princeton',
  'yale',
  'columbia',
  'berkeley',
  'oxford',
  'cambridge'
])

/** Extra related terms for a few high-intent learning goals. */
const TOKEN_EXPANSIONS: Record<string, string[]> = {
  transformer: [
    'attention',
    'language model',
    'nlp',
    'deep learning',
    'neural',
    'machine learning'
  ],
  nlp: ['language model', 'transformer', 'natural language'],
  llm: ['language model', 'transformer', 'deep learning']
}

const QUERY_MATCH_PER_GROUP = 12
const RELATED_ONLY_PER_GROUP = 4

export function normalizeCatalogText(value: string): string {
  return value
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

export function stemCatalogToken(token: string): string {
  if (token.length <= 3) return token
  if (token.endsWith('ies') && token.length > 4) {
    return `${token.slice(0, -3)}y`
  }
  if (
    token.endsWith('ses') ||
    token.endsWith('xes') ||
    token.endsWith('zes') ||
    token.endsWith('ches') ||
    token.endsWith('shes')
  ) {
    return token.slice(0, -2)
  }
  if (token.endsWith('s') && !token.endsWith('ss') && token.length > 4) {
    return token.slice(0, -1)
  }
  return token
}

export function catalogTokens(value: string): string[] {
  return normalizeCatalogText(value)
    .split(/\s+/)
    .filter(Boolean)
    .map(stemCatalogToken)
}

function uniqueStrings(values: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const value of values) {
    const key = normalizeCatalogText(value)
    if (!key || seen.has(key)) continue
    seen.add(key)
    out.push(value)
  }
  return out
}

export function queryExpansionTerms(query: string): string[] {
  const terms: string[] = []
  for (const token of catalogTokens(query)) {
    const extras = TOKEN_EXPANSIONS[token]
    if (!extras) continue
    terms.push(...extras)
  }
  return uniqueStrings(terms)
}

function fieldScore(
  queryNorm: string,
  queryTokens: string[],
  field: string | undefined,
  weight: number
): number {
  if (!field || weight <= 0) return 0
  const fieldNorm = normalizeCatalogText(field)
  if (!fieldNorm) return 0
  if (fieldNorm === queryNorm) return weight * 4
  if (queryNorm.length >= 4 && fieldNorm.startsWith(queryNorm)) {
    return weight * 3
  }
  if (queryNorm.length >= 4 && fieldNorm.includes(queryNorm)) {
    return weight * 2.2
  }
  const fieldTokens = catalogTokens(field)
  if (fieldTokens.length === 0) return 0
  const fieldSet = new Set(fieldTokens)
  let overlap = 0
  for (const token of queryTokens) {
    if (fieldSet.has(token)) overlap += 1
  }
  if (overlap === 0) return 0
  if (overlap === queryTokens.length) return weight * 1.6
  return weight * (overlap / queryTokens.length)
}

function kindBoost(kind: CatalogResultKind, queryTokens: string[]): number {
  const hasGoalVerb = queryTokens.some((token) => GOAL_TOKENS.has(token))
  const hasSchool = queryTokens.some((token) => SCHOOL_TOKENS.has(token))
  if (hasSchool && kind === 'university-course') return 28
  if (hasGoalVerb && kind === 'learning-path') return 22
  if (kind === 'learning-path' && !hasSchool) return 8
  return 0
}

export function scoreCatalogItem(
  item: CatalogSearchItem,
  query: string
): number {
  const trimmed = query.trim()
  if (!trimmed) return 0
  const queryNorm = normalizeCatalogText(trimmed)
  const queryTokens = catalogTokens(trimmed)
  if (!queryNorm || queryTokens.length === 0) return 0

  const title = fieldScore(queryNorm, queryTokens, item.title, 100)
  const goal = fieldScore(queryNorm, queryTokens, item.goal, 70)
  const description = fieldScore(queryNorm, queryTokens, item.description, 28)
  const meta = fieldScore(queryNorm, queryTokens, item.meta, 18)
  const extra = fieldScore(queryNorm, queryTokens, item.extra, 14)
  const base = title + goal + description + meta + extra
  if (base <= 0) return 0
  return base + kindBoost(item.kind, queryTokens)
}

function relatedTermScore(item: CatalogSearchItem, terms: string[]): number {
  if (terms.length === 0) return 0
  const title = normalizeCatalogText(item.title)
  const haystacks = [
    title,
    normalizeCatalogText(item.goal || ''),
    normalizeCatalogText(item.meta || '')
  ].filter(Boolean)

  let best = 0
  for (const term of terms) {
    const normalized = normalizeCatalogText(term)
    if (!normalized) continue
    const shortGeneric =
      catalogTokens(term).length === 1 && normalized.length < 14
    for (const haystack of haystacks) {
      if (haystack === normalized) {
        best = Math.max(best, 48)
        continue
      }
      if (shortGeneric) continue
      if (
        haystack.includes(normalized) ||
        (normalized.length >= 8 && normalized.includes(haystack))
      ) {
        best = Math.max(best, 26)
      }
    }
  }
  return best
}

function compareHits(a: CatalogSearchHit, b: CatalogSearchHit): number {
  if (b.score !== a.score) return b.score - a.score
  const kindDelta = KIND_TIEBREAK[a.kind] - KIND_TIEBREAK[b.kind]
  if (kindDelta !== 0) return kindDelta
  return a.title.localeCompare(b.title, undefined, { sensitivity: 'base' })
}

export function catalogGroupLabel(
  kind: CatalogResultKind,
  hasQuery: boolean
): string {
  switch (kind) {
    case 'learning-path':
      return hasQuery ? 'Related learning paths' : 'Learning paths'
    case 'university-course':
      return 'University courses'
    case 'degree':
      return 'Degree curricula'
    case 'research':
      return hasQuery ? 'Relevant research questions' : 'Research questions'
  }
}

export function formatCatalogStats(stats: CatalogHitStats | undefined): string {
  if (!stats) return ''
  const parts: string[] = []
  if (stats.concepts && stats.concepts > 0) {
    parts.push(`${stats.concepts} concept${stats.concepts === 1 ? '' : 's'}`)
  }
  if (stats.resources && stats.resources > 0) {
    parts.push(`${stats.resources} resource${stats.resources === 1 ? '' : 's'}`)
  }
  if (stats.learners && stats.learners > 0) {
    parts.push(`${stats.learners} learner${stats.learners === 1 ? '' : 's'}`)
  }
  return parts.join(' · ')
}

export function searchCatalog(
  items: CatalogSearchItem[],
  query: string
): CatalogSearchHit[] {
  const trimmed = query.trim()
  if (!trimmed) return []

  const queryHits: CatalogSearchHit[] = []
  for (const item of items) {
    const score = scoreCatalogItem(item, trimmed)
    if (score <= 0) continue
    queryHits.push({ ...item, score, match: 'query' })
  }
  queryHits.sort(compareHits)

  const best = queryHits[0]
  const expansionTerms = queryExpansionTerms(trimmed)
  const relatedTerms = uniqueStrings([
    ...expansionTerms,
    ...(best?.relatedTerms ?? [])
  ])

  if (relatedTerms.length === 0) return queryHits

  const seen = new Set(queryHits.map((hit) => `${hit.kind}:${hit.id}`))
  const relatedHits: CatalogSearchHit[] = []
  for (const item of items) {
    const key = `${item.kind}:${item.id}`
    if (seen.has(key)) continue
    const score = relatedTermScore(item, relatedTerms)
    if (score <= 0) continue
    relatedHits.push({ ...item, score, match: 'related' })
  }
  relatedHits.sort(compareHits)

  return [...queryHits, ...relatedHits]
}

export function groupCatalogHits(
  hits: CatalogSearchHit[],
  hasQuery: boolean
): GroupedCatalogSearch {
  if (hits.length === 0) {
    return { bestMatch: null, groups: [] }
  }

  const bestMatch = hasQuery ? hits[0] : null
  const remaining = bestMatch ? hits.filter((hit) => hit !== bestMatch) : hits

  const groups: CatalogSearchGroup[] = []
  for (const kind of CATALOG_RESULT_KINDS) {
    const kindHits = remaining.filter((hit) => hit.kind === kind)
    if (kindHits.length === 0) continue
    const queryHits = kindHits.filter((hit) => hit.match === 'query')
    const relatedHits = kindHits.filter((hit) => hit.match === 'related')
    const capped = [
      ...queryHits.slice(0, QUERY_MATCH_PER_GROUP),
      ...relatedHits.slice(0, RELATED_ONLY_PER_GROUP)
    ]
    if (capped.length === 0) continue
    groups.push({
      kind,
      label: catalogGroupLabel(kind, hasQuery),
      hits: capped
    })
  }

  return { bestMatch, groups }
}
