import * as React from 'react'

import { useAuthOptional } from '@/contexts/AuthContext'
import { currentAuthRedirectPath } from '@/lib/auth-redirect'
import type { ContentReportTarget } from '@/lib/content-reports'
import {
  isCourseLearningPathPinId,
  isCourseLearningPathPinned,
  setCourseLearningPathPinned,
  subscribeCourseLearningPathPins
} from '@/lib/course-learning-path-pins-db'
import type { CourseLearningPathData } from '@/lib/course-learning-path-types'

import {
  HeroMoreMenu,
  HeroSaveButton,
  HeroShareButton
} from './HeroBarActions'

export function CourseLearningPathShareButton() {
  return <HeroShareButton />
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
      auth?.signInWithGoogle(currentAuthRedirectPath())
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
    <HeroSaveButton
      saved={saved}
      busy={loading}
      onClick={() => void handleClick()}
      saveLabel={
        signedIn ? `Save ${course.title}` : `Sign in to save ${course.title}`
      }
      savedLabel={`Unsave ${course.title}`}
    />
  )
}

export function CourseLearningPathHeroActions({
  course,
  reportTarget
}: {
  course: CourseLearningPathData
  reportTarget: ContentReportTarget
}) {
  return (
    <>
      <CourseLearningPathShareButton />
      <CourseLearningPathSaveButton course={course} />
      <HeroMoreMenu reportTarget={reportTarget} />
    </>
  )
}
