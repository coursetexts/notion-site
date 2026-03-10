/**
 * Follows and public profile helpers.
 * Requires getSupabaseClient() (browser).
 */

import { getSupabaseClient } from './supabase'
import type { Profile } from './supabase-types'
import type { Course } from './course-activity-db'
import type { Comment, Annotation, Bookmark } from './course-activity-db'

export type PublicProfile = Pick<
  Profile,
  'user_id' | 'display_name' | 'avatar_url'
>

/** Get profile by user_id (for public profile page). */
export async function getProfileByUserId(userId: string): Promise<PublicProfile | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null
  const { data, error } = await supabase
    .from('profiles')
    .select('user_id, display_name, avatar_url')
    .eq('user_id', userId)
    .maybeSingle()
  if (error || !data) return null
  return data as PublicProfile
}

/** Check if current user follows targetUserId. */
export async function getFollowStatus(
  currentUserId: string | null,
  targetUserId: string
): Promise<boolean> {
  if (!currentUserId || currentUserId === targetUserId) return false
  const supabase = getSupabaseClient()
  if (!supabase) return false
  const { data } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('follower_id', currentUserId)
    .eq('following_id', targetUserId)
    .maybeSingle()
  return !!data
}

/** Follow a user. Returns true on success. */
export async function followUser(
  followerId: string,
  followingId: string
): Promise<boolean> {
  if (followerId === followingId) return false
  const supabase = getSupabaseClient()
  if (!supabase) return false
  const { error } = await supabase
    .from('follows')
    .insert({ follower_id: followerId, following_id: followingId })
  return !error
}

/** Unfollow a user. Returns true on success. */
export async function unfollowUser(
  followerId: string,
  followingId: string
): Promise<boolean> {
  const supabase = getSupabaseClient()
  if (!supabase) return false
  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
  return !error
}

/** Get list of user IDs the current user follows (for "following" tag). */
export async function getFollowingIds(currentUserId: string | null): Promise<string[]> {
  if (!currentUserId) return []
  const supabase = getSupabaseClient()
  if (!supabase) return []
  const { data, error } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', currentUserId)
  if (error) return []
  return (data || []).map((r: { following_id: string }) => r.following_id)
}

/** Get list of user IDs who follow the current user (for "follows you" tag). */
export async function getFollowerIds(currentUserId: string | null): Promise<string[]> {
  if (!currentUserId) return []
  const supabase = getSupabaseClient()
  if (!supabase) return []
  const { data, error } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('following_id', currentUserId)
  if (error) return []
  return (data || []).map((r: { follower_id: string }) => r.follower_id)
}

/** Get following count for a user. */
export async function getFollowingCount(userId: string): Promise<number> {
  const supabase = getSupabaseClient()
  if (!supabase) return 0
  const { count, error } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('follower_id', userId)
  return error ? 0 : count ?? 0
}

/** Get followers count for a user. */
export async function getFollowersCount(userId: string): Promise<number> {
  const supabase = getSupabaseClient()
  if (!supabase) return 0
  const { count, error } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('following_id', userId)
  return error ? 0 : count ?? 0
}

export interface ProfileListItem {
  user_id: string
  display_name: string | null
  avatar_url: string | null
}

/** Get list of users that userId follows (with profile). */
export async function getFollowingList(userId: string): Promise<ProfileListItem[]> {
  const supabase = getSupabaseClient()
  if (!supabase) return []
  const { data: rows, error } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', userId)
  if (error || !rows?.length) return []
  const ids = rows.map((r: { following_id: string }) => r.following_id)
  const { data: profiles } = await supabase
    .from('profiles')
    .select('user_id, display_name, avatar_url')
    .in('user_id', ids)
  const byId = (profiles || []).reduce((acc: Record<string, ProfileListItem>, p: any) => {
    acc[p.user_id] = {
      user_id: p.user_id,
      display_name: p.display_name,
      avatar_url: p.avatar_url
    }
    return acc
  }, {})
  return ids.map((id) => byId[id]).filter(Boolean)
}

