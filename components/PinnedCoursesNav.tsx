import * as React from 'react'
import Link from 'next/link'

import {
  getMyBookmarks,
  removeBookmark
} from '@/lib/course-activity-db'
import {
  type PinnedCourseLearningPath,
  courseLearningPathHref,
  listMyCourseLearningPathPins,
  setCourseLearningPathPinned,
  subscribeCourseLearningPathPins
} from '@/lib/course-learning-path-pins-db'
import {
  attachLearningPathKinds,
  listOwnedLearningPaths
} from '@/lib/learning-path-db'
import {
  learningPathsFromUserLinks,
  mergeOwnedAndSavedLearningPaths
} from '@/lib/learning-path-bookmark-link'
import { getMyLinks } from '@/lib/user-links'
import { readStoredLearningPaths } from '@/lib/learning-path-seed'

import { PinIcon } from './PinIcon'
import styles from './PinnedCoursesNav.module.css'

type PinNavKind = 'official' | 'course' | 'research' | 'community'

type PinNavItem = {
  id: string
  title: string
  href: string
  unpinKey?: string
}

const PIN_NAV_OPTIONS: { id: PinNavKind; label: string; empty: string }[] = [
  {
    id: 'official',
    label: 'Official Courses',
    empty: 'Save a course from its page to see it here.'
  },
  {
    id: 'course',
    label: 'Course Learning Paths',
    empty: 'Pin a course learning path from its syllabus to see it here.'
  },
  {
    id: 'research',
    label: 'Research Learning Paths',
    empty: 'Start a research learning path from the Field Atlas to see it here.'
  },
  {
    id: 'community',
    label: 'Community Learning Paths',
    empty: 'Create a community learning path to see it here.'
  }
]

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`${styles.kindChevron}${open ? ` ${styles.kindChevronOpen}` : ''}`}
      width='10'
      height='10'
      viewBox='0 0 12 12'
      fill='none'
      aria-hidden
    >
      <path
        d='M2.25 4.125L6 7.875L9.75 4.125'
        stroke='currentColor'
        strokeWidth='1.25'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

export function PinnedCoursesNav() {
  const [open, setOpen] = React.useState(false)
  const [kindOpen, setKindOpen] = React.useState(false)
  const [kind, setKind] = React.useState<PinNavKind>('course')
  const [coursePins, setCoursePins] = React.useState<
    PinnedCourseLearningPath[]
  >([])
  const [officialCourses, setOfficialCourses] = React.useState<PinNavItem[]>(
    []
  )
  const [communityPaths, setCommunityPaths] = React.useState<PinNavItem[]>([])
  const [researchPaths, setResearchPaths] = React.useState<PinNavItem[]>([])
  const [loading, setLoading] = React.useState(true)
  const rootRef = React.useRef<HTMLDivElement>(null)

  const refresh = React.useCallback(async () => {
    const [pins, bookmarks, owned, links] = await Promise.all([
      listMyCourseLearningPathPins(),
      getMyBookmarks(),
      listOwnedLearningPaths(),
      getMyLinks()
    ])
    setCoursePins(pins)
    setOfficialCourses(
      bookmarks.map(({ course }) => ({
        id: course.notion_page_id,
        title: course.name,
        href: course.url ?? `/course/${course.notion_page_id}`,
        unpinKey: course.notion_page_id
      }))
    )
    const merged = await attachLearningPathKinds(
      mergeOwnedAndSavedLearningPaths({
        owned,
        stored: readStoredLearningPaths(),
        saved: learningPathsFromUserLinks(links)
      })
    )
    const toNavItem = (item: (typeof merged)[number]): PinNavItem => ({
      id: item.id,
      title: item.goal,
      href: `/learning-path/${item.slug}`
    })
    setCommunityPaths(
      merged.filter((item) => item.kind !== 'research').map(toNavItem)
    )
    setResearchPaths(
      merged.filter((item) => item.kind === 'research').map(toNavItem)
    )
    setLoading(false)
  }, [])

  React.useEffect(() => {
    void refresh()
    return subscribeCourseLearningPathPins(() => {
      void refresh()
    })
  }, [refresh])

  React.useEffect(() => {
    if (!open) {
      setKindOpen(false)
      return
    }
    void refresh()
    const onPointer = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (kindOpen) setKindOpen(false)
        else setOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointer)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      window.removeEventListener('keydown', onKey)
    }
  }, [open, refresh, kindOpen])

  const selected = PIN_NAV_OPTIONS.find((option) => option.id === kind)
  const title = selected ? `Pinned ${selected.label}` : 'Pinned'
  const items: PinNavItem[] =
    kind === 'official'
      ? officialCourses
      : kind === 'course'
        ? coursePins.map((pin) => ({
            id: pin.pinId,
            title: pin.title,
            href: courseLearningPathHref(pin.slug),
            unpinKey: pin.courseId
          }))
        : kind === 'community'
          ? communityPaths
          : kind === 'research'
            ? researchPaths
            : []

  async function unpin(item: PinNavItem) {
    if (!item.unpinKey) return
    if (kind === 'course') {
      const previous = coursePins
      setCoursePins((rows) =>
        rows.filter((row) => row.courseId !== item.unpinKey)
      )
      const result = await setCourseLearningPathPinned(item.unpinKey, false)
      if (result === null) setCoursePins(previous)
      return
    }
    if (kind === 'official') {
      const previous = officialCourses
      setOfficialCourses((rows) =>
        rows.filter((row) => row.unpinKey !== item.unpinKey)
      )
      const ok = await removeBookmark(item.unpinKey)
      if (!ok) setOfficialCourses(previous)
    }
  }

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        type='button'
        className={`${styles.trigger}${open ? ` ${styles.triggerOpen}` : ''}`}
        aria-label='Pinned learning'
        aria-expanded={open}
        aria-haspopup='menu'
        onClick={() => setOpen((v) => !v)}
      >
        <PinIcon filled size={18} />
      </button>
      {open && (
        <div
          className={styles.menu}
          role='menu'
          aria-label={title}
        >
          <div className={styles.kindSelect}>
            <button
              type='button'
              className={styles.menuLabelBtn}
              aria-haspopup='listbox'
              aria-expanded={kindOpen}
              onClick={() => setKindOpen((v) => !v)}
            >
              <span>{title}</span>
              <ChevronIcon open={kindOpen} />
            </button>
            {kindOpen ? (
              <ul className={styles.kindMenu} role='listbox'>
                {PIN_NAV_OPTIONS.map((option) => (
                  <li key={option.id} role='presentation'>
                    <button
                      type='button'
                      role='option'
                      aria-selected={kind === option.id}
                      className={
                        kind === option.id
                          ? `${styles.kindOption} ${styles.kindOptionSelected}`
                          : styles.kindOption
                      }
                      onClick={() => {
                        setKind(option.id)
                        setKindOpen(false)
                      }}
                    >
                      {option.label}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          {loading ? (
            <p className={styles.empty}>Loading…</p>
          ) : items.length === 0 ? (
            <p className={styles.empty}>{selected?.empty}</p>
          ) : (
            <ul className={styles.list}>
              {items.map((item) => (
                <li key={item.id} className={styles.row}>
                  <Link href={item.href} legacyBehavior>
                    <a
                      className={styles.courseLink}
                      role='menuitem'
                      onClick={() => setOpen(false)}
                    >
                      {item.title}
                    </a>
                  </Link>
                  {item.unpinKey ? (
                    <button
                      type='button'
                      className={styles.rowPin}
                      aria-label={`Unpin ${item.title}`}
                      onClick={() => void unpin(item)}
                    >
                      <PinIcon filled size={14} />
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
