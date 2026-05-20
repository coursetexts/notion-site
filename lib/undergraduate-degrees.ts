import curriculum from '@/data/undergraduate-degrees-curriculum.json'

export type CourseResourceKind = 'textbook' | 'website' | 'youtube'

export type CourseResource = {
  kind: CourseResourceKind
  title: string
  linkOrSite: string
  description: string
}

export type UndergraduateCourse = {
  number: number
  name: string
  type: string
  year: string
  description: string
  isNew: boolean
  topics: string[]
  resources?: CourseResource[]
}

export type UndergraduateDegree = {
  id: string
  name: string
  shortName: string
  courses: UndergraduateCourse[]
}

export const undergraduateDegrees: UndergraduateDegree[] =
  curriculum.degrees as UndergraduateDegree[]

export function yearTagClass(year: string): string {
  const normalized = year.trim().toLowerCase()
  if (normalized.startsWith('year 1')) return 'year1'
  if (normalized.startsWith('year 2')) return 'year2'
  if (normalized.startsWith('year 3')) return 'year3'
  if (
    normalized.startsWith('year 4') ||
    normalized.startsWith('year 5') ||
    normalized.includes('capstone')
  ) {
    return 'year4plus'
  }
  return 'yearDefault'
}

export function filterDegrees(
  degrees: UndergraduateDegree[],
  query: string
): UndergraduateDegree[] {
  const needle = query.trim().toLowerCase()
  if (!needle) return degrees

  return degrees
    .map((degree) => {
      const degreeHaystack = `${degree.name} ${degree.shortName}`.toLowerCase()
      if (degreeHaystack.includes(needle)) return degree

      const matchingCourses = degree.courses.filter((course) => {
        const resourceHaystack = (course.resources ?? [])
          .map((r) => `${r.title} ${r.linkOrSite} ${r.description}`)
          .join(' ')
        const courseHaystack = [
          course.name,
          course.type,
          course.year,
          course.description,
          ...course.topics,
          resourceHaystack
        ]
          .join(' ')
          .toLowerCase()
        return courseHaystack.includes(needle)
      })

      if (matchingCourses.length === 0) return null

      return { ...degree, courses: matchingCourses }
    })
    .filter((degree): degree is UndergraduateDegree => degree !== null)
}

export function isResourceUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim())
}

export const RESOURCE_GROUP_LABELS: Record<CourseResourceKind, string> = {
  textbook: 'Textbooks',
  website: 'Websites',
  youtube: 'YouTube channels'
}

export const RESOURCE_KINDS: CourseResourceKind[] = [
  'textbook',
  'website',
  'youtube'
]

export function groupResources(resources: CourseResource[]) {
  const groups: Array<{ kind: CourseResourceKind; label: string; items: CourseResource[] }> =
    []

  for (const kind of RESOURCE_KINDS) {
    const items = resources.filter((r) => r.kind === kind)
    if (items.length > 0) {
      groups.push({ kind, label: RESOURCE_GROUP_LABELS[kind], items })
    }
  }

  return groups
}
