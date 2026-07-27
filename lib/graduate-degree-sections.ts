import type { UndergraduateDegree } from '@/lib/undergraduate-degrees'

export type GraduateDegreeSection = {
  id: string
  title: string
  description: string
  degreeIds: readonly string[]
}

export const GRADUATE_DEGREE_SECTIONS: readonly GraduateDegreeSection[] = [
  {
    id: 'stem',
    title: 'STEM (Science, Technology, Engineering & Math)',
    description: '',
    degreeIds: [
      'meng-general',
      'ms-mechanical-eng',
      'ms-electrical-eng',
      'ms-civil-eng',
      'ms-computer-science',
      'ms-data-science',
      'ms-cybersecurity',
      'ms-information-sys',
      'ms-mathematics',
      'ms-statistics',
      'ms-physics',
      'ms-chemistry',
      'ms-biology'
    ]
  },
  {
    id: 'health-medical',
    title: 'Health & Medical Sciences',
    description: '',
    degreeIds: [
      'md-medicine',
      'do-osteopathic',
      'dds-dmd-dental',
      'pharmd',
      'dvm',
      'od-optometry',
      'dpt',
      'pa-phys-assistant',
      'otd',
      'dnp',
      'msn-nursing',
      'ms-speech-lang-path',
      'aud',
      'mph'
    ]
  },
  {
    id: 'business-law-governance',
    title: 'Business, Law & Public Governance',
    description: '',
    degreeIds: [
      'mba',
      'macc-accounting',
      'ms-finance',
      'ma-economics',
      'jd-law',
      'mpa',
      'mpp'
    ]
  },
  {
    id: 'arts-humanities-social',
    title: 'Arts, Humanities & Social Sciences',
    description: '',
    degreeIds: [
      'psyd',
      'ma-psychology',
      'ma-counseling',
      'mft',
      'msw-social-work',
      'edd',
      'med-leadership',
      'med',
      'ma-international-rel',
      'mlis',
      'm-arch',
      'mfa',
      'mm-music',
      'ma-communications',
      'ma-english',
      'ma-history'
    ]
  }
]

export function groupGraduateDegreesBySection(
  degrees: UndergraduateDegree[]
): Array<{ section: GraduateDegreeSection; degrees: UndergraduateDegree[] }> {
  const byId = new Map(degrees.map((degree) => [degree.id, degree]))
  const assigned = new Set<string>()
  const groups: Array<{
    section: GraduateDegreeSection
    degrees: UndergraduateDegree[]
  }> = []

  for (const section of GRADUATE_DEGREE_SECTIONS) {
    const sectionDegrees = section.degreeIds
      .map((id) => byId.get(id))
      .filter((degree): degree is UndergraduateDegree => degree !== undefined)

    for (const degree of sectionDegrees) {
      assigned.add(degree.id)
    }

    if (sectionDegrees.length > 0) {
      groups.push({ section, degrees: sectionDegrees })
    }
  }

  const unassigned = degrees.filter((degree) => !assigned.has(degree.id))
  if (unassigned.length > 0) {
    groups.push({
      section: {
        id: 'other',
        title: 'Other',
        description: '',
        degreeIds: []
      },
      degrees: unassigned
    })
  }

  return groups
}
