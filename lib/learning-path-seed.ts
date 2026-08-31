/** Catalog dummy paths plus sessionStorage fallback. Supabase is the source of truth when signed in. */
import { slugifyLearningPathName, titleFromSlug } from './learning-path-slug'

export const LEARNING_PATH_STORAGE_KEY = 'coursetexts.learning-paths'

export type LearningPathNodeKind =
  | 'goal'
  | 'concept'
  | 'prerequisite'
  | 'milestone'

export type LearningPathNodeStatus = 'explored' | 'exploring' | 'next'

export type LearningPathResourceKind =
  | 'course'
  | 'article'
  | 'book'
  | 'video'
  | 'paper'
  | 'exercise'

export type LearningPathResource = {
  id: string
  kind: LearningPathResourceKind
  title: string
  source: string
  href?: string
  why: string
}

export type LearningPathUserResource = {
  id: string
  kind: LearningPathResourceKind
  title: string
  href?: string
  passage: string
  why: string
  /** 1-based place in the combined Resources list. */
  sequence?: number
}

export type LearningPathListedResource = {
  id: string
  kind: LearningPathResourceKind
  title: string
  href?: string
  source?: string
  passage?: string
  why: string
  addedByYou: boolean
  sequence: number
  suggested?: boolean
  suggestedByYou?: boolean
}

function clampResourcePlacement(value: number, max: number): number {
  if (!Number.isFinite(value)) return max
  return Math.min(Math.max(1, Math.round(value)), Math.max(1, max))
}

function listedFromSeeded(
  resource: LearningPathResource,
  sequence: number
): LearningPathListedResource {
  return {
    id: resource.id,
    kind: resource.kind,
    title: resource.title,
    href: resource.href,
    source: resource.source,
    why: resource.why,
    addedByYou: false,
    sequence
  }
}

function listedFromUser(
  resource: LearningPathUserResource,
  sequence: number
): LearningPathListedResource {
  return {
    id: resource.id,
    kind: resource.kind,
    title: resource.title,
    href: resource.href,
    passage: resource.passage,
    why: resource.why,
    addedByYou: true,
    sequence
  }
}

function listedFromSuggestion(
  resource: LearningPathUserResource,
  sequence: number,
  suggestedByYou: boolean
): LearningPathListedResource {
  return {
    id: resource.id,
    kind: resource.kind,
    title: resource.title,
    href: resource.href,
    passage: resource.passage,
    why: resource.why,
    addedByYou: false,
    sequence,
    suggested: true,
    suggestedByYou
  }
}

/**
 * Combine path resources with ones you added. User items occupy their saved
 * sequence slots; remaining slots keep the original path order. Pending
 * collab suggestions are inserted at their requested place with a suggested
 * flag so they never become official resources on their own.
 */
export function mergeLearningPathResources(
  seeded: LearningPathResource[],
  mine: LearningPathUserResource[],
  suggestions: Array<
    LearningPathUserResource & { suggestedByYou?: boolean }
  > = []
): LearningPathListedResource[] {
  const sequenced = mine.filter(
    (resource) =>
      resource.sequence != null && Number.isFinite(resource.sequence)
  )
  const unsequenced = mine.filter(
    (resource) =>
      resource.sequence == null || !Number.isFinite(resource.sequence)
  )
  const slotCount = seeded.length + sequenced.length
  if (slotCount === 0 && unsequenced.length === 0 && suggestions.length === 0) {
    return []
  }

  const slots: Array<LearningPathListedResource | null> = Array.from(
    { length: slotCount },
    () => null
  )
  const orderedMine = [...sequenced].sort((a, b) => {
    const diff = (a.sequence ?? 0) - (b.sequence ?? 0)
    if (diff !== 0) return diff
    return a.id.localeCompare(b.id)
  })

  for (const resource of orderedMine) {
    if (slots.length === 0) break
    let idx =
      clampResourcePlacement(resource.sequence ?? slots.length, slots.length) -
      1
    while (idx < slots.length && slots[idx]) idx += 1
    if (idx >= slots.length) {
      idx = slots.length - 1
      while (idx >= 0 && slots[idx]) idx -= 1
    }
    if (idx < 0) continue
    slots[idx] = listedFromUser(resource, idx + 1)
  }

  let seedIndex = 0
  for (let i = 0; i < slots.length; i += 1) {
    if (slots[i] || seedIndex >= seeded.length) continue
    slots[i] = listedFromSeeded(seeded[seedIndex], i + 1)
    seedIndex += 1
  }

  const listed = slots.filter(
    (item): item is LearningPathListedResource => item != null
  )
  for (const resource of unsequenced) {
    listed.push(listedFromUser(resource, listed.length + 1))
  }
  const orderedSuggestions = [...suggestions].sort((a, b) => {
    const diff = (a.sequence ?? Number.MAX_SAFE_INTEGER) - (b.sequence ?? Number.MAX_SAFE_INTEGER)
    if (diff !== 0) return diff
    return a.id.localeCompare(b.id)
  })
  for (const resource of orderedSuggestions) {
    const max = listed.length + 1
    const idx =
      clampResourcePlacement(resource.sequence ?? max, max) - 1
    listed.splice(
      idx,
      0,
      listedFromSuggestion(resource, idx + 1, Boolean(resource.suggestedByYou))
    )
  }
  return listed.map((item, index) => ({ ...item, sequence: index + 1 }))
}

export function insertLearningPathOfficialResource(
  resources: LearningPathResource[],
  item: LearningPathResource,
  placement: number
): LearningPathResource[] {
  const next = [...resources]
  const idx = clampResourcePlacement(placement, next.length + 1) - 1
  next.splice(idx, 0, item)
  return next
}

export function insertLearningPathUserResource(
  seeded: LearningPathResource[],
  mine: LearningPathUserResource[],
  item: Omit<LearningPathUserResource, 'sequence'>,
  placement: number
): LearningPathUserResource[] {
  const current = mergeLearningPathResources(seeded, mine)
  const max = current.length + 1
  const sequence = clampResourcePlacement(placement, max)
  const nextItem: LearningPathUserResource = { ...item, sequence }
  const listed = [...current]
  listed.splice(sequence - 1, 0, listedFromUser(nextItem, sequence))
  const byId = new Map(mine.map((resource) => [resource.id, resource]))
  byId.set(nextItem.id, nextItem)
  return listed
    .map((row, index) => ({ ...row, sequence: index + 1 }))
    .filter((row) => row.addedByYou)
    .map((row) => {
      const original = byId.get(row.id)
      if (!original) {
        return {
          id: row.id,
          kind: row.kind,
          title: row.title,
          href: row.href,
          passage: row.passage ?? '',
          why: row.why,
          sequence: row.sequence
        }
      }
      return { ...original, sequence: row.sequence }
    })
}

