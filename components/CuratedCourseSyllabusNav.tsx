import * as React from 'react'

import { useAuthOptional } from '@/contexts/AuthContext'

import {
  isCuratedCoursePinId,
  isCuratedCoursePinned,
  setCuratedCoursePinned,
  subscribeCuratedCoursePins
} from '@/lib/curated-course-pins-db'
import {
  CURATED_COURSE_MENTAL_MAP_SECTION_ID,
  CURATED_COURSE_RESOURCES_SECTION_ID,
  CURATED_COURSE_RESOURCE_SECTIONS,
  CURATED_COURSE_SYLLABUS_SECTION_ID,
  type CuratedCourseResourceSection,
  isCuratedCourseMentalMapSelection,
  isCuratedCourseResourceSelection,
  isCuratedCourseSyllabusSelection,
  resourcesForSection
} from '@/lib/curated-course-resources'
import type {
  CuratedCourseData,
  CuratedCourseNode
} from '@/lib/curated-course-types'

import styles from './CuratedCourse.module.css'
import { PinIcon } from './PinIcon'

interface SyllabusNavProps {
  course: CuratedCourseData
  selectedId: string
  expanded: Set<string>
  onSelect: (id: string) => void
  onToggle: (id: string) => void
}

export function CuratedCourseSyllabusNav({
  course,
  selectedId,
  expanded,
  onSelect,
  onToggle
}: SyllabusNavProps) {
  const auth = useAuthOptional()
  const signedIn = Boolean(auth?.user)
  const canPin = Boolean(course.dbBacked && isCuratedCoursePinId(course.id))
  const [pinned, setPinned] = React.useState(false)
  const [pinBusy, setPinBusy] = React.useState(false)

  React.useEffect(() => {
    if (!canPin || !signedIn) {
      setPinned(false)
      return
    }
    let alive = true
    void isCuratedCoursePinned(course.id).then((value) => {
      if (alive) setPinned(value)
    })
    const unsub = subscribeCuratedCoursePins(() => {
      void isCuratedCoursePinned(course.id).then((value) => {
        if (alive) setPinned(value)
      })
    })
    return () => {
      alive = false
      unsub()
    }
  }, [canPin, signedIn, course.id])

  async function handleTogglePin() {
    if (!canPin) return
    if (!signedIn) {
      auth?.signInWithGoogle()
      return
    }
    if (pinBusy) return
    const next = !pinned
    setPinBusy(true)
    setPinned(next)
    const result = await setCuratedCoursePinned(course.id, next)
    if (result === null) setPinned(!next)
    setPinBusy(false)
  }

  const resourcesOpen = expanded.has(CURATED_COURSE_RESOURCES_SECTION_ID)
  const resourceSelected = isCuratedCourseResourceSelection(selectedId)
  const syllabusSelected = isCuratedCourseSyllabusSelection(selectedId)
  const mentalMapSelected = isCuratedCourseMentalMapSelection(selectedId)

  return (
    <nav aria-label='Course syllabus' className={styles.nav}>
      <div>
        <p className={styles.navLabel}>Course</p>
        <div className={styles.navCourseTitleRow}>
          <h2 className={styles.navCourseTitle}>{course.title}</h2>
          {canPin && (
            <button
              type='button'
              className={`${styles.navPinBtn}${
                pinned ? ` ${styles.navPinBtnPinned}` : ''
              }`}
              onClick={() => void handleTogglePin()}
              disabled={pinBusy}
              aria-pressed={pinned}
              aria-label={
                pinned
                  ? `Unpin ${course.title}`
                  : signedIn
                  ? `Pin ${course.title}`
                  : `Sign in to pin ${course.title}`
              }
              title={
                pinned
                  ? 'Unpin course'
                  : signedIn
                  ? 'Pin course'
                  : 'Sign in to pin this course'
              }
            >
              <PinIcon filled={pinned} size={16} />
            </button>
          )}
        </div>
      </div>

      <div className={styles.navPanelSection}>
        <div
          className={`${styles.navRow}${
            syllabusSelected ? ` ${styles.navRowSelected}` : ''
          }`}
          style={{ paddingLeft: 4 }}
        >
          <span className={styles.leafDot} aria-hidden>
            <span className={styles.dot} />
          </span>
          <button
            type='button'
            onClick={() => onSelect(CURATED_COURSE_SYLLABUS_SECTION_ID)}
            aria-current={syllabusSelected ? 'true' : undefined}
            className={styles.navSelect}
          >
            <span
              className={`${styles.navTitle} ${styles.navTitleTopic}${
                syllabusSelected ? ` ${styles.navTitleSelected}` : ''
              }`}
            >
              Recommended Syllabus
            </span>
            {course.topics.length > 0 ? (
              <span className={styles.videoCount}>{course.topics.length}</span>
            ) : null}
          </button>
        </div>

        <div
          className={`${styles.navRow}${
            mentalMapSelected ? ` ${styles.navRowSelected}` : ''
          }`}
          style={{ paddingLeft: 4 }}
        >
          <span className={styles.leafDot} aria-hidden>
            <span className={styles.dot} />
          </span>
          <button
            type='button'
            onClick={() => onSelect(CURATED_COURSE_MENTAL_MAP_SECTION_ID)}
            aria-current={mentalMapSelected ? 'true' : undefined}
            className={styles.navSelect}
          >
            <span
              className={`${styles.navTitle} ${styles.navTitleTopic}${
                mentalMapSelected ? ` ${styles.navTitleSelected}` : ''
              }`}
            >
              Mental Map
            </span>
          </button>
        </div>

        {course.topics.length > 0 ? (
          <ol className={styles.navList}>
            {course.topics.map((topic, i) => (
              <NavItem
                key={topic.id}
                node={topic}
                index={i + 1}
                depth={0}
                selectedId={selectedId}
                expanded={expanded}
                onSelect={onSelect}
                onToggle={onToggle}
              />
            ))}
          </ol>
        ) : (
          <p className={styles.navSyllabusEmpty}>
            Syllabus topics coming soon.
          </p>
        )}
      </div>

      <div className={styles.navPanelSection}>
        <div
          className={`${styles.navRow}${
            resourceSelected ? ` ${styles.navRowSelected}` : ''
          }`}
          style={{ paddingLeft: 4 }}
        >
          <button
            type='button'
            onClick={() => onToggle(CURATED_COURSE_RESOURCES_SECTION_ID)}
            aria-label={
              resourcesOpen ? 'Collapse Resources' : 'Expand Resources'
            }
            aria-expanded={resourcesOpen}
            className={styles.chevronBtn}
          >
            <ChevronIcon
              className={`${styles.chevronIcon}${
                resourcesOpen ? ` ${styles.chevronOpen}` : ''
              }`}
            />
          </button>
          <button
            type='button'
            onClick={() => {
              if (!resourcesOpen) onToggle(CURATED_COURSE_RESOURCES_SECTION_ID)
              const first = CURATED_COURSE_RESOURCE_SECTIONS[0]
              onSelect(first.id)
            }}
            className={styles.navSelect}
          >
            <span
              className={`${styles.navTitle} ${styles.navTitleTopic}${
                resourceSelected ? ` ${styles.navTitleSelected}` : ''
              }`}
            >
              Resources
            </span>
            {(course.resources?.length ?? 0) > 0 ? (
              <span className={styles.videoCount}>
                {course.resources!.length}
              </span>
            ) : null}
          </button>
        </div>

        {resourcesOpen ? (
          <ol className={styles.navList}>
            {CURATED_COURSE_RESOURCE_SECTIONS.map((section) => (
              <ResourceNavItem
                key={section.id}
                section={section}
                count={
                  resourcesForSection(course.resources, section.kind).length
                }
                selectedId={selectedId}
                onSelect={onSelect}
              />
            ))}
          </ol>
        ) : null}
      </div>
    </nav>
  )
}

