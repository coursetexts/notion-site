/**
 * Course Videos data layer — syllabus tree + curated videos
 * (curated_courses / curated_course_* tables).
 */
import {
  type ResourceDbType,
  addCommunityPageResource
} from './community-comments-db'
import {
  type CourseLearningPathData,
  type CourseLearningPathLink,
  type CourseLearningPathLinkKind,
  type CourseLearningPathNode,
  type CourseLearningPathNodeType,
  type CourseLearningPathTopicResource,
  type CourseLearningPathTopicResourceKind,
  type CourseLearningPathVideo,
  insertLinkAtPlacement,
  insertTopicResourceAtPlacement,
  insertVideoAtPlacement,
  mergeCourseLearningPathLegacyResources,
  moveTopicResourceToPlacement,
  sortCourseLearningPathByRank,
  sortCourseLearningPathLinks,
  sortCourseLearningPathTopicResources
} from './course-learning-path-types'
import { getSupabaseClient } from './supabase'
import {
  extractYouTubeVideoId,
  getYouTubeThumbnailUrl
} from './youtube-thumbnail'

type CourseRow = {
  id: string
  slug: string
  title: string
  description: string | null
  created_at?: string | null
}

type NodeRow = {
  id: string
  course_id: string
  parent_id: string | null
  node_type: CourseLearningPathNodeType
  title: string
  description: string | null
  sort_order: number
}

/** Hidden syllabus node that holds Mental Map videos (`node_id` is a UUID FK). */
export const MENTAL_MAP_NODE_MARKER = '__coursetexts_mental_map__'

function isMentalMapNodeRow(row: { description: string | null }): boolean {
  return row.description === MENTAL_MAP_NODE_MARKER
}

type VideoRow = {
  id: string
  node_id: string
  sort_order: number
  title: string
  channel: string | null
  duration_seconds: number | null
  url: string
  thumbnail_url: string | null
  annotation: string | null
}

type LinkRow = {
  id: string
  node_id: string
  kind: CourseLearningPathLinkKind
  sort_order: number
  title: string
  url: string
}

type TopicResourceRow = {
  id: string
  node_id: string
  kind: CourseLearningPathTopicResourceKind
  sort_order: number
  title: string
  url: string | null
  passage: string | null
  why: string | null
}

type ResourceRow = {
  kind: 'textbook' | 'website' | 'youtube'
  title: string
  link_or_site: string
  description: string | null
  sort_order: number
}

