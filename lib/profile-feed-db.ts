/**
 * Social-style feed for the signed-in user: replies and resource-list
 * suggestions that mention them, plus public activity from people they follow.
 */
import type { Course } from '@/lib/course-activity-db'
import {
  learningPathHref,
  parseLearningPathSlugFromUserLinkUrl
} from '@/lib/learning-path-bookmark-link'
import { getSupabaseClient } from '@/lib/supabase'

type FeedActor = {
  id: string
  created_at: string
  actor_id: string
  actor_display_name: string | null
}

export type ProfileFeedItem =
  | (FeedActor & {
      kind: 'followed_course_bookmark'
      course_id: string
      course_name: string
      course_url: string | null
    })
  | (FeedActor & {
      kind: 'followed_link_bookmark'
      link_title: string
      link_href: string
    })
  | (FeedActor & {
      kind: 'followed_comment'
      course_id: string
      target_title: string
      target_href: string
      body: string
      is_reply: boolean
      parent_body: string | null
      parent_author_name: string | null
      parent_author_id: string | null
    })
  | (FeedActor & {
      kind: 'followed_annotation'
      course_id: string
      target_title: string
      target_href: string
      section_id: string
      body: string
      is_reply: boolean
      parent_body: string | null
      parent_author_name: string | null
      parent_author_id: string | null
    })
  | (FeedActor & {
      kind: 'followed_learning_path'
      path_title: string
      path_href: string
    })
  | (FeedActor & {
      kind: 'followed_path_progress'
      path_id: string
      path_title: string
      path_href: string
      node_label: string
    })
  | (FeedActor & {
      kind: 'suggestion_for_you'
      path_title: string
      path_href: string
      resource_title: string
      body: string
    })
  | (FeedActor & {
      kind: 'suggestion_response'
      path_title: string
      path_href: string
      resource_title: string
      decision: 'accepted' | 'declined'
    })

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

const FEED_LIMIT = 100

type PathSummary = {
  id: string
  slug: string
  title: string
  owner_id: string | null
}

function pathSlugFromCourseId(courseId: string | null | undefined): string | null {
  if (!courseId) return null
  if (courseId.startsWith('learning-path:')) {
    return courseId.slice('learning-path:'.length) || null
  }
  if (courseId.startsWith('course-learning-path:')) {
    return courseId.slice('course-learning-path:'.length) || null
  }
  return null
}

function hrefForCourse(course: Course | undefined, courseId: string): string {
  if (course?.url) return course.url
  const slug = pathSlugFromCourseId(courseId)
  if (slug) return learningPathHref(slug)
  return `/course/${courseId}`
}

function titleForCourse(course: Course | undefined, courseId: string): string {
  if (course?.name) return course.name
  const slug = pathSlugFromCourseId(courseId)
  if (slug) return slug.replace(/-/g, ' ')
  return 'Course'
}

function isPublicPath(
  slug: string | null,
  publicPathSlugs: Set<string>
): boolean {
  if (!slug) return true
  return publicPathSlugs.has(slug)
}

type SuggestionRow = {
  id: string
  path_id: string
  user_id: string
  title: string
  why: string | null
  created_at: string
  status?: string | null
  responded_at?: string | null
}

const SUGGESTION_COLUMNS =
  'id, path_id, node_id, user_id, title, why, created_at, status, responded_at'
const SUGGESTION_COLUMNS_MINIMAL =
  'id, path_id, node_id, user_id, title, why, created_at'

/**
 * Aggregates feed rows for `viewerUserId` (must be the signed-in user for subscriptions).
 */
