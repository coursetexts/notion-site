/**
 * People on a learning path: invited collaborators first, then public savers.
 */
import {
  listLearningPathInvites
} from '@/lib/learning-path-invites-db'
import {
  userLinkMatchesLearningPathSlug
} from '@/lib/learning-path-bookmark-link'
import type { LearningPathCircleMember } from '@/lib/learning-path-seed'
import { getSupabaseClient } from '@/lib/supabase'

const PATH_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function isPathUuid(id: string) {
  return PATH_UUID_RE.test(id)
}

export function initialsFromDisplayName(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .map((part) => part.replace(/[^A-Za-z0-9]/g, ''))
    .filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase()
}

function displayNameFromEmail(email: string): string {
  const local = email.split('@')[0]?.trim()
  return local || 'Collaborator'
}

async function profilesByUserIds(
  userIds: string[]
): Promise<Record<string, string>> {
  const supabase = getSupabaseClient()
  const names: Record<string, string> = {}
  if (!supabase || userIds.length === 0) return names
  const { data, error } = await supabase
    .from('profiles')
    .select('user_id, display_name')
    .in('user_id', userIds)
  if (error || !Array.isArray(data)) return names
  for (const row of data as Array<{
    user_id?: string
    display_name?: string | null
  }>) {
    if (!row.user_id) continue
    const name = row.display_name?.trim()
    if (name) names[row.user_id] = name
  }
  return names
}

export async function listLearningPathPeople(options: {
  pathId: string | null | undefined
  slug: string
}): Promise<LearningPathCircleMember[]> {
  const slug = options.slug?.trim()
  const supabase = getSupabaseClient()
  if (!supabase || !slug) return []

  const collaboratorUserIds = new Set<string>()
  const collaborators: LearningPathCircleMember[] = []

  const pathId = options.pathId
  if (pathId && isPathUuid(pathId)) {
    const invites = await listLearningPathInvites(pathId)
    for (const invite of invites) {
      if (invite.userId) collaboratorUserIds.add(invite.userId)
      const name =
        invite.displayName?.trim() || displayNameFromEmail(invite.email)
      collaborators.push({
        initials: initialsFromDisplayName(name),
        name,
        role: 'collaborator',
        userId: invite.userId
      })
    }
  }

  const { data: linkRows, error: linkError } = await supabase
    .from('user_links')
    .select('user_id, url, is_private')
    .eq('is_private', false)
    .ilike('url', `%/learning-path/${slug}%`)

  const saverIds: string[] = []
  if (!linkError && Array.isArray(linkRows)) {
    const seen = new Set<string>()
    for (const row of linkRows as Array<{
      user_id?: string
      url?: string
    }>) {
      const userId = row.user_id
      const url = row.url
      if (!userId || !url) continue
      if (collaboratorUserIds.has(userId)) continue
      if (!userLinkMatchesLearningPathSlug(url, slug)) continue
      if (seen.has(userId)) continue
      seen.add(userId)
      saverIds.push(userId)
    }
  }

  const saverNames = await profilesByUserIds(saverIds)
  const savers: LearningPathCircleMember[] = saverIds.map((userId) => {
    const name = saverNames[userId] || 'Learner'
    return {
      initials: initialsFromDisplayName(name),
      name,
      role: 'saved',
      userId
    }
  })

  return [...collaborators, ...savers]
}