export function updateLearningPathUserResource(
  seeded: LearningPathResource[],
  mine: LearningPathUserResource[],
  id: string,
  item: Omit<LearningPathUserResource, 'sequence'>,
  placement: number
): LearningPathUserResource[] {
  if (!mine.some((resource) => resource.id === id)) return mine
  return insertLearningPathUserResource(
    seeded,
    mine.filter((resource) => resource.id !== id),
    { ...item, id },
    placement
  )
}

export type LearningPathNode = {
  id: string
  label: string
  kind: LearningPathNodeKind
  sub: string
  status: LearningPathNodeStatus
  x: number
  y: number
  /** Core-path order (1, 2, 3…) or sibling order among sub-paths (a, b…). */
  sequence?: number
  description: string
  why: string
  resources: LearningPathResource[]
}

export type PathMark = {
  mark: string
  role: 'core' | 'branch'
  parentId?: string
}

export type LearningPathEdge = {
  from: string
  to: string
}

export type LearningPathCircleMember = {
  initials: string
  name: string
}

export type LearningPathCircle = {
  name: string
  description: string
  members: LearningPathCircleMember[]
}

export type LearningPathKind = 'community' | 'research' | 'course'

export type LearningPathVisibility = 'private' | 'public' | 'collaborative'

export function parseLearningPathKind(value: unknown): LearningPathKind {
  if (value === 'research' || value === 'course') return value
  return 'community'
}

export function parseLearningPathVisibility(
  value: unknown,
  fallbackIsPrivate?: boolean,
  isCatalog?: boolean
): LearningPathVisibility {
  if (
    value === 'private' ||
    value === 'public' ||
    value === 'collaborative'
  ) {
    return value
  }
  if (isCatalog) return 'public'
  return fallbackIsPrivate === false ? 'public' : 'private'
}

export type LearningPathData = {
  id?: string
  slug: string
  title: string
  goal: string
  summary: string
  nodes: LearningPathNode[]
  edges: LearningPathEdge[]
  circle: LearningPathCircle
  /** ISO timestamp from learning_paths.created_at or first local save. */
  createdAt?: string
}

export type StoredLearningPath = {
  id: string
  goal: string
  slug: string
  data?: LearningPathData
  isPrivate?: boolean
  visibility?: LearningPathVisibility
  kind?: LearningPathKind
  /** Present when this row is a saved (bookmarked) path, not one we own. */
  savedLinkId?: string
  /** ISO timestamp when this path was first created. */
  createdAt?: string
}

export type LearningPathOutlineSubconcept = {
  id: string
  label: string
  why: string
}

export type LearningPathOutlineConcept = {
  id: string
  label: string
  why: string
  subconcepts: LearningPathOutlineSubconcept[]
}

export type LearningPathOutlineStep = {
  id: string
  title: string
  why: string
  concepts: LearningPathOutlineConcept[]
}

const TRANSFORMERS: LearningPathData = {
  slug: 'understand-how-transformers-work-well-enough-to-implement-one',
  title: 'Implement a transformer',
  goal: 'I want to understand how transformers work well enough to implement one.',
  summary:
    'Work backward from a working model: attention, the pieces of linear algebra and probability it actually uses, and a small implementation — not a full ML degree.',
  nodes: [
    {
      id: 'goal',
      label: 'Implement a transformer',
      kind: 'goal',
      sub: 'Your goal',
      status: 'exploring',
      x: 50,
      y: 12,
      description:
        'A small model you can train and inspect — not a production LLM. Enough depth to write the attention block, the residual stream, and a training loop yourself.',
      why: 'The goal is the unit of the path. Everything else is here only because it is required to reach this capability.',
      resources: [
        {
          id: 'r-nanogpt',
          kind: 'exercise',
          title: 'nanoGPT',
          source: 'Andrej Karpathy',
          href: 'https://github.com/karpathy/nanoGPT',
          why: 'The shortest honest path from math to a model you can run.'
        }
      ]
    },
    {
      id: 'attention',
      label: 'Attention',
      kind: 'concept',
      sub: 'Need this',
      status: 'exploring',
      sequence: 3,
      x: 28,
      y: 38,
      description:
        'How tokens look at each other. Scaled dot-product attention, QKV projections, and why softmax turns similarity into a weighted combination of values.',
      why: 'This is the mechanism that makes a transformer a transformer. Intuition here is worth more than a survey of every architecture since 2017.',
      resources: [
        {
          id: 'r-illustrated',
          kind: 'article',
          title: 'The Illustrated Transformer',
          source: 'Jay Alammar',
          href: 'https://jalammar.github.io/illustrated-transformer/',
          why: 'The explanation that most often makes Q, K, and V click.'
        },
        {
          id: 'r-paper',
          kind: 'paper',
          title: 'Attention Is All You Need',
          source: 'Vaswani et al., 2017',
          href: 'https://arxiv.org/abs/1706.03762',
          why: 'The original argument, once you can read the diagrams.'
        }
      ]
    },
    {
      id: 'neural-nets',
      label: 'Neural networks',
      kind: 'concept',
      sub: 'Need this',
      status: 'explored',
      sequence: 1,
      x: 50,
      y: 38,
      description:
        'Layers, nonlinearities, residual connections, and the idea that a network is a composition of differentiable maps you can train.',
      why: 'Attention sits inside a network. You need enough fluency to stack blocks, add residuals, and not get lost in the shapes.',
      resources: [
        {
          id: 'r-3b1b',
          kind: 'video',
          title: 'Neural networks',
          source: '3Blue1Brown',
          href: 'https://www.youtube.com/playlist?list=PLZHQObOWTQDNU6R1_67000Dx_ZCJB-3pi',
          why: 'Visual intuition for what a layer is actually doing.'
        }
      ]
    },
    {
      id: 'sequences',
      label: 'Sequence models',
      kind: 'concept',
      sub: 'Need this',
      status: 'next',
      sequence: 2,
      x: 72,
      y: 38,
      description:
        'Why language is a sequence problem: embeddings, positional information, and next-token prediction as a training objective.',
      why: 'A transformer is a way to model sequences. Without this frame, attention looks like a trick instead of an answer to a problem.',
      resources: [
        {
          id: 'r-cs224n',
          kind: 'course',
          title: 'CS224N lecture on transformers',
          source: 'Stanford',
          href: 'https://web.stanford.edu/class/cs224n/',
          why: 'Places attention in the line from n-grams and RNNs to now.'
        }
      ]
    },
    {
      id: 'probability',
      label: 'Probability',
      kind: 'prerequisite',
      sub: 'As deep as you need',
      status: 'next',
      sequence: 1,
      x: 18,
      y: 64,
      description:
        'Softmax, cross-entropy, and the idea of a distribution over the next token. Not a full probability course — the slice attention actually uses.',
      why: 'Twenty minutes of the right probability is enough for this goal. Proof-level measure theory is not.',
      resources: [
        {
          id: 'r-softmax',
          kind: 'article',
          title: 'Softmax and cross-entropy',
          source: 'CS231n notes',
          href: 'https://cs231n.github.io/linear-classify/#softmax',
          why: 'Connects the loss you minimize to the distribution attention produces.'
        }
      ]
    },
    {
      id: 'linalg',
      label: 'Linear algebra',
      kind: 'prerequisite',
      sub: 'As deep as you need',
      status: 'next',
      sequence: 2,
      x: 40,
      y: 64,
      description:
        'Dot products as similarity, matrix multiply as a batched set of those, and shapes you can keep in your head while coding.',
      why: 'You need computational fluency with QKᵀ, not a first course in abstract vector spaces.',
      resources: [
        {
          id: 'r-dot',
          kind: 'video',
          title: 'Dot products and projections',
          source: '3Blue1Brown',
          href: 'https://www.youtube.com/watch?v=LyGKycYT2v0',
          why: 'Makes “similarity” a geometric fact instead of a slogan.'
        }
      ]
    },
    {
      id: 'backprop',
      label: 'Backprop',
      kind: 'prerequisite',
      sub: 'As deep as you need',
      status: 'next',
      sequence: 1,
      x: 62,
      y: 64,
      description:
        'Why autograd lets you write the forward pass and get gradients. Enough to debug a training loop when the loss does not move.',
      why: 'You will implement the model; the framework will differentiate it. You still need to know what is being differentiated.',
      resources: [
        {
          id: 'r-micrograd',
          kind: 'exercise',
          title: 'micrograd',
          source: 'Andrej Karpathy',
          href: 'https://github.com/karpathy/micrograd',
          why: 'Backprop in a few hundred lines — then you can trust PyTorch.'
        }
      ]
    },
    {
      id: 'ship',
      label: 'Train a tiny model',
      kind: 'milestone',
      sub: 'You are here when',
      status: 'next',
      sequence: 4,
      x: 82,
      y: 88,
      description:
        'A character-level or small BPE model that overfits a toy corpus and whose attention maps you can plot.',
      why: 'The goal is capability, not coverage. If you can train it and explain a head, you are done enough to go deeper later.',
      resources: [
        {
          id: 'r-minigpt',
          kind: 'exercise',
          title: 'Let’s build GPT from scratch',
          source: 'Andrej Karpathy',
          href: 'https://www.youtube.com/watch?v=kCc8FmEb1nY',
          why: 'Walks the whole path in one sitting, with code you can pause.'
        }
      ]
    }
  ],
  edges: [
    { from: 'goal', to: 'attention' },
    { from: 'goal', to: 'neural-nets' },
    { from: 'goal', to: 'sequences' },
    { from: 'attention', to: 'probability' },
    { from: 'attention', to: 'linalg' },
    { from: 'neural-nets', to: 'backprop' },
    { from: 'attention', to: 'ship' },
    { from: 'neural-nets', to: 'ship' },
    { from: 'sequences', to: 'ship' }
  ],
  circle: {
    name: 'From paper to a model',
    description:
      'People implementing attention together — sharing the explanation that made QKV click, and the bugs that unstuck a training loop.',
    members: [
      { initials: 'JA', name: 'Jay A.' },
      { initials: 'AK', name: 'Andrei K.' },
      { initials: 'MN', name: 'Maya N.' },
      { initials: 'RL', name: 'Ravi L.' },
      { initials: 'ES', name: 'Elena S.' },
      { initials: 'TW', name: 'Theo W.' }
    ]
  }
}

