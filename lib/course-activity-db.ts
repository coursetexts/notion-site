/**
 * Client-side helpers for course activity: courses, comments, bookmarks, annotations.
 * All require getSupabaseClient() (browser only).
 */

import { getSupabaseClient } from './supabase'

export interface Course {
  notion_page_id: string
  name: string
  url: string | null
  created_at: string
}

export interface Comment {
  id: string
  user_id: string
  course_id: string
  parent_comment_id: string | null
  body: string
  created_at: string
  updated_at: string
  author?: { display_name: string | null; avatar_url: string | null }
}

export interface Annotation {
  id: string
  user_id: string
  course_id: string
  section_id: string
  parent_annotation_id: string | null
  body: string
  created_at: string
  updated_at: string
  author?: { display_name: string | null; avatar_url: string | null }
}

export interface Bookmark {
  id: string
  user_id: string
  course_id: string
  created_at: string
}

/** Get or create a course by notion_page_id (page/route id). Returns course id (notion_page_id). */
export async function getOrCreateCourse(
  notionPageId: string,
  name: string,
  url?: string | null
): Promise<{ courseId: string; course: Course } | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  const { data: existing } = await supabase
    .from('courses')
    .select('notion_page_id, name, url, created_at')
    .eq('notion_page_id', notionPageId)
    .maybeSingle()

  if (existing) {
    return { courseId: existing.notion_page_id, course: existing as Course }
  }

  const { data: inserted, error } = await supabase
    .from('courses')
    .insert({
      notion_page_id: notionPageId,
      name,
      url: url ?? null
    })
    .select('notion_page_id, name, url, created_at')
    .single()

  if (error || !inserted) return null
  return { courseId: inserted.notion_page_id, course: inserted as Course }
}

/** Fetch comments for a course (newest first). */
export async function getComments(courseId: string): Promise<Comment[]> {
  const supabase = getSupabaseClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('comments')
    .select('id, user_id, course_id, parent_comment_id, body, created_at, updated_at')
    .eq('course_id', courseId)
    .order('created_at', { ascending: false })

  if (error) return []
  const comments = (data || []) as Comment[]
  if (comments.length === 0) return []

  const userIds = [...new Set(comments.map((c) => c.user_id))]
  const { data: profiles } = await supabase
    .from('profiles')
    .select('user_id, display_name, avatar_url')
    .in('user_id', userIds)
  const profileByUser = (profiles || []).reduce((acc: Record<string, { display_name: string | null; avatar_url: string | null }>, p: any) => {
    acc[p.user_id] = { display_name: p.display_name, avatar_url: p.avatar_url }
    return acc
  }, {})
  return comments.map((c) => ({
    ...c,
    author: profileByUser[c.user_id]
  }))
}

/** Add a comment (requires auth). Optional parentCommentId makes it a reply. */
export async function addComment(
  courseId: string,
  body: string,
  parentCommentId?: string | null
): Promise<Comment | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('comments')
    .insert({
      user_id: user.id,
      course_id: courseId,
      parent_comment_id: parentCommentId ?? null,
      body
    })
    .select('id, user_id, course_id, parent_comment_id, body, created_at, updated_at')
    .single()

  if (error || !data) return null
  return data as Comment
}

/** Fetch annotations for a course, optionally filtered by section. */
export async function getAnnotations(
  courseId: string,
  sectionId?: string | null
): Promise<Annotation[]> {
  const supabase = getSupabaseClient()
  if (!supabase) return []

  let q = supabase
    .from('annotations')
    .select(
      'id, user_id, course_id, section_id, parent_annotation_id, body, created_at, updated_at'
    )
    .eq('course_id', courseId)
    .order('created_at', { ascending: false })

  if (sectionId != null && sectionId !== '') {
    q = q.eq('section_id', sectionId)
  }

  const { data, error } = await q
  if (error) return []
  const annotations = (data || []) as Annotation[]
  if (annotations.length === 0) return []

  const userIds = [...new Set(annotations.map((a) => a.user_id))]
  const { data: profiles } = await supabase
    .from('profiles')
    .select('user_id, display_name, avatar_url')
    .in('user_id', userIds)
  const profileByUser = (profiles || []).reduce((acc: Record<string, { display_name: string | null; avatar_url: string | null }>, p: any) => {
    acc[p.user_id] = { display_name: p.display_name, avatar_url: p.avatar_url }
    return acc
  }, {})
  return annotations.map((a) => ({
    ...a,
    author: profileByUser[a.user_id]
  }))
}

