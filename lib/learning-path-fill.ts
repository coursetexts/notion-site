import type { LearningPathOutlineStep } from '@/lib/learning-path-seed'

export type FilledLearningPathSubconcept = {
  label: string
  why: string
}

export type FilledLearningPathConcept = {
  label: string
  why: string
  subconcepts: FilledLearningPathSubconcept[]
}

export type FilledLearningPathStep = {
  title: string
  why: string
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
  '- concepts: the knowledge that belongs inside a step. Short noun-phrase labels.',
  '- subconcepts: optional finer grain under a concept. Omit them unless they clarify what to study.',
  '- why: on every step, concept, and subconcept. 1–2 sentences that say what the thing is and why it belongs on this path for this goal.',
  '',
  'Rules:',
  '- Return JSON only. No markdown, no commentary.',
  '- Write 3 to 5 steps.',
  '- Put 2 to 5 concepts in each step.',
  '- Use at most 3 subconcepts on a concept, and leave many concepts with none.',
  '- Labels are a few words. No numbering, no trailing periods, no “Week 1” prefixes.',
  '- why must be specific to the item and the goal. Do not write boilerplate such as “this is a checkpoint” or “you placed this because it sits inside the step.”',
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
          concepts: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                label: { type: 'string' },
                why: { type: 'string' },
                subconcepts: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      label: { type: 'string' },
                      why: { type: 'string' }
                    },
                    required: ['label', 'why']
                  }
                }
              },
              required: ['label', 'why', 'subconcepts']
            }
          }
        },
        required: ['title', 'why', 'concepts']
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

export function buildLearningPathFillUserPrompt(goal: string) {
  return [
    'Fill the learning-path form for this goal:',
    '',
    goal.trim(),
    '',
    'Respond with JSON of the form:',
    '{"description": string, "steps": [{"title": string, "why": string, "concepts": [{"label": string, "why": string, "subconcepts": [{"label": string, "why": string}]}]}]}'
  ].join('\n')
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

function normalizeSubconcept(raw: unknown): FilledLearningPathSubconcept | null {
  if (typeof raw === 'string') {
    const label = clip(raw, MAX_LABEL)
    return label ? { label, why: '' } : null
  }
  const record = asRecord(raw)
  const label = clip(
    readString(record?.label ?? record?.title ?? record?.name),
    MAX_LABEL
  )
  if (!label) return null
  return {
    label,
    why: clip(readString(record?.why), MAX_WHY)
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
    concepts: step.concepts.map((concept) => ({
      id: newId('c'),
      label: concept.label,
      why: concept.why,
      subconcepts: (concept.subconcepts.length > 0
        ? concept.subconcepts
        : [{ label: '', why: '' }]
      ).map((sub) => ({
        id: newId('s'),
        label: sub.label,
        why: sub.why
      }))
    }))
  }))
}