const ROM_COM: LearningPathData = {
  slug: 'write-a-rom-com-novel',
  title: 'Write a rom-com novel',
  goal: 'I want to write a rom com novel',
  summary:
    'A path through character, structure, and scene — the particular combination you need to finish a romantic comedy, not a MFA in general fiction.',
  nodes: [
    {
      id: 'goal',
      label: 'Finish a rom-com',
      kind: 'goal',
      sub: 'Your goal',
      status: 'exploring',
      x: 50,
      y: 12,
      description:
        'A complete draft with two people who want each other, a reason they cannot have each other, and a turn that makes the ending feel earned.',
      why: 'The path is organized around a finished book, not “getting better at writing” in the abstract.',
      resources: []
    },
    {
      id: 'character',
      label: 'Character desire',
      kind: 'concept',
      sub: 'Need this',
      status: 'exploring',
      sequence: 1,
      x: 26,
      y: 38,
      description:
        'What each lead wants, what they are afraid of, and the private lie that the romance will have to undo.',
      why: 'Chemistry is a consequence of two specific people in conflict. Vague likability will not carry a novel.',
      resources: [
        {
          id: 'r-want',
          kind: 'book',
          title: 'Save the Cat! Writes a Novel',
          source: 'Jessica Brody',
          why: 'A blunt map of desire, stakes, and the midpoint shift rom-coms run on.'
        }
      ]
    },
    {
      id: 'structure',
      label: 'Romantic structure',
      kind: 'concept',
      sub: 'Need this',
      status: 'next',
      sequence: 2,
      x: 50,
      y: 38,
      description:
        'Meet-cute, the contract of the genre, the midpoint of no return, the dark night, and the grand gesture that is actually a character choice.',
      why: 'Readers of this genre know the beats. The work is making them feel inevitable for these two people.',
      resources: [
        {
          id: 'r-beats',
          kind: 'article',
          title: 'The rom-com beat sheet',
          source: 'Genre craft notes',
          why: 'Names the turns so you can see where a draft is stalling.'
        }
      ]
    },
    {
      id: 'dialogue',
      label: 'Dialogue',
      kind: 'concept',
      sub: 'Need this',
      status: 'next',
      sequence: 3,
      x: 74,
      y: 38,
      description:
        'Banter that reveals, subtext that hurts, and the difference between people performing chemistry and people actually talking.',
      why: 'In a rom-com, talk is often the action. If the dialogue is generic, the book is generic.',
      resources: [
        {
          id: 'r-talk',
          kind: 'book',
          title: 'Writing Dialogue',
          source: 'Tom Chiarella',
          why: 'Practice for making speech do plot work.'
        }
      ]
    },
    {
      id: 'obstacle',
      label: 'The obstacle',
      kind: 'prerequisite',
      sub: 'As deep as you need',
      status: 'next',
      sequence: 1,
      x: 22,
      y: 64,
      description:
        'A real reason they should not be together — not a misunderstanding that a text message could fix.',
      why: 'Without a load-bearing obstacle, the middle of the book has nothing to do.',
      resources: []
    },
    {
      id: 'scenes',
      label: 'Scene craft',
      kind: 'prerequisite',
      sub: 'As deep as you need',
      status: 'next',
      sequence: 1,
      x: 50,
      y: 64,
      description:
        'Each scene turns: someone enters wanting something and leaves having gotten it, failed, or changed the terms.',
      why: 'Structure is empty until scenes actually move. This is the daily unit of finishing.',
      resources: [
        {
          id: 'r-scene',
          kind: 'book',
          title: 'Story',
          source: 'Robert McKee',
          why: 'Still one of the clearest accounts of a scene as a value change.'
        }
      ]
    },
    {
      id: 'voice',
      label: 'Voice',
      kind: 'prerequisite',
      sub: 'As deep as you need',
      status: 'next',
      sequence: 1,
      x: 76,
      y: 64,
      description:
        'The particular way this narrator notices the world — humor with a point of view, not jokes stacked on plot.',
      why: 'Rom-coms live or die on tone. Voice is how the reader wants to stay.',
      resources: []
    },
    {
      id: 'draft',
      label: 'A complete draft',
      kind: 'milestone',
      sub: 'You are here when',
      status: 'next',
      sequence: 4,
      x: 82,
      y: 88,
      description:
        'A beginning, middle, and end on the page. Revision is a later path.',
      why: 'The goal is to finish, not to perfect chapter one.',
      resources: []
    }
  ],
  edges: [
    { from: 'goal', to: 'character' },
    { from: 'goal', to: 'structure' },
    { from: 'goal', to: 'dialogue' },
    { from: 'character', to: 'obstacle' },
    { from: 'structure', to: 'scenes' },
    { from: 'dialogue', to: 'voice' },
    { from: 'character', to: 'draft' },
    { from: 'structure', to: 'draft' },
    { from: 'dialogue', to: 'draft' }
  ],
  circle: {
    name: 'Finishing the draft',
    description:
      'Writers on the same beat sheet, swapping scenes and getting unstuck on the midpoint instead of polishing chapter one forever.',
    members: [
      { initials: 'LB', name: 'Lila B.' },
      { initials: 'SK', name: 'Sam K.' },
      { initials: 'JP', name: 'Jules P.' },
      { initials: 'AM', name: 'Amina M.' },
      { initials: 'DH', name: 'Devon H.' }
    ]
  }
}

