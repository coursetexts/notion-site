import * as React from 'react'
import Link from 'next/link'

import {
  type CatalogSearchGroup,
  type CatalogSearchHit,
  formatCatalogStats
} from '@/lib/catalog-search'

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
  unifiedHasQuery?: boolean
  unifiedBestMatch?: HomeCourseCard | null
  unifiedGroups?: Array<{
    kind: CatalogSearchGroup['kind']
    label: string
    cards: HomeCourseCard[]
  }>
  unifiedReady?: boolean
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

function coursePathEmptyMessage(ready: boolean, query: string): string {
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
      buttonLabel='Create your own path →'
      onButtonClick={onCreate}
    />
  )
}

function SearchCreatePathCallout({ onCreate }: { onCreate: () => void }) {
  return (
    <>
      <div className={styles.sectionDivider} role='separator' />
      <LearningPathsPromoSlot inline onCreate={onCreate} />
    </>
  )
}

function LearningPathsPromoSlot({
  inline,
  onCreate
}: {
  inline?: boolean
  onCreate: () => void
}) {
  const card = <CreatePathPromoCard onCreate={onCreate} />

  if (inline) {
    return <div className={styles.promoRow}>{card}</div>
  }

  return card
}

function BestMatchCard({ card }: { card: HomeCourseCard }) {
  return (
    <Link href={card.href} legacyBehavior>
      <a className={styles.bestMatchLink}>
        <article className={styles.bestMatch}>
          <p className={styles.bestMatchKicker}>Best match</p>
          <h2 className={styles.bestMatchTitle}>{card.title}</h2>
          {card.statsLine ? (
            <p className={styles.bestMatchStats}>{card.statsLine}</p>
          ) : (
            <p className={styles.bestMatchMeta}>{card.meta}</p>
          )}
          {card.description ? (
            <p className={styles.bestMatchDescription}>{card.description}</p>
          ) : null}
        </article>
      </a>
    </Link>
  )
}

function ResultGroup({
  label,
  cards,
  emptyMessage,
  startSlot
}: {
  label: string
  cards: HomeCourseCard[]
  emptyMessage?: string
  startSlot?: React.ReactNode
}) {
  if (cards.length === 0 && !startSlot) return null

  return (
    <div className={styles.resultGroup}>
      <h2 className={styles.groupHeading}>{label}</h2>
      <CourseCardGrid
        cards={cards}
        emptyMessage={emptyMessage || ''}
        descriptionWidth='75%'
        startSlot={startSlot}
      />
    </div>
  )
}

