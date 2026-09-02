/**
 * Public progress events on learning paths (explored topics).
 * Used by the profile activity feed. No-ops if 034 is not applied.
 */

import { getSupabaseClient } from '@/lib/supabase'

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function isUuid(id: string | null | undefined): id is string {
  return Boolean(id && UUID_RE.test(id))
}

function labelsFromPathData(data: unknown): Record<string, string> {
  const out: Record<string, string> = {}
  if (!data || typeof data !== 'object') return out
  const row = data as { nodes?: unknown; topics?: unknown }

  if (Array.isArray(row.nodes)) {
    for (const node of row.nodes) {
      if (!node || typeof node !== 'object') continue
      const item = node as { id?: unknown; label?: unknown; title?: unknown }
      if (typeof item.id !== 'string') continue
      const label =
        (typeof item.label === 'string' && item.label.trim()) ||
        (typeof item.title === 'string' && item.title.trim()) ||
        item.id
      out[item.id] = label
    }
  }

  function walkTopics(topics: unknown[]) {
    for (const topic of topics) {
      if (!topic || typeof topic !== 'object') continue
      const item = topic as {
        id?: unknown
        title?: unknown
        children?: unknown
      }
      if (typeof item.id === 'string') {
        out[item.id] =
          typeof item.title === 'string' && item.title.trim()
            ? item.title.trim()
            : item.id
      }
      if (Array.isArray(item.children)) walkTopics(item.children)
    }
  }
  if (Array.isArray(row.topics)) walkTopics(row.topics)
  return out
}

export async function recordLearningPathProgressEvent(input: {
  pathId: string
  nodeId: string
  nodeLabel?: string
  status?: 'explored' | 'exploring'
}): Promise<void> {
  const nodeId = input.nodeId.trim()
  if (!isUuid(input.pathId) || !nodeId) return
  const supabase = getSupabaseClient()
  if (!supabase) return
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return

  const { error } = await supabase.from('learning_path_progress_events').upsert(
    {
      user_id: user.id,
      path_id: input.pathId,
      node_id: nodeId,
      node_label: (input.nodeLabel || nodeId).trim() || nodeId,
      status: input.status ?? 'explored'
    },
    { onConflict: 'user_id,path_id,node_id,status', ignoreDuplicates: true }
  )
  if (error && error.code !== '42P01' && error.code !== 'PGRST205') {
    console.error('recordLearningPathProgressEvent failed', error)
  }
}

export async function recordNewlyExploredLearningPathNodes(input: {
  userId: string
  pathId: string
  previousStatus: Record<string, string> | null | undefined
  nextStatus: Record<string, string>
}): Promise<void> {
  if (!isUuid(input.pathId) || !input.userId) return
  const supabase = getSupabaseClient()
  if (!supabase) return

  const baseline: Record<string, string> = input.previousStatus ?? {}
  if (!input.previousStatus) {
    const { data } = await supabase
      .from('learning_paths')
      .select('data')
      .eq('id', input.pathId)
      .maybeSingle()
    const labelsAndStatus = data?.data
    if (labelsAndStatus && typeof labelsAndStatus === 'object') {
      const nodes = (labelsAndStatus as { nodes?: unknown }).nodes
      if (Array.isArray(nodes)) {
        for (const node of nodes) {
          if (!node || typeof node !== 'object') continue
          const item = node as { id?: unknown; status?: unknown }
          if (typeof item.id === 'string' && typeof item.status === 'string') {
            baseline[item.id] = item.status
          }
        }
      }
    }
  }

  const newlyExplored = Object.entries(input.nextStatus).filter(
    ([nodeId, status]) =>
      status === 'explored' && baseline[nodeId] !== 'explored'
  )
  if (newlyExplored.length === 0) return

  const { data: pathRow } = await supabase
    .from('learning_paths')
    .select('data')
    .eq('id', input.pathId)
    .maybeSingle()
  const labels = labelsFromPathData(pathRow?.data)

  const rows = newlyExplored.map(([nodeId]) => ({
    user_id: input.userId,
    path_id: input.pathId,
    node_id: nodeId,
    node_label: labels[nodeId] || nodeId,
    status: 'explored' as const
  }))

  const { error } = await supabase
    .from('learning_path_progress_events')
    .upsert(rows, {
      onConflict: 'user_id,path_id,node_id,status',
      ignoreDuplicates: true
    })
  if (error && error.code !== '42P01' && error.code !== 'PGRST205') {
    console.error('recordNewlyExploredLearningPathNodes failed', error)
  }
}
