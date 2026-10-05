import * as React from 'react'

import styles from './CourseLearningPath.module.css'
import {
  COURSE_LEARNING_PATH_GENERAL_RESOURCES_LABEL,
  COURSE_LEARNING_PATH_RESOURCE_SECTIONS,
  courseCurriculumResourcesToTopicResources,
  isCuratedGeneralResourceId,
  mergeGeneralResourceTopicLists,
  resourcesForSection
} from '@/lib/course-learning-path-resources'
import type {
  CourseLearningPathTopicResource,
  CourseLearningPathTopicResourceKind
} from '@/lib/course-learning-path-types'
import type { CourseResource, CourseResourceKind } from '@/lib/undergraduate-degrees'

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
  pathId?: string
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
  pathId,
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
        const curated = courseCurriculumResourcesToTopicResources(
          resourcesForSection(resources, section.kind),
          section.kind
        )
        const added = addedByKind?.[section.kind] ?? []
        const items = mergeGeneralResourceTopicLists(curated, added)
        const curatedCount = curated.length

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
            <CourseLearningPathNodeResources
              nodeId={section.id}
              items={items}
              headingId={`${section.id}-resources-heading`}
              hideHeading
              quietEmpty={false}
              defaultKind={defaultKindForSection(section.kind)}
              dbBacked={dbBacked}
              signedIn={signedIn}
              onSignIn={onSignIn}
              pathId={pathId}
              pathSlug={courseSlug}
              pathTitle={courseTitle}
              canEditResource={(resource) =>
                !isCuratedGeneralResourceId(resource.id)
              }
              onAdd={
                onAddTopicResource
                  ? async (input) => {
                      const placement = input.suggestedPlacement
                      const adjusted =
                        placement == null
                          ? undefined
                          : Math.max(1, placement - curatedCount)
                      return onAddTopicResource({
                        ...input,
                        suggestedPlacement: adjusted
                      })
                    }
                  : undefined
              }
              onUpdate={
                onUpdateTopicResource
                  ? async (input) => {
                      if (isCuratedGeneralResourceId(input.resourceId)) {
                        return false
                      }
                      const placement = input.suggestedPlacement
                      const adjusted =
                        placement == null
                          ? undefined
                          : Math.max(1, placement - curatedCount)
                      return onUpdateTopicResource({
                        ...input,
                        suggestedPlacement: adjusted
                      })
                    }
                  : undefined
              }
            />
          </section>
        )
      })}
    </article>
  )
}
