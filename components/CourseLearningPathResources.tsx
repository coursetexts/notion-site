import * as React from 'react'

import styles from './CourseLearningPath.module.css'
import {
  COURSE_LEARNING_PATH_GENERAL_RESOURCES_LABEL,
  COURSE_LEARNING_PATH_RESOURCE_SECTIONS,
  resourcesForSection
} from '@/lib/course-learning-path-resources'
import type {
  CourseLearningPathTopicResource,
  CourseLearningPathTopicResourceKind
} from '@/lib/course-learning-path-types'
import {
  isResourceUrl,
  type CourseResource,
  type CourseResourceKind
} from '@/lib/undergraduate-degrees'

import {
  CourseLearningPathNodeResources,
  type CourseLearningPathTopicResourceInput
} from './CourseLearningPathNodeResources'

interface CourseLearningPathResourcesProps {
  resources: CourseResource[] | undefined
  addedByKind?: Partial<
    Record<CourseResourceKind, CourseLearningPathTopicResource[]>
  >
  courseTitle: string
  courseSlug: string
  dbBacked?: boolean
  signedIn?: boolean
  onSignIn?: () => void
  onAddTopicResource?: (
    input: CourseLearningPathTopicResourceInput
  ) => Promise<boolean>
  onUpdateTopicResource?: (
    input: CourseLearningPathTopicResourceInput & { resourceId: string }
  ) => Promise<boolean>
}

function defaultKindForSection(
  kind: CourseResourceKind
): CourseLearningPathTopicResourceKind {
  if (kind === 'textbook') return 'book'
  if (kind === 'youtube') return 'video'
  return 'article'
}

export function CourseLearningPathResources({
  resources,
  addedByKind,
  courseTitle,
  courseSlug,
  dbBacked = false,
  signedIn = false,
  onSignIn,
  onAddTopicResource,
  onUpdateTopicResource
}: CourseLearningPathResourcesProps) {
  return (
    <article className={styles.article}>
      <header className={styles.articleHeader}>
        <h1 className={styles.articleTitle}>
          {COURSE_LEARNING_PATH_GENERAL_RESOURCES_LABEL}
        </h1>
        <p className={styles.articleDesc}>
          Recommended textbooks, websites, and video channels for {courseTitle}.
        </p>
      </header>

      {COURSE_LEARNING_PATH_RESOURCE_SECTIONS.map((section) => {
        const items = resourcesForSection(resources, section.kind)
        const added = addedByKind?.[section.kind] ?? []
        return (
          <section
            key={section.id}
            className={styles.generalResourceGroup}
            aria-labelledby={`${section.id}-heading`}
          >
            <div className={`${styles.videosHeader} ${styles.videosHeaderPlain}`}>
              <h2 id={`${section.id}-heading`} className={styles.videosTitle}>
                {section.label}
              </h2>
            </div>
            {items.length > 0 ? (
              <ul className={styles.courseResourcesList}>
                {items.map((resource, index) => (
                  <ResourceCard
                    key={`${section.kind}-${index}-${resource.title}`}
                    resource={resource}
                  />
                ))}
              </ul>
            ) : null}
            <CourseLearningPathNodeResources
              nodeId={section.id}
              items={added}
              headingId={`${section.id}-resources-heading`}
              hideHeading
              quietEmpty={items.length > 0}
              defaultKind={defaultKindForSection(section.kind)}
              dbBacked={dbBacked}
              signedIn={signedIn}
              onSignIn={onSignIn}
              pathSlug={courseSlug}
              pathTitle={courseTitle}
              onAdd={onAddTopicResource}
              onUpdate={onUpdateTopicResource}
            />
          </section>
        )
      })}
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
