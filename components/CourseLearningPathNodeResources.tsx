import * as React from 'react'
import { createPortal } from 'react-dom'

import { pathResourceReportId } from '@/lib/content-reports'
import {
  COURSE_LEARNING_PATH_TOPIC_RESOURCE_KINDS,
  type CourseLearningPathTopicResource,
  type CourseLearningPathTopicResourceKind
} from '@/lib/course-learning-path-types'
import {
  learningPathHref,
  learningPathResourceBookmarkUrl,
  normalizeUserLinkUrl
} from '@/lib/learning-path-bookmark-link'
import {
  type LearningPathResourceVoteSummary,
  getLearningPathResourceVoteSummaries,
  learningPathResourceVoteKey,
  setLearningPathResourceVote
} from '@/lib/learning-path-resource-votes-db'
import { addLink, deleteLink, getMyLinks } from '@/lib/user-links'

import styles from './CourseLearningPath.module.css'
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

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function isPathUuid(id: string | null | undefined): id is string {
  return Boolean(id && UUID_RE.test(id))
}

function resourceHelpedText(passage?: string, why?: string) {
  return [passage?.trim(), why?.trim()].filter(Boolean).join('\n\n')
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

function ResourceInfoIcon() {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='13'
      height='13'
      viewBox='0 0 14 14'
      fill='none'
      aria-hidden
    >
      <circle
        cx='7'
        cy='7'
        r='5.4'
        stroke='currentColor'
        strokeWidth='1.2'
      />
      <path
        d='M7 6.2v3.2'
        stroke='currentColor'
        strokeWidth='1.2'
        strokeLinecap='round'
      />
      <circle cx='7' cy='4.4' r='0.7' fill='currentColor' />
    </svg>
  )
}

function ResourceUpvoteIcon() {
  return (
    <svg width='11' height='11' viewBox='0 0 16 16' fill='none' aria-hidden>
      <path
        d='M2.5374 10.1938C2.57565 10.2847 2.63998 10.3624 2.72229 10.4169C2.80459 10.4714 2.90119 10.5003 2.9999 10.5H12.9999C13.0986 10.5003 13.1952 10.4714 13.2775 10.4169C13.3598 10.3624 13.4242 10.2847 13.4624 10.1938C13.4984 10.1014 13.5076 10.0007 13.4888 9.90339C13.47 9.80606 13.424 9.71604 13.3561 9.64375L8.35615 4.64375C8.26058 4.55134 8.13284 4.49969 7.9999 4.49969C7.86696 4.49969 7.73922 4.55134 7.64365 4.64375L2.64365 9.64375C2.57583 9.71604 2.52985 9.80606 2.51105 9.90339C2.49225 10.0007 2.50138 10.1014 2.5374 10.1938Z'
        fill='currentColor'
      />
    </svg>
  )
}

function ResourceDownvoteIcon() {
  return (
    <svg width='11' height='11' viewBox='0 0 16 16' fill='none' aria-hidden>
      <path
        d='M13.4626 5.80625C13.4243 5.71525 13.36 5.63761 13.2777 5.58311C13.1954 5.52861 13.0988 5.49969 13.0001 5.5H3.0001C2.90139 5.49969 2.80479 5.52861 2.72249 5.58311C2.64018 5.63761 2.57585 5.71525 2.5376 5.80625C2.50158 5.89861 2.49244 5.99927 2.51124 6.09661C2.53004 6.19394 2.57602 6.28396 2.64385 6.35625L7.64385 11.3563C7.73942 11.4487 7.86716 11.5003 8.0001 11.5003C8.13304 11.5003 8.26078 11.4487 8.35635 11.3563L13.3563 6.35625C13.4242 6.28396 13.4702 6.19394 13.489 6.09661C13.5078 5.99927 13.4986 5.89861 13.4626 5.80625Z'
        fill='currentColor'
      />
    </svg>
  )
}

