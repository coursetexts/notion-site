import { useEffect } from 'react'
import { useRouter } from 'next/router'

/** Legacy path: /curated-course/[courseSlug]/videos → /curated-course/[courseSlug] */
export default function CuratedCourseLegacyVideosRedirect() {
  const router = useRouter()

  useEffect(() => {
    if (!router.isReady) return
    const slug = router.query.courseSlug
    if (typeof slug === 'string' && slug.trim()) {
      void router.replace(`/curated-course/${slug.trim()}`)
    } else {
      void router.replace('/course-videos')
    }
  }, [router])

  return null
}
