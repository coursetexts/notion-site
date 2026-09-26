/**
 * Shared catalog synonyms for lexical extras and semantic query expansion.
 * Phrase keys match a normalized query substring; token keys match stemmed tokens.
 */

export const CATALOG_PHRASE_SYNONYMS: Record<string, string[]> = {
  'black scholes': [
    'option pricing',
    'options',
    'derivatives',
    'finance',
    'corporate finance'
  ],
  'option pricing': ['black scholes', 'options', 'derivatives', 'finance'],
  'creative writing': ['english', 'publishing', 'novel', 'literature'],
  'publish a book': ['publishing', 'english', 'novel', 'creative writing'],
  'corporate finance': ['finance', 'valuation', 'options', 'derivatives']
}

export const CATALOG_TOKEN_SYNONYMS: Record<string, string[]> = {
  transformer: [
    'attention',
    'language model',
    'nlp',
    'deep learning',
    'neural',
    'machine learning'
  ],
  nlp: ['language model', 'transformer', 'natural language'],
  llm: ['language model', 'transformer', 'deep learning'],
  english: [
    'literature',
    'creative writing',
    'publishing',
    'publish a book',
    'novel',
    'poetry'
  ],
  writing: ['creative writing', 'publishing', 'novel', 'literature'],
  publish: ['publishing', 'publish a book', 'novel'],
  book: ['publish a book', 'novel', 'literature'],
  novel: ['creative writing', 'publish a book', 'literature'],
  schole: ['option pricing', 'options', 'derivatives', 'finance'],
  finance: ['corporate finance', 'valuation', 'options', 'derivatives'],
  option: ['option pricing', 'derivatives', 'black scholes', 'finance'],
  derivative: ['options', 'option pricing', 'finance']
}

export function synonymsForNormalizedQuery(
  queryNorm: string,
  tokens: string[]
): string[] {
  const terms: string[] = []
  if (!queryNorm) return terms
  for (const [phrase, extras] of Object.entries(CATALOG_PHRASE_SYNONYMS)) {
    if (queryNorm.includes(phrase)) terms.push(...extras)
  }
  for (const token of tokens) {
    const extras = CATALOG_TOKEN_SYNONYMS[token]
    if (!extras) continue
    terms.push(...extras)
  }
  return terms
}
