import * as React from 'react'
import Link from 'next/link'

import { getMyBookmarks } from '@/lib/course-activity-db'
import {
  type PinnedCourseLearningPath,
  courseLearningPathHref,
  listMyCourseLearningPathPins,
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
import { isCourseKindPath } from '@/lib/learning-path-kind-ui'
import {
  hasSeededNavPins,
  learningPathNavPinKey,
  listMyNavPins,
  markNavPinsSeeded,
  officialCourseNavPinKey,
  setNavPinned,
  subscribeNavPins
} from '@/lib/nav-pins-db'
import { getMyLinks } from '@/lib/user-links'
import { readStoredLearningPaths } from '@/lib/learning-path-seed'

import { PinIcon } from './PinIcon'
import styles from './PinnedCoursesNav.module.css'

type PinNavTab = 'courses' | 'learning-paths'

type PinNavItem = {
  id: string
  title: string
  href: string
  pinKey: string
}

const PIN_NAV_TABS: {
  id: PinNavTab
  label: string
  empty: string
}[] = [
  {
    id: 'courses',
    label: 'Saved courses',
    empty: 'Save a course from its page to see it here.'
  },
  {
    id: 'learning-paths',
    label: 'Learning paths',
    empty: 'Create or save a learning path to see it here.'
  }
]

function sortSavedWithPins(
  items: PinNavItem[],
  pinKeys: string[]
): PinNavItem[] {
  const index = new Map(pinKeys.map((key, i) => [key, i]))
  const pinned = items
    .filter((item) => index.has(item.pinKey))
    .sort(
      (a, b) => (index.get(a.pinKey) ?? 0) - (index.get(b.pinKey) ?? 0)
    )
  const rest = items.filter((item) => !index.has(item.pinKey))
  return [...pinned, ...rest]
}

export function PinnedCoursesNav() {
  const [open, setOpen] = React.useState(false)
  const [tab, setTab] = React.useState<PinNavTab>('courses')
  const [coursePins, setCoursePins] = React.useState<
    PinnedCourseLearningPath[]
  >([])
  const [officialCourses, setOfficialCourses] = React.useState<PinNavItem[]>(
    []
  )
  const [courseKindPaths, setCourseKindPaths] = React.useState<PinNavItem[]>(
    []
  )
  const [communityPaths, setCommunityPaths] = React.useState<PinNavItem[]>([])
  const [researchPaths, setResearchPaths] = React.useState<PinNavItem[]>([])
  const [pinKeys, setPinKeys] = React.useState<string[]>([])
  const [loading, setLoading] = React.useState(true)
  const rootRef = React.useRef<HTMLDivElement>(null)

  const refresh = React.useCallback(async () => {
    const [pins, bookmarks, owned, links, storedPinKeys] = await Promise.all([
      listMyCourseLearningPathPins(),
      getMyBookmarks(),
      listOwnedLearningPaths(),
      getMyLinks(),
      listMyNavPins()
    ])
    let nextPinKeys = storedPinKeys
    if (!hasSeededNavPins()) {
      markNavPinsSeeded()
      const seeded = pins.map((pin) => learningPathNavPinKey(pin.slug))
      for (const key of seeded) {
        if (nextPinKeys.includes(key)) continue
        await setNavPinned(key, true, { notify: false })
        nextPinKeys = [key, ...nextPinKeys.filter((item) => item !== key)]
      }
    }
    setPinKeys(nextPinKeys)
    setCoursePins(pins)
    setOfficialCourses(
      bookmarks.map(({ course }) => ({
        id: course.notion_page_id,
        title: course.name,
        href: course.url ?? `/course/${course.notion_page_id}`,
        pinKey: officialCourseNavPinKey(course.notion_page_id)
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
      href: `/learning-path/${item.slug}`,
      pinKey: learningPathNavPinKey(item.slug)
    })
    const pinSlugs = new Set(pins.map((pin) => pin.slug))
    setCourseKindPaths(
      merged
        .filter(
          (item) =>
            isCourseKindPath(item.kind) && !pinSlugs.has(item.slug)
        )
        .map(toNavItem)
    )
    setCommunityPaths(
      merged
        .filter(
          (item) =>
            item.kind !== 'research' && !isCourseKindPath(item.kind)
        )
        .map(toNavItem)
    )
    setResearchPaths(
      merged.filter((item) => item.kind === 'research').map(toNavItem)
    )
    setLoading(false)
  }, [])

  React.useEffect(() => {
    void refresh()
    const unsubCourse = subscribeCourseLearningPathPins(() => {
      void refresh()
    })
    const unsubNav = subscribeNavPins(() => {
      void refresh()
    })
    return () => {
      unsubCourse()
      unsubNav()
    }
  }, [refresh])

  React.useEffect(() => {
    if (!open) return
    void refresh()
    const onPointer = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      window.removeEventListener('keydown', onKey)
    }
  }, [open, refresh])

  const selected = PIN_NAV_TABS.find((option) => option.id === tab)
  const pinKeySet = React.useMemo(() => new Set(pinKeys), [pinKeys])
  const items: PinNavItem[] = sortSavedWithPins(
    tab === 'courses'
      ? [
          ...officialCourses,
          ...coursePins.map((pin) => ({
            id: pin.pinId,
            title: pin.title,
            href: courseLearningPathHref(pin.slug),
            pinKey: learningPathNavPinKey(pin.slug)
          })),
          ...courseKindPaths
        ]
      : [...communityPaths, ...researchPaths],
    pinKeys
  )

  async function togglePinned(item: PinNavItem) {
    const next = !pinKeySet.has(item.pinKey)
    const previous = pinKeys
    setPinKeys((keys) =>
      next
        ? [item.pinKey, ...keys.filter((key) => key !== item.pinKey)]
        : keys.filter((key) => key !== item.pinKey)
    )
    const ok = await setNavPinned(item.pinKey, next)
    if (!ok) setPinKeys(previous)
  }

  function onTabKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
    event.preventDefault()
    const next: PinNavTab =
      tab === 'courses' ? 'learning-paths' : 'courses'
    setTab(next)
    const nextId =
      next === 'courses' ? 'pinned-tab-courses' : 'pinned-tab-paths'
    document.getElementById(nextId)?.focus()
  }

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        type='button'
        className={`${styles.trigger}${open ? ` ${styles.triggerOpen}` : ''}`}
        aria-label='Pinned learning'
        aria-expanded={open}
        aria-haspopup='dialog'
        onClick={() => setOpen((v) => !v)}
      >
        <PinIcon filled size={18} />
      </button>
      {open && (
        <div
          className={styles.menu}
          role='dialog'
          aria-label='Saved items'
        >
          <div className={styles.tabs} role='tablist' aria-label='Saved items'>
            {PIN_NAV_TABS.map((option, index) => (
              <React.Fragment key={option.id}>
                {index > 0 ? (
                  <span className={styles.tabPipe} aria-hidden>
                    |
                  </span>
                ) : null}
                <button
                  type='button'
                  role='tab'
                  id={
                    option.id === 'courses'
                      ? 'pinned-tab-courses'
                      : 'pinned-tab-paths'
                  }
                  aria-selected={tab === option.id}
                  aria-controls='pinned-nav-panel'
                  className={
                    tab === option.id
                      ? `${styles.tab} ${styles.tabActive}`
                      : styles.tab
                  }
                  tabIndex={tab === option.id ? 0 : -1}
                  onClick={() => setTab(option.id)}
                  onKeyDown={onTabKeyDown}
                >
                  {option.label}
                </button>
              </React.Fragment>
            ))}
          </div>
          <div
            id='pinned-nav-panel'
            role='tabpanel'
            aria-labelledby={
              tab === 'courses'
                ? 'pinned-tab-courses'
                : 'pinned-tab-paths'
            }
          >
            {loading ? (
              <p className={styles.empty}>Loading…</p>
            ) : items.length === 0 ? (
              <p className={styles.empty}>{selected?.empty}</p>
            ) : (
              <ul className={styles.list}>
                {items.map((item) => {
                  const pinned = pinKeySet.has(item.pinKey)
                  return (
                    <li
                      key={item.id}
                      className={
                        pinned
                          ? `${styles.row} ${styles.rowPinned}`
                          : styles.row
                      }
                    >
                      <Link href={item.href} legacyBehavior>
                        <a
                          className={styles.courseLink}
                          onClick={() => setOpen(false)}
                        >
                          {item.title}
                        </a>
                      </Link>
                      <button
                        type='button'
                        className={styles.rowPin}
                        aria-label={
                          pinned
                            ? `Unpin ${item.title}`
                            : `Pin ${item.title} to top`
                        }
                        onClick={() => void togglePinned(item)}
                      >
                        <PinIcon filled={pinned} size={14} />
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
