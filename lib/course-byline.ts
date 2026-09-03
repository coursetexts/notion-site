/**
 * Who a profile Learning card is “by” for official Notion courses and
 * Coursetexts catalog syllabi. Community/research paths use owner names instead.
 */

const SCHOOL_STORAGE_KEY = 'coursetexts.official-course-schools'

const SCHOOL_PATTERNS: Array<[RegExp, string]> = [
  [/\bharvard\b/i, 'Harvard'],
  [/\bstanford\b/i, 'Stanford'],
  [/\bcolumbia\b/i, 'Columbia'],
  [/\byale\b/i, 'Yale'],
  [/\bprinceton\b/i, 'Princeton'],
  [/\bnew york university\b|\bnyu\b/i, 'NYU'],
  [/\bwaterloo\b/i, 'Waterloo'],
  [/\bubc\b|\bbritish columbia\b/i, 'UBC'],
  [/\bmassachusetts institute of technology\b|\bmit\b/i, 'MIT'],
  [/\bberkeley\b/i, 'Berkeley'],
  [/\bcornell\b/i, 'Cornell']
]

export const COURSETEXTS_BYLINE_AUTHOR = 'Coursetexts'

export type OfficialCourseBylineMeta = {
  school?: string
  instructors?: string
}

export function formatSchoolDisplayName(school: string): string {
  const trimmed = school.trim()
  if (!trimmed) return ''
  if (/^harvard university$/i.test(trimmed)) return 'Harvard'
  if (/^princeton university$/i.test(trimmed)) return 'Princeton'
  if (/^yale university$/i.test(trimmed)) return 'Yale'
  if (/^columbia university$/i.test(trimmed)) return 'Columbia'
  if (/^stanford university$/i.test(trimmed)) return 'Stanford'
  if (/^new york university$/i.test(trimmed)) return 'NYU'
  if (/^university of waterloo$/i.test(trimmed)) return 'Waterloo'
  if (/^university of british columbia$/i.test(trimmed)) return 'UBC'
  return trimmed
}

export function schoolNameFromSchoolDate(raw: string): string {
  const value = raw.replace(/\s+/g, ' ').trim()
  if (!value) return ''
  const parts = value.includes('|')
    ? value.split(/\s*\|\s*/).map((part) => part.trim()).filter(Boolean)
    : /\s\/\s/.test(value)
      ? value.split(/\s*\/\s*/).map((part) => part.trim()).filter(Boolean)
      : [value]
  if (parts.length === 0) return ''
  const dateLike = /^(Spring|Summer|Fall|Winter)\s*\d{4}$|^\d{4}$/i
  let school = parts[0]
  if (parts.length >= 2) {
    const [first, second] = parts
    if (dateLike.test(first) && !dateLike.test(second)) school = second
    else if (dateLike.test(second) && !dateLike.test(first)) school = first
  }
  if (/^course$/i.test(school)) return ''
  return formatSchoolDisplayName(school)
}

export function inferOfficialCourseSchool(text: string): string {
  for (const [pattern, name] of SCHOOL_PATTERNS) {
    if (pattern.test(text)) return name
  }
  return ''
}

export function formatInstructorByline(names: string[]): string {
  return names
    .map((name) => name.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join(', ')
}

function parseStoredMeta(value: unknown): OfficialCourseBylineMeta {
  if (typeof value === 'string' && value.trim()) {
    return { school: value.trim() }
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {}
  }
  const row = value as { school?: unknown; instructors?: unknown }
  const school =
    typeof row.school === 'string' && row.school.trim()
      ? row.school.trim()
      : undefined
  const instructors =
    typeof row.instructors === 'string' && row.instructors.trim()
      ? row.instructors.trim()
      : undefined
  return { school, instructors }
}

export function readOfficialCourseBylineMeta(): Record<
  string,
  OfficialCourseBylineMeta
> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(SCHOOL_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {}
    }
    const out: Record<string, OfficialCourseBylineMeta> = {}
    for (const [key, value] of Object.entries(
      parsed as Record<string, unknown>
    )) {
      const meta = parseStoredMeta(value)
      if (meta.school || meta.instructors) out[key] = meta
    }
    return out
  } catch {
    return {}
  }
}

export function rememberOfficialCourseByline(
  pageId: string,
  patch: OfficialCourseBylineMeta
): void {
  const id = pageId.trim()
  if (!id || typeof window === 'undefined') return
  const school = patch.school?.trim() || undefined
  const instructors = patch.instructors?.trim() || undefined
  if (!school && !instructors) return
  const prev = readOfficialCourseBylineMeta()
  const current = prev[id] ?? {}
  prev[id] = {
    school: school ?? current.school,
    instructors: instructors ?? current.instructors
  }
  window.localStorage.setItem(SCHOOL_STORAGE_KEY, JSON.stringify(prev))
}

export function rememberOfficialCourseSchool(
  pageId: string,
  school: string
): void {
  rememberOfficialCourseByline(pageId, { school })
}

export function officialCourseBylineAuthor(
  course: {
    notion_page_id: string
    name: string
    url: string | null
  },
  storedMeta?: Record<string, OfficialCourseBylineMeta>
): string {
  const meta =
    (storedMeta ?? readOfficialCourseBylineMeta())[course.notion_page_id] ?? {}
  const inferred = inferOfficialCourseSchool(
    `${course.name} ${course.url ?? ''}`
  )
  const school =
    meta.school || inferred || COURSETEXTS_BYLINE_AUTHOR
  const instructors = meta.instructors
  if (instructors && school) return `${instructors} · ${school}`
  if (instructors) return instructors
  return school
}
