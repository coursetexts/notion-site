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
  learningPathsFromUserLinks,
  mergeOwnedAndSavedLearningPaths
} from '@/lib/learning-path-bookmark-link'
import {
  attachLearningPathKinds,
  listAccessibleLearningPaths
} from '@/lib/learning-path-db'
import { isCourseKindPath } from '@/lib/learning-path-kind-ui'
import { readStoredLearningPaths } from '@/lib/learning-path-seed'
import {
  type NavPinResume,
  enrichOfficialNavPinResume,
  loadNavPinResume
} from '@/lib/nav-pin-resume'
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

import { PinIcon } from './PinIcon'
import styles from './PinnedCoursesNav.module.css'

type PinNavTab = 'courses' | 'learning-paths'

type PinNavItem = {
  id: string
  title: string
  href: string
  pinKey: string
  pathSlug?: string
  officialPageId?: string
}

type NavPinResumeMaps = {
  byPathSlug: Record<string, NavPinResume>
  byOfficialPageId: Record<string, NavPinResume>
}

const EMPTY_RESUME: NavPinResumeMaps = {
  byPathSlug: {},
  byOfficialPageId: {}
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
    .sort((a, b) => (index.get(a.pinKey) ?? 0) - (index.get(b.pinKey) ?? 0))
  const rest = items.filter((item) => !index.has(item.pinKey))
  return [...pinned, ...rest]
}

function resumeForItem(
  item: PinNavItem,
  maps: NavPinResumeMaps
): NavPinResume | null {
  if (item.pathSlug) return maps.byPathSlug[item.pathSlug] ?? null
  if (item.officialPageId) {
    return maps.byOfficialPageId[item.officialPageId] ?? null
  }
  return null
}

function PinNavRow({
  item,
  pinned,
  resume,
  onTogglePinned,
  onNavigate
}: {
  item: PinNavItem
  pinned: boolean
  resume: NavPinResume | null
  onTogglePinned: (item: PinNavItem) => void
  onNavigate: () => void
}) {
  const [hovered, setHovered] = React.useState(false)
  const [coarsePointer, setCoarsePointer] = React.useState(false)

  React.useEffect(() => {
    const mq = window.matchMedia('(hover: none)')
    const sync = () => setCoarsePointer(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  const showResume = coarsePointer || hovered

  function onBlur(event: React.FocusEvent<HTMLLIElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node)) {
      setHovered(false)
    }
  }

  return (
    <li
      className={pinned ? `${styles.row} ${styles.rowPinned}` : styles.row}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setHovered(true)}
      onBlurCapture={onBlur}
    >
      <div className={styles.rowMain}>
        <Link href={item.href} legacyBehavior>
          <a className={styles.courseLink} onClick={onNavigate}>
            {item.title}
          </a>
        </Link>
        <button
          type='button'
          className={styles.rowPin}
          aria-label={
            pinned ? `Unpin ${item.title}` : `Pin ${item.title} to top`
          }
          onClick={() => onTogglePinned(item)}
        >
          <PinIcon filled={pinned} size={14} />
        </button>
      </div>
      {showResume ? (
        <div className={styles.resume}>
          {resume ? (
            <p className={styles.resumeCount}>
              {resume.explored} of {resume.total} {resume.unit} explored
            </p>
          ) : (
            <p className={styles.resumeCount}>Pick up where you left off</p>
          )}
          <div className={styles.resumeNext}>
            {resume?.nextLabel ? (
              <span className={styles.resumeNextLabel}>
                Next: {resume.nextLabel}
              </span>
            ) : (
              <span className={styles.resumeNextLabel}>
                {resume && resume.explored >= resume.total
                  ? 'All caught up'
                  : item.title}
              </span>
            )}
            <Link href={resume?.continueHref ?? item.href} legacyBehavior>
              <a className={styles.continue} onClick={onNavigate}>
                Continue →
              </a>
            </Link>
          </div>
        </div>
      ) : null}
    </li>
  )
}

