import * as React from 'react'

import styles from './HomeLearningPathDiagram.module.css'

const GOAL_STEM = 'my goal is to '
const GOAL_FILLS = [
  'play a song on guitar',
  'become an aerospace engineer',
  'learn the history of art'
] as const
const GOAL_PLACEHOLDER = '...'

function goalForCycle(cycle: number) {
  return GOAL_FILLS[cycle % GOAL_FILLS.length] ?? GOAL_FILLS[0]
}

const TYPE_START_MS = 900
const TYPE_MS = 42
const AFTER_TYPE_MS = 380
const CONCEPT_APPEAR_MS = 340
const CONCEPT_ARROW_MS = 300
const CONCEPT_TAIL_MS = 220
const RESOURCE_SPACE_MS = 520
const RESOURCES_MS = 880
const RESOURCE_SWAP_STEP_MS = 600
const RESOURCE_SWAP_ANIM_MS = 520
const RESOURCE_LIST_MS = 520
const RESOURCE_NUMBER_MS = 380
const NOTES_MS = 700
const COMMIT_MS = 520
const ASK_MS = 420
const ASK_MENU_MS = 480
const ASK_CHOOSE_MS = 820
const ASK_SAVE_MS = 720
const NOTIFY_MS = 420
const REMINDER_MS = 520
const HOLD_MS = 4000
const FADE_MS = 420

const FREQUENCY_OPTIONS = ['Every day', 'Weekdays', 'Every Monday'] as const
const REMINDER_LABEL = 'Every day · 7:00 PM'

type Phase =
  | 'goal'
  | 'concepts'
  | 'resourceSpace'
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

const CONCEPT_COUNT = 3
const CONCEPT_STEP_FINAL = CONCEPT_COUNT * 2 - 1

