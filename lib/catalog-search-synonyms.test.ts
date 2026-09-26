import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  type CatalogSearchItem,
  expandCatalogQueryForEmbedding,
  queryExpansionTerms,
  scoreCatalogItem
} from '@/lib/catalog-search'

function pathItem(
  partial: Partial<CatalogSearchItem> & Pick<CatalogSearchItem, 'id' | 'title'>
): CatalogSearchItem {
  return {
    kind: 'learning-path',
    href: `/paths/learning-path/${partial.id}`,
    description: '',
    meta: 'Coursetexts · Path',
    ...partial
  }
}

describe('queryExpansionTerms', () => {
  it('expands english toward publishing and writing', () => {
    const terms = queryExpansionTerms('english')
    assert.ok(terms.includes('publish a book'))
    assert.ok(terms.includes('creative writing'))
    assert.ok(terms.includes('literature'))
  })

  it('expands black scholes toward options and finance', () => {
    const terms = queryExpansionTerms('black scholes')
    assert.ok(terms.includes('option pricing'))
    assert.ok(terms.includes('corporate finance'))
    assert.ok(terms.includes('finance'))
  })

  it('keeps transformer expansions', () => {
    const terms = queryExpansionTerms('transformer')
    assert.ok(terms.includes('attention'))
    assert.ok(terms.includes('language model'))
  })
})

describe('expandCatalogQueryForEmbedding', () => {
  it('appends synonym phrases to the original query', () => {
    const expanded = expandCatalogQueryForEmbedding('english')
    assert.match(expanded, /^english /)
    assert.match(expanded, /publish a book/)
  })

  it('returns the trimmed query when there are no synonyms', () => {
    assert.equal(expandCatalogQueryForEmbedding('  xylophone  '), 'xylophone')
  })
})

describe('scoreCatalogItem synonyms', () => {
  it('scores a publishing path for the query english', () => {
    const score = scoreCatalogItem(
      pathItem({
        id: 'publish',
        title: 'How to publish a book in New York',
        description: 'Agents, manuscripts, and getting a debut novel out'
      }),
      'english'
    )
    assert.ok(score > 0)
  })

  it('scores a finance syllabus for the query black scholes', () => {
    const score = scoreCatalogItem(
      pathItem({
        id: 'corp-fin',
        title: 'Corporate Finance',
        description: 'Valuation, capital structure, and options'
      }),
      'black scholes'
    )
    assert.ok(score > 0)
  })
})
