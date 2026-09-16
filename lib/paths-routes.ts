/** Canonical URLs for the Paths by Coursetexts product (mounted under `/paths`). */

export const PATHS_BASE = '/paths'

export function pathsHomeHref(): string {
  return PATHS_BASE
}

export function pathsCatalogHref(
  query?: Record<string, string | undefined>
): string {
  const params = new URLSearchParams()
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value != null && value !== '') params.set(key, value)
    }
  }
  const qs = params.toString()
  return qs ? `${PATHS_BASE}/all-courses?${qs}` : `${PATHS_BASE}/all-courses`
}

export function pathsLearningPathHref(slug: string): string {
  return `${PATHS_BASE}/learning-path/${encodeURIComponent(slug)}`
}

export function pathsNewLearningPathHref(query?: {
  goal?: string
  kind?: string
}): string {
  const params = new URLSearchParams()
  if (query?.goal) params.set('goal', query.goal)
  if (query?.kind) params.set('kind', query.kind)
  const qs = params.toString()
  return qs
    ? `${PATHS_BASE}/learning-path/new?${qs}`
    : `${PATHS_BASE}/learning-path/new`
}

export function pathsLearningPathsIndexHref(): string {
  return `${PATHS_BASE}/learning-paths`
}

export function pathsProfileHref(tab?: string): string {
  if (!tab) return `${PATHS_BASE}/profile`
  return `${PATHS_BASE}/profile?tab=${encodeURIComponent(tab)}`
}

export function pathsPublicProfileHref(userId: string): string {
  return `${PATHS_BASE}/profile/${encodeURIComponent(userId)}`
}

export function pathsCommunityHref(): string {
  return `${PATHS_BASE}/community`
}

export function pathsCommunityResourcesHref(): string {
  return `${PATHS_BASE}/community-resources`
}

export function pathsDegreesHref(): string {
  return `${PATHS_BASE}/degrees`
}

export function pathsKnowledgeGraphHref(): string {
  return `${PATHS_BASE}/knowledge-graph`
}

export function pathsFieldAtlasHref(): string {
  return `${PATHS_BASE}/field-atlas`
}

export function pathsUsersHref(): string {
  return `${PATHS_BASE}/users`
}

/** True when the current Next.js pathname is under the Paths product. */
export function isPathsProductPathname(pathname: string | null | undefined): boolean {
  if (!pathname) return false
  return pathname === PATHS_BASE || pathname.startsWith(`${PATHS_BASE}/`)
}
