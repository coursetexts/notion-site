/**
 * Profile Notifications — follows, likes, replies, path invites,
 * and resource-suggestion review / acceptance events.
 */
import { learningPathHref } from '@/lib/learning-path-bookmark-link'
import {
  type LearningPathJoinRequest,
  listOwnedLearningPathJoinRequests
} from '@/lib/learning-path-join-requests-db'
import {
  type ReplyNotification,
  getNotificationsLastReadAt,
  getReplyNotifications,
  isNotificationUnread
} from '@/lib/reply-notifications'
import { getSupabaseClient } from '@/lib/supabase'

type ActorFields = {
  actor_id: string
  actor_display_name: string
  actor_avatar_url: string | null
}

type ProfileNotificationBase =
  | ({
      kind: 'follow'
      id: string
      created_at: string
    } & ActorFields)
  | ({
      kind: 'like'
      id: string
      created_at: string
      update_id: string
      update_snippet: string
      profile_href: string
    } & ActorFields)
  | ({
      kind: 'repost'
      id: string
      created_at: string
      update_id: string
      update_snippet: string
      profile_href: string
    } & ActorFields)
  | ({
      kind: 'quote'
      id: string
      created_at: string
      update_id: string
      update_snippet: string
      quote_snippet: string
      profile_href: string
    } & ActorFields)
  | {
      kind: 'reply'
      id: string
      created_at: string
      notification: ReplyNotification
    }
  | ({
      kind: 'path_invite'
      id: string
      created_at: string
      path_title: string
      path_href: string
    } & ActorFields)
  | ({
      kind: 'resource_submitted'
      id: string
      created_at: string
      path_title: string
      path_href: string
      resource_title: string
      body: string
    } & ActorFields)
  | ({
      kind: 'resource_accepted'
      id: string
      created_at: string
      path_title: string
      path_href: string
      resource_title: string
    } & ActorFields)
  | {
      kind: 'join_request'
      id: string
      created_at: string
      request: LearningPathJoinRequest
    }

export type ProfileNotification = ProfileNotificationBase & {
  is_unread: boolean
}

type ProfileRow = {
  user_id: string
  display_name: string | null
  avatar_url: string | null
}

function actorFromProfile(
  userId: string,
  byId: Record<string, ProfileRow>
): ActorFields {
  const profile = byId[userId]
  return {
    actor_id: userId,
    actor_display_name: profile?.display_name?.trim() || 'Someone',
    actor_avatar_url: profile?.avatar_url ?? null
  }
}

async function hydrateProfiles(
  userIds: string[]
): Promise<Record<string, ProfileRow>> {
  const supabase = getSupabaseClient()
  const unique = [...new Set(userIds.filter(Boolean))]
  if (!supabase || unique.length === 0) return {}
  const { data } = await supabase
    .from('profiles')
    .select('user_id, display_name, avatar_url')
    .in('user_id', unique)
  const byId: Record<string, ProfileRow> = {}
  for (const row of (data || []) as ProfileRow[]) {
    byId[row.user_id] = row
  }
  return byId
}

async function listFollowNotifications(
  userId: string
): Promise<Extract<ProfileNotificationBase, { kind: 'follow' }>[]> {
  const supabase = getSupabaseClient()
  if (!supabase) return []
  const { data, error } = await supabase
    .from('follows')
    .select('follower_id, created_at')
    .eq('following_id', userId)
    .order('created_at', { ascending: false })
    .limit(80)
  if (error || !Array.isArray(data)) return []
  const rows = data as Array<{ follower_id: string; created_at: string }>
  const profiles = await hydrateProfiles(rows.map((row) => row.follower_id))
  return rows.map((row) => ({
    kind: 'follow' as const,
    id: `follow-${row.follower_id}-${row.created_at}`,
    created_at: row.created_at,
    ...actorFromProfile(row.follower_id, profiles)
  }))
}

