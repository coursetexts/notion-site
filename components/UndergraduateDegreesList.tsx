import * as React from 'react'

import {
  filterDegrees,
  getCoursePageUrl,
  groupResources,
  type CourseResource,
  type CourseResourceKind,
  type DegreeSchoolOffering,
  type UndergraduateCourse,
  type UndergraduateDegree,
  isResourceUrl,
  yearTagClass
} from '@/lib/undergraduate-degrees'

import type { DegreeLevel } from '@/components/UndergraduateDegreesTopSection'
import { DegreeCardIcon } from '@/components/degreeCardIcons'
import { groupGraduateDegreesBySection } from '@/lib/graduate-degree-sections'
import { groupUndergraduateDegreesBySection } from '@/lib/undergraduate-degree-sections'

import styles from './UndergraduateDegreesList.module.css'

const DEGREE_DURATION_SUFFIX = /\s+-\s+(Typical\s+.+)$/i

function splitDegreeDisplayName(name: string) {
  const match = name.match(DEGREE_DURATION_SUFFIX)
  if (!match) {
    return { title: name, duration: null as string | null }
  }

  return {
    title: name.slice(0, match.index).trimEnd(),
    duration: match[1]
  }
}

function DegreeTitle({ name }: { name: string }) {
  const { title, duration } = splitDegreeDisplayName(name)

  if (!duration) {
    return <>{name}</>
  }

  return (
    <>
      {title}
      <span className={styles.degreeDuration}> - {duration}</span>
    </>
  )
}

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