export function AllCoursesNewGridSection({
  view = 'all',
  courses,
  coursePaths = [],
  coursePathsReady = true,
  coursePathQuery = '',
  learningPaths = [],
  learningPathsReady = true,
  topicActive = false,
  unifiedHasQuery = false,
  unifiedBestMatch = null,
  unifiedGroups = [],
  unifiedReady = true
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
  const unifiedEmpty =
    view === 'all' &&
    unifiedReady &&
    unifiedHasQuery &&
    !unifiedBestMatch &&
    unifiedGroups.every((group) => group.cards.length === 0)

  if (view === 'all') {
    return (
      <section className={styles.section}>
        <div className={styles.content}>
          {!unifiedReady ? (
            <p className={styles.emptyCreateText}>Searching the library…</p>
          ) : unifiedEmpty ? (
            <>
              <div className={styles.emptyCreate}>
                <p className={styles.emptyCreateText}>
                  Nothing matched that goal yet. Try a university course, a
                  degree, or start a learning path.
                </p>
              </div>
              <SearchCreatePathCallout onCreate={openCreate} />
            </>
          ) : (
            <>
              {unifiedBestMatch ? (
                <BestMatchCard card={unifiedBestMatch} />
              ) : null}
              {unifiedGroups.map((group) => (
                <ResultGroup
                  key={group.kind}
                  label={group.label}
                  cards={group.cards}
                  startSlot={
                    group.kind === 'learning-path' && !unifiedHasQuery ? (
                      <LearningPathsPromoSlot onCreate={openCreate} />
                    ) : group.kind === 'degree' && !unifiedHasQuery ? (
                      <DegreesPromoCard />
                    ) : undefined
                  }
                />
              ))}
              {unifiedHasQuery ? (
                <SearchCreatePathCallout onCreate={openCreate} />
              ) : (
                <p className={styles.disclaimerText}>
                  Coursetexts has neither sought nor received permission from
                  any university to open-source courses that were taught at that
                  university. It is not affiliated with, sponsored by, or
                  endorsed by any university.
                </p>
              )}
            </>
          )}
        </div>
        <CreateLearningPathModal open={createOpen} onClose={closeCreate} />
      </section>
    )
  }

  if (view === 'learning-paths') {
    return (
      <section className={styles.section}>
        <div className={styles.content}>
          {noLearningPathMatches ? (
            <>
              <div className={styles.emptyCreate}>
                <p className={styles.emptyCreateText}>
                  {learningPathEmptyMessage(true, coursePathQuery, topicActive)}
                </p>
              </div>
              <SearchCreatePathCallout onCreate={openCreate} />
            </>
          ) : (
            <>
              <CourseCardGrid
                cards={learningPaths}
                emptyMessage={learningPathEmptyMessage(
                  learningPathsReady,
                  coursePathQuery,
                  topicActive
                )}
                descriptionWidth='75%'
                startSlot={
                  coursePathQuery.trim() ? undefined : (
                    <LearningPathsPromoSlot onCreate={openCreate} />
                  )
                }
              />
              {coursePathQuery.trim() ? (
                <SearchCreatePathCallout onCreate={openCreate} />
              ) : null}
            </>
          )}
        </div>
        <CreateLearningPathModal open={createOpen} onClose={closeCreate} />
      </section>
    )
  }

  const searched = Boolean(coursePathQuery.trim())

  if (view === 'degrees') {
    return (
      <section className={styles.section}>
        <div className={styles.content}>
          <CourseCardGrid
            cards={cards}
            emptyMessage={
              searched
                ? 'No degree curricula matched your search.'
                : 'No degree curricula yet.'
            }
            descriptionWidth='75%'
            startSlot={searched ? undefined : <DegreesPromoCard />}
          />
          {searched ? <SearchCreatePathCallout onCreate={openCreate} /> : null}
        </div>
        <CreateLearningPathModal open={createOpen} onClose={closeCreate} />
      </section>
    )
  }

  if (view === 'research') {
    return (
      <section className={styles.section}>
        <div className={styles.content}>
          <CourseCardGrid
            cards={cards}
            emptyMessage={
              searched
                ? 'No research questions matched your search.'
                : 'No research questions yet.'
            }
            descriptionWidth='75%'
          />
          {searched ? <SearchCreatePathCallout onCreate={openCreate} /> : null}
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
          emptyMessage='No university courses matched your search.'
          descriptionWidth='75%'
        />

        <CourseCardGrid
          cards={coursePaths}
          emptyMessage={coursePathEmptyMessage(
            coursePathsReady,
            coursePathQuery
          )}
          descriptionWidth='75%'
          startSlot={searched ? undefined : <DegreesPromoCard />}
        />

        {searched ? <SearchCreatePathCallout onCreate={openCreate} /> : null}

        <p className={styles.disclaimerText}>
          Coursetexts has neither sought nor received permission from any
          university to open-source courses that were taught at that university.
          It is not affiliated with, sponsored by, or endorsed by any
          university.
        </p>

        <div className={styles.sectionDivider} role='separator' />
      </div>
      <CreateLearningPathModal open={createOpen} onClose={closeCreate} />
    </section>
  )
}

export function catalogHitToCard(hit: CatalogSearchHit): HomeCourseCard {
  const statsLine = formatCatalogStats(hit.stats)

  return {
    id: `${hit.kind}:${hit.id}`,
    href: hit.href,
    meta: hit.meta,
    title: hit.title,
    description: hit.description,
    subjects: hit.subjects,
    subjectDegreeId: hit.subjectDegreeId,
    communityMark: hit.communityMark,
    statsLine: statsLine || undefined
  }
}
