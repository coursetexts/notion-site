import * as React from 'react'

import { useAuthOptional } from '@/contexts/AuthContext'

import { currentAuthRedirectPath } from '@/lib/auth-redirect'
import { courseLearningPathActivityPageId } from '@/lib/course-activity-db'
import {
  addCourseLearningPathTopicResource,
  createLocalCourseLearningPathTopicResource,
  ensureMentalMapNodeId,
  getCourseLearningPathData,
  updateCourseLearningPathTopicResource
} from '@/lib/course-learning-path-db'
import { MENTAL_MAP_GOAL_ID } from '@/lib/course-learning-path-graph'
import {
  readCourseLearningPathExplored,
  writeCourseLearningPathExplored
} from '@/lib/course-learning-path-progress'
import {
  COURSE_LEARNING_PATH_KNOWLEDGE_SECTION_ID,
  COURSE_LEARNING_PATH_MENTAL_MAP_SECTION_ID,
  COURSE_LEARNING_PATH_RESOURCES_SECTION_ID,
  COURSE_LEARNING_PATH_SYLLABUS_SECTION_ID,
  getCourseLearningPathResourcesBySlug,
  isCourseLearningPathKnowledgeSelection,
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
  type CourseLearningPathTopicResource,
  type CourseLearningPathTopicResourceKind,
  buildCourseLearningPathIndex,
  formatCourseLearningPathConceptTree,
  insertTopicResourceAtPlacement,
  mapCourseLearningPathMentalMapTopicResources,
  mapCourseLearningPathNodeTopicResources,
  moveTopicResourceToPlacement,
  nextCourseLearningPathNode
} from '@/lib/course-learning-path-types'
import { structuralKnowledgeEdgesFromCourseLearningPath } from '@/lib/knowledge-graph'
import {
  learningPathKicker,
  learningPathOutlineHint
} from '@/lib/learning-path-kind-ui'
import {
  isCourseLearningPathFinished,
  knowledgeTopicItemsFromCourseLearningPath,
  knowledgeTopicsFromCourseLearningPath
} from '@/lib/learning-path-knowledge'
import { recordLearningPathProgressEvent } from '@/lib/learning-path-progress-events-db'
import {
  LEARNING_PATH_RATING_TARGET,
  hasLocalLearningPathRating
} from '@/lib/learning-path-ratings'
import { submitLearningPathRating } from '@/lib/learning-path-ratings-db'
import { readSearchParam, replaceSearchParams } from '@/lib/note-deep-link'
import { restoreScrollAfter } from '@/lib/restore-scroll-after'
import { addKnowledgeTopicsFromCompletedPath } from '@/lib/user-knowledge-topics-db'

import { CourseActivity } from './CourseActivity'
import { CourseHero, formatHeroPublishedDate } from './CourseHero'
import styles from './CourseLearningPath.module.css'
import { CourseLearningPathHeroActions } from './CourseLearningPathHeroActions'
import { CourseLearningPathMentalMap } from './CourseLearningPathMentalMap'
import { CourseLearningPathNotes } from './CourseLearningPathNotes'
import { CourseLearningPathResources } from './CourseLearningPathResources'
import { CourseLearningPathSyllabusNav } from './CourseLearningPathSyllabusNav'
import { CourseLearningPathSyllabusOverview } from './CourseLearningPathSyllabusOverview'
import { CourseLearningPathTopicContent } from './CourseLearningPathTopicContent'
import pathStyles from './LearningPath.module.css'
import { LearningPathFinishedModal } from './LearningPathFinishedModal'
import { LearningPathLearnedPanel } from './LearningPathLearnedPanel'
import { LearningPathOutlinePanel } from './LearningPathOutlinePanel'
import { LearningPathRatingModal } from './LearningPathRatingModal'
import { PathContentActivity } from './PathContentActivity'
import { PathGraphCanvas } from './PathGraphCanvas'

