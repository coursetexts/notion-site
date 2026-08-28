import * as React from 'react'
import dynamic from 'next/dynamic'

import { getMentalMapNotesNodeId } from '@/lib/course-learning-path-resources'
import type {
  CourseLearningPathData,
  CourseLearningPathVideo
} from '@/lib/course-learning-path-types'

import styles from './CourseLearningPath.module.css'
import { PathGraphCanvas } from './PathGraphCanvas'
import { CourseLearningPathVideoSection } from './CourseLearningPathVideoSection'

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
  exploredIds: Set<string>
  onSelect: (id: string) => void
  videos?: CourseLearningPathVideo[]
  dbBacked?: boolean
  signedIn?: boolean
  onSignIn?: () => void
  onAddVideo?: (input: {
    nodeId: string
    url: string
    title?: string
    description?: string
    suggestedPlacement?: number
  }) => Promise<boolean>
  onVoteVideo?: (
    nodeId: string,
    videoId: string,
    value: 1 | -1 | null
  ) => Promise<void>
}

export function CourseLearningPathMentalMap({
  course,
  exploredIds,
  onSelect,
  videos = [],
  dbBacked = false,
  signedIn = false,
  onSignIn,
  onAddVideo,
  onVoteVideo
}: CourseLearningPathMentalMapProps) {
  const notesNodeId = getMentalMapNotesNodeId(course.slug)

  return (
    <article className={`${styles.article} ${styles.mentalMapArticle}`}>
      <header className={`${styles.articleHeader} ${styles.mentalMapLead}`}>
        <span className={styles.typeBadge}>Mental Map</span>
        <h1 className={styles.articleTitle}>{course.title}</h1>
      </header>

      <div className={styles.mentalMapGraph}>
        <PathGraphCanvas
          course={course}
          exploredIds={exploredIds}
          onOpenNode={(id) => {
            onSelect(id)
            window.scrollTo(0, 0)
          }}
        />
      </div>

      <div className={styles.mentalMapRest}>
        <CourseLearningPathNotes
          nodeId={notesNodeId}
          courseSlug={course.slug || 'course'}
          topicTitle='Mental Map'
          signedIn={signedIn}
          onSignIn={onSignIn}
        />

        <CourseLearningPathVideoSection
          nodeId={notesNodeId}
          videos={videos}
          headingId='mental-map-videos-heading'
          formIdPrefix='mm'
          dbBacked={dbBacked}
          signedIn={signedIn}
          onSignIn={onSignIn}
          onAddVideo={onAddVideo}
          onVoteVideo={onVoteVideo}
        />
      </div>
    </article>
  )
}
