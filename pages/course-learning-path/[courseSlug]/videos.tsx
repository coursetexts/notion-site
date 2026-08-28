import { useEffect } from 'react'
import { useRouter } from 'next/router'

/** Legacy path: /course-learning-path/[courseSlug]/videos → /course-learning-path/[courseSlug] */
export default function CourseLearningPathLegacyVideosRedirect() {
  const router = useRouter()

  useEffect(() => {
    if (!router.isReady) return
    const slug = router.query.courseSlug
    if (typeof slug === 'string' && slug.trim()) {
      void router.replace(`/course-learning-path/${slug.trim()}`)
    } else {
      void router.replace('/course-videos')
    }
  }, [router])

  return null
}
