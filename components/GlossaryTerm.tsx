import * as React from 'react'

import { DefinedTerm } from '@/components/DefinedTerm'

export const TERM = {
  pedagogicalMaterials: {
    title: 'Pedagogical materials',
    definition:
      'Instructional materials are any tools, resources, and physical or digital means that teachers and students use to support and facilitate the learning process.'
  },
  interactionParadigms: {
    title: 'Interaction paradigms',
    definition: 'Ways people interact with tools.'
  },
  metacognitiveDevelopment: {
    title: 'Metacognitive development',
    definition:
      'Learning how to think about and improve your own learning.'
  },
  conceptualDeficiencies: {
    title: 'Conceptual deficiencies',
    definition: 'Gaps in understanding.'
  },
  pedagogicalMediums: {
    title: 'Pedagogical mediums',
    definition: 'Ways or tools for learning.'
  },
  foundationalComputingMediums: {
    title: 'Foundational computing mediums',
    definition: 'Basic digital tools / computer-based tools.'
  },
  intellectualMilieu: {
    title: 'Intellectual milieu',
    definition: 'Intellectual environment / community.'
  },
  institutionalBarriers: {
    title: 'Institutional barriers',
    definition: 'Restrictions created by schools or organizations.'
  },
  vivaciousCommunity: {
    title: 'Vivacious community',
    definition: 'Lively community.'
  },
  epistemicTools: {
    title: 'Epistemic tools',
    definition:
      'Tools that help people understand or evaluate knowledge.'
  }
} as const

type GlossaryKey = keyof typeof TERM

export function GlossaryTerm({
  term,
  children
}: {
  term: GlossaryKey
  children: React.ReactNode
}) {
  const entry = TERM[term]
  return (
    <DefinedTerm title={entry.title} definition={entry.definition}>
      {children}
    </DefinedTerm>
  )
}
