import type { UndergraduateDegree } from '@/lib/undergraduate-degrees'

export type DegreeDirectoryItem = {
  id: string
  name: string
  shortName: string
  courseCount: number
  searchText: string
}

const DEGREE_DURATION_SUFFIX = /\s+-\s+(Typical\s+.+)$/i

export function getDegreeDisplayName(name: string): string {
  return name.replace(DEGREE_DURATION_SUFFIX, '').trim()
}

export function createDegreeDirectoryItems(
  degrees: UndergraduateDegree[]
): DegreeDirectoryItem[] {
  return degrees.map((degree) => ({
    id: degree.id,
    name: getDegreeDisplayName(degree.name),
    shortName: degree.shortName,
    courseCount: degree.courses.length,
    searchText: [
      degree.name,
      degree.shortName,
      ...(degree.schoolsOffering ?? []).map((school) => school.name),
      ...degree.courses.map((course) => course.name)
    ]
      .join(' ')
      .toLowerCase()
  }))
}
