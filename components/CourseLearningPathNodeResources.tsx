import * as React from 'react'

import {
  COURSE_LEARNING_PATH_TOPIC_RESOURCE_KINDS,
  type CourseLearningPathTopicResource,
  type CourseLearningPathTopicResourceKind
} from '@/lib/course-learning-path-types'

import styles from './CourseLearningPath.module.css'
import { CourseLearningPathSectionToggle } from './CourseLearningPathLinkSection'
import { PlayIcon } from './CourseLearningPathSyllabusNav'

const EMPTY_DRAFT = {
  title: '',
  url: '',
  kind: 'article' as CourseLearningPathTopicResourceKind,
  passage: '',
  why: '',
  sequence: ''
}

interface CourseLearningPathNodeResourcesProps {
  nodeId: string
  items: CourseLearningPathTopicResource[]
  headingId?: string
  dbBacked?: boolean
  signedIn?: boolean
  onSignIn?: () => void
  onAdd?: (input: {
    nodeId: string
    kind: CourseLearningPathTopicResourceKind
    url?: string
    title?: string
    passage?: string
    why?: string
    suggestedPlacement?: number
  }) => Promise<boolean>
}

export function CourseLearningPathNodeResources({
  nodeId,
  items,
  headingId = 'topic-resources-heading',
  dbBacked = false,
  signedIn = false,
  onSignIn,
  onAdd
}: CourseLearningPathNodeResourcesProps) {
  const [open, setOpen] = React.useState(false)
  const [adding, setAdding] = React.useState(false)
  const [draft, setDraft] = React.useState(EMPTY_DRAFT)
  const [formError, setFormError] = React.useState<string | null>(null)
  const [submitting, setSubmitting] = React.useState(false)

  const maxPlacement = items.length + 1

  React.useEffect(() => {
    setOpen(false)
    setAdding(false)
    setDraft(EMPTY_DRAFT)
    setFormError(null)
  }, [nodeId])

  React.useEffect(() => {
    if (!signedIn) setAdding(false)
  }, [signedIn])

  React.useEffect(() => {
    if (draft.sequence === '') return
    const n = Number(draft.sequence)
    if (Number.isFinite(n) && n > maxPlacement) {
      setDraft((prev) => ({ ...prev, sequence: String(maxPlacement) }))
    }
  }, [draft.sequence, maxPlacement])

  function resetForm() {
    setAdding(false)
    setDraft(EMPTY_DRAFT)
    setFormError(null)
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    if (!signedIn) {
      onSignIn?.()
      return
    }
    const title = draft.title.trim()
    const passage = draft.passage.trim()
    if (!title || !passage) {
      setFormError('Title and the part that helped are required.')
      return
    }

    const url = draft.url.trim()
    if (url) {
      try {
        // eslint-disable-next-line no-new
        new URL(url.startsWith('http') ? url : `https://${url}`)
      } catch {
        setFormError('Enter a valid URL.')
        return
      }
    }

    let suggestedPlacement = maxPlacement
    if (draft.sequence.trim() !== '') {
      const n = Number(draft.sequence)
      if (!Number.isFinite(n) || !Number.isInteger(n)) {
        setFormError(
          `Suggested order must be a whole number from 1 to ${maxPlacement}.`
        )
        return
      }
      if (n < 1 || n > maxPlacement) {
        setFormError(`Suggested order must be between 1 and ${maxPlacement}.`)
        return
      }
      suggestedPlacement = n
    }

    if (!onAdd) return
    setSubmitting(true)
    const normalized = url
      ? url.startsWith('http')
        ? url
        : `https://${url}`
      : undefined
    const ok = await onAdd({
      nodeId,
      kind: draft.kind,
      url: normalized,
      title,
      passage,
      why: draft.why.trim() || undefined,
      suggestedPlacement
    })
    setSubmitting(false)
    if (!ok) {
      setFormError(
        dbBacked
          ? 'Could not save this resource. Try again.'
          : 'Could not add this resource.'
      )
      return
    }
    resetForm()
  }

  return (
    <section aria-labelledby={headingId}>
      <div
        className={`${styles.videosHeader}${
          open ? '' : ` ${styles.videosHeaderCollapsed}`
        }`}
      >
        <h2 id={headingId} className={styles.videosTitle}>
          <span style={{ color: '#0089c4', display: 'inline-flex' }}>
            <PlayIcon size={20} />
          </span>
          Resources
        </h2>
        <div className={styles.videosHeaderActions}>
          {items.length > 0 && !adding ? (
            <span className={styles.videosMeta}>
              {items.length} {items.length === 1 ? 'resource' : 'resources'} · in
              order
            </span>
          ) : null}
          {!adding ? (
            <button
              type='button'
              className={`${styles.addResourceBtn}${
                !signedIn ? ` ${styles.addResourceBtnDisabled}` : ''
              }`}
              aria-disabled={!signedIn}
              title={signedIn ? undefined : 'Sign in to add a resource'}
              onClick={() => {
                if (!signedIn) {
                  onSignIn?.()
                  return
                }
                setAdding(true)
                setOpen(true)
              }}
            >
              + Add a resource
            </button>
          ) : null}
          <CourseLearningPathSectionToggle
            open={open}
            label='Resources'
            onToggle={() => {
              setOpen((value) => {
                const next = !value
                if (!next) resetForm()
                return next
              })
            }}
          />
        </div>
      </div>

      {open ? (
        <div className={styles.topicResourcesBody}>
          {items.length > 0 ? (
            <p className={styles.topicResourcesLead}>
              {items.length} {items.length === 1 ? 'resource' : 'resources'} · in
              order
            </p>
          ) : !adding ? (
            <p className={styles.topicResourcesEmpty}>
              Nothing here yet. When something makes this click, add it in the
              order you would study it.
            </p>
          ) : null}

          {adding ? (
            <form className={styles.topicResourceForm} onSubmit={handleAdd}>
              <label className={styles.topicResourceLabel}>
                Title
                <input
                  className={styles.topicResourceInput}
                  value={draft.title}
                  onChange={(event) =>
                    setDraft((prev) => ({ ...prev, title: event.target.value }))
                  }
                  placeholder='The Illustrated Transformer'
                  required
                />
              </label>
              <label className={styles.topicResourceLabel}>
                URL
                <input
                  className={styles.topicResourceInput}
                  type='url'
                  value={draft.url}
                  onChange={(event) =>
                    setDraft((prev) => ({ ...prev, url: event.target.value }))
                  }
                  placeholder='https://…'
                />
              </label>
              <label className={styles.topicResourceLabel}>
                Type
                <select
                  className={styles.topicResourceInput}
                  value={draft.kind}
                  onChange={(event) =>
                    setDraft((prev) => ({
                      ...prev,
                      kind: event.target.value as CourseLearningPathTopicResourceKind
                    }))
                  }
                >
                  {COURSE_LEARNING_PATH_TOPIC_RESOURCE_KINDS.map((kind) => (
                    <option key={kind} value={kind}>
                      {kind}
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.topicResourceLabel}>
                The part that helped
                <input
                  className={styles.topicResourceInput}
                  value={draft.passage}
                  onChange={(event) =>
                    setDraft((prev) => ({
                      ...prev,
                      passage: event.target.value
                    }))
                  }
                  placeholder='e.g. the QKV diagram, 12:40–14:10, chapter 4'
                  required
                />
              </label>
              <label className={styles.topicResourceLabel}>
                Why it helped
                <textarea
                  className={styles.topicResourceNote}
                  rows={3}
                  value={draft.why}
                  onChange={(event) =>
                    setDraft((prev) => ({ ...prev, why: event.target.value }))
                  }
                  placeholder='What did this specific part make click?'
                />
              </label>
              <label className={styles.topicResourceLabel}>
                Suggested order
                <span className={styles.placementRow}>
                  <input
                    className={`${styles.topicResourceInput} ${styles.placementInput}`}
                    type='number'
                    inputMode='numeric'
                    min={1}
                    max={maxPlacement}
                    step={1}
                    value={draft.sequence}
                    onChange={(event) =>
                      setDraft((prev) => ({
                        ...prev,
                        sequence: event.target.value
                      }))
                    }
                    placeholder={String(maxPlacement)}
                  />
                  <span className={styles.placementHint}>
                    1–{maxPlacement}
                    {items.length === 0
                      ? ' (first resource)'
                      : ` · blank = end (${maxPlacement})`}
                  </span>
                </span>
              </label>
              {formError ? <p className={styles.formError}>{formError}</p> : null}
              <div className={styles.topicResourceFormActions}>
                <button
                  type='button'
                  className={styles.topicResourceCancel}
                  onClick={resetForm}
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  className={styles.topicResourceSubmit}
                  disabled={
                    submitting || !draft.title.trim() || !draft.passage.trim()
                  }
                >
                  {submitting ? 'Saving…' : 'Save resource'}
                </button>
              </div>
            </form>
          ) : null}

          {items.length > 0 ? (
            <ol className={styles.topicResourceList}>
              {items.map((resource) => {
                const inner = (
                  <>
                    <span className={styles.topicResourcePos}>
                      {resource.position}
                    </span>
                    <div className={styles.topicResourceBody}>
                      <p className={styles.topicResourceKind}>{resource.kind}</p>
                      <p className={styles.topicResourceTitle}>
                        {resource.title}
                      </p>
                      {resource.passage ? (
                        <p className={styles.topicResourcePassage}>
                          {resource.passage}
                        </p>
                      ) : null}
                      {resource.why ? (
                        <p className={styles.topicResourceWhy}>{resource.why}</p>
                      ) : null}
                    </div>
                  </>
                )
                return (
                  <li key={resource.id}>
                    {resource.url ? (
                      <a
                        className={styles.topicResource}
                        href={resource.url}
                        target='_blank'
                        rel='noopener noreferrer'
                      >
                        {inner}
                      </a>
                    ) : (
                      <div className={styles.topicResource}>{inner}</div>
                    )}
                  </li>
                )
              })}
            </ol>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}
