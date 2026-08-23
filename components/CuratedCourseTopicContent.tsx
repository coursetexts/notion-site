import * as React from 'react'
import dynamic from 'next/dynamic'

import type {
  CuratedCourseFlatNode,
  CuratedCourseNode
} from '@/lib/curated-course-types'

import styles from './CuratedCourse.module.css'
import { CuratedCourseLinkSection } from './CuratedCourseLinkSection'
import { PlayIcon } from './CuratedCourseSyllabusNav'
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

const TYPE_LABEL: Record<CuratedCourseNode['type'], string> = {
  topic: 'Topic',
  subtopic: 'Subtopic',
  concept: 'Concept'
}

interface TopicContentProps {
  entry: CuratedCourseFlatNode
  onSelect: (id: string) => void
  courseSlug?: string
  /** Whether mutations can be saved to Supabase. */
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
  onAddLink?: (input: {
    nodeId: string
    kind: 'test' | 'slide'
    url: string
    title?: string
    description?: string
    suggestedPlacement?: number
  }) => Promise<boolean>
}

export function CuratedCourseTopicContent({
  entry,
  onSelect,
  courseSlug = '',
  dbBacked = false,
  signedIn = false,
  onSignIn,
  onAddVideo,
  onVoteVideo,
  onAddLink
}: TopicContentProps) {
  const { node, parents } = entry
  const videos = node.videos ?? []
  const tests = node.tests ?? []
  const slides = node.slides ?? []
  const childList = node.children ?? []

  return (
    <article className={styles.article}>
      <header className={styles.articleHeader}>
        {parents.length > 0 && (
          <nav aria-label='Breadcrumb'>
            <ol className={styles.breadcrumb}>
              {parents.map((p) => (
                <li
                  key={p.id}
                  style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <button
                    type='button'
                    onClick={() => onSelect(p.id)}
                    className={styles.breadcrumbBtn}
                  >
                    {p.title}
                  </button>
                  <ChevronSmall />
                </li>
              ))}
            </ol>
          </nav>
        )}

        <span className={styles.typeBadge}>{TYPE_LABEL[node.type]}</span>

        <h1 className={styles.articleTitle}>{node.title}</h1>

        {node.description ? (
          <p className={styles.articleDesc}>{node.description}</p>
        ) : null}
      </header>

      {childList.length > 0 && (
        <section aria-labelledby='subtopics-heading'>
          <h2 id='subtopics-heading' className={styles.sectionHeading}>
            <LayersIcon />
            In this {TYPE_LABEL[node.type].toLowerCase()}
          </h2>
          <ul className={styles.childrenGrid}>
            {childList.map((child) => (
              <li key={child.id}>
                <button
                  type='button'
                  onClick={() => onSelect(child.id)}
                  className={styles.childBtn}
                >
                  <span className={styles.childTitle}>{child.title}</span>
                  {child.videos?.length ? (
                    <span className={styles.videoCount}>
                      <PlayIcon size={12} />
                      {child.videos.length}
                    </span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <CuratedCourseNotes
        nodeId={node.id}
        courseSlug={courseSlug || 'course'}
        topicTitle={node.title}
        signedIn={signedIn}
        onSignIn={onSignIn}
      />

      <CuratedCourseVideoSection
        nodeId={node.id}
        videos={videos}
        dbBacked={dbBacked}
        signedIn={signedIn}
        onSignIn={onSignIn}
        onAddVideo={onAddVideo}
        onVoteVideo={onVoteVideo}
      />

      <CuratedCourseLinkSection
        kind='test'
        nodeId={node.id}
        items={tests}
        dbBacked={dbBacked}
        signedIn={signedIn}
        onSignIn={onSignIn}
        onAdd={onAddLink}
      />

      <CuratedCourseLinkSection
        kind='slide'
        nodeId={node.id}
        items={slides}
        dbBacked={dbBacked}
        signedIn={signedIn}
        onSignIn={onSignIn}
        onAdd={onAddLink}
      />
    </article>
  )
}

function ChevronSmall() {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='12'
      height='12'
      viewBox='0 0 16 16'
      fill='none'
      aria-hidden
    >
      <path
        d='M6 3.5L10.5 8L6 12.5'
        stroke='currentColor'
        strokeWidth='1.4'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

function LayersIcon() {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='14'
      height='14'
      viewBox='0 0 16 16'
      fill='none'
      aria-hidden
    >
      <path
        d='M8 2L14 5.5L8 9L2 5.5L8 2Z'
        stroke='currentColor'
        strokeWidth='1.2'
        strokeLinejoin='round'
      />
      <path
        d='M2 8L8 11.5L14 8'
        stroke='currentColor'
        strokeWidth='1.2'
        strokeLinejoin='round'
      />
      <path
        d='M2 10.5L8 14L14 10.5'
        stroke='currentColor'
        strokeWidth='1.2'
        strokeLinejoin='round'
      />
    </svg>
  )
}
