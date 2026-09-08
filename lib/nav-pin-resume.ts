import { readCourseLearningPathExplored } from '@/lib/course-learning-path-progress'
import {
  type CourseLearningPathData,
  flattenCourseLearningPathNodes,
  isCourseLearningPathPayload
} from '@/lib/course-learning-path-types'
import {
  coursePageIdKeyVariants,
  listMyCourseSectionProgress,
  readCourseTocLabels,
  writeCourseTocLabels
} from '@/lib/course-section-progress'
import { learningPathHref } from '@/lib/learning-path-bookmark-link'
import { readLocalUserState } from '@/lib/learning-path-db'
import {
  type LearningPathData,
  type LearningPathNode,
  SEEDED_LEARNING_PATHS_BY_SLUG,
  readStoredLearningPaths
} from '@/lib/learning-path-seed'
import { getSupabaseClient } from '@/lib/supabase'

export type NavPinResumeUnit = 'concepts' | 'topics'

export type NavPinResume = {
  explored: number
  total: number
  unit: NavPinResumeUnit
  nextLabel: string | null
  continueHref: string
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

function hasCourseTopics(
  data: unknown
): data is { topics: CourseLearningPathData['topics'] } {
  return (
    !!data &&
    typeof data === 'object' &&
    Array.isArray((data as { topics?: unknown }).topics)
  )
}

function isLearningPathOutline(value: unknown): value is LearningPathData {
  if (!value || typeof value !== 'object') return false
  return Array.isArray((value as LearningPathData).nodes)
}

function hasOutlineData(data: unknown): boolean {
  return (
    isCourseLearningPathPayload(data) ||
    isLearningPathOutline(data) ||
    hasCourseTopics(data)
  )
}

function withSearchParam(href: string, key: string, value: string): string {
  const hashIndex = href.indexOf('#')
  const hash = hashIndex >= 0 ? href.slice(hashIndex) : ''
  const withoutHash = hashIndex >= 0 ? href.slice(0, hashIndex) : href
  const queryIndex = withoutHash.indexOf('?')
  const path = queryIndex >= 0 ? withoutHash.slice(0, queryIndex) : withoutHash
  const params = new URLSearchParams(
    queryIndex >= 0 ? withoutHash.slice(queryIndex + 1) : ''
  )
  params.set(key, value)
  return `${path}?${params.toString()}${hash}`
}

function exploredStatus(
  nodeId: string,
  nodeStatus: Record<string, string>,
  extraIds: Set<string>
) {
  return nodeStatus[nodeId] === 'explored' || extraIds.has(nodeId)
}

function orderedPathNodes(nodes: LearningPathNode[]): LearningPathNode[] {
  return nodes
    .map((node, index) => ({ node, index }))
    .filter(({ node }) => node.kind !== 'goal')
    .sort((a, b) => {
      const aSeq = a.node.sequence
      const bSeq = b.node.sequence
      if (
        typeof aSeq === 'number' &&
        typeof bSeq === 'number' &&
        aSeq !== bSeq
      ) {
        return aSeq - bSeq
      }
      if (typeof aSeq === 'number' && typeof bSeq !== 'number') return -1
      if (typeof aSeq !== 'number' && typeof bSeq === 'number') return 1
      return a.index - b.index
    })
    .map(({ node }) => node)
}

function resumeFromNodes(
  items: Array<{ id: string; label: string }>,
  isExplored: (id: string) => boolean,
  unit: NavPinResumeUnit,
  hrefFor: (nextId: string | null) => string
): NavPinResume | null {
  if (items.length === 0) return null
  const explored = items.filter((item) => isExplored(item.id)).length
  const next = items.find((item) => !isExplored(item.id)) ?? null
  return {
    explored,
    total: items.length,
    unit,
    nextLabel: next?.label ?? null,
    continueHref: hrefFor(next?.id ?? null)
  }
}

function coursePayloadFromData(
  slug: string,
  data: unknown
): CourseLearningPathData | null {
  if (isCourseLearningPathPayload(data)) return data
  if (!hasCourseTopics(data)) return null
  return {
    id: slug,
    slug,
    title: '',
    description: '',
    topics: data.topics
  }
}

function resumeFromPathData(
  slug: string,
  data: unknown,
  nodeStatus: Record<string, string>,
  extraExploredIds: Set<string>
): NavPinResume | null {
  const href = learningPathHref(slug)
  const hrefFor = (nextId: string | null) =>
    nextId ? withSearchParam(href, 'node', nextId) : href

  const course = coursePayloadFromData(slug, data)
  if (course) {
    const nodes = flattenCourseLearningPathNodes(course).filter((node) =>
      Boolean(node.id && node.title)
    )
    return resumeFromNodes(
      nodes.map((node) => ({ id: node.id, label: node.title })),
      (id) => exploredStatus(id, nodeStatus, extraExploredIds),
      'concepts',
      hrefFor
    )
  }

  if (!isLearningPathOutline(data)) return null
  return resumeFromNodes(
    orderedPathNodes(data.nodes).map((node) => ({
      id: node.id,
      label: node.label
    })),
    (id) => exploredStatus(id, nodeStatus, extraExploredIds),
    'concepts',
    hrefFor
  )
}

function sectionRowsForOfficialCourse(
  pageId: string,
  sectionProgress: Record<string, { label: string; isCompleted: boolean }[]>
): { label: string; isCompleted: boolean }[] {
  const byLabel = new Map<string, { label: string; isCompleted: boolean }>()
  for (const id of coursePageIdKeyVariants(pageId)) {
    for (const row of sectionProgress[id] ?? []) {
      const prev = byLabel.get(row.label)
      byLabel.set(row.label, {
        label: row.label,
        isCompleted: Boolean(prev?.isCompleted || row.isCompleted)
      })
    }
  }
  return [...byLabel.values()]
}

function resumeFromOfficialCourse(
  pageId: string,
  href: string,
  rows: { label: string; isCompleted: boolean }[]
): NavPinResume | null {
  const toc = readCourseTocLabels(pageId)
  const completed = new Set(
    rows.filter((row) => row.isCompleted).map((row) => row.label)
  )
  const labels =
    toc.length > 0 ? toc : [...new Set(rows.map((row) => row.label))]
  if (labels.length === 0) return null
  return resumeFromNodes(
    labels.map((label) => ({ id: label, label })),
    (id) => completed.has(id),
    'topics',
    (nextId) => (nextId ? withSearchParam(href, 'topic', nextId) : href)
  )
}

function outlineDataFromRow(row: {
  slug: string
  topics?: unknown
  nodes?: unknown
  data?: unknown
}): unknown {
  if (Array.isArray(row.topics) && row.topics.length > 0) {
    return { slug: row.slug, topics: row.topics }
  }
  if (Array.isArray(row.nodes) && row.nodes.length > 0) {
    return { nodes: row.nodes }
  }
  return row.data
}

async function listLearningPathOutlinesBySlugs(
  slugs: string[]
): Promise<Record<string, { id: string; data: unknown }>> {
  const unique = uniqueSlugs(slugs)
  if (unique.length === 0) return {}
  const supabase = getSupabaseClient()
  if (!supabase) return {}
  const out: Record<string, { id: string; data: unknown }> = {}
  for (const group of chunk(unique, 20)) {
    const slim = await supabase
      .from('learning_paths')
      .select('id, slug, topics:data->topics, nodes:data->nodes')
      .in('slug', group)
    const rows = !slim.error && Array.isArray(slim.data) ? slim.data : null
    if (rows) {
      for (const row of rows as Array<{
        id: string
        slug: string
        topics?: unknown
        nodes?: unknown
      }>) {
        if (!row.slug) continue
        const data = outlineDataFromRow(row)
        if (data == null) continue
        out[row.slug] = { id: row.id, data }
      }
      continue
    }
    const full = await supabase
      .from('learning_paths')
      .select('id, slug, data')
      .in('slug', group)
    if (full.error || !Array.isArray(full.data)) continue
    for (const row of full.data as Array<{
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

function outlineForSlug(
  slug: string,
  outlines: Record<string, { id: string; data: unknown }>
): { id: string | null; data: unknown } | null {
  const fromDb = outlines[slug]
  const stored = readStoredLearningPaths().find((row) => row.slug === slug)
  const seeded = SEEDED_LEARNING_PATHS_BY_SLUG[slug]
  const data = [fromDb?.data, stored?.data, seeded].find(hasOutlineData)
  if (data == null) return null
  return { id: fromDb?.id ?? stored?.id ?? null, data }
}

export async function loadNavPinResume(input: {
  pathSlugs: string[]
  official: Array<{ pageId: string; href: string }>
}): Promise<{
  byPathSlug: Record<string, NavPinResume>
  byOfficialPageId: Record<string, NavPinResume>
}> {
  const pathSlugs = uniqueSlugs(input.pathSlugs)
  const official = input.official.filter((item) => item.pageId)
  const officialPageIds = uniqueSlugs(official.map((item) => item.pageId))
  const [outlines, nodeStatusByPathId, sectionProgress] = await Promise.all([
    listLearningPathOutlinesBySlugs(pathSlugs),
    listMyLearningPathNodeStatuses(),
    officialPageIds.length > 0
      ? listMyCourseSectionProgress()
      : Promise.resolve(
          {} as Record<string, { label: string; isCompleted: boolean }[]>
        )
  ])

  const missingSlugs = pathSlugs.filter((slug) => {
    const outline = outlineForSlug(slug, outlines)
    if (!outline) return true
    const course = coursePayloadFromData(slug, outline.data)
    return Boolean(course && course.topics.length === 0)
  })
  if (missingSlugs.length > 0) {
    const { getCourseLearningPathData } = await import(
      '@/lib/course-learning-path-db'
    )
    const extras = await Promise.all(
      missingSlugs.map(async (slug) => {
        const course = await getCourseLearningPathData(slug)
        return { slug, course }
      })
    )
    for (const { slug, course } of extras) {
      if (!course || course.topics.length === 0) continue
      outlines[slug] = { id: course.id, data: course }
    }
  }

  const byPathSlug: Record<string, NavPinResume> = {}
  for (const slug of pathSlugs) {
    const outline = outlineForSlug(slug, outlines)
    if (!outline) continue
    const local = readLocalUserState(slug)
    const remote = outline.id ? nodeStatusByPathId[outline.id] ?? {} : {}
    const resume = resumeFromPathData(
      slug,
      outline.data,
      { ...local.nodeStatus, ...remote },
      readCourseLearningPathExplored(slug)
    )
    if (resume) byPathSlug[slug] = resume
  }

  const byOfficialPageId: Record<string, NavPinResume> = {}
  for (const item of official) {
    const resume = resumeFromOfficialCourse(
      item.pageId,
      item.href,
      sectionRowsForOfficialCourse(item.pageId, sectionProgress)
    )
    if (resume) byOfficialPageId[item.pageId] = resume
  }

  return { byPathSlug, byOfficialPageId }
}

async function prefetchOfficialCourseTocLabels(pageIds: string[]) {
  const missing = uniqueSlugs(pageIds).filter(
    (pageId) => readCourseTocLabels(pageId).length === 0
  )
  if (missing.length === 0) return
  try {
    const response = await fetch('/api/course-toc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pageIds: missing.slice(0, 12) })
    })
    if (!response.ok) return
    const json = (await response.json()) as {
      labelsByPageId?: Record<string, unknown>
    }
    const labelsByPageId = json.labelsByPageId
    if (!labelsByPageId || typeof labelsByPageId !== 'object') return
    for (const [pageId, labels] of Object.entries(labelsByPageId)) {
      if (!Array.isArray(labels)) continue
      const next = labels.filter(
        (label): label is string =>
          typeof label === 'string' && label.trim().length > 0
      )
      if (next.length > 0) writeCourseTocLabels(pageId, next)
    }
  } catch {
    /* network / parse */
  }
}

export async function enrichOfficialNavPinResume(input: {
  official: Array<{ pageId: string; href: string }>
}): Promise<Record<string, NavPinResume>> {
  const official = input.official.filter((item) => item.pageId)
  if (official.length === 0) return {}
  await prefetchOfficialCourseTocLabels(official.map((item) => item.pageId))
  const sectionProgress =
    official.length > 0
      ? await listMyCourseSectionProgress()
      : ({} as Record<string, { label: string; isCompleted: boolean }[]>)
  const byOfficialPageId: Record<string, NavPinResume> = {}
  for (const item of official) {
    const resume = resumeFromOfficialCourse(
      item.pageId,
      item.href,
      sectionRowsForOfficialCourse(item.pageId, sectionProgress)
    )
    if (resume) byOfficialPageId[item.pageId] = resume
  }
  return byOfficialPageId
}
