import * as React from 'react'
import Link from 'next/link'

import styles from './AllCoursesNewGridSection.module.css'
import type { AllCoursesView } from './AllCoursesNewTopSection'
import { CreateLearningPathModal } from './CreateLearningPathModal'
import { CourseCardGrid, type HomeCourseCard } from './HomeCoursesSection'

type AllCoursesNewGridSectionProps = {
  view?: AllCoursesView
  courses?: HomeCourseCard[]
  coursePaths?: HomeCourseCard[]
  coursePathsReady?: boolean
  coursePathQuery?: string
  learningPaths?: HomeCourseCard[]
  learningPathsReady?: boolean
  topicActive?: boolean
}

function fallbackCards(): HomeCourseCard[] {
  return Array.from({ length: 14 }).map((_, index) => ({
    id: `fallback-${index + 1}`,
    href: '/',
    meta: 'Harvard / Spring 2024',
    title: 'Global & Visual Digital Culture',
    description:
      'Investigate digital media as a convergence-point where technical-systems, economic-imperatives, and power-structures collide'
  }))
}

function coursePathEmptyMessage(
  ready: boolean,
  query: string
): string {
  if (!ready) return 'Loading course learning paths…'
  if (query.trim()) return 'No course learning paths matched your search.'
  return 'No filled course learning paths yet.'
}

function learningPathEmptyMessage(
  ready: boolean,
  query: string,
  topicActive: boolean
): string {
  if (!ready) return 'Loading learning paths…'
  if (query.trim() && topicActive) {
    return 'No existing learning paths matched that topic and search.'
  }
  if (topicActive) {
    return 'No existing learning paths matched that topic.'
  }
  if (query.trim()) {
    return 'No existing learning paths matched your search.'
  }
  return 'No community or research learning paths yet.'
}

function PromoCard({
  className,
  title,
  body,
  href,
  buttonLabel,
  onButtonClick
}: {
  className: string
  title: string
  body?: string
  href?: string
  buttonLabel: string
  onButtonClick?: () => void
}) {
  const action = href ? (
    <Link href={href} legacyBehavior>
      <a
        className={styles.promoButton}
        target='_blank'
        rel='noopener noreferrer'
      >
        {buttonLabel}
      </a>
    </Link>
  ) : (
    <button
      type='button'
      className={styles.promoButton}
      onClick={onButtonClick}
    >
      {buttonLabel}
    </button>
  )

  return (
    <article className={`${styles.promoCard} ${className}`}>
      <p className={styles.promoTitle}>{title}</p>
      {body ? <p className={styles.promoBody}>{body}</p> : null}
      {action}
    </article>
  )
}

function DegreesPromoCard() {
  return (
    <PromoCard
      className={styles.degreesPromo}
      title='Check out our degrees page'
      body='to see full course tracklists of the top  50 most popular undergrad & grad degrees'
      href='/degrees'
      buttonLabel='View degrees'
    />
  )
}

function CreatePathPromoCard({ onCreate }: { onCreate: () => void }) {
  return (
    <PromoCard
      className={styles.createPathPromo}
      title={"Can't find what you're looking for?"}
      buttonLabel='Create your own learning path'
      onButtonClick={onCreate}
    />
  )
}

function FieldAtlasPromoCard() {
  return (
    <PromoCard
      className={styles.fieldAtlasPromo}
      title='Check out our Field Atlas'
      body='to see learning paths to understanding frontier research questions by field'
      href='/field-atlas'
      buttonLabel='View Field Atlas'
    />
  )
}

function JobSkillsAtlasPromoCard() {
  return (
    <PromoCard
      className={styles.jobSkillsPromo}
      title='Check out our Job Skills Atlas'
      body='to see learning paths for skills by job'
      href='/job-skills-atlas'
      buttonLabel='View Job Skills Atlas'
    />
  )
}

function LifeSkillsAtlasPromoCard() {
  return (
    <PromoCard
      className={styles.lifeSkillsPromo}
      title='Check out our Life Skills Atlas'
      body='For learning paths on common life skills'
      href='/life-skills-atlas'
      buttonLabel='View Life Skills Atlas'
    />
  )
}

function LearningPathsPromoSlot({
  inline,
  onCreate
}: {
  inline?: boolean
  onCreate: () => void
}) {
  const cards = (
    <>
      <CreatePathPromoCard onCreate={onCreate} />
      <FieldAtlasPromoCard />
      <JobSkillsAtlasPromoCard />
      <LifeSkillsAtlasPromoCard />
    </>
  )

  if (inline) {
    return <div className={styles.promoRow}>{cards}</div>
  }

  return cards
}

export function AllCoursesNewGridSection({
  view = 'courses',
  courses,
  coursePaths = [],
  coursePathsReady = true,
  coursePathQuery = '',
  learningPaths = [],
  learningPathsReady = true,
  topicActive = false
}: AllCoursesNewGridSectionProps) {
  const cards = courses ?? fallbackCards()
  const [createOpen, setCreateOpen] = React.useState(false)
  const closeCreate = React.useCallback(() => setCreateOpen(false), [])
  const openCreate = React.useCallback(() => setCreateOpen(true), [])
  const noLearningPathMatches =
    view === 'learning-paths' &&
    learningPathsReady &&
    learningPaths.length === 0 &&
    (Boolean(coursePathQuery.trim()) || topicActive)

  if (view === 'learning-paths') {
    return (
      <section className={styles.section}>
        <div className={styles.content}>
          {noLearningPathMatches ? (
            <>
              <div className={styles.emptyCreate}>
                <p className={styles.emptyCreateText}>
                  {learningPathEmptyMessage(
                    true,
                    coursePathQuery,
                    topicActive
                  )}
                </p>
              </div>
              <div className={styles.sectionDivider} role='separator' />
              <LearningPathsPromoSlot inline onCreate={openCreate} />
            </>
          ) : (
            <CourseCardGrid
              cards={learningPaths}
              emptyMessage={learningPathEmptyMessage(
                learningPathsReady,
                coursePathQuery,
                topicActive
              )}
              descriptionWidth='75%'
              startSlot={<LearningPathsPromoSlot onCreate={openCreate} />}
            />
          )}
        </div>
        <CreateLearningPathModal open={createOpen} onClose={closeCreate} />
      </section>
    )
  }

  return (
    <section className={styles.section}>
      <div className={styles.content}>
        <CourseCardGrid
          cards={cards}
          emptyMessage='No official courses matched your search.'
          descriptionWidth='75%'
        />

        <p className={styles.disclaimerText}>
          Coursetexts has neither sought nor received permission from any
          university to open-source courses that were taught at that university.
          It is not affiliated with, sponsored by, or endorsed by any
          university.
        </p>

        <div className={styles.sectionDivider} role='separator' />

        <CourseCardGrid
          cards={coursePaths}
          emptyMessage={coursePathEmptyMessage(
            coursePathsReady,
            coursePathQuery
          )}
          descriptionWidth='75%'
          startSlot={<DegreesPromoCard />}
        />
      </div>
    </section>
  )
}