function ResourceNavItem({
  section,
  count,
  selectedId,
  onSelect
}: {
  section: CuratedCourseResourceSection
  count: number
  selectedId: string
  onSelect: (id: string) => void
}) {
  const isSelected = selectedId === section.id

  return (
    <li>
      <div
        className={`${styles.navRow}${
          isSelected ? ` ${styles.navRowSelected}` : ''
        }`}
        style={{ paddingLeft: 18 }}
      >
        <span className={styles.leafDot} aria-hidden>
          <span className={styles.dot} />
        </span>
        <button
          type='button'
          onClick={() => onSelect(section.id)}
          aria-current={isSelected ? 'true' : undefined}
          className={styles.navSelect}
        >
          <span
            className={`${styles.navTitle}${
              isSelected ? ` ${styles.navTitleSelected}` : ''
            }`}
          >
            {section.label}
          </span>
          {count > 0 ? (
            <span className={styles.videoCount}>{count}</span>
          ) : null}
        </button>
      </div>
    </li>
  )
}

interface NavItemProps {
  node: CuratedCourseNode
  index: number
  depth: number
  selectedId: string
  expanded: Set<string>
  onSelect: (id: string) => void
  onToggle: (id: string) => void
}

function NavItem({
  node,
  index,
  depth,
  selectedId,
  expanded,
  onSelect,
  onToggle
}: NavItemProps) {
  const hasChildren = Boolean(node.children?.length)
  const isOpen = expanded.has(node.id)
  const isSelected = selectedId === node.id
  const videoCount = node.videos?.length ?? 0

  return (
    <li>
      <div
        className={`${styles.navRow}${
          isSelected ? ` ${styles.navRowSelected}` : ''
        }`}
        style={{ paddingLeft: depth === 0 ? 4 : depth * 14 + 4 }}
      >
        {hasChildren ? (
          <button
            type='button'
            onClick={() => onToggle(node.id)}
            aria-label={
              isOpen ? `Collapse ${node.title}` : `Expand ${node.title}`
            }
            aria-expanded={isOpen}
            className={styles.chevronBtn}
          >
            <ChevronIcon
              className={`${styles.chevronIcon}${
                isOpen ? ` ${styles.chevronOpen}` : ''
              }`}
            />
          </button>
        ) : (
          <span className={styles.leafDot} aria-hidden>
            <span className={styles.dot} />
          </span>
        )}

        <button
          type='button'
          onClick={() => onSelect(node.id)}
          aria-current={isSelected ? 'true' : undefined}
          className={styles.navSelect}
        >
          <span
            className={[
              styles.navTitle,
              depth === 0 ? styles.navTitleTopic : '',
              depth >= 2 ? styles.navTitleConcept : '',
              isSelected ? styles.navTitleSelected : ''
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {depth === 0 && <span className={styles.navIndex}>{index}.</span>}
            {node.title}
          </span>
          {videoCount > 0 && (
            <span className={styles.videoCount}>
              <PlayIcon size={12} />
              {videoCount}
            </span>
          )}
        </button>
      </div>

      {hasChildren && isOpen && (
        <ol className={styles.navList}>
          {node.children!.map((child, i) => (
            <NavItem
              key={child.id}
              node={child}
              index={i + 1}
              depth={depth + 1}
              selectedId={selectedId}
              expanded={expanded}
              onSelect={onSelect}
              onToggle={onToggle}
            />
          ))}
        </ol>
      )}
    </li>
  )
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 16 16'
      fill='none'
      aria-hidden
    >
      <path
        d='M6 3.5L10.5 8L6 12.5'
        stroke='currentColor'
        strokeWidth='1.4'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

export function PlayIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width={size}
      height={size}
      viewBox='0 0 16 16'
      fill='none'
      aria-hidden
    >
      <circle cx='8' cy='8' r='6.25' stroke='currentColor' strokeWidth='1.2' />
      <path d='M6.75 5.5L11 8L6.75 10.5V5.5Z' fill='currentColor' />
    </svg>
  )
}
