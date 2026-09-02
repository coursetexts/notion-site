/**
 * Content reports (annotations, comments, learning paths, uploaded resources).
 * Requires migration 037. Missing-table errors surface as a friendly message.
 */
import { getCachedAuth } from '@/lib/auth-cache'
import {
  CONTENT_REPORT_TYPES,
  type ContentReport,
  type ContentReportStatus,
  type ContentReportTarget,
  type ContentReportTargetType,
  absoluteContentUrl,
  snippetFromText
} from '@/lib/content-reports'
import { getSupabaseClient } from '@/lib/supabase'

function isReportType(value: unknown): value is ContentReportTargetType {
  return (
    typeof value === 'string' &&
    (CONTENT_REPORT_TYPES as readonly string[]).includes(value)
  )
}

function isReportStatus(value: unknown): value is ContentReportStatus {
  return value === 'open' || value === 'reviewed' || value === 'dismissed'
}

function rowFromDb(row: {
  id: string
  reporter_id: string
  reporter_email: string | null
  reporter_display_name: string | null
  target_type: string
  target_id: string
  target_url: string | null
  target_title: string | null
  target_snippet: string | null
  reason: string
  status: string
  created_at: string
}): ContentReport | null {
  if (!isReportType(row.target_type) || !isReportStatus(row.status)) return null
  return {
    id: row.id,
    reporterId: row.reporter_id,
    reporterEmail: row.reporter_email,
    reporterDisplayName: row.reporter_display_name,
    targetType: row.target_type,
    targetId: row.target_id,
    targetUrl: row.target_url,
    targetTitle: row.target_title,
    targetSnippet: row.target_snippet,
    reason: row.reason,
    status: row.status,
    createdAt: row.created_at
  }
}

function tableMissing(
  error: { code?: string; message?: string } | null
): boolean {
  if (!error) return false
  return (
    error.code === '42P01' ||
    error.code === 'PGRST205' ||
    /content_reports/i.test(error.message || '')
  )
}

export async function submitContentReport(input: {
  target: ContentReportTarget
  reason: string
}): Promise<{ ok: boolean; error?: string }> {
  const reason = input.reason.replace(/\s+/g, ' ').trim()
  const targetId = input.target.id.trim()
  if (!reason) {
    return { ok: false, error: 'Please say why you are reporting this.' }
  }
  if (!targetId) {
    return { ok: false, error: 'This item cannot be reported.' }
  }

  const supabase = getSupabaseClient()
  if (!supabase) {
    return { ok: false, error: 'Reporting is not available right now.' }
  }

  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false, error: 'Sign in to send a report.' }
  }

  const cached = getCachedAuth()
  const displayName =
    cached.profile?.display_name?.trim() ||
    (typeof user.user_metadata?.full_name === 'string'
      ? user.user_metadata.full_name.trim()
      : '') ||
    (typeof user.user_metadata?.name === 'string'
      ? user.user_metadata.name.trim()
      : '') ||
    null

  const { error } = await supabase.from('content_reports').insert({
    reporter_id: user.id,
    reporter_email: user.email ?? null,
    reporter_display_name: displayName,
    target_type: input.target.type,
    target_id: targetId,
    target_url: absoluteContentUrl(input.target.url),
    target_title: input.target.title.trim() || null,
    target_snippet: snippetFromText(input.target.snippet || ''),
    reason
  })

  if (!error) return { ok: true }
  if (error.code === '23505') return { ok: true }
  if (tableMissing(error)) {
    return {
      ok: false,
      error:
        'Reporting is not set up yet. Apply migration 037_content_reports.sql.'
    }
  }
  console.error('submitContentReport failed', error)
  return { ok: false, error: 'Could not send your report. Try again.' }
}

export async function listContentReports(): Promise<{
  ok: boolean
  reports?: ContentReport[]
  error?: string
}> {
  const supabase = getSupabaseClient()
  if (!supabase) {
    return { ok: false, error: 'Reports could not be loaded.' }
  }

  const { data, error } = await supabase
    .from('content_reports')
    .select(
      'id, reporter_id, reporter_email, reporter_display_name, target_type, target_id, target_url, target_title, target_snippet, reason, status, created_at'
    )
    .order('created_at', { ascending: false })
    .limit(400)

  if (error) {
    if (tableMissing(error)) {
      return {
        ok: false,
        error: 'Apply migration 037_content_reports.sql to load reports.'
      }
    }
    console.error('listContentReports failed', error)
    return { ok: false, error: 'Reports could not be loaded.' }
  }

  const reports = (data || [])
    .map((row) => rowFromDb(row as Parameters<typeof rowFromDb>[0]))
    .filter((row): row is ContentReport => Boolean(row))

  return { ok: true, reports }
}