function ConceptChain({ step }: { step: number }) {
  const items: React.ReactNode[] = []

  for (let index = 0; index < CONCEPT_COUNT; index += 1) {
    const conceptAt = index * 2 + 1
    const arrowAt = index * 2 + 2

    items.push(
      step >= conceptAt ? (
        <span
          key={`concept-${index}`}
          className={`${styles.chip} ${styles.chipConcept} ${styles.pop}`}
        >
          Concept
        </span>
      ) : (
        <span key={`concept-${index}`} />
      )
    )

    if (index < CONCEPT_COUNT - 1) {
      items.push(
        step >= arrowAt ? (
          <span key={`arrow-${index}`} className={styles.arrowSlot}>
            <span className={styles.arrowDraw}>
              <ArrowRight />
            </span>
          </span>
        ) : (
          <span key={`arrow-${index}`} />
        )
      )
    }
  }

  return <div className={styles.triple}>{items}</div>
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

type ResourceIconKind = 'video' | 'paper' | 'exercise' | 'book'

type ResourceCard = {
  id: string
  kind: ResourceIconKind
  popIndex: number
}

type ResourceColumn = {
  delay: number
  items: ResourceCard[]
  /** Indices are relative to the list after any earlier swaps. */
  swaps: [number, number][]
}

const RESOURCE_COLUMNS: ResourceColumn[] = [
  {
    delay: 40,
    items: [
      { id: 'r0a', kind: 'video', popIndex: 0 },
      { id: 'r0b', kind: 'paper', popIndex: 1 },
      { id: 'r0c', kind: 'exercise', popIndex: 2 }
    ],
    swaps: [
      [0, 2],
      [0, 1]
    ]
  },
  {
    delay: 120,
    items: [
      { id: 'r1a', kind: 'paper', popIndex: 0 },
      { id: 'r1b', kind: 'book', popIndex: 1 },
      { id: 'r1c', kind: 'video', popIndex: 2 }
    ],
    swaps: [
      [1, 2],
      [0, 2]
    ]
  },
  {
    delay: 200,
    items: [
      { id: 'r2a', kind: 'exercise', popIndex: 0 },
      { id: 'r2b', kind: 'video', popIndex: 1 },
      { id: 'r2c', kind: 'paper', popIndex: 2 }
    ],
    swaps: [
      [0, 1],
      [1, 2]
    ]
  }
]

const RESOURCE_SWAP_COUNT = RESOURCE_COLUMNS[0]?.swaps.length ?? 2

const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? React.useLayoutEffect : React.useEffect

function swapItems<T>(items: T[], left: number, right: number): T[] {
  const next = items.slice()
  const a = next[left]
  const b = next[right]
  if (a === undefined || b === undefined) return items
  next[left] = b
  next[right] = a
  return next
}

function orderedResources(
  items: readonly ResourceCard[],
  swapStep: number,
  swaps: readonly [number, number][]
): ResourceCard[] {
  let next = items.slice()
  const count = Math.max(0, Math.min(swapStep, swaps.length))
  for (let index = 0; index < count; index += 1) {
    const pair = swaps[index]
    if (!pair) continue
    next = swapItems(next, pair[0], pair[1])
  }
  return next
}

function ResourceKindIcon({ kind }: { kind: ResourceIconKind }) {
  return (
    <svg
      className={styles.resourceKindIcon}
      viewBox='0 0 12 12'
      fill='none'
      aria-hidden
    >
      {kind === 'video' ? (
        <>
          <rect
            x='1.15'
            y='2.4'
            width='9.7'
            height='7.2'
            rx='1.7'
            stroke='currentColor'
            strokeWidth='1.1'
          />
          <path d='M5.05 4.55v2.9L7.85 6 5.05 4.55Z' fill='currentColor' />
        </>
      ) : null}
      {kind === 'paper' ? (
        <>
          <path
            d='M3.2 1.7h4.15L8.85 4.2v6.1H3.2V1.7Z'
            stroke='currentColor'
            strokeWidth='1.1'
            strokeLinejoin='round'
          />
          <path
            d='M7.3 1.7V4.2h2.55'
            stroke='currentColor'
            strokeWidth='1.1'
            strokeLinejoin='round'
          />
          <path
            d='M4.55 6.15h2.85M4.55 7.85h2.85'
            stroke='currentColor'
            strokeWidth='1.1'
            strokeLinecap='round'
          />
        </>
      ) : null}
      {kind === 'exercise' ? (
        <>
          <rect
            x='1.9'
            y='1.9'
            width='8.2'
            height='8.2'
            rx='1.6'
            stroke='currentColor'
            strokeWidth='1.1'
          />
          <path
            d='M3.85 6.15l1.5 1.5 2.85-3.05'
            stroke='currentColor'
            strokeWidth='1.1'
            strokeLinecap='round'
            strokeLinejoin='round'
          />
        </>
      ) : null}
      {kind === 'book' ? (
        <path
          d='M6 3.05c-1.15-.7-2.45-.85-3.7-.35v6.35c1.25-.5 2.55-.35 3.7.35 1.15-.7 2.45-.85 3.7-.35V2.7c-1.25-.5-2.55-.35-3.7.35Z'
          stroke='currentColor'
          strokeWidth='1.1'
          strokeLinejoin='round'
        />
      ) : null}
    </svg>
  )
}

function ResourceStack({
  delay,
  asList,
  numbered,
  items,
  swapStep,
  swaps,
  enableFlip,
  visible
}: {
  delay: number
  asList: boolean
  numbered: boolean
  items: readonly ResourceCard[]
  swapStep: number
  swaps: readonly [number, number][]
  enableFlip: boolean
  visible: boolean
}) {
  const ordered = React.useMemo(
    () => orderedResources(items, swapStep, swaps),
    [items, swapStep, swaps]
  )
  const rootRef = React.useRef<HTMLSpanElement>(null)
  const prevRects = React.useRef<Map<string, DOMRect>>(new Map())
  const [entered, setEntered] = React.useState(false)
  const orderKey = ordered.map((item) => item.id).join(',')

  React.useEffect(() => {
    if (!visible) {
      setEntered(false)
      return
    }
    const appearMs = delay + 140 + 420 + 40
    const id = window.setTimeout(() => setEntered(true), appearMs)
    return () => window.clearTimeout(id)
  }, [delay, visible])

  useIsomorphicLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return

    const nodes = root.querySelectorAll<HTMLElement>('[data-resource-id]')
    const nextRects = new Map<string, DOMRect>()
    nodes.forEach((node) => {
      const id = node.dataset.resourceId
      if (!id) return
      nextRects.set(id, node.getBoundingClientRect())
    })

    if (enableFlip && visible && entered && swapStep > 0) {
      nextRects.forEach((rect, id) => {
        const prev = prevRects.current.get(id)
        const node = root.querySelector<HTMLElement>(
          `[data-resource-id="${id}"]`
        )
        if (!prev || !node) return
        const dy = prev.top - rect.top
        if (Math.abs(dy) < 1) return

        node.getAnimations().forEach((animation) => animation.cancel())

        const dx = dy > 0 ? 8 : -8
        node.classList.add(styles.chipResourceLift)
        const animation = node.animate(
          [
            { transform: `translateY(${dy}px)` },
            {
              transform: `translateY(${dy * 0.4}px) translateX(${dx}px) scale(1.06)`,
              offset: 0.42
            },
            { transform: 'none' }
          ],
          {
            duration: RESOURCE_SWAP_ANIM_MS,
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)'
          }
        )
        const clearLift = () => {
          node.classList.remove(styles.chipResourceLift)
        }
        animation.finished.then(clearLift, clearLift)
      })
    }

    prevRects.current = nextRects
  }, [enableFlip, entered, orderKey, swapStep, visible])

  return (
    <span
      ref={rootRef}
      className={`${styles.resourceStack}${
        asList ? ` ${styles.resourceStackAsList}` : ''
      }${numbered ? ` ${styles.resourceStackNumbered}` : ''}${
        visible ? '' : ` ${styles.resourceQuiet}`
      }`}
    >
      <span className={styles.resourceListTitle}>Resource list</span>
      {items.map((item) => {
        const visualIndex = ordered.findIndex((entry) => entry.id === item.id)
        const index = visualIndex < 0 ? 0 : visualIndex

        return (
          <span
            key={item.id}
            data-resource-id={item.id}
            className={`${styles.chip} ${styles.chipResource}${
              visible && !entered ? ` ${styles.fadePop}` : ''
            }`}
            style={{
              order: index,
              animationDelay:
                visible && !entered
                  ? `${delay + (2 - item.popIndex) * 70}ms`
                  : undefined,
              transitionDelay: numbered ? `${index * 70}ms` : undefined
            }}
          >
            <span
              className={styles.resourceNum}
              style={{
                transitionDelay: numbered ? `${index * 70}ms` : undefined
              }}
            >
              {index + 1}
            </span>
            Resource
            <ResourceKindIcon kind={item.kind} />
          </span>
        )
      })}
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
  const [conceptStep, setConceptStep] = React.useState(0)
  const [swapStep, setSwapStep] = React.useState(0)
  const [resourcesNumbered, setResourcesNumbered] = React.useState(false)
  const [commitPressed, setCommitPressed] = React.useState(false)
  const [reminderOn, setReminderOn] = React.useState(false)
  const [fading, setFading] = React.useState(false)
  const [holding, setHolding] = React.useState(false)
  const goalFillText = goalForCycle(cycle)

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
      setTyped(goalFillText)
      setAskStep(0)
      setConceptStep(CONCEPT_STEP_FINAL)
      setSwapStep(RESOURCE_SWAP_COUNT)
      setResourcesNumbered(true)
      setCommitPressed(false)
      setReminderOn(true)
      setFading(false)
    }
  }, [goalFillText, reduceMotion])

  React.useEffect(() => {
    if (inView || reduceMotion) return
    setHolding(false)
    setFading(false)
  }, [inView, reduceMotion])

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
    setConceptStep(0)
    setSwapStep(0)
    setResourcesNumbered(false)
    setCommitPressed(false)
    setReminderOn(false)
    setFading(false)
    setHolding(false)

    const typeDuration = goalFillText.length * TYPE_MS
    const tConcepts = TYPE_START_MS + typeDuration + AFTER_TYPE_MS
    const tConceptArrow1 = tConcepts + CONCEPT_APPEAR_MS
    const tConcept2 = tConceptArrow1 + CONCEPT_ARROW_MS
    const tConceptArrow2 = tConcept2 + CONCEPT_APPEAR_MS
    const tConcept3 = tConceptArrow2 + CONCEPT_ARROW_MS
    const tResourceSpace = tConcept3 + CONCEPT_TAIL_MS
    const tResources = tResourceSpace + RESOURCE_SPACE_MS
    const tSwap1 = tResources + RESOURCES_MS
    const tSwap2 = tSwap1 + RESOURCE_SWAP_STEP_MS
    const tResourceList = tSwap2 + RESOURCE_SWAP_STEP_MS
    const tNotes = tResourceList + RESOURCE_LIST_MS + RESOURCE_NUMBER_MS
    const tCommit = tNotes + NOTES_MS
    const tPress = tCommit + COMMIT_MS
    const tAsk = tPress + ASK_MS
    const tMenu = tAsk + ASK_MENU_MS
    const tChoose = tMenu + ASK_CHOOSE_MS
    const tSave = tChoose + ASK_SAVE_MS
    const tNotify = tSave + NOTIFY_MS
    const tReminder = tNotify + REMINDER_MS

    at(TYPE_START_MS, () => {
      const started = Date.now()
      const tick = window.setInterval(() => {
        if (cancelled) {
          window.clearInterval(tick)
          return
        }
        const count = Math.min(
          goalFillText.length,
          Math.floor((Date.now() - started) / TYPE_MS) + 1
        )
        setTyped(goalFillText.slice(0, count))
        if (count >= goalFillText.length) window.clearInterval(tick)
      }, TYPE_MS)
      ids.push(tick)
    })

    at(tConcepts, () => {
      setPhase('concepts')
      setConceptStep(1)
    })
    at(tConceptArrow1, () => setConceptStep(2))
    at(tConcept2, () => setConceptStep(3))
    at(tConceptArrow2, () => setConceptStep(4))
    at(tConcept3, () => setConceptStep(CONCEPT_STEP_FINAL))
    at(tResourceSpace, () => setPhase('resourceSpace'))
    at(tResources, () => setPhase('resources'))
    at(tSwap1, () => setSwapStep(1))
    at(tSwap2, () => setSwapStep(2))
    at(tResourceList, () => setPhase('resourceList'))
    at(tResourceList + RESOURCE_LIST_MS, () => setResourcesNumbered(true))
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
    at(tReminder, () => {
      setReminderOn(true)
      setHolding(true)
    })

    return () => {
      cancelled = true
      for (const id of ids) {
        window.clearTimeout(id)
        window.clearInterval(id)
      }
    }
  }, [cycle, goalFillText, inView, reduceMotion])

  React.useEffect(() => {
    if (!holding || reduceMotion || !inView) return

    const fadeId = window.setTimeout(() => {
      setFading(true)
    }, HOLD_MS)
    const restartId = window.setTimeout(() => {
      setHolding(false)
      setCycle((current) => current + 1)
    }, HOLD_MS + FADE_MS)

    return () => {
      window.clearTimeout(fadeId)
      window.clearTimeout(restartId)
    }
  }, [holding, reduceMotion, inView])

  const showConcepts = reduceMotion || conceptStep >= 1
  const showResourceSpace =
    reduceMotion ||
    phase === 'resourceSpace' ||
    phase === 'resources' ||
    phase === 'resourceList' ||
    phase === 'notes' ||
    phase === 'commit' ||
    phase === 'ask' ||
    phase === 'notify'
  const resourcesVisible =
    reduceMotion || (showResourceSpace && phase !== 'resourceSpace')
  const resourcesAsList =
    reduceMotion ||
    phase === 'resourceList' ||
    phase === 'notes' ||
    phase === 'commit' ||
    phase === 'ask' ||
    phase === 'notify'
  const numberedResources = reduceMotion || resourcesNumbered
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
    typed.length < goalFillText.length
  const goalFill =
    reduceMotion || (phase !== 'goal' && typed.length === 0)
      ? goalFillText
      : typed
  const showPlaceholder =
    !reduceMotion && phase === 'goal' && typed.length === 0

  return (
    <figure
      ref={rootRef}
      className={styles.layout}
      aria-label='Animated example of a learning path. A goal becomes connected concepts, with resources that are rearranged into an intentional order before they are numbered, plus notes, then a reminder. Decorative only; it does not create a path.'
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
            <Reveal open={showResourceSpace}>
              <div className={styles.triple}>
                {RESOURCE_COLUMNS.map((column, index) => (
                  <React.Fragment key={column.items[0]?.id ?? index}>
                    {index > 0 ? <span /> : null}
                    <ResourceStack
                      delay={column.delay}
                      asList={resourcesAsList}
                      numbered={numberedResources}
                      items={column.items}
                      swapStep={swapStep}
                      swaps={column.swaps}
                      enableFlip={!reduceMotion}
                      visible={resourcesVisible}
                    />
                  </React.Fragment>
                ))}
              </div>
              <div className={`${styles.triple} ${styles.lineRow}`}>
                {resourcesVisible ? (
                  <>
                    <ConnectorLine delay={80} from='concept-up' />
                    <span />
                    <ConnectorLine delay={160} from='concept-up' />
                    <span />
                    <ConnectorLine delay={240} from='concept-up' />
                  </>
                ) : (
                  <>
                    <span className={styles.lineSlot} />
                    <span />
                    <span className={styles.lineSlot} />
                    <span />
                    <span className={styles.lineSlot} />
                  </>
                )}
              </div>
            </Reveal>

            <Reveal open={showConcepts}>
              <ConceptChain
                step={reduceMotion ? CONCEPT_STEP_FINAL : conceptStep}
              />
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
              {committed ? <span className={styles.person}>Josh</span> : null}
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
