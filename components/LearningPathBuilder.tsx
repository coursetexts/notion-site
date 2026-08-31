import * as React from 'react'
import { useRouter } from 'next/router'

import {
  outlineFromFilledLearningPath,
  type FilledLearningPath
} from '@/lib/learning-path-fill'
import {
  type LearningPathKind,
  type LearningPathOutlineConcept,
  type LearningPathOutlineStep,
  learningPathFromOutline,
  readStoredLearningPaths,
  writeStoredLearningPaths
} from '@/lib/learning-path-seed'
import {
  listAllLearningPathSlugs,
  upsertOwnedLearningPath
} from '@/lib/learning-path-db'
import {
  ensureUniqueSlug,
  slugifyLearningPathName
} from '@/lib/learning-path-slug'

import styles from './LearningPathBuilder.module.css'

const ROMANS = [
  'i',
  'ii',
  'iii',
  'iv',
  'v',
  'vi',
  'vii',
  'viii',
  'ix',
  'x'
]

let idSeq = 10

function newId(prefix: string) {
  idSeq += 1
  return `${prefix}-${idSeq}`
}

function letterMark(index: number) {
  return String.fromCharCode(97 + (index % 26))
}

function romanMark(index: number) {
  return ROMANS[index] ?? String(index + 1)
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

function WhyField({
  id,
  value,
  onChange
}: {
  id: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className={styles.whyField} htmlFor={id}>
      <span className={styles.whyLabel}>Why is this on the learning path</span>
      <textarea
        id={id}
        className={styles.whyTextarea}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder='What this is, and why it belongs on the way to the goal.'
        rows={2}
      />
    </label>
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
  const [goalDraft, setGoalDraft] = React.useState(initialGoal)
  const [goal, setGoal] = React.useState(initialGoal)
  const [descriptionDraft, setDescriptionDraft] = React.useState('')
  const [steps, setSteps] = React.useState<LearningPathOutlineStep[]>(initialSteps)
  const [filling, setFilling] = React.useState(false)
  const [fillError, setFillError] = React.useState<string | null>(null)
  const kind: LearningPathKind =
    initialKind === 'research' ? 'research' : 'community'

  function closeBuilder() {
    void router.push('/learning-paths')
  }

  function handleGoalSubmit(event: React.FormEvent) {
    event.preventDefault()
    const next = goalDraft.trim()
    if (!next) return
    setGoal(next)
    void router.replace(
      {
        pathname: '/learning-path/new',
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

  function addStep() {
    setSteps((prev) => [...prev, emptyStep()])
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

  function addSubconcept(stepId: string, conceptId: string, afterId?: string) {
    updateStep(stepId, (step) => ({
      ...step,
      concepts: step.concepts.map((concept) => {
        if (concept.id !== conceptId) return concept
        const next = emptySubconcept()
        if (!afterId) {
          return { ...concept, subconcepts: [...concept.subconcepts, next] }
        }
        const index = concept.subconcepts.findIndex((item) => item.id === afterId)
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

  const canCreate = steps.some((step) => step.title.trim())

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault()
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
    void router.push(`/learning-path/${slug}`)
  }

  async function handleFillPath() {
    if (!goal.trim() || filling) return
    setFilling(true)
    setFillError(null)
    try {
      const response = await fetch('/api/fill-learning-path', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal })
      })
      const payload = (await response.json()) as FilledLearningPath & {
        error?: string
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
      <div className={styles.container}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>New learning path</p>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>“{goal}”</h1>
            <button
              type='button'
              className={styles.closeBtn}
              onClick={closeBuilder}
              aria-label='Close'
            >
              ×
            </button>
          </div>
          <p className={styles.lede}>Build the path you will follow.</p>
          <p className={styles.llmHint}>
            Fill the outline from your goal, then edit anything that is off —
            steps, concepts, and why each one is on the path.
          </p>
        </header>

        <form onSubmit={handleCreate}>
          <div className={styles.outlineHead}>
            <div className={styles.outlineTitleRow}>
              <h2 className={styles.outlineTitle}>Path outline</h2>
              <button
                type='button'
                className={styles.fillPathBtn}
                onClick={() => {
                  void handleFillPath()
                }}
                disabled={filling}
                aria-busy={filling}
              >
                {filling ? 'Filling…' : 'Fill out this path for me'}
              </button>
            </div>
            {fillError ? (
              <p className={styles.fillError} role='alert'>
                {fillError}
              </p>
            ) : null}
            <div className={styles.colLabels} aria-hidden>
              <span>Step</span>
              <span>Concepts needed</span>
            </div>
          </div>

          <div className={styles.steps}>
            {steps.map((step, stepIndex) => (
              <article key={step.id} className={styles.stepCard}>
                <div className={styles.stepHeader}>
                  <span className={styles.stepBadge} aria-hidden>
                    {stepIndex + 1}
                  </span>
                  <input
                    className={styles.stepTitle}
                    value={step.title}
                    onChange={(event) =>
                      updateStep(step.id, (current) => ({
                        ...current,
                        title: event.target.value
                      }))
                    }
                    placeholder={`Step ${stepIndex + 1} title`}
                    aria-label={`Step ${stepIndex + 1} title`}
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

                <WhyField
                  id={`why-${step.id}`}
                  value={step.why ?? ''}
                  onChange={(why) =>
                    updateStep(step.id, (current) => ({ ...current, why }))
                  }
                />

                <div className={styles.conceptTree}>
                  {step.concepts.map((concept, conceptIndex) => (
                    <div key={concept.id} className={styles.conceptBlock}>
                      <div className={styles.row}>
                        <span className={styles.mark} aria-hidden>
                          {letterMark(conceptIndex)})
                        </span>
                        <input
                          className={styles.rowInput}
                          value={concept.label}
                          onChange={(event) =>
                            setConceptLabel(
                              step.id,
                              concept.id,
                              event.target.value
                            )
                          }
                          placeholder='Add a concept…'
                          aria-label={`Concept ${letterMark(conceptIndex)} in step ${
                            stepIndex + 1
                          }`}
                        />
                        <button
                          type='button'
                          className={styles.iconBtn}
                          onClick={() => addConcept(step.id, concept.id)}
                          aria-label='Add concept'
                        >
                          <PlusIcon />
                        </button>
                      </div>

                      <WhyField
                        id={`why-${concept.id}`}
                        value={concept.why ?? ''}
                        onChange={(why) =>
                          setConceptWhy(step.id, concept.id, why)
                        }
                      />

                      <div className={styles.subTree}>
                        {concept.subconcepts.map((sub, subIndex) => (
                          <div key={sub.id} className={styles.subItem}>
                            <div className={styles.row}>
                              <span className={styles.mark} aria-hidden>
                                {romanMark(subIndex)})
                              </span>
                              <input
                                className={styles.rowInput}
                                value={sub.label}
                                onChange={(event) =>
                                  setSubconceptLabel(
                                    step.id,
                                    concept.id,
                                    sub.id,
                                    event.target.value
                                  )
                                }
                                placeholder='Optional sub-concept…'
                                aria-label={`Sub-concept ${romanMark(subIndex)} under ${
                                  letterMark(conceptIndex)
                                }`}
                              />
                              <button
                                type='button'
                                className={styles.iconBtn}
                                onClick={() =>
                                  addSubconcept(step.id, concept.id, sub.id)
                                }
                                aria-label='Add sub-concept'
                              >
                                <PlusIcon />
                              </button>
                            </div>
                            {sub.label.trim() || (sub.why ?? '').trim() ? (
                              <WhyField
                                id={`why-${sub.id}`}
                                value={sub.why ?? ''}
                                onChange={(why) =>
                                  setSubconceptWhy(
                                    step.id,
                                    concept.id,
                                    sub.id,
                                    why
                                  )
                                }
                              />
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type='button'
                  className={styles.addConcept}
                  onClick={() => addConcept(step.id)}
                >
                  <PlusIcon />
                  Add concept to step {stepIndex + 1}
                </button>
              </article>
            ))}
          </div>

          <button type='button' className={styles.addStep} onClick={addStep}>
            <PlusIcon />
            Add another step
          </button>

          <label className={`${styles.field} ${styles.descriptionField}`}>
            <span className={styles.label}>Description</span>
            <textarea
              className={styles.textarea}
              value={descriptionDraft}
              onChange={(event) => setDescriptionDraft(event.target.value)}
              placeholder='What is this path, and who is it for?'
              rows={4}
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
              disabled={!canCreate}
            >
              Create this path
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}
