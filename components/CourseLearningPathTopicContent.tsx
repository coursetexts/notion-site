import * as React from 'react'

import type {
  CourseLearningPathFlatNode,
  CourseLearningPathNode
} from '@/lib/course-learning-path-types'

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
  explored?: boolean
  onToggleExplored?: () => void
  nextNode?: CourseLearningPathNode | null
  onNext?: (id: string) => void
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
  explored = false,
  onToggleExplored,
  nextNode = null,
  onNext,
  pathSlug,
  pathTitle
}: TopicContentProps) {
  const { node, parents } = entry
  const topicResources = node.topicResources ?? []

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

        <h1 className={styles.articleTitle}>{node.title}</h1>
        <CourseLearningPathWhy text={node.description} />
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

      <div className={styles.actionRow}>
        <button
          type='button'
          className={`${styles.primaryBtn}${
            explored ? ` ${styles.exploredBtn}` : ''
          }`}
          onClick={onToggleExplored}
        >
          {explored ? (
            <span className={styles.exploredLabel}>
              <span className={styles.exploredIdle}>Explored</span>
              <span className={styles.exploredHover}>Mark unexplored</span>
            </span>
          ) : (
            'Mark as explored'
          )}
        </button>
        {nextNode ? (
          <button
            type='button'
            className={`${styles.primaryBtn} ${styles.nextBtn}`}
            onClick={() => onNext?.(nextNode.id)}
          >
            Next
          </button>
        ) : null}
      </div>
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
