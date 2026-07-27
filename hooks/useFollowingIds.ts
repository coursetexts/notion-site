import { useCallback, useEffect, useState } from 'react'

import { useAuthOptional } from '@/contexts/AuthContext'

import { getFollowingIds } from '@/lib/follows'

/**
 * Returns the set of user IDs the current user follows (for friend icon).
 * Refreshes when user logs in/out. Call refresh() after follow/unfollow to update.
 */
export function useFollowingIds(): {
  followingIds: Set<string>
  refresh: () => Promise<void>
} {
  const auth = useAuthOptional()
  const userId = auth?.user?.id ?? null
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set())

  const refresh = useCallback(async () => {
    const ids = await getFollowingIds(userId ?? null)
    setFollowingIds(new Set(ids))
  }, [userId])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { followingIds, refresh }
}
