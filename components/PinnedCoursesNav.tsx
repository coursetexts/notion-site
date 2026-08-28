import * as React from 'react'
import Link from 'next/link'

import {
  type PinnedCourseLearningPath,
  courseLearningPathHref,
  listMyCourseLearningPathPins,
  setCourseLearningPathPinned,
  subscribeCourseLearningPathPins
} from '@/lib/course-learning-path-pins-db'

import { PinIcon } from './PinIcon'
import styles from './PinnedCoursesNav.module.css'

export function PinnedCoursesNav() {
  const [open, setOpen] = React.useState(false)
  const [pins, setPins] = React.useState<PinnedCourseLearningPath[]>([])
  const [loading, setLoading] = React.useState(true)
  const rootRef = React.useRef<HTMLDivElement>(null)

  const refresh = React.useCallback(async () => {
    const rows = await listMyCourseLearningPathPins()
    setPins(rows)
    setLoading(false)
  }, [])

  React.useEffect(() => {
    void refresh()
    return subscribeCourseLearningPathPins(() => {
      void refresh()
    })
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

  async function unpin(courseId: string) {
    const previous = pins
    setPins((rows) => rows.filter((row) => row.courseId !== courseId))
    const result = await setCourseLearningPathPinned(courseId, false)
    if (result === null) setPins(previous)
  }

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        type='button'
        className={`${styles.trigger}${open ? ` ${styles.triggerOpen}` : ''}`}
        aria-label='Pinned courses'
        aria-expanded={open}
        aria-haspopup='menu'
        onClick={() => setOpen((v) => !v)}
      >
        <PinIcon filled size={18} />
      </button>
      {open && (
        <div className={styles.menu} role='menu' aria-label='Pinned courses'>
          <p className={styles.menuLabel}>Pinned courses</p>
          {loading ? (
            <p className={styles.empty}>Loading…</p>
          ) : pins.length === 0 ? (
            <p className={styles.empty}>
              Pin a course learning path from its syllabus to see it here.
            </p>
          ) : (
            <ul className={styles.list}>
              {pins.map((pin) => (
                <li key={pin.pinId} className={styles.row}>
                  <Link href={courseLearningPathHref(pin.slug)} legacyBehavior>
                    <a
                      className={styles.courseLink}
                      role='menuitem'
                      onClick={() => setOpen(false)}
                    >
                      {pin.title}
                    </a>
                  </Link>
                  <button
                    type='button'
                    className={styles.rowPin}
                    aria-label={`Unpin ${pin.title}`}
                    onClick={() => void unpin(pin.courseId)}
                  >
                    <PinIcon filled size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
