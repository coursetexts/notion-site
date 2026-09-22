import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { notionCourseEmbeddingText } from '@/lib/notion-course-embedding-text'

describe('notionCourseEmbeddingText', () => {
  it('formats title, description, meta, and subjects', () => {
    assert.equal(
      notionCourseEmbeddingText({
        title: 'CS224n',
        description: 'Natural language processing with deep learning',
        meta: 'Stanford · Winter 2024',
        subjects: ['Science', 'Math']
      }),
      'CS224n. Natural language processing with deep learning. Stanford · Winter 2024. Topics: Science, Math'
    )
  })

  it('trims empty fields and drops blank subjects', () => {
    assert.equal(
      notionCourseEmbeddingText({
        title: '  Intro  ',
        description: null,
        meta: undefined,
        subjects: ['', ' English ', null as unknown as string]
      }),
      'Intro. . . Topics: English'
    )
  })
})
