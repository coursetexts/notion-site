/** Shared types for the course-learning-path syllabus + curated video library. */
import type { CourseResource } from '@/lib/undergraduate-degrees'

export type CourseLearningPathNodeType = 'topic' | 'subtopic' | 'concept'

export interface CourseLearningPathVideo {
  id: string
  /** 1-based position within this node's ordered list */
  position: number
  title: string
  channel: string
  durationSeconds: number
  url: string
  /** Optional remote thumbnail; otherwise derived from YouTube URL when possible */
  thumbnailUrl?: string | null
  /** Short prompt used only by the local seed for placeholder art */
  thumbnailQuery?: string
  annotation?: string
  /** Community ranking score (upvotes − downvotes). */
  score?: number
  /** Current user's vote, if any. */
  userVote?: 1 | -1 | null
}

export type CourseLearningPathLinkKind = 'test' | 'slide'

/** Simple title + URL item (tests, slides). */
export interface CourseLearningPathLink {
  id: string
  /** 1-based position within this node's ordered list */
  position: number
  title: string
  url: string
}

export type CourseLearningPathTopicResourceKind =
  | 'article'
  | 'video'
  | 'book'
  | 'course'
  | 'paper'
  | 'exercise'

export const COURSE_LEARNING_PATH_TOPIC_RESOURCE_KINDS: CourseLearningPathTopicResourceKind[] =
  ['article', 'video', 'book', 'course', 'paper', 'exercise']

/** Unified sequenced resource on a syllabus topic (or General Approach). */
export interface CourseLearningPathTopicResource {
  id: string
  kind: CourseLearningPathTopicResourceKind
  /** 1-based place in the combined Resources list. */
  position: number
  title: string
  url?: string
  /** The specific part that helped. */
  passage?: string
  why?: string
}

export interface CourseLearningPathNode {
  id: string
  type: CourseLearningPathNodeType
  title: string
  description?: string
  videos?: CourseLearningPathVideo[]
  tests?: CourseLearningPathLink[]
  slides?: CourseLearningPathLink[]
  topicResources?: CourseLearningPathTopicResource[]
  children?: CourseLearningPathNode[]
}

export interface CourseLearningPathData {
  id: string
  slug: string
  title: string
  description: string
  topics: CourseLearningPathNode[]
  /** Degrees-page curated resources (textbooks, websites, channels). */
  resources?: CourseResource[]
  /** True when loaded from Supabase (mutations can persist). */
  dbBacked?: boolean
  /** Course-level videos on the General Approach page. */
  mentalMapVideos?: CourseLearningPathVideo[]
  /** Unified sequenced resources on the General Approach page. */
  mentalMapTopicResources?: CourseLearningPathTopicResource[]
  /** Hidden node id for General Approach resources stored in learning_paths.data. */
  mentalMapNodeId?: string
  /** ISO timestamp from curated_courses.created_at when loaded from the DB. */
  createdAt?: string
}

export function isCourseLearningPathPayload(
  value: unknown
): value is CourseLearningPathData {
  if (!value || typeof value !== 'object') return false
  const row = value as { slug?: unknown; topics?: unknown }
  return typeof row.slug === 'string' && Array.isArray(row.topics)
}

/**
 * True when the syllabus JSON has at least one topic with children.
 * Title-only catalog stubs (`topics: []` or topics without a tree) are false.
 * Matches `learning_paths.is_filled` (migration 029).
 */
export function courseLearningPathIsFilled(data: unknown): boolean {
  if (!data || typeof data !== 'object') return false
  const topics = (data as { topics?: unknown }).topics
  if (!Array.isArray(topics) || topics.length === 0) return false
  return topics.some((topic) => {
    if (!topic || typeof topic !== 'object') return false
    const children = (topic as { children?: unknown }).children
    return Array.isArray(children) && children.length > 0
  })
}

/** Flatten the tree into a lookup map by node id, with parent chain for breadcrumbs. */
export interface CourseLearningPathFlatNode {
  node: CourseLearningPathNode
  parents: CourseLearningPathNode[]
}

export function buildCourseLearningPathIndex(
  c: CourseLearningPathData
): Record<string, CourseLearningPathFlatNode> {
  const index: Record<string, CourseLearningPathFlatNode> = {}
  function walk(nodes: CourseLearningPathNode[], parents: CourseLearningPathNode[]) {
    for (const node of nodes) {
      index[node.id] = { node, parents }
      if (node.children?.length) walk(node.children, [...parents, node])
    }
  }
  walk(c.topics, [])
  return index
}

/**
 * Plain-text syllabus path for community resources, e.g.
 * "Linear Algebra --> Linear Systems and Elimination --> Echelon forms".
 */
export function formatCourseLearningPathConceptTree(
  courseTitle: string,
  parents: Array<{ title: string }>,
  nodeTitle: string
): string {
  return [courseTitle, ...parents.map((p) => p.title), nodeTitle]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(' --> ')
}

export function formatCourseLearningPathVideoDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

/** Order by curated position (sort_order). */
export function sortCourseLearningPathByRank(
  videos: CourseLearningPathVideo[]
): CourseLearningPathVideo[] {
  return [...videos]
    .sort((a, b) => a.position - b.position)
    .map((v, i) => ({ ...v, position: i + 1 }))
}

/** Re-rank by community score, then position — used after votes. */
export function rerankCourseLearningPathByScore(
  videos: CourseLearningPathVideo[]
): CourseLearningPathVideo[] {
  return [...videos]
    .sort((a, b) => {
      const scoreDiff = (b.score ?? 0) - (a.score ?? 0)
      if (scoreDiff !== 0) return scoreDiff
      return a.position - b.position
    })
    .map((v, i) => ({ ...v, position: i + 1 }))
}

/**
 * Insert a video at a 1-based placement within the current list
 * (1 … videos.length + 1).
 */
export function insertVideoAtPlacement(
  videos: CourseLearningPathVideo[],
  video: CourseLearningPathVideo,
  placement: number
): CourseLearningPathVideo[] {
  const ordered = sortCourseLearningPathByRank(videos)
  const max = ordered.length + 1
  const raw = Number(placement)
  const p = Number.isFinite(raw)
    ? Math.min(Math.max(1, Math.round(raw)), max)
    : max
  const next = [...ordered]
  next.splice(p - 1, 0, { ...video, position: p })
  return next.map((v, i) => ({ ...v, position: i + 1 }))
}

export function sortCourseLearningPathLinks(
  links: CourseLearningPathLink[]
): CourseLearningPathLink[] {
  return [...links]
    .sort((a, b) => a.position - b.position)
    .map((link, i) => ({ ...link, position: i + 1 }))
}

export function insertLinkAtPlacement(
  links: CourseLearningPathLink[],
  link: CourseLearningPathLink,
  placement: number
): CourseLearningPathLink[] {
  const ordered = sortCourseLearningPathLinks(links)
  const max = ordered.length + 1
  const raw = Number(placement)
  const p = Number.isFinite(raw)
    ? Math.min(Math.max(1, Math.round(raw)), max)
    : max
  const next = [...ordered]
  next.splice(p - 1, 0, { ...link, position: p })
  return next.map((item, i) => ({ ...item, position: i + 1 }))
}

export function sortCourseLearningPathTopicResources(
  items: CourseLearningPathTopicResource[]
): CourseLearningPathTopicResource[] {
  return [...items]
    .sort((a, b) => a.position - b.position)
    .map((item, i) => ({ ...item, position: i + 1 }))
}

export function insertTopicResourceAtPlacement(
  items: CourseLearningPathTopicResource[],
  item: CourseLearningPathTopicResource,
  placement: number
): CourseLearningPathTopicResource[] {
  const ordered = sortCourseLearningPathTopicResources(items)
  const max = ordered.length + 1
  const raw = Number(placement)
  const p = Number.isFinite(raw)
    ? Math.min(Math.max(1, Math.round(raw)), max)
    : max
  const next = [...ordered]
  next.splice(p - 1, 0, { ...item, position: p })
  return next.map((entry, i) => ({ ...entry, position: i + 1 }))
}

export function moveTopicResourceToPlacement(
  items: CourseLearningPathTopicResource[],
  id: string,
  placement: number
): CourseLearningPathTopicResource[] {
  const ordered = sortCourseLearningPathTopicResources(items)
  const from = ordered.findIndex((item) => item.id === id)
  if (from < 0) return ordered
  const [item] = ordered.splice(from, 1)
  const max = ordered.length + 1
  const raw = Number(placement)
  const p = Number.isFinite(raw)
    ? Math.min(Math.max(1, Math.round(raw)), max)
    : from + 1
  ordered.splice(p - 1, 0, item)
  return ordered.map((entry, i) => ({ ...entry, position: i + 1 }))
}

export function mergeCourseLearningPathLegacyResources(
  videos?: CourseLearningPathVideo[],
  slides?: CourseLearningPathLink[],
  tests?: CourseLearningPathLink[]
): CourseLearningPathTopicResource[] {
  const out: CourseLearningPathTopicResource[] = []
  for (const video of videos ?? []) {
    out.push({
      id: video.id,
      kind: 'video',
      position: out.length + 1,
      title: video.title,
      url: video.url && video.url !== '#' ? video.url : undefined,
      passage: video.annotation?.trim() || undefined
    })
  }
  for (const slide of slides ?? []) {
    out.push({
      id: slide.id,
      kind: 'article',
      position: out.length + 1,
      title: slide.title,
      url: slide.url && slide.url !== '#' ? slide.url : undefined
    })
  }
  for (const test of tests ?? []) {
    out.push({
      id: test.id,
      kind: 'exercise',
      position: out.length + 1,
      title: test.title,
      url: test.url && test.url !== '#' ? test.url : undefined
    })
  }
  return out
}