function buildTree(
  course: CourseRow,
  nodes: NodeRow[],
  videos: VideoRow[],
  voteByVideo: Record<string, { score: number; user_vote: 1 | -1 | null }>,
  resources?: CourseLearningPathData['resources'],
  links: LinkRow[] = [],
  topicResources: TopicResourceRow[] = []
): CourseLearningPathData {
  const videosByNode = new Map<string, CourseLearningPathVideo[]>()
  for (const v of videos) {
    const list = videosByNode.get(v.node_id) ?? []
    const vote = voteByVideo[v.id]
    list.push({
      id: v.id,
      position: v.sort_order + 1,
      title: v.title,
      channel: v.channel ?? '',
      durationSeconds: v.duration_seconds ?? 0,
      url: v.url,
      thumbnailUrl: v.thumbnail_url,
      annotation: v.annotation ?? undefined,
      score: vote?.score ?? 0,
      userVote: vote?.user_vote ?? null
    })
    videosByNode.set(v.node_id, list)
  }
  for (const [nodeId, list] of videosByNode) {
    videosByNode.set(nodeId, sortCourseLearningPathByRank(list))
  }

  const testsByNode = new Map<string, CourseLearningPathLink[]>()
  const slidesByNode = new Map<string, CourseLearningPathLink[]>()
  for (const link of links) {
    const item: CourseLearningPathLink = {
      id: link.id,
      position: link.sort_order + 1,
      title: link.title,
      url: link.url
    }
    const bucket = link.kind === 'slide' ? slidesByNode : testsByNode
    const list = bucket.get(link.node_id) ?? []
    list.push(item)
    bucket.set(link.node_id, list)
  }
  for (const [nodeId, list] of testsByNode) {
    testsByNode.set(nodeId, sortCourseLearningPathLinks(list))
  }
  for (const [nodeId, list] of slidesByNode) {
    slidesByNode.set(nodeId, sortCourseLearningPathLinks(list))
  }

  const topicResourcesByNode = new Map<string, CourseLearningPathTopicResource[]>()
  for (const row of topicResources) {
    const list = topicResourcesByNode.get(row.node_id) ?? []
    list.push({
      id: row.id,
      kind: row.kind,
      position: row.sort_order + 1,
      title: row.title,
      url: row.url?.trim() || undefined,
      passage: row.passage?.trim() || undefined,
      why: row.why?.trim() || undefined
    })
    topicResourcesByNode.set(row.node_id, list)
  }
  for (const [nodeId, list] of topicResourcesByNode) {
    topicResourcesByNode.set(nodeId, sortCourseLearningPathTopicResources(list))
  }

  const childrenByParent = new Map<string | null, NodeRow[]>()
  let mentalMapVideos: CourseLearningPathVideo[] | undefined
  let mentalMapTopicResources: CourseLearningPathTopicResource[] | undefined
  for (const n of nodes) {
    if (isMentalMapNodeRow(n)) {
      const list = videosByNode.get(n.id)
      if (list?.length) {
        mentalMapVideos = sortCourseLearningPathByRank([
          ...(mentalMapVideos ?? []),
          ...list
        ])
      }
      const stored = topicResourcesByNode.get(n.id)
      const legacy = mergeCourseLearningPathLegacyResources(
        videosByNode.get(n.id),
        slidesByNode.get(n.id),
        testsByNode.get(n.id)
      )
      const combined = stored?.length ? stored : legacy
      if (combined.length) {
        mentalMapTopicResources = sortCourseLearningPathTopicResources([
          ...(mentalMapTopicResources ?? []),
          ...combined
        ])
      }
      continue
    }
    const key = n.parent_id
    const list = childrenByParent.get(key) ?? []
    list.push(n)
    childrenByParent.set(key, list)
  }
  for (const [, list] of childrenByParent) {
    list.sort((a, b) => a.sort_order - b.sort_order)
  }

  function toNode(row: NodeRow): CourseLearningPathNode {
    const childRows = childrenByParent.get(row.id) ?? []
    const nodeVideos = videosByNode.get(row.id)
    const nodeTests = testsByNode.get(row.id)
    const nodeSlides = slidesByNode.get(row.id)
    const stored = topicResourcesByNode.get(row.id)
    const topicResourceList = stored?.length
      ? stored
      : mergeCourseLearningPathLegacyResources(nodeVideos, nodeSlides, nodeTests)
    return {
      id: row.id,
      type: row.node_type,
      title: row.title,
      description: row.description ?? undefined,
      videos: nodeVideos?.length ? nodeVideos : undefined,
      tests: nodeTests?.length ? nodeTests : undefined,
      slides: nodeSlides?.length ? nodeSlides : undefined,
      topicResources: topicResourceList.length ? topicResourceList : undefined,
      children: childRows.length ? childRows.map(toNode) : undefined
    }
  }

  const roots = childrenByParent.get(null) ?? []
  return {
    id: course.id,
    slug: course.slug,
    title: course.title,
    description: course.description ?? '',
    topics: roots.map(toNode),
    resources: resources?.length ? resources : undefined,
    mentalMapVideos,
    mentalMapTopicResources,
    dbBacked: true,
    createdAt: course.created_at || undefined
  }
}

/**
 * Get or create the hidden node that stores Mental Map videos for a course.
 * `curated_course_videos.node_id` is a UUID FK, so videos cannot use the
 * `mental-map:${slug}` notes key.
 */
