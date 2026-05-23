import type { UndergraduateDegree } from '@/lib/undergraduate-degrees'

export type UndergraduateDegreeSection = {
  id: string
  title: string
  description: string
  degreeIds: readonly string[]
}

export const UNDERGRADUATE_DEGREE_SECTIONS: readonly UndergraduateDegreeSection[] = [
  {
    id: 'stem',
    title: 'STEM (Science, Technology, Engineering & Math)',
    description: '',
    degreeIds: [
      'engineering-general',
      'mechanical-engineering',
      'electrical-engineering',
      'civil-engineering',
      'chemical-engineering',
      'aerospace-engineering',
      'industrial-engineering',
      'computer-engineering',
      'biomedical-engineering',
      'computer-science',
      'information-technology',
      'mathematics',
      'physics',
      'chemistry',
      'biology',
      'environmental-science'
    ]
  },
  {
    id: 'health-medical',
    title: 'Health & Medical Sciences',
    description: '',
    degreeIds: [
      'nursing-bsn',
      'health-professions',
      'kinesiology',
      'public-health',
      'nutrition-dietetics'
    ]
  },
  {
    id: 'business-law-governance',
    title: 'Business, Law & Public Governance',
    description: '',
    degreeIds: [
      'business-admin',
      'accounting',
      'finance',
      'marketing',
      'economics',
      'hospitality-Management',
      'human-resources',
      'supply-chain-Management',
      'political-science'
    ]
  },
  {
    id: 'arts-humanities-social',
    title: 'Arts, Humanities & Social Sciences',
    description: '',
    degreeIds: [
      'psychology',
      'sociology',
      'anthropology',
      'criminal-justice',
      'social-work',
      'education-elementary',
      'communications',
      'journalism',
      'english',
      'spanish',
      'history',
      'philosophy',
      'religious-studies',
      'fine-arts',
      'graphic-design',
      'architecture',
      'music',
      'theater',
      'film-media',
      'liberal-arts'
    ]
  }
]

export function groupUndergraduateDegreesBySection(
  degrees: UndergraduateDegree[]
): Array<{ section: UndergraduateDegreeSection; degrees: UndergraduateDegree[] }> {
  const byId = new Map(degrees.map((degree) => [degree.id, degree]))
  const assigned = new Set<string>()
  const groups: Array<{
    section: UndergraduateDegreeSection
    degrees: UndergraduateDegree[]
  }> = []

  for (const section of UNDERGRADUATE_DEGREE_SECTIONS) {
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
