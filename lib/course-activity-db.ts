/**
 * Client-side helpers for course activity: courses, comments, bookmarks, annotations.
 * All require getSupabaseClient() (browser only).
 */
import type { SupabaseClient, User } from '@supabase/supabase-js'

import { getSupabaseClient } from './supabase'

type AuthorFields = { display_name: string | null; avatar_url: string | null }

/** Display name + avatar for the current user right after insert (profile + OAuth metadata). */
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
  /** Sum of vote values (upvotes - downvotes). */
  score?: number
  /** Current user's vote: 1, -1, or undefined if none. */
  user_vote?: number | null
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
  score?: number
  user_vote?: number | null
}

export interface Bookmark {
  id: string
  user_id: string
  course_id: string
  created_at: string
}

export type VoteTargetType = 'comment' | 'annotation'

export interface VoteSummary {
  score: number
  user_vote: number | null
}

/** Fetch vote summaries for comments (score + current user's vote). */
async function getVotesForComments(
  commentIds: string[]
): Promise<Record<string, VoteSummary>> {
  const supabase = getSupabaseClient()
  if (!supabase || commentIds.length === 0) return {}
  const {
    data: { user }
  } = await supabase.auth.getUser()
  const { data: rows, error } = await supabase
    .from('votes')
    .select('user_id, target_id, value')
    .eq('target_type', 'comment')
    .in('target_id', commentIds)
  if (error) return {}
  const byId: Record<string, VoteSummary> = {}
  commentIds.forEach((id) => {
    byId[id] = { score: 0, user_vote: null }
  })
  ;(rows || []).forEach(
    (r: { user_id: string; target_id: string; value: number }) => {
      if (!byId[r.target_id]) return
      byId[r.target_id].score += r.value
      if (user && r.user_id === user.id) byId[r.target_id].user_vote = r.value
    }
  )
  return byId
}

/** Fetch vote summaries for annotations. */
async function getVotesForAnnotations(
  annotationIds: string[]
): Promise<Record<string, VoteSummary>> {
  const supabase = getSupabaseClient()
  if (!supabase || annotationIds.length === 0) return {}
  const {
    data: { user }
  } = await supabase.auth.getUser()
  const { data: rows, error } = await supabase
    .from('votes')
    .select('user_id, target_id, value')
    .eq('target_type', 'annotation')
    .in('target_id', annotationIds)
  if (error) return {}
  const byId: Record<string, VoteSummary> = {}
  annotationIds.forEach((id) => {
    byId[id] = { score: 0, user_vote: null }
  })
  ;(rows || []).forEach(
    (r: { user_id: string; target_id: string; value: number }) => {
      if (!byId[r.target_id]) return
      byId[r.target_id].score += r.value
      if (user && r.user_id === user.id) byId[r.target_id].user_vote = r.value
    }
  )
  return byId
}

/** Set or remove vote (value 1, -1, or null to remove). Returns new score for target or null on error. */
export async function setVote(
  targetType: VoteTargetType,
  targetId: string,
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
      .from('votes')
      .delete()
      .eq('user_id', user.id)
      .eq('target_type', targetType)
      .eq('target_id', targetId)
    if (error) return null
  } else {
    const { error } = await supabase.from('votes').upsert(
      {
        user_id: user.id,
        target_type: targetType,
        target_id: targetId,
        value
      },
      { onConflict: 'user_id,target_type,target_id' }
    )
    if (error) return null
  }
  const { data: rows } = await supabase
    .from('votes')
    .select('value')
    .eq('target_type', targetType)
    .eq('target_id', targetId)
  const score = (rows || []).reduce(
    (s, r) => s + (r as { value: number }).value,
    0
  )
  return score
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
    .select(
      'id, user_id, course_id, parent_comment_id, body, created_at, updated_at'
    )
    .eq('course_id', courseId)
    .order('created_at', { ascending: false })

  if (error) return []
  const comments = (data || []) as Comment[]
  if (comments.length === 0) return []

  const userIds = [...new Set(comments.map((c) => c.user_id))]
  const [profilesRes, voteMap] = await Promise.all([
    supabase
      .from('profiles')
      .select('user_id, display_name, avatar_url')
      .in('user_id', userIds),
    getVotesForComments(comments.map((c) => c.id))
  ])
  const profileByUser = (profilesRes?.data || []).reduce(
    (
      acc: Record<
        string,
        { display_name: string | null; avatar_url: string | null }
      >,
      p: any
    ) => {
      acc[p.user_id] = {
        display_name: p.display_name,
        avatar_url: p.avatar_url
      }
      return acc
    },
    {}
  )
  return comments.map((c) => {
    const v = voteMap[c.id]
    return {
      ...c,
      author: profileByUser[c.user_id],
      score: v?.score ?? 0,
      user_vote: v?.user_vote ?? null
    }
  })
}