const TREE_HOUSE: LearningPathData = {
  slug: 'build-a-tree-house',
  title: 'Build a tree house',
  goal: 'I want to build a tree house',
  summary:
    'Site, structure, and safety — the knowledge that keeps a platform in a living tree, not a general carpentry degree.',
  nodes: [
    {
      id: 'goal',
      label: 'A house in a tree',
      kind: 'goal',
      sub: 'Your goal',
      status: 'exploring',
      x: 50,
      y: 12,
      description:
        'A platform that the tree can keep living in, that you can get onto safely, and that will still be there next season.',
      why: 'The tree is a partner, not lumber. The path is built around that constraint.',
      resources: []
    },
    {
      id: 'tree',
      label: 'Choose the tree',
      kind: 'concept',
      sub: 'Start here',
      status: 'explored',
      sequence: 1,
      x: 24,
      y: 38,
      description:
        'Species, health, trunk diameter, crown, and whether the tree can take a load without being wounded into decline.',
      why: 'The wrong tree makes every later decision decorative. This is the first filter.',
      resources: [
        {
          id: 'r-tree',
          kind: 'article',
          title: 'Which trees can hold a treehouse',
          source: 'Treehouse practice notes',
          why: 'Separates romantic trees from structural ones.'
        }
      ]
    },
    {
      id: 'structure',
      label: 'Loads & structure',
      kind: 'concept',
      sub: 'Need this',
      status: 'exploring',
      sequence: 2,
      x: 50,
      y: 38,
      description:
        'Dead load, live load, wind, and how a platform shares force with a moving tree instead of fighting it.',
      why: 'A treehouse fails as a structure long before it fails as a design.',
      resources: [
        {
          id: 'r-loads',
          kind: 'book',
          title: 'Treehouses and Playhouses You Can Build',
          source: 'David Stiles',
          why: 'Practical spans and supports without pretending you are an engineer of high-rises.'
        }
      ]
    },
    {
      id: 'safety',
      label: 'Safety',
      kind: 'concept',
      sub: 'Need this',
      status: 'next',
      sequence: 3,
      x: 76,
      y: 38,
      description:
        'Access, railings, fall distance, and how you work at height without turning the build into the danger.',
      why: 'Capability includes getting everyone down in one piece.',
      resources: []
    },
    {
      id: 'joinery',
      label: 'Tree-friendly joinery',
      kind: 'prerequisite',
      sub: 'As deep as you need',
      status: 'next',
      sequence: 1,
      x: 22,
      y: 64,
      description:
        'Tab attachments, floating brackets, and methods that let the tree grow instead of girdling it.',
      why: 'Nailing a ledger into a trunk like a house wall is how treehouses kill trees.',
      resources: [
        {
          id: 'r-tabs',
          kind: 'article',
          title: 'Treehouse attachment bolts',
          source: 'Treehouse Workshop',
          why: 'The hardware that replaced lag screws through the heartwood.'
        }
      ]
    },
    {
      id: 'materials',
      label: 'Materials',
      kind: 'prerequisite',
      sub: 'As deep as you need',
      status: 'next',
      sequence: 1,
      x: 50,
      y: 64,
      description:
        'Weather, rot, weight, and what you can carry into a canopy. Exterior-rated fasteners, not interior pine.',
      why: 'The tree moves and the weather does not forgive a deck screw from the hardware aisle.',
      resources: []
    },
    {
      id: 'code',
      label: 'Permission & code',
      kind: 'prerequisite',
      sub: 'As deep as you need',
      status: 'next',
      sequence: 1,
      x: 76,
      y: 64,
      description:
        'Setbacks, height, and whether your town treats this as a play structure or a dwelling. Neighbors count.',
      why: 'A beautiful platform you have to take down is not a finished goal.',
      resources: []
    },
    {
      id: 'build',
      label: 'Raise the platform',
      kind: 'milestone',
      sub: 'You are here when',
      status: 'next',
      sequence: 4,
      x: 82,
      y: 88,
      description:
        'A level, attached platform with a safe way up. Walls and a roof can be a later path.',
      why: 'Ship the structure first. Ornament is a different goal.',
      resources: []
    }
  ],
  edges: [
    { from: 'goal', to: 'tree' },
    { from: 'goal', to: 'structure' },
    { from: 'goal', to: 'safety' },
    { from: 'tree', to: 'joinery' },
    { from: 'structure', to: 'materials' },
    { from: 'safety', to: 'code' },
    { from: 'joinery', to: 'build' },
    { from: 'materials', to: 'build' },
    { from: 'structure', to: 'build' }
  ],
  circle: {
    name: 'Raising a platform',
    description:
      'Builders comparing trees, joinery, and what actually held through a season — the traces that make the next treehouse safer.',
    members: [
      { initials: 'DS', name: 'Dana S.' },
      { initials: 'RT', name: 'Robin T.' },
      { initials: 'CW', name: 'Chris W.' },
      { initials: 'NL', name: 'Noor L.' },
      { initials: 'PG', name: 'Priya G.' },
      { initials: 'HB', name: 'Hank B.' }
    ]
  }
}

