import * as React from 'react'

import { getMentalMapNotesNodeId } from '@/lib/course-learning-path-resources'
import type {
  CourseLearningPathData,
  CourseLearningPathTopicResource
} from '@/lib/course-learning-path-types'

import styles from './CourseLearningPath.module.css'
import {
  CourseLearningPathNodeResources,
  type CourseLearningPathTopicResourceInput
} from './CourseLearningPathNodeResources'

interface CourseLearningPathSyllabusOverviewProps {
  course: CourseLearningPathData
  onSelectTopic: (id: string) => void
  topicResources?: CourseLearningPathTopicResource[]
  dbBacked?: boolean
  signedIn?: boolean
  onSignIn?: () => void
  onAddTopicResource?: (
    input: CourseLearningPathTopicResourceInput
  ) => Promise<boolean>
  onUpdateTopicResource?: (
    input: CourseLearningPathTopicResourceInput & { resourceId: string }
  ) => Promise<boolean>
}

export function CourseLearningPathSyllabusOverview({
  course,
  onSelectTopic,
  topicResources = [],
  dbBacked = false,
  signedIn = false,
  onSignIn,
  onAddTopicResource,
  onUpdateTopicResource
}: CourseLearningPathSyllabusOverviewProps) {
  const notesNodeId = getMentalMapNotesNodeId(course.slug)

  return (
    <article className={`${styles.article} ${styles.topicArticle}`}>
      <header className={styles.articleHeader}>
        <div className={styles.articleIntro}>
          <h1 className={styles.articleTitle}>{course.title}</h1>
        </div>
      </header>

      <CourseLearningPathNodeResources
        nodeId={notesNodeId}
        items={topicResources}
        headingId='overview-resources-heading'
        dbBacked={dbBacked}
        signedIn={signedIn}
        onSignIn={onSignIn}
        pathSlug={course.slug}
        pathTitle={course.title}
        onAdd={onAddTopicResource}
        onUpdate={onUpdateTopicResource}
      />

      <section
        className={styles.overviewPathSection}
        aria-labelledby='overview-path-heading'
      >
        <div className={`${styles.videosHeader} ${styles.videosHeaderPlain}`}>
          <h2 id='overview-path-heading' className={styles.videosTitle}>
            Recommended Path
          </h2>
        </div>

        {course.topics.length === 0 ? (
          <p className={styles.resourcesEmpty}>
            Syllabus topics for this course are coming soon.
          </p>
        ) : (
          <ul className={styles.childrenSequence}>
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
      </section>
    </article>
  )
}

function countVideos(node: CourseLearningPathData['topics'][number]): number {
  const own = node.topicResources?.length ?? 0
  const child = (node.children ?? []).reduce(
    (sum, childNode) => sum + countVideos(childNode),
    0
  )
  return own + child
}
