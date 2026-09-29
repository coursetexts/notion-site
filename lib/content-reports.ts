/** Signed-in emails that may open `/reports`. Keep in sync with migration 059. */
export const REPORTS_ADMIN_EMAILS = [
  'eeshaulh@gmail.com',
  'admin@bencuan.me',
  'coursetexts.info@gmail.com'
] as const

/**
 * When true, anyone can open `/reports`. Leave false so only
 * REPORTS_ADMIN_EMAILS can view the dashboard.
 */
export const REPORTS_DASHBOARD_OPEN = false

export const CONTENT_REPORT_TYPES = [
  'annotation',
  'comment',
  'learning_path',
  'resource'
] as const

export type ContentReportTargetType = (typeof CONTENT_REPORT_TYPES)[number]

export type ContentReportStatus = 'open' | 'reviewed' | 'dismissed'

export type ContentReportTarget = {
  type: ContentReportTargetType
  id: string
  url: string
  title: string
  snippet?: string
}

export type ContentReport = {
  id: string
  reporterId: string
  reporterEmail: string | null
  reporterDisplayName: string | null
  targetType: ContentReportTargetType
  targetId: string
  targetUrl: string | null
  targetTitle: string | null
  targetSnippet: string | null
  reason: string
  status: ContentReportStatus
  createdAt: string
}

export function canViewReportsDashboard(
  email: string | undefined | null
): boolean {
  if (REPORTS_DASHBOARD_OPEN) return true
  const normalized = (email || '').trim().toLowerCase()
  if (!normalized) return false
  return REPORTS_ADMIN_EMAILS.some((allowed) => allowed === normalized)
}

export function absoluteContentUrl(pathOrUrl: string): string {
  const trimmed = pathOrUrl.trim()
  if (!trimmed) {
    if (typeof window === 'undefined') return ''
    return `${window.location.origin}${window.location.pathname}${window.location.search}`
  }
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  if (typeof window === 'undefined') return path
  return `${window.location.origin}${path}`
}

export function snippetFromText(text: string, max = 240): string {
  const t = text.replace(/\s+/g, ' ').trim()
  if (!t) return ''
  if (t.length <= max) return t
  return `${t.slice(0, max - 1)}…`
}

export function pathResourceReportId(args: {
  slug: string
  nodeId: string
  resourceId: string
}): string {
  return `lp:${args.slug}:${args.nodeId}:${args.resourceId}`
}

export function communityResourceReportId(
  id: string,
  kind?: 'resource' | 'knowledge_component'
): string {
  return kind === 'knowledge_component' ? `kc:${id}` : `resource:${id}`
}

export function contentReportTypeLabel(type: ContentReportTargetType): string {
  if (type === 'learning_path') return 'Learning path'
  if (type === 'annotation') return 'Discussion'
  if (type === 'comment') return 'Comment'
  return 'Resource'
}