export async function ensureMentalMapNodeId(
  courseId: string
): Promise<string | null> {
  const supabase = getSupabaseClient()
  if (!supabase || !courseId) return null

  const { data: existingRows, error: findError } = await supabase
    .from('curated_course_nodes')
    .select('id')
    .eq('course_id', courseId)
    .eq('description', MENTAL_MAP_NODE_MARKER)
    .order('sort_order', { ascending: true })
    .limit(1)

  if (findError) {
    console.error('ensureMentalMapNodeId: lookup failed', findError)
    return null
  }
  const existingId = existingRows?.[0]?.id
  if (existingId) return existingId

  const { data: created, error: insertError } = await supabase
    .from('curated_course_nodes')
    .insert({
      course_id: courseId,
      parent_id: null,
      node_type: 'topic',
      title: 'Mental Map',
      description: MENTAL_MAP_NODE_MARKER,
      sort_order: -1
    })
    .select('id')
    .single()

  if (created?.id) return created.id

  const { data: racedRows } = await supabase
    .from('curated_course_nodes')
    .select('id')
    .eq('course_id', courseId)
    .eq('description', MENTAL_MAP_NODE_MARKER)
    .limit(1)
  const racedId = racedRows?.[0]?.id
  if (racedId) return racedId

  console.error('ensureMentalMapNodeId: insert failed', insertError)
  return null
}

async function getVoteSummaries(
  videoIds: string[]
): Promise<Record<string, { score: number; user_vote: 1 | -1 | null }>> {
  const supabase = getSupabaseClient()
  const out: Record<string, { score: number; user_vote: 1 | -1 | null }> = {}
  videoIds.forEach((id) => {
    out[id] = { score: 0, user_vote: null }
  })
  if (!supabase || videoIds.length === 0) return out

  const { data: rows } = await supabase
    .from('votes')
    .select('target_id, value, user_id')
    .eq('target_type', 'course_video')
    .in('target_id', videoIds)

  const {
    data: { user }
  } = await supabase.auth.getUser()

  ;(rows || []).forEach(
    (r: { target_id: string; value: number; user_id: string }) => {
      const cur = out[r.target_id] ?? { score: 0, user_vote: null }
      cur.score += r.value
      if (user && r.user_id === user.id) {
        cur.user_vote = r.value === 1 || r.value === -1 ? r.value : null
      }
      out[r.target_id] = cur
    }
  )
  return out
}

/**
 * Load a syllabus course by slug from Supabase.
 * Returns null when Supabase is unavailable or the slug is missing.
 */
export async function getCourseLearningPathData(
  slug: string
): Promise<CourseLearningPathData | null> {
  const supabase = getSupabaseClient()
  if (!supabase || !slug) return null

  const { data: course, error: courseError } = await supabase
    .from('curated_courses')
    .select('id, slug, title, description, created_at')
    .eq('slug', slug)
    .maybeSingle()

  if (courseError || !course) return null

  const { data: nodes, error: nodesError } = await supabase
    .from('curated_course_nodes')
    .select(
      'id, course_id, parent_id, node_type, title, description, sort_order'
    )
    .eq('course_id', course.id)
    .order('sort_order', { ascending: true })

  if (nodesError) return null

  const nodeIds = (nodes || []).map((n) => n.id)
  let videos: VideoRow[] = []
  if (nodeIds.length > 0) {
    const { data: videoRows, error: videosError } = await supabase
      .from('curated_course_videos')
      .select(
        'id, node_id, sort_order, title, channel, duration_seconds, url, thumbnail_url, annotation'
      )
      .in('node_id', nodeIds)
      .order('sort_order', { ascending: true })

    if (videosError) return null
    videos = (videoRows || []) as VideoRow[]
  }

  let links: LinkRow[] = []
  if (nodeIds.length > 0) {
    const { data: linkRows, error: linksError } = await supabase
      .from('curated_course_links')
      .select('id, node_id, kind, sort_order, title, url')
      .in('node_id', nodeIds)
      .order('sort_order', { ascending: true })

    if (!linksError) links = (linkRows || []) as LinkRow[]
  }

  let topicResources: TopicResourceRow[] = []
  if (nodeIds.length > 0) {
    const { data: topicResourceRows, error: topicResourcesError } = await supabase
      .from('curated_course_node_resources')
      .select('id, node_id, kind, sort_order, title, url, passage, why')
      .in('node_id', nodeIds)
      .order('sort_order', { ascending: true })

    if (!topicResourcesError) {
      topicResources = (topicResourceRows || []) as TopicResourceRow[]
    }
  }

  const voteByVideo = await getVoteSummaries(videos.map((v) => v.id))

  let resources: CourseLearningPathData['resources'] = undefined
  const { data: resourceRows, error: resourcesError } = await supabase
    .from('curated_course_resources')
    .select('kind, title, link_or_site, description, sort_order')
    .eq('course_id', course.id)
    .order('sort_order', { ascending: true })

  if (!resourcesError && resourceRows?.length) {
    resources = (resourceRows as ResourceRow[]).map((r) => ({
      kind: r.kind,
      title: r.title,
      linkOrSite: r.link_or_site,
      description: r.description ?? ''
    }))
  }

  return buildTree(
    course as CourseRow,
    (nodes || []) as NodeRow[],
    videos,
    voteByVideo,
    resources,
    links,
    topicResources
  )
}

