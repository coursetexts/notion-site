export type FollowRelationship =
  | 'none'
  | 'following'
  | 'follows-you'
  | 'each-other'

export function followRelationship(
  isFollowing: boolean,
  followsYou: boolean
): FollowRelationship {
  if (isFollowing && followsYou) return 'each-other'
  if (isFollowing) return 'following'
  if (followsYou) return 'follows-you'
  return 'none'
}

export function followButtonLabel(
  relationship: FollowRelationship,
  busy = false
): string {
  if (busy) return '…'
  if (relationship === 'each-other') return 'Following each other'
  if (relationship === 'following') return 'Following'
  if (relationship === 'follows-you') return 'Follow back'
  return 'Follow'
}

export function followTagLabel(
  relationship: FollowRelationship
): string | null {
  if (relationship === 'each-other') return 'following each other'
  if (relationship === 'following') return 'following'
  if (relationship === 'follows-you') return 'follows you'
  return null
}
