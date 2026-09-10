/** Own-profile primary tabs (labels + URL slugs + internal ids). */

export type OwnProfileMainTab =
  | 'learning-path'
  | 'knowledge'
  | 'notes'
  | 'activity'
  | 'bookmarks'
  | 'notifications'

export type OwnProfileTabLink = {
  id: OwnProfileMainTab
  slug: string
  label: string
}

export const OWN_PROFILE_TAB_LINKS: OwnProfileTabLink[] = [
  { id: 'learning-path', slug: 'learning', label: 'Learning' },
  { id: 'knowledge', slug: 'knowledge', label: 'Knowledge' },
  { id: 'notes', slug: 'notes', label: 'Notes' },
  { id: 'bookmarks', slug: 'resources', label: 'Resources' },
  { id: 'activity', slug: 'feed', label: 'Feed' },
  { id: 'notifications', slug: 'notifications', label: 'Notifications' }
]

export function ownProfileTabHref(slug: string): string {
  return `/profile?tab=${encodeURIComponent(slug)}`
}

export function ownProfileTabSlug(tab: OwnProfileMainTab): string {
  return (
    OWN_PROFILE_TAB_LINKS.find((item) => item.id === tab)?.slug ?? 'learning'
  )
}

export function parseOwnProfileTabParam(
  value: string | string[] | undefined
): OwnProfileMainTab | null {
  const raw = Array.isArray(value) ? value[0] : value
  const slug = (raw ?? '').trim().toLowerCase()
  if (!slug) return null
  const match = OWN_PROFILE_TAB_LINKS.find(
    (item) => item.slug === slug || item.id === slug
  )
  return match?.id ?? null
}
