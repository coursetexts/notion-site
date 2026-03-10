import { getSupabaseClient } from './supabase'

const REPLY_NOTIFICATIONS_EVENT = 'reply-notifications-update'

export type ReplyNotificationType = 'comment' | 'annotation'

export interface ReplyNotification {
  id: string
  type: ReplyNotificationType
  course_id: string
  course_name: string
  course_url: string | null
  author_id: string
  author_name: string
  body: string
  section_id?: string | null
  created_at: string
  is_unread: boolean
}

function emitReplyNotificationUpdate(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(REPLY_NOTIFICATIONS_EVENT))
  }
}

export function subscribeReplyNotificationUpdates(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => undefined
  window.addEventListener(REPLY_NOTIFICATIONS_EVENT, callback)
  return () => window.removeEventListener(REPLY_NOTIFICATIONS_EVENT, callback)
}

async function getLastReadAt(userId: string): Promise<string | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null
  const { data } = await supabase
    .from('profiles')
    .select('replies_last_read_at')
    .eq('user_id', userId)
    .maybeSingle()
  return data?.replies_last_read_at ?? null
}

async function getMyCommentIds(userId: string): Promise<string[]> {
  const supabase = getSupabaseClient()
  if (!supabase) return []
  const { data } = await supabase
    .from('comments')
    .select('id')
    .eq('user_id', userId)
  return (data || []).map((r: any) => r.id)
}

async function getMyAnnotationIds(userId: string): Promise<string[]> {
  const supabase = getSupabaseClient()
  if (!supabase) return []
  const { data } = await supabase
    .from('annotations')
    .select('id')
    .eq('user_id', userId)
  return (data || []).map((r: any) => r.id)
}

export async function getUnreadReplyCount(userId: string): Promise<number> {
  const supabase = getSupabaseClient()
  if (!supabase) return 0

  const [lastReadAt, commentIds, annotationIds] = await Promise.all([
    getLastReadAt(userId),
    getMyCommentIds(userId),
    getMyAnnotationIds(userId)
  ])

  let count = 0

  if (commentIds.length > 0) {
    let q = supabase
      .from('comments')
      .select('id', { count: 'exact', head: true })
      .in('parent_comment_id', commentIds)
      .neq('user_id', userId)
    if (lastReadAt) q = q.gt('created_at', lastReadAt)
    const { count: c } = await q
    count += c ?? 0
  }

  if (annotationIds.length > 0) {
    let q = supabase
      .from('annotations')
      .select('id', { count: 'exact', head: true })
      .in('parent_annotation_id', annotationIds)
      .neq('user_id', userId)
    if (lastReadAt) q = q.gt('created_at', lastReadAt)
    const { count: c } = await q
    count += c ?? 0
  }

  return count
}

export async function getReplyNotifications(userId: string): Promise<ReplyNotification[]> {
  const supabase = getSupabaseClient()
  if (!supabase) return []

  const [lastReadAt, commentIds, annotationIds] = await Promise.all([
    getLastReadAt(userId),
    getMyCommentIds(userId),
    getMyAnnotationIds(userId)
  ])

  const [commentRepliesRes, annotationRepliesRes] = await Promise.all([
    commentIds.length
      ? supabase
          .from('comments')
          .select('id, user_id, course_id, body, created_at')
          .in('parent_comment_id', commentIds)
          .neq('user_id', userId)
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [] as any[] } as any),
    annotationIds.length
      ? supabase
          .from('annotations')
          .select('id, user_id, course_id, section_id, body, created_at')
          .in('parent_annotation_id', annotationIds)
          .neq('user_id', userId)
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [] as any[] } as any)
  ])

  const commentReplies = commentRepliesRes.data || []
  const annotationReplies = annotationRepliesRes.data || []
  const allCourseIds = [
    ...new Set([...commentReplies, ...annotationReplies].map((r: any) => r.course_id))
  ]
  const allAuthorIds = [
    ...new Set([...commentReplies, ...annotationReplies].map((r: any) => r.user_id))
  ]

  const [coursesRes, profilesRes] = await Promise.all([
    allCourseIds.length
      ? supabase
          .from('courses')
          .select('notion_page_id, name, url')
          .in('notion_page_id', allCourseIds)
      : Promise.resolve({ data: [] as any[] } as any),
    allAuthorIds.length
      ? supabase
          .from('profiles')
          .select('user_id, display_name')
          .in('user_id', allAuthorIds)
      : Promise.resolve({ data: [] as any[] } as any)
  ])

  const courseById = (coursesRes.data || []).reduce((acc: Record<string, any>, c: any) => {
    acc[c.notion_page_id] = c
    return acc
  }, {})
  const authorById = (profilesRes.data || []).reduce((acc: Record<string, any>, p: any) => {
    acc[p.user_id] = p
    return acc
  }, {})

  const toIsUnread = (createdAt: string) =>
    !lastReadAt || new Date(createdAt).getTime() > new Date(lastReadAt).getTime()

  const commentNotifs: ReplyNotification[] = commentReplies.map((r: any) => {
    const course = courseById[r.course_id]
    return {
      id: `comment-${r.id}`,
      type: 'comment',
      course_id: r.course_id,
      course_name: course?.name || r.course_id,
      course_url: course?.url || null,
      author_id: r.user_id,
      author_name: authorById[r.user_id]?.display_name || 'Someone',
      body: r.body,
      created_at: r.created_at,
      is_unread: toIsUnread(r.created_at)
    }
  })

  const annotationNotifs: ReplyNotification[] = annotationReplies.map((r: any) => {
    const course = courseById[r.course_id]
    return {
      id: `annotation-${r.id}`,
      type: 'annotation',
      course_id: r.course_id,
      course_name: course?.name || r.course_id,
      course_url: course?.url || null,
      author_id: r.user_id,
      author_name: authorById[r.user_id]?.display_name || 'Someone',
      body: r.body,
      section_id: r.section_id,
      created_at: r.created_at,
      is_unread: toIsUnread(r.created_at)
    }
  })

  return [...commentNotifs, ...annotationNotifs].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
}

export async function markReplyNotificationsRead(userId: string): Promise<void> {
  const supabase = getSupabaseClient()
  if (!supabase) return
  await supabase
    .from('profiles')
    .update({ replies_last_read_at: new Date().toISOString() })
    .eq('user_id', userId)
  emitReplyNotificationUpdate()
}