/** Add a comment (requires auth). Optional parentCommentId makes it a reply. */
export async function addComment(
  courseId: string,
  body: string,
  parentCommentId?: string | null
): Promise<Comment | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('comments')
    .insert({
      user_id: user.id,
      course_id: courseId,
      parent_comment_id: parentCommentId ?? null,
      body
    })
    .select(
      'id, user_id, course_id, parent_comment_id, body, created_at, updated_at'
    )
    .single()

  if (error || !data) return null
  const author = await authorForUser(supabase, user)
  return {
    ...(data as Comment),
    author,
    score: 0,
    user_vote: null
  }
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
  const [profilesRes, voteMap] = await Promise.all([
    supabase
      .from('profiles')
      .select('user_id, display_name, avatar_url')
      .in('user_id', userIds),
    getVotesForAnnotations(annotations.map((a) => a.id))
  ])
  const profileByUser = (profilesRes?.data || []).reduce(
    (
      acc: Record<
        string,
        { display_name: string | null; avatar_url: string | null }
      >,
      p: any
    ) => {
      acc[p.user_id] = {
        display_name: p.display_name,
        avatar_url: p.avatar_url
      }
      return acc
    },
    {}
  )
  return annotations.map((a) => {
    const v = voteMap[a.id]
    return {
      ...a,
      author: profileByUser[a.user_id],
      score: v?.score ?? 0,
      user_vote: v?.user_vote ?? null
    }
  })
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

  const {
    data: { user }
  } = await supabase.auth.getUser()
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
  const author = await authorForUser(supabase, user)
  return {
    ...(data as Annotation),
    author,
    score: 0,
    user_vote: null
  }
}

/** Check if current user has bookmarked a course. */
export async function isBookmarked(courseId: string): Promise<boolean> {
  const supabase = getSupabaseClient()
  if (!supabase) return false

  const {
    data: { user }
  } = await supabase.auth.getUser()
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

  const {
    data: { user }
  } = await supabase.auth.getUser()
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

  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return false

  const { error } = await supabase
    .from('bookmarks')
    .delete()
    .eq('user_id', user.id)
    .eq('course_id', courseId)

  return !error
}

/** Toggle bookmark; returns new state (true = bookmarked). */
export async function toggleBookmark(
  courseId: string
): Promise<boolean | null> {
  const currently = await isBookmarked(courseId)
  if (currently) {
    const ok = await removeBookmark(courseId)
    return ok ? false : null
  }
  const ok = await addBookmark(courseId)
  return ok ? true : null
}

/** Fetch all bookmarks for current user (with course info). */
export async function getMyBookmarks(): Promise<
  { bookmark: Bookmark; course: Course }[]
> {
  const supabase = getSupabaseClient()
  if (!supabase) return []

  const {
    data: { user }
  } = await supabase.auth.getUser()
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
      bookmark: {
        id: b.id,
        user_id: b.user_id,
        course_id: b.course_id,
        created_at: b.created_at
      } as Bookmark,
      course: courseById[b.course_id]
    }))
    .filter((x) => x.course) as { bookmark: Bookmark; course: Course }[]
}

/** Fetch all comments by current user (with course info). */
export async function getMyComments(): Promise<
  { comment: Comment; course: Course }[]
> {
  const supabase = getSupabaseClient()
  if (!supabase) return []

  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data: commentRows, error: err1 } = await supabase
    .from('comments')
    .select(
      'id, user_id, course_id, parent_comment_id, body, created_at, updated_at'
    )
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

/** Fetch all annotations by current user (with course info). */
export async function getMyAnnotations(): Promise<
  { annotation: Annotation; course: Course }[]
> {
  const supabase = getSupabaseClient()
  if (!supabase) return []

  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data: annotationRows, error: err1 } = await supabase
    .from('annotations')
    .select(
      'id, user_id, course_id, section_id, parent_annotation_id, body, created_at, updated_at'
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (err1 || !annotationRows?.length) return []

  const courseIds = [...new Set(annotationRows.map((a) => a.course_id))]
  const { data: courses, error: err2 } = await supabase
    .from('courses')
    .select('notion_page_id, name, url, created_at')
    .in('notion_page_id', courseIds)

  if (err2 || !courses?.length) return []

  const courseById = (courses as Course[]).reduce((acc, c) => {
    acc[c.notion_page_id] = c
    return acc
  }, {} as Record<string, Course>)

  return annotationRows
    .map((a) => ({
      annotation: a as Annotation,
      course: courseById[a.course_id]
    }))
    .filter((x) => x.course) as { annotation: Annotation; course: Course }[]
}
