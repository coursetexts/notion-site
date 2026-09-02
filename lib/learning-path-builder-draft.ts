import type {
  LearningPathKind,
  LearningPathOutlineStep
} from '@/lib/learning-path-seed'

const BUILDER_DRAFT_KEY = 'coursetexts.learning-path-builder-draft'

export type LearningPathBuilderDraft = {
  goal: string
  kind: LearningPathKind
  description: string
  steps: LearningPathOutlineStep[]
}

function asDraft(value: unknown): LearningPathBuilderDraft | null {
  if (!value || typeof value !== 'object') return null
  const record = value as Partial<LearningPathBuilderDraft>
  if (typeof record.goal !== 'string' || !record.goal.trim()) return null
  if (record.kind !== 'research' && record.kind !== 'community') return null
  if (!Array.isArray(record.steps)) return null
  return {
    goal: record.goal,
    kind: record.kind,
    description:
      typeof record.description === 'string' ? record.description : '',
    steps: record.steps
  }
}

function parseDraft(raw: string | null): LearningPathBuilderDraft | null {
  if (!raw) return null
  try {
    return asDraft(JSON.parse(raw))
  } catch {
    return null
  }
}

export function writeLearningPathBuilderDraft(draft: LearningPathBuilderDraft) {
  if (typeof window === 'undefined') return
  const raw = JSON.stringify(draft)
  window.sessionStorage.setItem(BUILDER_DRAFT_KEY, raw)
  try {
    window.localStorage.setItem(BUILDER_DRAFT_KEY, raw)
  } catch {
    // Private mode can block localStorage.
  }
}

export function readLearningPathBuilderDraft(
  goal: string,
  kind: LearningPathKind
): LearningPathBuilderDraft | null {
  if (typeof window === 'undefined') return null
  if (!goal.trim()) return null
  let draft = parseDraft(window.sessionStorage.getItem(BUILDER_DRAFT_KEY))
  if (!draft) {
    try {
      draft = parseDraft(window.localStorage.getItem(BUILDER_DRAFT_KEY))
    } catch {
      draft = null
    }
  }
  if (!draft) return null
  if (draft.kind !== kind) return null
  if (draft.goal.trim() !== goal.trim()) return null
  return draft
}

export function clearLearningPathBuilderDraft() {
  if (typeof window === 'undefined') return
  window.sessionStorage.removeItem(BUILDER_DRAFT_KEY)
  try {
    window.localStorage.removeItem(BUILDER_DRAFT_KEY)
  } catch {
    // ignore
  }
}
