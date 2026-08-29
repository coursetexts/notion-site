import * as React from 'react'
import dynamic from 'next/dynamic'

import { getMentalMapNotesNodeId } from '@/lib/course-learning-path-resources'
import type {
  CourseLearningPathData,
  CourseLearningPathTopicResource,
  CourseLearningPathTopicResourceKind
} from '@/lib/course-learning-path-types'

import styles from './CourseLearningPath.module.css'
import { CourseLearningPathNodeResources } from './CourseLearningPathNodeResources'
import { CourseLearningPathWhy } from './CourseLearningPathWhy'

const CourseLearningPathNotes = dynamic(
  () => import('./CourseLearningPathNotes').then((m) => m.CourseLearningPathNotes),
  {
    ssr: false,
    loading: () => (
      <section>
        <div
          className={`${styles.videosHeader} ${styles.videosHeaderCollapsed}`}
        >
          <h2 className={styles.videosTitle}>Your Notes</h2>
          <span className={styles.videosMeta}>Loading…</span>
        </div>
      </section>
    )
  }
)

interface CourseLearningPathMentalMapProps {
  course: CourseLearningPathData
  topicResources?: CourseLearningPathTopicResource[]
  dbBacked?: boolean
  signedIn?: boolean
  onSignIn?: () => void
  onAddTopicResource?: (input: {
    nodeId: string
    kind: CourseLearningPathTopicResourceKind
    url?: string
    title?: string
    passage?: string
    why?: string
    suggestedPlacement?: number
  }) => Promise<boolean>
}

export function CourseLearningPathMentalMap({
  course,
  topicResources = [],
  dbBacked = false,
  signedIn = false,
  onSignIn,
  onAddTopicResource
}: CourseLearningPathMentalMapProps) {
  const notesNodeId = getMentalMapNotesNodeId(course.slug)

  return (
    <article className={styles.article}>
      <header className={styles.articleHeader}>
        <span className={styles.typeBadge}>Mental Map</span>
        <h1 className={styles.articleTitle}>{course.title}</h1>
      </header>

      <CourseLearningPathWhy
        text={course.description}
        headingId='mental-map-why-heading'
        resetKey={course.id}
      />

      <CourseLearningPathNodeResources
        nodeId={notesNodeId}
        items={topicResources}
        headingId='mental-map-resources-heading'
        dbBacked={dbBacked}
        signedIn={signedIn}
        onSignIn={onSignIn}
        onAdd={onAddTopicResource}
      />

      <CourseLearningPathNotes
        nodeId={notesNodeId}
        courseSlug={course.slug || 'course'}
        topicTitle='Mental Map'
        signedIn={signedIn}
        onSignIn={onSignIn}
      />
    </article>
  )
}
