/**
 * Social-style feed for the signed-in user: Community Wall posts on subscribed
 * courses, and bookmarks from people they follow.
 */
import type { Course } from '@/lib/course-activity-db'
import { getSupabaseClient } from '@/lib/supabase'

export type ProfileFeedItem =
  | {
      kind: 'wall_resource'
      id: string
      created_at: string
      actor_id: string
      actor_display_name: string | null
      course_id: string
      course_name: string
      course_url: string | null
      resource_id: string
      resource_title: string
    }
  | {
      kind: 'followed_course_bookmark'
      id: string
      created_at: string
      actor_id: string
      actor_display_name: string | null
      course_id: string
      course_name: string
      course_url: string | null
    }
  | {
      kind: 'followed_resource_bookmark'
      id: string
      created_at: string
      actor_id: string
      actor_display_name: string | null
      course_id: string
      course_name: string
      course_url: string | null
      resource_id: string
      resource_title: string
    }

async function displayNamesByUserId(
  userIds: string[]
): Promise<Record<string, string | null>> {
  const supabase = getSupabaseClient()
  if (!supabase || userIds.length === 0) return {}
  const unique = [...new Set(userIds)]
  const { data: profiles } = await supabase
    .from('profiles')
    .select('user_id, display_name')
    .in('user_id', unique)
  const out: Record<string, string | null> = {}
  unique.forEach((id) => {
    out[id] = null
  })
  for (const p of profiles || []) {
    out[(p as { user_id: string }).user_id] = (
      p as { display_name: string | null }
    ).display_name
  }
  return out
}

const FEED_LIMIT = 80

/**
 * Aggregates feed rows for `viewerUserId` (must be the signed-in user for subscriptions).
 */
export async function getProfileFeed(
  viewerUserId: string
): Promise<ProfileFeedItem[]> {
  const supabase = getSupabaseClient()
  if (!supabase || !viewerUserId) return []

  const { data: subs } = await supabase
    .from('community_wall_subscriptions')
    .select('course_id, created_at')
    .eq('subscriber_id', viewerUserId)

  const subSinceByCourse = new Map<string, string>()
  for (const row of subs || []) {
    const r = row as { course_id: string; created_at: string }
    subSinceByCourse.set(r.course_id, r.created_at)
  }

  const { data: followRows } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', viewerUserId)

  const followingIds = [
    ...new Set(
      (followRows || [])
        .map((x: { following_id: string }) => x.following_id)
        .filter((id: string) => id && id !== viewerUserId)
    )
  ]

  const items: ProfileFeedItem[] = []
  const needUserIds = new Set<string>()
  const needCourseIds = new Set<string>()

  if (subSinceByCourse.size > 0) {
    const courseIds = [...subSinceByCourse.keys()]
    // Include the subscriber’s own posts too (same as typical “following” / wall feeds).
    const { data: resources } = await supabase
      .from('course_resources')
      .select('id, course_id, user_id, title, created_at')
      .in('course_id', courseIds)
      .order('created_at', { ascending: false })
      .limit(200)

    for (const raw of resources || []) {
      const r = raw as {
        id: string
        course_id: string
        user_id: string
        title: string
        created_at: string
      }
      const since = subSinceByCourse.get(r.course_id)
      if (!since) continue
      if (new Date(r.created_at) < new Date(since)) continue
      needUserIds.add(r.user_id)
      needCourseIds.add(r.course_id)
      items.push({
        kind: 'wall_resource',
        id: `wr-${r.id}`,
        created_at: r.created_at,
        actor_id: r.user_id,
        actor_display_name: null,
        course_id: r.course_id,
        course_name: '',
        course_url: null,
        resource_id: r.id,
        resource_title: r.title
      })
    }
  }

  if (followingIds.length > 0) {
    const { data: courseBms } = await supabase
      .from('bookmarks')
      .select('id, user_id, course_id, created_at')
      .in('user_id', followingIds)
      .order('created_at', { ascending: false })
      .limit(120)

    for (const raw of courseBms || []) {
      const b = raw as {
        id: string
        user_id: string
        course_id: string
        created_at: string
      }
      needUserIds.add(b.user_id)
      needCourseIds.add(b.course_id)
      items.push({
        kind: 'followed_course_bookmark',
        id: `fcb-${b.id}`,
        created_at: b.created_at,
        actor_id: b.user_id,
        actor_display_name: null,
        course_id: b.course_id,
        course_name: '',
        course_url: null
      })
    }

    const { data: resBms } = await supabase
      .from('course_resource_bookmarks')
      .select('id, user_id, resource_id, created_at')
      .in('user_id', followingIds)
      .order('created_at', { ascending: false })
      .limit(120)

    const resourceIds = [
      ...new Set(
        (resBms || []).map(
          (x: { resource_id: string }) => x.resource_id
        ) as string[]
      )
    ]

    const resourceRows: Record<
      string,
      { id: string; course_id: string; title: string }
    > = {}
    if (resourceIds.length > 0) {
      const { data: resList } = await supabase
        .from('course_resources')
        .select('id, course_id, title')
        .in('id', resourceIds)
      for (const row of resList || []) {
        const rr = row as { id: string; course_id: string; title: string }
        resourceRows[rr.id] = rr
        needCourseIds.add(rr.course_id)
      }
    }

    for (const raw of resBms || []) {
      const b = raw as {
        id: string
        user_id: string
        resource_id: string
        created_at: string
      }
      const res = resourceRows[b.resource_id]
      if (!res) continue
      needUserIds.add(b.user_id)
      items.push({
        kind: 'followed_resource_bookmark',
        id: `frb-${b.id}`,
        created_at: b.created_at,
        actor_id: b.user_id,
        actor_display_name: null,
        course_id: res.course_id,
        course_name: '',
        course_url: null,
        resource_id: res.id,
        resource_title: res.title
      })
    }
  }

  if (items.length === 0) return []

  const nameByUser = await displayNamesByUserId([...needUserIds])

  const courseIdList = [...needCourseIds]
  const courseById: Record<string, Course> = {}
  if (courseIdList.length > 0) {
    const { data: courses } = await supabase
      .from('courses')
      .select('notion_page_id, name, url, created_at')
      .in('notion_page_id', courseIdList)
    for (const c of (courses || []) as Course[]) {
      courseById[c.notion_page_id] = c
    }
  }

  for (const it of items) {
    it.actor_display_name = nameByUser[it.actor_id] ?? null
    const c = courseById[it.course_id]
    if (c) {
      it.course_name = c.name
      it.course_url = c.url
    } else {
      it.course_name = 'Course'
    }
  }

  items.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  return items.slice(0, FEED_LIMIT)
}