export interface CourseLearningPathProps {
  /** Syllabus course slug in Supabase. Falls back to seed data when missing. */
  slug?: string
  /** Optional preloaded course (skips fetch). */
  course?: CourseLearningPathData
  /** Hero kicker above the title. */
  kicker?: string
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

function initialCourseSelection(course: CourseLearningPathData): string {
  const node = readSearchParam('node')
  if (!node) return COURSE_LEARNING_PATH_SYLLABUS_SECTION_ID
  if (
    isCourseLearningPathSyllabusSelection(node) ||
    isCourseLearningPathMentalMapSelection(node) ||
    isCourseLearningPathResourceSelection(node) ||
    isCourseLearningPathKnowledgeSelection(node) ||
    isMentalMapVideoNodeId(node)
  ) {
    return node
  }
  const index = buildCourseLearningPathIndex(course)
  if (index[node]) return node
  return COURSE_LEARNING_PATH_SYLLABUS_SECTION_ID
}

function expandedIdsForCourseSelection(
  course: CourseLearningPathData,
  id: string
): Set<string> {
  const next = new Set<string>()
  next.add(id)
  if (isCourseLearningPathResourceSelection(id)) {
    next.add(COURSE_LEARNING_PATH_RESOURCES_SECTION_ID)
  }
  const index = buildCourseLearningPathIndex(course)
  for (const parent of index[id]?.parents ?? []) next.add(parent.id)
  return next
}

/**
 * Syllabus navigator + curated video library for a course.
 * Loads from learning_paths (kind = course); uses local seed when empty.
 */
export function CourseLearningPath({
  slug = DEFAULT_COURSE_LEARNING_PATH_SLUG,
  course: courseProp,
  kicker = learningPathKicker('course')
}: CourseLearningPathProps) {
  const auth = useAuthOptional()
  const [course, setCourse] = React.useState<CourseLearningPathData | null>(
    () => (courseProp ? withCurriculumResources(courseProp, slug) : null)
  )
  const [loading, setLoading] = React.useState(!courseProp)
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false)
  const courseIdentityRef = React.useRef<string | null>(null)
  const loadedSlugRef = React.useRef<string | null>(courseProp ? slug : null)
  const [selectedId, setSelectedId] = React.useState(
    COURSE_LEARNING_PATH_SYLLABUS_SECTION_ID
  )
  const [navView, setNavView] = React.useState<'list' | 'graph'>('list')
  const [outlineSearch, setOutlineSearch] = React.useState('')
  const [expanded, setExpanded] = React.useState<Set<string>>(() => new Set())
  const [exploredIds, setExploredIds] = React.useState<Set<string>>(
    () => new Set()
  )
  const [graphMainWidth, setGraphMainWidth] = React.useState(GRAPH_MAIN_DEFAULT)
  const [graphSplitDragging, setGraphSplitDragging] = React.useState(false)
  const [activityRefreshNonce, setActivityRefreshNonce] = React.useState(0)
  const [showFinishedModal, setShowFinishedModal] = React.useState(false)
  const [topicRating, setTopicRating] = React.useState<{
    id: string
    title: string
  } | null>(null)
  const [pendingFinish, setPendingFinish] = React.useState(false)
  const mainRef = React.useRef<HTMLDivElement>(null)
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
    const selected = initialCourseSelection(course)
    setSelectedId(selected)
    replaceSearchParams({ node: selected })
    setNavView('list')
    setOutlineSearch('')
    setExpanded(expandedIdsForCourseSelection(course, selected))
  }, [course, slug])

  React.useEffect(() => {
    setExploredIds(readCourseLearningPathExplored(slug))
    setShowFinishedModal(false)
    setTopicRating(null)
    setPendingFinish(false)
  }, [slug])

  React.useEffect(() => {
    if (!course) return
    if (!isCourseLearningPathKnowledgeSelection(selectedId)) return
    if (isCourseLearningPathFinished(course, exploredIds)) return
    setSelectedId(COURSE_LEARNING_PATH_SYLLABUS_SECTION_ID)
    replaceSearchParams({ node: COURSE_LEARNING_PATH_SYLLABUS_SECTION_ID })
  }, [course, exploredIds, selectedId])

  React.useEffect(() => {
    if (!course || !auth?.user) return
    if (!isCourseLearningPathFinished(course, exploredIds)) return
    void addKnowledgeTopicsFromCompletedPath({
      labels: knowledgeTopicsFromCourseLearningPath(course),
      pathId: course.id,
      pathSlug: course.slug,
      pathTitle: course.title,
      graphEdges: structuralKnowledgeEdgesFromCourseLearningPath(course)
    })
  }, [auth?.user, course, exploredIds])

  const index = React.useMemo(
    () => (course ? buildCourseLearningPathIndex(course) : {}),
    [course]
  )

  const showingSyllabus = isCourseLearningPathSyllabusSelection(selectedId)
  const showingMentalMap = isCourseLearningPathMentalMapSelection(selectedId)
  const showingResources = isCourseLearningPathResourceSelection(selectedId)
  const showingKnowledge = isCourseLearningPathKnowledgeSelection(selectedId)
  const learnedTopics = React.useMemo(
    () => (course ? knowledgeTopicItemsFromCourseLearningPath(course) : []),
    [course]
  )
  const entry =
    showingSyllabus || showingMentalMap || showingResources || showingKnowledge
      ? null
      : selectedId && index[selectedId]
      ? index[selectedId]
      : null

  function handleSelect(id: string) {
    setSelectedId(id)
    replaceSearchParams({ node: id })
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

  function handleToggleExplored(nodeId: string) {
    if (!course) return
    const wasExplored = exploredIds.has(nodeId)
    const next = new Set(exploredIds)
    if (wasExplored) next.delete(nodeId)
    else next.add(nodeId)
    const justFinished =
      !wasExplored &&
      !isCourseLearningPathFinished(course, exploredIds) &&
      isCourseLearningPathFinished(course, next)
    setExploredIds(next)
    writeCourseLearningPathExplored(slug, next)
    if (!wasExplored) {
      const title = index[nodeId]?.node.title || 'Topic'
      const alreadyRated = hasLocalLearningPathRating(slug, 'topic', nodeId)
      if (!alreadyRated) {
        setTopicRating({ id: nodeId, title })
      }
      if (justFinished) {
        if (alreadyRated) setShowFinishedModal(true)
        else setPendingFinish(true)
        setNavView('list')
        setSelectedId(COURSE_LEARNING_PATH_KNOWLEDGE_SECTION_ID)
        replaceSearchParams({ node: COURSE_LEARNING_PATH_KNOWLEDGE_SECTION_ID })
        setMobileNavOpen(false)
      }
    }
    if (!wasExplored && course.dbBacked) {
      void recordLearningPathProgressEvent({
        pathId: course.id,
        nodeId,
        nodeLabel: index[nodeId]?.node.title,
        status: 'explored'
      })
    }
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
        const mapNodeId = await ensureMentalMapNodeId(course.id, course.slug)
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

  async function handleUpdateTopicResource(input: {
    resourceId: string
    nodeId: string
    kind: CourseLearningPathTopicResourceKind
    url?: string
    title?: string
    passage?: string
    why?: string
    suggestedPlacement?: number
  }): Promise<boolean> {
    if (!course) return false

    function applyLocal(items: CourseLearningPathTopicResource[]) {
      const current = items.find((item) => item.id === input.resourceId)
      if (!current) return items
      const patched = items.map((item) =>
        item.id === input.resourceId
          ? {
              ...item,
              kind: input.kind,
              title: (input.title || item.title).trim(),
              url: input.url,
              passage: input.passage,
              why: input.why
            }
          : item
      )
      return moveTopicResourceToPlacement(
        patched,
        input.resourceId,
        input.suggestedPlacement ?? current.position
      )
    }

    if (isMentalMapVideoNodeId(input.nodeId)) {
      const current = course.mentalMapTopicResources ?? []
      if (course.dbBacked) {
        const mapNodeId = await ensureMentalMapNodeId(course.id, course.slug)
        if (!mapNodeId) return false
        const result = await updateCourseLearningPathTopicResource(
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
      setCourse((prev) =>
        prev
          ? mapCourseLearningPathMentalMapTopicResources(prev, applyLocal)
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
      const result = await updateCourseLearningPathTopicResource(
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

    setCourse((prev) =>
      prev
        ? mapCourseLearningPathNodeTopicResources(
            prev,
            input.nodeId,
            applyLocal
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
        No course learning path found for “{slug}”. Seed curated_courses or
        check the slug.
      </div>
    )
  }

  const hasSyllabus = course.topics.length > 0
  const graphSelectedId = showingMentalMap
    ? MENTAL_MAP_GOAL_ID
    : showingSyllabus || showingResources || showingKnowledge
    ? ''
    : selectedId

  return (
    <div className={pathStyles.section}>
      <LearningPathRatingModal
        open={Boolean(topicRating)}
        badge='Topic complete'
        title={topicRating ? `You finished ${topicRating.title}` : ''}
        onSkip={() => {
          setTopicRating(null)
          if (pendingFinish) {
            setPendingFinish(false)
            setShowFinishedModal(true)
          }
        }}
        onSubmit={(rating, durationMs) => {
          if (topicRating) {
            void submitLearningPathRating({
              pathSlug: slug,
              pathId: course.id,
              targetType: 'topic',
              targetId: topicRating.id,
              targetTitle: topicRating.title,
              rating,
              durationMs
            })
          }
          setTopicRating(null)
          if (pendingFinish) {
            setPendingFinish(false)
            setShowFinishedModal(true)
          }
        }}
      />
      <LearningPathFinishedModal
        open={showFinishedModal}
        pathTitle={course.title}
        topics={learnedTopics}
        kindLabel='course'
        showRating={
          !hasLocalLearningPathRating(slug, 'path', LEARNING_PATH_RATING_TARGET)
        }
        onClose={() => setShowFinishedModal(false)}
        onSubmitRating={(rating, durationMs) => {
          void submitLearningPathRating({
            pathSlug: slug,
            pathId: course.id,
            targetType: 'path',
            targetId: LEARNING_PATH_RATING_TARGET,
            targetTitle: course.title,
            rating,
            durationMs
          })
        }}
        onSelectTopic={(id) => {
          setShowFinishedModal(false)
          handleSelect(id)
        }}
      />
      <div className={pathStyles.hero}>
        <CourseHero
          courseCode={kicker}
          title={course.title}
          instructors={[{ name: 'By Coursetexts' }]}
          descriptionHtml={courseDescriptionHtml(course.description)}
          schoolDate={formatHeroPublishedDate(course.createdAt)}
          reportTarget={{
            type: 'learning_path',
            id: course.id || course.slug,
            url: `/learning-path/${course.slug}`,
            title: course.title
          }}
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
        className={`${pathStyles.body}${
          navView === 'graph' ? ` ${pathStyles.bodyGraph}` : ''
        }${graphSplitDragging ? ` ${pathStyles.bodyGraphDragging}` : ''}`}
      >
        <div
          className={`${pathStyles.layout} ${
            navView === 'graph' ? pathStyles.layoutGraph : pathStyles.layoutList
          }`}
        >
          <aside
            className={`${styles.aside}${
              mobileNavOpen ? ` ${styles.asideOpen}` : ''
            }${navView === 'graph' ? ` ${styles.asideGraph}` : ''}`}
          >
            <LearningPathOutlinePanel
              viewMode={navView}
              onViewModeChange={setNavView}
              search={outlineSearch}
              onSearchChange={setOutlineSearch}
              searchAriaLabel='Search in outline'
              graphHint={learningPathOutlineHint('course')}
              list={
                <CourseLearningPathSyllabusNav
                  course={course}
                  selectedId={selectedId}
                  expanded={expanded}
                  exploredIds={exploredIds}
                  onSelect={handleSelect}
                  onToggle={handleToggle}
                  search={outlineSearch}
                  onSearchChange={setOutlineSearch}
                  hideSearch
                />
              }
              graph={
                <div className={pathStyles.mapStage}>
                  <PathGraphCanvas
                    course={course}
                    exploredIds={exploredIds}
                    selectedId={graphSelectedId}
                    onOpenNode={handleGraphSelect}
                  />
                </div>
              }
            />
          </aside>

          {navView === 'graph' ? (
            <button
              type='button'
              className={`${pathStyles.splitHandle}${
                graphSplitDragging ? ` ${pathStyles.splitHandleActive}` : ''
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

          <PathContentActivity
            className={pathStyles.detail}
            contentClassName={pathStyles.detailContent}
            contentRef={mainRef}
            style={
              navView === 'graph'
                ? {
                    flexBasis: graphMainWidth,
                    width: graphMainWidth,
                    maxWidth: 'none'
                  }
                : undefined
            }
            coursePageId={courseLearningPathActivityPageId(course.slug)}
            courseTitle={course.title}
            courseUrl={`/learning-path/${course.slug}`}
            sectionId={selectedId}
            notesTopicTitle={
              showingSyllabus
                ? 'Syllabus'
                : showingMentalMap
                ? 'Mental Map'
                : showingKnowledge
                ? 'What you learned'
                : showingResources
                ? 'Resources'
                : entry?.node.title ?? course.title
            }
            notesEditor={
              <CourseLearningPathNotes
                nodeId={selectedId}
                courseSlug={course.slug}
                topicTitle={
                  showingSyllabus
                    ? 'Syllabus'
                    : showingMentalMap
                    ? 'Mental Map'
                    : showingKnowledge
                    ? 'What you learned'
                    : showingResources
                    ? 'Resources'
                    : entry?.node.title
                }
                signedIn={Boolean(auth?.user)}
                onSignIn={() =>
                  auth?.signInWithGoogle(
                    currentAuthRedirectPath({
                      notes: '1',
                      node: selectedId
                    })
                  )
                }
              />
            }
            onActivityPosted={() => setActivityRefreshNonce((n) => n + 1)}
          >
            {showingKnowledge ? (
              <LearningPathLearnedPanel
                pathTitle={course.title}
                topics={learnedTopics}
                onSelectTopic={handleSelect}
              />
            ) : showingSyllabus ? (
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
                onSignIn={() =>
                  auth?.signInWithGoogle(
                    currentAuthRedirectPath({ node: selectedId })
                  )
                }
                onAddTopicResource={handleAddTopicResource}
                onUpdateTopicResource={handleUpdateTopicResource}
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
                dbBacked={Boolean(course.dbBacked)}
                signedIn={Boolean(auth?.user)}
                onSignIn={() =>
                  auth?.signInWithGoogle(
                    currentAuthRedirectPath({ node: selectedId })
                  )
                }
                onAddTopicResource={handleAddTopicResource}
                onUpdateTopicResource={handleUpdateTopicResource}
                explored={exploredIds.has(entry.node.id)}
                onToggleExplored={() => handleToggleExplored(entry.node.id)}
                nextNode={nextCourseLearningPathNode(course, entry.node.id)}
                onNext={handleNext}
                pathSlug={course.slug}
                pathTitle={course.title}
              />
            ) : (
              <div className={styles.emptyComingSoon}>
                <p className={styles.emptyComingSoonTitle}>
                  {hasSyllabus
                    ? 'Select a topic'
                    : 'Curated videos coming soon'}
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
          </PathContentActivity>
        </div>
      </div>
      <div className={pathStyles.activitySection}>
        <CourseActivity
          coursePageId={courseLearningPathActivityPageId(course.slug)}
          courseTitle={course.title}
          courseUrl={`/learning-path/${course.slug}`}
          activityRefreshNonce={activityRefreshNonce}
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
