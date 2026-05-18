import * as React from 'react'

import {
  filterDegrees,
  groupResources,
  isResourceUrl,
  type CourseResource,
  type UndergraduateCourse,
  type UndergraduateDegree,
  undergraduateDegrees,
  yearTagClass
} from '@/lib/undergraduate-degrees'

import styles from './UndergraduateDegreesList.module.css'

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`}
      width='12'
      height='12'
      viewBox='0 0 12 12'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      aria-hidden='true'
    >
      <path
        d='M2.25 4.125L6 7.875L9.75 4.125'
        stroke='currentColor'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

function YearTag({ year }: { year: string }) {
  if (!year.trim()) return null

  const yearClass = yearTagClass(year)

  return (
    <span className={`${styles.yearTag} ${styles[yearClass]}`}>{year}</span>
  )
}

function ResourceItem({ resource }: { resource: CourseResource }) {
  const isLink = isResourceUrl(resource.linkOrSite)

  return (
    <li className={styles.resourceItem}>
      <p className={styles.resourceTitle}>
        {isLink ? (
          <a
            href={resource.linkOrSite}
            target='_blank'
            rel='noreferrer'
            className={styles.resourceLink}
          >
            {resource.title}
          </a>
        ) : (
          <span>{resource.title}</span>
        )}
      </p>
      {resource.linkOrSite ? (
        <p className={styles.resourceMeta}>
          {isLink ? (
            <a
              href={resource.linkOrSite}
              target='_blank'
              rel='noreferrer'
              className={styles.resourceSiteLink}
            >
              {resource.linkOrSite}
            </a>
          ) : (
            <span>{resource.linkOrSite}</span>
          )}
        </p>
      ) : null}
      {resource.description ? (
        <p className={styles.resourceDescription}>{resource.description}</p>
      ) : null}
    </li>
  )
}

function NestedSection({
  label,
  countLabel,
  defaultOpen,
  children
}: {
  label: string
  countLabel: string
  defaultOpen: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = React.useState(defaultOpen)

  React.useEffect(() => {
    if (defaultOpen) setOpen(true)
  }, [defaultOpen])

  return (
    <div className={styles.nestedSection}>
      <button
        type='button'
        className={styles.nestedSectionHeader}
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <span className={styles.nestedSectionLabel}>{label}</span>
        <span className={styles.nestedSectionRight}>
          <span className={styles.nestedSectionCount}>{countLabel}</span>
          <ChevronIcon open={open} />
        </span>
      </button>
      {open ? <div className={styles.nestedSectionBody}>{children}</div> : null}
    </div>
  )
}

function CourseRow({
  course,
  defaultOpen
}: {
  course: UndergraduateCourse
  defaultOpen: boolean
}) {
  const resources = course.resources ?? []
  const hasTopics = course.topics.length > 0
  const hasResources = resources.length > 0
  const canExpand = hasTopics || hasResources
  const [courseOpen, setCourseOpen] = React.useState(defaultOpen && canExpand)

  React.useEffect(() => {
    if (defaultOpen && canExpand) setCourseOpen(true)
  }, [defaultOpen, canExpand])

  const resourceGroups = React.useMemo(
    () => groupResources(resources),
    [resources]
  )

  return (
    <div className={styles.courseBlock}>
      <button
        type='button'
        className={styles.courseHeader}
        onClick={() => {
          if (canExpand) setCourseOpen((value) => !value)
        }}
        aria-expanded={canExpand ? courseOpen : undefined}
        disabled={!canExpand}
      >
        <span className={styles.courseHeaderMain}>
          <span className={styles.courseName}>{course.name}</span>
          {course.description ? (
            <span className={styles.courseDescription}>{course.description}</span>
          ) : null}
        </span>
        <span className={styles.courseHeaderRight}>
          {course.isNew ? <span className={styles.newTag}>New</span> : null}
          <YearTag year={course.year} />
          {canExpand ? <ChevronIcon open={courseOpen} /> : null}
        </span>
      </button>

      {courseOpen && canExpand ? (
        <div
          className={hasResources ? styles.courseBody : styles.topicsPanel}
        >
          {hasTopics && hasResources ? (
            <NestedSection
              label='Syllabus topics'
              countLabel={`${course.topics.length} topics`}
              defaultOpen={defaultOpen}
            >
              <ul className={styles.topicsList}>
                {course.topics.map((topic, index) => (
                  <li key={`${course.number}-topic-${index}`} className={styles.topicItem}>
                    {topic}
                  </li>
                ))}
              </ul>
            </NestedSection>
          ) : null}

          {hasTopics && !hasResources ? (
            <>
              <p className={styles.topicsHeading}>Syllabus topics</p>
              <ul className={styles.topicsList}>
                {course.topics.map((topic, index) => (
                  <li key={`${course.number}-topic-${index}`} className={styles.topicItem}>
                    {topic}
                  </li>
                ))}
              </ul>
            </>
          ) : null}

          {hasResources ? (
            <NestedSection
              label='Recommended resources'
              countLabel={`${resources.length} resources`}
              defaultOpen={defaultOpen}
            >
              <div className={styles.resourcesGroups}>
                {resourceGroups.map((group) => (
                  <div key={group.kind} className={styles.resourceGroup}>
                    <p className={styles.resourceGroupHeading}>{group.label}</p>
                    <ul className={styles.resourcesList}>
                      {group.items.map((resource, index) => (
                        <ResourceItem
                          key={`${course.number}-${group.kind}-${index}`}
                          resource={resource}
                        />
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </NestedSection>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

function DegreeCard({
  degree,
  queryActive
}: {
  degree: UndergraduateDegree
  queryActive: boolean
}) {
  const [coursesOpen, setCoursesOpen] = React.useState(queryActive)

  React.useEffect(() => {
    if (queryActive) setCoursesOpen(true)
  }, [queryActive])

  return (
    <article className={styles.degreeCard}>
      <button
        type='button'
        className={styles.degreeHeader}
        onClick={() => setCoursesOpen((value) => !value)}
        aria-expanded={coursesOpen}
      >
        <span className={styles.degreeHeaderMain}>
          <h2 className={styles.degreeTitle}>{degree.name}</h2>
          <p className={styles.degreeMeta}>
            {degree.courses.length}{' '}
            {degree.courses.length === 1 ? 'course' : 'courses'}
          </p>
        </span>
        <span className={styles.degreeHeaderRight}>
          <span className={styles.coursesToggleLabel}>
            {coursesOpen ? 'Hide courses' : 'View courses'}
          </span>
          <ChevronIcon open={coursesOpen} />
        </span>
      </button>

      {coursesOpen ? (
        <div className={styles.coursesPanel}>
          {degree.courses.map((course) => (
            <CourseRow
              key={`${degree.id}-${course.number}-${course.name}`}
              course={course}
              defaultOpen={queryActive}
            />
          ))}
        </div>
      ) : null}
    </article>
  )
}

type UndergraduateDegreesListProps = {
  query?: string
}

export function UndergraduateDegreesList({
  query = ''
}: UndergraduateDegreesListProps) {
  const filtered = React.useMemo(
    () => filterDegrees(undergraduateDegrees, query),
    [query]
  )
  const queryActive = query.trim().length > 0

  return (
    <section className={styles.section} aria-label='Undergraduate degree curricula'>
      <div className={styles.inner}>
      <p className={styles.resultsMeta}>
        {queryActive
          ? `${filtered.length} of ${undergraduateDegrees.length} degrees`
          : `${undergraduateDegrees.length} degrees`}
      </p>

      {filtered.length === 0 ? (
        <p className={styles.emptyState}>No degrees matched your search.</p>
      ) : (
        <div className={styles.list}>
          {filtered.map((degree) => (
            <DegreeCard
              key={degree.id}
              degree={degree}
              queryActive={queryActive}
            />
          ))}
        </div>
      )}
      </div>
    </section>
  )
}