/** Get list of users who follow userId. */
export async function getFollowersList(userId: string): Promise<ProfileListItem[]> {
  const supabase = getSupabaseClient()
  if (!supabase) return []
  const { data: rows, error } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('following_id', userId)
  if (error || !rows?.length) return []
  const ids = rows.map((r: { follower_id: string }) => r.follower_id)
  const { data: profiles } = await supabase
    .from('profiles')
    .select('user_id, display_name, avatar_url')
    .in('user_id', ids)
  const byId = (profiles || []).reduce((acc: Record<string, ProfileListItem>, p: any) => {
    acc[p.user_id] = {
      user_id: p.user_id,
      display_name: p.display_name,
      avatar_url: p.avatar_url
    }
    return acc
  }, {})
  return ids.map((id) => byId[id]).filter(Boolean)
}

/** Bookmarks for a given user (public profile). */
export async function getBookmarksByUser(
  userId: string
): Promise<{ bookmark: Bookmark; course: Course }[]> {
  const supabase = getSupabaseClient()
  if (!supabase) return []
  const { data: bookmarkRows, error: err1 } = await supabase
    .from('bookmarks')
    .select('id, user_id, course_id, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (err1 || !bookmarkRows?.length) return []
  const courseIds = bookmarkRows.map((b: any) => b.course_id)
  const { data: courses, error: err2 } = await supabase
    .from('courses')
    .select('notion_page_id, name, url, created_at')
    .in('notion_page_id', courseIds)
  if (err2 || !courses?.length) return []
  const courseById = (courses as Course[]).reduce((acc, c) => {
    acc[c.notion_page_id] = c
    return acc
  }, {} as Record<string, Course>)
  return bookmarkRows
    .map((b: any) => ({
      bookmark: {
        id: b.id,
        user_id: b.user_id,
        course_id: b.course_id,
        created_at: b.created_at
      } as Bookmark,
      course: courseById[b.course_id]
    }))
    .filter((x) => x.course)
}

/** Comments by a given user with course and author (for public profile). */
export async function getCommentsByUser(
  userId: string
): Promise<{ comment: Comment; course: Course }[]> {
  const supabase = getSupabaseClient()
  if (!supabase) return []
  const { data: commentRows, error: err1 } = await supabase
    .from('comments')
    .select('id, user_id, course_id, parent_comment_id, body, created_at, updated_at')
    .eq('user_id', userId)
    .is('parent_comment_id', null)
    .order('created_at', { ascending: false })
  if (err1 || !commentRows?.length) return []
  const courseIds = [...new Set(commentRows.map((c: any) => c.course_id))]
  const { data: courses } = await supabase
    .from('courses')
    .select('notion_page_id, name, url, created_at')
    .in('notion_page_id', courseIds)
  const { data: profile } = await supabase
    .from('profiles')
    .select('user_id, display_name, avatar_url')
    .eq('user_id', userId)
    .maybeSingle()
  const courseById = (courses || []).reduce((acc: Record<string, Course>, c: any) => {
    acc[c.notion_page_id] = c
    return acc
  }, {})
  const author = profile
    ? { display_name: profile.display_name, avatar_url: profile.avatar_url }
    : undefined
  return commentRows
    .map((c: any) => ({
      comment: { ...c, author } as Comment,
      course: courseById[c.course_id]
    }))
    .filter((x) => x.course)
}

/** Annotations by a given user (for public profile). */
export async function getAnnotationsByUser(
  userId: string
): Promise<{ annotation: Annotation; course: Course }[]> {
  const supabase = getSupabaseClient()
  if (!supabase) return []
  const { data: annotationRows, error: err1 } = await supabase
    .from('annotations')
    .select(
      'id, user_id, course_id, section_id, parent_annotation_id, body, created_at, updated_at'
    )
    .eq('user_id', userId)
    .is('parent_annotation_id', null)
    .order('created_at', { ascending: false })
  if (err1 || !annotationRows?.length) return []
  const courseIds = [...new Set(annotationRows.map((a: any) => a.course_id))]
  const { data: courses } = await supabase
    .from('courses')
    .select('notion_page_id, name, url, created_at')
    .in('notion_page_id', courseIds)
  const { data: profile } = await supabase
    .from('profiles')
    .select('user_id, display_name, avatar_url')
    .eq('user_id', userId)
    .maybeSingle()
  const courseById = (courses || []).reduce((acc: Record<string, Course>, c: any) => {
    acc[c.notion_page_id] = c
    return acc
  }, {})
  const author = profile
    ? { display_name: profile.display_name, avatar_url: profile.avatar_url }
    : undefined
  return annotationRows
    .map((a: any) => ({
      annotation: { ...a, author } as Annotation,
      course: courseById[a.course_id]
    }))
    .filter((x) => x.course)
}
