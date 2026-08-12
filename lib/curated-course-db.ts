/**
 * Course Videos data layer — syllabus tree + curated videos
 * (curated_courses / curated_course_* tables).
 */
import { getSupabaseClient } from './supabase'
import {
  insertVideoAtPlacement,
  sortCuratedCourseByRank,
  type CuratedCourseData,
  type CuratedCourseNode,
  type CuratedCourseNodeType,
  type CuratedCourseVideo
} from './curated-course-types'
import {
  extractYouTubeVideoId,
  getYouTubeThumbnailUrl
} from './youtube-thumbnail'

type CourseRow = {
  id: string
  slug: string
  title: string
  description: string | null
}

type NodeRow = {
  id: string
  course_id: string
  parent_id: string | null
  node_type: CuratedCourseNodeType
  title: string
  description: string | null
  sort_order: number
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
  resources?: CuratedCourseData['resources']
): CuratedCourseData {
  const videosByNode = new Map<string, CuratedCourseVideo[]>()
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
    videosByNode.set(nodeId, sortCuratedCourseByRank(list))
  }

  const childrenByParent = new Map<string | null, NodeRow[]>()
  for (const n of nodes) {
    const key = n.parent_id
    const list = childrenByParent.get(key) ?? []
    list.push(n)
    childrenByParent.set(key, list)
  }
  for (const [, list] of childrenByParent) {
    list.sort((a, b) => a.sort_order - b.sort_order)
  }

  function toNode(row: NodeRow): CuratedCourseNode {
    const childRows = childrenByParent.get(row.id) ?? []
    const nodeVideos = videosByNode.get(row.id)
    return {
      id: row.id,
      type: row.node_type,
      title: row.title,
      description: row.description ?? undefined,
      videos: nodeVideos?.length ? nodeVideos : undefined,
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
    dbBacked: true
  }
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

  ;(rows || []).forEach((r: { target_id: string; value: number; user_id: string }) => {
    const cur = out[r.target_id] ?? { score: 0, user_vote: null }
    cur.score += r.value
    if (user && r.user_id === user.id) {
      cur.user_vote = r.value === 1 || r.value === -1 ? r.value : null
    }
    out[r.target_id] = cur
  })
  return out
}

/**
 * Load a syllabus course by slug from Supabase.
 * Returns null when Supabase is unavailable or the slug is missing.
 */
export async function getCuratedCourseData(
  slug: string
): Promise<CuratedCourseData | null> {
  const supabase = getSupabaseClient()
  if (!supabase || !slug) return null

  const { data: course, error: courseError } = await supabase
    .from('curated_courses')
    .select('id, slug, title, description')
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

  const voteByVideo = await getVoteSummaries(videos.map((v) => v.id))

  let resources: CuratedCourseData['resources'] = undefined
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
    resources
  )
}

/** List available syllabus courses (title + slug) for a future course picker. */
export async function listCuratedCourses(): Promise<
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

export type AddCuratedCourseVideoInput = {
  nodeId: string
  url: string
  title?: string
  annotation?: string
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
export async function persistCuratedCourseVideoOrder(
  orderedVideos: CuratedCourseVideo[]
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

/**
 * Add a curated video at a suggested 1-based placement.
 * Returns the new video and the full reordered list for that node.
 */
export async function addCuratedCourseVideo(
  input: AddCuratedCourseVideoInput,
  currentVideos: CuratedCourseVideo[]
): Promise<{ video: CuratedCourseVideo; ordered: CuratedCourseVideo[] } | null> {
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
      annotation: input.annotation?.trim() || null
    })
    .select(
      'id, node_id, sort_order, title, channel, duration_seconds, url, thumbnail_url, annotation'
    )
    .single()

  if (error || !data) {
    console.error('addCuratedCourseVideo failed', error)
    return null
  }

  const row = data as VideoRow
  const created: CuratedCourseVideo = {
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

  const ordered = insertVideoAtPlacement(
    currentVideos,
    created,
    placement
  )
  const ok = await persistCuratedCourseVideoOrder(ordered)
  if (!ok) {
    console.error('addCuratedCourseVideo: failed to persist order')
  }

  return { video: { ...created, position: placement }, ordered }
}

/** Vote on a course video (null clears). Returns the new score, or null on failure. */
export async function setCuratedCourseVideoVote(
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
export function createLocalCuratedCourseVideo(
  input: Omit<AddCuratedCourseVideoInput, 'nodeId'> & { nodeId?: string }
): CuratedCourseVideo {
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
