import { useEffect } from 'react'
import { useRouter } from 'next/router'

import { DEFAULT_COURSE_LEARNING_PATH_SLUG } from '@/lib/course-learning-path-seed'

/**
 * Legacy /course-videos?slug= → /learning-path/{slug}
 */
export default function CourseLearningPathLegacyPage() {
  const router = useRouter()

  useEffect(() => {
    if (!router.isReady) return
    const slugParam = router.query.slug
    const slug =
      typeof slugParam === 'string' && slugParam.trim()
        ? slugParam.trim()
        : DEFAULT_COURSE_LEARNING_PATH_SLUG
    void router.replace(`/learning-path/${slug}`)
  }, [router])

  return null
}
