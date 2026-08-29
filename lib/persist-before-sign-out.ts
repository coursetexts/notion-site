/**
 * Let notes / resources flush to Supabase before auth is cleared.
 * Sign-out currently navigates away after the session is already gone, so
 * unmount-only saves would skip the database.
 */
type PersistFn = () => Promise<unknown>

const persistors = new Set<PersistFn>()

export function registerPersistBeforeSignOut(persist: PersistFn): () => void {
  persistors.add(persist)
  return () => {
    persistors.delete(persist)
  }
}

export async function persistAllBeforeSignOut(): Promise<void> {
  await Promise.all(
    [...persistors].map((persist) => persist().catch(() => undefined))
  )
}
