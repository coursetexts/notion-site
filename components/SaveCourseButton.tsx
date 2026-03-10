import React, { useCallback, useEffect, useState } from 'react'

import {
  getOrCreateCourse,
  isBookmarked,
  toggleBookmark
} from '@/lib/course-activity-db'

import { useAuthOptional } from '../contexts/AuthContext'
import styles from './SaveCourseButton.module.css'

export interface SaveCourseButtonProps {
  courseUrl: string
  courseTitle: string
  coursePageId?: string
}

export const SaveCourseButton: React.FC<SaveCourseButtonProps> = ({
  courseUrl,
  courseTitle,
  coursePageId
}) => {
  const auth = useAuthOptional()
  const [courseId, setCourseId] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)

  const ensureCourse = useCallback(async () => {
    if (!coursePageId) return null
    const result = await getOrCreateCourse(coursePageId, courseTitle, courseUrl)
    if (result) setCourseId(result.courseId)
    return result?.courseId ?? null
  }, [coursePageId, courseTitle, courseUrl])

  useEffect(() => {
    if (!auth?.user || !coursePageId || !courseTitle) {
      setChecking(false)
      return
    }
    let cancelled = false
    ensureCourse().then((id) => {
      if (cancelled || !id) {
        if (!id) setChecking(false)
        return
      }
      isBookmarked(id).then((booked) => {
        if (!cancelled) {
          setSaved(booked)
          setChecking(false)
        }
      })
    })
    return () => {
      cancelled = true
    }
  }, [auth?.user, courseUrl, courseTitle, ensureCourse])

  const handleClick = async () => {
    if (!auth?.user) return
    const id = courseId ?? (await ensureCourse())
    if (!id) return
    setLoading(true)
    const next = await toggleBookmark(id)
    if (next !== null) setSaved(next)
    setLoading(false)
  }

  if (!auth?.user) return null
  if (!coursePageId) return null
  if (checking === false && courseId === null) return null

  return (
    <div className={styles.wrap}>
      <button
        type='button'
        className={saved ? styles.savedBtn : styles.saveBtn}
        onClick={handleClick}
        disabled={loading || checking}
        aria-pressed={saved}
      >
        {checking || loading ? (
          <span className={styles.label}>…</span>
        ) : saved ? (
          <>
            <span className={styles.icon} aria-hidden>
              ✓
            </span>
            <span className={styles.label}>Saved</span>
          </>
        ) : (
          <>
            <span className={styles.icon} aria-hidden>
              +
            </span>
            <span className={styles.label}>Save course</span>
          </>
        )}
      </button>
    </div>
  )
}