export function PinnedCoursesNav() {
  const [open, setOpen] = React.useState(false)
  const [tab, setTab] = React.useState<PinNavTab>('courses')
  const [coursePins, setCoursePins] = React.useState<
    PinnedCourseLearningPath[]
  >([])
  const [officialCourses, setOfficialCourses] = React.useState<PinNavItem[]>([])
  const [courseKindPaths, setCourseKindPaths] = React.useState<PinNavItem[]>([])
  const [communityPaths, setCommunityPaths] = React.useState<PinNavItem[]>([])
  const [researchPaths, setResearchPaths] = React.useState<PinNavItem[]>([])
  const [pinKeys, setPinKeys] = React.useState<string[]>([])
  const [resume, setResume] = React.useState<NavPinResumeMaps>(EMPTY_RESUME)
  const [loading, setLoading] = React.useState(true)
  const rootRef = React.useRef<HTMLDivElement>(null)

  const refresh = React.useCallback(
    async (opts?: { fetchOfficialToc?: boolean }) => {
      const [pins, bookmarks, owned, links, storedPinKeys] = await Promise.all([
        listMyCourseLearningPathPins(),
        getMyBookmarks(),
        listAccessibleLearningPaths(),
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
      const nextOfficial = bookmarks.map(({ course }) => ({
        id: course.notion_page_id,
        title: course.name,
        href: course.url ?? `/course/${course.notion_page_id}`,
        pinKey: officialCourseNavPinKey(course.notion_page_id),
        officialPageId: course.notion_page_id
      }))
      setOfficialCourses(nextOfficial)
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
        pinKey: learningPathNavPinKey(item.slug),
        pathSlug: item.slug
      })
      const pinSlugs = new Set(pins.map((pin) => pin.slug))
      const nextCourseKind = merged
        .filter(
          (item) => isCourseKindPath(item.kind) && !pinSlugs.has(item.slug)
        )
        .map(toNavItem)
      const nextCommunity = merged
        .filter(
          (item) => item.kind !== 'research' && !isCourseKindPath(item.kind)
        )
        .map(toNavItem)
      const nextResearch = merged
        .filter((item) => item.kind === 'research')
        .map(toNavItem)
      setCourseKindPaths(nextCourseKind)
      setCommunityPaths(nextCommunity)
      setResearchPaths(nextResearch)
      const resumeMaps = await loadNavPinResume({
        pathSlugs: [
          ...pins.map((pin) => pin.slug),
          ...nextCourseKind.map((item) => item.pathSlug ?? ''),
          ...nextCommunity.map((item) => item.pathSlug ?? ''),
          ...nextResearch.map((item) => item.pathSlug ?? '')
        ],
        official: nextOfficial.map((item) => ({
          pageId: item.officialPageId ?? item.id,
          href: item.href
        }))
      })
      setResume(resumeMaps)
      setLoading(false)
      if (opts?.fetchOfficialToc) {
        const officialMissing = nextOfficial.filter(
          (item) => !resumeMaps.byOfficialPageId[item.officialPageId ?? item.id]
        )
        if (officialMissing.length > 0) {
          const extraOfficial = await enrichOfficialNavPinResume({
            official: officialMissing.map((item) => ({
              pageId: item.officialPageId ?? item.id,
              href: item.href
            }))
          })
          if (Object.keys(extraOfficial).length > 0) {
            setResume((prev) => ({
              ...prev,
              byOfficialPageId: {
                ...prev.byOfficialPageId,
                ...extraOfficial
              }
            }))
          }
        }
      }
    },
    []
  )

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
    void refresh({ fetchOfficialToc: true })
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
            pinKey: learningPathNavPinKey(pin.slug),
            pathSlug: pin.slug
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
    const next: PinNavTab = tab === 'courses' ? 'learning-paths' : 'courses'
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
        <div className={styles.menu} role='dialog' aria-label='Saved items'>
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
              tab === 'courses' ? 'pinned-tab-courses' : 'pinned-tab-paths'
            }
          >
            {loading ? (
              <p className={styles.empty}>Loading…</p>
            ) : items.length === 0 ? (
              <p className={styles.empty}>{selected?.empty}</p>
            ) : (
              <ul className={styles.list}>
                {items.map((item) => (
                  <PinNavRow
                    key={item.id}
                    item={item}
                    pinned={pinKeySet.has(item.pinKey)}
                    resume={resumeForItem(item, resume)}
                    onTogglePinned={(next) => void togglePinned(next)}
                    onNavigate={() => setOpen(false)}
                  />
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
