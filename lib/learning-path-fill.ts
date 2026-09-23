import type { LearningPathOutlineStep } from '@/lib/learning-path-seed'
import { normalizeLearningPathPrerequisites } from '@/lib/learning-path-seed'

export type FilledLearningPathSubconcept = {
  label: string
  why: string
  prerequisites: string[]
}

export type FilledLearningPathConcept = {
  label: string
  why: string
  prerequisites: string[]
  subconcepts: FilledLearningPathSubconcept[]
}

export type FilledLearningPathStep = {
  title: string
  why: string
  prerequisites: string[]
  concepts: FilledLearningPathConcept[]
}

export type FilledLearningPath = {
  description: string
  steps: FilledLearningPathStep[]
}

export const LEARNING_PATH_FILL_SYSTEM_PROMPT = [
  'You design learning paths for Coursetexts.',
  'A path starts from a concrete intention and works backward into the knowledge that would make someone capable of it.',
  'It is not a degree, syllabus dump, or encyclopedia. Prefer the shortest path that would actually work.',
  '',
  'The form you are filling has this structure:',
  '- description: 1–3 sentences. What this path is, and who it is for.',
  '- steps: ordered milestones on the way to the goal. Each step is a checkpoint, not a lecture title.',
  '- concepts: the knowledge (topics) that belong inside a step. Short noun-phrase labels.',
  '- subconcepts: optional finer grain under a topic. Omit them unless they clarify what to study.',
  '- why: on every step, concept, and subconcept. 1–2 sentences that say what the thing is and why it belongs on this path for this goal.',
  '- prerequisites: optional short bullet strings on a step, concept, or subconcept. Background a layman needs in order to understand that item, which is NOT already taught by an earlier step/concept/subconcept on this same path. Prefer an empty array when the path so far already covers what is needed, or when only common-sense literacy is required.',
  '',
  'Rules:',
  '- Return JSON only. No markdown, no commentary.',
  '- Write 3 to 5 steps.',
  '- Put 2 to 5 concepts (topics) in each step.',
  '- Use at most 3 subconcepts on a concept, and leave many concepts with none.',
  '- Labels are a few words. No numbering, no trailing periods, no “Week 1” prefixes.',
  '- why must be specific to the item and the goal. Do not write boilerplate such as “this is a checkpoint” or “you placed this because it sits inside the step.”',
  '- prerequisites bullets are short noun phrases or clauses (not full essays). Do not repeat the item’s own label, do not list later topics on the path, and do not restate topics that appear earlier in the outline.',
  '- Use 0 to 4 prerequisite bullets per item. Many items should have none.',
  '- Do not invent URLs, courses, authors, or resource lists.',
  '- Do not repeat the goal as a step title.',
  '- Keep the path specific to the stated goal, not a generic intro to the whole field.'
].join('\n')

export const LEARNING_PATH_FILL_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    description: { type: 'string' },
    steps: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          why: { type: 'string' },
          prerequisites: {
            type: 'array',
            items: { type: 'string' }
          },
          concepts: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                label: { type: 'string' },
                why: { type: 'string' },
                prerequisites: {
                  type: 'array',
                  items: { type: 'string' }
                },
                subconcepts: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      label: { type: 'string' },
                      why: { type: 'string' },
                      prerequisites: {
                        type: 'array',
                        items: { type: 'string' }
                      }
                    },
                    required: ['label', 'why', 'prerequisites']
                  }
                }
              },
              required: ['label', 'why', 'prerequisites', 'subconcepts']
            }
          }
        },
        required: ['title', 'why', 'prerequisites', 'concepts']
      }
    }
  },
  required: ['description', 'steps']
} as const

const MAX_STEPS = 6
const MAX_CONCEPTS = 6
const MAX_SUBCONCEPTS = 4
const MAX_LABEL = 120
const MAX_DESCRIPTION = 800
const MAX_WHY = 420

export function buildLearningPathFillUserPrompt(
  goal: string,
  revision?: { changes?: string; currentOutline?: string }
) {
  const changes = revision?.changes?.trim() ?? ''
  const currentOutline = revision?.currentOutline?.trim() ?? ''
  const lines = [
    'Fill the learning-path form for this goal:',
    '',
    goal.trim()
  ]
  if (changes) {
    lines.push(
      '',
      'The learner already generated a path and wants another version.',
      'Apply the notes below. Keep parts they did not ask to change.'
    )
    if (currentOutline) {
      lines.push('', 'Current path:', currentOutline)
    }
    lines.push('', 'What they want changed:', changes)
  }
  lines.push(
    '',
    'Respond with JSON of the form:',
    '{"description": string, "steps": [{"title": string, "why": string, "prerequisites": string[], "concepts": [{"label": string, "why": string, "prerequisites": string[], "subconcepts": [{"label": string, "why": string, "prerequisites": string[]}]}]}]}',
    '',
    'For each step, concept, and subconcept, set prerequisites to background a layman still needs that is not already covered earlier on this path. Use [] when nothing extra is needed.'
  )
  return lines.join('\n')
}

