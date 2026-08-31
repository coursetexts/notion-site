import type { SupabaseClient } from '@supabase/supabase-js'

export const LEARNING_PATH_FILL_DAILY_LIMIT = 15

export type FillQuotaResult = {
  allowed: boolean
  used: number
  remaining: number
  quotaConfigured: boolean
}

function asQuota(value: unknown): FillQuotaResult | null {
  if (!value || typeof value !== 'object') return null
  const record = value as {
    allowed?: unknown
    used?: unknown
    remaining?: unknown
  }
  if (typeof record.allowed !== 'boolean') return null
  return {
    allowed: record.allowed,
    used: typeof record.used === 'number' ? record.used : 0,
    remaining: typeof record.remaining === 'number' ? record.remaining : 0,
    quotaConfigured: true
  }
}

function isMissingRpc(error: { code?: string; message?: string } | null) {
  const code = error?.code || ''
  const message = (error?.message || '').toLowerCase()
  return (
    code === 'PGRST202' ||
    code === '42883' ||
    message.includes('consume_learning_path_fill') ||
    message.includes('does not exist')
  )
}

export async function consumeLearningPathFillQuota(
  supabase: SupabaseClient
): Promise<FillQuotaResult> {
  const { data, error } = await supabase.rpc('consume_learning_path_fill', {
    max_per_day: LEARNING_PATH_FILL_DAILY_LIMIT
  })
  if (error) {
    if (isMissingRpc(error)) {
      console.warn(
        '[fill-learning-path] consume_learning_path_fill is missing; apply migration 033'
      )
      return {
        allowed: true,
        used: 0,
        remaining: LEARNING_PATH_FILL_DAILY_LIMIT,
        quotaConfigured: false
      }
    }
    throw error
  }
  const quota = asQuota(data)
  if (!quota) {
    return {
      allowed: false,
      used: LEARNING_PATH_FILL_DAILY_LIMIT,
      remaining: 0,
      quotaConfigured: true
    }
  }
  return quota
}