/** Add an annotation (requires auth). */
export async function addAnnotation(
  courseId: string,
  sectionId: string,
  body: string,
  parentAnnotationId?: string | null
): Promise<Annotation | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('annotations')
    .insert({
      user_id: user.id,
      course_id: courseId,
      section_id: sectionId,
      parent_annotation_id: parentAnnotationId ?? null,
      body
    })
    .select(
      'id, user_id, course_id, section_id, parent_annotation_id, body, created_at, updated_at'
    )
    .single()

  if (error || !data) return null
  return data as Annotation
}

/** Check if current user has bookmarked a course. */
export async function isBookmarked(courseId: string): Promise<boolean> {
  const supabase = getSupabaseClient()
  if (!supabase) return false

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data } = await supabase
    .from('bookmarks')
    .select('id')
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .maybeSingle()

  return !!data
}

/** Add bookmark. */
export async function addBookmark(courseId: string): Promise<boolean> {
  const supabase = getSupabaseClient()
  if (!supabase) return false

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { error } = await supabase
    .from('bookmarks')
    .insert({ user_id: user.id, course_id: courseId })

  return !error
}

/** Remove bookmark. */
export async function removeBookmark(courseId: string): Promise<boolean> {
  const supabase = getSupabaseClient()
  if (!supabase) return false

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { error } = await supabase
    .from('bookmarks')
    .delete()
    .eq('user_id', user.id)
    .eq('course_id', courseId)

  return !error
}

/** Toggle bookmark; returns new state (true = bookmarked). */
export async function toggleBookmark(courseId: string): Promise<boolean | null> {
  const currently = await isBookmarked(courseId)
  if (currently) {
    const ok = await removeBookmark(courseId)
    return ok ? false : null
  }
  const ok = await addBookmark(courseId)
  return ok ? true : null
}

/** Fetch all bookmarks for current user (with course info). */
export async function getMyBookmarks(): Promise<{ bookmark: Bookmark; course: Course }[]> {
  const supabase = getSupabaseClient()
  if (!supabase) return []

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: bookmarkRows, error: err1 } = await supabase
    .from('bookmarks')
    .select('id, user_id, course_id, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (err1 || !bookmarkRows?.length) return []

  const courseIds = bookmarkRows.map((b) => b.course_id)
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
    .map((b) => ({
      bookmark: { id: b.id, user_id: b.user_id, course_id: b.course_id, created_at: b.created_at } as Bookmark,
      course: courseById[b.course_id]
    }))
    .filter((x) => x.course) as { bookmark: Bookmark; course: Course }[]
}

/** Fetch all comments by current user (with course info). */
export async function getMyComments(): Promise<{ comment: Comment; course: Course }[]> {
  const supabase = getSupabaseClient()
  if (!supabase) return []

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: commentRows, error: err1 } = await supabase
    .from('comments')
    .select('id, user_id, course_id, parent_comment_id, body, created_at, updated_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (err1 || !commentRows?.length) return []

  const courseIds = [...new Set(commentRows.map((c) => c.course_id))]
  const { data: courses, error: err2 } = await supabase
    .from('courses')
    .select('notion_page_id, name, url, created_at')
    .in('notion_page_id', courseIds)

  if (err2 || !courses?.length) return []

  const courseById = (courses as Course[]).reduce((acc, c) => {
    acc[c.notion_page_id] = c
    return acc
  }, {} as Record<string, Course>)
  return commentRows
    .map((c) => ({
      comment: c as Comment,
      course: courseById[c.course_id]
    }))
    .filter((x) => x.course) as { comment: Comment; course: Course }[]
}
