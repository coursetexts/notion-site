import {
  type LearningPathData,
  type LearningPathResource,
  type LearningPathUserResource,
  type LearningPathVisibility,
  mergeLearningPathResources
} from '@/lib/learning-path-seed'

export const LEARNING_PATH_PUBLISH_MIN_RESOURCES = 2

/** Defaults written when a node is created without a real reason. */
export const LEARNING_PATH_PLACEHOLDER_WHYS = new Set([
  'Steps are the major checkpoints. Concepts sit inside them.',
  'You placed this because it sits inside the step.',
  'Go only as deep as the goal requires.'
])

export type LearningPathPublishTopicGap = {
  id: string
  label: string
  resourceCount: number
  needed: number
  missingWhy: boolean
}

export type LearningPathPublishCheck = {
  ok: boolean
  needsTopics: boolean
  gaps: LearningPathPublishTopicGap[]
}

export function isLearningPathPublishVisibility(
  visibility: LearningPathVisibility
): visibility is 'public' | 'collaborative' {
  return visibility === 'public' || visibility === 'collaborative'
}

export function learningPathTopicResourceCount(
  seeded: LearningPathResource[],
  mine: LearningPathUserResource[] = []
): number {
  return mergeLearningPathResources(seeded, mine).length
}

export function learningPathTopicHasWhy(why: string | null | undefined) {
  const trimmed = (why ?? '').trim()
  if (!trimmed) return false
  return !LEARNING_PATH_PLACEHOLDER_WHYS.has(trimmed)
}

export function checkLearningPathPublishResources(
  path: LearningPathData,
  userResources: Record<string, LearningPathUserResource[]> = {}
): LearningPathPublishCheck {
  const topics = path.nodes.filter((node) => node.kind !== 'goal')
  if (topics.length === 0) {
    return { ok: false, needsTopics: true, gaps: [] }
  }

  const gaps: LearningPathPublishTopicGap[] = []
  for (const node of topics) {
    const resourceCount = learningPathTopicResourceCount(
      node.resources,
      userResources[node.id] ?? []
    )
    const missingResources = resourceCount < LEARNING_PATH_PUBLISH_MIN_RESOURCES
    const missingWhy = !learningPathTopicHasWhy(node.why)
    if (!missingResources && !missingWhy) continue
    gaps.push({
      id: node.id,
      label: node.label.trim() || 'Untitled topic',
      resourceCount,
      needed: missingResources
        ? LEARNING_PATH_PUBLISH_MIN_RESOURCES - resourceCount
        : 0,
      missingWhy
    })
  }

  return { ok: gaps.length === 0, needsTopics: false, gaps }
}

function listedWhy(passage?: string, why?: string) {
  return [passage, why].filter(Boolean).join(' — ')
}

/** Copy the owner’s overlay resources onto the path JSON so visitors see them. */
export function promoteLearningPathOwnerResources(
  path: LearningPathData,
  userResources: Record<string, LearningPathUserResource[]>
): {
  path: LearningPathData
  userResources: Record<string, LearningPathUserResource[]>
} {
  const nextUserResources = { ...userResources }
  let changed = false

  const nodes = path.nodes.map((node) => {
    const mine = nextUserResources[node.id] ?? []
    if (mine.length === 0) return node
    const listed = mergeLearningPathResources(node.resources, mine)
    const resources: LearningPathResource[] = listed.map((row) => ({
      id: row.id,
      kind: row.kind,
      title: row.title,
      source: row.source ?? '',
      href: row.href,
      why: listedWhy(row.passage, row.why) || row.why
    }))
    delete nextUserResources[node.id]
    changed = true
    return { ...node, resources }
  })

  if (!changed) {
    return { path, userResources }
  }

  return {
    path: { ...path, nodes },
    userResources: nextUserResources
  }
}
