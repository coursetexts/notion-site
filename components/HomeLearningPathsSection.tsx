import * as React from 'react'
import Link from 'next/link'

import { listCatalogLearningPaths } from '@/lib/learning-path-db'
import {
  type LearningPathData,
  SEEDED_LEARNING_PATHS
} from '@/lib/learning-path-seed'
import {
  LEARNING_PATH_TOPICS,
  learningPathTopics,
  type LearningPathTopicId
} from '@/lib/learning-path-topic'

import { LearningPathTopicIcon } from './LearningPathTopicIcon'
import courseStyles from './HomeCoursesSection.module.css'
import styles from './HomeLearningPathsSection.module.css'

function CommunityMark() {
  return (
    <span className={styles.metaMark} aria-hidden>
      <svg
        width='12'
        height='12'
        viewBox='0 0 12 12'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
      >
        <circle cx='3' cy='8' r='1.15' fill='currentColor' />
        <circle cx='6' cy='3.2' r='1.15' fill='currentColor' />
        <circle cx='9' cy='7.4' r='1.15' fill='currentColor' />
        <path
          d='M3.6 7.15L5.4 4.05M6.55 4.05L8.45 6.45'
          stroke='currentColor'
          strokeWidth='0.9'
          strokeLinecap='round'
        />
      </svg>
    </span>
  )
}

function pathToCard(path: LearningPathData) {
  return {
    id: path.slug,
    href: `/learning-path/${path.slug}`,
    title: path.title,
    description: path.summary || path.goal
  }
}

export function HomeLearningPathsSection() {
  const [paths, setPaths] = React.useState<LearningPathData[]>(
    SEEDED_LEARNING_PATHS
  )
  const [activeTopic, setActiveTopic] =
    React.useState<LearningPathTopicId | null>(null)

  React.useEffect(() => {
    void listCatalogLearningPaths().then((next) => {
      if (next.length > 0) setPaths(next)
    })
  }, [])

  const handleTopicToggle = React.useCallback((topic: LearningPathTopicId) => {
    setActiveTopic((current) => (current === topic ? null : topic))
  }, [])

  const cards = React.useMemo(() => {
    const matched =
      activeTopic == null
        ? paths
        : paths.filter((path) =>
            learningPathTopics(path).includes(activeTopic)
          )
    return matched.slice(0, 12).map(pathToCard)
  }, [activeTopic, paths])

  return (
    <div
      className={styles.block}
      aria-label='Try learning paths from our community'
    >
      <div className={styles.headingBlock}>
        <h2 className={styles.heading}>
          Try learning paths from our community.
        </h2>
      </div>

      <div className={courseStyles.subjectGroup}>
        <div className={courseStyles.dashedRule} />
        <div className={`${courseStyles.subjectRow} ${styles.topicRow}`}>
          {LEARNING_PATH_TOPICS.map((topic) => (
            <button
              key={topic.id}
              type='button'
              className={`${courseStyles.subjectItem} ${
                activeTopic === topic.id ? courseStyles.subjectItemActive : ''
              }`}
              onClick={() => handleTopicToggle(topic.id)}
              aria-pressed={activeTopic === topic.id}
            >
              <span className={courseStyles.subjectIconWrap}>
                <LearningPathTopicIcon
                  id={topic.id}
                  className={styles.topicIcon}
                />
              </span>
              <span className={courseStyles.subjectLabel}>{topic.label}</span>
            </button>
          ))}
          <Link href='/community' legacyBehavior>
            <a className={styles.cta}>The Community</a>
          </Link>
        </div>
        <div className={courseStyles.dashedRule} />
      </div>

      {cards.length === 0 ? (
        <p className={courseStyles.emptyState}>
          {activeTopic
            ? 'No community learning paths matched that topic yet.'
            : 'No community learning paths yet.'}
        </p>
      ) : (
        <div className={courseStyles.courseGrid}>
          {cards.map((path) => (
            <Link key={path.id} href={path.href} legacyBehavior>
              <a className={courseStyles.courseCardLink}>
                <article className={courseStyles.courseCard}>
                  <div className={courseStyles.courseMetaRow}>
                    <span className={courseStyles.schoolLogoWrap}>
                      <CommunityMark />
                    </span>
                    <span className={courseStyles.courseMetaText}>
                      Community path
                    </span>
                  </div>
                  <h3
                    className={`${courseStyles.courseTitle} ${courseStyles.courseTitleTruncated}`}
                  >
                    {path.title}
                  </h3>
                  <p
                    className={`${courseStyles.courseDescription} ${courseStyles.courseDescriptionTruncated}`}
                  >
                    {path.description}
                  </p>
                </article>
              </a>
            </Link>
          ))}
        </div>
      )}

      <div className={courseStyles.viewAllBar}>
        <Link
          href={
            activeTopic
              ? `/all-courses?view=learning-paths&topic=${activeTopic}`
              : '/all-courses?view=learning-paths'
          }
          legacyBehavior
        >
          <a
            className={courseStyles.viewAllBarLink}
            aria-label='View all learning paths'
          >
            <span className={courseStyles.viewAllText}>View All</span>
            <span className={courseStyles.viewAllArrowBox} aria-hidden='true'>
              <svg
                width='14'
                height='14'
                viewBox='0 0 14 14'
                fill='none'
                xmlns='http://www.w3.org/2000/svg'
              >
                <path
                  d='M5.25 11.375L9.625 7L5.25 2.625'
                  stroke='#5D534B'
                  strokeWidth='1.60417'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                />
              </svg>
            </span>
          </a>
        </Link>
      </div>
    </div>
  )
}