/** List available syllabus courses (title + slug) for a future course picker. */
export async function listCourseLearningPaths(): Promise<
  Array<{ id: string; slug: string; title: string }>
> {
  const supabase = getSupabaseClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('curated_courses')
    .select('id, slug, title')
    .order('title', { ascending: true })

  if (error || !data) return []
  return data
}

export type AddCourseLearningPathVideoInput = {
  nodeId: string
  url: string
  title?: string
  annotation?: string
  description?: string
  /** Auto-filled syllabus path for the community resources feed. */
  conceptTree?: string
  /** Course learning path slug for the community feed link. */
  courseSlug?: string
  /** 1-based suggested index in the current list (1 … length+1). */
  suggestedPlacement?: number
}

function titleFromUrl(url: string): string {
  try {
    const u = new URL(url)
    const yt = extractYouTubeVideoId(url)
    if (yt) return `YouTube video (${yt})`
    const host = u.hostname.replace(/^www\./, '')
    const path = u.pathname.replace(/\/$/, '')
    if (path && path !== '/') {
      const last = path.split('/').filter(Boolean).pop() || ''
      return decodeURIComponent(last.replace(/[-_]+/g, ' ')) || host
    }
    return host
  } catch {
    return url.slice(0, 80)
  }
}

/** Persist 1-based positions as 0-based sort_order for a node. */
export async function persistCourseLearningPathVideoOrder(
  orderedVideos: CourseLearningPathVideo[]
): Promise<boolean> {
  const supabase = getSupabaseClient()
  if (!supabase || orderedVideos.length === 0) return true

  const results = await Promise.all(
    orderedVideos.map((v, i) =>
      supabase
        .from('curated_course_videos')
        .update({ sort_order: i, updated_at: new Date().toISOString() })
        .eq('id', v.id)
    )
  )
  return results.every((r) => !r.error)
}

function communityTypeForCourseLearningPathLink(
  kind: CourseLearningPathLinkKind
): ResourceDbType {
  return kind === 'slide' ? 'slides' : 'problem_set'
}

async function courseLearningPathOriginForNode(nodeId: string): Promise<{
  conceptTree: string
  courseSlug: string | null
} | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  const titles: string[] = []
  let currentId: string | null = nodeId
  let courseId: string | null = null
  for (let i = 0; i < 20 && currentId; i++) {
    const { data } = await supabase
      .from('curated_course_nodes')
      .select('parent_id, course_id, title')
      .eq('id', currentId)
      .maybeSingle()
    if (!data) break
    titles.unshift(data.title)
    courseId = data.course_id
    currentId = data.parent_id
  }
  let courseSlug: string | null = null
  if (courseId) {
    const { data: course } = await supabase
      .from('curated_courses')
      .select('title, slug')
      .eq('id', courseId)
      .maybeSingle()
    if (course?.title) titles.unshift(course.title)
    if (course?.slug) courseSlug = course.slug
  }
  const conceptTree = titles
    .map((part) => part.trim())
    .filter(Boolean)
    .join(' --> ')
  if (!conceptTree && !courseSlug) return null
  return { conceptTree, courseSlug }
}

