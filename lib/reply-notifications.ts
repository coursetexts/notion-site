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
  /** Body of the comment/annotation being replied to (viewer’s). */
  parent_body: string | null
  parent_author_name: string | null
  parent_author_id: string | null
  section_id?: string | null
  created_at: string
  is_unread: boolean
}

function emitReplyNotificationUpdate(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(REPLY_NOTIFICATIONS_EVENT))
  }
}

export function subscribeReplyNotificationUpdates(
  callback: () => void
): () => void {
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

export async function getReplyNotifications(
  userId: string
): Promise<ReplyNotification[]> {
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
          .select('id, user_id, course_id, parent_comment_id, body, created_at')
          .in('parent_comment_id', commentIds)
          .neq('user_id', userId)
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [] as any[] } as any),
    annotationIds.length
      ? supabase
          .from('annotations')
          .select(
            'id, user_id, course_id, section_id, parent_annotation_id, body, created_at'
          )
          .in('parent_annotation_id', annotationIds)
          .neq('user_id', userId)
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [] as any[] } as any)
  ])

  const commentReplies = commentRepliesRes.data || []
  const annotationReplies = annotationRepliesRes.data || []
  const parentCommentIds = [
    ...new Set(
      commentReplies
        .map((r: any) => r.parent_comment_id as string | null)
        .filter(Boolean)
    )
  ] as string[]
  const parentAnnotationIds = [
    ...new Set(
      annotationReplies
        .map((r: any) => r.parent_annotation_id as string | null)
        .filter(Boolean)
    )
  ] as string[]
  const allCourseIds = [
    ...new Set(
      [...commentReplies, ...annotationReplies].map((r: any) => r.course_id)
    )
  ]
  const allAuthorIds = [
    ...new Set(
      [...commentReplies, ...annotationReplies].map((r: any) => r.user_id)
    )
  ]

  const [coursesRes, profilesRes, parentCommentsRes, parentAnnotationsRes] =
    await Promise.all([
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
        : Promise.resolve({ data: [] as any[] } as any),
      parentCommentIds.length
        ? supabase
            .from('comments')
            .select('id, user_id, body')
            .in('id', parentCommentIds)
        : Promise.resolve({ data: [] as any[] } as any),
      parentAnnotationIds.length
        ? supabase
            .from('annotations')
            .select('id, user_id, body')
            .in('id', parentAnnotationIds)
        : Promise.resolve({ data: [] as any[] } as any)
    ])

  const parentAuthorIds = [
    ...new Set(
      [
        ...(parentCommentsRes.data || []).map((r: any) => r.user_id as string),
        ...(parentAnnotationsRes.data || []).map(
          (r: any) => r.user_id as string
        )
      ].filter(Boolean)
    )
  ]
  const parentProfilesRes =
    parentAuthorIds.length > 0
      ? await supabase
          .from('profiles')
          .select('user_id, display_name')
          .in('user_id', parentAuthorIds)
      : { data: [] as any[] }

  const courseById = (coursesRes.data || []).reduce(
    (acc: Record<string, any>, c: any) => {
      acc[c.notion_page_id] = c
      return acc
    },
    {}
  )
  const authorById = (profilesRes.data || []).reduce(
    (acc: Record<string, any>, p: any) => {
      acc[p.user_id] = p
      return acc
    },
    {}
  )
  for (const p of parentProfilesRes.data || []) {
    if (!authorById[p.user_id]) authorById[p.user_id] = p
  }
  const parentCommentById = (parentCommentsRes.data || []).reduce(
    (acc: Record<string, { body: string; user_id: string }>, row: any) => {
      acc[row.id] = { body: row.body, user_id: row.user_id }
      return acc
    },
    {}
  )
  const parentAnnotationById = (parentAnnotationsRes.data || []).reduce(
    (acc: Record<string, { body: string; user_id: string }>, row: any) => {
      acc[row.id] = { body: row.body, user_id: row.user_id }
      return acc
    },
    {}
  )

  const toIsUnread = (createdAt: string) =>
    !lastReadAt ||
    new Date(createdAt).getTime() > new Date(lastReadAt).getTime()

  const commentNotifs: ReplyNotification[] = commentReplies.map((r: any) => {
    const course = courseById[r.course_id]
    const parent = r.parent_comment_id
      ? parentCommentById[r.parent_comment_id]
      : null
    return {
      id: `comment-${r.id}`,
      type: 'comment',
      course_id: r.course_id,
      course_name: course?.name || r.course_id,
      course_url: course?.url || null,
      author_id: r.user_id,
      author_name: authorById[r.user_id]?.display_name || 'Someone',
      body: r.body,
      parent_body: parent?.body ?? null,
      parent_author_name: parent
        ? authorById[parent.user_id]?.display_name || 'Someone'
        : null,
      parent_author_id: parent?.user_id ?? null,
      created_at: r.created_at,
      is_unread: toIsUnread(r.created_at)
    }
  })

  const annotationNotifs: ReplyNotification[] = annotationReplies.map(
    (r: any) => {
      const course = courseById[r.course_id]
      const parent = r.parent_annotation_id
        ? parentAnnotationById[r.parent_annotation_id]
        : null
      return {
        id: `annotation-${r.id}`,
        type: 'annotation',
        course_id: r.course_id,
        course_name: course?.name || r.course_id,
        course_url: course?.url || null,
        author_id: r.user_id,
        author_name: authorById[r.user_id]?.display_name || 'Someone',
        body: r.body,
        parent_body: parent?.body ?? null,
        parent_author_name: parent
          ? authorById[parent.user_id]?.display_name || 'Someone'
          : null,
        parent_author_id: parent?.user_id ?? null,
        section_id: r.section_id,
        created_at: r.created_at,
        is_unread: toIsUnread(r.created_at)
      }
    }
  )

  return [...commentNotifs, ...annotationNotifs].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
}

export async function markReplyNotificationsRead(
  userId: string
): Promise<void> {
  const supabase = getSupabaseClient()
  if (!supabase) return
  await supabase
    .from('profiles')
    .update({ replies_last_read_at: new Date().toISOString() })
    .eq('user_id', userId)
  emitReplyNotificationUpdate()
}
