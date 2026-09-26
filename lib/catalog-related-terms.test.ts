import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  appendRelatedTermsToEmbeddingText,
  parseCatalogRelatedTermsResponse,
  sanitizeCatalogRelatedTerms
} from '@/lib/catalog-related-terms'
import { learningPathEmbeddingText } from '@/lib/learning-path-embedding-text'
import { notionCourseEmbeddingText } from '@/lib/notion-course-embedding-text'

describe('sanitizeCatalogRelatedTerms', () => {
  it('trims, drops blanks, and caps the list', () => {
    assert.deepEqual(
      sanitizeCatalogRelatedTerms([
        '  English  ',
        '',
        'english',
        'publish a book',
        12,
        'x'.repeat(80)
      ]),
      ['English', 'publish a book']
    )
  })
})

describe('parseCatalogRelatedTermsResponse', () => {
  it('reads a terms array from JSON', () => {
    assert.deepEqual(
      parseCatalogRelatedTermsResponse({
        terms: ['option pricing', 'corporate finance']
      }),
      ['option pricing', 'corporate finance']
    )
  })
})

describe('appendRelatedTermsToEmbeddingText', () => {
  it('appends a Related suffix', () => {
    assert.equal(
      appendRelatedTermsToEmbeddingText('Title. Summary.', ['english', 'novel']),
      'Title. Summary. Related: english, novel'
    )
  })
})

describe('embedding text with related terms', () => {
  it('keeps path text unchanged when no terms are passed', () => {
    const text = learningPathEmbeddingText({
      kind: 'community',
      title: 'Transformers',
      goal: 'Implement a transformer',
      summary: 'Attention',
      data: {
        title: 'Transformers',
        goal: 'Implement a transformer',
        summary: 'Attention',
        nodes: [{ kind: 'concept', label: 'Attention' }]
      }
    })
    assert.equal(
      text,
      'Transformers. Implement a transformer. Attention. Topics: Attention'
    )
  })

  it('adds related terms to a Notion course string', () => {
    const text = notionCourseEmbeddingText(
      {
        title: 'CS224n',
        description: 'NLP',
        meta: 'Stanford',
        subjects: ['Science']
      },
      ['transformers', 'deep learning']
    )
    assert.match(text, /Related: transformers, deep learning/)
  })
})
