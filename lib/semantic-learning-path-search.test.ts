import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import type {
  CatalogSearchHit,
  CatalogSearchItem,
  GroupedCatalogSearch
} from '@/lib/catalog-search'
import {
  bestLearningPathLexicalScore,
  bestLexicalScoreForKinds,
  cardMatchesSemanticResult,
  findCardForSemanticMatch,
  isSemanticCatalogMatch,
  mergeSemanticCatalogSearch,
  mergeSemanticLearningPathSearch,
  normalizeSemanticCatalogMatch,
  orderCardsBySemanticMatches,
  shouldApplySemanticResponse,
  shouldRequestSemanticLearningPaths
} from '@/lib/semantic-learning-path-search'

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

function hit(item: CatalogSearchItem, score: number): CatalogSearchHit {
  return { ...item, score, match: 'query' }
}

describe('shouldRequestSemanticLearningPaths', () => {
  it('skips short queries', () => {
    assert.equal(shouldRequestSemanticLearningPaths('ab'), false)
    assert.equal(shouldRequestSemanticLearningPaths('  x  '), false)
  })

  it('requests semantic even when lexical scores are strong', () => {
    assert.equal(shouldRequestSemanticLearningPaths('transformers'), true)
    assert.equal(shouldRequestSemanticLearningPaths('cryptography'), true)
  })

  it('allows weak lexical queries of length >= 3', () => {
    assert.equal(shouldRequestSemanticLearningPaths('make a chatbot'), true)
    assert.equal(shouldRequestSemanticLearningPaths('nlp'), true)
  })
})

describe('bestLearningPathLexicalScore', () => {
  it('uses only learning-path items', () => {
    const items: CatalogSearchItem[] = [
      pathItem({ id: 'a', title: 'Unrelated baking' }),
      {
        id: 'deg',
        kind: 'degree',
        href: '/degrees/cs',
        title: 'make a chatbot',
        description: '',
        meta: ''
      },
      pathItem({ id: 'b', title: 'Transformers' })
    ]
    const score = bestLearningPathLexicalScore(items, 'transformers')
    assert.ok(score >= 80)
  })
})

describe('card matching', () => {
  it('matches by id or href slug', () => {
    const byId = { id: 'uuid-1', href: '/paths/learning-path/transformers' }
    const bySlug = {
      id: 'transformers',
      href: '/paths/learning-path/transformers'
    }
    assert.equal(
      cardMatchesSemanticResult(byId, { id: 'uuid-1', slug: 'other' }),
      true
    )
    assert.equal(
      cardMatchesSemanticResult(bySlug, {
        id: 'different-uuid',
        slug: 'transformers'
      }),
      true
    )
    assert.equal(
      cardMatchesSemanticResult(bySlug, {
        id: 'missing',
        slug: 'not-loaded'
      }),
      false
    )
  })

  it('finds the first matching loaded card', () => {
    const cards = [
      { id: 'a', href: '/paths/learning-path/a' },
      { id: 'uuid-t', href: '/paths/learning-path/transformers' }
    ]
    const found = findCardForSemanticMatch(
      { id: 'uuid-t', slug: 'transformers' },
      cards
    )
    assert.equal(found?.id, 'uuid-t')
  })
})

describe('shouldApplySemanticResponse', () => {
  it('ignores stale responses from older requests', () => {
    assert.equal(shouldApplySemanticResponse(1, 2), false)
    assert.equal(shouldApplySemanticResponse(2, 2), true)
  })
})

describe('orderCardsBySemanticMatches', () => {
  it('ranks matching cards first in API order and keeps the rest', () => {
    const cards = [
      { id: 'bakery', href: '/paths/learning-path/bakery' },
      { id: 'uuid-t', href: '/paths/learning-path/transformers' },
      { id: 'guitar', href: '/paths/learning-path/guitar' }
    ]
    const ordered = orderCardsBySemanticMatches(cards, [
      { id: 'uuid-t', slug: 'transformers' },
      { id: 'missing', slug: 'not-on-page' },
      { id: 'guitar', slug: 'guitar' }
    ])
    assert.deepEqual(
      ordered.map((card) => card.id),
      ['uuid-t', 'guitar', 'bakery']
    )
  })
})

