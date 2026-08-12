/** Shared types for the curated-course syllabus + curated video library. */

import type { CourseResource } from '@/lib/undergraduate-degrees'

export type CuratedCourseNodeType = 'topic' | 'subtopic' | 'concept'

export interface CuratedCourseVideo {
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

export interface CuratedCourseNode {
  id: string
  type: CuratedCourseNodeType
  title: string
  description?: string
  videos?: CuratedCourseVideo[]
  children?: CuratedCourseNode[]
}

export interface CuratedCourseData {
  id: string
  slug: string
  title: string
  description: string
  topics: CuratedCourseNode[]
  /** Degrees-page curated resources (textbooks, websites, channels). */
  resources?: CourseResource[]
  /** True when loaded from Supabase (mutations can persist). */
  dbBacked?: boolean
}

/** Flatten the tree into a lookup map by node id, with parent chain for breadcrumbs. */
export interface CuratedCourseFlatNode {
  node: CuratedCourseNode
  parents: CuratedCourseNode[]
}

export function buildCuratedCourseIndex(
  c: CuratedCourseData
): Record<string, CuratedCourseFlatNode> {
  const index: Record<string, CuratedCourseFlatNode> = {}
  function walk(nodes: CuratedCourseNode[], parents: CuratedCourseNode[]) {
    for (const node of nodes) {
      index[node.id] = { node, parents }
      if (node.children?.length) walk(node.children, [...parents, node])
    }
  }
  walk(c.topics, [])
  return index
}

export function formatCuratedCourseVideoDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

/** Order by curated position (sort_order). */
export function sortCuratedCourseByRank(
  videos: CuratedCourseVideo[]
): CuratedCourseVideo[] {
  return [...videos]
    .sort((a, b) => a.position - b.position)
    .map((v, i) => ({ ...v, position: i + 1 }))
}

/** Re-rank by community score, then position — used after votes. */
export function rerankCuratedCourseByScore(
  videos: CuratedCourseVideo[]
): CuratedCourseVideo[] {
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
  videos: CuratedCourseVideo[],
  video: CuratedCourseVideo,
  placement: number
): CuratedCourseVideo[] {
  const ordered = sortCuratedCourseByRank(videos)
  const max = ordered.length + 1
  const raw = Number(placement)
  const p = Number.isFinite(raw)
    ? Math.min(Math.max(1, Math.round(raw)), max)
    : max
  const next = [...ordered]
  next.splice(p - 1, 0, { ...video, position: p })
  return next.map((v, i) => ({ ...v, position: i + 1 }))
}

/** Immutably replace videos on a node anywhere in the tree. */
export function mapCuratedCourseNodeVideos(
  course: CuratedCourseData,
  nodeId: string,
  updater: (videos: CuratedCourseVideo[]) => CuratedCourseVideo[],
  options?: { rerankByScore?: boolean }
): CuratedCourseData {
  function mapNodes(nodes: CuratedCourseNode[]): CuratedCourseNode[] {
    return nodes.map((node) => {
      if (node.id === nodeId) {
        const updated = updater(node.videos ?? [])
        const next = options?.rerankByScore
          ? rerankCuratedCourseByScore(updated)
          : sortCuratedCourseByRank(updated)
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
