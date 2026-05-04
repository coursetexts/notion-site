import type { SupabaseClient, User } from '@supabase/supabase-js'

import type { Course } from './course-activity-db'
import { getSupabaseClient } from './supabase'

type AuthorFields = { display_name: string | null; avatar_url: string | null }

async function authorForUser(
  supabase: SupabaseClient,
  user: User
): Promise<AuthorFields> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, avatar_url')
    .eq('user_id', user.id)
    .maybeSingle()
  const meta = user.user_metadata || {}
  const fromMetaName =
    (meta.full_name as string | undefined) ||
    (meta.name as string | undefined) ||
    (meta.display_name as string | undefined) ||
    null
  const fromMetaAvatar = (meta.avatar_url as string | undefined) || null
  return {
    display_name: profile?.display_name ?? fromMetaName ?? null,
    avatar_url: profile?.avatar_url ?? fromMetaAvatar ?? null
  }
}

export interface CommunityResource {
  id: string
  course_id: string
  user_id: string
  title: string
  description: string
  link: string | null
  is_pinned: boolean
  created_at: string
  updated_at: string
  author?: AuthorFields
  score?: number
  user_vote?: number | null
  comment_count?: number
  is_bookmarked?: boolean
}

export interface CommunityResourceComment {
  id: string
  resource_id: string
  user_id: string
  body: string
  created_at: string
  updated_at: string
  author?: AuthorFields
}

export interface CourseResourceBookmark {
  id: string
  user_id: string
  resource_id: string
  created_at: string
}

export type CommunityResourceBookmarkWithCourse = {
  bookmark: CourseResourceBookmark
  resource: CommunityResource
  course: Course
}

async function getVoteSummaries(
  resourceIds: string[]
): Promise<Record<string, { score: number; user_vote: number | null }>> {
  const supabase = getSupabaseClient()
  if (!supabase || resourceIds.length === 0) return {}
  const {
    data: { user }
  } = await supabase.auth.getUser()
  const { data: rows, error } = await supabase
    .from('course_resource_votes')
    .select('user_id, resource_id, value')
    .in('resource_id', resourceIds)
  if (error) return {}
  const byId: Record<string, { score: number; user_vote: number | null }> = {}
  resourceIds.forEach((id) => (byId[id] = { score: 0, user_vote: null }))
  ;(rows || []).forEach(
    (r: { user_id: string; resource_id: string; value: number }) => {
      if (!byId[r.resource_id]) return
      byId[r.resource_id].score += r.value
      if (user && r.user_id === user.id) byId[r.resource_id].user_vote = r.value
    }
  )
  return byId
}

async function getCommentCounts(
  resourceIds: string[]
): Promise<Record<string, number>> {
  const supabase = getSupabaseClient()
  if (!supabase || resourceIds.length === 0) return {}
  const { data: rows, error } = await supabase
    .from('course_resource_comments')
    .select('resource_id')
    .in('resource_id', resourceIds)
  if (error) return {}
  const counts: Record<string, number> = {}
  resourceIds.forEach((id) => (counts[id] = 0))
  ;(rows || []).forEach((r: { resource_id: string }) => {
    if (counts[r.resource_id] == null) counts[r.resource_id] = 0
    counts[r.resource_id] += 1
  })
  return counts
}

async function getBookmarkMap(
  resourceIds: string[]
): Promise<Record<string, boolean>> {
  const supabase = getSupabaseClient()
  if (!supabase || resourceIds.length === 0) return {}
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return {}
  const { data: rows, error } = await supabase
    .from('course_resource_bookmarks')
    .select('resource_id')
    .eq('user_id', user.id)
    .in('resource_id', resourceIds)
  if (error) return {}
  const map: Record<string, boolean> = {}
  ;(rows || []).forEach((r: { resource_id: string }) => {
    map[r.resource_id] = true
  })
  return map
}

