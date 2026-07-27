/**
 * User bookmarked links and tags (profile "My bookmarked links").
 * Requires getSupabaseClient() and auth.
 */
import { getSupabaseClient } from './supabase'

export interface LinkTag {
  id: string
  user_id: string
  name: string
  created_at: string
}

export interface UserLinkRow {
  id: string
  user_id: string
  url: string
  title: string | null
  note: string | null
  is_private: boolean
  created_at: string
}

export interface UserLinkWithTag extends UserLinkRow {
  tag_ids: string[]
  tag_names: string[]
}

/** Tags used on a user’s bookmarked links (public profile / filtering). */
export async function getLinkTagsByUserId(
  targetUserId: string
): Promise<LinkTag[]> {
  const supabase = getSupabaseClient()
  if (!supabase) return []
  const { data, error } = await supabase
    .from('link_tags')
    .select('id, user_id, name, created_at')
    .eq('user_id', targetUserId)
    .order('name')
  if (error) return []
  return (data || []) as LinkTag[]
}

/** Get all tags for the current user. */
export async function getMyTags(): Promise<LinkTag[]> {
  const supabase = getSupabaseClient()
  if (!supabase) return []
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return []
  const { data, error } = await supabase
    .from('link_tags')
    .select('id, user_id, name, created_at')
    .eq('user_id', user.id)
    .order('name')
  if (error) return []
  return (data || []) as LinkTag[]
}

/** Get all links for the current user, with tag ids and names. Optionally filter by tag_id. */
export async function getMyLinks(
  tagId?: string | null
): Promise<UserLinkWithTag[]> {
  const supabase = getSupabaseClient()
  if (!supabase) return []
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return []
  const q = supabase
    .from('user_links')
    .select('id, user_id, url, title, note, is_private, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  const { data: links, error } = await q
  if (error || !links?.length) return []
  const linkIds = (links as UserLinkRow[]).map((l) => l.id)
  const { data: linkTags } = await supabase
    .from('user_link_tags')
    .select('link_id, tag_id')
    .in('link_id', linkIds)
  const tagIdsByLink: Record<string, string[]> = {}
  linkIds.forEach((id) => {
    tagIdsByLink[id] = []
  })
  ;(linkTags || []).forEach((row: { link_id: string; tag_id: string }) => {
    if (!tagIdsByLink[row.link_id]) tagIdsByLink[row.link_id] = []
    tagIdsByLink[row.link_id].push(row.tag_id)
  })
  let filteredLinks = links as UserLinkRow[]
  if (tagId != null && tagId !== '') {
    filteredLinks = filteredLinks.filter((l) =>
      tagIdsByLink[l.id]?.includes(tagId)
    )
  }
  const allTagIds = [
    ...new Set((linkTags || []).map((r: { tag_id: string }) => r.tag_id))
  ]
  const tagNames: Record<string, string> = {}
  if (allTagIds.length > 0) {
    const { data: tags } = await supabase
      .from('link_tags')
      .select('id, name')
      .in('id', allTagIds)
    ;(tags || []).forEach((t: { id: string; name: string }) => {
      tagNames[t.id] = t.name
    })
  }
  return filteredLinks.map((l) => ({
    ...l,
    tag_ids: tagIdsByLink[l.id] || [],
    tag_names: (tagIdsByLink[l.id] || []).map((id) => tagNames[id] ?? id)
  }))
}

/** Get all links for a given user (for public profile). Optionally filter by tag_id. */
export async function getLinksByUserId(
  targetUserId: string,
  tagId?: string | null
): Promise<UserLinkWithTag[]> {
  const supabase = getSupabaseClient()
  if (!supabase) return []
  const { data: links, error } = await supabase
    .from('user_links')
    .select('id, user_id, url, title, note, is_private, created_at')
    .eq('user_id', targetUserId)
    .eq('is_private', false)
    .order('created_at', { ascending: false })
  if (error || !links?.length) return []
  const linkIds = (links as UserLinkRow[]).map((l) => l.id)
  const { data: linkTags } = await supabase
    .from('user_link_tags')
    .select('link_id, tag_id')
    .in('link_id', linkIds)
  const tagIdsByLink: Record<string, string[]> = {}
  linkIds.forEach((id) => {
    tagIdsByLink[id] = []
  })
  ;(linkTags || []).forEach((row: { link_id: string; tag_id: string }) => {
    if (!tagIdsByLink[row.link_id]) tagIdsByLink[row.link_id] = []
    tagIdsByLink[row.link_id].push(row.tag_id)
  })
  let filteredLinks = links as UserLinkRow[]
  if (tagId != null && tagId !== '') {
    filteredLinks = filteredLinks.filter((l) =>
      tagIdsByLink[l.id]?.includes(tagId)
    )
  }
  const allTagIds = [
    ...new Set((linkTags || []).map((r: { tag_id: string }) => r.tag_id))
  ]
  const tagNames: Record<string, string> = {}
  if (allTagIds.length > 0) {
    const { data: tags } = await supabase
      .from('link_tags')
      .select('id, name')
      .in('id', allTagIds)
    ;(tags || []).forEach((t: { id: string; name: string }) => {
      tagNames[t.id] = t.name
    })
  }
  return filteredLinks.map((l) => ({
    ...l,
    tag_ids: tagIdsByLink[l.id] || [],
    tag_names: (tagIdsByLink[l.id] || []).map((id) => tagNames[id] ?? id)
  }))
}

/** Create a tag. Returns the tag or null. If name already exists for user, returns existing. */
export async function createTag(name: string): Promise<LinkTag | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return null
  const trimmed = name.trim()
  if (!trimmed) return null
  const { data: existing } = await supabase
    .from('link_tags')
    .select('id, user_id, name, created_at')
    .eq('user_id', user.id)
    .eq('name', trimmed)
    .maybeSingle()
  if (existing) return existing as LinkTag
  const { data: inserted, error } = await supabase
    .from('link_tags')
    .insert({ user_id: user.id, name: trimmed })
    .select('id, user_id, name, created_at')
    .single()
  if (error || !inserted) return null
  return inserted as LinkTag
}

