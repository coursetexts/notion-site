import * as React from 'react'

import { FormSelect } from '@/components/FormSelect'
import {
  LEARNING_PATH_REMINDER_FREQUENCY_OPTIONS,
  formatReminderTagLabel,
  localReminderTimezone,
  reminderMinuteFromTimeInput,
  timeInputFromReminderMinute,
  type LearningPathReminder,
  type LearningPathReminderFrequency
} from '@/lib/learning-path-commitments-db'
import styles from '@/styles/profile.module.css'

function BellIcon() {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='11'
      height='11'
      viewBox='0 0 12 12'
      fill='none'
      aria-hidden
    >
      <path
        d='M6 1.4a2.6 2.6 0 0 0-2.6 2.6v1.15c0 .55-.18 1.08-.5 1.52L2.4 7.4h7.2l-.5-.73a2.6 2.6 0 0 1-.5-1.52V4A2.6 2.6 0 0 0 6 1.4Z'
        stroke='currentColor'
        strokeWidth='1.1'
        strokeLinejoin='round'
      />
      <path
        d='M4.55 8.85a1.45 1.45 0 0 0 2.9 0'
        stroke='currentColor'
        strokeWidth='1.1'
        strokeLinecap='round'
      />
    </svg>
  )
}

export function ProfileCommitmentReminder({
  reminder,
  onSave,
  onRemove,
  busy = false
}: {
  reminder: LearningPathReminder | null
  onSave: (reminder: LearningPathReminder) => void
  onRemove: () => void
  busy?: boolean
}) {
  const wrapRef = React.useRef<HTMLSpanElement>(null)
  const frequencyLabelId = React.useId()
  const [open, setOpen] = React.useState(false)
  const [openUp, setOpenUp] = React.useState(false)
  const [frequency, setFrequency] =
    React.useState<LearningPathReminderFrequency>(
      reminder?.frequency ?? 'daily'
    )
  const [timeValue, setTimeValue] = React.useState(
    timeInputFromReminderMinute(reminder?.minute ?? 12 * 60)
  )

  React.useEffect(() => {
    if (!open) return
    setFrequency(reminder?.frequency ?? 'daily')
    setTimeValue(timeInputFromReminderMinute(reminder?.minute ?? 12 * 60))
    const rect = wrapRef.current?.getBoundingClientRect()
    if (rect) {
      setOpenUp(window.innerHeight - rect.bottom < 280 && rect.top > 280)
    }
  }, [open, reminder])

  React.useEffect(() => {
    if (!open) return
    function onPointer(event: MouseEvent) {
      const target = event.target
      if (!(target instanceof Node)) return
      if (wrapRef.current?.contains(target)) return
      const element = target instanceof Element ? target : target.parentElement
      if (element?.closest('[data-form-select-menu]')) return
      setOpen(false)
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  function save() {
    onSave({
      frequency,
      minute: reminderMinuteFromTimeInput(timeValue),
      timezone: localReminderTimezone()
    })
    setOpen(false)
  }

  const label = reminder ? formatReminderTagLabel(reminder) : 'Notify'
  const tagClass = reminder
    ? `${styles.learningPathTag} ${styles.learningPathReminderSetTag}`
    : `${styles.learningPathTag} ${styles.learningPathNotifyTag}`

  return (
    <span className={styles.learningPathReminderWrap} ref={wrapRef}>
      <button
        type='button'
        className={tagClass}
        onClick={() => setOpen((prev) => !prev)}
        disabled={busy}
        aria-haspopup='dialog'
        aria-expanded={open}
        aria-label={
          reminder ? `Edit reminder, ${label}` : 'Set a reminder'
        }
      >
        <BellIcon />
        <span>{label}</span>
      </button>
      {open ? (
        <div
          className={`${styles.learningPathReminderPopover}${
            openUp ? ` ${styles.learningPathReminderPopoverUp}` : ''
          }`}
          role='dialog'
          aria-label='Reminder'
        >
          <p className={styles.learningPathReminderTitle}>Reminder</p>
          <div className={styles.learningPathReminderField}>
            <span id={frequencyLabelId}>Frequency</span>
            <FormSelect<LearningPathReminderFrequency>
              labelledBy={frequencyLabelId}
              value={frequency}
              options={LEARNING_PATH_REMINDER_FREQUENCY_OPTIONS}
              onChange={setFrequency}
              disabled={busy}
            />
          </div>
          <label className={styles.learningPathReminderField}>
            <span>Time</span>
            <input
              className={styles.learningPathReminderTime}
              type='time'
              value={timeValue}
              onChange={(event) => setTimeValue(event.target.value)}
            />
          </label>
          <button
            type='button'
            className={styles.learningPathReminderSave}
            onClick={save}
            disabled={busy}
          >
            Save reminder
          </button>
          {reminder ? (
            <button
              type='button'
              className={styles.learningPathReminderRemove}
              onClick={() => {
                onRemove()
                setOpen(false)
              }}
              disabled={busy}
            >
              Remove reminder
            </button>
          ) : null}
        </div>
      ) : null}
    </span>
  )
}
