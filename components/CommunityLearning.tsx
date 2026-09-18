import * as React from 'react'
import Link from 'next/link'

import {
  type LearningPathData,
  SEEDED_LEARNING_PATHS
} from '@/lib/learning-path-seed'
import {
  pathsLearningPathHref,
  pathsLearningPathsIndexHref
} from '@/lib/paths-routes'

import styles from './CommunityLearning.module.css'

const TOP_TRENDING_COUNT = 10

function conceptStats(path: LearningPathData) {
  const concepts = path.nodes.filter((node) => node.kind !== 'goal')
  const explored = concepts.filter((node) => node.status === 'explored').length
  return { total: concepts.length, explored }
}

function trendingPathsOfTheWeek(
  paths: LearningPathData[],
  limit = TOP_TRENDING_COUNT
) {
  return [...paths]
    .sort((a, b) => b.circle.members.length - a.circle.members.length)
    .slice(0, limit)
}

export function CommunityLearning() {
  const paths = trendingPathsOfTheWeek(SEEDED_LEARNING_PATHS)

  return (
    <section
      className={styles.section}
      aria-label='Top trending learning paths of the week'
    >
      <div className={styles.paths} id='learning-paths'>
        <div className={styles.bar}>
          <span>
            <span className={styles.barLabel}>
              Top {TOP_TRENDING_COUNT} trending learning paths of the week
            </span>
            <span className={styles.barCount}>({paths.length})</span>
          </span>
          <Link href={pathsLearningPathsIndexHref()} className={styles.barLink}>
            All learning paths
          </Link>
        </div>
        <ul className={styles.pathGrid}>
          {paths.map((path, index) => {
            const stats = conceptStats(path)
            return (
              <li key={path.slug} className={styles.item}>
                <p className={styles.kicker}>
                  Trending · {index + 1}
                  <span aria-hidden> · </span>
                  Community path
                </p>
                <h2 className={styles.title}>
                  <Link
                    href={pathsLearningPathHref(path.slug)}
                    className={styles.titleLink}
                  >
                    {path.title}
                  </Link>
                </h2>
                <p className={styles.copy}>{path.goal}</p>
                <p className={styles.meta}>
                  {stats.explored} of {stats.total} topics explored
                  <span aria-hidden> · </span>
                  {path.circle.members.length} in the circle
                </p>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
