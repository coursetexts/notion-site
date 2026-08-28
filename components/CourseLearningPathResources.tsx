import * as React from 'react'

import styles from './CourseLearningPath.module.css'
import {
  getCourseLearningPathResourceSection,
  resourcesForSection
} from '@/lib/course-learning-path-resources'
import { isResourceUrl, type CourseResource } from '@/lib/undergraduate-degrees'

interface CourseLearningPathResourcesProps {
  selectedId: string
  resources: CourseResource[] | undefined
  courseTitle: string
}

export function CourseLearningPathResources({
  selectedId,
  resources,
  courseTitle
}: CourseLearningPathResourcesProps) {
  const section = getCourseLearningPathResourceSection(selectedId)
  if (!section) return null

  const items = resourcesForSection(resources, section.kind)

  return (
    <article className={styles.article}>
      <header className={styles.articleHeader}>
        <span className={styles.typeBadge}>Resources</span>
        <h1 className={styles.articleTitle}>{section.label}</h1>
        <p className={styles.articleDesc}>
          Recommended {section.label.toLowerCase()} for {courseTitle}.
        </p>
      </header>

      {items.length === 0 ? (
        <p className={styles.resourcesEmpty}>
          No {section.label.toLowerCase()} listed for this course yet.
        </p>
      ) : (
        <ul className={styles.courseResourcesList}>
          {items.map((resource, index) => (
            <ResourceCard
              key={`${section.kind}-${index}-${resource.title}`}
              resource={resource}
            />
          ))}
        </ul>
      )}
    </article>
  )
}

function ResourceCard({ resource }: { resource: CourseResource }) {
  const isLink = isResourceUrl(resource.linkOrSite)

  return (
    <li className={styles.courseResourceCard}>
      <p className={styles.courseResourceTitle}>
        {isLink ? (
          <a
            href={resource.linkOrSite}
            target='_blank'
            rel='noreferrer'
            className={styles.courseResourceLink}
          >
            {resource.title}
          </a>
        ) : (
          resource.title
        )}
      </p>
      {resource.linkOrSite ? (
        <p className={styles.courseResourceMeta}>
          {isLink ? (
            <a
              href={resource.linkOrSite}
              target='_blank'
              rel='noreferrer'
              className={styles.courseResourceSiteLink}
            >
              {resource.linkOrSite}
            </a>
          ) : (
            <span>{resource.linkOrSite}</span>
          )}
        </p>
      ) : null}
      {resource.description ? (
        <p className={styles.courseResourceDescription}>
          {resource.description}
        </p>
      ) : null}
    </li>
  )
}
