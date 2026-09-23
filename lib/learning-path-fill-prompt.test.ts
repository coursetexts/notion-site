import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { buildLearningPathFillUserPrompt } from '@/lib/learning-path-fill'

describe('buildLearningPathFillUserPrompt', () => {
  it('keeps the original prompt when there are no change notes', () => {
    const prompt = buildLearningPathFillUserPrompt('Learn pottery')
    assert.match(prompt, /Learn pottery/)
    assert.equal(prompt.includes('What they want changed'), false)
    assert.equal(prompt.includes('Current path'), false)
  })

  it('adds the current path and the requested changes', () => {
    const prompt = buildLearningPathFillUserPrompt('Learn pottery', {
      changes: 'Drop the history step and add more studio practice.',
      currentOutline: '1 History of clay\n2 Throwing on the wheel'
    })
    assert.match(prompt, /Learn pottery/)
    assert.match(prompt, /Current path:\n1 History of clay/)
    assert.match(
      prompt,
      /What they want changed:\nDrop the history step and add more studio practice\./
    )
  })
})
