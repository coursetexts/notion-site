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
import {
  readCourseLearningPathExplored,
  writeCourseLearningPathExplored
} from '@/lib/course-learning-path-progress'
import {
  COURSE_LEARNING_PATH_KNOWLEDGE_SECTION_ID,
  COURSE_LEARNING_PATH_MENTAL_MAP_SECTION_ID,
  COURSE_LEARNING_PATH_RESOURCES_SECTION_ID,
  COURSE_LEARNING_PATH_RESOURCE_SECTIONS,
  COURSE_LEARNING_PATH_SYLLABUS_SECTION_ID,
  canonicalizeCourseLearningPathSectionId,
  getCourseLearningPathResourcesBySlug,
  isCourseLearningPathKnowledgeSelection,
  isCourseLearningPathOverviewSelection,
  isCourseLearningPathResourceSelection,
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
  flattenCourseLearningPathNodes,
  formatCourseLearningPathConceptTree,
  insertTopicResourceAtPlacement,
  mapCourseLearningPathMentalMapTopicResources,
  mapCourseLearningPathNodeTopicResources,
  moveTopicResourceToPlacement
} from '@/lib/course-learning-path-types'
import { structuralKnowledgeEdgesFromCourseLearningPath } from '@/lib/knowledge-graph'
import { learningPathCommitmentKey } from '@/lib/learning-path-commitments-db'
import { learningPathKicker } from '@/lib/learning-path-kind-ui'
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
import {
  LEARNING_PATH_MENTAL_MAP_LABEL,
  LEARNING_PATH_OVERVIEW_LABEL,
  LEARNING_PATH_OVERVIEW_SECTION_ID,
  LEARNING_PATH_START_LABEL
} from '@/lib/learning-path-sections'
import { readSearchParam, replaceSearchParams } from '@/lib/note-deep-link'
import { restoreScrollAfter } from '@/lib/restore-scroll-after'
import { addKnowledgeTopicsFromCompletedPath } from '@/lib/user-knowledge-topics-db'

import { CourseActivity } from './CourseActivity'
import { CourseHero, formatHeroPublishedDate } from './CourseHero'
import styles from './CourseLearningPath.module.css'
import { CourseLearningPathHeroActions } from './CourseLearningPathHeroActions'
import { CourseLearningPathNotes } from './CourseLearningPathNotes'
import { CourseLearningPathResources } from './CourseLearningPathResources'
import { CourseLearningPathSyllabusNav } from './CourseLearningPathSyllabusNav'
import { CourseLearningPathSyllabusOverview } from './CourseLearningPathSyllabusOverview'
import { CourseLearningPathTopicContent } from './CourseLearningPathTopicContent'
import pathStyles from './LearningPath.module.css'
import { LearningPathCommitRemindButton } from './LearningPathCommitRemindButton'
import { LearningPathFinishedModal } from './LearningPathFinishedModal'
import { LearningPathLearnedPanel } from './LearningPathLearnedPanel'
import { LearningPathOutlinePanel } from './LearningPathOutlinePanel'
import { LearningPathRatingModal } from './LearningPathRatingModal'
import { PathContentActivity } from './PathContentActivity'
import { StepNavBar } from './StepNavBar'

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

