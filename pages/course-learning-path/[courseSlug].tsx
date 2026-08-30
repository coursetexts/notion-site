import { useEffect } from 'react'
import { useRouter } from 'next/router'

import { DEFAULT_COURSE_LEARNING_PATH_SLUG } from '@/lib/course-learning-path-seed'

/** Legacy path: /course-learning-path/[courseSlug] → /learning-path/[slug] */
export default function CourseLearningPathLegacyRedirect() {
  const router = useRouter()

  useEffect(() => {
    if (!router.isReady) return
    const slug = router.query.courseSlug
    if (typeof slug === 'string' && slug.trim()) {
      void router.replace(`/learning-path/${slug.trim()}`)
    } else {
      void router.replace(`/learning-path/${DEFAULT_COURSE_LEARNING_PATH_SLUG}`)
    }
  }, [router])

  return null
}
