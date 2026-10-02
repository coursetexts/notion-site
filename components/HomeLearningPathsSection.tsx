import * as React from 'react'
import Link from 'next/link'

import { listCatalogLearningPaths } from '@/lib/learning-path-db'
import {
  type LearningPathData,
  SEEDED_LEARNING_PATHS
} from '@/lib/learning-path-seed'
import {
  LEARNING_PATH_TOPICS,
  type LearningPathTopicId,
  learningPathTopics
} from '@/lib/learning-path-topic'
import {
  pathsCatalogHref,
  pathsLearningPathHref
} from '@/lib/paths-routes'

import { LearningPathTopicIcon } from './LearningPathTopicIcon'
import {
  ProfileAcademicIcon,
  ProfilePathIcon
} from './ProfileTabItemIcons'
import type { HomeCourseCard } from './HomeCoursesSection'
import courseStyles from './HomeCoursesSection.module.css'
import styles from './HomeLearningPathsSection.module.css'

const HOME_COLUMNS = 3
const GOAL_COUNT = 2 * HOME_COLUMNS
const ACADEMIC_COUNT = 3 * HOME_COLUMNS

const SUBJECTS = [
  { label: 'Science', icon: '/images/home/science.png' },
  { label: 'Math', icon: '/images/home/math.png' },
  { label: 'Sociology', icon: '/images/home/sociology.png' },
  { label: 'English', icon: '/images/home/english.png' }
]

type PathKind = 'Goal-based' | 'Academic course'
type KindFilter = 'goal' | 'academic'

type CatalogCardData = {
  id: string
  href: string
  title: string
  kind: PathKind
}

function pathToCard(path: LearningPathData): CatalogCardData {
  return {
    id: path.slug,
    href: pathsLearningPathHref(path.slug),
    title: path.title,
    kind: 'Goal-based'
  }
}

function pickEvenly<T>(items: T[], count: number): T[] {
  if (items.length <= count) return items
  return Array.from({ length: count }, (_, index) => {
    const at = Math.floor((index * items.length) / count)
    return items[at]
  })
}

function CatalogCard({
  href,
  title,
  kind
}: {
  href: string
  title: string
  kind: PathKind
}) {
  return (
    <Link href={href} legacyBehavior>
      <a className={courseStyles.courseCardLink}>
        <article
          className={`${courseStyles.courseCard} ${courseStyles.courseCardNoDescription}`}
        >
          <p className={styles.kindLabel}>{kind}</p>
          <h3
            className={`${courseStyles.courseTitle} ${courseStyles.courseTitleTruncated}`}
          >
            {title}
          </h3>
        </article>
      </a>
    </Link>
  )
}

function CardGrid({ children }: { children: React.ReactNode }) {
  return <div className={courseStyles.courseGrid}>{children}</div>
}

type HomeLearningPathsSectionProps = {
  academicCourses?: HomeCourseCard[]
  activeSubjects?: string[]
  onSubjectToggle?: (subject: string) => void
  onTopicToggle?: (topic: LearningPathTopicId) => void
  activeTopic?: LearningPathTopicId | null
}

