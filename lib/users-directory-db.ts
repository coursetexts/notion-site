import { getSupabaseClient } from './supabase'

export type UserDirectoryEntry = {
  user_id: string
  display_name: string | null
  avatar_url: string | null
  follower_count: number
  tags: string[]
}

type RpcPayload = {
  total: number
  users: Array<{
    user_id: string
    display_name: string | null
    avatar_url: string | null
    follower_count: number
    tags: unknown
  }>
}

export async function listUsersDirectory(params: {
  page: number
  pageSize: number
  search?: string
  interest?: string
}): Promise<{ users: UserDirectoryEntry[]; total: number }> {
  const supabase = getSupabaseClient()
  if (!supabase) return { users: [], total: 0 }
  const pageSize = Math.min(48, Math.max(1, params.pageSize))
  const page = Math.max(1, params.page)
  const offset = (page - 1) * pageSize
  const { data, error } = await supabase.rpc('list_users_directory', {
    p_search: params.search ?? '',
    p_interest: params.interest ?? '',
    p_limit: pageSize,
    p_offset: offset
  })
  if (error) {
    console.error('list_users_directory', error)
    return { users: [], total: 0 }
  }
  let payload = data as RpcPayload | string | null
  if (typeof payload === 'string') {
    try {
      payload = JSON.parse(payload) as RpcPayload
    } catch {
      return { users: [], total: 0 }
    }
  }
  if (!payload || typeof payload !== 'object') {
    return { users: [], total: 0 }
  }
  const total = Number((payload as RpcPayload).total ?? 0)
  const rawUsers = (payload as RpcPayload).users
  const users: UserDirectoryEntry[] = (Array.isArray(rawUsers) ? rawUsers : []).map(
    (u) => ({
      user_id: u.user_id,
      display_name: u.display_name,
      avatar_url: u.avatar_url,
      follower_count: Number(u.follower_count ?? 0),
      tags: Array.isArray(u.tags) ? u.tags.map(String) : []
    })
  )
  return { users, total }
}