async function publishCourseLearningPathItemToCommunity(input: {
  title: string
  description?: string
  url: string
  type: ResourceDbType
  conceptTree?: string
  courseSlug?: string
  nodeId: string
}): Promise<string | null> {
  let conceptTree = input.conceptTree?.trim() || ''
  let courseSlug = input.courseSlug?.trim() || ''
  if (!conceptTree || !courseSlug) {
    const origin = await courseLearningPathOriginForNode(input.nodeId)
    conceptTree = conceptTree || origin?.conceptTree || ''
    courseSlug = courseSlug || origin?.courseSlug || ''
  }
  const created = await addCommunityPageResource({
    title: input.title,
    description: input.description ?? '',
    url: input.url,
    type: input.type,
    conceptTree,
    fromCourseLearningPath: true,
    courseLearningPathSlug: courseSlug || null
  })
  if (!created) {
    console.error('publishCourseLearningPathItemToCommunity failed')
    return null
  }
  return created.id
}

/**
 * Add a curated video at a suggested 1-based placement.
 * Returns the new video and the full reordered list for that node.
 * Also publishes the video to the community resources feed.
 */
export async function addCourseLearningPathVideo(
  input: AddCourseLearningPathVideoInput,
  currentVideos: CourseLearningPathVideo[]
): Promise<{
  video: CourseLearningPathVideo
  ordered: CourseLearningPathVideo[]
} | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return null

  const url = input.url.trim()
  if (!url) return null

  const ytId = extractYouTubeVideoId(url)
  const thumbnailUrl = ytId ? getYouTubeThumbnailUrl(ytId, 'hq') : null
  const title = (input.title || '').trim() || titleFromUrl(url)
  const maxPlacement = currentVideos.length + 1
  const placementRaw = input.suggestedPlacement
  const placement =
    placementRaw == null || !Number.isFinite(Number(placementRaw))
      ? maxPlacement
      : Math.min(Math.max(1, Math.round(Number(placementRaw))), maxPlacement)

  // Temporary sort_order; rewritten after we compute the full order.
  const { data, error } = await supabase
    .from('curated_course_videos')
    .insert({
      node_id: input.nodeId,
      sort_order: placement - 1,
      title,
      channel: null,
      duration_seconds: null,
      url,
      thumbnail_url: thumbnailUrl,
      annotation: input.annotation?.trim() || input.description?.trim() || null
    })
    .select(
      'id, node_id, sort_order, title, channel, duration_seconds, url, thumbnail_url, annotation'
    )
    .single()

  if (error || !data) {
    console.error('addCourseLearningPathVideo failed', error)
    return null
  }

  const row = data as VideoRow
  const created: CourseLearningPathVideo = {
    id: row.id,
    position: placement,
    title: row.title,
    channel: row.channel ?? '',
    durationSeconds: row.duration_seconds ?? 0,
    url: row.url,
    thumbnailUrl: row.thumbnail_url,
    annotation: row.annotation ?? undefined,
    score: 0,
    userVote: null
  }

  const ordered = insertVideoAtPlacement(currentVideos, created, placement)
  const ok = await persistCourseLearningPathVideoOrder(ordered)
  if (!ok) {
    console.error('addCourseLearningPathVideo: failed to persist order')
  }

  const resourceId = await publishCourseLearningPathItemToCommunity({
    title: row.title,
    description: input.description,
    url: row.url,
    type: 'video',
    conceptTree: input.conceptTree,
    courseSlug: input.courseSlug,
    nodeId: input.nodeId
  })
  if (resourceId) {
    const { error: linkError } = await supabase
      .from('curated_course_videos')
      .update({ resource_id: resourceId, updated_at: new Date().toISOString() })
      .eq('id', row.id)
    if (linkError) {
      console.error(
        'addCourseLearningPathVideo: failed to link community resource',
        linkError
      )
    }
  }

  return { video: { ...created, position: placement }, ordered }
}

export type AddCourseLearningPathLinkInput = {
  nodeId: string
  kind: CourseLearningPathLinkKind
  url: string
  title?: string
  description?: string
  /** Auto-filled syllabus path for the community resources feed. */
  conceptTree?: string
  /** Course learning path slug for the community feed link. */
  courseSlug?: string
  /** 1-based suggested index in the current list (1 … length+1). */
  suggestedPlacement?: number
}

export async function persistCourseLearningPathLinkOrder(
  orderedLinks: CourseLearningPathLink[]
): Promise<boolean> {
  const supabase = getSupabaseClient()
  if (!supabase || orderedLinks.length === 0) return true

  const results = await Promise.all(
    orderedLinks.map((link, i) =>
      supabase
        .from('curated_course_links')
        .update({ sort_order: i, updated_at: new Date().toISOString() })
        .eq('id', link.id)
    )
  )
  return results.every((r) => !r.error)
}