const OVERVIEW_NOTE_FALLBACK_IDS = [
  COURSE_LEARNING_PATH_MENTAL_MAP_SECTION_ID,
  LEARNING_PATH_OVERVIEW_SECTION_ID
]

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
  if (isCourseLearningPathOverviewSelection(node)) {
    return COURSE_LEARNING_PATH_SYLLABUS_SECTION_ID
  }
  if (
    isCourseLearningPathResourceSelection(node) ||
    isCourseLearningPathKnowledgeSelection(node)
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
  const [mobileOutlineOpen, setMobileOutlineOpen] = React.useState(false)
  const [isMobileOutlineLayout, setIsMobileOutlineLayout] = React.useState(false)
  const courseIdentityRef = React.useRef<string | null>(null)
  const loadedSlugRef = React.useRef<string | null>(courseProp ? slug : null)
  const [selectedId, setSelectedId] = React.useState(
    COURSE_LEARNING_PATH_SYLLABUS_SECTION_ID
  )
  const [outlineSearch, setOutlineSearch] = React.useState('')
  const [expanded, setExpanded] = React.useState<Set<string>>(() => new Set())
  const [exploredIds, setExploredIds] = React.useState<Set<string>>(
    () => new Set()
  )
  const [activityRefreshNonce, setActivityRefreshNonce] = React.useState(0)
  const [showFinishedModal, setShowFinishedModal] = React.useState(false)
  const [topicRating, setTopicRating] = React.useState<{
    id: string
    title: string
  } | null>(null)
  const [pendingFinish, setPendingFinish] = React.useState(false)
  const mainRef = React.useRef<HTMLDivElement>(null)

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
    if (!mobileOutlineOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [mobileOutlineOpen])

  React.useEffect(() => {
    const mq = window.matchMedia('(max-width: 900px)')
    const sync = () => {
      setIsMobileOutlineLayout(mq.matches)
      if (!mq.matches) setMobileOutlineOpen(false)
    }
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

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
      pathKind: 'course',
      graphEdges: structuralKnowledgeEdgesFromCourseLearningPath(course)
    })
  }, [auth?.user, course, exploredIds])

  const index = React.useMemo(
    () => (course ? buildCourseLearningPathIndex(course) : {}),
    [course]
  )

  const showingOverview = isCourseLearningPathOverviewSelection(selectedId)
  const showingResources = isCourseLearningPathResourceSelection(selectedId)
  const showingKnowledge = isCourseLearningPathKnowledgeSelection(selectedId)
  const learnedTopics = React.useMemo(
    () => (course ? knowledgeTopicItemsFromCourseLearningPath(course) : []),
    [course]
  )
  const entry =
    showingOverview || showingResources || showingKnowledge
      ? null
      : selectedId && index[selectedId]
      ? index[selectedId]
      : null
  const outlineOrder = React.useMemo(
    () => (course ? flattenCourseLearningPathNodes(course) : []),
    [course]
  )
  const topicIndex = entry
    ? outlineOrder.findIndex((node) => node.id === entry.node.id)
    : -1
  const stepTotal = outlineOrder.length + 1
  const stepCurrent = showingOverview ? 1 : topicIndex >= 0 ? topicIndex + 2 : 1
  const isLastOutlineStep =
    Boolean(entry) &&
    outlineOrder.length > 0 &&
    topicIndex === outlineOrder.length - 1
  const canStartFromOverview =
    outlineOrder.length > 0 || COURSE_LEARNING_PATH_RESOURCE_SECTIONS.length > 0

  function handleSelect(id: string) {
    const nextId = canonicalizeCourseLearningPathSectionId(id)
    setSelectedId(nextId)
    replaceSearchParams({ node: nextId })
    setExpanded((prev) => {
      const next = new Set(prev)
      next.add(nextId)
      if (isCourseLearningPathResourceSelection(nextId)) {
        next.add(COURSE_LEARNING_PATH_RESOURCES_SECTION_ID)
      }
      for (const parent of index[nextId]?.parents ?? []) next.add(parent.id)
      return next
    })
    setMobileOutlineOpen(false)
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
        setSelectedId(COURSE_LEARNING_PATH_KNOWLEDGE_SECTION_ID)
        replaceSearchParams({ node: COURSE_LEARNING_PATH_KNOWLEDGE_SECTION_ID })
        setMobileOutlineOpen(false)
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

  function goStepPrevious() {
    if (showingOverview || !course) return
    if (topicIndex > 0) {
      const prev = outlineOrder[topicIndex - 1]
      if (prev) handleNext(prev.id)
      return
    }
    handleNext(COURSE_LEARNING_PATH_SYLLABUS_SECTION_ID)
  }

  function goStepNext() {
    if (!course) return
    if (isLastOutlineStep) {
      handleSelect(COURSE_LEARNING_PATH_SYLLABUS_SECTION_ID)
      return
    }
    if (showingOverview) {
      const first = outlineOrder[0]
      if (first) {
        handleNext(first.id)
        return
      }
      const firstResource = COURSE_LEARNING_PATH_RESOURCE_SECTIONS[0]
      if (firstResource) handleSelect(firstResource.id)
      return
    }
    const next = outlineOrder[topicIndex + 1]
    if (next) handleNext(next.id)
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
            conceptTree: `${course.title} --> ${LEARNING_PATH_MENTAL_MAP_LABEL}`,
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
            conceptTree: `${course.title} --> ${LEARNING_PATH_MENTAL_MAP_LABEL}`,
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
          schoolDate={formatHeroPublishedDate(course.createdAt, {
            visibility: 'public'
          })}
          publisherAvatarFallback='coursetexts'
          publisherAvatarAlt='Coursetexts'
          actions={
            <CourseLearningPathHeroActions
              course={course}
              reportTarget={{
                type: 'learning_path',
                id: course.id || course.slug,
                url: `/learning-path/${course.slug}`,
                title: course.title
              }}
            />
          }
        />
      </div>
      <div className={pathStyles.body}>
        <div className={`${pathStyles.layout} ${pathStyles.layoutList}`}>
          <aside
            id='course-learning-path-outline-panel'
            className={`${pathStyles.mobileAside}${
              mobileOutlineOpen ? ` ${pathStyles.mobileAsideOpen}` : ''
            }`}
            aria-hidden={isMobileOutlineLayout && !mobileOutlineOpen}
          >
            <LearningPathOutlinePanel
              search={outlineSearch}
              onSearchChange={setOutlineSearch}
              searchAriaLabel='Search in outline'
              onMobileClose={
                isMobileOutlineLayout
                  ? () => setMobileOutlineOpen(false)
                  : undefined
              }
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
            />
          </aside>

          {mobileOutlineOpen ? (
            <button
              type='button'
              aria-label='Close path menu'
              onClick={() => setMobileOutlineOpen(false)}
              className={pathStyles.mobileAsideOverlay}
            />
          ) : null}

          <PathContentActivity
            className={pathStyles.detail}
            contentClassName={pathStyles.detailContent}
            contentRef={mainRef}
            viewBarLeading={
              isMobileOutlineLayout ? (
                <button
                  type='button'
                  className={pathStyles.mobilePathOpenBtn}
                  onClick={() => setMobileOutlineOpen(true)}
                  aria-expanded={mobileOutlineOpen}
                  aria-controls='course-learning-path-outline-panel'
                  aria-label='Open the path'
                >
                  <CoursePathOutlineOpenIcon />
                  <span>The Path</span>
                  <CoursePathOutlineChevronIcon />
                </button>
              ) : undefined
            }
            coursePageId={courseLearningPathActivityPageId(course.slug)}
            courseTitle={course.title}
            courseUrl={`/learning-path/${course.slug}`}
            sectionId={selectedId}
            notesTopicTitle={
              showingOverview
                ? LEARNING_PATH_OVERVIEW_LABEL
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
                fallbackNodeIds={
                  showingOverview ? OVERVIEW_NOTE_FALLBACK_IDS : undefined
                }
                topicTitle={
                  showingOverview
                    ? LEARNING_PATH_OVERVIEW_LABEL
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
            footer={
              showingKnowledge ||
              showingResources ||
              (!showingOverview && !entry) ? null : (
                <StepNavBar
                  current={stepCurrent}
                  total={Math.max(stepTotal, 1)}
                  hasPrevious={!showingOverview}
                  isLastStep={isLastOutlineStep}
                  onPrevious={goStepPrevious}
                  onNext={
                    showingOverview && !canStartFromOverview
                      ? undefined
                      : goStepNext
                  }
                  nextLabel={
                    showingOverview ? LEARNING_PATH_START_LABEL : undefined
                  }
                  explored={entry ? exploredIds.has(entry.node.id) : false}
                  onToggleExplored={
                    entry
                      ? () => handleToggleExplored(entry.node.id)
                      : undefined
                  }
                  showExplored={Boolean(entry)}
                  beforeNext={
                    showingOverview ? (
                      <LearningPathCommitRemindButton
                        targetKey={learningPathCommitmentKey(slug)}
                        signedIn={Boolean(auth?.user)}
                        onSignIn={() =>
                          auth?.signInWithGoogle(
                            currentAuthRedirectPath({ node: selectedId })
                          )
                        }
                      />
                    ) : null
                  }
                />
              )
            }
          >
            {showingKnowledge ? (
              <LearningPathLearnedPanel
                pathTitle={course.title}
                topics={learnedTopics}
                onSelectTopic={handleSelect}
              />
            ) : showingOverview ? (
              <CourseLearningPathSyllabusOverview
                course={course}
                onSelectTopic={handleSelect}
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

function CoursePathOutlineOpenIcon() {
  return (
    <span className={pathStyles.mobilePathOpenBtnIcon} aria-hidden>
      <svg
        xmlns='http://www.w3.org/2000/svg'
        width='12'
        height='12'
        viewBox='0 0 12 12'
        fill='none'
      >
        <circle cx='2.25' cy='2.25' r='0.9' fill='currentColor' />
        <circle cx='2.25' cy='6' r='0.9' fill='currentColor' />
        <circle cx='2.25' cy='9.75' r='0.9' fill='currentColor' />
        <path
          d='M4.5 2.25H10M4.5 6H10M4.5 9.75H8'
          stroke='currentColor'
          strokeWidth='1.1'
          strokeLinecap='round'
        />
      </svg>
    </span>
  )
}

function CoursePathOutlineChevronIcon() {
  return (
    <span className={pathStyles.mobilePathOpenBtnChevron} aria-hidden>
      <svg
        xmlns='http://www.w3.org/2000/svg'
        width='10'
        height='10'
        viewBox='0 0 10 10'
        fill='none'
      >
        <path
          d='M3.25 2L6.75 5L3.25 8'
          stroke='currentColor'
          strokeWidth='1.2'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
      </svg>
    </span>
  )
}

export default CourseLearningPath
