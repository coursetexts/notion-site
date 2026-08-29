import * as React from 'react'

import styles from './CourseLearningPath.module.css'
import type { CourseLearningPathData } from '@/lib/course-learning-path-types'

interface CourseLearningPathSyllabusOverviewProps {
  course: CourseLearningPathData
  onSelectTopic: (id: string) => void
}

export function CourseLearningPathSyllabusOverview({
  course,
  onSelectTopic
}: CourseLearningPathSyllabusOverviewProps) {
  return (
    <article className={styles.article}>
      <header className={styles.articleHeader}>
        <span className={styles.typeBadge}>Recommended Syllabus</span>
      </header>

      {course.topics.length === 0 ? (
        <p className={styles.resourcesEmpty}>
          Syllabus topics for this course are coming soon.
        </p>
      ) : (
        <ul className={styles.childrenGrid}>
          {course.topics.map((topic, index) => {
            const videoCount = countVideos(topic)
            return (
              <li key={topic.id}>
                <button
                  type='button'
                  onClick={() => onSelectTopic(topic.id)}
                  className={styles.childBtn}
                >
                  <span className={styles.childTitle}>
                    <span className={styles.navIndex}>{index + 1}.</span>{' '}
                    {topic.title}
                  </span>
                  {videoCount > 0 ? (
                    <span className={styles.videoCount}>{videoCount}</span>
                  ) : null}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </article>
  )
}

function countVideos(
  node: CourseLearningPathData['topics'][number]
): number {
  const own = node.topicResources?.length ?? 0
  const child = (node.children ?? []).reduce(
    (sum, childNode) => sum + countVideos(childNode),
    0
  )
  return own + child
}
