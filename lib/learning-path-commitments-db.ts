/**
 * Per-user “committed” flags on learning paths and official courses,
 * plus an optional reminder cadence (stored only; sending is not built yet).
 *
 * Keys: `learning-path:{slug}` or `course:{notion_page_id}`.
 * Falls back to localStorage if Supabase is missing or 030/041 is not applied.
 */

import { getSupabaseClient } from '@/lib/supabase'

const STORAGE_KEY = 'coursetexts.learning-path-commitments'
const REMINDER_STORAGE_KEY = 'coursetexts.learning-path-commitment-reminders'

export const LEARNING_PATH_REMINDER_FREQUENCIES = [
  'daily',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday'
] as const

export type LearningPathReminderFrequency =
  (typeof LEARNING_PATH_REMINDER_FREQUENCIES)[number]

export type LearningPathReminder = {
  frequency: LearningPathReminderFrequency
  minute: number
  timezone: string
}

export type LearningPathCommitmentRow = {
  targetKey: string
  reminder: LearningPathReminder | null
}

const FREQUENCY_LABELS: Record<LearningPathReminderFrequency, string> = {
  daily: 'Every day',
  monday: 'Every Monday',
  tuesday: 'Every Tuesday',
  wednesday: 'Every Wednesday',
  thursday: 'Every Thursday',
  friday: 'Every Friday',
  saturday: 'Every Saturday',
  sunday: 'Every Sunday'
}

export const LEARNING_PATH_REMINDER_FREQUENCY_OPTIONS =
  LEARNING_PATH_REMINDER_FREQUENCIES.map((value) => ({
    value,
    label: FREQUENCY_LABELS[value]
  }))

export function learningPathCommitmentKey(slug: string): string {
  return `learning-path:${slug}`
}

export function officialCourseCommitmentKey(pageId: string): string {
  return `course:${pageId}`
}

export function isLearningPathReminderFrequency(
  value: string
): value is LearningPathReminderFrequency {
  return (LEARNING_PATH_REMINDER_FREQUENCIES as readonly string[]).includes(
    value
  )
}

export function reminderMinuteFromTimeInput(value: string): number {
  const match = /^(\d{1,2}):(\d{2})/.exec(value.trim())
  if (!match) return 12 * 60
  const hours = Math.min(23, Math.max(0, Number(match[1])))
  const minutes = Math.min(59, Math.max(0, Number(match[2])))
  return hours * 60 + minutes
}

export function timeInputFromReminderMinute(minute: number): string {
  const clamped = ((minute % 1440) + 1440) % 1440
  const hours = Math.floor(clamped / 60)
  const minutes = clamped % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

export function formatReminderTime(minute: number): string {
  const clamped = ((minute % 1440) + 1440) % 1440
  const hours24 = Math.floor(clamped / 60)
  const minutes = clamped % 60
  const period = hours24 >= 12 ? 'PM' : 'AM'
  const hours12 = hours24 % 12 || 12
  if (minutes === 0) return `${hours12} ${period}`
  return `${hours12}:${String(minutes).padStart(2, '0')} ${period}`
}

export function formatReminderTagLabel(reminder: LearningPathReminder): string {
  return `${FREQUENCY_LABELS[reminder.frequency]} · ${formatReminderTime(
    reminder.minute
  )}`
}

export function localReminderTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  } catch {
    return 'UTC'
  }
}

function readLocalCommitmentKeys(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter((key): key is string => typeof key === 'string')
  } catch {
    return []
  }
}

function writeLocalCommitmentKeys(keys: string[]) {
  if (typeof window === 'undefined') return
  const unique = [...new Set(keys)]
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(unique))
}

function parseReminder(value: unknown): LearningPathReminder | null {
  if (!value || typeof value !== 'object') return null
  const row = value as {
    frequency?: unknown
    minute?: unknown
    timezone?: unknown
  }
  if (
    typeof row.frequency !== 'string' ||
    !isLearningPathReminderFrequency(row.frequency)
  ) {
    return null
  }
  if (typeof row.minute !== 'number' || !Number.isFinite(row.minute)) {
    return null
  }
  const minute = Math.round(row.minute)
  if (minute < 0 || minute >= 1440) return null
  const timezone =
    typeof row.timezone === 'string' && row.timezone.trim()
      ? row.timezone.trim()
      : localReminderTimezone()
  return { frequency: row.frequency, minute, timezone }
}

function readLocalReminders(): Record<string, LearningPathReminder> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(REMINDER_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {}
    }
    const out: Record<string, LearningPathReminder> = {}
    for (const [key, value] of Object.entries(
      parsed as Record<string, unknown>
    )) {
      const reminder = parseReminder(value)
      if (reminder) out[key] = reminder
    }
    return out
  } catch {
    return {}
  }
}

