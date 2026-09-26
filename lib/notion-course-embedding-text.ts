/**
 * Build the embedding input string for a Notion university course card.
 */
import { appendRelatedTermsToEmbeddingText } from '@/lib/catalog-related-terms'

export type NotionCourseEmbeddingTextInput = {
  title?: string | null
  description?: string | null
  meta?: string | null
  subjects?: string[] | null
}

/**
 * Format: `{title}. {description}. {meta}. Topics: {subjects}`
 */
export function notionCourseEmbeddingText(
  course: NotionCourseEmbeddingTextInput,
  relatedTerms?: string[]
): string {
  const title = (course.title ?? '').trim()
  const description = (course.description ?? '').trim()
  const meta = (course.meta ?? '').trim()
  const subjects = (course.subjects || [])
    .map((subject) => (typeof subject === 'string' ? subject.trim() : ''))
    .filter(Boolean)
  return appendRelatedTermsToEmbeddingText(
    `${title}. ${description}. ${meta}. Topics: ${subjects.join(', ')}`,
    relatedTerms
  )
}
