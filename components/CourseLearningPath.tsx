import * as React from 'react'

import { useAuthOptional } from '@/contexts/AuthContext'

import {
  addCourseLearningPathLink,
  addCourseLearningPathVideo,
  createLocalCourseLearningPathLink,
  createLocalCourseLearningPathVideo,
  getCourseLearningPathData,
  persistCourseLearningPathVideoOrder,
  setCourseLearningPathVideoVote
} from '@/lib/course-learning-path-db'
import {
  readCourseLearningPathExplored,
  writeCourseLearningPathExplored
} from '@/lib/course-learning-path-progress'
import {
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
  buildCourseLearningPathIndex,
  formatCourseLearningPathConceptTree,
  insertLinkAtPlacement,
  insertVideoAtPlacement,
  linkFieldForKind,
  mapCourseLearningPathMentalMapVideos,
  mapCourseLearningPathNodeLinks,
  mapCourseLearningPathNodeVideos,
  nextCourseLearningPathNode
} from '@/lib/course-learning-path-types'

import styles from './CourseLearningPath.module.css'
import { CourseLearningPathMentalMap } from './CourseLearningPathMentalMap'
import { CourseLearningPathResources } from './CourseLearningPathResources'
import { CourseLearningPathSyllabusNav } from './CourseLearningPathSyllabusNav'
import { CourseLearningPathSyllabusOverview } from './CourseLearningPathSyllabusOverview'
import { CourseLearningPathTopicContent } from './CourseLearningPathTopicContent'

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
  const [expanded, setExpanded] = React.useState<Set<string>>(() => new Set())
  const [exploredIds, setExploredIds] = React.useState<Set<string>>(
    () => new Set()
  )
  const mainRef = React.useRef<HTMLElement>(null)

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
    handleSelect(nodeId)
    window.scrollTo(0, 0)
    mainRef.current?.scrollTo(0, 0)
  }

  function handleToggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleAddVideo(input: {
    nodeId: string
    url: string
    title?: string
    description?: string
    suggestedPlacement?: number
  }): Promise<boolean> {
    if (!course) return false

    if (isMentalMapVideoNodeId(input.nodeId)) {
      const current = course.mentalMapVideos ?? []
      const local = createLocalCourseLearningPathVideo(input)
      setCourse((prev) =>
        prev
          ? mapCourseLearningPathMentalMapVideos(prev, (videos) =>
              insertVideoAtPlacement(
                videos,
                local,
                input.suggestedPlacement ?? current.length + 1
              )
            )
          : prev
      )
      return true
    }

    const entry = buildCourseLearningPathIndex(course)[input.nodeId]
    const current = entry?.node.videos ?? []
    const conceptTree = entry
      ? formatCourseLearningPathConceptTree(
          course.title,
          entry.parents,
          entry.node.title
        )
      : undefined

    if (course.dbBacked) {
      const result = await addCourseLearningPathVideo(
        { ...input, conceptTree, courseSlug: course.slug },
        current
      )
      if (!result) return false
      setCourse((prev) =>
        prev
          ? mapCourseLearningPathNodeVideos(prev, input.nodeId, () => result.ordered)
          : prev
      )
      return true
    }

    const local = createLocalCourseLearningPathVideo(input)
    setCourse((prev) =>
      prev
        ? mapCourseLearningPathNodeVideos(prev, input.nodeId, (videos) =>
            insertVideoAtPlacement(
              videos,
              local,
              input.suggestedPlacement ?? videos.length + 1
            )
          )
        : prev
    )
    return true
  }

  async function handleAddLink(input: {
    nodeId: string
    kind: 'test' | 'slide'
    url: string
    title?: string
    description?: string
    suggestedPlacement?: number
  }): Promise<boolean> {
    if (!course) return false
    const field = linkFieldForKind(input.kind)
    const entry = buildCourseLearningPathIndex(course)[input.nodeId]
    const current = entry?.node[field] ?? []
    const conceptTree = entry
      ? formatCourseLearningPathConceptTree(
          course.title,
          entry.parents,
          entry.node.title
        )
      : undefined

    if (course.dbBacked) {
      const result = await addCourseLearningPathLink(
        { ...input, conceptTree, courseSlug: course.slug },
        current
      )
      if (!result) return false
      setCourse((prev) =>
        prev
          ? mapCourseLearningPathNodeLinks(
              prev,
              input.nodeId,
              field,
              () => result.ordered
            )
          : prev
      )
      return true
    }

    const local = createLocalCourseLearningPathLink(input)
    setCourse((prev) =>
      prev
        ? mapCourseLearningPathNodeLinks(prev, input.nodeId, field, (links) =>
            insertLinkAtPlacement(
              links,
              local,
              input.suggestedPlacement ?? links.length + 1
            )
          )
        : prev
    )
    return true
  }

  async function handleVoteVideo(
    nodeId: string,
    videoId: string,
    value: 1 | -1 | null
  ) {
    if (!course) return

    if (isMentalMapVideoNodeId(nodeId)) {
      setCourse((prev) =>
        prev
          ? mapCourseLearningPathMentalMapVideos(
              prev,
              (videos) =>
                videos.map((v) => {
                  if (v.id !== videoId) return v
                  const prevVote = v.userVote ?? null
                  let score = v.score ?? 0
                  if (prevVote) score -= prevVote
                  if (value) score += value
                  return { ...v, score, userVote: value }
                }),
              { rerankByScore: true }
            )
          : prev
      )
      return
    }

    if (course.dbBacked) {
      const newScore = await setCourseLearningPathVideoVote(videoId, value)
      if (newScore === null) return
      setCourse((prev) => {
        if (!prev) return prev
        const next = mapCourseLearningPathNodeVideos(
          prev,
          nodeId,
          (videos) =>
            videos.map((v) =>
              v.id === videoId ? { ...v, score: newScore, userVote: value } : v
            ),
          { rerankByScore: true }
        )
        const ordered = buildCourseLearningPathIndex(next)[nodeId]?.node.videos ?? []
        void persistCourseLearningPathVideoOrder(ordered)
        return next
      })
      return
    }

    // Local / seed: apply vote delta client-side and re-rank by score.
    setCourse((prev) =>
      prev
        ? mapCourseLearningPathNodeVideos(
            prev,
            nodeId,
            (videos) =>
              videos.map((v) => {
                if (v.id !== videoId) return v
                const prevVote = v.userVote ?? null
                let score = v.score ?? 0
                if (prevVote) score -= prevVote
                if (value) score += value
                return { ...v, score, userVote: value }
              }),
            { rerankByScore: true }
          )
        : prev
    )
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

  return (
    <div className={styles.root}>
      <header className={styles.topBar}>
        <button
          type='button'
          onClick={() => setMobileNavOpen((v) => !v)}
          className={styles.menuBtn}
          aria-label={mobileNavOpen ? 'Close syllabus' : 'Open syllabus'}
        >
          {mobileNavOpen ? <CloseIcon /> : <MenuIcon />}
        </button>
      </header>

      <div className={styles.body}>
        <aside
          className={`${styles.aside}${
            mobileNavOpen ? ` ${styles.asideOpen}` : ''
          }`}
        >
          <div className={styles.asideInner}>
            <CourseLearningPathSyllabusNav
              course={course}
              selectedId={selectedId}
              expanded={expanded}
              exploredIds={exploredIds}
              onSelect={handleSelect}
              onToggle={handleToggle}
            />
          </div>
        </aside>

        {mobileNavOpen && (
          <button
            type='button'
            aria-label='Close syllabus'
            onClick={() => setMobileNavOpen(false)}
            className={styles.overlay}
          />
        )}

        <main ref={mainRef} className={styles.main}>
          {showingSyllabus ? (
            <CourseLearningPathSyllabusOverview
              course={course}
              onSelectTopic={handleSelect}
            />
          ) : showingMentalMap ? (
            <CourseLearningPathMentalMap
              course={course}
              exploredIds={exploredIds}
              onSelect={handleSelect}
              videos={course.mentalMapVideos}
              dbBacked={false}
              signedIn={Boolean(auth?.user)}
              onSignIn={() => auth?.signInWithGoogle()}
              onAddVideo={handleAddVideo}
              onVoteVideo={handleVoteVideo}
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
              onAddVideo={handleAddVideo}
              onVoteVideo={handleVoteVideo}
              onAddLink={handleAddLink}
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
