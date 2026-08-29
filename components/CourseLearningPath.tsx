import * as React from 'react'

import { useAuthOptional } from '@/contexts/AuthContext'

import { courseLearningPathActivityPageId } from '@/lib/course-activity-db'
import {
  addCourseLearningPathTopicResource,
  createLocalCourseLearningPathTopicResource,
  ensureMentalMapNodeId,
  getCourseLearningPathData
} from '@/lib/course-learning-path-db'
import {
  readCourseLearningPathExplored,
  writeCourseLearningPathExplored
} from '@/lib/course-learning-path-progress'
import { MENTAL_MAP_GOAL_ID } from '@/lib/course-learning-path-graph'
import {
  COURSE_LEARNING_PATH_MENTAL_MAP_SECTION_ID,
  COURSE_LEARNING_PATH_RESOURCES_SECTION_ID,
  COURSE_LEARNING_PATH_SYLLABUS_SECTION_ID,
  getCourseLearningPathResourcesBySlug,
  isCourseLearningPathMentalMapSelection,
  isCourseLearningPathResourceSelection,
  isCourseLearningPathSyllabusSelection,
  isMentalMapVideoNodeId
} from '@/lib/course-learning-path-resources'
import {
  DEFAULT_COURSE_LEARNING_PATH_SLUG,
  fluidMechanicsSeedCourse
} from '@/lib/course-learning-path-seed'
import {
  type CourseLearningPathData,
  type CourseLearningPathTopicResourceKind,
  buildCourseLearningPathIndex,
  formatCourseLearningPathConceptTree,
  insertTopicResourceAtPlacement,
  mapCourseLearningPathMentalMapTopicResources,
  mapCourseLearningPathNodeTopicResources,
  nextCourseLearningPathNode
} from '@/lib/course-learning-path-types'
import { restoreScrollAfter } from '@/lib/restore-scroll-after'

import styles from './CourseLearningPath.module.css'
import { CourseActivity } from './CourseActivity'
import { CourseHero, formatHeroPublishedDate } from './CourseHero'
import { CourseLearningPathHeroActions } from './CourseLearningPathHeroActions'
import { CourseLearningPathMentalMap } from './CourseLearningPathMentalMap'
import { CourseLearningPathResources } from './CourseLearningPathResources'
import { CourseLearningPathSyllabusNav } from './CourseLearningPathSyllabusNav'
import { CourseLearningPathSyllabusOverview } from './CourseLearningPathSyllabusOverview'
import { CourseLearningPathTopicContent } from './CourseLearningPathTopicContent'
import { PathGraphCanvas } from './PathGraphCanvas'

export interface CourseLearningPathProps {
  /** Syllabus course slug in Supabase. Falls back to seed data when missing. */
  slug?: string
  /** Optional preloaded course (skips fetch). */
  course?: CourseLearningPathData
}

function withCurriculumResources(
  course: CourseLearningPathData,
  slug: string
): CourseLearningPathData {
  if (course.resources?.length) return course
  const resources = getCourseLearningPathResourcesBySlug(slug || course.slug)
  if (!resources.length) return course
  return { ...course, resources }
}

const GRAPH_MAIN_MIN = 280
const GRAPH_ASIDE_MIN = 360
const GRAPH_MAIN_DEFAULT = 400
const GRAPH_SPLIT_STORAGE_KEY = 'coursetexts-course-path-graph-main-width'

function readStoredGraphMainWidth() {
  if (typeof window === 'undefined') return GRAPH_MAIN_DEFAULT
  try {
    const raw = window.localStorage.getItem(GRAPH_SPLIT_STORAGE_KEY)
    const n = raw ? Number(raw) : NaN
    return Number.isFinite(n) ? n : GRAPH_MAIN_DEFAULT
  } catch {
    return GRAPH_MAIN_DEFAULT
  }
}

function persistGraphMainWidth(width: number) {
  try {
    window.localStorage.setItem(
      GRAPH_SPLIT_STORAGE_KEY,
      String(Math.round(width))
    )
  } catch {
    // ignore quota / private mode
  }
}

function clampGraphMainWidth(width: number, bodyWidth: number) {
  const max = Math.max(GRAPH_MAIN_MIN, Math.floor(bodyWidth - GRAPH_ASIDE_MIN))
  return Math.round(Math.min(max, Math.max(GRAPH_MAIN_MIN, width)))
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function courseDescriptionHtml(description: string) {
  const text = description.trim()
  if (!text) {
    return '<p>Browse the recommended topic sequence for this course, then open a topic to watch curated videos.</p>'
  }
  return text
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => `<p>${escapeHtml(part).replace(/\n/g, '<br/>')}</p>`)
    .join('')
}

