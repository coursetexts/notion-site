/**
 * Upvotes on community / research learning-path resource list items.
 * Scores are independent of sequence order.
 */
import { getSupabaseClient } from './supabase'

export type LearningPathResourceVoteSummary = {
  score: number
  userVoted: boolean
}

function voteKey(nodeId: string, resourceId: string) {
  return `${nodeId}::${resourceId}`
}

export async function getLearningPathResourceVoteSummaries(
  pathId: string
): Promise<Record<string, LearningPathResourceVoteSummary>> {
  const out: Record<string, LearningPathResourceVoteSummary> = {}
  const supabase = getSupabaseClient()
  if (!supabase || !pathId) return out

  const { data: rows, error } = await supabase
    .from('learning_path_resource_votes')
    .select('node_id, resource_id, user_id')
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
  }>) {
    const key = voteKey(row.node_id, row.resource_id)
    const cur = out[key] ?? { score: 0, userVoted: false }
    cur.score += 1
    if (user && row.user_id === user.id) cur.userVoted = true
    out[key] = cur
  }
  return out
}

/** Set or clear an upvote. Returns the new score, or null on failure. */
export async function setLearningPathResourceUpvote(
  pathId: string,
  nodeId: string,
  resourceId: string,
  voted: boolean
): Promise<number | null> {
  const supabase = getSupabaseClient()
  if (!supabase || !pathId || !nodeId || !resourceId) return null

  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return null

  if (voted) {
    const { error } = await supabase.from('learning_path_resource_votes').upsert(
      {
        user_id: user.id,
        path_id: pathId,
        node_id: nodeId,
        resource_id: resourceId
      },
      {
        onConflict: 'user_id,path_id,node_id,resource_id',
        ignoreDuplicates: true
      }
    )
    if (error) {
      console.error('setLearningPathResourceUpvote insert failed', error)
      return null
    }
  } else {
    const { error } = await supabase
      .from('learning_path_resource_votes')
      .delete()
      .eq('user_id', user.id)
      .eq('path_id', pathId)
      .eq('node_id', nodeId)
      .eq('resource_id', resourceId)
    if (error) {
      console.error('setLearningPathResourceUpvote delete failed', error)
      return null
    }
  }

  const { count, error: countError } = await supabase
    .from('learning_path_resource_votes')
    .select('id', { count: 'exact', head: true })
    .eq('path_id', pathId)
    .eq('node_id', nodeId)
    .eq('resource_id', resourceId)

  if (countError) return null
  return count ?? 0
}

export function learningPathResourceVoteKey(nodeId: string, resourceId: string) {
  return voteKey(nodeId, resourceId)
}