async function listLikeNotifications(
  userId: string
): Promise<Extract<ProfileNotificationBase, { kind: 'like' }>[]> {
  const supabase = getSupabaseClient()
  if (!supabase) return []
  const { data: updates, error: updatesError } = await supabase
    .from('profile_updates')
    .select('id, title, description')
    .eq('user_id', userId)
  if (updatesError || !Array.isArray(updates) || updates.length === 0) return []

  const updateById = new Map(
    (
      updates as Array<{
        id: string
        title: string | null
        description: string | null
      }>
    ).map((row) => [row.id, row])
  )
  const updateIds = [...updateById.keys()]
  const { data: votes, error: votesError } = await supabase
    .from('votes')
    .select('id, user_id, target_id, created_at')
    .eq('target_type', 'profile_update')
    .eq('value', 1)
    .in('target_id', updateIds)
    .neq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(80)
  if (votesError || !Array.isArray(votes)) return []

  const rows = votes as Array<{
    id: string
    user_id: string
    target_id: string
    created_at: string
  }>
  const profiles = await hydrateProfiles(rows.map((row) => row.user_id))
  return rows
    .map((row) => {
      const update = updateById.get(row.target_id)
      if (!update) return null
      const snippet =
        (update.title ?? '').trim() ||
        (update.description ?? '').trim().slice(0, 72) ||
        'your update'
      return {
        kind: 'like' as const,
        id: `like-${row.id}`,
        created_at: row.created_at,
        update_id: row.target_id,
        update_snippet: snippet,
        profile_href: `/profile/${userId}`,
        ...actorFromProfile(row.user_id, profiles)
      }
    })
    .filter((row): row is Extract<ProfileNotificationBase, { kind: 'like' }> =>
      Boolean(row)
    )
}

async function listPathInviteNotifications(
  userId: string
): Promise<Extract<ProfileNotificationBase, { kind: 'path_invite' }>[]> {
  const supabase = getSupabaseClient()
  if (!supabase) return []

  const {
    data: { user }
  } = await supabase.auth.getUser()
  const email = user?.email?.trim().toLowerCase() || null
  const clauses = [`invited_user_id.eq.${userId}`]
  if (email) clauses.push(`invited_email.eq.${email}`)

  const { data, error } = await supabase
    .from('learning_path_invites')
    .select('id, path_id, invited_by, created_at')
    .or(clauses.join(','))
    .order('created_at', { ascending: false })
    .limit(80)
  if (error || !Array.isArray(data) || data.length === 0) return []

  const rows = data as Array<{
    id: string
    path_id: string
    invited_by: string
    created_at: string
  }>
  const pathIds = [...new Set(rows.map((row) => row.path_id))]
  const [{ data: paths }, profiles] = await Promise.all([
    supabase.from('learning_paths').select('id, slug, title').in('id', pathIds),
    hydrateProfiles(rows.map((row) => row.invited_by))
  ])
  const pathById: Record<string, { slug: string; title: string }> = {}
  for (const path of (paths || []) as Array<{
    id: string
    slug: string
    title: string
  }>) {
    pathById[path.id] = { slug: path.slug, title: path.title }
  }

  return rows
    .map((row) => {
      const path = pathById[row.path_id]
      if (!path) return null
      return {
        kind: 'path_invite' as const,
        id: `invite-${row.id}`,
        created_at: row.created_at,
        path_title: path.title,
        path_href: learningPathHref(path.slug),
        ...actorFromProfile(row.invited_by, profiles)
      }
    })
    .filter(
      (row): row is Extract<ProfileNotificationBase, { kind: 'path_invite' }> =>
        Boolean(row)
    )
}

async function listResourceSuggestionNotifications(
  userId: string
): Promise<
  Extract<
    ProfileNotificationBase,
    { kind: 'resource_submitted' | 'resource_accepted' }
  >[]
