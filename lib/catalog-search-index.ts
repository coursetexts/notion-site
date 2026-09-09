/**
 * Server-only catalog records for unified /all-courses search.
 * Slim on purpose: the full degree JSON stays out of the client bundle.
 */
import { graduateDegrees } from '@/lib/graduate-degrees'
import { ATLAS_QUESTIONS } from '@/lib/human-knowledge-atlas-seed'
import {
  type LearningPathData,
  SEEDED_LEARNING_PATHS
} from '@/lib/learning-path-seed'
import { undergraduateDegrees } from '@/lib/undergraduate-degrees'

import type { CatalogHitStats, CatalogSearchItem } from './catalog-search'

export type LearningPathSearchExtras = {
  extra: string
  relatedTerms: string[]
  stats: CatalogHitStats
}

export function learningPathSearchExtras(
  path: LearningPathData
): LearningPathSearchExtras {
  const topicNodes = path.nodes.filter((node) => node.kind !== 'goal')
  const resources = path.nodes.reduce(
    (count, node) => count + (node.resources?.length ?? 0),
    0
  )
  const labels = topicNodes.map((node) => node.label)
  const resourceTitles = path.nodes.flatMap((node) =>
    (node.resources ?? []).map((resource) => resource.title)
  )

  return {
    extra: [path.goal, path.summary, ...labels, ...resourceTitles]
      .filter(Boolean)
      .join(' '),
    relatedTerms: [...labels, ...resourceTitles],
    stats: {
      concepts: topicNodes.length,
      resources,
      learners: path.circle?.members?.length ?? 0
    }
  }
}

export function listSeededLearningPathExtras(): Record<
  string,
  LearningPathSearchExtras
> {
  return Object.fromEntries(
    SEEDED_LEARNING_PATHS.map((path) => [
      path.slug,
      learningPathSearchExtras(path)
    ])
  )
}

export function listDegreeCatalogItems(): CatalogSearchItem[] {
  const fromLevel = (
    degrees: typeof undergraduateDegrees,
    level: 'undergraduate' | 'graduate'
  ): CatalogSearchItem[] =>
    degrees.map((degree) => ({
      id: `${level}:${degree.id}`,
      kind: 'degree',
      href:
        level === 'graduate'
          ? `/degrees?level=graduate&q=${encodeURIComponent(degree.shortName)}`
          : `/degrees?q=${encodeURIComponent(degree.shortName)}`,
      title: degree.shortName || degree.name,
      description: `${degree.courses.length} courses in this ${level} curriculum`,
      meta:
        level === 'graduate'
          ? 'Graduate degree curriculum'
          : 'Undergraduate degree curriculum',
      extra: degree.courses.map((course) => course.name).join(' '),
      subjectDegreeId: degree.id
    }))

  return [
    ...fromLevel(undergraduateDegrees, 'undergraduate'),
    ...fromLevel(graduateDegrees, 'graduate')
  ]
}

export function listResearchCatalogItems(): CatalogSearchItem[] {
  const atlas: CatalogSearchItem[] = Object.values(ATLAS_QUESTIONS).map(
    (question) => ({
      id: question.id,
      kind: 'research',
      href: `/field-atlas?q=${encodeURIComponent(question.id)}`,
      title: question.title,
      description: question.posed,
      meta: `Research · ${question.disciplinePath}`,
      extra: [
        question.disciplinePath,
        ...question.hypotheses.map((hypothesis) => hypothesis.statement),
        ...question.researchers
      ].join(' '),
      communityMark: true
    })
  )

  return atlas
}