export async function addCourseLearningPathLink(
  input: AddCourseLearningPathLinkInput,
  currentLinks: CourseLearningPathLink[]
): Promise<{ link: CourseLearningPathLink; ordered: CourseLearningPathLink[] } | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return null

  const url = input.url.trim()
  if (!url) return null

  const title = (input.title || '').trim() || titleFromUrl(url)
  const maxPlacement = currentLinks.length + 1
  const placementRaw = input.suggestedPlacement
  const placement =
    placementRaw == null || !Number.isFinite(Number(placementRaw))
      ? maxPlacement
      : Math.min(Math.max(1, Math.round(Number(placementRaw))), maxPlacement)

  const { data, error } = await supabase
    .from('curated_course_links')
    .insert({
      node_id: input.nodeId,
      kind: input.kind,
      sort_order: placement - 1,
      title,
      url
    })
    .select('id, node_id, kind, sort_order, title, url')
    .single()

  if (error || !data) {
    console.error('addCourseLearningPathLink failed', error)
    return null
  }

  const row = data as LinkRow
  const created: CourseLearningPathLink = {
    id: row.id,
    position: placement,
    title: row.title,
    url: row.url
  }

  const ordered = insertLinkAtPlacement(currentLinks, created, placement)
  const ok = await persistCourseLearningPathLinkOrder(ordered)
  if (!ok) {
    console.error('addCourseLearningPathLink: failed to persist order')
  }

  const resourceId = await publishCourseLearningPathItemToCommunity({
    title: row.title,
    description: input.description,
    url: row.url,
    type: communityTypeForCourseLearningPathLink(input.kind),
    conceptTree: input.conceptTree,
    courseSlug: input.courseSlug,
    nodeId: input.nodeId
  })
  if (resourceId) {
    const { error: linkError } = await supabase
      .from('curated_course_links')
      .update({ resource_id: resourceId, updated_at: new Date().toISOString() })
      .eq('id', row.id)
    if (linkError) {
      console.error(
        'addCourseLearningPathLink: failed to link community resource',
        linkError
      )
    }
  }

  return { link: { ...created, position: placement }, ordered }
}

export function createLocalCourseLearningPathLink(
  input: Omit<AddCourseLearningPathLinkInput, 'nodeId'> & { nodeId?: string }
): CourseLearningPathLink {
  const url = input.url.trim()
  return {
    id: `local_${input.kind}_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 8)}`,
    position: 9999,
    title: (input.title || '').trim() || titleFromUrl(url),
    url
  }
}

/** Vote on a course video (null clears). Returns the new score, or null on failure. */
export async function setCourseLearningPathVideoVote(
  videoId: string,
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
      .eq('target_type', 'course_video')
      .eq('target_id', videoId)
    if (error) {
      console.error('clear course video vote failed', error)
      return null
    }
  } else {
    const { error } = await supabase.from('votes').upsert(
      {
        user_id: user.id,
        target_type: 'course_video',
        target_id: videoId,
        value
      },
      { onConflict: 'user_id,target_type,target_id' }
    )
    if (error) {
      console.error('set course video vote failed', error)
      return null
    }
  }

  const { data: rows, error: scoreError } = await supabase
    .from('votes')
    .select('value')
    .eq('target_type', 'course_video')
    .eq('target_id', videoId)

  if (scoreError) return null
  return (rows || []).reduce((s, r) => s + (r as { value: number }).value, 0)
}

