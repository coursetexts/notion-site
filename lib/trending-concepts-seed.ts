/** Dummy trending concepts. Replace when concept popularity is wired up. */

export type TrendingConcept = {
  id: string
  label: string
  blurb: string
  pathTitle: string
  pathSlug: string
  onPaths: number
  exploring: number
}

export const TRENDING_CONCEPTS: TrendingConcept[] = [
  {
    id: 'attention',
    label: 'Attention',
    blurb:
      'How tokens look at each other — the mechanism that makes a transformer a transformer.',
    pathTitle: 'Implement a transformer',
    pathSlug: 'understand-how-transformers-work-well-enough-to-implement-one',
    onPaths: 48,
    exploring: 312
  },
  {
    id: 'neural-nets',
    label: 'Neural networks',
    blurb:
      'Layers, nonlinearities, and the idea that a network is a composition you can train.',
    pathTitle: 'Implement a transformer',
    pathSlug: 'understand-how-transformers-work-well-enough-to-implement-one',
    onPaths: 41,
    exploring: 286
  },
  {
    id: 'backprop',
    label: 'Backprop',
    blurb:
      'Why autograd lets you write the forward pass and still debug when the loss does not move.',
    pathTitle: 'Implement a transformer',
    pathSlug: 'understand-how-transformers-work-well-enough-to-implement-one',
    onPaths: 36,
    exploring: 198
  },
  {
    id: 'character-desire',
    label: 'Character desire',
    blurb:
      'What each lead wants, what they are afraid of, and the private lie the story has to undo.',
    pathTitle: 'Write a rom-com novel',
    pathSlug: 'write-a-rom-com-novel',
    onPaths: 22,
    exploring: 154
  },
  {
    id: 'choose-the-tree',
    label: 'Choose the tree',
    blurb:
      'Species, health, and whether a living trunk can take a load without being wounded into decline.',
    pathTitle: 'Build a tree house',
    pathSlug: 'build-a-tree-house',
    onPaths: 18,
    exploring: 97
  },
  {
    id: 'linear-algebra',
    label: 'Linear algebra',
    blurb:
      'Dot products as similarity, and the shapes you keep in your head while coding attention.',
    pathTitle: 'Implement a transformer',
    pathSlug: 'understand-how-transformers-work-well-enough-to-implement-one',
    onPaths: 33,
    exploring: 241
  }
]
