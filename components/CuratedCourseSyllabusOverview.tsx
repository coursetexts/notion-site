import * as React from 'react'

import styles from './CuratedCourse.module.css'
import { PlayIcon } from './CuratedCourseSyllabusNav'
import type { CuratedCourseData } from '@/lib/curated-course-types'

interface CuratedCourseSyllabusOverviewProps {
  course: CuratedCourseData
  onSelectTopic: (id: string) => void
}

export function CuratedCourseSyllabusOverview({
  course,
  onSelectTopic
}: CuratedCourseSyllabusOverviewProps) {
  return (
    <article className={styles.article}>
      <header className={styles.articleHeader}>
        <span className={styles.typeBadge}>Recommended Syllabus</span>
        <h1 className={styles.articleTitle}>{course.title}</h1>
        {course.description ? (
          <p className={styles.articleDesc}>{course.description}</p>
        ) : (
          <p className={styles.articleDesc}>
            Browse the recommended topic sequence for this course, then open a
            topic to watch curated videos.
          </p>
        )}
      </header>

      {course.topics.length === 0 ? (
        <p className={styles.resourcesEmpty}>
          Syllabus topics for this course are coming soon.
        </p>
      ) : (
        <section aria-labelledby='syllabus-topics-heading'>
          <h2 id='syllabus-topics-heading' className={styles.sectionHeading}>
            Topics
          </h2>
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
                      <span className={styles.videoCount}>
                        <PlayIcon size={12} />
                        {videoCount}
                      </span>
                    ) : null}
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      )}
    </article>
  )
}

function countVideos(
  node: CuratedCourseData['topics'][number]
): number {
  const own = node.videos?.length ?? 0
  const child = (node.children ?? []).reduce(
    (sum, childNode) => sum + countVideos(childNode),
    0
  )
  return own + child
}