/** Build a local-only video ref (seed / offline edit mode). */
export function createLocalCourseLearningPathVideo(
  input: Omit<AddCourseLearningPathVideoInput, 'nodeId'> & { nodeId?: string }
): CourseLearningPathVideo {
  const url = input.url.trim()
  const ytId = extractYouTubeVideoId(url)
  return {
    id: `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    position: 9999,
    title: (input.title || '').trim() || titleFromUrl(url),
    channel: '',
    durationSeconds: 0,
    url,
    thumbnailUrl: ytId ? getYouTubeThumbnailUrl(ytId, 'hq') : null,
    annotation: input.annotation?.trim() || undefined,
    score: 0,
    userVote: null
  }
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function isUuid(id: string): boolean {
  return Boolean(id && UUID_RE.test(id))
}

function communityTypeForTopicResource(
  kind: CourseLearningPathTopicResourceKind
): ResourceDbType {
  if (kind === 'video') return 'video'
  if (kind === 'paper') return 'paper'
  if (kind === 'exercise') return 'problem_set'
  return 'textbook'
}

export type AddCourseLearningPathTopicResourceInput = {
  nodeId: string
  kind: CourseLearningPathTopicResourceKind
  title?: string
  url?: string
  passage?: string
  why?: string
  conceptTree?: string
  courseSlug?: string
  suggestedPlacement?: number
}

export async function persistCourseLearningPathTopicResourceOrder(
  ordered: CourseLearningPathTopicResource[]
): Promise<boolean> {
  const supabase = getSupabaseClient()
  if (!supabase || ordered.length === 0) return true

  const results = await Promise.all(
    ordered.map((item, i) =>
      supabase
        .from('curated_course_node_resources')
        .update({ sort_order: i, updated_at: new Date().toISOString() })
        .eq('id', item.id)
    )
  )
  return results.every((r) => !r.error)
}

async function copyLegacyTopicResourcesIfNeeded(
  nodeId: string,
  current: CourseLearningPathTopicResource[]
): Promise<CourseLearningPathTopicResource[]> {
  const supabase = getSupabaseClient()
  if (!supabase || current.length === 0) return current

  const { data: existing, error } = await supabase
    .from('curated_course_node_resources')
    .select('id')
    .eq('node_id', nodeId)
    .limit(1)

  if (error) {
    console.error('copyLegacyTopicResourcesIfNeeded: lookup failed', error)
    return current
  }
  if (existing?.length) return current

  const rows = current.map((item, i) => ({
    ...(isUuid(item.id) ? { id: item.id } : {}),
    node_id: nodeId,
    kind: item.kind,
    sort_order: i,
    title: item.title,
    url: item.url?.trim() || null,
    passage: item.passage?.trim() || null,
    why: item.why?.trim() || null
  }))

  const { data: inserted, error: insertError } = await supabase
    .from('curated_course_node_resources')
    .insert(rows)
    .select('id, kind, sort_order, title, url, passage, why')

  if (insertError || !inserted?.length) {
    console.error('copyLegacyTopicResourcesIfNeeded: insert failed', insertError)
    return current
  }

  return sortCourseLearningPathTopicResources(
    (inserted as TopicResourceRow[]).map((row) => ({
      id: row.id,
      kind: row.kind,
      position: row.sort_order + 1,
      title: row.title,
      url: row.url?.trim() || undefined,
      passage: row.passage?.trim() || undefined,
      why: row.why?.trim() || undefined
    }))
  )
}

export async function addCourseLearningPathTopicResource(
  input: AddCourseLearningPathTopicResourceInput,
  currentResources: CourseLearningPathTopicResource[]
): Promise<{
  resource: CourseLearningPathTopicResource
  ordered: CourseLearningPathTopicResource[]
} | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return null

  const url = (input.url || '').trim()
  const title =
    (input.title || '').trim() || (url ? titleFromUrl(url) : '')
  if (!title) return null

  const seeded = await copyLegacyTopicResourcesIfNeeded(
    input.nodeId,
    currentResources
  )

  const maxPlacement = seeded.length + 1
  const placementRaw = input.suggestedPlacement
  const placement =
    placementRaw == null || !Number.isFinite(Number(placementRaw))
      ? maxPlacement
      : Math.min(Math.max(1, Math.round(Number(placementRaw))), maxPlacement)

  const { data, error } = await supabase
    .from('curated_course_node_resources')
    .insert({
      node_id: input.nodeId,
      kind: input.kind,
      sort_order: placement - 1,
      title,
      url: url || null,
      passage: input.passage?.trim() || null,
      why: input.why?.trim() || null
    })
    .select('id, node_id, kind, sort_order, title, url, passage, why')
    .single()

  if (error || !data) {
    console.error('addCourseLearningPathTopicResource failed', error)
    return null
  }

  const row = data as TopicResourceRow
  const created: CourseLearningPathTopicResource = {
    id: row.id,
    kind: row.kind,
    position: placement,
    title: row.title,
    url: row.url?.trim() || undefined,
    passage: row.passage?.trim() || undefined,
    why: row.why?.trim() || undefined
  }

  const ordered = insertTopicResourceAtPlacement(seeded, created, placement)
  const ok = await persistCourseLearningPathTopicResourceOrder(ordered)
  if (!ok) {
    console.error('addCourseLearningPathTopicResource: failed to persist order')
  }

  if (url) {
    const description = [input.passage, input.why]
      .map((part) => part?.trim())
      .filter(Boolean)
      .join('\n\n')
    const resourceId = await publishCourseLearningPathItemToCommunity({
      title: row.title,
      description,
      url,
      type: communityTypeForTopicResource(row.kind),
      conceptTree: input.conceptTree,
      courseSlug: input.courseSlug,
      nodeId: input.nodeId
    })
    if (resourceId) {
      const { error: linkError } = await supabase
        .from('curated_course_node_resources')
        .update({
          resource_id: resourceId,
          updated_at: new Date().toISOString()
        })
        .eq('id', row.id)
      if (linkError) {
        console.error(
          'addCourseLearningPathTopicResource: failed to link community resource',
          linkError
        )
      }
    }
  }

  return { resource: created, ordered }
}

export type UpdateCourseLearningPathTopicResourceInput =
  AddCourseLearningPathTopicResourceInput & { resourceId: string }

export async function updateCourseLearningPathTopicResource(
  input: UpdateCourseLearningPathTopicResourceInput,
  currentResources: CourseLearningPathTopicResource[]
): Promise<{
  resource: CourseLearningPathTopicResource
  ordered: CourseLearningPathTopicResource[]
} | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return null

  const original = currentResources.find((item) => item.id === input.resourceId)
  if (!original) return null

  const url = (input.url || '').trim()
  const title =
    (input.title || '').trim() || (url ? titleFromUrl(url) : original.title)
  if (!title) return null

  const seeded = await copyLegacyTopicResourcesIfNeeded(
    input.nodeId,
    currentResources
  )
  const target =
    seeded.find((item) => item.id === input.resourceId) ??
    seeded.find(
      (item) =>
        item.title === original.title && item.position === original.position
    )
  if (!target) return null

  const { error } = await supabase
    .from('curated_course_node_resources')
    .update({
      kind: input.kind,
      title,
      url: url || null,
      passage: input.passage?.trim() || null,
      why: input.why?.trim() || null,
      updated_at: new Date().toISOString()
    })
    .eq('id', target.id)

  if (error) {
    console.error('updateCourseLearningPathTopicResource failed', error)
    return null
  }

  const patched: CourseLearningPathTopicResource = {
    ...target,
    kind: input.kind,
    title,
    url: url || undefined,
    passage: input.passage?.trim() || undefined,
    why: input.why?.trim() || undefined
  }
  const withFields = seeded.map((item) =>
    item.id === target.id ? patched : item
  )
  const placement =
    input.suggestedPlacement == null ||
    !Number.isFinite(Number(input.suggestedPlacement))
      ? patched.position
      : Number(input.suggestedPlacement)
  const ordered = moveTopicResourceToPlacement(
    withFields,
    target.id,
    placement
  )
  const ok = await persistCourseLearningPathTopicResourceOrder(ordered)
  if (!ok) {
    console.error(
      'updateCourseLearningPathTopicResource: failed to persist order'
    )
  }

  const resource = ordered.find((item) => item.id === target.id) ?? patched
  return { resource, ordered }
}

export function createLocalCourseLearningPathTopicResource(
  input: AddCourseLearningPathTopicResourceInput
): CourseLearningPathTopicResource {
  const url = (input.url || '').trim()
  return {
    id: `local_topic_res_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    kind: input.kind,
    position: 9999,
    title: (input.title || '').trim() || (url ? titleFromUrl(url) : 'Untitled'),
    url: url || undefined,
    passage: input.passage?.trim() || undefined,
    why: input.why?.trim() || undefined
  }
}
