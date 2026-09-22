import * as React from 'react'
import { useRouter } from 'next/router'

import { useAuthOptional } from '@/contexts/AuthContext'

import {
  mergeQueryIntoPath,
  sanitizeAuthRedirect,
  signInPageHref
} from '@/lib/auth-redirect'
import {
  clearLearningPathBuilderDraft,
  readLearningPathBuilderDraft,
  writeLearningPathBuilderDraft
} from '@/lib/learning-path-builder-draft'
import {
  listAllLearningPathSlugs,
  upsertOwnedLearningPath
} from '@/lib/learning-path-db'
import {
  type FilledLearningPath,
  outlineFromFilledLearningPath
} from '@/lib/learning-path-fill'
import { LEARNING_PATH_FILL_DAILY_LIMIT } from '@/lib/learning-path-fill-quota'
import {
  type LearningPathKind,
  type LearningPathOutlineConcept,
  type LearningPathOutlineStep,
  learningPathFromOutline,
  normalizeLearningPathPrerequisites,
  readStoredLearningPaths,
  writeStoredLearningPaths
} from '@/lib/learning-path-seed'
import {
  ensureUniqueSlug,
  slugifyLearningPathName
} from '@/lib/learning-path-slug'
import {
  PATHS_BASE,
  pathsLearningPathHref,
  pathsLearningPathsIndexHref
} from '@/lib/paths-routes'
import { getSupabaseClient } from '@/lib/supabase'

import { LearningPathFillOverlay } from './LearningPathFillOverlay'
import styles from './LearningPathBuilder.module.css'

let idSeq = 10

function newId(prefix: string) {
  idSeq += 1
  return `${prefix}-${idSeq}`
}

function emptySubconcept() {
  return { id: newId('s'), label: '', why: '' }
}

function emptyConcept(): LearningPathOutlineConcept {
  return {
    id: newId('c'),
    label: '',
    why: '',
    subconcepts: [emptySubconcept()]
  }
}

function emptyStep(): LearningPathOutlineStep {
  return {
    id: newId('st'),
    title: '',
    why: '',
    concepts: [emptyConcept()]
  }
}

function initialSteps(): LearningPathOutlineStep[] {
  return [
    {
      id: 'st-1',
      title: '',
      why: '',
      concepts: [
        {
          id: 'c-1',
          label: '',
          why: '',
          subconcepts: [{ id: 's-1', label: '', why: '' }]
        }
      ]
    },
    {
      id: 'st-2',
      title: '',
      why: '',
      concepts: [
        {
          id: 'c-2',
          label: '',
          why: '',
          subconcepts: [{ id: 's-2', label: '', why: '' }]
        }
      ]
    }
  ]
}

function PlusIcon() {
  return (
    <svg width='12' height='12' viewBox='0 0 12 12' fill='none' aria-hidden>
      <path
        d='M6 1.5V10.5M1.5 6H10.5'
        stroke='currentColor'
        strokeWidth='1.4'
        strokeLinecap='round'
      />
    </svg>
  )
}

