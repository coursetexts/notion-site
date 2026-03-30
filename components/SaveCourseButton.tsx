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
        className={
          [
            saved ? styles.savedBtn : styles.saveBtn,
            (checking || loading) && styles.saving
          ]
            .filter(Boolean)
            .join(' ') || undefined
        }
        onClick={handleClick}
        disabled={loading || checking}
        aria-pressed={saved}
      >
        {checking || loading ? (
          <span className={styles.label}>
            {checking ? 'Saving...' : saved ? 'Unsaving...' : 'Saving...'}
          </span>
        ) : saved ? (
          <>
            <span className={styles.icon} aria-hidden>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                width='14'
                height='14'
                viewBox='-4 -4 20 20'
                fill='none'
                aria-hidden
              >
                <path
                  d='M8.625 1.5H3.375C3.17609 1.5 2.98532 1.57902 2.84467 1.71967C2.70402 1.86032 2.625 2.05109 2.625 2.25V10.5C2.62536 10.5668 2.64331 10.6322 2.67706 10.6899C2.7108 10.7475 2.75913 10.7952 2.81719 10.8281C2.8728 10.8599 2.93596 10.8761 3 10.875C3.06961 10.8751 3.13784 10.8556 3.19687 10.8188L6 9.06562L8.79844 10.8188C8.85621 10.8535 8.92201 10.8726 8.98939 10.8742C9.05677 10.8759 9.12342 10.86 9.18281 10.8281C9.24087 10.7952 9.2892 10.7475 9.32294 10.6899C9.35669 10.6322 9.37464 10.5668 9.375 10.5V2.25C9.375 2.05109 9.29598 1.86032 9.15533 1.71967C9.01468 1.57902 8.82391 1.5 8.625 1.5Z'
                  fill='currentColor'
                />
              </svg>
            </span>
            <span className={styles.label}>Saved</span>
          </>
        ) : (
          <>
            <span className={styles.icon} aria-hidden>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                width='14'
                height='14'
                viewBox='-4 -4 20 20'
                fill='none'
                aria-hidden
              >
                <path
                  d='M8.625 1.5H3.375C3.17609 1.5 2.98532 1.57902 2.84467 1.71967C2.70402 1.86032 2.625 2.05109 2.625 2.25V10.5C2.62536 10.5668 2.64331 10.6322 2.67706 10.6899C2.7108 10.7475 2.75913 10.7952 2.81719 10.8281C2.8728 10.8599 2.93596 10.8761 3 10.875C3.06961 10.8751 3.13784 10.8556 3.19687 10.8188L6 9.06562L8.79844 10.8188C8.85621 10.8535 8.92201 10.8726 8.98939 10.8742C9.05677 10.8759 9.12342 10.86 9.18281 10.8281C9.24087 10.7952 9.2892 10.7475 9.32294 10.6899C9.35669 10.6322 9.37464 10.5668 9.375 10.5V2.25C9.375 2.05109 9.29598 1.86032 9.15533 1.71967C9.01468 1.57902 8.82391 1.5 8.625 1.5Z'
                  fill='currentColor'
                />
              </svg>
            </span>
            <span className={styles.label}>Save</span>
          </>
        )}
      </button>
    </div>
  )
}
