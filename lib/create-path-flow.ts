const CREATE_PATH_FLOW_KEY = 'coursetexts:create-path-flow'

/** Remember which path slug is still in the create/build stepper flow. */
export function markCreatePathFlow(slug: string) {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(CREATE_PATH_FLOW_KEY, slug)
  } catch {
    /* ignore quota / private mode */
  }
}

export function clearCreatePathFlow(slug?: string) {
  if (typeof window === 'undefined') return
  try {
    if (!slug) {
      window.sessionStorage.removeItem(CREATE_PATH_FLOW_KEY)
      return
    }
    if (window.sessionStorage.getItem(CREATE_PATH_FLOW_KEY) === slug) {
      window.sessionStorage.removeItem(CREATE_PATH_FLOW_KEY)
    }
  } catch {
    /* ignore */
  }
}

export function isCreatePathFlowSlug(slug: string): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.sessionStorage.getItem(CREATE_PATH_FLOW_KEY) === slug
  } catch {
    return false
  }
}
