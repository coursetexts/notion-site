import * as React from 'react'

import { FormSelect } from '@/components/FormSelect'
import {
  LEARNING_PATH_REMINDER_FREQUENCY_OPTIONS,
  formatReminderTagLabel,
  listMyLearningPathCommitments,
  localReminderTimezone,
  reminderMinuteFromTimeInput,
  setLearningPathCommitted,
  setLearningPathReminder,
  timeInputFromReminderMinute,
  type LearningPathReminder,
  type LearningPathReminderFrequency
} from '@/lib/learning-path-commitments-db'

import styles from './LearningPath.module.css'

const DEFAULT_REMINDER_MINUTE = 12 * 60

export function LearningPathCommitRemindButton({
  targetKey,
  signedIn,
  onSignIn
}: {
  targetKey: string
  signedIn: boolean
  onSignIn: () => void
}) {
  const wrapRef = React.useRef<HTMLSpanElement>(null)
  const frequencyLabelId = React.useId()
  const [committed, setCommitted] = React.useState(false)
  const [reminder, setReminder] = React.useState<LearningPathReminder | null>(
    null
  )
  const [busy, setBusy] = React.useState(false)
  const [open, setOpen] = React.useState(false)
  const [openUp, setOpenUp] = React.useState(true)
  const [frequency, setFrequency] =
    React.useState<LearningPathReminderFrequency>(
      reminder?.frequency ?? 'daily'
    )
  const [timeValue, setTimeValue] = React.useState(
    timeInputFromReminderMinute(reminder?.minute ?? DEFAULT_REMINDER_MINUTE)
  )

  React.useEffect(() => {
    let alive = true
    void listMyLearningPathCommitments().then((rows) => {
      if (!alive) return
      const row = rows.find((item) => item.targetKey === targetKey)
      setCommitted(Boolean(row))
      setReminder(row?.reminder ?? null)
    })
    return () => {
      alive = false
    }
  }, [targetKey, signedIn])

  React.useEffect(() => {
    if (!open) return
    setFrequency(reminder?.frequency ?? 'daily')
    setTimeValue(
      timeInputFromReminderMinute(reminder?.minute ?? DEFAULT_REMINDER_MINUTE)
    )
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

  function toggleOpen() {
    if (busy) return
    if (!signedIn) {
      onSignIn()
      return
    }
    setOpen((prev) => !prev)
  }

  async function save() {
    if (busy) return
    if (!signedIn) {
      onSignIn()
      return
    }
    const nextReminder: LearningPathReminder = {
      frequency,
      minute: reminderMinuteFromTimeInput(timeValue),
      timezone: localReminderTimezone()
    }
    setBusy(true)
    const previousCommitted = committed
    const previousReminder = reminder
    setCommitted(true)
    setReminder(nextReminder)
    if (!previousCommitted) {
      const committedOk = await setLearningPathCommitted(targetKey, true)
      if (!committedOk) {
        setCommitted(previousCommitted)
        setReminder(previousReminder)
        setBusy(false)
        window.alert('Could not commit to this path.')
        return
      }
    }
    const reminderOk = await setLearningPathReminder(targetKey, nextReminder)
    if (!reminderOk) {
      setCommitted(previousCommitted)
      setReminder(previousReminder)
      setBusy(false)
      window.alert('Could not save this reminder.')
      return
    }
    setBusy(false)
    setOpen(false)
  }

  async function uncommit() {
    if (busy) return
    setBusy(true)
    const previousCommitted = committed
    const previousReminder = reminder
    setCommitted(false)
    setReminder(null)
    const ok = await setLearningPathCommitted(targetKey, false)
    if (!ok) {
      setCommitted(previousCommitted)
      setReminder(previousReminder)
      window.alert('Could not uncommit from this path.')
    }
    setBusy(false)
    setOpen(false)
  }

  const label = reminder
    ? formatReminderTagLabel(reminder)
    : committed
      ? 'Committed'
      : 'Commit & Remind Me'
  const saveLabel = committed ? 'Save reminder' : 'Commit & Remind Me'

  return (
    <span className={styles.commitRemindWrap} ref={wrapRef}>
      <button
        type='button'
        className={`${styles.ghostBtn} ${styles.commitRemindBtn}${
          committed ? ` ${styles.commitRemindBtnActive}` : ''
        }`}
        onClick={toggleOpen}
        disabled={busy}
        aria-haspopup='dialog'
        aria-expanded={open}
        aria-label={
          reminder
            ? `Edit reminder, ${label}`
            : committed
              ? 'Edit commitment reminder'
              : 'Commit and remind me'
        }
      >
        {label}
      </button>
      {open ? (
        <div
          className={`${styles.commitRemindPopover}${
            openUp ? ` ${styles.commitRemindPopoverUp}` : ''
          }`}
          role='dialog'
          aria-label='Commit and reminder'
        >
          <p className={styles.commitRemindTitle}>Commit & remind me</p>
          <div className={styles.commitRemindField}>
            <span id={frequencyLabelId}>Frequency</span>
            <FormSelect<LearningPathReminderFrequency>
              labelledBy={frequencyLabelId}
              value={frequency}
              options={LEARNING_PATH_REMINDER_FREQUENCY_OPTIONS}
              onChange={setFrequency}
              disabled={busy}
            />
          </div>
          <label className={styles.commitRemindField}>
            <span>Time</span>
            <input
              className={styles.commitRemindTime}
              type='time'
              value={timeValue}
              onChange={(event) => setTimeValue(event.target.value)}
            />
          </label>
          <button
            type='button'
            className={styles.commitRemindSave}
            onClick={() => void save()}
            disabled={busy}
          >
            {saveLabel}
          </button>
          {committed ? (
            <button
              type='button'
              className={styles.commitRemindRemove}
              onClick={() => void uncommit()}
              disabled={busy}
            >
              Uncommit
            </button>
          ) : null}
        </div>
      ) : null}
    </span>
  )
}
