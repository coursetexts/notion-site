/**
 * Upvotes and downvotes on community / research learning-path resource cards.
 * Scores are independent of sequence order.
 */
import { getSupabaseClient } from './supabase'

export type LearningPathResourceVoteValue = 1 | -1

export type LearningPathResourceVoteSummary = {
  score: number
  userVote: LearningPathResourceVoteValue | null
}

function voteKey(nodeId: string, resourceId: string) {
  return `${nodeId}::${resourceId}`
}

function asVoteValue(value: unknown): LearningPathResourceVoteValue {
  return value === -1 ? -1 : 1
}

export async function getLearningPathResourceVoteSummaries(
  pathId: string
): Promise<Record<string, LearningPathResourceVoteSummary>> {
  const out: Record<string, LearningPathResourceVoteSummary> = {}
  const supabase = getSupabaseClient()
  if (!supabase || !pathId) return out

  const { data: rows, error } = await supabase
    .from('learning_path_resource_votes')
    .select('node_id, resource_id, user_id, value')
    .eq('path_id', pathId)

  if (error || !rows) {
    if (error) console.error('getLearningPathResourceVoteSummaries failed', error)
    return out
  }

  const {
    data: { user }
  } = await supabase.auth.getUser()

  for (const row of rows as Array<{
    node_id: string
    resource_id: string
    user_id: string
    value: number | null
  }>) {
    const key = voteKey(row.node_id, row.resource_id)
    const vote = asVoteValue(row.value)
    const cur = out[key] ?? { score: 0, userVote: null }
    cur.score += vote
    if (user && row.user_id === user.id) cur.userVote = vote
    out[key] = cur
  }
  return out
}

/** Set, switch, or clear a vote. Returns the new score, or null on failure. */
export async function setLearningPathResourceVote(
  pathId: string,
  nodeId: string,
  resourceId: string,
  value: LearningPathResourceVoteValue | null
): Promise<number | null> {
  const supabase = getSupabaseClient()
  if (!supabase || !pathId || !nodeId || !resourceId) return null

  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return null

  if (value == null) {
    const { error } = await supabase
      .from('learning_path_resource_votes')
      .delete()
      .eq('user_id', user.id)
      .eq('path_id', pathId)
      .eq('node_id', nodeId)
      .eq('resource_id', resourceId)
    if (error) {
      console.error('setLearningPathResourceVote delete failed', error)
      return null
    }
  } else {
    const { error } = await supabase.from('learning_path_resource_votes').upsert(
      {
        user_id: user.id,
        path_id: pathId,
        node_id: nodeId,
        resource_id: resourceId,
        value
      },
      { onConflict: 'user_id,path_id,node_id,resource_id' }
    )
    if (error) {
      console.error('setLearningPathResourceVote upsert failed', error)
      return null
    }
  }

  const { data: scoreRows, error: scoreError } = await supabase
    .from('learning_path_resource_votes')
    .select('value')
    .eq('path_id', pathId)
    .eq('node_id', nodeId)
    .eq('resource_id', resourceId)

  if (scoreError || !scoreRows) return null
  return (scoreRows as Array<{ value: number | null }>).reduce(
    (sum, row) => sum + asVoteValue(row.value),
    0
  )
}

export function learningPathResourceVoteKey(nodeId: string, resourceId: string) {
  return voteKey(nodeId, resourceId)
}
