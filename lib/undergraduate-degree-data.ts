import curriculum from '@/data/undergraduate-degrees-curriculum.json'

import type { UndergraduateDegree } from '@/lib/undergraduate-degrees'

export const undergraduateDegrees: UndergraduateDegree[] =
  curriculum.degrees as UndergraduateDegree[]
