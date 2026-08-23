/** Turn a learning-goal sentence into a URL slug. */

export function slugifyLearningPathName(input: string): string {
  const withoutPrefix = input.trim().replace(/^i want to\s+/i, '')
  const slug = withoutPrefix
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
  return slug || 'learning-path'
}

export function ensureUniqueSlug(
  slug: string,
  existing: Iterable<string>
): string {
  const taken = new Set(existing)
  if (!taken.has(slug)) return slug
  let i = 2
  while (taken.has(`${slug}-${i}`)) i += 1
  return `${slug}-${i}`
}

export function titleFromSlug(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
