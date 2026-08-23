import * as React from 'react'
import dynamic from 'next/dynamic'

import { getMentalMapNotesNodeId } from '@/lib/curated-course-resources'
import type { CuratedCourseVideo } from '@/lib/curated-course-types'

import styles from './CuratedCourse.module.css'
import { CuratedCourseVideoSection } from './CuratedCourseVideoSection'

const CuratedCourseNotes = dynamic(
  () => import('./CuratedCourseNotes').then((m) => m.CuratedCourseNotes),
  {
    ssr: false,
    loading: () => (
      <div className={styles.notesSection}>
        <div className={styles.notesHeader}>
          <span className={styles.notesTitle}>Notes</span>
          <span className={styles.notesHeaderMeta}>Loading…</span>
        </div>
      </div>
    )
  }
)

interface CuratedCourseMentalMapProps {
  courseTitle: string
  courseSlug: string
  videos?: CuratedCourseVideo[]
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

export function CuratedCourseMentalMap({
  courseTitle,
  courseSlug,
  videos = [],
  dbBacked = false,
  signedIn = false,
  onSignIn,
  onAddVideo,
  onVoteVideo
}: CuratedCourseMentalMapProps) {
  const notesNodeId = getMentalMapNotesNodeId(courseSlug)

  return (
    <article className={styles.article}>
      <header className={styles.articleHeader}>
        <span className={styles.typeBadge}>Mental Map</span>
        <h1 className={styles.articleTitle}>{courseTitle}</h1>
      </header>

      <CuratedCourseNotes
        nodeId={notesNodeId}
        courseSlug={courseSlug || 'course'}
        topicTitle='Mental Map'
        signedIn={signedIn}
        onSignIn={onSignIn}
      />

      <CuratedCourseVideoSection
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
    </article>
  )
}