function DocumentIcon() {
  return (
    <svg
      className={styles.courseDocumentIconSvg}
      width='14'
      height='14'
      viewBox='0 0 24 24'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      aria-hidden='true'
    >
      <path
        d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <polyline
        points='14 2 14 8 20 8'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

function CourseDocumentLink({
  url,
  courseName
}: {
  url?: string
  courseName: string
}) {
  const label = `Course document for ${courseName}`

  return (
    <a
      href={getCoursePageUrl(url)}
      target='_blank'
      rel='noreferrer'
      className={styles.courseDocumentLink}
      aria-label={label}
      onClick={(event) => event.stopPropagation()}
    >
      <DocumentIcon />
    </a>
  )
}

function YearTag({ year }: { year: string }) {
  if (!year.trim()) return null

  const yearClass = yearTagClass(year)

  return (
    <span className={`${styles.yearTag} ${styles[yearClass]}`}>{year}</span>
  )
}

function ResourceTabs({
  groups,
  idPrefix
}: {
  groups: Array<{
    kind: CourseResourceKind
    label: string
    items: CourseResource[]
  }>
  idPrefix: string
}) {
  const [activeKind, setActiveKind] = React.useState<CourseResourceKind>(
    groups[0].kind
  )

  React.useEffect(() => {
    setActiveKind((current) =>
      groups.some((group) => group.kind === current) ? current : groups[0].kind
    )
  }, [groups])

  const activeGroup =
    groups.find((group) => group.kind === activeKind) ?? groups[0]
  const tabListId = `${idPrefix}-resource-tabs`
  const panelId = `${idPrefix}-resource-panel`

  if (groups.length === 1) {
    return (
      <ul className={styles.resourcesList}>
        {groups[0].items.map((resource, index) => (
          <ResourceItem
            key={`${idPrefix}-${groups[0].kind}-${index}`}
            resource={resource}
          />
        ))}
      </ul>
    )
  }

  return (
    <div className={styles.resourceTabs}>
      <div
        role='tablist'
        aria-label='Resource type'
        className={styles.resourceTabList}
        id={tabListId}
      >
        {groups.map((group) => {
          const selected = group.kind === activeKind
          const tabId = `${idPrefix}-tab-${group.kind}`

          return (
            <button
              key={group.kind}
              type='button'
              role='tab'
              id={tabId}
              className={
                selected ? styles.resourceTabActive : styles.resourceTab
              }
              aria-selected={selected}
              aria-controls={panelId}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActiveKind(group.kind)}
            >
              {group.label}
              <span className={styles.resourceTabCount}>{group.items.length}</span>
            </button>
          )
        })}
      </div>
      <div
        role='tabpanel'
        id={panelId}
        aria-labelledby={`${idPrefix}-tab-${activeGroup.kind}`}
        className={styles.resourceTabPanel}
      >
        <ul className={styles.resourcesList}>
          {activeGroup.items.map((resource, index) => (
            <ResourceItem
              key={`${idPrefix}-${activeGroup.kind}-${index}`}
              resource={resource}
            />
          ))}
        </ul>
      </div>
    </div>
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

function SyllabusTopics({ course }: { course: UndergraduateCourse }) {
  if (course.topics.length === 0) return null

  return (
    <>
      <p className={styles.topicsHeading}>Syllabus topics</p>
      <ul className={styles.topicsList}>
        {course.topics.map((topic, index) => (
          <li key={`${course.number}-topic-${index}`} className={styles.topicItem}>
            {topic}
          </li>
        ))}
        <li
          key={`${course.number}-topic-course-page`}
          className={styles.topicItem}
        >
          <a
            href={getCoursePageUrl(course.documentUrl)}
            target='_blank'
            rel='noreferrer'
            className={styles.resourceLink}
          >
            See full course outline ⇗
          </a>
        </li>
      </ul>
    </>
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

function SchoolsOfferingSection({
  schools,
  defaultOpen
}: {
  schools: DegreeSchoolOffering[]
  defaultOpen: boolean
}) {
  if (schools.length === 0) return null

  return (
    <div className={styles.degreeSubsection}>
      <NestedSection
        label='Schools offering this degree — program requirements'
        countLabel={`${schools.length} ${schools.length === 1 ? 'school' : 'schools'}`}
        defaultOpen={defaultOpen}
      >
        <ul className={styles.schoolsList}>
          {schools.map((school) => (
            <li key={school.name} className={styles.schoolItem}>
              <a
                href={school.requirementsUrl}
                target='_blank'
                rel='noreferrer'
                className={styles.schoolLink}
              >
                {school.name}
              </a>
            </li>
          ))}
        </ul>
      </NestedSection>
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
          <span className={styles.courseYearGroup}>
            <CourseDocumentLink
              url={course.documentUrl}
              courseName={course.name}
            />
            <YearTag year={course.year} />
          </span>
          {canExpand ? <ChevronIcon open={courseOpen} /> : null}
        </span>
      </button>

      {courseOpen && canExpand ? (
        <div
          className={hasResources ? styles.courseBody : styles.topicsPanel}
        >
          {hasTopics && hasResources ? (
            <div className={styles.courseBodyColumns}>
              <div className={styles.courseBodyColumn}>
                <SyllabusTopics course={course} />
              </div>
              <div className={styles.courseBodyColumn}>
                <NestedSection
                  label='Recommended resources'
                  countLabel={`${resources.length} resources`}
                  defaultOpen={defaultOpen}
                >
                  <ResourceTabs
                    groups={resourceGroups}
                    idPrefix={`course-${course.number}`}
                  />
                </NestedSection>
              </div>
            </div>
          ) : null}

          {hasTopics && !hasResources ? <SyllabusTopics course={course} /> : null}

          {!hasTopics && hasResources ? (
            <NestedSection
              label='Recommended resources'
              countLabel={`${resources.length} resources`}
              defaultOpen={defaultOpen}
            >
              <ResourceTabs
                groups={resourceGroups}
                idPrefix={`course-${course.number}`}
              />
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
  const schools = degree.schoolsOffering ?? []
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
        <DegreeCardIcon
          degreeId={degree.id}
          className={styles.degreeIcon}
          iconClassName={styles.degreeIconSvg}
        />
        <span className={styles.degreeHeaderMain}>
          <h2 className={styles.degreeTitle}>
            <DegreeTitle name={degree.name} />
          </h2>
          <p className={styles.degreeMeta}>
            {degree.courses.length}{' '}
            {degree.courses.length === 1 ? 'course' : 'courses'}
          </p>
        </span>
        <span className={styles.degreeHeaderRight}>
          <span className={styles.degreeChevronButton}>
            <ChevronIcon open={coursesOpen} />
          </span>
        </span>
      </button>

      {coursesOpen ? (
        <div className={styles.coursesPanel}>
          <SchoolsOfferingSection
            schools={schools}
            defaultOpen={queryActive}
          />
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
  degrees: UndergraduateDegree[]
  level: DegreeLevel
  query?: string
}

function DegreeSectionGroup({
  title,
  description,
  degrees,
  queryActive
}: {
  title: string
  description: string
  degrees: UndergraduateDegree[]
  queryActive: boolean
}) {
  return (
    <section className={styles.categorySection} aria-label={title}>
      <h2 className={styles.categoryHeading}>{title}</h2>
      {description ? (
        <p className={styles.categoryDescription}>{description}</p>
      ) : null}
      <div className={styles.list}>
        {degrees.map((degree) => (
          <DegreeCard
            key={degree.id}
            degree={degree}
            queryActive={queryActive}
          />
        ))}
      </div>
    </section>
  )
}

function DegreesTableOfContents({
  sections,
  activeSectionId,
  onSelect
}: {
  sections: Array<{ id: string; title: string }>
  activeSectionId: string
  onSelect: (sectionId: string) => void
}) {
  return (
    <nav className={styles.toc} aria-label='Browse by Field'>
      <h2 className={styles.tocHeading}>Browse by Field</h2>
      <ol className={styles.tocList}>
        {sections.map((section, index) => {
          const selected = section.id === activeSectionId

          return (
            <li key={section.id} className={styles.tocListItem}>
              <button
                type='button'
                className={
                  selected ? styles.tocItemSelected : styles.tocItem
                }
                aria-current={selected ? 'true' : undefined}
                onClick={() => onSelect(section.id)}
              >
                <span className={styles.tocNumber}>{index + 1}</span>
                <span className={styles.tocLabel}>{section.title}</span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

export function UndergraduateDegreesList({
  degrees,
  level,
  query = ''
}: UndergraduateDegreesListProps) {
  const filtered = React.useMemo(
    () => filterDegrees(degrees, query),
    [degrees, query]
  )
  const sectionGroups = React.useMemo(() => {
    if (level === 'undergraduate') {
      return groupUndergraduateDegreesBySection(filtered)
    }
    if (level === 'graduate') {
      return groupGraduateDegreesBySection(filtered)
    }
    return null
  }, [filtered, level])
  const [activeSectionId, setActiveSectionId] = React.useState<string | null>(
    null
  )

  React.useEffect(() => {
    if (!sectionGroups?.length) {
      setActiveSectionId(null)
      return
    }

    setActiveSectionId((current) => {
      if (
        current &&
        sectionGroups.some((group) => group.section.id === current)
      ) {
        return current
      }
      return sectionGroups[0].section.id
    })
  }, [sectionGroups])

  const activeGroup =
    sectionGroups?.find((group) => group.section.id === activeSectionId) ??
    sectionGroups?.[0] ??
    null
  const queryActive = query.trim().length > 0
  const levelLabel = level === 'graduate' ? 'graduate' : 'undergraduate'
  const ariaLabel =
    level === 'graduate'
      ? 'Graduate degree curricula'
      : 'Undergraduate degree curricula'

  return (
    <section
      id='degrees-panel'
      aria-labelledby='degrees-level-label'
      className={styles.section}
      aria-label={ariaLabel}
    >
      <div className={styles.inner}>
        {filtered.length === 0 ? (
          <p className={styles.emptyState}>
            {degrees.length === 0
              ? `${level === 'graduate' ? 'Graduate' : 'Undergraduate'} degrees coming soon.`
              : `No ${levelLabel} degrees matched your search.`}
          </p>
        ) : sectionGroups && activeGroup ? (
          <div className={styles.layout}>
            <DegreesTableOfContents
              sections={sectionGroups.map((group) => ({
                id: group.section.id,
                title: group.section.title
              }))}
              activeSectionId={activeGroup.section.id}
              onSelect={setActiveSectionId}
            />
            <div className={styles.main}>
              <DegreeSectionGroup
                key={activeGroup.section.id}
                title={activeGroup.section.title}
                description={activeGroup.section.description}
                degrees={activeGroup.degrees}
                queryActive={queryActive}
              />
            </div>
          </div>
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
