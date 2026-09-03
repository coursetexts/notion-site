import { getSupabaseClient } from './supabase'

export interface SectionProgressStatus {
  isCompleted: boolean
  isBookmarked: boolean
}

interface SectionProgressRow {
  course_page_id: string
  section_label: string
  is_completed: boolean
  is_bookmarked: boolean
}

const TABLE_NAME = 'course_section_progress'

export async function getSectionProgressMap(
  coursePageId: string
): Promise<Record<string, SectionProgressStatus>> {
  const supabase = getSupabaseClient()
  if (!supabase) return {}
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return {}
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('course_page_id, section_label, is_completed, is_bookmarked')
    .eq('user_id', user.id)
    .eq('course_page_id', coursePageId)
  if (error || !data) return {}
  const map: Record<string, SectionProgressStatus> = {}
  for (const row of data as SectionProgressRow[]) {
    map[row.section_label] = {
      isCompleted: !!row.is_completed,
      isBookmarked: !!row.is_bookmarked
    }
  }
  return map
}

export async function updateSectionProgress(
  coursePageId: string,
  sectionLabel: string,
  updates: Partial<SectionProgressStatus>
): Promise<SectionProgressStatus | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return null

  // Fetch existing row (if any)
  const { data: existingRow } = await supabase
    .from(TABLE_NAME)
    .select('course_page_id, section_label, is_completed, is_bookmarked')
    .eq('user_id', user.id)
    .eq('course_page_id', coursePageId)
    .eq('section_label', sectionLabel)
    .maybeSingle()

  const current: SectionProgressStatus = {
    isCompleted:
      (existingRow as SectionProgressRow | null)?.is_completed ?? false,
    isBookmarked:
      (existingRow as SectionProgressRow | null)?.is_bookmarked ?? false
  }

  const next: SectionProgressStatus = {
    isCompleted: updates.isCompleted ?? current.isCompleted,
    isBookmarked: updates.isBookmarked ?? current.isBookmarked
  }

  if (!existingRow && !next.isCompleted && !next.isBookmarked) {
    return next
  }

  const payload = {
    user_id: user.id,
    course_page_id: coursePageId,
    section_label: sectionLabel,
    is_completed: next.isCompleted,
    is_bookmarked: next.isBookmarked,
    updated_at: new Date().toISOString()
  }

  const { error } = await supabase.from(TABLE_NAME).upsert(payload, {
    onConflict: 'user_id,course_page_id,section_label' as any
  })

  if (error) return null
  return next
}

const TOC_LABELS_KEY_PREFIX = 'coursetexts.course-toc-labels:'

export function writeCourseTocLabels(coursePageId: string, labels: string[]) {
  if (typeof window === 'undefined' || !coursePageId || labels.length === 0) {
    return
  }
  try {
    window.localStorage.setItem(
      TOC_LABELS_KEY_PREFIX + coursePageId,
      JSON.stringify(labels)
    )
  } catch {
    /* quota / private mode */
  }
}

export function readCourseTocLabels(coursePageId: string): string[] {
  if (typeof window === 'undefined' || !coursePageId) return []
  try {
    const raw = window.localStorage.getItem(TOC_LABELS_KEY_PREFIX + coursePageId)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (label): label is string => typeof label === 'string' && label.trim().length > 0
    )
  } catch {
    return []
  }
}

export async function listMyCourseSectionProgress(): Promise<
  Record<string, { label: string; isCompleted: boolean }[]>
> {
  const supabase = getSupabaseClient()
  if (!supabase) return {}
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return {}
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('course_page_id, section_label, is_completed')
    .eq('user_id', user.id)
  if (error || !data) return {}
  const out: Record<string, { label: string; isCompleted: boolean }[]> = {}
  for (const row of data as Array<{
    course_page_id: string
    section_label: string
    is_completed: boolean
  }>) {
    const pageId = row.course_page_id
    if (!pageId) continue
    if (!out[pageId]) out[pageId] = []
    out[pageId].push({
      label: row.section_label,
      isCompleted: !!row.is_completed
    })
  }
  return out
}