const SPANISH: LearningPathData = {
  slug: 'learn-spanish',
  title: 'Learn Spanish',
  goal: 'learn spanish',
  summary:
    'A path from core words and the present tense into conversations — only as deep as you need to start speaking.',
  nodes: [
    {
      id: 'goal',
      label: 'learn spanish',
      kind: 'goal',
      sub: 'Your goal',
      status: 'exploring',
      x: 50,
      y: 12,
      description:
        'Enough Spanish to greet people, ask questions, and talk about the present — not a linguistics degree.',
      why: 'The goal is the unit of the path. Everything else is here only because it is required to start speaking.',
      resources: []
    },
    {
      id: 'step-1',
      label: '500 core words',
      kind: 'milestone',
      sub: 'Step 1',
      status: 'exploring',
      sequence: 1,
      x: 18,
      y: 36,
      description:
        'A small, high-frequency vocabulary: pronouns, question words, connectors, and the function words every sentence leans on.',
      why: 'Steps are the major checkpoints. Concepts sit inside them.',
      resources: []
    },
    {
      id: 'c-1-1',
      label: 'Pronouns, question words, connectors, basic function words',
      kind: 'prerequisite',
      sub: 'Need this',
      status: 'next',
      sequence: 1,
      x: 18,
      y: 58,
      description:
        'yo, tú, qué, dónde, y, pero — the glue that lets 500 words become sentences.',
      why: 'You placed this because it sits inside the step.',
      resources: []
    },
    {
      id: 's-1-1-1',
      label: 'yo',
      kind: 'prerequisite',
      sub: 'As deep as you need',
      status: 'next',
      sequence: 1,
      x: 12,
      y: 76,
      description: 'The first-person pronoun — how you talk about yourself.',
      why: 'Go only as deep as the goal requires.',
      resources: []
    },
    {
      id: 's-1-1-2',
      label: 'tú',
      kind: 'prerequisite',
      sub: 'As deep as you need',
      status: 'next',
      sequence: 2,
      x: 24,
      y: 76,
      description: 'The informal you — how you talk to someone you know.',
      why: 'Go only as deep as the goal requires.',
      resources: []
    },
    {
      id: 'step-2',
      label: 'present tense',
      kind: 'milestone',
      sub: 'Step 2',
      status: 'next',
      sequence: 2,
      x: 39,
      y: 36,
      description:
        'Regular present-tense verbs so those 500 words can actually happen now.',
      why: 'Steps are the major checkpoints. Concepts sit inside them.',
      resources: []
    },
    {
      id: 'step-3',
      label: 'basic conversations',
      kind: 'milestone',
      sub: 'Step 3',
      status: 'next',
      sequence: 3,
      x: 61,
      y: 36,
      description:
        'Greetings, questions, and short exchanges you can use the same day.',
      why: 'Steps are the major checkpoints. Concepts sit inside them.',
      resources: []
    },
    {
      id: 'step-4',
      label: '1,500-2,500 words',
      kind: 'milestone',
      sub: 'Step 4',
      status: 'next',
      sequence: 4,
      x: 82,
      y: 36,
      description:
        'A wider working vocabulary once the present tense and basic talk are in place.',
      why: 'Steps are the major checkpoints. Concepts sit inside them.',
      resources: []
    }
  ],
  edges: [
    { from: 'goal', to: 'step-1' },
    { from: 'step-1', to: 'step-2' },
    { from: 'step-2', to: 'step-3' },
    { from: 'step-3', to: 'step-4' },
    { from: 'step-1', to: 'c-1-1' },
    { from: 'c-1-1', to: 's-1-1-1' },
    { from: 'c-1-1', to: 's-1-1-2' }
  ],
  circle: {
    name: 'Speaking from day one',
    description:
      'People collecting the words and phrases that actually got them through a first conversation — and leaving the traces for the next learner.',
    members: [
      { initials: 'MR', name: 'Marta R.' },
      { initials: 'JL', name: 'Jules L.' },
      { initials: 'CA', name: 'Camila A.' },
      { initials: 'DN', name: 'Diego N.' }
    ]
  }
}

