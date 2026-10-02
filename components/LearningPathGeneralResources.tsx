import * as React from 'react'

import {
  LEARNING_PATH_GENERAL_RESOURCES_LABEL,
  LEARNING_PATH_RESOURCE_SECTIONS,
  type LearningPathResourceSection
} from '@/lib/learning-path-sections'
import type {
  LearningPathListedResource,
  LearningPathResourceKind
} from '@/lib/learning-path-seed'

import styles from './LearningPath.module.css'

function defaultKindForSection(
  section: LearningPathResourceSection
): LearningPathResourceKind {
  if (section.kind === 'textbook') return 'book'
  if (section.kind === 'youtube') return 'video'
  return 'article'
}

export function LearningPathGeneralResources({
  pathTitle,
  resourcesBySectionId,
  signedIn,
  onSignIn,
  onAdd,
  onEdit,
  canEditResource
}: {
  pathTitle: string
  resourcesBySectionId: Record<string, LearningPathListedResource[]>
  signedIn: boolean
  onSignIn: () => void
  onAdd: (
    section: LearningPathResourceSection,
    defaultKind: LearningPathResourceKind
  ) => void
  onEdit: (
    section: LearningPathResourceSection,
    resource: LearningPathListedResource
  ) => void
  canEditResource: (resource: LearningPathListedResource) => boolean
}) {
  return (
    <article className={`${styles.article} ${styles.topicArticle}`}>
      <header className={styles.articleHeader}>
        <div className={styles.articleIntro}>
          <h1 className={styles.articleTitle}>
            {LEARNING_PATH_GENERAL_RESOURCES_LABEL}
          </h1>
          <p className={styles.resourceEmpty}>
            Recommended textbooks, websites, and video channels for {pathTitle}.
          </p>
        </div>
      </header>

      {LEARNING_PATH_RESOURCE_SECTIONS.map((section) => {
        const items = resourcesBySectionId[section.id] ?? []
        return (
          <section key={section.id} className={styles.contentSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>{section.label}</h2>
            </div>
            <div className={styles.sectionBody}>
              {items.length === 0 ? (
                <div className={styles.resourceEmptyBox}>
                  <p className={styles.resourceEmpty}>
                    Nothing here yet. When something makes this click, add it in
                    the order you would study it.
                  </p>
                  <button
                    type='button'
                    className={`${styles.addResourceBtn}${
                      !signedIn ? ` ${styles.addResourceBtnDisabled}` : ''
                    }`}
                    aria-disabled={!signedIn}
                    title={signedIn ? undefined : 'Sign in to add a resource'}
                    onClick={() => {
                      if (!signedIn) {
                        onSignIn()
                        return
                      }
                      onAdd(section, defaultKindForSection(section))
                    }}
                  >
                    + Add a resource
                  </button>
                </div>
              ) : (
                <>
                  <ol className={styles.resourceList}>
                    {items.map((resource) => {
                      const helped = [resource.passage, resource.why]
                        .map((part) => part?.trim())
                        .filter(Boolean)
                        .join('\n\n')
                      const title = resource.href ? (
                        <a
                          className={styles.resourceTitle}
                          href={resource.href}
                          target='_blank'
                          rel='noopener noreferrer'
                        >
                          {resource.title}
                        </a>
                      ) : (
                        <p className={styles.resourceTitle}>{resource.title}</p>
                      )
                      return (
                        <li key={resource.id}>
                          <div className={styles.resource}>
                            <div className={styles.resourceLead}>
                              <span className={styles.resourcePos}>
                                {resource.sequence}
                              </span>
                              <div className={styles.resourceBody}>
                                <p className={styles.resourceKind}>
                                  {resource.kind}
                                </p>
                                {title}
                                {helped ? (
                                  <p className={styles.resourcePassage}>
                                    The part that helped and why: {helped}
                                  </p>
                                ) : null}
                              </div>
                            </div>
                            {canEditResource(resource) ? (
                              <div className={styles.resourceMetaActions}>
                                <button
                                  type='button'
                                  className={styles.resourceEditBtn}
                                  onClick={() => onEdit(section, resource)}
                                  aria-label='Edit'
                                >
                                  Edit
                                </button>
                              </div>
                            ) : null}
                          </div>
                        </li>
                      )
                    })}
                  </ol>
                  <button
                    type='button'
                    className={`${styles.addResourceBtn}${
                      !signedIn ? ` ${styles.addResourceBtnDisabled}` : ''
                    }`}
                    aria-disabled={!signedIn}
                    title={signedIn ? undefined : 'Sign in to add a resource'}
                    onClick={() => {
                      if (!signedIn) {
                        onSignIn()
                        return
                      }
                      onAdd(section, defaultKindForSection(section))
                    }}
                  >
                    + Add a resource
                  </button>
                </>
              )}
            </div>
          </section>
        )
      })}
    </article>
  )
}
