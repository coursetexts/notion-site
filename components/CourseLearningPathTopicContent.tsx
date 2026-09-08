import * as React from 'react'

import type { CourseLearningPathFlatNode } from '@/lib/course-learning-path-types'

import styles from './CourseLearningPath.module.css'
import {
  CourseLearningPathNodeResources,
  type CourseLearningPathTopicResourceInput
} from './CourseLearningPathNodeResources'
import { CourseLearningPathWhy } from './CourseLearningPathWhy'

interface TopicContentProps {
  entry: CourseLearningPathFlatNode
  onSelect: (id: string) => void
  /** Whether mutations can be saved to Supabase. */
  dbBacked?: boolean
  signedIn?: boolean
  onSignIn?: () => void
  onAddTopicResource?: (
    input: CourseLearningPathTopicResourceInput
  ) => Promise<boolean>
  onUpdateTopicResource?: (
    input: CourseLearningPathTopicResourceInput & { resourceId: string }
  ) => Promise<boolean>
  pathSlug?: string
  pathTitle?: string
}

export function CourseLearningPathTopicContent({
  entry,
  onSelect,
  dbBacked = false,
  signedIn = false,
  onSignIn,
  onAddTopicResource,
  onUpdateTopicResource,
  pathSlug,
  pathTitle
}: TopicContentProps) {
  const { node, parents } = entry
  const topicResources = node.topicResources ?? []

  return (
    <article className={`${styles.article} ${styles.topicArticle}`}>
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

        <div className={styles.articleIntro}>
          <h1 className={styles.articleTitle}>{node.title}</h1>
          <CourseLearningPathWhy text={node.description} />
        </div>
      </header>

      <CourseLearningPathNodeResources
        nodeId={node.id}
        items={topicResources}
        dbBacked={dbBacked}
        signedIn={signedIn}
        onSignIn={onSignIn}
        pathSlug={pathSlug}
        pathTitle={pathTitle}
        onAdd={onAddTopicResource}
        onUpdate={onUpdateTopicResource}
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