> {
  const supabase = getSupabaseClient()
  if (!supabase) return []

  const { data: ownedPaths } = await supabase
    .from('learning_paths')
    .select('id, slug, title, owner_id')
    .eq('owner_id', userId)
  const myPaths = (ownedPaths || []) as Array<{
    id: string
    slug: string
    title: string
    owner_id: string
  }>
  const pathById: Record<
    string,
    { slug: string; title: string; owner_id: string }
  > = Object.fromEntries(myPaths.map((path) => [path.id, path]))
  const myPathIds = myPaths.map((path) => path.id)

  const incomingQuery =
    myPathIds.length > 0
      ? supabase
          .from('learning_path_resource_suggestions')
          .select('id, user_id, path_id, title, why, status, created_at')
          .in('path_id', myPathIds)
          .eq('status', 'pending')
          .neq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(80)
      : Promise.resolve({ data: [] as unknown[] })

  const acceptedQuery = supabase
    .from('learning_path_resource_suggestions')
    .select(
      'id, user_id, path_id, title, status, created_at, responded_at'
    )
    .eq('user_id', userId)
    .eq('status', 'accepted')
    .order('responded_at', { ascending: false })
    .limit(80)

  const [incomingRes, acceptedRes] = await Promise.all([
    incomingQuery,
    acceptedQuery
  ])

  const incoming = (incomingRes.data || []) as Array<{
    id: string
    user_id: string
    path_id: string
    title: string
    why: string | null
    created_at: string
  }>
  const accepted = (acceptedRes.data || []) as Array<{
    id: string
    path_id: string
    title: string
    created_at: string
    responded_at: string | null
  }>

  const acceptedPathIds = [
    ...new Set(accepted.map((row) => row.path_id).filter(Boolean))
  ]
  const missingPathIds = acceptedPathIds.filter((id) => !pathById[id])
  if (missingPathIds.length > 0) {
    const { data: extraPaths } = await supabase
      .from('learning_paths')
      .select('id, slug, title, owner_id')
      .in('id', missingPathIds)
    for (const path of (extraPaths || []) as Array<{
      id: string
      slug: string
      title: string
      owner_id: string
    }>) {
      pathById[path.id] = path
    }
  }

  const ownerIds: string[] = []
  for (const row of accepted) {
    const path = pathById[row.path_id]
    if (path?.owner_id && path.owner_id !== userId) {
      ownerIds.push(path.owner_id)
    }
  }

  const profiles = await hydrateProfiles([
    ...incoming.map((row) => row.user_id),
    ...ownerIds
  ])

  const submitted: Extract<
    ProfileNotificationBase,
    { kind: 'resource_submitted' }
  >[] = []
  for (const row of incoming) {
    const path = pathById[row.path_id]
    if (!path) continue
    submitted.push({
      kind: 'resource_submitted',
      id: `sgy-${row.id}`,
      created_at: row.created_at,
      path_title: path.title,
      path_href: learningPathHref(path.slug),
      resource_title: row.title,
      body: (row.why || '').trim(),
      ...actorFromProfile(row.user_id, profiles)
    })
  }

  const acceptedNotifs: Extract<
    ProfileNotificationBase,
    { kind: 'resource_accepted' }
  >[] = []
  for (const row of accepted) {
    const path = pathById[row.path_id]
    if (!path?.owner_id || path.owner_id === userId) continue
    acceptedNotifs.push({
      kind: 'resource_accepted',
      id: `sgr-${row.id}`,
      created_at: row.responded_at || row.created_at,
      path_title: path.title,
      path_href: learningPathHref(path.slug),
      resource_title: row.title,
      ...actorFromProfile(path.owner_id, profiles)
    })
  }

  return [...submitted, ...acceptedNotifs]
}

async function listRepostQuoteNotifications(
  userId: string
): Promise<
  Extract<ProfileNotificationBase, { kind: 'repost' | 'quote' }>[]
