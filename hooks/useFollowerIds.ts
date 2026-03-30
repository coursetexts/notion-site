import { useCallback, useEffect, useState } from 'react'

import { useAuthOptional } from '@/contexts/AuthContext'

import { getFollowerIds } from '@/lib/follows'

/**
 * Returns the set of user IDs who follow the current user (for "follows you" tag).
 */
export function useFollowerIds(): {
  followerIds: Set<string>
  refresh: () => Promise<void>
} {
  const auth = useAuthOptional()
  const userId = auth?.user?.id ?? null
  const [followerIds, setFollowerIds] = useState<Set<string>>(new Set())

  const refresh = useCallback(async () => {
    const ids = await getFollowerIds(userId ?? null)
    setFollowerIds(new Set(ids))
  }, [userId])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { followerIds, refresh }
}