const HOST_DINNER: LearningPathData = {
  slug: 'host-a-dinner',
  title: 'Host a dinner',
  goal: 'I want to cook a dinner for friends',
  summary:
    'A menu you can actually finish, timing that holds, and the few techniques that make the food taste like you meant it — not culinary school.',
  nodes: [
    {
      id: 'goal',
      label: 'Dinner for friends',
      kind: 'goal',
      sub: 'Your goal',
      status: 'exploring',
      x: 50,
      y: 12,
      description:
        'A meal you can sit down to with other people — hot, on time, and not a scramble of five unfinished pans.',
      why: 'The goal is hospitality you can repeat, not a tasting menu.',
      resources: []
    },
    {
      id: 'menu',
      label: 'Pick a menu',
      kind: 'concept',
      sub: 'Start here',
      status: 'explored',
      sequence: 1,
      x: 24,
      y: 38,
      description:
        'One main that can wait, one side you can finish last, and a dessert that is done before anyone arrives.',
      why: 'A menu that needs four things at once is how dinners fall apart.',
      resources: [
        {
          id: 'r-salt-fat',
          kind: 'book',
          title: 'Salt, Fat, Acid, Heat',
          source: 'Samin Nosrat',
          href: 'https://www.saltfatacidheat.com/',
          why: 'The four levers that make a simple menu taste like a plan.'
        }
      ]
    },
    {
      id: 'timing',
      label: 'Timing & mise en place',
      kind: 'concept',
      sub: 'Need this',
      status: 'exploring',
      sequence: 2,
      x: 50,
      y: 38,
      description:
        'What you can do the day before, what has to happen in the last twenty minutes, and a list you can cook from without rereading the recipe.',
      why: 'Cooking for people is mostly logistics. Flavor is easier when the clock is not the enemy.',
      resources: [
        {
          id: 'r-serious-mise',
          kind: 'article',
          title: 'The Food Lab: Mise en Place',
          source: 'Kenji López-Alt',
          href: 'https://www.seriouseats.com/how-to-mise-en-place',
          why: 'Turns “prep” into a sequence instead of a pile of chopped things.'
        }
      ]
    },
    {
      id: 'taste',
      label: 'Seasoning',
      kind: 'concept',
      sub: 'Need this',
      status: 'next',
      sequence: 3,
      x: 76,
      y: 38,
      description:
        'Salt early, acid at the end, and tasting as you go so the plate is bright instead of merely cooked.',
      why: 'Undersalted food is the most common way a decent menu tastes unfinished.',
      resources: []
    },
    {
      id: 'heat',
      label: 'Heat control',
      kind: 'prerequisite',
      sub: 'As deep as you need',
      status: 'next',
      sequence: 1,
      x: 22,
      y: 64,
      description:
        'When a pan is actually hot, when to back off, and how not to steam what you meant to brown.',
      why: 'Browning is a technique, not a setting on the stove.',
      resources: [
        {
          id: 'r-sear',
          kind: 'article',
          title: 'How to sear',
          source: 'Serious Eats',
          href: 'https://www.seriouseats.com/the-food-lab-how-to-sear',
          why: 'Makes pan heat a decision instead of a guess.'
        }
      ]
    },
    {
      id: 'protein',
      label: 'One protein, done',
      kind: 'prerequisite',
      sub: 'As deep as you need',
      status: 'next',
      sequence: 1,
      x: 50,
      y: 64,
      description:
        'Roast, braise, or pan — pick one method you can hit without a thermometer panic. Carryover heat counts.',
      why: 'The main is the thing people remember. It only has to be one thing, cooked through.',
      resources: []
    },
    {
      id: 'table',
      label: 'The table',
      kind: 'prerequisite',
      sub: 'As deep as you need',
      status: 'next',
      sequence: 1,
      x: 76,
      y: 64,
      description:
        'Plates, a drink, and a room that is ready before the food is. You cannot host from the stove the whole night.',
      why: 'Dinner is the sitting-down. The cooking is how you get there.',
      resources: []
    },
    {
      id: 'serve',
      label: 'Sit down to it',
      kind: 'milestone',
      sub: 'You are here when',
      status: 'next',
      sequence: 4,
      x: 82,
      y: 88,
      description:
        'Food on the table while it is still hot, and you in a chair. Leftovers are a success, not a failure of scale.',
      why: 'The path is done when you ate with people. The next dinner is a later path.',
      resources: []
    }
  ],
  edges: [
    { from: 'goal', to: 'menu' },
    { from: 'goal', to: 'timing' },
    { from: 'goal', to: 'taste' },
    { from: 'menu', to: 'protein' },
    { from: 'timing', to: 'heat' },
    { from: 'taste', to: 'table' },
    { from: 'protein', to: 'serve' },
    { from: 'heat', to: 'serve' },
    { from: 'timing', to: 'serve' }
  ],
  circle: {
    name: 'Dinner, not a performance',
    description:
      'People trading menus that actually survived a Friday night — what they prepped ahead, and what they will never try for guests again.',
    members: [
      { initials: 'SN', name: 'Sami N.' },
      { initials: 'KL', name: 'Kenji L.' },
      { initials: 'AR', name: 'Asha R.' },
      { initials: 'TB', name: 'Theo B.' },
      { initials: 'MG', name: 'Mina G.' }
    ]
  }
}

const PLAY_GUITAR: LearningPathData = {
  slug: 'play-a-song-on-guitar',
  title: 'Play a song on guitar',
  goal: 'I want to play a song on guitar',
  summary:
    'Chords, a strum you can keep, and one song you can get through — not music theory for its own sake.',
  nodes: [
    {
      id: 'goal',
      label: 'One song, all the way through',
      kind: 'goal',
      sub: 'Your goal',
      status: 'exploring',
      x: 50,
      y: 12,
      description:
        'A song you can play for someone else without stopping to restart every eight bars.',
      why: 'The goal is a piece of music, not a catalog of chords.',
      resources: []
    },
    {
      id: 'chords',
      label: 'Open chords',
      kind: 'concept',
      sub: 'Start here',
      status: 'explored',
      sequence: 1,
      x: 24,
      y: 38,
      description:
        'G, C, D, Em, Am — the handful that covers most first songs. Clean enough that each string rings.',
      why: 'You do not need the whole neck. You need the shapes this song uses.',
      resources: [
        {
          id: 'r-justin-chords',
          kind: 'video',
          title: 'Beginner guitar course',
          source: 'Justin Guitar',
          href: 'https://www.justinguitar.com/guitar-lessons/beginner-guitar-course-grade-1-bc-101',
          why: 'The sequence most people actually finish, chord by chord.'
        }
      ]
    },
    {
      id: 'strum',
      label: 'Strumming & time',
      kind: 'concept',
      sub: 'Need this',
      status: 'exploring',
      sequence: 2,
      x: 50,
      y: 38,
      description:
        'A down-up pattern you can keep while the left hand changes. The right hand is the drum.',
      why: 'A perfect chord that arrives late is still a missed beat.',
      resources: [
        {
          id: 'r-strum',
          kind: 'video',
          title: 'Strumming patterns for beginners',
          source: 'Justin Guitar',
          href: 'https://www.justinguitar.com/guitar-lessons/easy-songs-for-beginners-bg-1114',
          why: 'Puts a pattern under the chords instead of guessing at the recording.'
        }
      ]
    },
    {
      id: 'changes',
      label: 'Chord changes',
      kind: 'concept',
      sub: 'Need this',
      status: 'next',
      sequence: 3,
      x: 76,
      y: 38,
      description:
        'Moving between two shapes without a pause. The change is the skill; the hold is just waiting.',
      why: 'Songs live in the transitions. Slow the song down until the change is on time.',
      resources: []
    },
    {
      id: 'tuning',
      label: 'Tuning & setup',
      kind: 'prerequisite',
      sub: 'As deep as you need',
      status: 'next',
      sequence: 1,
      x: 22,
      y: 64,
      description:
        'A tuner, strings that are not dead, and an action you can press without fighting the guitar.',
      why: 'An out-of-tune guitar teaches you the wrong sounds. Fix that first.',
      resources: []
    },
    {
      id: 'fretting',
      label: 'Fretting',
      kind: 'prerequisite',
      sub: 'As deep as you need',
      status: 'next',
      sequence: 1,
      x: 50,
      y: 64,
      description:
        'Close behind the fret, arched fingers, and enough pressure that the note is a note — then no more.',
      why: 'Buzz and mute are almost always a hand shape, not a talent gap.',
      resources: []
    },
    {
      id: 'song',
      label: 'The song itself',
      kind: 'prerequisite',
      sub: 'As deep as you need',
      status: 'next',
      sequence: 1,
      x: 76,
      y: 64,
      description:
        'A chart with three or four chords, a tempo you can speak, and a recording you will play along with.',
      why: 'Pick one song and stay there. A new song every day is how people never finish one.',
      resources: [
        {
          id: 'r-easy-songs',
          kind: 'article',
          title: 'Easy songs for beginners',
          source: 'Justin Guitar',
          href: 'https://www.justinguitar.com/modules/easy-songs-for-beginners',
          why: 'A short list of songs that actually fit the first chord set.'
        }
      ]
    },
    {
      id: 'play',
      label: 'Play it through',
      kind: 'milestone',
      sub: 'You are here when',
      status: 'next',
      sequence: 4,
      x: 82,
      y: 88,
      description:
        'Verse and chorus, start to end, without stopping. Ugly and complete beats pretty and abandoned.',
      why: 'The path is a song you can play. The next song is a later path.',
      resources: []
    }
  ],
  edges: [
    { from: 'goal', to: 'chords' },
    { from: 'goal', to: 'strum' },
    { from: 'goal', to: 'changes' },
    { from: 'chords', to: 'fretting' },
    { from: 'strum', to: 'tuning' },
    { from: 'changes', to: 'song' },
    { from: 'fretting', to: 'play' },
    { from: 'song', to: 'play' },
    { from: 'strum', to: 'play' }
  ],
  circle: {
    name: 'First song club',
    description:
      'People posting the song they finally got through — the chord that would not change, and the tempo that made it click.',
    members: [
      { initials: 'JG', name: 'Justin G.' },
      { initials: 'LW', name: 'Leah W.' },
      { initials: 'MC', name: 'Marco C.' },
      { initials: 'PS', name: 'Priya S.' },
      { initials: 'EK', name: 'Eli K.' }
    ]
  }
}