export async function getCommunityResources(
  courseId: string
): Promise<CommunityResource[]> {
  const supabase = getSupabaseClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('course_resources')
    .select(
      'id, course_id, user_id, title, description, link, is_pinned, created_at, updated_at'
    )
    .eq('course_id', courseId)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) return []
  const resources = (data || []) as CommunityResource[]
  if (resources.length === 0) return []

  const userIds = [...new Set(resources.map((r) => r.user_id))]
  const resourceIds = resources.map((r) => r.id)

  const [profilesRes, voteMap, commentCounts, bookmarkMap] = await Promise.all([
    supabase
      .from('profiles')
      .select('user_id, display_name, avatar_url')
      .in('user_id', userIds),
    getVoteSummaries(resourceIds),
    getCommentCounts(resourceIds),
    getBookmarkMap(resourceIds)
  ])

  const profileByUser = (profilesRes?.data || []).reduce(
    (acc: Record<string, AuthorFields>, p: any) => {
      acc[p.user_id] = {
        display_name: p.display_name,
        avatar_url: p.avatar_url
      }
      return acc
    },
    {}
  )

  return resources.map((r) => ({
    ...r,
    author: profileByUser[r.user_id],
    score: voteMap[r.id]?.score ?? 0,
    user_vote: voteMap[r.id]?.user_vote ?? null,
    comment_count: commentCounts[r.id] ?? 0,
    is_bookmarked: bookmarkMap[r.id] ?? false
  }))
}

export async function addCommunityResource(
  courseId: string,
  input: { title: string; description: string; link?: string | null }
): Promise<CommunityResource | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('course_resources')
    .insert({
      course_id: courseId,
      user_id: user.id,
      title: input.title,
      description: input.description,
      link: input.link ?? null,
      is_pinned: false
    })
    .select(
      'id, course_id, user_id, title, description, link, is_pinned, created_at, updated_at'
    )
    .single()

  if (error || !data) return null
  const author = await authorForUser(supabase, user)
  return {
    ...(data as CommunityResource),
    author,
    score: 0,
    user_vote: null,
    comment_count: 0,
    is_bookmarked: false
  }
}

export async function setCommunityResourceVote(
  resourceId: string,
  value: 1 | -1 | null
): Promise<number | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return null
  if (value === null) {
    const { error } = await supabase
      .from('course_resource_votes')
      .delete()
      .eq('user_id', user.id)
      .eq('resource_id', resourceId)
    if (error) return null
  } else {
    const { error } = await supabase.from('course_resource_votes').upsert(
      {
        user_id: user.id,
        resource_id: resourceId,
        value
      },
      { onConflict: 'user_id,resource_id' }
    )
    if (error) return null
  }
  const { data: rows } = await supabase
    .from('course_resource_votes')
    .select('value')
    .eq('resource_id', resourceId)
  const score = (rows || []).reduce(
    (s, r) => s + (r as { value: number }).value,
    0
  )
  return score
}

export async function toggleCommunityResourceBookmark(
  resourceId: string
): Promise<boolean | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: existing } = await supabase
    .from('course_resource_bookmarks')
    .select('id')
    .eq('user_id', user.id)
    .eq('resource_id', resourceId)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('course_resource_bookmarks')
      .delete()
      .eq('user_id', user.id)
      .eq('resource_id', resourceId)
    return error ? null : false
  }

  const { error } = await supabase
    .from('course_resource_bookmarks')
    .insert({ user_id: user.id, resource_id: resourceId })
  return error ? null : true
}

export async function getCommunityResourceComments(
  resourceId: string
): Promise<CommunityResourceComment[]> {
  const supabase = getSupabaseClient()
  if (!supabase) return []
  const { data, error } = await supabase
    .from('course_resource_comments')
    .select('id, resource_id, user_id, body, created_at, updated_at')
    .eq('resource_id', resourceId)
    .order('created_at', { ascending: true })
  if (error) return []
  const comments = (data || []) as CommunityResourceComment[]
  if (comments.length === 0) return []
  const userIds = [...new Set(comments.map((c) => c.user_id))]
  const profilesRes = await supabase
    .from('profiles')
    .select('user_id, display_name, avatar_url')
    .in('user_id', userIds)
  const profileByUser = (profilesRes?.data || []).reduce(
    (acc: Record<string, AuthorFields>, p: any) => {
      acc[p.user_id] = {
        display_name: p.display_name,
        avatar_url: p.avatar_url
      }
      return acc
    },
    {}
  )
  return comments.map((c) => ({ ...c, author: profileByUser[c.user_id] }))
}

