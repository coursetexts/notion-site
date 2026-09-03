import * as React from 'react'

import { pathResourceReportId } from '@/lib/content-reports'
import {
  COURSE_LEARNING_PATH_TOPIC_RESOURCE_KINDS,
  type CourseLearningPathTopicResource,
  type CourseLearningPathTopicResourceKind
} from '@/lib/course-learning-path-types'
import { learningPathHref } from '@/lib/learning-path-bookmark-link'

import styles from './CourseLearningPath.module.css'
import { CourseLearningPathSectionToggle } from './CourseLearningPathLinkSection'
import { PlayIcon } from './CourseLearningPathSyllabusNav'
import { FormSelect } from './FormSelect'
import { ReportButton, reportHoverTargetClass } from './ReportButton'

const EMPTY_DRAFT = {
  title: '',
  url: '',
  kind: 'article' as CourseLearningPathTopicResourceKind,
  passage: '',
  why: '',
  sequence: ''
}

const RESOURCE_KIND_OPTIONS = COURSE_LEARNING_PATH_TOPIC_RESOURCE_KINDS.map(
  (kind) => ({
    value: kind,
    label: kind.charAt(0).toUpperCase() + kind.slice(1)
  })
)

function ResourceEditPencilIcon() {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='13'
      height='13'
      viewBox='0 0 14 14'
      fill='none'
      aria-hidden
    >
      <path
        d='M8.6 2.2l3.2 3.2M3 11.2l2.9-.6 6.1-6.1a.9.9 0 0 0 0-1.3L10.8 2a.9.9 0 0 0-1.3 0L3.4 8.1 3 11.2Z'
        stroke='currentColor'
        strokeWidth='1.2'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

export type CourseLearningPathTopicResourceInput = {
  nodeId: string
  kind: CourseLearningPathTopicResourceKind
  url?: string
  title?: string
  passage?: string
  why?: string
  suggestedPlacement?: number
}

interface CourseLearningPathNodeResourcesProps {
  nodeId: string
  items: CourseLearningPathTopicResource[]
  headingId?: string
  dbBacked?: boolean
  signedIn?: boolean
  onSignIn?: () => void
  pathSlug?: string
  pathTitle?: string
  onAdd?: (input: CourseLearningPathTopicResourceInput) => Promise<boolean>
  onUpdate?: (
    input: CourseLearningPathTopicResourceInput & { resourceId: string }
  ) => Promise<boolean>
}

export function CourseLearningPathNodeResources({
  nodeId,
  items,
  headingId = 'topic-resources-heading',
  dbBacked = false,
  signedIn = false,
  onSignIn,
  pathSlug,
  pathTitle,
  onAdd,
  onUpdate
}: CourseLearningPathNodeResourcesProps) {
  const [open, setOpen] = React.useState(true)
  const [adding, setAdding] = React.useState(false)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [draft, setDraft] = React.useState(EMPTY_DRAFT)
  const [formError, setFormError] = React.useState<string | null>(null)
  const [submitting, setSubmitting] = React.useState(false)

  const formOpen = adding || Boolean(editingId)
  const maxPlacement = editingId ? Math.max(items.length, 1) : items.length + 1
  const editingResource = editingId
    ? items.find((item) => item.id === editingId)
    : undefined

  React.useEffect(() => {
    setOpen(true)
    setAdding(false)
    setEditingId(null)
    setDraft(EMPTY_DRAFT)
    setFormError(null)
  }, [nodeId])

  React.useEffect(() => {
    if (!signedIn) {
      setAdding(false)
      setEditingId(null)
    }
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
    setEditingId(null)
    setDraft(EMPTY_DRAFT)
    setFormError(null)
  }

  function openEdit(resource: CourseLearningPathTopicResource) {
    if (!signedIn) {
      onSignIn?.()
      return
    }
    setAdding(false)
    setEditingId(resource.id)
    setDraft({
      title: resource.title,
      url: resource.url ?? '',
      kind: resource.kind,
      passage: resource.passage ?? '',
      why: resource.why ?? '',
      sequence: String(resource.position)
    })
    setFormError(null)
    setOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
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

    let suggestedPlacement = editingId
      ? editingResource?.position ?? maxPlacement
      : maxPlacement
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

    const normalized = url
      ? url.startsWith('http')
        ? url
        : `https://${url}`
      : undefined
    const payload: CourseLearningPathTopicResourceInput = {
      nodeId,
      kind: draft.kind,
      url: normalized,
      title,
      passage,
      why: draft.why.trim() || undefined,
      suggestedPlacement
    }

    setSubmitting(true)
    let ok = false
    if (editingId) {
      if (!onUpdate) {
        setSubmitting(false)
        return
      }
      ok = await onUpdate({ ...payload, resourceId: editingId })
    } else {
      if (!onAdd) {
        setSubmitting(false)
        return
      }
      ok = await onAdd(payload)
    }
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
          {items.length > 0 ? (
            <span className={styles.videosMeta}>
              {items.length} {items.length === 1 ? 'resource' : 'resources'} ·
              in order
            </span>
          ) : null}
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
              setEditingId(null)
              setDraft(EMPTY_DRAFT)
              setFormError(null)
              setOpen(true)
            }}
          >
            + Add a resource
          </button>
          <CourseLearningPathSectionToggle
            open={open}
            label='Resources'
            onToggle={() => setOpen((value) => !value)}
          />
        </div>
      </div>

      {open ? (
        <div className={styles.topicResourcesBody}>
          {items.length > 0 ? (
            <p className={styles.topicResourcesLead}>
              {items.length} {items.length === 1 ? 'resource' : 'resources'} ·
              in order
            </p>
          ) : (
            <p className={styles.topicResourcesEmpty}>
              Nothing here yet. When something makes this click, add it in the
              order you would study it.
            </p>
          )}

          {items.length > 0 ? (
            <ol className={styles.topicResourceList}>
              {items.map((resource) => {
                const title = resource.url ? (
                  <a
                    className={styles.topicResourceTitle}
                    href={resource.url}
                    target='_blank'
                    rel='noopener noreferrer'
                  >
                    {resource.title}
                  </a>
                ) : (
                  <p className={styles.topicResourceTitle}>{resource.title}</p>
                )
                return (
                  <li key={resource.id}>
                    <div
                      className={`${
                        styles.topicResource
                      } ${reportHoverTargetClass}${
                        editingId === resource.id
                          ? ` ${styles.topicResourceEditing}`
                          : ''
                      }`}
                    >
                      <span className={styles.topicResourcePos}>
                        {resource.position}
                      </span>
                      <div className={styles.topicResourceBody}>
                        <div className={styles.topicResourceMetaRow}>
                          <p className={styles.topicResourceKind}>
                            {resource.kind}
                          </p>
                          <div className={styles.topicResourceMetaActions}>
                            {pathSlug ? (
                              <ReportButton
                                target={{
                                  type: 'resource',
                                  id: pathResourceReportId({
                                    slug: pathSlug,
                                    nodeId,
                                    resourceId: resource.id
                                  }),
                                  url: learningPathHref(pathSlug),
                                  title: pathTitle
                                    ? `${resource.title} — ${pathTitle}`
                                    : resource.title,
                                  snippet: resource.why || resource.passage
                                }}
                              />
                            ) : null}
                            <button
                              type='button'
                              className={styles.topicResourceEditBtn}
                              onClick={() => openEdit(resource)}
                              aria-label='Edit'
                            >
                              <ResourceEditPencilIcon />
                            </button>
                          </div>
                        </div>
                        {title}
                        {resource.passage ? (
                          <p className={styles.topicResourcePassage}>
                            {resource.passage}
                          </p>
                        ) : null}
                        {resource.why ? (
                          <p className={styles.topicResourceWhy}>
                            {resource.why}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </li>
                )
              })}
            </ol>
          ) : null}
        </div>
      ) : null}

      {formOpen ? (
        <div
          className={styles.resourceModalBackdrop}
          role='presentation'
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) resetForm()
          }}
        >
          <div
            className={styles.resourceModal}
            role='dialog'
            aria-modal='true'
            aria-labelledby='topic-resource-form-title'
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className={styles.resourceModalHeader}>
              <h2
                id='topic-resource-form-title'
                className={styles.resourceModalTitle}
              >
                {editingId ? 'Edit resource' : 'Add a resource'}
              </h2>
              <button
                type='button'
                className={styles.resourceModalClose}
                onClick={resetForm}
                aria-label='Close'
              >
                ×
              </button>
            </div>
            <form className={styles.resourceModalForm} onSubmit={handleSubmit}>
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
                  autoFocus
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
              <div className={styles.topicResourceLabel}>
                <span id='topic-resource-type-label'>Type</span>
                <FormSelect<CourseLearningPathTopicResourceKind>
                  labelledBy='topic-resource-type-label'
                  value={draft.kind}
                  options={RESOURCE_KIND_OPTIONS}
                  onChange={(kind) =>
                    setDraft((prev) => ({
                      ...prev,
                      kind
                    }))
                  }
                />
              </div>
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
                      : editingId
                      ? ` · current ${editingResource?.position ?? ''}`
                      : ` · blank = end (${maxPlacement})`}
                  </span>
                </span>
              </label>
              {formError ? (
                <p className={styles.formError}>{formError}</p>
              ) : null}
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
                  {submitting
                    ? 'Saving…'
                    : editingId
                    ? 'Save changes'
                    : 'Save resource'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  )
}