export const SEEDED_LEARNING_PATHS: LearningPathData[] = [
  SPANISH,
  TRANSFORMERS,
  ROM_COM,
  TREE_HOUSE,
  HOST_DINNER,
  PLAY_GUITAR
]

export const SEEDED_LEARNING_PATHS_BY_SLUG: Record<string, LearningPathData> =
  Object.fromEntries(SEEDED_LEARNING_PATHS.map((path) => [path.slug, path]))

export function isCatalogLearningPathSlug(slug: string) {
  return Boolean(SEEDED_LEARNING_PATHS_BY_SLUG[slug])
}

const BRANCH_LETTERS = 'abcdefghijklmnopqrstuvwxyz'
const BRANCH_ROMANS = [
  'i',
  'ii',
  'iii',
  'iv',
  'v',
  'vi',
  'vii',
  'viii',
  'ix',
  'x'
]

function bySequence(a: LearningPathNode, b: LearningPathNode) {
  const ao = a.sequence ?? a.x
  const bo = b.sequence ?? b.x
  if (ao !== bo) return ao - bo
  if (a.kind === 'milestone' && b.kind !== 'milestone') return 1
  if (b.kind === 'milestone' && a.kind !== 'milestone') return -1
  return a.x - b.x
}

export function sequenceMarks(
  path: LearningPathData
): Record<string, PathMark> {
  const byId = Object.fromEntries(path.nodes.map((node) => [node.id, node]))
  const marks: Record<string, PathMark> = {}
  const core = path.nodes
    .filter((node) => node.kind === 'concept' || node.kind === 'milestone')
    .sort(bySequence)
  core.forEach((node, index) => {
    marks[node.id] = { mark: String(index + 1), role: 'core' }
  })

  function markChildren(
    parentId: string,
    childKind: LearningPathNodeKind,
    labels: readonly string[]
  ) {
    const kids = path.edges
      .filter((edge) => edge.from === parentId)
      .map((edge) => byId[edge.to])
      .filter(
        (node): node is LearningPathNode =>
          !!node && node.kind === childKind && !marks[node.id]
      )
      .sort(bySequence)
    kids.forEach((node, index) => {
      marks[node.id] = {
        mark: labels[index] ?? String(index + 1),
        role: 'branch',
        parentId
      }
    })
  }

  for (const parent of core) {
    markChildren(parent.id, 'prerequisite', BRANCH_LETTERS.split(''))
  }
  for (const parent of path.nodes.filter(
    (node) => node.kind === 'prerequisite'
  )) {
    markChildren(parent.id, 'prerequisite', BRANCH_ROMANS)
  }
  return marks
}

function layoutX(index: number, total: number) {
  if (total <= 1) return 50
  const span = 64
  const start = 50 - span / 2
  return start + (span * index) / (total - 1)
}

export function learningPathFromOutline({
  goal,
  slug,
  steps,
  summary
}: {
  goal: string
  slug: string
  steps: LearningPathOutlineStep[]
  summary?: string
}): LearningPathData {
  const title =
    goal.replace(/^I want to\s+/i, '').replace(/\.$/, '') || titleFromSlug(slug)

  const filledSteps = steps
    .map((step) => ({
      title: step.title.trim(),
      why: (step.why ?? '').trim(),
      concepts: step.concepts
        .map((concept) => ({
          label: concept.label.trim(),
          why: (concept.why ?? '').trim(),
          subconcepts: concept.subconcepts
            .map((item) => ({
              label: item.label.trim(),
              why: (item.why ?? '').trim()
            }))
            .filter((item) => item.label)
        }))
        .filter((concept) => concept.label)
    }))
    .filter((step) => step.title)

  if (filledSteps.length === 0) {
    return emptyLearningPath(goal, slug)
  }

  const nodes: LearningPathNode[] = [
    {
      id: 'goal',
      label: title,
      kind: 'goal',
      sub: 'Your goal',
      status: 'exploring',
      x: 50,
      y: 12,
      description:
        'Begin with the intention. Work backward into the knowledge that would make you capable of it.',
      why: 'This path starts from what you are trying to do.',
      resources: []
    }
  ]
  const edges: LearningPathEdge[] = []
  const stepIds: string[] = []

  filledSteps.forEach((step, stepIndex) => {
    const stepId = `step-${stepIndex + 1}`
    stepIds.push(stepId)
    const x = layoutX(stepIndex, filledSteps.length)
    const stepWhy =
      step.why || 'Steps are the major checkpoints. Concepts sit inside them.'
    nodes.push({
      id: stepId,
      label: step.title,
      kind: 'milestone',
      sub: `Step ${stepIndex + 1}`,
      status: stepIndex === 0 ? 'exploring' : 'next',
      sequence: stepIndex + 1,
      x,
      y: 36,
      description: step.why || `A milestone on the way to ${title}.`,
      why: stepWhy,
      resources: []
    })
    edges.push({
      from: stepIndex === 0 ? 'goal' : stepIds[stepIndex - 1],
      to: stepId
    })

    step.concepts.forEach((concept, conceptIndex) => {
      const conceptId = `c-${stepIndex + 1}-${conceptIndex + 1}`
      const offset = (conceptIndex - (step.concepts.length - 1) / 2) * 12
      const conceptX = Math.min(88, Math.max(12, x + offset))
      const conceptWhy =
        concept.why || 'You placed this because it sits inside the step.'
      nodes.push({
        id: conceptId,
        label: concept.label,
        kind: 'prerequisite',
        sub: 'Need this',
        status: 'next',
        sequence: conceptIndex + 1,
        x: conceptX,
        y: 58,
        description: concept.why || 'A concept this step depends on.',
        why: conceptWhy,
        resources: []
      })
      edges.push({ from: stepId, to: conceptId })

      concept.subconcepts.forEach((sub, subIndex) => {
        const subId = `s-${stepIndex + 1}-${conceptIndex + 1}-${subIndex + 1}`
        const subOffset = (subIndex - (concept.subconcepts.length - 1) / 2) * 8
        const subWhy = sub.why || 'Go only as deep as the goal requires.'
        nodes.push({
          id: subId,
          label: sub.label,
          kind: 'prerequisite',
          sub: 'As deep as you need',
          status: 'next',
          sequence: subIndex + 1,
          x: Math.min(88, Math.max(12, conceptX + subOffset)),
          y: 76,
          description: sub.why || 'A finer concept under the parent idea.',
          why: subWhy,
          resources: []
        })
        edges.push({ from: conceptId, to: subId })
      })
    })
  })

  return {
    slug,
    title,
    goal,
    summary:
      summary?.trim() ||
      'A path you mapped from the goal: steps as milestones, concepts nested only as deep as you need.',
    nodes,
    edges,
    circle: {
      name: 'Start a study circle',
      description:
        'When you make this path visible, other people trying to reach a similar goal can learn beside you — and leave resource traces for the next person.',
      members: []
    }
  }
}