describe('mergeSemanticLearningPathSearch', () => {
  const transformers = pathItem({
    id: 'uuid-t',
    title: 'Transformers',
    href: '/paths/learning-path/transformers'
  })
  const bakery = pathItem({
    id: 'bakery',
    title: 'Start a bakery',
    href: '/paths/learning-path/bakery'
  })
  const degree: CatalogSearchHit = hit(
    {
      id: 'cs',
      kind: 'degree',
      href: '/degrees/cs',
      title: 'Computer Science',
      description: '',
      meta: ''
    },
    200
  )

  const resolve = (match: { id: string; slug: string }) => {
    if (match.id === transformers.id || match.slug === 'transformers') {
      return transformers
    }
    if (match.id === bakery.id || match.slug === 'bakery') return bakery
    return null
  }

  it('puts semantic path hits first and removes duplicates', () => {
    const lexical: GroupedCatalogSearch = {
      bestMatch: hit(bakery, 20),
      groups: [
        {
          kind: 'learning-path',
          label: 'Related learning paths',
          hits: [hit(transformers, 10)]
        }
      ]
    }

    const merged = mergeSemanticLearningPathSearch(
      lexical,
      [
        { id: 'uuid-t', slug: 'transformers' },
        { id: 'bakery', slug: 'bakery' }
      ],
      resolve
    )

    assert.equal(merged.bestMatch?.id, 'uuid-t')
    const pathHits = merged.groups.find((g) => g.kind === 'learning-path')?.hits
    assert.ok(pathHits)
    assert.deepEqual(
      pathHits.map((h) => h.id),
      ['bakery']
    )
  })

  it('does not replace a stronger non-path bestMatch', () => {
    const lexical: GroupedCatalogSearch = {
      bestMatch: degree,
      groups: [
        {
          kind: 'learning-path',
          label: 'Related learning paths',
          hits: [hit(bakery, 10)]
        },
        {
          kind: 'degree',
          label: 'Degree curricula',
          hits: []
        }
      ]
    }

    const merged = mergeSemanticLearningPathSearch(
      lexical,
      [{ id: 'uuid-t', slug: 'transformers' }],
      resolve
    )

    assert.equal(merged.bestMatch?.kind, 'degree')
    assert.equal(merged.bestMatch?.id, 'cs')
    const pathHits = merged.groups.find((g) => g.kind === 'learning-path')?.hits
    assert.deepEqual(
      pathHits?.map((h) => h.id),
      ['uuid-t', 'bakery']
    )
  })

  it('leaves lexical results unchanged when no loaded cards match', () => {
    const lexical: GroupedCatalogSearch = {
      bestMatch: hit(bakery, 20),
      groups: [
        {
          kind: 'learning-path',
          label: 'Related learning paths',
          hits: []
        }
      ]
    }
    const merged = mergeSemanticLearningPathSearch(
      lexical,
      [{ id: 'missing', slug: 'not-loaded' }],
      () => null
    )
    assert.equal(merged.bestMatch?.id, 'bakery')
    assert.equal(merged, lexical)
  })

  it('leaves lexical results unchanged when semantic matches are empty', () => {
    const lexical: GroupedCatalogSearch = {
      bestMatch: hit(bakery, 20),
      groups: [
        {
          kind: 'learning-path',
          label: 'Related learning paths',
          hits: []
        }
      ]
    }
    const merged = mergeSemanticLearningPathSearch(lexical, [], resolve)
    assert.equal(merged, lexical)
  })
})

describe('bestLexicalScoreForKinds', () => {
  it('scores only the requested kinds', () => {
    const items: CatalogSearchItem[] = [
      pathItem({ id: 'a', title: 'Unrelated baking' }),
      {
        id: 'cs224n',
        kind: 'university-course',
        href: '/course/cs224n',
        title: 'Natural Language Processing',
        description: '',
        meta: 'Stanford'
      }
    ]
    const courseScore = bestLexicalScoreForKinds(items, 'natural language', [
      'university-course'
    ])
    const pathScore = bestLexicalScoreForKinds(items, 'natural language', [
      'learning-path'
    ])
    assert.ok(courseScore >= 80)
    assert.equal(pathScore, 0)
  })
})

describe('mergeSemanticCatalogSearch', () => {
  const transformers = pathItem({
    id: 'uuid-t',
    title: 'Transformers',
    href: '/paths/learning-path/transformers'
  })
  const nlpCourse: CatalogSearchItem = {
    id: 'notion-nlp',
    kind: 'university-course',
    href: '/course/notion-nlp',
    title: 'NLP with Deep Learning',
    description: '',
    meta: 'Stanford'
  }

  it('merges path and university-course groups from mixed matches', () => {
    const lexical: GroupedCatalogSearch = {
      bestMatch: hit(
        {
          id: 'bakery',
          kind: 'learning-path',
          href: '/paths/learning-path/bakery',
          title: 'Start a bakery',
          description: '',
          meta: ''
        },
        10
      ),
      groups: [
        {
          kind: 'university-course',
          label: 'University courses',
          hits: [hit(nlpCourse, 5)]
        }
      ]
    }

    const merged = mergeSemanticCatalogSearch(
      lexical,
      [
        { kind: 'university-course', id: 'notion-nlp' },
        { kind: 'learning-path', id: 'uuid-t', slug: 'transformers' }
      ],
      (match) => {
        if (match.kind === 'university-course' && match.id === nlpCourse.id) {
          return nlpCourse
        }
        if (match.id === transformers.id || match.slug === 'transformers') {
          return transformers
        }
        return null
      }
    )

    assert.equal(merged.bestMatch?.id, 'notion-nlp')
    assert.equal(merged.bestMatch?.kind, 'university-course')
    const pathHits = merged.groups.find((g) => g.kind === 'learning-path')?.hits
    assert.deepEqual(
      pathHits?.map((h) => h.id),
      ['uuid-t', 'bakery']
    )
    assert.equal(
      merged.groups.find((g) => g.kind === 'university-course'),
      undefined
    )
  })
})

describe('isSemanticCatalogMatch / normalizeSemanticCatalogMatch', () => {
  it('accepts typed matches and legacy path matches', () => {
    assert.equal(
      isSemanticCatalogMatch({
        kind: 'university-course',
        id: 'abc'
      }),
      true
    )
    assert.equal(
      isSemanticCatalogMatch({ id: 'uuid', slug: 'transformers' }),
      true
    )
    assert.equal(isSemanticCatalogMatch({ id: 'uuid' }), false)
    assert.deepEqual(
      normalizeSemanticCatalogMatch({
        kind: 'university-course',
        id: 'abc'
      }),
      { kind: 'university-course', id: 'abc' }
    )
    assert.deepEqual(
      normalizeSemanticCatalogMatch({ id: 'uuid', slug: 'transformers' }),
      { kind: 'learning-path', id: 'uuid', slug: 'transformers' }
    )
  })
})
