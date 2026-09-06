import * as React from 'react'

import styles from './HomeLearningPathDiagram.module.css'

const GOAL_STEM = 'my goal is to '
const GOAL_FILL = 'play a song on guitar'
const GOAL_PLACEHOLDER = '...'

const TYPE_START_MS = 900
const TYPE_MS = 42
const AFTER_TYPE_MS = 380
const CONCEPTS_MS = 780
const RESOURCES_MS = 1000
const RESOURCE_LIST_MS = 720
const NOTES_MS = 700
const COMMIT_MS = 520
const ASK_MS = 420
const ASK_MENU_MS = 480
const ASK_CHOOSE_MS = 820
const ASK_SAVE_MS = 720
const NOTIFY_MS = 420
const REMINDER_MS = 520
const HOLD_MS = 2800
const FADE_MS = 420

const FREQUENCY_OPTIONS = ['Every day', 'Weekdays', 'Every Monday'] as const
const REMINDER_LABEL = 'Every day · 7:00 PM'

type Phase =
  | 'goal'
  | 'concepts'
  | 'resources'
  | 'resourceList'
  | 'notes'
  | 'commit'
  | 'ask'
  | 'notify'

function usePrefersReducedMotion() {
  const [reduced, setReduced] = React.useState(false)

  React.useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReduced(media.matches)
    sync()
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [])

  return reduced
}

function ArrowRight() {
  return (
    <svg
      className={styles.arrowRight}
      viewBox='0 0 16 10'
      fill='none'
      aria-hidden
    >
      <path
        d='M1 5h12M9.5 1.5L14 5l-4.5 3.5'
        stroke='currentColor'
        strokeWidth='1.4'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

function ConnectorLine({
  delay,
  from
}: {
  delay: number
  from: 'concept-up' | 'concept-down'
}) {
  return (
    <span className={styles.lineSlot}>
      <span
        className={`${styles.lineVertical} ${styles.lineGrow} ${
          from === 'concept-up' ? styles.lineFromBottom : styles.lineFromTop
        }`}
        style={{ animationDelay: `${delay}ms` }}
      />
    </span>
  )
}

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

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`${styles.chevron}${open ? ` ${styles.chevronOpen}` : ''}`}
      viewBox='0 0 12 12'
      fill='none'
      aria-hidden
    >
      <path
        d='M2.5 4.5L6 8l3.5-3.5'
        stroke='currentColor'
        strokeWidth='1.4'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg className={styles.check} viewBox='0 0 12 12' fill='none' aria-hidden>
      <path
        d='M2.5 6.2L5 8.7L9.5 3.5'
        stroke='currentColor'
        strokeWidth='1.4'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

function Reveal({
  open,
  children
}: {
  open: boolean
  children: React.ReactNode
}) {
  return (
    <div className={`${styles.reveal}${open ? ` ${styles.revealOpen}` : ''}`}>
      <div className={styles.revealInner}>{children}</div>
    </div>
  )
}

function ResourceStack({ delay, asList }: { delay: number; asList: boolean }) {
  return (
    <span
      className={`${styles.resourceStack}${
        asList ? ` ${styles.resourceStackAsList}` : ''
      }`}
    >
      <span className={styles.resourceListTitle}>Resource list</span>
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className={`${styles.chip} ${styles.chipResource} ${styles.pop}`}
          style={{ animationDelay: `${delay + (2 - index) * 70}ms` }}
        >
          <span className={styles.resourceNum}>{index + 1}</span>
          Resource
        </span>
      ))}
    </span>
  )
}