export function emptyLearningPath(
  goal: string,
  slug = slugifyLearningPathName(goal)
): LearningPathData {
  const title = goal.replace(/^I want to\s+/i, '').replace(/\.$/, '')
  return {
    slug,
    title: title || titleFromSlug(slug),
    goal,
    summary:
      'A starting map. Add the concepts, skills, and resources you actually need for this goal — and how deep each one has to go.',
    nodes: [
      {
        id: 'goal',
        label: title || 'Your goal',
        kind: 'goal',
        sub: 'Your goal',
        status: 'exploring',
        x: 50,
        y: 18,
        description:
          'Begin with the intention. Work backward into the knowledge that would make you capable of it.',
        why: 'Courses and fields are particular paths through a larger graph. This path starts from what you are trying to do.',
        resources: []
      }
    ],
    edges: [],
    circle: {
      name: 'Start a study circle',
      description:
        'When you make this path visible, other people trying to reach a similar goal can learn beside you — and leave resource traces for the next person.',
      members: []
    }
  }
}

export function readStoredLearningPaths(): StoredLearningPath[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.sessionStorage.getItem(LEARNING_PATH_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (item): item is StoredLearningPath =>
        !!item &&
        typeof item === 'object' &&
        typeof (item as StoredLearningPath).id === 'string' &&
        typeof (item as StoredLearningPath).goal === 'string' &&
        typeof (item as StoredLearningPath).slug === 'string'
    )
  } catch {
    return []
  }
}

export function writeStoredLearningPaths(items: StoredLearningPath[]) {
  if (typeof window === 'undefined') return
  window.sessionStorage.setItem(
    LEARNING_PATH_STORAGE_KEY,
    JSON.stringify(items)
  )
}

function createdAtFromStoredItem(
  item?: StoredLearningPath | null
): string | undefined {
  if (!item) return undefined
  if (item.createdAt) return item.createdAt
  if (item.data?.createdAt) return item.data.createdAt
  const match = /^path-(\d+)$/.exec(item.id)
  if (match) {
    const n = Number(match[1])
    if (Number.isFinite(n) && n > 1e12) return new Date(n).toISOString()
  }
  return undefined
}

export function saveStoredLearningPath(
  path: LearningPathData,
  extras?: { kind?: LearningPathKind }
) {
  if (typeof window === 'undefined') return
  if (SEEDED_LEARNING_PATHS_BY_SLUG[path.slug]) return
  const stored = readStoredLearningPaths()
  const existing = stored.find((item) => item.slug === path.slug)
  const createdAt =
    existing?.createdAt ??
    path.createdAt ??
    createdAtFromStoredItem(existing) ??
    new Date().toISOString()
  const item: StoredLearningPath = {
    id: existing?.id ?? `path-${Date.now()}`,
    goal: path.goal,
    slug: path.slug,
    data: { ...path, createdAt },
    isPrivate: existing?.isPrivate ?? true,
    visibility: existing?.visibility,
    kind: parseLearningPathKind(extras?.kind ?? existing?.kind),
    createdAt
  }
  writeStoredLearningPaths([
    item,
    ...stored.filter((row) => row.slug !== path.slug)
  ])
}

export function resolveLearningPath(
  slug: string,
  stored: StoredLearningPath[] = []
): LearningPathData {
  const seeded = SEEDED_LEARNING_PATHS_BY_SLUG[slug]
  if (seeded) return seeded
  const custom = stored.find((item) => item.slug === slug)
  const createdAt = createdAtFromStoredItem(custom)
  if (custom?.data && Array.isArray(custom.data.nodes)) {
    return {
      ...custom.data,
      id: custom.data.id ?? custom.id,
      slug: custom.slug,
      goal: custom.goal,
      title:
        custom.data.title || emptyLearningPath(custom.goal, custom.slug).title,
      createdAt: createdAt ?? custom.data.createdAt
    }
  }
  if (custom) {
    const empty = emptyLearningPath(custom.goal, custom.slug)
    return createdAt ? { ...empty, createdAt } : empty
  }
  const fromSlug = titleFromSlug(slug)
  return emptyLearningPath(`I want to ${fromSlug.toLowerCase()}`, slug)
}

export function nodeStatusMap(
  path: LearningPathData
): Record<string, LearningPathNodeStatus> {
  return Object.fromEntries(path.nodes.map((node) => [node.id, node.status]))
}

export function applyNodeStatus(
  path: LearningPathData,
  status: Record<string, string> | null | undefined
): LearningPathData {
  if (!status || typeof status !== 'object') return path
  return {
    ...path,
    nodes: path.nodes.map((node) => {
      const next = status[node.id]
      if (next === 'explored' || next === 'exploring' || next === 'next') {
        return { ...node, status: next }
      }
      return node
    })
  }
}
