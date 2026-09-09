const DEFAULT_VISIBLE_ITEMS = 2

/** Split free-text learning fields into display items. */
export function parseLearningItems(text: string): string[] {
  const parts = text
    .split(/\n|[;]/)
    .flatMap((line) => line.split(/\s*[·•,]\s*/))
    .map((item) => item.trim())
    .filter(Boolean)

  const seen = new Set<string>()
  const items: string[] = []
  for (const part of parts) {
    const key = part.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    items.push(part)
  }
  return items
}

export function getLearningMetadataVisibleItems(
  items: string[],
  maxVisible = DEFAULT_VISIBLE_ITEMS
): string[] {
  return items.slice(0, maxVisible)
}

export function getLearningMetadataHiddenCount(
  items: string[],
  maxVisible = DEFAULT_VISIBLE_ITEMS
): number {
  return Math.max(0, items.length - maxVisible)
}

/** One-line metadata value, e.g. "ZK proofs · Machine learning · +3". */
export function formatLearningMetadataLine(
  items: string[],
  maxVisible = DEFAULT_VISIBLE_ITEMS
): string {
  if (items.length === 0) return ''
  const visible = items.slice(0, maxVisible)
  const hiddenCount = items.length - visible.length
  const parts = [...visible]
  if (hiddenCount > 0) parts.push(`+${hiddenCount}`)
  return parts.join(' · ')
}

export function formatLearningMetadataFullLine(items: string[]): string {
  return items.join(' · ')
}

export function learningMetadataHasHiddenItems(
  items: string[],
  maxVisible = DEFAULT_VISIBLE_ITEMS
): boolean {
  return items.length > maxVisible
}