function writeLocalReminders(reminders: Record<string, LearningPathReminder>) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(REMINDER_STORAGE_KEY, JSON.stringify(reminders))
}

function localCommitmentRows(): LearningPathCommitmentRow[] {
  const reminders = readLocalReminders()
  return readLocalCommitmentKeys().map((targetKey) => ({
    targetKey,
    reminder: reminders[targetKey] ?? null
  }))
}

async function currentUser() {
  const supabase = getSupabaseClient()
  if (!supabase) return { supabase: null, userId: null as string | null }
  const {
    data: { user }
  } = await supabase.auth.getUser()
  return { supabase, userId: user?.id ?? null }
}

function reminderFromRow(row: {
  reminder_frequency?: string | null
  reminder_minute?: number | null
  reminder_timezone?: string | null
}): LearningPathReminder | null {
  return parseReminder({
    frequency: row.reminder_frequency,
    minute: row.reminder_minute,
    timezone: row.reminder_timezone
  })
}

export async function listMyLearningPathCommitments(): Promise<
  LearningPathCommitmentRow[]
> {
  const local = localCommitmentRows()
  const { supabase, userId } = await currentUser()
  if (!supabase || !userId) return local

  const withReminders = await supabase
    .from('learning_path_commitments')
    .select('target_key, reminder_frequency, reminder_minute, reminder_timezone')
    .eq('user_id', userId)

  if (!withReminders.error && Array.isArray(withReminders.data)) {
    const rows: LearningPathCommitmentRow[] = []
    const reminders: Record<string, LearningPathReminder> = {}
    for (const raw of withReminders.data as Array<{
      target_key?: string
      reminder_frequency?: string | null
      reminder_minute?: number | null
      reminder_timezone?: string | null
    }>) {
      if (!raw.target_key) continue
      const reminder = reminderFromRow(raw)
      rows.push({ targetKey: raw.target_key, reminder })
      if (reminder) reminders[raw.target_key] = reminder
    }
    writeLocalCommitmentKeys(rows.map((row) => row.targetKey))
    writeLocalReminders(reminders)
    return rows
  }

  const keysOnly = await supabase
    .from('learning_path_commitments')
    .select('target_key')
    .eq('user_id', userId)
  if (keysOnly.error || !Array.isArray(keysOnly.data)) return local
  const keys = keysOnly.data
    .map((row) => (row as { target_key?: string }).target_key)
    .filter((key): key is string => Boolean(key))
  writeLocalCommitmentKeys(keys)
  const reminders = readLocalReminders()
  return keys.map((targetKey) => ({
    targetKey,
    reminder: reminders[targetKey] ?? null
  }))
}

export async function setLearningPathCommitted(
  targetKey: string,
  committed: boolean
): Promise<boolean> {
  const key = targetKey.trim()
  if (!key) return false
  const local = new Set(readLocalCommitmentKeys())
  const reminders = readLocalReminders()
  if (committed) local.add(key)
  else {
    local.delete(key)
    delete reminders[key]
  }
  writeLocalCommitmentKeys([...local])
  writeLocalReminders(reminders)

  const { supabase, userId } = await currentUser()
  if (!supabase || !userId) return true

  if (committed) {
    const { error } = await supabase.from('learning_path_commitments').insert({
      user_id: userId,
      target_key: key
    })
    if (error && error.code !== '23505') {
      return true
    }
    return true
  }

  await supabase
    .from('learning_path_commitments')
    .delete()
    .eq('user_id', userId)
    .eq('target_key', key)
  return true
}

export async function setLearningPathReminder(
  targetKey: string,
  reminder: LearningPathReminder | null
): Promise<boolean> {
  const key = targetKey.trim()
  if (!key) return false
  if (!readLocalCommitmentKeys().includes(key)) return false

  const reminders = readLocalReminders()
  if (reminder) reminders[key] = reminder
  else delete reminders[key]
  writeLocalReminders(reminders)

  const { supabase, userId } = await currentUser()
  if (!supabase || !userId) return true

  const payload = reminder
    ? {
        reminder_frequency: reminder.frequency,
        reminder_minute: reminder.minute,
        reminder_timezone: reminder.timezone
      }
    : {
        reminder_frequency: null,
        reminder_minute: null,
        reminder_timezone: null
      }

  const { error } = await supabase
    .from('learning_path_commitments')
    .update(payload)
    .eq('user_id', userId)
    .eq('target_key', key)
  if (error) return true
  return true
}
