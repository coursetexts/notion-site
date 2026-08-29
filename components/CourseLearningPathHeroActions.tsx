import * as React from 'react'

import { useAuthOptional } from '@/contexts/AuthContext'
import {
  isCourseLearningPathPinId,
  isCourseLearningPathPinned,
  setCourseLearningPathPinned,
  subscribeCourseLearningPathPins
} from '@/lib/course-learning-path-pins-db'
import type { CourseLearningPathData } from '@/lib/course-learning-path-types'

import heroStyles from './CourseHero.module.css'
import saveStyles from './SaveCourseButton.module.css'

function ShareLinkIcon() {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='14'
      height='14'
      viewBox='0 0 8 8'
      fill='none'
      aria-hidden
    >
      <path
        d='M4.14058 1.91565L4.44058 1.61252C4.70255 1.37375 5.04645 1.2451 5.40081 1.2533C5.75518 1.2615 6.09276 1.40593 6.3434 1.65657C6.59404 1.90721 6.73847 2.24479 6.74667 2.59916C6.75488 2.95352 6.62622 3.29742 6.38745 3.5594L5.44058 4.50315C5.31312 4.63108 5.16166 4.73259 4.99488 4.80186C4.8281 4.87112 4.64929 4.90678 4.4687 4.90678C4.28811 4.90678 4.1093 4.87112 3.94252 4.80186C3.77574 4.73259 3.62428 4.63108 3.49683 4.50315'
        stroke='currentColor'
        strokeWidth='0.75'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='M3.8594 6.08439L3.5594 6.38752C3.29742 6.62629 2.95352 6.75494 2.59916 6.74674C2.24479 6.73853 1.90721 6.5941 1.65657 6.34346C1.40593 6.09282 1.2615 5.75524 1.2533 5.40088C1.2451 5.04651 1.37375 4.70261 1.61252 4.44064L2.5594 3.49689C2.68685 3.36896 2.83831 3.26745 3.00509 3.19818C3.17187 3.12892 3.35068 3.09326 3.53127 3.09326C3.71186 3.09326 3.89067 3.12892 4.05745 3.19818C4.22423 3.26745 4.37569 3.36896 4.50315 3.49689'
        stroke='currentColor'
        strokeWidth='0.75'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

function BookmarkIcon() {
  return (
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
  )
}

export function CourseLearningPathShareButton() {
  const [copied, setCopied] = React.useState(false)

  async function handleShare() {
    const url = window.location.href
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      window.prompt('Copy this link', url)
    }
  }

  return (
    <button
      type='button'
      className={heroStyles.shareLink}
      onClick={() => void handleShare()}
      aria-label={copied ? 'Link copied' : 'Copy share link'}
    >
      <ShareLinkIcon />
      {copied ? 'Copied' : 'Share'}
    </button>
  )
}

export function CourseLearningPathSaveButton({
  course
}: {
  course: CourseLearningPathData
}) {
  const auth = useAuthOptional()
  const signedIn = Boolean(auth?.user)
  const canPin = Boolean(course.dbBacked && isCourseLearningPathPinId(course.id))
  const [saved, setSaved] = React.useState(false)
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    if (!canPin || !signedIn) {
      setSaved(false)
      return
    }
    let alive = true
    void isCourseLearningPathPinned(course.id).then((value) => {
      if (alive) setSaved(value)
    })
    const unsub = subscribeCourseLearningPathPins(() => {
      void isCourseLearningPathPinned(course.id).then((value) => {
        if (alive) setSaved(value)
      })
    })
    return () => {
      alive = false
      unsub()
    }
  }, [canPin, signedIn, course.id])

  async function handleClick() {
    if (!signedIn) {
      auth?.signInWithGoogle()
      return
    }
    if (!canPin || loading) return
    const next = !saved
    setLoading(true)
    setSaved(next)
    const result = await setCourseLearningPathPinned(course.id, next)
    if (result === null) setSaved(!next)
    setLoading(false)
  }

  return (
    <div className={saveStyles.wrap}>
      <button
        type='button'
        className={[
          saved ? saveStyles.savedBtn : saveStyles.saveBtn,
          loading ? saveStyles.saving : ''
        ]
          .filter(Boolean)
          .join(' ')}
        onClick={() => void handleClick()}
        disabled={loading}
        aria-pressed={saved}
        aria-label={
          saved
            ? `Unsave ${course.title}`
            : signedIn
              ? `Save ${course.title}`
              : `Sign in to save ${course.title}`
        }
        title={
          saved
            ? 'Unsave course'
            : signedIn
              ? 'Save course'
              : 'Sign in to save this course'
        }
      >
        <span className={saveStyles.icon} aria-hidden>
          <BookmarkIcon />
        </span>
        <span className={saveStyles.label}>{saved ? 'Saved' : 'Save'}</span>
      </button>
    </div>
  )
}

export function CourseLearningPathHeroActions({
  course
}: {
  course: CourseLearningPathData
}) {
  return (
    <>
      <CourseLearningPathShareButton />
      <CourseLearningPathSaveButton course={course} />
    </>
  )
}