/**
 * Syllabus navigator + curated video library for a course.
 * Loads from Supabase `curated_*` tables; uses local seed when empty.
 */
export function CourseLearningPath({
  slug = DEFAULT_COURSE_LEARNING_PATH_SLUG,
  course: courseProp
}: CourseLearningPathProps) {
  const auth = useAuthOptional()
  const [course, setCourse] = React.useState<CourseLearningPathData | null>(() =>
    courseProp ? withCurriculumResources(courseProp, slug) : null
  )
  const [loading, setLoading] = React.useState(!courseProp)
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false)
  const courseIdentityRef = React.useRef<string | null>(
    courseProp ? `${courseProp.id}:${slug}` : null
  )
  const loadedSlugRef = React.useRef<string | null>(courseProp ? slug : null)
  const [selectedId, setSelectedId] = React.useState(
    COURSE_LEARNING_PATH_SYLLABUS_SECTION_ID
  )
  const [navView, setNavView] = React.useState<'list' | 'graph'>('list')
  const [expanded, setExpanded] = React.useState<Set<string>>(() => new Set())
  const [exploredIds, setExploredIds] = React.useState<Set<string>>(
    () => new Set()
  )
  const [graphMainWidth, setGraphMainWidth] = React.useState(GRAPH_MAIN_DEFAULT)
  const [graphSplitDragging, setGraphSplitDragging] = React.useState(false)
  const mainRef = React.useRef<HTMLElement>(null)
  const bodyRef = React.useRef<HTMLDivElement>(null)
  const graphMainWidthRef = React.useRef(graphMainWidth)
  const graphSplitDraggingRef = React.useRef(false)
  graphMainWidthRef.current = graphMainWidth

  function measureGraphBodyWidth() {
    return (
      bodyRef.current?.getBoundingClientRect().width ??
      (typeof window !== 'undefined' ? window.innerWidth : 1200)
    )
  }

  function applyGraphMainWidth(width: number, persist = false) {
    const next = clampGraphMainWidth(width, measureGraphBodyWidth())
    graphMainWidthRef.current = next
    setGraphMainWidth(next)
    if (persist) persistGraphMainWidth(next)
    return next
  }

  React.useEffect(() => {
    if (navView !== 'graph') return
    applyGraphMainWidth(readStoredGraphMainWidth())
  }, [navView])

  React.useEffect(() => {
    if (navView !== 'graph') return
    function onResize() {
      applyGraphMainWidth(graphMainWidthRef.current)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [navView])

  function handleGraphSplitPointerDown(
    event: React.PointerEvent<HTMLButtonElement>
  ) {
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    graphSplitDraggingRef.current = true
    setGraphSplitDragging(true)
  }

  function handleGraphSplitPointerMove(
    event: React.PointerEvent<HTMLButtonElement>
  ) {
    if (!graphSplitDraggingRef.current) return
    const body = bodyRef.current
    if (!body) return
    applyGraphMainWidth(body.getBoundingClientRect().right - event.clientX)
  }

  function handleGraphSplitPointerUp(
    event: React.PointerEvent<HTMLButtonElement>
  ) {
    if (!graphSplitDraggingRef.current) return
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    graphSplitDraggingRef.current = false
    setGraphSplitDragging(false)
    persistGraphMainWidth(graphMainWidthRef.current)
  }

  function handleGraphSplitKeyDown(
    event: React.KeyboardEvent<HTMLButtonElement>
  ) {
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      applyGraphMainWidth(graphMainWidthRef.current + 24, true)
    } else if (event.key === 'ArrowRight') {
      event.preventDefault()
      applyGraphMainWidth(graphMainWidthRef.current - 24, true)
    } else if (event.key === 'Home') {
      event.preventDefault()
      applyGraphMainWidth(GRAPH_MAIN_MIN, true)
    } else if (event.key === 'End') {
      event.preventDefault()
      applyGraphMainWidth(measureGraphBodyWidth() - GRAPH_ASIDE_MIN, true)
    }
  }

  function handleGraphSplitDoubleClick() {
    applyGraphMainWidth(GRAPH_MAIN_DEFAULT, true)
  }

  React.useEffect(() => {
    if (courseProp) {
      setCourse(withCurriculumResources(courseProp, slug))
      loadedSlugRef.current = slug
      setLoading(false)
      return
    }

    let cancelled = false
    const firstLoadForSlug = loadedSlugRef.current !== slug
    if (firstLoadForSlug) setLoading(true)
    ;(async () => {
      const fromDb = await getCourseLearningPathData(slug)
      if (cancelled) return

      if (fromDb) {
        // Prefer DB row even with an empty syllabus (placeholder course learning paths).
        // Fluid Mechanics keeps local seed only when the DB course has no topics yet.
        if (
          fromDb.topics.length === 0 &&
          slug === DEFAULT_COURSE_LEARNING_PATH_SLUG
        ) {
          setCourse((prev) =>
            prev && prev.slug === slug && !prev.dbBacked
              ? prev
              : withCurriculumResources(
                  { ...fluidMechanicsSeedCourse, dbBacked: false },
                  slug
                )
          )
        } else {
          setCourse(withCurriculumResources(fromDb, slug))
        }
      } else if (slug === DEFAULT_COURSE_LEARNING_PATH_SLUG) {
        setCourse((prev) =>
          prev && prev.slug === slug && !prev.dbBacked
            ? prev
            : withCurriculumResources(
                { ...fluidMechanicsSeedCourse, dbBacked: false },
                slug
              )
        )
      } else {
        setCourse(null)
      }
      loadedSlugRef.current = slug
      setLoading(false)
    })()

    return () => {
      cancelled = true
    }
  }, [slug, courseProp, auth?.user?.id])

  // Reset nav selection only when switching courses (not on vote/add).
  React.useEffect(() => {
    if (!course) return
    const key = `${course.id}:${slug}`
    if (courseIdentityRef.current === key) return
    courseIdentityRef.current = key
    setSelectedId(COURSE_LEARNING_PATH_SYLLABUS_SECTION_ID)
    setNavView('list')
    setExpanded(new Set())
  }, [course, slug])

  React.useEffect(() => {
    setExploredIds(readCourseLearningPathExplored(slug))
  }, [slug])

  const index = React.useMemo(
    () => (course ? buildCourseLearningPathIndex(course) : {}),
    [course]
  )

  const showingSyllabus = isCourseLearningPathSyllabusSelection(selectedId)
  const showingMentalMap = isCourseLearningPathMentalMapSelection(selectedId)
  const showingResources = isCourseLearningPathResourceSelection(selectedId)
  const entry =
    showingSyllabus || showingMentalMap || showingResources
      ? null
      : selectedId && index[selectedId]
      ? index[selectedId]
      : null

  function handleSelect(id: string) {
    setSelectedId(id)
    setExpanded((prev) => {
      const next = new Set(prev)
      next.add(id)
      if (isCourseLearningPathResourceSelection(id)) {
        next.add(COURSE_LEARNING_PATH_RESOURCES_SECTION_ID)
      }
      for (const parent of index[id]?.parents ?? []) next.add(parent.id)
      return next
    })
    setMobileNavOpen(false)
  }

  function handleGraphSelect(id: string) {
    restoreScrollAfter(() => {
      handleSelect(
        id === MENTAL_MAP_GOAL_ID
          ? COURSE_LEARNING_PATH_MENTAL_MAP_SECTION_ID
          : id
      )
    }, mainRef.current)
  }

  function handleMarkExplored(nodeId: string) {
    setExploredIds((prev) => {
      if (prev.has(nodeId)) return prev
      const next = new Set(prev)
      next.add(nodeId)
      writeCourseLearningPathExplored(slug, next)
      return next
    })
  }

  function handleNext(nodeId: string) {
    restoreScrollAfter(() => handleSelect(nodeId), mainRef.current)
  }

  function handleToggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleAddTopicResource(input: {
    nodeId: string
    kind: CourseLearningPathTopicResourceKind
    url?: string
    title?: string
    passage?: string
    why?: string
    suggestedPlacement?: number
  }): Promise<boolean> {
    if (!course) return false

    if (isMentalMapVideoNodeId(input.nodeId)) {
      const current = course.mentalMapTopicResources ?? []
      if (course.dbBacked) {
        const mapNodeId = await ensureMentalMapNodeId(course.id)
        if (!mapNodeId) return false
        const result = await addCourseLearningPathTopicResource(
          {
            ...input,
            nodeId: mapNodeId,
            conceptTree: `${course.title} --> Mental Map`,
            courseSlug: course.slug
          },
          current
        )
        if (!result) return false
        setCourse((prev) =>
          prev
            ? mapCourseLearningPathMentalMapTopicResources(
                prev,
                () => result.ordered
              )
            : prev
        )
        return true
      }
      const local = createLocalCourseLearningPathTopicResource(input)
      setCourse((prev) =>
        prev
          ? mapCourseLearningPathMentalMapTopicResources(prev, (items) =>
              insertTopicResourceAtPlacement(
                items,
                local,
                input.suggestedPlacement ?? current.length + 1
              )
            )
          : prev
      )
      return true
    }

    const entry = buildCourseLearningPathIndex(course)[input.nodeId]
    const current = entry?.node.topicResources ?? []
    const conceptTree = entry
      ? formatCourseLearningPathConceptTree(
          course.title,
          entry.parents,
          entry.node.title
        )
      : undefined

    if (course.dbBacked) {
      const result = await addCourseLearningPathTopicResource(
        { ...input, conceptTree, courseSlug: course.slug },
        current
      )
      if (!result) return false
      setCourse((prev) =>
        prev
          ? mapCourseLearningPathNodeTopicResources(
              prev,
              input.nodeId,
              () => result.ordered
            )
          : prev
      )
      return true
    }

    const local = createLocalCourseLearningPathTopicResource(input)
    setCourse((prev) =>
      prev
        ? mapCourseLearningPathNodeTopicResources(prev, input.nodeId, (items) =>
            insertTopicResourceAtPlacement(
              items,
              local,
              input.suggestedPlacement ?? items.length + 1
            )
          )
        : prev
    )
    return true
  }

  if (loading) {
    return <div className={styles.loading}>Loading syllabus…</div>
  }

  if (!course) {
    return (
      <div className={styles.error}>
        No course learning path found for “{slug}”. Seed curated_courses or check the
        slug.
      </div>
    )
  }

  const hasSyllabus = course.topics.length > 0
  const graphSelectedId = showingMentalMap
    ? MENTAL_MAP_GOAL_ID
    : showingSyllabus || showingResources
      ? ''
      : selectedId

  return (
    <div className={styles.root}>
      <div className={styles.hero}>
        <CourseHero
          courseCode='Course Learning Path'
          title={course.title}
          instructors={[{ name: 'By Coursetexts' }]}
          descriptionHtml={courseDescriptionHtml(course.description)}
          schoolDate={formatHeroPublishedDate(course.createdAt)}
          publisherAvatarFallback='coursetexts'
          publisherAvatarAlt='Coursetexts'
          actions={<CourseLearningPathHeroActions course={course} />}
        />
      </div>
      <header className={styles.topBar}>
        <button
          type='button'
          onClick={() => setMobileNavOpen((v) => !v)}
          className={styles.menuBtn}
          aria-label={
            mobileNavOpen
              ? navView === 'graph'
                ? 'Close map'
                : 'Close syllabus'
              : navView === 'graph'
                ? 'Open map'
                : 'Open syllabus'
          }
        >
          {mobileNavOpen ? <CloseIcon /> : <MenuIcon />}
        </button>
      </header>

      <div
        ref={bodyRef}
        className={`${styles.body}${
          navView === 'graph' ? ` ${styles.bodyGraph}` : ''
        }${graphSplitDragging ? ` ${styles.bodyGraphDragging}` : ''}`}
      >
        <aside
          className={`${styles.aside}${
            mobileNavOpen ? ` ${styles.asideOpen}` : ''
          }${navView === 'graph' ? ` ${styles.asideGraph}` : ''}`}
        >
          <div className={styles.asideInner}>
            <div className={styles.asideToolbar}>
              <div className={styles.asideToolbarCopy}>
                <h2 className={styles.asideMapTitle}>
                  {navView === 'list' ? 'The outline' : 'The map'}
                </h2>
                {navView === 'graph' ? (
                  <span className={styles.asideMapHint}>
                    Hover a topic to see its children · click a node to read it
                  </span>
                ) : null}
              </div>
              <div
                className={styles.viewToggle}
                role='group'
                aria-label='Course view'
              >
                <button
                  type='button'
                  className={styles.viewToggleBtn}
                  aria-pressed={navView === 'graph'}
                  onClick={() => setNavView('graph')}
                >
                  Graph
                </button>
                <button
                  type='button'
                  className={styles.viewToggleBtn}
                  aria-pressed={navView === 'list'}
                  onClick={() => setNavView('list')}
                >
                  List
                </button>
              </div>
            </div>
            {navView === 'graph' ? (
              <div className={styles.asideGraphStage}>
                <PathGraphCanvas
                  course={course}
                  exploredIds={exploredIds}
                  selectedId={graphSelectedId}
                  onOpenNode={handleGraphSelect}
                />
              </div>
            ) : (
              <CourseLearningPathSyllabusNav
                course={course}
                selectedId={selectedId}
                expanded={expanded}
                exploredIds={exploredIds}
                onSelect={handleSelect}
                onToggle={handleToggle}
              />
            )}
          </div>
        </aside>

        {navView === 'graph' ? (
          <button
            type='button'
            className={`${styles.splitHandle}${
              graphSplitDragging ? ` ${styles.splitHandleActive}` : ''
            }`}
            aria-label='Resize content panel'
            aria-orientation='vertical'
            aria-valuemin={GRAPH_MAIN_MIN}
            aria-valuenow={graphMainWidth}
            title='Drag to resize. Double-click to reset.'
            onPointerDown={handleGraphSplitPointerDown}
            onPointerMove={handleGraphSplitPointerMove}
            onPointerUp={handleGraphSplitPointerUp}
            onPointerCancel={handleGraphSplitPointerUp}
            onLostPointerCapture={handleGraphSplitPointerUp}
            onKeyDown={handleGraphSplitKeyDown}
            onDoubleClick={handleGraphSplitDoubleClick}
          />
        ) : null}

        {mobileNavOpen && (
          <button
            type='button'
            aria-label={navView === 'graph' ? 'Close map' : 'Close syllabus'}
            onClick={() => setMobileNavOpen(false)}
            className={styles.overlay}
          />
        )}

        <main
          ref={mainRef}
          className={`${styles.main}${
            navView === 'graph' ? ` ${styles.mainGraph}` : ''
          }`}
          style={
            navView === 'graph'
              ? {
                  flexBasis: graphMainWidth,
                  width: graphMainWidth,
                  maxWidth: 'none'
                }
              : undefined
          }
        >
          {showingSyllabus ? (
            <CourseLearningPathSyllabusOverview
              course={course}
              onSelectTopic={handleSelect}
            />
          ) : showingMentalMap ? (
            <CourseLearningPathMentalMap
              course={course}
              topicResources={course.mentalMapTopicResources}
              dbBacked={Boolean(course.dbBacked)}
              signedIn={Boolean(auth?.user)}
              onSignIn={() => auth?.signInWithGoogle()}
              onAddTopicResource={handleAddTopicResource}
            />
          ) : showingResources ? (
            <CourseLearningPathResources
              selectedId={selectedId}
              resources={course.resources}
              courseTitle={course.title}
            />
          ) : entry ? (
            <CourseLearningPathTopicContent
              entry={entry}
              onSelect={handleSelect}
              courseSlug={course.slug}
              dbBacked={Boolean(course.dbBacked)}
              signedIn={Boolean(auth?.user)}
              onSignIn={() => auth?.signInWithGoogle()}
              onAddTopicResource={handleAddTopicResource}
              explored={exploredIds.has(entry.node.id)}
              onMarkExplored={() => handleMarkExplored(entry.node.id)}
              nextNode={nextCourseLearningPathNode(course, entry.node.id)}
              onNext={handleNext}
            />
          ) : (
            <div className={styles.emptyComingSoon}>
              <p className={styles.emptyComingSoonTitle}>
                {hasSyllabus ? 'Select a topic' : 'Curated videos coming soon'}
              </p>
              {course.description ? (
                <p className={styles.emptyComingSoonBody}>
                  {course.description}
                </p>
              ) : (
                <p className={styles.emptyComingSoonBody}>
                  This course is listed in our curated catalog. Video syllabus
                  content will appear here once it is added.
                </p>
              )}
            </div>
          )}
        </main>
      </div>
      <div className={styles.activitySection}>
        <CourseActivity
          coursePageId={courseLearningPathActivityPageId(course.slug)}
          courseTitle={course.title}
          courseUrl={`/course-learning-path/${course.slug}`}
        />
      </div>
    </div>
  )
}

function MenuIcon() {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='18'
      height='18'
      viewBox='0 0 16 16'
      fill='none'
      aria-hidden
    >
      <path
        d='M2.5 4H13.5M2.5 8H13.5M2.5 12H13.5'
        stroke='currentColor'
        strokeWidth='1.4'
        strokeLinecap='round'
      />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='18'
      height='18'
      viewBox='0 0 16 16'
      fill='none'
      aria-hidden
    >
      <path
        d='M4 4L12 12M12 4L4 12'
        stroke='currentColor'
        strokeWidth='1.4'
        strokeLinecap='round'
      />
    </svg>
  )
}

export default CourseLearningPath