export type CourseLearningPathLinkField = 'tests' | 'slides'

export function linkFieldForKind(
  kind: CourseLearningPathLinkKind
): CourseLearningPathLinkField {
  return kind === 'test' ? 'tests' : 'slides'
}

/** Immutably replace tests or slides on a node anywhere in the tree. */
export function mapCourseLearningPathNodeLinks(
  course: CourseLearningPathData,
  nodeId: string,
  field: CourseLearningPathLinkField,
  updater: (links: CourseLearningPathLink[]) => CourseLearningPathLink[]
): CourseLearningPathData {
  function mapNodes(nodes: CourseLearningPathNode[]): CourseLearningPathNode[] {
    return nodes.map((node) => {
      if (node.id === nodeId) {
        const next = sortCourseLearningPathLinks(updater(node[field] ?? []))
        return { ...node, [field]: next.length ? next : undefined }
      }
      if (node.children?.length) {
        return { ...node, children: mapNodes(node.children) }
      }
      return node
    })
  }
  return { ...course, topics: mapNodes(course.topics) }
}

export function mapCourseLearningPathNodeTopicResources(
  course: CourseLearningPathData,
  nodeId: string,
  updater: (
    items: CourseLearningPathTopicResource[]
  ) => CourseLearningPathTopicResource[]
): CourseLearningPathData {
  function mapNodes(nodes: CourseLearningPathNode[]): CourseLearningPathNode[] {
    return nodes.map((node) => {
      if (node.id === nodeId) {
        const next = sortCourseLearningPathTopicResources(
          updater(node.topicResources ?? [])
        )
        return { ...node, topicResources: next.length ? next : undefined }
      }
      if (node.children?.length) {
        return { ...node, children: mapNodes(node.children) }
      }
      return node
    })
  }
  return { ...course, topics: mapNodes(course.topics) }
}

export function mapCourseLearningPathMentalMapTopicResources(
  course: CourseLearningPathData,
  updater: (
    items: CourseLearningPathTopicResource[]
  ) => CourseLearningPathTopicResource[]
): CourseLearningPathData {
  const next = sortCourseLearningPathTopicResources(
    updater(course.mentalMapTopicResources ?? [])
  )
  return {
    ...course,
    mentalMapTopicResources: next.length ? next : undefined
  }
}

/** Immutably replace videos on a node anywhere in the tree. */
export function mapCourseLearningPathNodeVideos(
  course: CourseLearningPathData,
  nodeId: string,
  updater: (videos: CourseLearningPathVideo[]) => CourseLearningPathVideo[],
  options?: { rerankByScore?: boolean }
): CourseLearningPathData {
  function mapNodes(nodes: CourseLearningPathNode[]): CourseLearningPathNode[] {
    return nodes.map((node) => {
      if (node.id === nodeId) {
        const updated = updater(node.videos ?? [])
        const next = options?.rerankByScore
          ? rerankCourseLearningPathByScore(updated)
          : sortCourseLearningPathByRank(updated)
        return { ...node, videos: next.length ? next : undefined }
      }
      if (node.children?.length) {
        return { ...node, children: mapNodes(node.children) }
      }
      return node
    })
  }
  return { ...course, topics: mapNodes(course.topics) }
}

export function mapCourseLearningPathMentalMapVideos(
  course: CourseLearningPathData,
  updater: (videos: CourseLearningPathVideo[]) => CourseLearningPathVideo[],
  options?: { rerankByScore?: boolean }
): CourseLearningPathData {
  const updated = updater(course.mentalMapVideos ?? [])
  const next = options?.rerankByScore
    ? rerankCourseLearningPathByScore(updated)
    : sortCourseLearningPathByRank(updated)
  return { ...course, mentalMapVideos: next.length ? next : undefined }
}

/** Depth-first syllabus order: topic, then nested subtopics and concepts. */
export function flattenCourseLearningPathNodes(
  course: CourseLearningPathData
): CourseLearningPathNode[] {
  const flat: CourseLearningPathNode[] = []
  function walk(nodes: CourseLearningPathNode[]) {
    for (const node of nodes) {
      flat.push(node)
      if (node.children?.length) walk(node.children)
    }
  }
  walk(course.topics)
  return flat
}

export function nextCourseLearningPathNode(
  course: CourseLearningPathData,
  selectedId: string
): CourseLearningPathNode | null {
  const order = flattenCourseLearningPathNodes(course)
  const index = order.findIndex((node) => node.id === selectedId)
  if (index < 0) return order[0] ?? null
  return order[index + 1] ?? null
}