export async function getProfileFeed(
  viewerUserId: string
): Promise<ProfileFeedItem[]> {
  const supabase = getSupabaseClient()
  if (!supabase || !viewerUserId) return []

  const [followRowsRes, myCommentIdsRes, myAnnotationIdsRes, myPathsRes] =
    await Promise.all([
    supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', viewerUserId),
    supabase.from('comments').select('id').eq('user_id', viewerUserId),
    supabase.from('annotations').select('id').eq('user_id', viewerUserId),
    supabase
      .from('learning_paths')
      .select('id, slug, title, owner_id')
      .eq('owner_id', viewerUserId)
      .eq('is_catalog', false)
  ])

  const followingIds = [
    ...new Set(
      (followRowsRes.data || [])
        .map((x: { following_id: string }) => x.following_id)
        .filter((id: string) => id && id !== viewerUserId)
    )
  ]

  const myCommentIds = new Set(
    (myCommentIdsRes.data || []).map((row: { id: string }) => row.id)
  )
  const myAnnotationIds = new Set(
    (myAnnotationIdsRes.data || []).map((row: { id: string }) => row.id)
  )
  const myPaths = (myPathsRes.data || []) as PathSummary[]
  const myPathById: Record<string, PathSummary> = {}
  for (const path of myPaths) myPathById[path.id] = path
  const myPathIds = myPaths.map((path) => path.id)

  const items: ProfileFeedItem[] = []
  const needUserIds = new Set<string>()
  const needCourseIds = new Set<string>()
  const needPathIds = new Set<string>()
  const needParentCommentIds = new Set<string>()
  const needParentAnnotationIds = new Set<string>()
  const commentParentByItemId = new Map<string, string>()
  const annotationParentByItemId = new Map<string, string>()

  const empty = { data: [] as unknown[] }
  const followedQueries =
    followingIds.length > 0
      ? Promise.all([
          supabase
            .from('bookmarks')
            .select('id, user_id, course_id, created_at')
            .in('user_id', followingIds)
            .order('created_at', { ascending: false })
            .limit(120),
          supabase
            .from('user_links')
            .select('id, user_id, url, title, created_at')
            .in('user_id', followingIds)
            .eq('is_private', false)
            .order('created_at', { ascending: false })
            .limit(120),
          supabase
            .from('comments')
            .select(
              'id, user_id, course_id, parent_comment_id, body, created_at'
            )
            .in('user_id', followingIds)
            .not('course_id', 'is', null)
            .order('created_at', { ascending: false })
            .limit(120),
          supabase
            .from('annotations')
            .select(
              'id, user_id, course_id, section_id, parent_annotation_id, body, created_at'
            )
            .in('user_id', followingIds)
            .order('created_at', { ascending: false })
            .limit(120),
          supabase
            .from('learning_paths')
            .select('id, slug, title, owner_id, created_at')
            .in('owner_id', followingIds)
            .eq('is_catalog', false)
            .in('visibility', ['public', 'collaborative'])
            .order('created_at', { ascending: false })
            .limit(80),
          supabase
            .from('learning_path_progress_events')
            .select(
              'id, user_id, path_id, node_id, node_label, status, created_at'
            )
            .in('user_id', followingIds)
            .eq('status', 'explored')
            .order('created_at', { ascending: false })
            .limit(120)
        ])
      : Promise.resolve([empty, empty, empty, empty, empty, empty])

  const incomingSuggestionsQuery =
    myPathIds.length > 0
      ? supabase
          .from('learning_path_resource_suggestions')
          .select(SUGGESTION_COLUMNS)
          .in('path_id', myPathIds)
          .neq('user_id', viewerUserId)
          .order('created_at', { ascending: false })
          .limit(80)
      : Promise.resolve({ data: [] as unknown[], error: null })

  const mySuggestionResponsesQuery = supabase
    .from('learning_path_resource_suggestions')
    .select(SUGGESTION_COLUMNS)
    .eq('user_id', viewerUserId)
    .in('status', ['accepted', 'declined'])
    .order('responded_at', { ascending: false })
    .limit(80)

  const [followedPack, incomingSuggestionsRes, mySuggestionResponsesRes] =
    await Promise.all([
      followedQueries,
      incomingSuggestionsQuery,
      mySuggestionResponsesQuery
    ])

  const [
    courseBmsRes,
    userLinksRes,
    commentsRes,
    annotationsRes,
    newPathsRes,
    progressRes
  ] = followedPack

  for (const raw of courseBmsRes.data || []) {
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

  for (const raw of userLinksRes.data || []) {
    const link = raw as {
      id: string
      user_id: string
      url: string
      title: string | null
      created_at: string
    }
    needUserIds.add(link.user_id)
    const pathSlug = parseLearningPathSlugFromUserLinkUrl(link.url)
    const title =
      (link.title && link.title.trim()) ||
      (pathSlug ? pathSlug.replace(/-/g, ' ') : link.url)
    items.push({
      kind: 'followed_link_bookmark',
      id: `flb-${link.id}`,
      created_at: link.created_at,
      actor_id: link.user_id,
      actor_display_name: null,
      link_title: title,
      link_href: pathSlug ? learningPathHref(pathSlug) : link.url
    })
  }

  for (const raw of commentsRes.data || []) {
    const c = raw as {
      id: string
      user_id: string
      course_id: string | null
      parent_comment_id: string | null
      body: string
      created_at: string
    }
    if (!c.course_id) continue
    if (c.parent_comment_id && myCommentIds.has(c.parent_comment_id)) continue
    needUserIds.add(c.user_id)
    needCourseIds.add(c.course_id)
    const itemId = `fcmt-${c.id}`
    if (c.parent_comment_id) {
      needParentCommentIds.add(c.parent_comment_id)
      commentParentByItemId.set(itemId, c.parent_comment_id)
    }
    items.push({
      kind: 'followed_comment',
      id: itemId,
      created_at: c.created_at,
      actor_id: c.user_id,
      actor_display_name: null,
      course_id: c.course_id,
      target_title: '',
      target_href: '',
      body: c.body,
      is_reply: Boolean(c.parent_comment_id),
      parent_body: null,
      parent_author_name: null,
      parent_author_id: null
    })
  }

  for (const raw of annotationsRes.data || []) {
    const a = raw as {
      id: string
      user_id: string
      course_id: string
      section_id: string
      parent_annotation_id: string | null
      body: string
      created_at: string
    }
    if (a.parent_annotation_id && myAnnotationIds.has(a.parent_annotation_id)) {
      continue
    }
    needUserIds.add(a.user_id)
    needCourseIds.add(a.course_id)
    const itemId = `fann-${a.id}`
    if (a.parent_annotation_id) {
      needParentAnnotationIds.add(a.parent_annotation_id)
      annotationParentByItemId.set(itemId, a.parent_annotation_id)
    }
    items.push({
      kind: 'followed_annotation',
      id: itemId,
      created_at: a.created_at,
      actor_id: a.user_id,
      actor_display_name: null,
      course_id: a.course_id,
      target_title: '',
      target_href: '',
      section_id: a.section_id,
      body: a.body,
      is_reply: Boolean(a.parent_annotation_id),
      parent_body: null,
      parent_author_name: null,
      parent_author_id: null
    })
  }

  for (const raw of newPathsRes.data || []) {
    const p = raw as {
      id: string
      slug: string
      title: string
      owner_id: string
      created_at: string
    }
    if (!p.owner_id || p.owner_id === viewerUserId) continue
    needUserIds.add(p.owner_id)
    items.push({
      kind: 'followed_learning_path',
      id: `flp-${p.id}`,
      created_at: p.created_at,
      actor_id: p.owner_id,
      actor_display_name: null,
      path_title: p.title,
      path_href: learningPathHref(p.slug)
    })
  }

  for (const raw of progressRes.data || []) {
    const e = raw as {
      id: string
      user_id: string
      path_id: string
      node_id: string
      node_label: string | null
      created_at: string
    }
    needUserIds.add(e.user_id)
    needPathIds.add(e.path_id)
    items.push({
      kind: 'followed_path_progress',
      id: `fpp-${e.id}`,
      created_at: e.created_at,
      actor_id: e.user_id,
      actor_display_name: null,
      path_id: e.path_id,
      path_title: '',
      path_href: '',
      node_label: (e.node_label || e.node_id).trim() || 'a topic'
    })
  }

  let incomingRows = (incomingSuggestionsRes.data || []) as SuggestionRow[]
  if (
    incomingSuggestionsRes &&
    'error' in incomingSuggestionsRes &&
    incomingSuggestionsRes.error &&
    myPathIds.length > 0
  ) {
    const retry = await supabase
      .from('learning_path_resource_suggestions')
      .select(SUGGESTION_COLUMNS_MINIMAL)
      .in('path_id', myPathIds)
      .neq('user_id', viewerUserId)
      .order('created_at', { ascending: false })
      .limit(80)
    incomingRows = (retry.data || []) as SuggestionRow[]
  }

  for (const row of incomingRows) {
    const path = myPathById[row.path_id]
    if (!path) continue
    needUserIds.add(row.user_id)
    items.push({
      kind: 'suggestion_for_you',
      id: `sgy-${row.id}`,
      created_at: row.created_at,
      actor_id: row.user_id,
      actor_display_name: null,
      path_title: path.title,
      path_href: learningPathHref(path.slug),
      resource_title: row.title,
      body: (row.why || '').trim()
    })
  }

  let responseRows = (mySuggestionResponsesRes.data || []) as SuggestionRow[]
  if (
    mySuggestionResponsesRes &&
    'error' in mySuggestionResponsesRes &&
    mySuggestionResponsesRes.error
  ) {
    responseRows = []
  }
  for (const row of responseRows) needPathIds.add(row.path_id)

  if (items.length === 0 && responseRows.length === 0) return []

  const pathById: Record<string, PathSummary> = { ...myPathById }
  const missingPathIds = [...needPathIds].filter((id) => !pathById[id])
  if (missingPathIds.length > 0) {
    const { data: pathRows } = await supabase
      .from('learning_paths')
      .select('id, slug, title, owner_id')
      .in('id', missingPathIds)
    for (const row of pathRows || []) {
      const p = row as PathSummary
      pathById[p.id] = p
    }
  }

  for (const row of responseRows) {
    const path = pathById[row.path_id]
    if (!path || !path.owner_id || path.owner_id === viewerUserId) continue
    needUserIds.add(path.owner_id)
    items.push({
      kind: 'suggestion_response',
      id: `sgr-${row.id}`,
      created_at: row.responded_at || row.created_at,
      actor_id: path.owner_id,
      actor_display_name: null,
      path_title: path.title,
      path_href: learningPathHref(path.slug),
      resource_title: row.title,
      decision: row.status === 'declined' ? 'declined' : 'accepted'
    })
  }

  if (items.length === 0) return []

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

  const parentCommentById: Record<
    string,
    { body: string; user_id: string }
  > = {}
  const parentAnnotationById: Record<
    string,
    { body: string; user_id: string }
  > = {}
  const [parentCommentsRes, parentAnnotationsRes] = await Promise.all([
    needParentCommentIds.size
      ? supabase
          .from('comments')
          .select('id, user_id, body')
          .in('id', [...needParentCommentIds])
      : Promise.resolve({
          data: [] as { id: string; user_id: string; body: string }[]
        }),
    needParentAnnotationIds.size
      ? supabase
          .from('annotations')
          .select('id, user_id, body')
          .in('id', [...needParentAnnotationIds])
      : Promise.resolve({
          data: [] as { id: string; user_id: string; body: string }[]
        })
  ])
  for (const row of parentCommentsRes.data || []) {
    parentCommentById[row.id] = { body: row.body, user_id: row.user_id }
    needUserIds.add(row.user_id)
  }
  for (const row of parentAnnotationsRes.data || []) {
    parentAnnotationById[row.id] = { body: row.body, user_id: row.user_id }
    needUserIds.add(row.user_id)
  }

  const nameByUser = await displayNamesByUserId([...needUserIds])

  const pathSlugsToCheck = [
    ...new Set(
      courseIdList
        .map((id) => pathSlugFromCourseId(id))
        .filter((slug): slug is string => Boolean(slug))
    )
  ]
  const publicPathSlugs = new Set<string>()
  if (pathSlugsToCheck.length > 0) {
    const { data: visiblePaths } = await supabase
      .from('learning_paths')
      .select('slug')
      .in('slug', pathSlugsToCheck)
    for (const row of visiblePaths || []) {
      const slug = (row as { slug: string }).slug
      if (slug) publicPathSlugs.add(slug)
    }
  }

  const hydrated: ProfileFeedItem[] = []
  for (const it of items) {
    it.actor_display_name = nameByUser[it.actor_id] ?? null
    if (it.kind === 'followed_course_bookmark') {
      const c = courseById[it.course_id]
      it.course_name = titleForCourse(c, it.course_id)
      it.course_url = c?.url ?? hrefForCourse(c, it.course_id)
      hydrated.push(it)
      continue
    }
    if (it.kind === 'followed_comment') {
      if (!isPublicPath(pathSlugFromCourseId(it.course_id), publicPathSlugs)) {
        continue
      }
      const c = courseById[it.course_id]
      it.target_title = titleForCourse(c, it.course_id)
      it.target_href = hrefForCourse(c, it.course_id)
      const parentId = commentParentByItemId.get(it.id)
      const parent = parentId ? parentCommentById[parentId] : null
      it.parent_body = parent?.body?.trim() || null
      it.parent_author_name = parent
        ? nameByUser[parent.user_id]?.trim() || 'Someone'
        : null
      it.parent_author_id = parent?.user_id ?? null
      hydrated.push(it)
      continue
    }
    if (it.kind === 'followed_annotation') {
      if (!isPublicPath(pathSlugFromCourseId(it.course_id), publicPathSlugs)) {
        continue
      }
      const c = courseById[it.course_id]
      it.target_title = titleForCourse(c, it.course_id)
      it.target_href = hrefForCourse(c, it.course_id)
      const parentId = annotationParentByItemId.get(it.id)
      const parent = parentId ? parentAnnotationById[parentId] : null
      it.parent_body = parent?.body?.trim() || null
      it.parent_author_name = parent
        ? nameByUser[parent.user_id]?.trim() || 'Someone'
        : null
      it.parent_author_id = parent?.user_id ?? null
      hydrated.push(it)
      continue
    }
    if (it.kind === 'followed_path_progress') {
      const path = pathById[it.path_id]
      if (!path) continue
      it.path_title = path.title
      it.path_href = learningPathHref(path.slug)
      hydrated.push(it)
      continue
    }
    hydrated.push(it)
  }

  hydrated.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  return hydrated.slice(0, FEED_LIMIT)
}
