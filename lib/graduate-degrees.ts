import curriculum from '@/data/graduate-degrees-curriculum.json'

import type { UndergraduateDegree } from '@/lib/undergraduate-degrees'

export const graduateDegrees: UndergraduateDegree[] =
  curriculum.degrees as UndergraduateDegree[]
