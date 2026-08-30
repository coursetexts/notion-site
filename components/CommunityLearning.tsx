import * as React from 'react'
import Link from 'next/link'

import {
  POPULAR_COURSES,
  POPULAR_DEGREES
} from '@/lib/community-popular-seed'
import {
  ATLAS_STATUS_META,
  atlasQuestionDiscussionCount,
  trendingAtlasQuestions
} from '@/lib/human-knowledge-atlas-seed'
import {
  type LearningPathData,
  SEEDED_LEARNING_PATHS
} from '@/lib/learning-path-seed'

import styles from './CommunityLearning.module.css'

function conceptStats(path: LearningPathData) {
  const concepts = path.nodes.filter((node) => node.kind !== 'goal')
  const explored = concepts.filter((node) => node.status === 'explored').length
  return { total: concepts.length, explored }
}

function formatCount(n: number) {
  return n.toLocaleString('en-US')
}

export function CommunityLearning() {
  const paths = SEEDED_LEARNING_PATHS
  const frontier = trendingAtlasQuestions(4)

  return (
    <section
      className={styles.section}
      aria-label='Learning paths, frontier questions, and popular degrees and courses'
    >
      <div className={styles.paths} id='learning-paths'>
        <div className={styles.bar}>
          <span>
            <span className={styles.barLabel}>Trending learning paths</span>
            <span className={styles.barCount}>({paths.length})</span>
          </span>
          <Link href='/learning-paths' className={styles.barLink}>
            All learning paths
          </Link>
        </div>
        <ul className={styles.pathGrid}>
          {paths.map((path) => {
            const stats = conceptStats(path)
            return (
              <li key={path.slug} className={styles.item}>
                <p className={styles.kicker}>Community path</p>
                <h2 className={styles.title}>
                  <Link
                    href={`/learning-path/${path.slug}`}
                    className={styles.titleLink}
                  >
                    {path.title}
                  </Link>
                </h2>
                <p className={styles.copy}>{path.goal}</p>
                <p className={styles.meta}>
                  {stats.explored} of {stats.total} concepts explored
                  <span aria-hidden> · </span>
                  {path.circle.members.length} in the circle
                </p>
              </li>
            )
          })}
        </ul>
      </div>

      <div className={styles.questions}>
        <div className={styles.bar}>
          <span>
            <span className={styles.barLabel}>Trending questions</span>
            <span className={styles.barCount}>({frontier.length})</span>
          </span>
          <Link href='/field-atlas' className={styles.barLink}>
            Field Atlas
          </Link>
        </div>
        <p className={styles.questionsHint}>
          Frontier questions people are researching — from the Field Atlas.
        </p>
        <ul className={styles.questionGrid}>
          {frontier.map((question, index) => {
            const talk = atlasQuestionDiscussionCount(question)
            return (
              <li key={question.id} className={styles.item}>
                <p className={styles.kicker}>
                  Trending · {index + 1}
                  <span aria-hidden> · </span>
                  {ATLAS_STATUS_META[question.status].label}
                </p>
                <h2 className={styles.title}>
                  <Link
                    href={`/field-atlas?q=${encodeURIComponent(
                      question.id
                    )}`}
                    className={styles.titleLink}
                  >
                    {question.title}
                  </Link>
                </h2>
                <p className={styles.copy}>{question.posed}</p>
                <p className={styles.meta}>
                  {question.disciplinePath}
                  <span aria-hidden> · </span>
                  {question.researchers.length} researching
                  <span aria-hidden> · </span>
                  {talk === 0
                    ? 'No discussion yet'
                    : `${talk} in discussion`}
                </p>
              </li>
            )
          })}
        </ul>
      </div>

      <div className={styles.columns}>
        <div>
          <div className={styles.bar}>
            <span>
              <span className={styles.barLabel}>Popular degrees</span>
              <span className={styles.barCount}>({POPULAR_DEGREES.length})</span>
            </span>
            <Link href='/degrees' className={styles.barLink}>
              All degrees
            </Link>
          </div>
          <ul className={styles.list}>
            {POPULAR_DEGREES.map((degree, index) => (
              <li key={degree.id} className={styles.item}>
                <p className={styles.kicker}>
                  Popular · {index + 1}
                  <span aria-hidden> · </span>
                  {degree.field}
                </p>
                <h2 className={styles.title}>
                  <Link
                    href={`/degrees?q=${encodeURIComponent(degree.name)}`}
                    className={styles.titleLink}
                  >
                    {degree.name}
                  </Link>
                </h2>
                <p className={styles.copy}>{degree.blurb}</p>
                <p className={styles.meta}>
                  {formatCount(degree.followers)} following
                  <span aria-hidden> · </span>
                  {degree.courseCount} courses
                </p>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className={styles.bar}>
            <span>
              <span className={styles.barLabel}>Popular courses</span>
              <span className={styles.barCount}>({POPULAR_COURSES.length})</span>
            </span>
            <Link href='/all-courses' className={styles.barLink}>
              All courses
            </Link>
          </div>
          <ul className={styles.list}>
            {POPULAR_COURSES.map((course, index) => (
              <li key={course.slug} className={styles.item}>
                <p className={styles.kicker}>
                  Popular · {index + 1}
                  <span aria-hidden> · </span>
                  {course.degree}
                </p>
                <h2 className={styles.title}>
                  <Link
                    href={`/learning-path/${course.slug}`}
                    className={styles.titleLink}
                  >
                    {course.title}
                  </Link>
                </h2>
                <p className={styles.copy}>{course.blurb}</p>
                <p className={styles.meta}>
                  {formatCount(course.learners)} studying
                  <span aria-hidden> · </span>
                  On {course.degree}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
