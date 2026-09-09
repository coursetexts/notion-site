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
import { learningPathHref } from '@/lib/learning-path-bookmark-link'
import {
  learningPathNavPinKey,
  listMyNavPins,
  setNavPinned,
  subscribeNavPins
} from '@/lib/nav-pins-db'

import {
  HeroActionGroup,
  HeroMoreMenu,
  HeroSaveButton
} from './HeroBarActions'

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
  const auth = useAuthOptional()
  const signedIn = Boolean(auth?.user)
  const canSave = Boolean(
    course.dbBacked && isCourseLearningPathPinId(course.id)
  )
  const pinKey = learningPathNavPinKey(course.slug)
  const [navPinned, setNavPinnedState] = React.useState(false)
  const [pinBusy, setPinBusy] = React.useState(false)

  React.useEffect(() => {
    if (!signedIn) {
      setNavPinnedState(false)
      return
    }
    let alive = true
    void listMyNavPins().then((keys) => {
      if (alive) setNavPinnedState(keys.includes(pinKey))
    })
    const unsub = subscribeNavPins(() => {
      void listMyNavPins().then((keys) => {
        if (alive) setNavPinnedState(keys.includes(pinKey))
      })
    })
    return () => {
      alive = false
      unsub()
    }
  }, [signedIn, pinKey])

  async function toggleNavPin() {
    if (pinBusy) return
    if (!signedIn) {
      auth?.signInWithGoogle(currentAuthRedirectPath())
      return
    }
    setPinBusy(true)
    const next = !navPinned
    try {
      if (next && canSave) {
        const alreadySaved = await isCourseLearningPathPinned(course.id)
        if (!alreadySaved) {
          const result = await setCourseLearningPathPinned(course.id, true)
          if (result === null) return
        }
      }
      setNavPinnedState(next)
      const ok = await setNavPinned(pinKey, next)
      if (!ok) setNavPinnedState(!next)
    } finally {
      setPinBusy(false)
    }
  }

  return (
    <HeroActionGroup>
      <CourseLearningPathSaveButton course={course} />
      <HeroMoreMenu
        shareHref={learningPathHref(course.slug)}
        reportTarget={reportTarget}
        pinned={navPinned}
        pinBusy={pinBusy}
        onPinToggle={() => void toggleNavPin()}
      />
    </HeroActionGroup>
  )
}
