export const LEARNING_PATH_RATING_TARGET = '__path__'

export type LearningPathRatingTargetType = 'topic' | 'path'

export type LearningPathRating = {
  pathSlug: string
  pathId: string | null
  targetType: LearningPathRatingTargetType
  targetId: string
  targetTitle: string
  rating: number
  durationMs: number
}

const STORAGE_PREFIX = 'coursetexts.learning-path-ratings:'

function storageKey(slug: string) {
  return `${STORAGE_PREFIX}${slug}`
}

function readLocalAll(slug: string): LearningPathRating[] {
  if (typeof window === 'undefined' || !slug) return []
  try {
    const raw = window.localStorage.getItem(storageKey(slug))
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.flatMap((row) => {
      if (!row || typeof row !== 'object') return []
      const item = row as Record<string, unknown>
      const rating = item.rating
      if (
        typeof item.pathSlug !== 'string' ||
        (item.targetType !== 'topic' && item.targetType !== 'path') ||
        typeof item.targetId !== 'string' ||
        typeof item.targetTitle !== 'string' ||
        typeof rating !== 'number' ||
        rating < 0 ||
        rating > 100
      ) {
        return []
      }
      return [
        {
          pathSlug: item.pathSlug,
          pathId: typeof item.pathId === 'string' ? item.pathId : null,
          targetType: item.targetType,
          targetId: item.targetId,
          targetTitle: item.targetTitle,
          rating,
          durationMs:
            typeof item.durationMs === 'number' && item.durationMs >= 0
              ? item.durationMs
              : 0
        }
      ]
    })
  } catch {
    return []
  }
}

function writeLocalAll(slug: string, rows: LearningPathRating[]) {
  if (typeof window === 'undefined' || !slug) return
  try {
    window.localStorage.setItem(storageKey(slug), JSON.stringify(rows))
  } catch {
    /* quota / private mode */
  }
}

export function hasLocalLearningPathRating(
  slug: string,
  targetType: LearningPathRatingTargetType,
  targetId: string
): boolean {
  return readLocalAll(slug).some(
    (row) => row.targetType === targetType && row.targetId === targetId
  )
}

export function saveLocalLearningPathRating(rating: LearningPathRating) {
  const rows = readLocalAll(rating.pathSlug).filter(
    (row) =>
      !(
        row.targetType === rating.targetType && row.targetId === rating.targetId
      )
  )
  rows.push(rating)
  writeLocalAll(rating.pathSlug, rows)
}

function parseNonNegativeInt(value: string): number | null {
  const trimmed = value.trim()
  if (trimmed === '') return null
  const n = Number(trimmed)
  if (!Number.isFinite(n) || n < 0 || n !== Math.floor(n)) return null
  return n
}

export function parseLearningPathFeedback(
  hours: string,
  minutes: string,
  percent: string
): { rating: number; durationMs: number } | null {
  const hoursFilled = hours.trim() !== ''
  const minutesFilled = minutes.trim() !== ''
  if (!hoursFilled && !minutesFilled) return null
  const h = hoursFilled ? parseNonNegativeInt(hours) : 0
  const m = minutesFilled ? parseNonNegativeInt(minutes) : 0
  if (h === null || m === null) return null
  const ratingTrimmed = percent.trim()
  if (ratingTrimmed === '') return null
  const rating = Number(ratingTrimmed)
  if (!Number.isFinite(rating) || rating < 0 || rating > 100) return null
  return {
    rating: Math.round(rating),
    durationMs: h * 60 * 60 * 1000 + m * 60 * 1000
  }
}
