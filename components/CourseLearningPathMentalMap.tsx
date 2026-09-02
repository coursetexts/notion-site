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
import { CourseLearningPathWhy } from './CourseLearningPathWhy'

interface CourseLearningPathMentalMapProps {
  course: CourseLearningPathData
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

export function CourseLearningPathMentalMap({
  course,
  topicResources = [],
  dbBacked = false,
  signedIn = false,
  onSignIn,
  onAddTopicResource,
  onUpdateTopicResource
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
        pathSlug={course.slug}
        pathTitle={course.title}
        onAdd={onAddTopicResource}
        onUpdate={onUpdateTopicResource}
      />
    </article>
  )
}