/** Add a link. title, tagIds, note, isPrivate optional. */
export async function addLink(
  url: string,
  options?: {
    title?: string | null
    tagIds?: string[]
    note?: string | null
    isPrivate?: boolean
  }
): Promise<UserLinkWithTag | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return null
  const trimmedUrl = url.trim()
  if (!trimmedUrl) return null
  const { data: inserted, error } = await supabase
    .from('user_links')
    .insert({
      user_id: user.id,
      url: trimmedUrl,
      title: options?.title?.trim() || null,
      note: options?.note?.trim() || null,
      is_private: options?.isPrivate ?? false
    })
    .select('id, user_id, url, title, note, is_private, created_at')
    .single()
  if (error || !inserted) return null
  const row = inserted as UserLinkRow
  const tagIds = options?.tagIds?.length ? options.tagIds : []
  if (tagIds.length > 0) {
    await supabase
      .from('user_link_tags')
      .insert(tagIds.map((tag_id) => ({ link_id: row.id, tag_id })))
  }
  const tagNames: string[] = []
  if (tagIds.length > 0) {
    const { data: tags } = await supabase
      .from('link_tags')
      .select('id, name')
      .in('id', tagIds)
    ;(tags || []).forEach((t: { id: string; name: string }) => {
      tagNames.push(t.name)
    })
  }
  return { ...row, tag_ids: tagIds, tag_names: tagNames }
}

/** Update a link's title, tag ids, note and/or is_private. */
export async function updateLink(
  linkId: string,
  updates: {
    title?: string | null
    tagIds?: string[]
    note?: string | null
    isPrivate?: boolean
  }
): Promise<UserLinkWithTag | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return null
  const payload: {
    title?: string | null
    note?: string | null
    is_private?: boolean
  } = {}
  if (updates.title !== undefined) payload.title = updates.title?.trim() || null
  if (updates.note !== undefined) payload.note = updates.note?.trim() || null
  if (updates.isPrivate !== undefined) payload.is_private = updates.isPrivate
  if (Object.keys(payload).length > 0) {
    const { error: updateError } = await supabase
      .from('user_links')
      .update(payload)
      .eq('id', linkId)
      .eq('user_id', user.id)
    if (updateError) return null
  }
  if (updates.tagIds !== undefined) {
    await supabase.from('user_link_tags').delete().eq('link_id', linkId)
    const tagIds = updates.tagIds.length ? updates.tagIds : []
    if (tagIds.length > 0) {
      await supabase
        .from('user_link_tags')
        .insert(tagIds.map((tag_id) => ({ link_id: linkId, tag_id })))
    }
  }
  const { data: link } = await supabase
    .from('user_links')
    .select('id, user_id, url, title, note, is_private, created_at')
    .eq('id', linkId)
    .eq('user_id', user.id)
    .single()
  if (!link) return null
  const { data: linkTagRows } = await supabase
    .from('user_link_tags')
    .select('tag_id')
    .eq('link_id', linkId)
  const tagIds = (linkTagRows || []).map((r: { tag_id: string }) => r.tag_id)
  const tagNames: string[] = []
  if (tagIds.length > 0) {
    const { data: tags } = await supabase
      .from('link_tags')
      .select('id, name')
      .in('id', tagIds)
    ;(tags || []).forEach((t: { id: string; name: string }) => {
      tagNames.push(t.name)
    })
  }
  return { ...(link as UserLinkRow), tag_ids: tagIds, tag_names: tagNames }
}

/** Delete a link. */
export async function deleteLink(linkId: string): Promise<boolean> {
  const supabase = getSupabaseClient()
  if (!supabase) return false
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return false
  const { error } = await supabase
    .from('user_links')
    .delete()
    .eq('id', linkId)
    .eq('user_id', user.id)
  return !error
}

/** Delete a tag (removes from all links via user_link_tags cascade). */
export async function deleteTag(tagId: string): Promise<boolean> {
  const supabase = getSupabaseClient()
  if (!supabase) return false
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return false
  const { error } = await supabase
    .from('link_tags')
    .delete()
    .eq('id', tagId)
    .eq('user_id', user.id)
  return !error
}