function PencilIcon() {
  return (
    <svg width='14' height='14' viewBox='0 0 12 12' fill='none' aria-hidden>
      <path
        d='M7.35 1.85l2.8 2.8M2.15 9.55l2.45-.5 5.25-5.25a.8.8 0 0 0 0-1.13L8.53 1.35a.8.8 0 0 0-1.13 0L2.5 7.25 2.15 9.55Z'
        stroke='currentColor'
        strokeWidth='1.3'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

function WhyField({
  id,
  value,
  onChange,
  className
}: {
  id: string
  value: string
  onChange: (value: string) => void
  className?: string
}) {
  const editRef = React.useRef<HTMLDivElement | null>(null)
  const focusedRef = React.useRef(false)

  React.useEffect(() => {
    const el = editRef.current
    if (!el || focusedRef.current) return
    const current = (el.innerText || '')
      .replace(/\u00a0/g, ' ')
      .replace(/\n$/, '')
    if (current !== value) {
      el.textContent = value
    }
  }, [value])

  function readText() {
    const el = editRef.current
    if (!el) return value
    return (el.innerText || '').replace(/\u00a0/g, ' ').replace(/\n$/, '')
  }

  return (
    <div
      className={
        className ? `${styles.whyField} ${className}` : styles.whyField
      }
    >
      <p className={styles.whyCopy}>
        <strong className={styles.whyLead} id={`${id}-label`}>
          Why is this on the learning path:
        </strong>{' '}
        <span
          ref={editRef}
          id={id}
          className={styles.whyEditable}
          contentEditable
          suppressContentEditableWarning
          role='textbox'
          aria-multiline='true'
          aria-labelledby={`${id}-label`}
          data-placeholder='What this is, and why it belongs on the way to the goal.'
          onFocus={() => {
            focusedRef.current = true
          }}
          onBlur={() => {
            focusedRef.current = false
            onChange(readText())
          }}
          onInput={() => {
            onChange(readText())
          }}
        />
      </p>
    </div>
  )
}

function outlineContainsId(
  steps: LearningPathOutlineStep[],
  id: string
): boolean {
  for (const step of steps) {
    if (step.id === id) return true
    for (const concept of step.concepts) {
      if (concept.id === id) return true
      if (concept.subconcepts.some((sub) => sub.id === id)) return true
    }
  }
  return false
}

function resolveOutlineSelection(
  steps: LearningPathOutlineStep[],
  selectedId: string | null
): {
  id: string
  label: string
  why: string
  prerequisites: string[]
} | null {
  if (!steps.length) return null

  const matchId =
    selectedId && outlineContainsId(steps, selectedId)
      ? selectedId
      : steps[0].id

  for (const step of steps) {
    if (step.id === matchId) {
      return {
        id: step.id,
        label: step.title.trim() || 'Step title',
        why: step.why ?? '',
        prerequisites: normalizeLearningPathPrerequisites(step.prerequisites)
      }
    }
    for (const concept of step.concepts) {
      if (concept.id === matchId) {
        return {
          id: concept.id,
          label: concept.label.trim() || 'Untitled topic',
          why: concept.why ?? '',
          prerequisites: normalizeLearningPathPrerequisites(
            concept.prerequisites
          )
        }
      }
      for (const sub of concept.subconcepts) {
        if (sub.id === matchId) {
          return {
            id: sub.id,
            label: sub.label.trim() || 'Untitled sub-topic',
            why: sub.why ?? '',
            prerequisites: normalizeLearningPathPrerequisites(
              sub.prerequisites
            )
          }
        }
      }
    }
  }

  return {
    id: steps[0].id,
    label: steps[0].title.trim() || 'Step title',
    why: steps[0].why ?? '',
    prerequisites: normalizeLearningPathPrerequisites(steps[0].prerequisites)
  }
}

function AddNodeMenu({
  open,
  onToggle,
  onClose,
  onAddBelow,
  onAddAfter,
  label
}: {
  open: boolean
  onToggle: () => void
  onClose: () => void
  onAddBelow?: () => void
  onAddAfter: () => void
  label: string
}) {
  const wrapRef = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    if (!open) return
    function onPointerDown(event: MouseEvent) {
      if (!wrapRef.current?.contains(event.target as Node)) onClose()
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose])

  return (
    <div
      ref={wrapRef}
      className={styles.addMenuWrap}
      data-open={open ? 'true' : undefined}
    >
      <button
        type='button'
        className={styles.iconBtn}
        onClick={onToggle}
        aria-label={label}
        aria-haspopup='menu'
        aria-expanded={open}
      >
        <PlusIcon />
      </button>
      {open ? (
        <div className={styles.addMenu} role='menu'>
          {onAddBelow ? (
            <button
              type='button'
              role='menuitem'
              className={styles.addMenuItem}
              onClick={() => {
                onAddBelow()
                onClose()
              }}
            >
              Add a section below
            </button>
          ) : null}
          <button
            type='button'
            role='menuitem'
            className={styles.addMenuItem}
            onClick={() => {
              onAddAfter()
              onClose()
            }}
          >
            Add a section after
          </button>
        </div>
      ) : null}
    </div>
  )
}

export function LearningPathBuilder({
  initialGoal = '',
  initialKind = 'community'
}: {
  initialGoal?: string
  initialKind?: LearningPathKind
}) {
  const router = useRouter()
  const auth = useAuthOptional()
  const signedIn = Boolean(auth?.user)
  const needsSignIn = !auth?.isLoading && !signedIn
  const [goalDraft, setGoalDraft] = React.useState(initialGoal)
  const [goal, setGoal] = React.useState(initialGoal)
  const [editingTitle, setEditingTitle] = React.useState(false)
  const [titleEditDraft, setTitleEditDraft] = React.useState(initialGoal)
  const titleEditRef = React.useRef<HTMLSpanElement | null>(null)
  const skipTitleCommitRef = React.useRef(false)
  const [descriptionDraft, setDescriptionDraft] = React.useState('')
  const [editingDescription, setEditingDescription] = React.useState(false)
  const [descriptionEditDraft, setDescriptionEditDraft] = React.useState('')
  const descriptionEditRef = React.useRef<HTMLDivElement | null>(null)
  const skipDescriptionCommitRef = React.useRef(false)
  const [steps, setSteps] =
    React.useState<LearningPathOutlineStep[]>(initialSteps)
  const [filling, setFilling] = React.useState(false)
  const [fillError, setFillError] = React.useState<string | null>(null)
  const [openAddMenuId, setOpenAddMenuId] = React.useState<string | null>(null)
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const kind: LearningPathKind =
    initialKind === 'research' ? 'research' : 'community'
  const [draftReady, setDraftReady] = React.useState(false)

  const closeAddMenu = React.useCallback(() => {
    setOpenAddMenuId(null)
  }, [])

  const selected = resolveOutlineSelection(steps, selectedId)
  const [prerequisitesDraft, setPrerequisitesDraft] = React.useState('')

  React.useEffect(() => {
    if (!selected) {
      setPrerequisitesDraft('')
      return
    }
    setPrerequisitesDraft(selected.prerequisites.join('\n'))
  }, [selected?.id])

  React.useEffect(() => {
    if (!steps.length) {
      setSelectedId(null)
      return
    }
    if (selectedId && outlineContainsId(steps, selectedId)) return
    setSelectedId(steps[0].id)
  }, [steps, selectedId])

  React.useEffect(() => {
    const draft = readLearningPathBuilderDraft(initialGoal, kind)
    if (draft) {
      if (draft.goal) {
        setGoal(draft.goal)
        setGoalDraft(draft.goal)
        setTitleEditDraft(draft.goal)
      }
      if (draft.description) {
        setDescriptionDraft(draft.description)
        setDescriptionEditDraft(draft.description)
      }
      if (draft.steps.length) setSteps(draft.steps)
    }
    setDraftReady(true)
  }, [initialGoal, kind])

  React.useEffect(() => {
    if (!editingTitle) return
    const el = titleEditRef.current
    if (!el) return
    el.textContent = titleEditDraft
    el.focus()
    const selection = window.getSelection()
    if (!selection) return
    const range = document.createRange()
    range.selectNodeContents(el)
    range.collapse(false)
    selection.removeAllRanges()
    selection.addRange(range)
    // Only run when entering edit mode; draft is seeded in startTitleEdit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingTitle])

  React.useEffect(() => {
    if (!editingDescription) return
    const el = descriptionEditRef.current
    if (!el) return
    el.textContent = descriptionEditDraft
    el.focus()
    const selection = window.getSelection()
    if (!selection) return
    const range = document.createRange()
    range.selectNodeContents(el)
    range.collapse(false)
    selection.removeAllRanges()
    selection.addRange(range)
    // Only run when entering edit mode; draft is seeded in startDescriptionEdit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingDescription])

  function readTitleEditText() {
    return (titleEditRef.current?.textContent ?? titleEditDraft).replace(
      /\u00a0/g,
      ' '
    )
  }

  function readDescriptionEditText() {
    const el = descriptionEditRef.current
    if (!el) return descriptionEditDraft
    return el.innerText.replace(/\u00a0/g, ' ').replace(/\n$/, '')
  }

  React.useEffect(() => {
    if (!draftReady) return
    if (!goal.trim()) return
    writeLearningPathBuilderDraft({
      goal,
      kind,
      description: descriptionDraft,
      steps
    })
  }, [draftReady, goal, kind, descriptionDraft, steps])

  function closeBuilder() {
    void router.push(pathsLearningPathsIndexHref())
  }

  function replaceGoalInUrl(nextGoal: string) {
    void router.replace(
      {
        pathname: `${PATHS_BASE}/learning-path/new`,
        query: {
          goal: nextGoal,
          ...(kind === 'research' ? { kind: 'research' } : {})
        }
      },
      undefined,
      { shallow: true }
    )
  }

  function startTitleEdit() {
    setTitleEditDraft(goal)
    setEditingTitle(true)
  }

  function cancelTitleEdit() {
    skipTitleCommitRef.current = true
    setTitleEditDraft(goal)
    setEditingTitle(false)
  }

  function commitTitleEdit() {
    if (skipTitleCommitRef.current) {
      skipTitleCommitRef.current = false
      return
    }
    const next = readTitleEditText().trim()
    if (!next) {
      cancelTitleEdit()
      return
    }
    setGoal(next)
    setGoalDraft(next)
    setTitleEditDraft(next)
    setEditingTitle(false)
    replaceGoalInUrl(next)
  }

  function startDescriptionEdit() {
    setDescriptionEditDraft(descriptionDraft)
    setEditingDescription(true)
  }

  function cancelDescriptionEdit() {
    skipDescriptionCommitRef.current = true
    setDescriptionEditDraft(descriptionDraft)
    setEditingDescription(false)
  }

  function commitDescriptionEdit() {
    if (skipDescriptionCommitRef.current) {
      skipDescriptionCommitRef.current = false
      return
    }
    const next = readDescriptionEditText().trim()
    setDescriptionDraft(next)
    setDescriptionEditDraft(next)
    setEditingDescription(false)
  }

  function requestSignIn() {
    writeLearningPathBuilderDraft({
      goal: goal || goalDraft,
      kind,
      description: descriptionDraft,
      steps
    })
    const extra: Record<string, string> = {}
    const nextGoal = (goal || goalDraft).trim()
    if (nextGoal) extra.goal = nextGoal
    if (kind === 'research') extra.kind = 'research'
    const next =
      sanitizeAuthRedirect(
        mergeQueryIntoPath(`${PATHS_BASE}/learning-path/new`, extra)
      ) || `${PATHS_BASE}/learning-path/new`
    if (auth?.signInWithGoogle) {
      void auth.signInWithGoogle(next)
      return
    }
    void router.push(signInPageHref(next))
  }

  function handleGoalSubmit(event: React.FormEvent) {
    event.preventDefault()
    const next = goalDraft.trim()
    if (!next) return
    setGoal(next)
    void router.replace(
      {
        pathname: `${PATHS_BASE}/learning-path/new`,
        query: {
          goal: next,
          ...(kind === 'research' ? { kind: 'research' } : {})
        }
      },
      undefined,
      { shallow: true }
    )
  }

  function updateStep(
    stepId: string,
    updater: (step: LearningPathOutlineStep) => LearningPathOutlineStep
  ) {
    setSteps((prev) =>
      prev.map((step) => (step.id === stepId ? updater(step) : step))
    )
  }

  function addStep(afterId?: string) {
    setSteps((prev) => {
      const next = emptyStep()
      if (!afterId) return [...prev, next]
      const index = prev.findIndex((step) => step.id === afterId)
      if (index < 0) return [...prev, next]
      const stepsNext = [...prev]
      stepsNext.splice(index + 1, 0, next)
      return stepsNext
    })
  }

  function removeStep(stepId: string) {
    setSteps((prev) =>
      prev.length <= 1 ? prev : prev.filter((step) => step.id !== stepId)
    )
  }

  function addConcept(stepId: string, afterId?: string) {
    updateStep(stepId, (step) => {
      const next = emptyConcept()
      if (!afterId) return { ...step, concepts: [...step.concepts, next] }
      const index = step.concepts.findIndex((item) => item.id === afterId)
      const concepts = [...step.concepts]
      concepts.splice(index + 1, 0, next)
      return { ...step, concepts }
    })
  }

  function setConceptLabel(stepId: string, conceptId: string, label: string) {
    updateStep(stepId, (step) => ({
      ...step,
      concepts: step.concepts.map((item) =>
        item.id === conceptId ? { ...item, label } : item
      )
    }))
  }

  function setConceptWhy(stepId: string, conceptId: string, why: string) {
    updateStep(stepId, (step) => ({
      ...step,
      concepts: step.concepts.map((item) =>
        item.id === conceptId ? { ...item, why } : item
      )
    }))
  }

  function removeConcept(stepId: string, conceptId: string) {
    updateStep(stepId, (step) => ({
      ...step,
      concepts: step.concepts.filter((item) => item.id !== conceptId)
    }))
  }

  function addSubconcept(stepId: string, conceptId: string, afterId?: string) {
    updateStep(stepId, (step) => ({
      ...step,
      concepts: step.concepts.map((concept) => {
        if (concept.id !== conceptId) return concept
        const next = emptySubconcept()
        if (!afterId) {
          return { ...concept, subconcepts: [...concept.subconcepts, next] }
        }
        const index = concept.subconcepts.findIndex(
          (item) => item.id === afterId
        )
        const subconcepts = [...concept.subconcepts]
        subconcepts.splice(index + 1, 0, next)
        return { ...concept, subconcepts }
      })
    }))
  }

  function setSubconceptLabel(
    stepId: string,
    conceptId: string,
    subId: string,
    label: string
  ) {
    updateStep(stepId, (step) => ({
      ...step,
      concepts: step.concepts.map((concept) =>
        concept.id === conceptId
          ? {
              ...concept,
              subconcepts: concept.subconcepts.map((item) =>
                item.id === subId ? { ...item, label } : item
              )
            }
          : concept
      )
    }))
  }

  function setSubconceptWhy(
    stepId: string,
    conceptId: string,
    subId: string,
    why: string
  ) {
    updateStep(stepId, (step) => ({
      ...step,
      concepts: step.concepts.map((concept) =>
        concept.id === conceptId
          ? {
              ...concept,
              subconcepts: concept.subconcepts.map((item) =>
                item.id === subId ? { ...item, why } : item
              )
            }
          : concept
      )
    }))
  }

  function removeSubconcept(stepId: string, conceptId: string, subId: string) {
    updateStep(stepId, (step) => ({
      ...step,
      concepts: step.concepts.map((concept) =>
        concept.id === conceptId
          ? {
              ...concept,
              subconcepts: concept.subconcepts.filter(
                (item) => item.id !== subId
              )
            }
          : concept
      )
    }))
  }

  function setSelectedWhy(why: string) {
    if (!selected) return
    const id = selected.id
    for (const step of steps) {
      if (step.id === id) {
        updateStep(step.id, (current) => ({ ...current, why }))
        return
      }
      for (const concept of step.concepts) {
        if (concept.id === id) {
          setConceptWhy(step.id, concept.id, why)
          return
        }
        for (const sub of concept.subconcepts) {
          if (sub.id === id) {
            setSubconceptWhy(step.id, concept.id, sub.id, why)
            return
          }
        }
      }
    }
  }

  function setSelectedPrerequisites(raw: string) {
    if (!selected) return
    setPrerequisitesDraft(raw)
    const prerequisites = normalizeLearningPathPrerequisites(
      raw
        .split(/\n+/)
        .map((line) => line.replace(/^[-*•]\s*/, '').trim())
        .filter(Boolean)
    )
    const nextValue = prerequisites.length ? prerequisites : undefined
    const id = selected.id
    for (const step of steps) {
      if (step.id === id) {
        updateStep(step.id, (current) => ({
          ...current,
          prerequisites: nextValue
        }))
        return
      }
      for (const concept of step.concepts) {
        if (concept.id === id) {
          updateStep(step.id, (current) => ({
            ...current,
            concepts: current.concepts.map((item) =>
              item.id === concept.id
                ? { ...item, prerequisites: nextValue }
                : item
            )
          }))
          return
        }
        for (const sub of concept.subconcepts) {
          if (sub.id === id) {
            updateStep(step.id, (current) => ({
              ...current,
              concepts: current.concepts.map((item) =>
                item.id === concept.id
                  ? {
                      ...item,
                      subconcepts: item.subconcepts.map((row) =>
                        row.id === sub.id
                          ? { ...row, prerequisites: nextValue }
                          : row
                      )
                    }
                  : item
              )
            }))
            return
          }
        }
      }
    }
  }

  const canCreate = signedIn && steps.some((step) => step.title.trim())

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault()
    if (!signedIn) {
      requestSignIn()
      return
    }
    if (!goal || !canCreate) return
    const existing = await listAllLearningPathSlugs()
    const slug = ensureUniqueSlug(slugifyLearningPathName(goal), existing)
    const data = learningPathFromOutline({
      goal,
      slug,
      steps,
      summary: descriptionDraft.trim()
    })
    const id = await upsertOwnedLearningPath(data, { kind })
    const item = {
      id: id ?? `path-${Date.now()}`,
      goal,
      slug,
      data: id ? { ...data, id } : data,
      kind
    }
    writeStoredLearningPaths([
      item,
      ...readStoredLearningPaths().filter((row) => row.slug !== slug)
    ])
    void router.push(pathsLearningPathHref(slug))
    clearLearningPathBuilderDraft()
  }

  async function handleFillPath() {
    if (!goal.trim() || filling) return
    if (!signedIn) {
      requestSignIn()
      return
    }
    setFilling(true)
    setFillError(null)
    try {
      const supabase = getSupabaseClient()
      const session = supabase
        ? (await supabase.auth.getSession()).data.session
        : null
      const accessToken = session?.access_token
      if (!accessToken) {
        requestSignIn()
        setFillError('Sign in to auto-fill a learning path.')
        return
      }
      const response = await fetch('/api/fill-learning-path', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({ goal })
      })
      const payload = (await response.json()) as FilledLearningPath & {
        error?: string
      }
      if (response.status === 401) {
        requestSignIn()
        setFillError(payload.error || 'Sign in to auto-fill a learning path.')
        return
      }
      if (response.status === 429) {
        setFillError(
          payload.error ||
            `You've used all ${LEARNING_PATH_FILL_DAILY_LIMIT} auto-fills for today. Try again tomorrow.`
        )
        return
      }
      if (!response.ok) {
        setFillError(payload.error || 'Could not fill this path.')
        return
      }
      if (!payload.steps?.length) {
        setFillError('Could not read a path outline from the model.')
        return
      }
      setDescriptionDraft(payload.description || '')
      setSteps(outlineFromFilledLearningPath(payload, newId))
    } catch {
      setFillError('Could not fill this path. Try again.')
    } finally {
      setFilling(false)
    }
  }

  if (!goal) {
    return (
      <section className={styles.section} aria-label='New learning path'>
        <div className={styles.container}>
          <header className={styles.header}>
            <p className={styles.eyebrow}>New learning path</p>
            <div className={styles.titleRow}>
              <h1 className={styles.title}>What do you want to learn?</h1>
              <button
                type='button'
                className={styles.closeBtn}
                onClick={closeBuilder}
                aria-label='Close'
              >
                ×
              </button>
            </div>
            <p className={styles.lede}>
              The path starts from the intention. Work backward into the
              knowledge that would make you capable of it.
            </p>
          </header>
          <form className={styles.goalForm} onSubmit={handleGoalSubmit}>
            <label className={styles.field}>
              <span className={styles.label}>Your goal</span>
              <textarea
                className={styles.textarea}
                value={goalDraft}
                onChange={(event) => setGoalDraft(event.target.value)}
                placeholder='I want to…'
                rows={4}
                autoFocus
              />
            </label>
            <div className={styles.formActions}>
              <button
                type='button'
                className={styles.cancelBtn}
                onClick={closeBuilder}
              >
                Cancel
              </button>
              <button
                type='submit'
                className={styles.submitBtn}
                disabled={!goalDraft.trim()}
              >
                Continue
              </button>
            </div>
          </form>
        </div>
      </section>
    )
  }

  return (
    <section className={styles.section} aria-label='Build a learning path'>
      {needsSignIn ? (
        <div
          className={styles.signInCover}
          role='dialog'
          aria-modal='true'
          aria-labelledby='path-signin-title'
        >
          <div className={styles.signInCard}>
            <h2 id='path-signin-title' className={styles.signInTitle}>
              Please sign in
            </h2>
            <p className={styles.signInCopy}>
              Anyone can start from a goal. Building and saving the path needs a
              Coursetexts account.
            </p>
            <button
              type='button'
              className={styles.submitBtn}
              onClick={requestSignIn}
            >
              Sign in
            </button>
          </div>
        </div>
      ) : null}

      <form
        onSubmit={handleCreate}
        className={needsSignIn ? styles.formCovered : undefined}
        aria-hidden={needsSignIn}
      >
        <div className={styles.hero}>
          <div className={styles.container}>
            <header className={styles.header}>
              <p className={styles.eyebrow}>New learning path</p>
              <div className={styles.heroRow}>
                <div className={styles.titleCol}>
                  <div className={styles.titleRow}>
                    {editingTitle ? (
                      <h1 className={styles.title}>
                        <span aria-hidden>“</span>
                        <span
                          ref={titleEditRef}
                          className={styles.titleEditable}
                          contentEditable
                          suppressContentEditableWarning
                          role='textbox'
                          aria-label='Learning path title'
                          onInput={() => {
                            setTitleEditDraft(readTitleEditText())
                          }}
                          onBlur={commitTitleEdit}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              event.preventDefault()
                              commitTitleEdit()
                            }
                            if (event.key === 'Escape') {
                              event.preventDefault()
                              cancelTitleEdit()
                            }
                          }}
                        />
                        <span aria-hidden>”</span>
                      </h1>
                    ) : (
                      <>
                        <h1 className={styles.title}>“{goal}”</h1>
                        <button
                          type='button'
                          className={styles.titleEditBtn}
                          onClick={startTitleEdit}
                          aria-label='Edit learning path title'
                          title='Edit title'
                        >
                          <PencilIcon />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <div className={styles.descriptionBox}>
                  <div className={styles.descriptionHeader}>
                    <span className={styles.label}>Description</span>
                    {!editingDescription ? (
                      <button
                        type='button'
                        className={styles.titleEditBtn}
                        onClick={startDescriptionEdit}
                        aria-label='Edit description'
                        title='Edit description'
                      >
                        <PencilIcon />
                      </button>
                    ) : null}
                  </div>
                  {editingDescription ? (
                    <div
                      ref={descriptionEditRef}
                      className={styles.descriptionEditable}
                      contentEditable
                      suppressContentEditableWarning
                      role='textbox'
                      aria-multiline='true'
                      aria-label='Description'
                      data-placeholder='What is this path, and who is it for?'
                      onInput={() => {
                        setDescriptionEditDraft(readDescriptionEditText())
                      }}
                      onBlur={commitDescriptionEdit}
                      onKeyDown={(event) => {
                        if (event.key === 'Escape') {
                          event.preventDefault()
                          cancelDescriptionEdit()
                        }
                      }}
                    />
                  ) : (
                    <button
                      type='button'
                      className={
                        descriptionDraft.trim()
                          ? styles.descriptionText
                          : styles.descriptionPlaceholder
                      }
                      onClick={startDescriptionEdit}
                    >
                      {descriptionDraft.trim()
                        ? descriptionDraft
                        : 'What is this path, and who is it for?'}
                    </button>
                  )}
                </div>
              </div>
            </header>
          </div>
        </div>

        <div className={styles.panel}>
          <div className={styles.panelInner}>
            <div className={styles.intro}>
              <p className={styles.lede}>
                Let&apos;s build the path you will follow.
              </p>
              <p className={styles.llmHint}>
                Fill the outline from your goal, then edit anything that is off
                — steps, topics, and why each one is on the path.
              </p>
            </div>

            <div className={styles.outlineHead}>
              <div className={styles.outlineTitleRow}>
                <h2 className={styles.outlineTitle}>Path outline</h2>
                <button
                  type='button'
                  className={styles.fillPathBtn}
                  onClick={() => {
                    void handleFillPath()
                  }}
                  disabled={filling || !signedIn}
                  aria-busy={filling}
                >
                  Fill out this path for me
                </button>
              </div>
              {fillError ? (
                <p className={styles.fillError} role='alert'>
                  {fillError}
                </p>
              ) : null}
            </div>

            <div className={styles.builderWorkspace}>
              <div className={styles.outlinePane}>
                <div className={styles.steps}>
                  {steps.map((step, stepIndex) => (
                    <article key={step.id} className={styles.stepCard}>
                      <div
                        className={
                          selected?.id === step.id
                            ? `${styles.nodeRow} ${styles.nodeRowSelected}`
                            : styles.nodeRow
                        }
                        onClick={() => setSelectedId(step.id)}
                      >
                        <div className={styles.stepHeader}>
                          <input
                            className={styles.stepTitle}
                            value={step.title}
                            onFocus={() => setSelectedId(step.id)}
                            onChange={(event) =>
                              updateStep(step.id, (current) => ({
                                ...current,
                                title: event.target.value
                              }))
                            }
                            placeholder='Step title'
                            aria-label={`Step ${stepIndex + 1} title`}
                          />
                          <AddNodeMenu
                            open={openAddMenuId === `step-${step.id}`}
                            onToggle={() =>
                              setOpenAddMenuId((current) =>
                                current === `step-${step.id}`
                                  ? null
                                  : `step-${step.id}`
                              )
                            }
                            onClose={closeAddMenu}
                            onAddBelow={() => {
                              addConcept(step.id)
                              setSelectedId(step.id)
                            }}
                            onAddAfter={() => addStep(step.id)}
                            label={`Add under or after step ${stepIndex + 1}`}
                          />
                          <button
                            type='button'
                            className={styles.iconBtn}
                            onClick={() => removeStep(step.id)}
                            aria-label={`Remove step ${stepIndex + 1}`}
                            disabled={steps.length <= 1}
                          >
                            ×
                          </button>
                        </div>
                      </div>

                      {step.concepts.length > 0 ? (
                        <div className={styles.conceptTree}>
                          {step.concepts.map((concept, conceptIndex) => (
                            <div
                              key={concept.id}
                              className={styles.conceptBlock}
                            >
                              <div
                                className={
                                  selected?.id === concept.id
                                    ? `${styles.nodeRow} ${styles.nodeRowSelected}`
                                    : styles.nodeRow
                                }
                                onClick={() => setSelectedId(concept.id)}
                              >
                                <div className={styles.row}>
                                  <input
                                    className={styles.rowInput}
                                    value={concept.label}
                                    onFocus={() => setSelectedId(concept.id)}
                                    onChange={(event) =>
                                      setConceptLabel(
                                        step.id,
                                        concept.id,
                                        event.target.value
                                      )
                                    }
                                    placeholder='Add a topic…'
                                    aria-label={`Topic ${
                                      conceptIndex + 1
                                    } in step ${stepIndex + 1}`}
                                  />
                                  <AddNodeMenu
                                    open={
                                      openAddMenuId === `concept-${concept.id}`
                                    }
                                    onToggle={() =>
                                      setOpenAddMenuId((current) =>
                                        current === `concept-${concept.id}`
                                          ? null
                                          : `concept-${concept.id}`
                                      )
                                    }
                                    onClose={closeAddMenu}
                                    onAddBelow={() =>
                                      addSubconcept(step.id, concept.id)
                                    }
                                    onAddAfter={() =>
                                      addConcept(step.id, concept.id)
                                    }
                                    label={`Add under or after topic ${
                                      conceptIndex + 1
                                    }`}
                                  />
                                  <button
                                    type='button'
                                    className={styles.iconBtn}
                                    onClick={() =>
                                      removeConcept(step.id, concept.id)
                                    }
                                    aria-label='Remove topic'
                                  >
                                    ×
                                  </button>
                                </div>
                              </div>

                              {concept.subconcepts.length > 0 ? (
                                <div className={styles.subTree}>
                                  {concept.subconcepts.map((sub, subIndex) => (
                                    <div
                                      key={sub.id}
                                      className={styles.subItem}
                                    >
                                      <div
                                        className={
                                          selected?.id === sub.id
                                            ? `${styles.nodeRow} ${styles.nodeRowSelected}`
                                            : styles.nodeRow
                                        }
                                        onClick={() => setSelectedId(sub.id)}
                                      >
                                        <div className={styles.row}>
                                          <input
                                            className={styles.rowInput}
                                            value={sub.label}
                                            onFocus={() =>
                                              setSelectedId(sub.id)
                                            }
                                            onChange={(event) =>
                                              setSubconceptLabel(
                                                step.id,
                                                concept.id,
                                                sub.id,
                                                event.target.value
                                              )
                                            }
                                            placeholder='Optional sub-topic…'
                                            aria-label={`Sub-topic ${
                                              subIndex + 1
                                            } under topic ${
                                              conceptIndex + 1
                                            }`}
                                          />
                                          <AddNodeMenu
                                            open={
                                              openAddMenuId === `sub-${sub.id}`
                                            }
                                            onToggle={() =>
                                              setOpenAddMenuId((current) =>
                                                current === `sub-${sub.id}`
                                                  ? null
                                                  : `sub-${sub.id}`
                                              )
                                            }
                                            onClose={closeAddMenu}
                                            onAddAfter={() =>
                                              addSubconcept(
                                                step.id,
                                                concept.id,
                                                sub.id
                                              )
                                            }
                                            label={`Add after sub-topic ${
                                              subIndex + 1
                                            }`}
                                          />
                                          <button
                                            type='button'
                                            className={styles.iconBtn}
                                            onClick={() =>
                                              removeSubconcept(
                                                step.id,
                                                concept.id,
                                                sub.id
                                              )
                                            }
                                            aria-label='Remove sub-topic'
                                          >
                                            ×
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </article>
                  ))}
                </div>

                <button
                  type='button'
                  className={styles.addStep}
                  onClick={() => addStep()}
                >
                  <PlusIcon />
                  Add another step
                </button>
              </div>

              <aside className={styles.detailPane} aria-live='polite'>
                {selected ? (
                  <>
                    <h3 className={styles.detailTitle}>{selected.label}</h3>
                    <WhyField
                      key={selected.id}
                      id={`why-${selected.id}`}
                      value={selected.why}
                      onChange={setSelectedWhy}
                    />
                    <div className={styles.prerequisitesField}>
                      <p className={styles.prerequisitesLabel}>
                        Prerequisites
                      </p>
                      <p className={styles.prerequisitesHint}>
                        Background a layman needs that earlier steps on this
                        path do not already cover. One item per line. Leave blank
                        if none.
                      </p>
                      <textarea
                        className={styles.prerequisitesTextarea}
                        rows={4}
                        value={prerequisitesDraft}
                        onChange={(event) =>
                          setSelectedPrerequisites(event.target.value)
                        }
                        aria-label='Prerequisites'
                        placeholder='e.g. High-school algebra'
                      />
                    </div>
                  </>
                ) : (
                  <p className={styles.detailEmpty}>
                    Select a step or topic to write why it belongs on the
                    path.
                  </p>
                )}
              </aside>
            </div>

            <div className={styles.formActions}>
              <button
                type='button'
                className={styles.cancelBtn}
                onClick={closeBuilder}
              >
                Cancel
              </button>
              <button
                type='submit'
                className={styles.submitBtn}
                disabled={!canCreate}
              >
                Create this path
              </button>
            </div>
          </div>
        </div>
      </form>
      <LearningPathFillOverlay open={filling} />
    </section>
  )
}