> {
  const supabase = getSupabaseClient()
  if (!supabase) return []
  const { data: mine, error: mineError } = await supabase
    .from('profile_updates')
    .select('id, title, description')
    .eq('user_id', userId)
  if (mineError || !Array.isArray(mine) || mine.length === 0) return []

  const mineById = new Map(
    (
      mine as Array<{
        id: string
        title: string | null
        description: string | null
      }>
    ).map((row) => [row.id, row])
  )
  const mineIds = [...mineById.keys()]

  const [repostsRes, quotesRes] = await Promise.all([
    supabase
      .from('profile_updates')
      .select(
        'id, user_id, title, description, created_at, repost_of_id, quote_of_id'
      )
      .in('repost_of_id', mineIds)
      .neq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(80),
    supabase
      .from('profile_updates')
      .select(
        'id, user_id, title, description, created_at, repost_of_id, quote_of_id'
      )
      .in('quote_of_id', mineIds)
      .neq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(80)
  ])

  const rows = [
    ...((repostsRes.data || []) as Array<{
      id: string
      user_id: string
      title: string | null
      description: string | null
      created_at: string
      repost_of_id: string | null
      quote_of_id: string | null
    }>),
    ...((quotesRes.data || []) as Array<{
      id: string
      user_id: string
      title: string | null
      description: string | null
      created_at: string
      repost_of_id: string | null
      quote_of_id: string | null
    }>)
  ]

  const profiles = await hydrateProfiles(rows.map((row) => row.user_id))
  const out: Extract<
    ProfileNotificationBase,
    { kind: 'repost' | 'quote' }
  >[] = []
  for (const row of rows) {
    const originalId = row.repost_of_id || row.quote_of_id
    if (!originalId) continue
    const original = mineById.get(originalId)
    if (!original) continue
    const snippet =
      (original.title ?? '').trim() ||
      (original.description ?? '').trim().slice(0, 72) ||
      'your update'
    const actor = actorFromProfile(row.user_id, profiles)
    if (row.repost_of_id) {
      out.push({
        kind: 'repost',
        id: `repost-${row.id}`,
        created_at: row.created_at,
        update_id: originalId,
        update_snippet: snippet,
        profile_href: `/profile/${userId}`,
        ...actor
      })
    } else if (row.quote_of_id) {
      const quoteSnippet =
        (row.description ?? '').trim() ||
        (row.title ?? '').trim() ||
        'a quote'
      out.push({
        kind: 'quote',
        id: `quote-${row.id}`,
        created_at: row.created_at,
        update_id: originalId,
        update_snippet: snippet,
        quote_snippet: quoteSnippet.slice(0, 120),
        profile_href: `/profile/${userId}`,
        ...actor
      })
    }
  }
  return out
}

export async function getProfileNotifications(
  userId: string
): Promise<ProfileNotification[]> {
  const [
    follows,
    likes,
    repostQuotes,
    replies,
    invites,
    resources,
    joinRequests,
    lastReadAt
  ] = await Promise.all([
    listFollowNotifications(userId),
    listLikeNotifications(userId),
    listRepostQuoteNotifications(userId),
    getReplyNotifications(userId),
    listPathInviteNotifications(userId),
    listResourceSuggestionNotifications(userId),
    listOwnedLearningPathJoinRequests(),
    getNotificationsLastReadAt(userId)
  ])

  const replyNotifs: Extract<ProfileNotificationBase, { kind: 'reply' }>[] =
    replies.map((notification) => ({
      kind: 'reply' as const,
      id: notification.id,
      created_at: notification.created_at,
      notification
    }))

  const joinNotifs: Extract<
    ProfileNotificationBase,
    { kind: 'join_request' }
  >[] = joinRequests.map((request) => ({
    kind: 'join_request' as const,
    id: `join-${request.id}`,
    created_at: request.createdAt,
    request
  }))

  const rows: ProfileNotificationBase[] = [
    ...follows,
    ...likes,
    ...repostQuotes,
    ...replyNotifs,
    ...invites,
    ...resources,
    ...joinNotifs
  ].sort((a, b) => b.created_at.localeCompare(a.created_at))

  return rows.map((row) => {
    const is_unread =
      row.kind === 'reply'
        ? row.notification.is_unread
        : isNotificationUnread(row.created_at, lastReadAt)
    return { ...row, is_unread }
  })
}