export function HomeLearningPathsSection({
  academicCourses = [],
  activeSubjects = [],
  onSubjectToggle,
  onTopicToggle,
  activeTopic = null
}: HomeLearningPathsSectionProps) {
  const [paths, setPaths] = React.useState<LearningPathData[]>(
    SEEDED_LEARNING_PATHS
  )
  const [kindFilter, setKindFilter] = React.useState<KindFilter | null>(null)

  React.useEffect(() => {
    void listCatalogLearningPaths().then((next) => {
      if (next.length > 0) setPaths(next)
    })
  }, [])

  React.useEffect(() => {
    if (activeTopic != null) setKindFilter('goal')
  }, [activeTopic])

  React.useEffect(() => {
    if (activeSubjects.length === 0) return
    setKindFilter((current) => (current === 'academic' ? current : 'academic'))
  }, [activeSubjects])

  const selectKind = React.useCallback((next: KindFilter) => {
    setKindFilter((current) => (current === next ? null : next))
  }, [])

  const cards = React.useMemo(() => {
    const next: CatalogCardData[] = []
    const topicActive = activeTopic != null
    const subjectsActive = activeSubjects.length > 0

    if (kindFilter === 'goal') {
      const matched = topicActive
        ? paths.filter((path) => learningPathTopics(path).includes(activeTopic))
        : paths
      next.push(...matched.slice(0, GOAL_COUNT).map(pathToCard))
      return next
    }

    if (kindFilter === 'academic') {
      const matched = subjectsActive
        ? academicCourses.filter((course) =>
            (course.subjects || []).some((subject) =>
              activeSubjects.includes(subject)
            )
          )
        : academicCourses
      const academicCards = subjectsActive
        ? matched.slice(0, ACADEMIC_COUNT)
        : pickEvenly(matched, ACADEMIC_COUNT)
      next.push(
        ...academicCards.map((course) => ({
          id: course.id,
          href: course.href,
          title: course.title,
          kind: 'Academic course' as const
        }))
      )
      return next
    }

    // No kind selected: show goal-based and academic. Hero topic/subject chips still apply.
    if (!subjectsActive || topicActive) {
      const matched = topicActive
        ? paths.filter((path) => learningPathTopics(path).includes(activeTopic))
        : paths
      next.push(...matched.slice(0, GOAL_COUNT).map(pathToCard))
    }

    if (!topicActive || subjectsActive) {
      const matched = subjectsActive
        ? academicCourses.filter((course) =>
            (course.subjects || []).some((subject) =>
              activeSubjects.includes(subject)
            )
          )
        : academicCourses
      const academicCards = subjectsActive
        ? matched.slice(0, ACADEMIC_COUNT)
        : pickEvenly(matched, ACADEMIC_COUNT)
      next.push(
        ...academicCards.map((course) => ({
          id: course.id,
          href: course.href,
          title: course.title,
          kind: 'Academic course' as const
        }))
      )
    }

    return next
  }, [academicCourses, activeSubjects, activeTopic, kindFilter, paths])

  const emptyMessage = (() => {
    if (cards.length > 0) return null
    if (kindFilter === 'goal') {
      return activeTopic
        ? 'No goal-based learning paths matched that topic yet.'
        : 'No goal-based learning paths yet.'
    }
    if (kindFilter === 'academic') {
      return activeSubjects.length > 0
        ? 'No academic courses matched those subjects yet.'
        : 'No academic courses yet.'
    }
    return 'No learning paths yet.'
  })()

  const showTopicFilters = kindFilter === 'goal'
  const showSubjectFilters = kindFilter === 'academic'

  return (
    <div
      className={styles.block}
      aria-label='Try learning paths built by our community'
    >
      <div className={styles.headingBlock}>
        <h2 className={styles.heading}>
          Try learning paths built by our community.
        </h2>
      </div>

      <div className={styles.filterBand}>
        <div className={courseStyles.dashedRule} />
        <div
          className={`${courseStyles.subjectRow} ${styles.filterRow}`}
          role='group'
          aria-label='Filter learning paths'
        >
          <button
            type='button'
            className={`${courseStyles.subjectItem} ${
              kindFilter === 'goal' ? courseStyles.subjectItemActive : ''
            } ${kindFilter === 'goal' ? styles.topicChipActive : ''}`}
            onClick={() => selectKind('goal')}
            aria-pressed={kindFilter === 'goal'}
          >
            <span className={styles.topicIconWrap}>
              <ProfilePathIcon className={styles.topicIcon} />
            </span>
            <span className={courseStyles.subjectLabel}>Goal-based</span>
          </button>
          <button
            type='button'
            className={`${courseStyles.subjectItem} ${
              kindFilter === 'academic' ? courseStyles.subjectItemActive : ''
            } ${kindFilter === 'academic' ? styles.topicChipActive : ''}`}
            onClick={() => selectKind('academic')}
            aria-pressed={kindFilter === 'academic'}
          >
            <span className={styles.topicIconWrap}>
              <ProfileAcademicIcon className={styles.topicIcon} />
            </span>
            <span className={courseStyles.subjectLabel}>Academic</span>
          </button>

          {showTopicFilters || showSubjectFilters ? (
            <span className={styles.filterDivider} aria-hidden='true' />
          ) : null}

          {showTopicFilters
            ? LEARNING_PATH_TOPICS.map((topic) => (
                <button
                  key={topic.id}
                  type='button'
                  className={`${courseStyles.subjectItem} ${
                    activeTopic === topic.id
                      ? `${courseStyles.subjectItemActive} ${styles.topicChipActive}`
                      : ''
                  }`}
                  onClick={() => onTopicToggle?.(topic.id)}
                  aria-pressed={activeTopic === topic.id}
                >
                  <span className={styles.topicIconWrap}>
                    <LearningPathTopicIcon
                      id={topic.id}
                      className={styles.topicIcon}
                    />
                  </span>
                  <span className={courseStyles.subjectLabel}>
                    {topic.label}
                  </span>
                </button>
              ))
            : null}

          {showSubjectFilters
            ? SUBJECTS.map((subject) => (
                <button
                  key={subject.label}
                  type='button'
                  className={`${courseStyles.subjectItem} ${
                    activeSubjects.includes(subject.label)
                      ? courseStyles.subjectItemActive
                      : ''
                  }`}
                  onClick={() => onSubjectToggle?.(subject.label)}
                  aria-pressed={activeSubjects.includes(subject.label)}
                >
                  <span className={styles.topicIconWrap}>
                    <img
                      src={subject.icon}
                      alt=''
                      className={styles.topicIcon}
                      aria-hidden='true'
                    />
                  </span>
                  <span className={courseStyles.subjectLabel}>
                    {subject.label}
                  </span>
                </button>
              ))
            : null}
        </div>
        <div className={courseStyles.dashedRule} />
      </div>

      {emptyMessage ? (
        <p className={courseStyles.emptyState}>{emptyMessage}</p>
      ) : cards.length === 0 ? null : (
        <CardGrid>
          {cards.map((card) => (
            <CatalogCard
              key={`${card.kind}:${card.id}`}
              href={card.href}
              title={card.title}
              kind={card.kind}
            />
          ))}
        </CardGrid>
      )}

      <div className={courseStyles.viewAllRow}>
        <div
          className={`${courseStyles.viewAllBar} ${courseStyles.viewAllBarEnd}`}
        >
          <Link href={pathsCatalogHref({ view: 'all' })} legacyBehavior>
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
    </div>
  )
}
