export type BookmarkTagFilter = {
  /** Selected profile link tag ids (OR match). */
  tagIds: string[]
}

export const EMPTY_BOOKMARK_TAG_FILTER: BookmarkTagFilter = {
  tagIds: []
}

export function isBookmarkTagFilterActive(filter: BookmarkTagFilter): boolean {
  return filter.tagIds.length > 0
}

export function linkMatchesBookmarkTagFilter(
  link: { tag_ids?: string[] },
  filter: BookmarkTagFilter
): boolean {
  if (filter.tagIds.length === 0) return true
  const ids = link.tag_ids ?? []
  return filter.tagIds.some((id) => ids.includes(id))
}

export function toggleBookmarkTagFilter(
  filter: BookmarkTagFilter,
  tagId: string
): BookmarkTagFilter {
  const selected = filter.tagIds.includes(tagId)
  return {
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
