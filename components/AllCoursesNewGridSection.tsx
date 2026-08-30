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
  query: string
): string {
  if (!ready) return 'Loading learning paths…'
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
  buttonLabel
}: {
  className: string
  title: string
  body: string
  href: string
  buttonLabel: string
}) {
  return (
    <article className={`${styles.promoCard} ${className}`}>
      <p className={styles.promoTitle}>{title}</p>
      <p className={styles.promoBody}>{body}</p>
      <Link href={href} legacyBehavior>
        <a
          className={styles.promoButton}
          target='_blank'
          rel='noopener noreferrer'
        >
          {buttonLabel}
        </a>
      </Link>
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

function LearningPathsPromoSlot({ inline }: { inline?: boolean }) {
  const cards = (
    <>
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
  learningPathsReady = true
}: AllCoursesNewGridSectionProps) {
  const cards = courses ?? fallbackCards()
  const [createOpen, setCreateOpen] = React.useState(false)
  const closeCreate = React.useCallback(() => setCreateOpen(false), [])
  const noLearningPathMatches =
    view === 'learning-paths' &&
    learningPathsReady &&
    Boolean(coursePathQuery.trim()) &&
    learningPaths.length === 0

  if (view === 'learning-paths') {
    return (
      <section className={styles.section}>
        <div className={styles.content}>
          {noLearningPathMatches ? (
            <>
              <div className={styles.emptyCreate}>
                <p className={styles.emptyCreateText}>
                  No existing learning paths matched your search.
                </p>
                <button
                  type='button'
                  className={styles.emptyCreateButton}
                  onClick={() => setCreateOpen(true)}
                >
                  Create your own learning path?
                </button>
              </div>
              <div className={styles.sectionDivider} role='separator' />
              <LearningPathsPromoSlot inline />
            </>
          ) : (
            <CourseCardGrid
              cards={learningPaths}
              emptyMessage={learningPathEmptyMessage(
                learningPathsReady,
                coursePathQuery
              )}
              descriptionWidth='75%'
              startSlot={<LearningPathsPromoSlot />}
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
