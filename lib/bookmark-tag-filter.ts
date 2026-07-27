/** Saved-links filter: not a DB tag id; shows only Community Wall bookmarks. */
export const COMMUNITY_RESOURCE_LINK_FILTER =
  '__community_resource__' as const

export type BookmarkTagFilter = {
  /** Selected profile link tag ids (OR match). */
  tagIds: string[]
  /** When true, show only community resource bookmarks. */
  communityOnly: boolean
}

export const EMPTY_BOOKMARK_TAG_FILTER: BookmarkTagFilter = {
  tagIds: [],
  communityOnly: false
}

export function isBookmarkTagFilterActive(filter: BookmarkTagFilter): boolean {
  return filter.communityOnly || filter.tagIds.length > 0
}

export function linkMatchesBookmarkTagFilter(
  link: { tag_ids?: string[] },
  filter: BookmarkTagFilter
): boolean {
  if (filter.communityOnly) return false
  if (filter.tagIds.length === 0) return true
  const ids = link.tag_ids ?? []
  return filter.tagIds.some((id) => ids.includes(id))
}

export function shouldIncludeCommunityBookmarks(
  filter: BookmarkTagFilter
): boolean {
  return filter.communityOnly || filter.tagIds.length === 0
}

export function toggleBookmarkTagFilter(
  filter: BookmarkTagFilter,
  tagId: string
): BookmarkTagFilter {
  const selected = filter.tagIds.includes(tagId)
  return {
    communityOnly: false,
    tagIds: selected
      ? filter.tagIds.filter((id) => id !== tagId)
      : [...filter.tagIds, tagId]
  }
}

export function newLinkVisibleInBookmarkFilter(
  link: { tag_ids?: string[] },
  filter: BookmarkTagFilter
): boolean {
  return linkMatchesBookmarkTagFilter(link, filter)
}