function BookmarkIcon({ filled }: { filled: boolean }) {
  return (
    <svg width='13' height='13' viewBox='0 0 14 16' fill='none' aria-hidden>
      <path
        d='M2.75 2.25h8.5v10.85L7 9.35l-4.25 3.75V2.25z'
        fill={filled ? 'currentColor' : 'none'}
        stroke='currentColor'
        strokeWidth='1.2'
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
  /** Section title. Topic pages keep "Resources". */
  heading?: string
  /** Omit the section title when the page already names the list. */
  hideHeading?: boolean
  /** Show only the add button when the section already has other cards. */
  quietEmpty?: boolean
  /** Kind selected when the add form opens. */
  defaultKind?: CourseLearningPathTopicResourceKind
  dbBacked?: boolean
  signedIn?: boolean
  onSignIn?: () => void
  /** learning_paths.id when votes can persist. */
  pathId?: string
  pathSlug?: string
  pathTitle?: string
  canEditResource?: (resource: CourseLearningPathTopicResource) => boolean
  onAdd?: (input: CourseLearningPathTopicResourceInput) => Promise<boolean>
  onUpdate?: (
    input: CourseLearningPathTopicResourceInput & { resourceId: string }
  ) => Promise<boolean>
}

export function CourseLearningPathNodeResources({
  nodeId,
  items,
  headingId = 'topic-resources-heading',
  heading = 'Resources',
  hideHeading = false,
  quietEmpty = false,
  defaultKind = 'article',
  dbBacked = false,
  signedIn = false,
  onSignIn,
  pathId,
  pathSlug,
  pathTitle,
  canEditResource,
  onAdd,
  onUpdate
}: CourseLearningPathNodeResourcesProps) {
  const [adding, setAdding] = React.useState(false)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [draft, setDraft] = React.useState({ ...EMPTY_DRAFT, kind: defaultKind })
  const [formError, setFormError] = React.useState<string | null>(null)
  const [submitting, setSubmitting] = React.useState(false)
  const [openHelpIds, setOpenHelpIds] = React.useState<Record<string, boolean>>(
    {}
  )
  const [resourceVotes, setResourceVotes] = React.useState<
    Record<string, LearningPathResourceVoteSummary>
  >({})
  const [votingResourceId, setVotingResourceId] = React.useState<string | null>(
    null
  )
  const [savedLinkByUrl, setSavedLinkByUrl] = React.useState<
    Record<string, string>
  >({})
  const [bookmarkingResourceId, setBookmarkingResourceId] = React.useState<
    string | null
  >(null)

  const canVote = isPathUuid(pathId)

  function blankDraft() {
    return { ...EMPTY_DRAFT, kind: defaultKind }
  }

  const formOpen = adding || Boolean(editingId)
  const maxPlacement = editingId ? Math.max(items.length, 1) : items.length + 1
  const editingResource = editingId
    ? items.find((item) => item.id === editingId)
    : undefined

  React.useEffect(() => {
    if (!canVote || !pathId) {
      setResourceVotes({})
      return
    }
    let cancelled = false
    void getLearningPathResourceVoteSummaries(pathId).then((next) => {
      if (!cancelled) setResourceVotes(next)
    })
    return () => {
      cancelled = true
    }
  }, [canVote, pathId, signedIn])

  React.useEffect(() => {
    if (!signedIn) {
      setSavedLinkByUrl({})
      return
    }
    let cancelled = false
    void getMyLinks().then((links) => {
      if (cancelled) return
      const byUrl: Record<string, string> = {}
      for (const link of links) {
        byUrl[normalizeUserLinkUrl(link.url)] = link.id
      }
      setSavedLinkByUrl(byUrl)
    })
    return () => {
      cancelled = true
    }
  }, [signedIn, pathSlug])

  async function setResourceVote(
    resourceId: string,
    value: 1 | -1 | null
  ) {
    if (!signedIn) {
      onSignIn?.()
      return
    }
    if (!canVote || !pathId || votingResourceId) return
    const key = learningPathResourceVoteKey(nodeId, resourceId)
    const current = resourceVotes[key] ?? { score: 0, userVote: null }
    const previous = current.userVote
    let score = current.score
    if (previous === 1) score -= 1
    if (previous === -1) score += 1
    if (value === 1) score += 1
    if (value === -1) score -= 1
    setVotingResourceId(resourceId)
    setResourceVotes((prev) => ({
      ...prev,
      [key]: { score, userVote: value }
    }))
    try {
      const nextScore = await setLearningPathResourceVote(
        pathId,
        nodeId,
        resourceId,
        value
      )
      if (nextScore == null) {
        setResourceVotes((prev) => ({ ...prev, [key]: current }))
        return
      }
      setResourceVotes((prev) => ({
        ...prev,
        [key]: { score: nextScore, userVote: value }
      }))
    } finally {
      setVotingResourceId(null)
    }
  }

  async function toggleResourceBookmark(
    resource: CourseLearningPathTopicResource
  ) {
    if (!signedIn) {
      onSignIn?.()
      return
    }
    if (!pathSlug || bookmarkingResourceId) return
    const url = learningPathResourceBookmarkUrl({
      slug: pathSlug,
      nodeId,
      resourceId: resource.id,
      href: resource.url,
      origin: window.location.origin
    })
    const key = normalizeUserLinkUrl(url)
    const existingId = savedLinkByUrl[key]
    setBookmarkingResourceId(resource.id)
    try {
      if (existingId) {
        const ok = await deleteLink(existingId)
        if (!ok) {
          window.alert('Could not remove this bookmark.')
          return
        }
        setSavedLinkByUrl((prev) => {
          const next = { ...prev }
          delete next[key]
          return next
        })
        return
      }
      const row = await addLink(url, { title: resource.title })
      if (!row) {
        window.alert('Could not bookmark this resource. Try signing in again.')
        return
      }
      setSavedLinkByUrl((prev) => ({
        ...prev,
        [normalizeUserLinkUrl(row.url)]: row.id
      }))
    } finally {
      setBookmarkingResourceId(null)
    }
  }
  React.useEffect(() => {
    setAdding(false)
    setEditingId(null)
    setDraft({ ...EMPTY_DRAFT, kind: defaultKind })
    setFormError(null)
  }, [nodeId, defaultKind])

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

  React.useEffect(() => {
    if (!formOpen) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') resetFormRef.current()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [formOpen])

  function resetForm() {
    setAdding(false)
    setEditingId(null)
    setDraft(blankDraft())
    setFormError(null)
  }

  const resetFormRef = React.useRef(resetForm)
  resetFormRef.current = resetForm

  function openEdit(resource: CourseLearningPathTopicResource) {
    if (canEditResource && !canEditResource(resource)) return
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
      passage: resourceHelpedText(resource.passage, resource.why),
      why: '',
      sequence: String(resource.position)
    })
    setFormError(null)
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
      setFormError('Title and what helped are required.')
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
      why: undefined,
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
    <section
      className={styles.topicResourcesSection}
      aria-labelledby={hideHeading ? undefined : headingId}
    >
      {hideHeading ? null : (
        <div className={`${styles.videosHeader} ${styles.videosHeaderPlain}`}>
          <h2 id={headingId} className={styles.videosTitle}>
            {heading}
          </h2>
        </div>
      )}

      <div className={styles.topicResourcesBody}>
          {items.length === 0 && !quietEmpty ? (
            <div className={styles.topicResourcesEmptyBox}>
              <p className={styles.topicResourcesEmpty}>
                Nothing here yet. When something makes this click, add it in the
                order you would study it.
              </p>
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
                  setDraft(blankDraft())
                  setFormError(null)
                }}
              >
                + Add a resource
              </button>
            </div>
          ) : (
            <>
            {items.length > 0 ? (
            <ol className={styles.topicResourceList}>
              {items.map((resource) => {
                const helpedText = resourceHelpedText(
                  resource.passage,
                  resource.why
                )
                const helpKey = `${nodeId}:${resource.id}`
                const helpOpen = Boolean(openHelpIds[helpKey])
                const vote =
                  resourceVotes[
                    learningPathResourceVoteKey(nodeId, resource.id)
                  ]
                const voteScore = vote?.score ?? 0
                const userVote = vote?.userVote ?? null
                const bookmarkUrl = pathSlug
                  ? learningPathResourceBookmarkUrl({
                      slug: pathSlug,
                      nodeId,
                      resourceId: resource.id,
                      href: resource.url,
                      origin:
                        typeof window !== 'undefined'
                          ? window.location.origin
                          : ''
                    })
                  : ''
                const bookmarkSaved = Boolean(
                  bookmarkUrl &&
                    savedLinkByUrl[normalizeUserLinkUrl(bookmarkUrl)]
                )
                const editable =
                  !canEditResource || canEditResource(resource)
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
                      <div className={styles.topicResourceLead}>
                        <span className={styles.topicResourcePos}>
                          {resource.position}
                        </span>
                        <div className={styles.topicResourceBody}>
                          <p className={styles.topicResourceKind}>
                            {resource.kind}
                          </p>
                          {title}
                          {helpedText && helpOpen ? (
                            <p
                              className={`${styles.topicResourcePassage} ${styles.topicResourcePassageOpen}`}
                            >
                              The part that helped and why: {helpedText}
                            </p>
                          ) : null}
                        </div>
                      </div>
                      <div className={styles.topicResourceMetaActions}>
                        <div className={styles.topicResourceHoverActions}>
                          {editable ? (
                            <button
                              type='button'
                              className={styles.topicResourceEditBtn}
                              onClick={() => openEdit(resource)}
                              aria-label='Edit'
                              title='Edit resource'
                            >
                              <ResourceEditPencilIcon />
                            </button>
                          ) : null}
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
                                snippet: helpedText
                              }}
                            />
                          ) : null}
                          {pathSlug ? (
                            <button
                              type='button'
                              className={styles.topicResourceEditBtn}
                              onClick={() =>
                                void toggleResourceBookmark(resource)
                              }
                              disabled={bookmarkingResourceId === resource.id}
                              aria-pressed={bookmarkSaved}
                              aria-label={
                                bookmarkSaved
                                  ? 'Remove bookmark'
                                  : signedIn
                                  ? 'Bookmark this resource'
                                  : 'Sign in to bookmark this resource'
                              }
                              title={
                                bookmarkSaved
                                  ? 'Remove bookmark'
                                  : signedIn
                                  ? 'Save to your bookmarked links'
                                  : 'Sign in to bookmark'
                              }
                            >
                              <BookmarkIcon filled={bookmarkSaved} />
                            </button>
                          ) : null}
                          {helpedText ? (
                            <button
                              type='button'
                              className={`${styles.topicResourceEditBtn}${
                                helpOpen
                                  ? ` ${styles.topicResourceActionOn}`
                                  : ''
                              }`}
                              aria-expanded={helpOpen}
                              aria-label={
                                helpOpen
                                  ? 'Hide what helped and why'
                                  : 'What part helped and why'
                              }
                              title='What part helped and why'
                              onClick={() =>
                                setOpenHelpIds((prev) => ({
                                  ...prev,
                                  [helpKey]: !prev[helpKey]
                                }))
                              }
                            >
                              <ResourceInfoIcon />
                            </button>
                          ) : null}
                        </div>
                        {canVote ? (
                          <div className={styles.topicResourceVote}>
                            <button
                              type='button'
                              className={`${styles.topicResourceVoteBtn}${
                                userVote === 1
                                  ? ` ${styles.topicResourceActionOn}`
                                  : ''
                              }`}
                              onClick={() =>
                                void setResourceVote(
                                  resource.id,
                                  userVote === 1 ? null : 1
                                )
                              }
                              disabled={votingResourceId === resource.id}
                              aria-pressed={userVote === 1}
                              aria-label={
                                userVote === 1
                                  ? 'Remove upvote'
                                  : signedIn
                                  ? 'Upvote this resource'
                                  : 'Sign in to upvote this resource'
                              }
                              title={
                                userVote === 1
                                  ? 'Remove upvote'
                                  : signedIn
                                  ? 'Upvote — does not change list order'
                                  : 'Sign in to upvote'
                              }
                            >
                              <ResourceUpvoteIcon />
                            </button>
                            <span
                              className={styles.topicResourceVoteCount}
                              aria-live='polite'
                              aria-atomic='true'
                            >
                              {voteScore}
                            </span>
                            <button
                              type='button'
                              className={`${styles.topicResourceVoteBtn}${
                                userVote === -1
                                  ? ` ${styles.topicResourceActionOn}`
                                  : ''
                              }`}
                              onClick={() =>
                                void setResourceVote(
                                  resource.id,
                                  userVote === -1 ? null : -1
                                )
                              }
                              disabled={votingResourceId === resource.id}
                              aria-pressed={userVote === -1}
                              aria-label={
                                userVote === -1
                                  ? 'Remove downvote'
                                  : signedIn
                                  ? 'Downvote this resource'
                                  : 'Sign in to downvote this resource'
                              }
                              title={
                                userVote === -1
                                  ? 'Remove downvote'
                                  : signedIn
                                  ? 'Downvote — does not change list order'
                                  : 'Sign in to downvote'
                              }
                            >
                              <ResourceDownvoteIcon />
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </li>
                )
              })}
            </ol>
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
                setDraft(blankDraft())
                setFormError(null)
              }}
            >
              + Add a resource
            </button>
            </>
          )}
        </div>

      {formOpen && typeof document !== 'undefined'
        ? createPortal(
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
                <form
                  className={styles.resourceModalForm}
                  onSubmit={handleSubmit}
                >
                  <label className={styles.topicResourceLabel}>
                    Title
                    <input
                      className={styles.topicResourceInput}
                      value={draft.title}
                      onChange={(event) =>
                        setDraft((prev) => ({
                          ...prev,
                          title: event.target.value
                        }))
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
                        setDraft((prev) => ({
                          ...prev,
                          url: event.target.value
                        }))
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
                    What part of this helped? Why did it help
                    <textarea
                      className={styles.topicResourceNote}
                      rows={3}
                      value={draft.passage}
                      onChange={(event) =>
                        setDraft((prev) => ({
                          ...prev,
                          passage: event.target.value
                        }))
                      }
                      placeholder='e.g. the QKV diagram, 12:40–14:10 — it made attention click'
                      required
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
                        submitting ||
                        !draft.title.trim() ||
                        !draft.passage.trim()
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
            </div>,
            document.body
          )
        : null}
    </section>
  )
}