export function extractJsonObject(text: string): unknown {
  const trimmed = text.trim()
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const raw = (fence ? fence[1] : trimmed).trim()

  try {
    return JSON.parse(raw)
  } catch {
    const start = raw.indexOf('{')
    const end = raw.lastIndexOf('}')
    if (start < 0 || end <= start) {
      throw new Error('Model did not return JSON')
    }
    return JSON.parse(raw.slice(start, end + 1))
  }
}

function clip(value: string, max: number) {
  const next = value.replace(/\s+/g, ' ').trim()
  if (next.length <= max) return next
  return next.slice(0, max).trim()
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function readList(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function readPrerequisites(record: Record<string, unknown> | null): string[] {
  if (!record) return []
  return normalizeLearningPathPrerequisites(
    record.prerequisites ?? record.prereqs ?? record.background
  )
}

function normalizeSubconcept(raw: unknown): FilledLearningPathSubconcept | null {
  if (typeof raw === 'string') {
    const label = clip(raw, MAX_LABEL)
    return label ? { label, why: '', prerequisites: [] } : null
  }
  const record = asRecord(raw)
  const label = clip(
    readString(record?.label ?? record?.title ?? record?.name),
    MAX_LABEL
  )
  if (!label) return null
  return {
    label,
    why: clip(readString(record?.why), MAX_WHY),
    prerequisites: readPrerequisites(record)
  }
}

function normalizeConcept(raw: unknown): FilledLearningPathConcept | null {
  const record = asRecord(raw)
  const label = clip(
    readString(record?.label ?? record?.title ?? record?.name ?? raw),
    MAX_LABEL
  )
  if (!label) return null

  const nested = record
    ? record.subconcepts ?? record.subConcepts ?? record.subs
    : []
  const subconcepts = readList(nested)
    .map(normalizeSubconcept)
    .filter((item): item is FilledLearningPathSubconcept => Boolean(item))
    .slice(0, MAX_SUBCONCEPTS)

  return {
    label,
    why: clip(readString(record?.why), MAX_WHY),
    prerequisites: readPrerequisites(record),
    subconcepts
  }
}

function normalizeStep(raw: unknown): FilledLearningPathStep | null {
  const record = asRecord(raw)
  if (!record) return null
  const title = clip(readString(record.title ?? record.name ?? record.label), MAX_LABEL)
  if (!title) return null

  const concepts = readList(record.concepts ?? record.topics)
    .map(normalizeConcept)
    .filter((item): item is FilledLearningPathConcept => Boolean(item))
    .slice(0, MAX_CONCEPTS)

  if (concepts.length === 0) return null
  return {
    title,
    why: clip(readString(record.why), MAX_WHY),
    prerequisites: readPrerequisites(record),
    concepts
  }
}

export function normalizeFilledLearningPath(raw: unknown): FilledLearningPath | null {
  const record = asRecord(raw)
  if (!record) return null

  const steps = readList(record.steps ?? record.milestones)
    .map(normalizeStep)
    .filter((item): item is FilledLearningPathStep => Boolean(item))
    .slice(0, MAX_STEPS)

  if (steps.length === 0) return null

  return {
    description: clip(readString(record.description ?? record.summary), MAX_DESCRIPTION),
    steps
  }
}

export function outlineFromFilledLearningPath(
  filled: FilledLearningPath,
  newId: (prefix: string) => string
): LearningPathOutlineStep[] {
  return filled.steps.map((step) => ({
    id: newId('st'),
    title: step.title,
    why: step.why,
    ...(step.prerequisites.length
      ? { prerequisites: step.prerequisites }
      : {}),
    concepts: step.concepts.map((concept) => ({
      id: newId('c'),
      label: concept.label,
      why: concept.why,
      ...(concept.prerequisites.length
        ? { prerequisites: concept.prerequisites }
        : {}),
      subconcepts: (concept.subconcepts.length > 0
        ? concept.subconcepts
        : [{ label: '', why: '', prerequisites: [] as string[] }]
      ).map((sub) => ({
        id: newId('s'),
        label: sub.label,
        why: sub.why,
        ...(sub.prerequisites.length
          ? { prerequisites: sub.prerequisites }
          : {})
      }))
    }))
  }))
}
