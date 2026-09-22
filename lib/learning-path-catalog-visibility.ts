/**
 * Shared catalog-visibility rules for learning_paths rows.
 *
 * Semantic embeddings and match_learning_path_embeddings should use this
 * invariant: every catalog-visible Learning Path is embeddable. Subtype /
 * kind / tag is not an eligibility gate. Private or hidden paths never are.
 *
 * Course rows with is_filled = false are empty catalog stubs: they are not
 * shown as Learning Path cards on /paths/all-courses, so they are not
 * catalog-visible Learning Paths.
 */

export type LearningPathCatalogVisibilityRow = {
  kind?: string | null
  visibility?: string | null
  is_private?: boolean | null
  is_filled?: boolean | null
}

export function isLearningPathPrivateOrHidden(
  row: Pick<LearningPathCatalogVisibilityRow, 'visibility' | 'is_private'>
): boolean {
  if (row.visibility === 'private') return true
  if (row.visibility == null && row.is_private === true) return true
  return false
}

/**
 * True when a learning_paths row should appear in the public Learning Path
 * catalog (and therefore may receive a public semantic embedding).
 *
 * Does not require kind ∈ {community, research}. Any non-private learning
 * path is eligible, except unfilled course stubs.
 */
export function isCatalogVisibleLearningPath(
  row: LearningPathCatalogVisibilityRow
): boolean {
  if (isLearningPathPrivateOrHidden(row)) return false
  if (row.kind === 'course' && row.is_filled !== true) return false
  return true
}
