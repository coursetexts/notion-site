import * as React from 'react'

import type { KnowledgeTopicItem } from '@/lib/learning-path-knowledge'

import styles from './LearningPath.module.css'

export function LearningPathLearnedPanel({
  pathTitle,
  topics,
  onSelectTopic
}: {
  pathTitle: string
  topics: KnowledgeTopicItem[]
  onSelectTopic?: (id: string) => void
}) {
  return (
    <article className={styles.article}>
      <header className={styles.articleHeader}>
        <span className={styles.typeBadge}>What you learned</span>
        <h1 className={styles.articleTitle}>{pathTitle}</h1>
      </header>
      <p className={styles.learnedIntro}>
        By completing this path, you now have knowledge of:
      </p>
      {topics.length === 0 ? (
        <p className={styles.articleEmpty}>No topics on this path yet.</p>
      ) : (
        <ol className={styles.learnedList}>
          {topics.map((topic, index) => (
            <li key={topic.id} className={styles.learnedItem}>
              {onSelectTopic ? (
                <button
                  type='button'
                  className={styles.learnedItemBtn}
                  onClick={() => onSelectTopic(topic.id)}
                >
                  <span className={styles.learnedIndex}>{index + 1}</span>
                  <span className={styles.learnedLabel}>{topic.label}</span>
                </button>
              ) : (
                <span className={styles.learnedStatic}>
                  <span className={styles.learnedIndex}>{index + 1}</span>
                  <span className={styles.learnedLabel}>{topic.label}</span>
                </span>
              )}
            </li>
          ))}
        </ol>
      )}
    </article>
  )
}