export async function addCommunityResourceComment(
  resourceId: string,
  body: string
): Promise<CommunityResourceComment | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data, error } = await supabase
    .from('course_resource_comments')
    .insert({
      resource_id: resourceId,
      user_id: user.id,
      body
    })
    .select('id, resource_id, user_id, body, created_at, updated_at')
    .single()
  if (error || !data) return null
  const author = await authorForUser(supabase, user)
  return { ...(data as CommunityResourceComment), author }
}

async function fetchResourceBookmarksForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<CommunityResourceBookmarkWithCourse[]> {
  const { data: bookmarkRows, error: err1 } = await supabase
    .from('course_resource_bookmarks')
    .select('id, user_id, resource_id, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (err1 || !bookmarkRows?.length) return []

  const resourceIds = [
    ...new Set(
      (bookmarkRows as CourseResourceBookmark[]).map((b) => b.resource_id)
    )
  ]
  const { data: resourceRows, error: err2 } = await supabase
    .from('course_resources')
    .select(
      'id, course_id, user_id, title, description, link, is_pinned, created_at, updated_at'
    )
    .in('id', resourceIds)
  if (err2 || !resourceRows?.length) return []

  const resources = resourceRows as CommunityResource[]
  const resourceById = resources.reduce((acc, r) => {
    acc[r.id] = r
    return acc
  }, {} as Record<string, CommunityResource>)

  const courseIds = [...new Set(resources.map((r) => r.course_id))]
  const { data: courseRows, error: err3 } = await supabase
    .from('courses')
    .select('notion_page_id, name, url, created_at')
    .in('notion_page_id', courseIds)
  if (err3 || !courseRows?.length) return []
  const courseById = (courseRows as Course[]).reduce((acc, c) => {
    acc[c.notion_page_id] = c
    return acc
  }, {} as Record<string, Course>)

  const authorIds = [...new Set(resources.map((r) => r.user_id))]
  const { data: profiles } = await supabase
    .from('profiles')
    .select('user_id, display_name, avatar_url')
    .in('user_id', authorIds)
  const profileByUser = (profiles || []).reduce(
    (acc: Record<string, AuthorFields>, p: any) => {
      acc[p.user_id] = {
        display_name: p.display_name,
        avatar_url: p.avatar_url
      }
      return acc
    },
    {} as Record<string, AuthorFields>
  )

  return (bookmarkRows as CourseResourceBookmark[])
    .map((b) => {
      const resource = resourceById[b.resource_id]
      if (!resource) return null
      const course = courseById[resource.course_id]
      if (!course) return null
      return {
        bookmark: b,
        resource: {
          ...resource,
          author: profileByUser[resource.user_id]
        },
        course
      }
    })
    .filter((x) => x != null) as CommunityResourceBookmarkWithCourse[]
}

/** Bookmarked community wall resources for the signed-in user (profile). */
export async function getMyCommunityResourceBookmarks(): Promise<
  CommunityResourceBookmarkWithCourse[]
> {
  const supabase = getSupabaseClient()
  if (!supabase) return []
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return []
  return fetchResourceBookmarksForUser(supabase, user.id)
}

/** Bookmarked community wall resources for a user (public profile). */
export async function getCommunityResourceBookmarksByUser(
  userId: string
): Promise<CommunityResourceBookmarkWithCourse[]> {
  const supabase = getSupabaseClient()
  if (!supabase) return []
  return fetchResourceBookmarksForUser(supabase, userId)
}
