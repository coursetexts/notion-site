import { readCourseLearningPathExplored } from '@/lib/course-learning-path-progress'
import {
  flattenCourseLearningPathNodes,
  isCourseLearningPathPayload
} from '@/lib/course-learning-path-types'
import {
  listMyCourseSectionProgress,
  readCourseTocLabels
} from '@/lib/course-section-progress'
import { readLocalUserState } from '@/lib/learning-path-db'
import type { LearningPathData } from '@/lib/learning-path-seed'
import { getSupabaseClient } from '@/lib/supabase'

export function completionPercent(
  completed: number,
  total: number
): number | null {
  if (total <= 0 || completed <= 0) return null
  return Math.min(100, Math.max(1, Math.round((completed / total) * 100)))
}

function isLearningPathOutline(value: unknown): value is LearningPathData {
  if (!value || typeof value !== 'object') return false
  return Array.isArray((value as LearningPathData).nodes)
}

function uniqueSlugs(slugs: string[]) {
  return [...new Set(slugs.filter(Boolean))]
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size))
  }
  return out
}

async function listLearningPathOutlinesBySlugs(slugs: string[]): Promise<
  Record<string, { id: string; data: unknown }>
> {
  const unique = uniqueSlugs(slugs)
  if (unique.length === 0) return {}
  const supabase = getSupabaseClient()
  if (!supabase) return {}
  const out: Record<string, { id: string; data: unknown }> = {}
  for (const group of chunk(unique, 50)) {
    const { data, error } = await supabase
      .from('learning_paths')
      .select('id, slug, data')
      .in('slug', group)
    if (error || !Array.isArray(data)) continue
    for (const row of data as Array<{
      id: string
      slug: string
      data: unknown
    }>) {
      if (!row.slug) continue
      out[row.slug] = { id: row.id, data: row.data }
    }
  }
  return out
}

async function listMyLearningPathNodeStatuses(): Promise<
  Record<string, Record<string, string>>
> {
  const supabase = getSupabaseClient()
  if (!supabase) return {}
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return {}
  const { data, error } = await supabase
    .from('learning_path_user_state')
    .select('path_id, node_status')
    .eq('user_id', user.id)
  if (error || !data) return {}
  const out: Record<string, Record<string, string>> = {}
  for (const row of data as Array<{
    path_id: string
    node_status: Record<string, string> | null
  }>) {
    if (!row.path_id) continue
    out[row.path_id] =
      row.node_status && typeof row.node_status === 'object'
        ? row.node_status
        : {}
  }
  return out
}

function exploredStatus(
  nodeId: string,
  nodeStatus: Record<string, string>,
  extraIds: Set<string>
) {
  return nodeStatus[nodeId] === 'explored' || extraIds.has(nodeId)
}

function percentForPathOutline(
  data: unknown,
  nodeStatus: Record<string, string>,
  extraExploredIds: Set<string>
): number | null {
  if (isCourseLearningPathPayload(data)) {
    const nodes = flattenCourseLearningPathNodes(data)
    const completed = nodes.filter((node) =>
      exploredStatus(node.id, nodeStatus, extraExploredIds)
    ).length
    return completionPercent(completed, nodes.length)
  }
  if (!isLearningPathOutline(data)) return null
  const nodes = data.nodes.filter((node) => node.kind !== 'goal')
  const completed = nodes.filter((node) =>
    exploredStatus(node.id, nodeStatus, extraExploredIds)
  ).length
  return completionPercent(completed, nodes.length)
}

function percentForOfficialCourse(
  pageId: string,
  rows: { label: string; isCompleted: boolean }[]
): number | null {
  const toc = readCourseTocLabels(pageId)
  const completedLabels = rows
    .filter((row) => row.isCompleted)
    .map((row) => row.label)
  if (toc.length > 0) {
    const tocSet = new Set(toc)
    const completed = completedLabels.filter((label) => tocSet.has(label))
      .length
    return completionPercent(completed, toc.length)
  }
  const tracked = [...new Set(rows.map((row) => row.label))]
  const completed = [...new Set(completedLabels)].length
  return completionPercent(completed, tracked.length)
}

export async function loadProfileLearningProgress(input: {
  pathSlugs: string[]
  officialPageIds: string[]
}): Promise<{
  byPathSlug: Record<string, number>
  byOfficialPageId: Record<string, number>
}> {
  const pathSlugs = uniqueSlugs(input.pathSlugs)
  const officialPageIds = uniqueSlugs(input.officialPageIds)
  const [outlines, nodeStatusByPathId, sectionProgress] = await Promise.all([
    listLearningPathOutlinesBySlugs(pathSlugs),
    listMyLearningPathNodeStatuses(),
    officialPageIds.length > 0
      ? listMyCourseSectionProgress()
      : Promise.resolve(
          {} as Record<string, { label: string; isCompleted: boolean }[]>
        )
  ])

  const byPathSlug: Record<string, number> = {}
  for (const slug of pathSlugs) {
    const outline = outlines[slug]
    if (!outline) continue
    const local = readLocalUserState(slug)
    const remote = nodeStatusByPathId[outline.id] ?? {}
    const nodeStatus = { ...local.nodeStatus, ...remote }
    const extraExploredIds = readCourseLearningPathExplored(slug)
    const percent = percentForPathOutline(
      outline.data,
      nodeStatus,
      extraExploredIds
    )
    if (percent != null) byPathSlug[slug] = percent
  }

  const byOfficialPageId: Record<string, number> = {}
  for (const pageId of officialPageIds) {
    const percent = percentForOfficialCourse(
      pageId,
      sectionProgress[pageId] ?? []
    )
    if (percent != null) byOfficialPageId[pageId] = percent
  }

  return { byPathSlug, byOfficialPageId }
}