export function HomeLearningPathDiagram() {
  const reduceMotion = usePrefersReducedMotion()
  const rootRef = React.useRef<HTMLElement>(null)
  const [inView, setInView] = React.useState(false)
  const [cycle, setCycle] = React.useState(0)
  const [phase, setPhase] = React.useState<Phase>('goal')
  const [typed, setTyped] = React.useState('')
  const [askStep, setAskStep] = React.useState(0)
  const [commitPressed, setCommitPressed] = React.useState(false)
  const [reminderOn, setReminderOn] = React.useState(false)
  const [fading, setFading] = React.useState(false)

  React.useEffect(() => {
    const node = rootRef.current
    if (!node) return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        setInView(
          Boolean(entry?.isIntersecting && entry.intersectionRatio >= 0.32)
        )
      },
      { threshold: [0, 0.32, 0.6] }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  React.useEffect(() => {
    if (reduceMotion) {
      setPhase('notify')
      setTyped(GOAL_FILL)
      setAskStep(0)
      setCommitPressed(false)
      setReminderOn(true)
      setFading(false)
    }
  }, [reduceMotion])

  React.useEffect(() => {
    if (reduceMotion || !inView) return

    let cancelled = false
    const ids: number[] = []
    const at = (ms: number, fn: () => void) => {
      ids.push(window.setTimeout(fn, ms))
    }

    setPhase('goal')
    setTyped('')
    setAskStep(0)
    setCommitPressed(false)
    setReminderOn(false)
    setFading(false)

    const typeDuration = GOAL_FILL.length * TYPE_MS
    const tConcepts = TYPE_START_MS + typeDuration + AFTER_TYPE_MS
    const tResources = tConcepts + CONCEPTS_MS
    const tResourceList = tResources + RESOURCES_MS
    const tNotes = tResourceList + RESOURCE_LIST_MS
    const tCommit = tNotes + NOTES_MS
    const tPress = tCommit + COMMIT_MS
    const tAsk = tPress + ASK_MS
    const tMenu = tAsk + ASK_MENU_MS
    const tChoose = tMenu + ASK_CHOOSE_MS
    const tSave = tChoose + ASK_SAVE_MS
    const tNotify = tSave + NOTIFY_MS
    const tReminder = tNotify + REMINDER_MS
    const tFade = tReminder + HOLD_MS
    const tRestart = tFade + FADE_MS

    at(TYPE_START_MS, () => {
      const started = Date.now()
      const tick = window.setInterval(() => {
        if (cancelled) {
          window.clearInterval(tick)
          return
        }
        const count = Math.min(
          GOAL_FILL.length,
          Math.floor((Date.now() - started) / TYPE_MS) + 1
        )
        setTyped(GOAL_FILL.slice(0, count))
        if (count >= GOAL_FILL.length) window.clearInterval(tick)
      }, TYPE_MS)
      ids.push(tick)
    })

    at(tConcepts, () => setPhase('concepts'))
    at(tResources, () => setPhase('resources'))
    at(tResourceList, () => setPhase('resourceList'))
    at(tNotes, () => setPhase('notes'))
    at(tCommit, () => setPhase('commit'))
    at(tPress, () => setCommitPressed(true))
    at(tAsk, () => {
      setCommitPressed(false)
      setPhase('ask')
      setAskStep(0)
    })
    at(tMenu, () => setAskStep(1))
    at(tChoose, () => setAskStep(2))
    at(tSave, () => setAskStep(3))
    at(tNotify, () => {
      setPhase('notify')
      setAskStep(0)
    })
    at(tReminder, () => setReminderOn(true))
    at(tFade, () => setFading(true))
    at(tRestart, () => {
      if (!cancelled) setCycle((current) => current + 1)
    })

    return () => {
      cancelled = true
      for (const id of ids) {
        window.clearTimeout(id)
        window.clearInterval(id)
      }
    }
  }, [cycle, inView, reduceMotion])

  const showConcepts = reduceMotion || phase !== 'goal'
  const showResources =
    reduceMotion ||
    phase === 'resources' ||
    phase === 'resourceList' ||
    phase === 'notes' ||
    phase === 'commit' ||
    phase === 'ask' ||
    phase === 'notify'
  const resourcesAsList =
    reduceMotion ||
    phase === 'resourceList' ||
    phase === 'notes' ||
    phase === 'commit' ||
    phase === 'ask' ||
    phase === 'notify'
  const showNotes =
    reduceMotion ||
    phase === 'notes' ||
    phase === 'commit' ||
    phase === 'ask' ||
    phase === 'notify'
  const showCommit =
    reduceMotion || phase === 'commit' || phase === 'ask' || phase === 'notify'
  const showAsk = !reduceMotion && phase === 'ask'
  const showNotify = reduceMotion || phase === 'notify'
  const committed = showNotify
  const menuOpen = askStep === 1
  const frequencyChosen = askStep >= 2
  const savePressed = askStep >= 3
  const showCaret =
    !reduceMotion &&
    phase === 'goal' &&
    !fading &&
    typed.length < GOAL_FILL.length
  const goalFill =
    reduceMotion || (phase !== 'goal' && typed.length === 0) ? GOAL_FILL : typed
  const showPlaceholder =
    !reduceMotion && phase === 'goal' && typed.length === 0

  return (
    <figure
      ref={rootRef}
      className={styles.layout}
      aria-label='Animated example of a learning path. A goal becomes connected concepts, with resources and notes, then a reminder. Decorative only; it does not create a path.'
    >
      <div
        className={`${styles.stage}${fading ? ` ${styles.fading}` : ''}`}
        aria-hidden='true'
      >
        <div className={styles.box}>
          <p className={styles.label}>
            <strong>Learning Path:</strong>
            <em>
              {' '}
              {GOAL_STEM}
              {showPlaceholder ? GOAL_PLACEHOLDER : goalFill}
            </em>
            {showCaret ? <span className={styles.caret} /> : null}
          </p>

          <div className={styles.stack} key={cycle}>
            <Reveal open={showResources}>
              <div className={styles.triple}>
                <ResourceStack delay={40} asList={resourcesAsList} />
                <span />
                <ResourceStack delay={120} asList={resourcesAsList} />
                <span />
                <ResourceStack delay={200} asList={resourcesAsList} />
              </div>
              <div className={`${styles.triple} ${styles.lineRow}`}>
                <ConnectorLine delay={80} from='concept-up' />
                <span />
                <ConnectorLine delay={160} from='concept-up' />
                <span />
                <ConnectorLine delay={240} from='concept-up' />
              </div>
            </Reveal>

            <Reveal open={showConcepts}>
              <div className={styles.triple}>
                <span
                  className={`${styles.chip} ${styles.chipConcept} ${styles.pop}`}
                  style={{ animationDelay: '40ms' }}
                >
                  Concept
                </span>
                <span
                  className={styles.pop}
                  style={{ animationDelay: '120ms' }}
                >
                  <ArrowRight />
                </span>
                <span
                  className={`${styles.chip} ${styles.chipConcept} ${styles.pop}`}
                  style={{ animationDelay: '160ms' }}
                >
                  Concept
                </span>
                <span
                  className={styles.pop}
                  style={{ animationDelay: '240ms' }}
                >
                  <ArrowRight />
                </span>
                <span
                  className={`${styles.chip} ${styles.chipConcept} ${styles.pop}`}
                  style={{ animationDelay: '280ms' }}
                >
                  Concept
                </span>
              </div>
            </Reveal>

            <Reveal open={showNotes}>
              <div className={`${styles.triple} ${styles.lineRow}`}>
                <ConnectorLine delay={40} from='concept-down' />
                <span />
                <ConnectorLine delay={120} from='concept-down' />
                <span />
                <ConnectorLine delay={200} from='concept-down' />
              </div>
              <div className={styles.triple}>
                <span
                  className={`${styles.chip} ${styles.chipNotes} ${styles.pop}`}
                  style={{ animationDelay: '80ms' }}
                >
                  Notes
                </span>
                <span />
                <span
                  className={`${styles.chip} ${styles.chipNotes} ${styles.pop}`}
                  style={{ animationDelay: '160ms' }}
                >
                  Notes
                </span>
                <span />
                <span
                  className={`${styles.chip} ${styles.chipNotes} ${styles.pop}`}
                  style={{ animationDelay: '240ms' }}
                >
                  Notes
                </span>
              </div>
            </Reveal>
          </div>

          <Reveal open={showCommit}>
            <div className={styles.commitBar}>
              <span
                className={`${styles.commitTag}${
                  committed ? ` ${styles.commitTagOn}` : ''
                }${commitPressed ? ` ${styles.commitTagPressed}` : ''}`}
              >
                {committed ? 'Committed' : 'Commit'}
              </span>
              {showNotify ? (
                <span
                  className={`${styles.notifyTag}${
                    reminderOn ? ` ${styles.notifyTagOn}` : ''
                  }`}
                >
                  <BellIcon />
                  <span>{reminderOn ? REMINDER_LABEL : 'Notify'}</span>
                </span>
              ) : null}

              {showAsk ? (
                <div className={styles.popover}>
                  <p className={styles.popoverTitle}>
                    When do you want to learn this?
                  </p>
                  <div className={styles.field}>
                    <span>Frequency</span>
                    <div
                      className={`${styles.select}${
                        menuOpen ? ` ${styles.selectOpen}` : ''
                      }`}
                    >
                      <span
                        className={`${styles.selectLabel}${
                          frequencyChosen ? '' : ` ${styles.selectPlaceholder}`
                        }`}
                      >
                        {frequencyChosen ? 'Every day' : 'Choose'}
                      </span>
                      <ChevronIcon open={menuOpen} />
                    </div>
                    {menuOpen ? (
                      <div className={styles.menu}>
                        {FREQUENCY_OPTIONS.map((option, index) => (
                          <span
                            key={option}
                            className={`${styles.option}${
                              index === 0 ? ` ${styles.optionActive}` : ''
                            }`}
                          >
                            <span>{option}</span>
                            {index === 0 ? <CheckIcon /> : null}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <div className={styles.field}>
                    <span>Time</span>
                    <span className={styles.time}>7:00 PM</span>
                  </div>
                  <span
                    className={`${styles.save}${
                      savePressed ? ` ${styles.savePressed}` : ''
                    }`}
                  >
                    Commit & Remind Me
                  </span>
                </div>
              ) : null}
            </div>
          </Reveal>
        </div>
      </div>
    </figure>
  )
}
