/**
 * Subject area for filled course learning paths.
 *
 * Icons stay in the degrees-page SVG set (`DegreeCardIcon`), keyed by degree id.
 * We do **not** store icon files in Supabase. Area comes from optional JSON
 * `area` (a degree id), else slug/title keywords.
 */
export type CourseLearningPathSubject = {
  degreeId: string
  label: string
}

const DEGREE_LABELS: Record<string, string> = {
  'aerospace-engineering': 'Aerospace Engineering',
  'biomedical-engineering': 'Biomedical Engineering',
  'chemical-engineering': 'Chemical Engineering',
  'civil-engineering': 'Civil Engineering',
  'industrial-engineering': 'Industrial Engineering',
  'electrical-engineering': 'Electrical Engineering',
  'mechanical-engineering': 'Mechanical Engineering',
  'computer-science': 'Computer Science',
  'computer-engineering': 'Computer Engineering',
  'information-technology': 'Information Technology',
  'engineering-general': 'Engineering',
  mathematics: 'Mathematics',
  physics: 'Physics',
  chemistry: 'Chemistry',
  biology: 'Biology',
  'environmental-science': 'Environmental Science',
  accounting: 'Accounting',
  finance: 'Finance',
  economics: 'Economics',
  'business-admin': 'Business'
}

/** First matching rule wins. Keep more specific patterns above general ones. */
const SLUG_AREA_RULES: Array<{ test: RegExp; degreeId: string }> = [
  {
    test: /aerospace|aerodynamic|propulsion|orbital|flight-mechanics|stability-and-control/,
    degreeId: 'aerospace-engineering'
  },
  {
    test: /biomedical|biomaterial|biomechanic|biotransport|tissue-engineering/,
    degreeId: 'biomedical-engineering'
  },
  {
    test: /chemical-engineering|chemical-reaction|separation-process|material-and-energy|process-control|process-design|fluid-mechanics-transport/,
    degreeId: 'chemical-engineering'
  },
  {
    test: /geotechnical|structural-analysis|reinforced-concrete|steel-design|surveying|transportation-engineering|construction-materials/,
    degreeId: 'civil-engineering'
  },
  {
    test: /hydrology/,
    degreeId: 'civil-engineering'
  },
  {
    test: /industrial-engineering|operations-research|facilities-planning|production-planning|quality-control|work-design|simulation-modeling|supply-chain/,
    degreeId: 'industrial-engineering'
  },
  {
    test: /circuit|electronic|electromagnetic[s]?$|signals-and-systems|control-system|system-dynamics|power-system|vlsi|microprocessor|communication-system|digital-logic/,
    degreeId: 'electrical-engineering'
  },
  {
    test: /fluid-mechanics|heat-transfer|heat-and-mass|machine-design|manufacturing|mechanical-vibration|mechanics-of-materials|^statics$|^dynamics$|engineering-graphics|materials-science/,
    degreeId: 'mechanical-engineering'
  },
  {
    test: /^thermodynamics$/,
    degreeId: 'mechanical-engineering'
  },
  {
    test: /algorithm|compiler|operating-system|data-structure|database|computer-network|computer-organization|computer-system|theory-of-computation|artificial-intelligence|machine-learning|deep-learning|cloud-computing|cybersecurity|web-development|programming-languages|discrete-math/,
    degreeId: 'computer-science'
  },
  {
    test: /introduction-to-programming|^programming-i$|^programming-ii/,
    degreeId: 'computer-science'
  },
  {
    test: /it-ethics|it-project|systems-analysis|enterprise-architecture|networking-fundamental/,
    degreeId: 'information-technology'
  },
  {
    test: /programming-for-engineers/,
    degreeId: 'engineering-general'
  },
  {
    test: /numerical-methods-computation-for-engineers/,
    degreeId: 'engineering-general'
  },
  {
    test: /engineering-probability|probability-and-statistics-for-engineers/,
    degreeId: 'industrial-engineering'
  },
  {
    test: /calculus|abstract-algebra|linear-algebra|topology|real-analysis|complex-analysis|number-theory|differential-equation|differential-geometry|introduction-to-proofs|numerical-analysis|discrete-mathematics|probability-theory|probability-and-random|mathematical-statistics|^probability-and-statistics$|biostatistics|business-statistics/,
    degreeId: 'mathematics'
  },
  {
    test: /physics|quantum-mechanics|classical-mechanics|optics|solid-state|electromagnetism-electrodynamic|mathematical-methods-for-physics|modern-physics|thermodynamics-and-statistical/,
    degreeId: 'physics'
  },
  {
    test: /organic-chem|inorganic-chem|analytical-chem|physical-chemistry|biochemistry|instrumental-analysis|general-chemistry/,
    degreeId: 'chemistry'
  },
  {
    test: /biology|ecology|genetics|microbiology|anatomy|physiology|evolutionary|cell-and-molecular|conservation-biology/,
    degreeId: 'biology'
  },
  {
    test: /environmental|climatology|earth-system|soil-science|gis-and-remote/,
    degreeId: 'environmental-science'
  },
  {
    test: /financial-accounting/,
    degreeId: 'accounting'
  },
  {
    test: /corporate-finance/,
    degreeId: 'finance'
  },
  {
    test: /microeconomic/,
    degreeId: 'economics'
  },
  {
    test: /engineering-economic|data-analytics-business/,
    degreeId: 'business-admin'
  }
]

function humanizeDegreeId(degreeId: string): string {
  return degreeId
    .replace(/^ms-|^ma-|^m-/, '')
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function degreeIdFromSlug(slug: string): string | null {
  for (const rule of SLUG_AREA_RULES) {
    if (rule.test.test(slug)) return rule.degreeId
  }
  return null
}

function fallbackDegreeId(haystack: string): string {
  if (/math|algebra|calculus|statistic|probability/.test(haystack)) {
    return 'mathematics'
  }
  if (/physic|quantum/.test(haystack)) return 'physics'
  if (/chem/.test(haystack)) return 'chemistry'
  if (/bio|anatomy|ecology/.test(haystack)) return 'biology'
  if (/computer|program|software/.test(haystack)) return 'computer-science'
  return 'engineering-general'
}

/**
 * Degree id used by `DegreeCardIcon`, plus a short label for card meta.
 */
export function getCourseLearningPathSubject(
  slug: string,
  title?: string,
  areaOverride?: string | null
): CourseLearningPathSubject {
  const trimmedOverride = areaOverride?.trim()
  const degreeId =
    trimmedOverride ||
    degreeIdFromSlug(slug) ||
    fallbackDegreeId(`${slug} ${title || ''}`.toLowerCase())

  return {
    degreeId,
    label: DEGREE_LABELS[degreeId] || humanizeDegreeId(degreeId)
  }
}
