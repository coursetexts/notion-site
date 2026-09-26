/**
 * Index-time related search phrases (Gemini) and how they join embed text.
 * Safe for tests and the client — no Gemini or embedder imports.
 */
import { createHash } from 'crypto'

export const CATALOG_RELATED_TERMS_VERSION = 'v1'
export const CATALOG_RELATED_TERMS_MAX = 15
export const CATALOG_RELATED_TERM_MAX_CHARS = 48

export type CatalogRelatedTermKind = 'learning-path' | 'university-course'

export const CATALOG_RELATED_TERMS_SYSTEM_PROMPT = [
  'You write search aliases for the Coursetexts learning catalog.',
  'Given one catalog item, list short phrases a learner might type to find it.',
  'Include subject words, synonyms, and well-known names (formulas, methods, genres) that are clearly implied.',
  'Do not invent unrelated fields. Do not list resource titles, URLs, or author names unless they are in the item text.',
  'Do not repeat the exact title more than once.',
  'Return JSON only: { "terms": ["phrase", ...] } with 10 to 15 phrases.',
  'Each phrase is at most a few words.'
].join('\n')

export const CATALOG_RELATED_TERMS_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    terms: {
      type: 'array',
      items: { type: 'string' }
    }
  },
  required: ['terms']
}

export function sanitizeCatalogRelatedTerms(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  const seen = new Set<string>()
  const out: string[] = []
  for (const entry of raw) {
    if (typeof entry !== 'string') continue
    const term = entry.replace(/\s+/g, ' ').trim()
    if (!term || term.length > CATALOG_RELATED_TERM_MAX_CHARS) continue
    const key = term.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(term)
    if (out.length >= CATALOG_RELATED_TERMS_MAX) break
  }
  return out
}

export function parseCatalogRelatedTermsResponse(value: unknown): string[] {
  if (!value || typeof value !== 'object') return []
  return sanitizeCatalogRelatedTerms((value as { terms?: unknown }).terms)
}

export function catalogRelatedTermsSourceHash(sourceText: string): string {
  return createHash('sha256')
    .update(`${CATALOG_RELATED_TERMS_VERSION}\n${sourceText}`)
    .digest('hex')
}

export function appendRelatedTermsToEmbeddingText(
  baseText: string,
  terms: string[] | undefined,
  maxChars = 2400
): string {
  const related = sanitizeCatalogRelatedTerms(terms)
  if (related.length === 0) {
    if (baseText.length <= maxChars) return baseText
    return `${baseText.slice(0, maxChars - 1).trimEnd()}…`
  }
  const suffix = ` Related: ${related.join(', ')}`
  const budget = Math.max(32, maxChars - suffix.length)
  const head =
    baseText.length <= budget
      ? baseText
      : `${baseText.slice(0, budget - 1).trimEnd()}…`
  return `${head}${suffix}`
}

export function buildCatalogRelatedTermsUserPrompt(input: {
  kind: CatalogRelatedTermKind
  title: string
  text: string
}): string {
  const kindLabel =
    input.kind === 'university-course'
      ? 'Notion university course'
      : 'Learning path'
  return [
    `Kind: ${kindLabel}`,
    `Title: ${input.title.trim() || '(untitled)'}`,
    '',
    'Catalog text:',
    input.text.trim() || '(empty)'
  ].join('\n')
}
