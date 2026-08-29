/**
 * Recognize profile “Saved links” rows that point at /learning-path/:slug
 * so we can bookmark someone else’s community learning path.
 */

import {
  isCatalogLearningPathSlug,
  SEEDED_LEARNING_PATHS_BY_SLUG,
  type StoredLearningPath
} from '@/lib/learning-path-seed'
import { titleFromSlug } from '@/lib/learning-path-slug'

const LEARNING_PATH_PATH_RE = /\/learning-path\/([^/?#]+)/i

export function learningPathHref(slug: string): string {
  return `/learning-path/${slug}`
}

export function learningPathAbsoluteUrl(slug: string, origin: string): string {
  const base = origin.replace(/\/$/, '')
  return `${base}${learningPathHref(slug)}`
}

/** Returns the path slug if URL path is /learning-path/<slug> (absolute or relative). */
export function parseLearningPathSlugFromUserLinkUrl(
  url: string
): string | null {
  const trimmed = url.trim()
  if (!trimmed) return null
  try {
    const pathOnly = trimmed.startsWith('http')
      ? new URL(trimmed).pathname
      : trimmed.split('?')[0] ?? trimmed
    const m = pathOnly.replace(/\/$/, '').match(LEARNING_PATH_PATH_RE)
    if (!m?.[1]) return null
    return decodeURIComponent(m[1])
  } catch {
    return null
  }
}

export function userLinkMatchesLearningPathSlug(
  url: string,
  slug: string
): boolean {
  return parseLearningPathSlugFromUserLinkUrl(url) === slug
}

/** Learning paths saved via the profile bookmark / Save button. */
export function learningPathsFromUserLinks(
  links: Array<{ id: string; url: string; title: string | null }>
): StoredLearningPath[] {
  const seen = new Set<string>()
  const items: StoredLearningPath[] = []
  for (const link of links) {
    const slug = parseLearningPathSlugFromUserLinkUrl(link.url)
    if (!slug || seen.has(slug)) continue
    seen.add(slug)
    const seeded = SEEDED_LEARNING_PATHS_BY_SLUG[slug]
    const title = (link.title || '').trim()
    items.push({
      id: `saved-${link.id}`,
      slug,
      goal: title || seeded?.title || seeded?.goal || titleFromSlug(slug),
      isPrivate: false,
      savedLinkId: link.id
    })
  }
  return items
}

/** Own paths first, then local drafts, then saved paths. No unsaved catalog. */
export function mergeOwnedAndSavedLearningPaths(args: {
  owned: StoredLearningPath[]
  stored?: StoredLearningPath[]
  saved: StoredLearningPath[]
}): StoredLearningPath[] {
  const ownedSlugs = new Set(args.owned.map((item) => item.slug))
  const stored = (args.stored ?? []).filter(
    (item) =>
      !ownedSlugs.has(item.slug) && !isCatalogLearningPathSlug(item.slug)
  )
  const storedSlugs = new Set(stored.map((item) => item.slug))
  const saved = args.saved.filter(
    (item) => !ownedSlugs.has(item.slug) && !storedSlugs.has(item.slug)
  )
  return [...args.owned, ...stored, ...saved]
}
