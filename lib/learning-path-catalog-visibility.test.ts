import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  isCatalogVisibleLearningPath,
  isLearningPathPrivateOrHidden
} from '@/lib/learning-path-catalog-visibility'
import { learningPathEmbeddingText } from '@/lib/learning-path-embedding-text'

describe('isLearningPathPrivateOrHidden', () => {
  it('treats private and legacy is_private as hidden', () => {
    assert.equal(isLearningPathPrivateOrHidden({ visibility: 'private' }), true)
    assert.equal(
      isLearningPathPrivateOrHidden({
        visibility: null,
        is_private: true
      }),
      true
    )
    assert.equal(isLearningPathPrivateOrHidden({ visibility: 'public' }), false)
    assert.equal(
      isLearningPathPrivateOrHidden({ visibility: 'collaborative' }),
      false
    )
  })
})

describe('isCatalogVisibleLearningPath', () => {
  it('allows public paths regardless of subtype/tag/kind', () => {
    for (const kind of [
      'community',
      'research',
      'goal',
      'academic',
      'official-course',
      'something-new'
    ]) {
      assert.equal(
        isCatalogVisibleLearningPath({
          kind,
          visibility: 'public',
          is_filled: false
        }),
        true,
        kind
      )
    }
  })

  it('allows collaborative paths of any kind', () => {
    assert.equal(
      isCatalogVisibleLearningPath({
        kind: 'research',
        visibility: 'collaborative'
      }),
      true
    )
  })

  it('allows filled course paths and rejects unfilled course stubs', () => {
    assert.equal(
      isCatalogVisibleLearningPath({
        kind: 'course',
        visibility: 'public',
        is_filled: true
      }),
      true
    )
    assert.equal(
      isCatalogVisibleLearningPath({
        kind: 'course',
        visibility: 'public',
        is_filled: false
      }),
      false
    )
  })

  it('rejects private paths even when kind would otherwise qualify', () => {
    assert.equal(
      isCatalogVisibleLearningPath({
        kind: 'community',
        visibility: 'private',
        is_filled: true
      }),
      false
    )
    assert.equal(
      isCatalogVisibleLearningPath({
        kind: 'course',
        visibility: 'private',
        is_filled: true
      }),
      false
    )
  })

  it('does not drop a catalog-visible path when only the kind/tag changes', () => {
    const base = {
      visibility: 'public' as const,
      is_private: false,
      is_filled: false
    }
    assert.equal(
      isCatalogVisibleLearningPath({ ...base, kind: 'community' }),
      true
    )
    assert.equal(
      isCatalogVisibleLearningPath({ ...base, kind: 'academic' }),
      true
    )
    assert.equal(isCatalogVisibleLearningPath({ ...base, kind: 'goal' }), true)
  })

  it('treats leaving the public catalog as ineligible (embedding should be deleted)', () => {
    assert.equal(
      isCatalogVisibleLearningPath({
        kind: 'community',
        visibility: 'public'
      }),
      true
    )
    assert.equal(
      isCatalogVisibleLearningPath({
        kind: 'community',
        visibility: 'private'
      }),
      false
    )
  })
})

describe('learningPathEmbeddingText', () => {
  it('builds goal-style text for generic learning paths', () => {
    const text = learningPathEmbeddingText({
      kind: 'community',
      title: 'Transformers',
      goal: 'Implement a transformer',
      summary: 'Attention and training',
      data: {
        title: 'Transformers',
        goal: 'Implement a transformer',
        summary: 'Attention and training',
        nodes: [
          { kind: 'goal', label: 'Implement a transformer' },
          { kind: 'concept', label: 'Attention' },
          { kind: 'concept', label: '' },
          { kind: 'milestone', label: 'Train a tiny model' }
        ]
      }
    })
    assert.equal(
      text,
      'Transformers. Implement a transformer. Attention and training. Topics: Attention, Train a tiny model'
    )
  })

  it('builds course-style text for course syllabi', () => {
    const text = learningPathEmbeddingText({
      kind: 'course',
      title: 'Linear Algebra',
      summary: 'Vectors and matrices',
      data: {
        slug: 'linear-algebra',
        title: 'Linear Algebra',
        description: 'Vectors and matrices',
        topics: [
          {
            id: 't1',
            type: 'topic',
            title: 'Systems',
            children: [
              {
                id: 'c1',
                type: 'concept',
                title: 'Echelon form',
                topicResources: [
                  { id: 'r1', kind: 'video', title: 'Skip me', position: 1 }
                ]
              }
            ]
          }
        ]
      }
    })
    assert.equal(
      text,
      'Linear Algebra. Vectors and matrices. Topics: Systems, Echelon form'
    )
    assert.equal(text.includes('Skip me'), false)
  })
})
