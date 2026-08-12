import * as React from 'react'

import styles from './CuratedCourse.module.css'
import { CuratedCourseResources } from './CuratedCourseResources'
import { CuratedCourseSyllabusNav } from './CuratedCourseSyllabusNav'
import { CuratedCourseSyllabusOverview } from './CuratedCourseSyllabusOverview'
import { CuratedCourseTopicContent } from './CuratedCourseTopicContent'
import { useAuthOptional } from '@/contexts/AuthContext'
import {
  addCuratedCourseVideo,
  createLocalCuratedCourseVideo,
  getCuratedCourseData,
  persistCuratedCourseVideoOrder,
  setCuratedCourseVideoVote
} from '@/lib/curated-course-db'
import {
  CURATED_COURSE_RESOURCES_SECTION_ID,
  CURATED_COURSE_SYLLABUS_SECTION_ID,
  getCuratedCourseResourcesBySlug,
  isCuratedCourseResourceSelection,
  isCuratedCourseSyllabusSelection
} from '@/lib/curated-course-resources'
import {
  DEFAULT_CURATED_COURSE_SLUG,
  fluidMechanicsSeedCourse
} from '@/lib/curated-course-seed'
import {
  buildCuratedCourseIndex,
  insertVideoAtPlacement,
  mapCuratedCourseNodeVideos,
  type CuratedCourseData
} from '@/lib/curated-course-types'

export interface CuratedCourseProps {
  /** Syllabus course slug in Supabase. Falls back to seed data when missing. */
  slug?: string
  /** Optional preloaded course (skips fetch). */
  course?: CuratedCourseData
}

function withCurriculumResources(
  course: CuratedCourseData,
  slug: string
): CuratedCourseData {
  if (course.resources?.length) return course
  const resources = getCuratedCourseResourcesBySlug(slug || course.slug)
  if (!resources.length) return course
  return { ...course, resources }
}

/**
 * Syllabus navigator + curated video library for a course.
 * Loads from Supabase `curated_*` tables; uses local seed when empty.
 */
export function CuratedCourse({
  slug = DEFAULT_CURATED_COURSE_SLUG,
  course: courseProp
}: CuratedCourseProps) {
  const auth = useAuthOptional()
  const [course, setCourse] = React.useState<CuratedCourseData | null>(() =>
    courseProp ? withCurriculumResources(courseProp, slug) : null
  )
  const [loading, setLoading] = React.useState(!courseProp)
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false)
  const courseIdentityRef = React.useRef<string | null>(
    courseProp ? `${courseProp.id}:${slug}` : null
  )
  const loadedSlugRef = React.useRef<string | null>(
    courseProp ? slug : null
  )
  const [selectedId, setSelectedId] = React.useState(
    CURATED_COURSE_SYLLABUS_SECTION_ID
  )
  const [expanded, setExpanded] = React.useState<Set<string>>(
    () => new Set()
  )

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
      const fromDb = await getCuratedCourseData(slug)
      if (cancelled) return

      if (fromDb) {
        // Prefer DB row even with an empty syllabus (placeholder curated courses).
        // Fluid Mechanics keeps local seed only when the DB course has no topics yet.
        if (
          fromDb.topics.length === 0 &&
          slug === DEFAULT_CURATED_COURSE_SLUG
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
      } else if (slug === DEFAULT_CURATED_COURSE_SLUG) {
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
    setSelectedId(CURATED_COURSE_SYLLABUS_SECTION_ID)
    setExpanded(new Set())
  }, [course, slug])

  const index = React.useMemo(
    () => (course ? buildCuratedCourseIndex(course) : {}),
    [course]
  )

  const showingSyllabus = isCuratedCourseSyllabusSelection(selectedId)
  const showingResources = isCuratedCourseResourceSelection(selectedId)
  const entry =
    showingSyllabus || showingResources
      ? null
      : selectedId && index[selectedId]
        ? index[selectedId]
        : null

  function handleSelect(id: string) {
    setSelectedId(id)
    setExpanded((prev) => {
      const next = new Set(prev)
      next.add(id)
      if (isCuratedCourseResourceSelection(id)) {
        next.add(CURATED_COURSE_RESOURCES_SECTION_ID)
      }
      for (const parent of index[id]?.parents ?? []) next.add(parent.id)
      return next
    })
    setMobileNavOpen(false)
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
    suggestedPlacement?: number
  }): Promise<boolean> {
    if (!course) return false
    const current =
      buildCuratedCourseIndex(course)[input.nodeId]?.node.videos ?? []

    if (course.dbBacked) {
      const result = await addCuratedCourseVideo(input, current)
      if (!result) return false
      setCourse((prev) =>
        prev
          ? mapCuratedCourseNodeVideos(prev, input.nodeId, () => result.ordered)
          : prev
      )
      return true
    }

    const local = createLocalCuratedCourseVideo(input)
    setCourse((prev) =>
      prev
        ? mapCuratedCourseNodeVideos(prev, input.nodeId, (videos) =>
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

  async function handleVoteVideo(
    nodeId: string,
    videoId: string,
    value: 1 | -1 | null
  ) {
    if (!course) return

    if (course.dbBacked) {
      const newScore = await setCuratedCourseVideoVote(videoId, value)
      if (newScore === null) return
      setCourse((prev) => {
        if (!prev) return prev
        const next = mapCuratedCourseNodeVideos(
          prev,
          nodeId,
          (videos) =>
            videos.map((v) =>
              v.id === videoId
                ? { ...v, score: newScore, userVote: value }
                : v
            ),
          { rerankByScore: true }
        )
        const ordered =
          buildCuratedCourseIndex(next)[nodeId]?.node.videos ?? []
        void persistCuratedCourseVideoOrder(ordered)
        return next
      })
      return
    }

    // Local / seed: apply vote delta client-side and re-rank by score.
    setCourse((prev) =>
      prev
        ? mapCuratedCourseNodeVideos(
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
        No curated course found for “{slug}”. Seed curated_courses or check
        the slug.
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
        <div style={{ minWidth: 0 }}>
          <p className={styles.topBarTitle}>{course.title}</p>
          <p className={styles.topBarSub}>
            Syllabus &amp; curated video library
          </p>
        </div>
      </header>

      <div className={styles.body}>
        <aside
          className={`${styles.aside}${
            mobileNavOpen ? ` ${styles.asideOpen}` : ''
          }`}
        >
          <div className={styles.asideInner}>
            <CuratedCourseSyllabusNav
              course={course}
              selectedId={selectedId}
              expanded={expanded}
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

        <main className={styles.main}>
          {showingSyllabus ? (
            <CuratedCourseSyllabusOverview
              course={course}
              onSelectTopic={handleSelect}
            />
          ) : showingResources ? (
            <CuratedCourseResources
              selectedId={selectedId}
              resources={course.resources}
              courseTitle={course.title}
            />
          ) : entry ? (
            <CuratedCourseTopicContent
              entry={entry}
              onSelect={handleSelect}
              courseTitle={course.title}
              courseDescription={course.description}
              courseSlug={course.slug}
              dbBacked={Boolean(course.dbBacked)}
              signedIn={Boolean(auth?.user)}
              onSignIn={() => auth?.signInWithGoogle()}
              onAddVideo={handleAddVideo}
              onVoteVideo={handleVoteVideo}
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

export default CuratedCourse
