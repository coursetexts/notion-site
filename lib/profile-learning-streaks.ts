/**
 * Temporary mock consecutive-study streaks for Learning cards.
 * Real streak tracking is not built yet.
 */
const MOCK_STREAK_DAYS_BY_TITLE: Record<string, number> = {
  'introduction to aerospace engineering': 12,
  'i want to build a physical calculator': 5,
  'learn piano': 3
}

export function mockLearningStreakDays(title: string): number {
  const key = title.trim().toLowerCase()
  const exact = MOCK_STREAK_DAYS_BY_TITLE[key]
  if (exact) return exact
  if (key.includes('aerospace')) return 12
  if (key.includes('calculator')) return 5
  if (key.includes('piano')) return 3
  return 0
}

export function formatLearningStreakLabel(days: number): string {
  if (days <= 0) return ''
  return `${days} day streak`
}
