import * as React from 'react'

import type {
  CourseLearningPathLink,
  CourseLearningPathLinkKind
} from '@/lib/course-learning-path-types'

import styles from './CourseLearningPath.module.css'

const SECTION: Record<
  CourseLearningPathLinkKind,
  { heading: string; singular: string; plural: string; addLabel: string }
> = {
  test: {
    heading: 'Tests',
    singular: 'test',
    plural: 'tests',
    addLabel: 'Add test'
  },
  slide: {
    heading: 'Slides',
    singular: 'slide',
    plural: 'slides',
    addLabel: 'Add slide'
  }
}

interface CourseLearningPathLinkSectionProps {
  kind: CourseLearningPathLinkKind
  nodeId: string
  items: CourseLearningPathLink[]
  dbBacked?: boolean
  signedIn?: boolean
  onSignIn?: () => void
  onAdd?: (input: {
    nodeId: string
    kind: CourseLearningPathLinkKind
    url: string
    title?: string
    description?: string
    suggestedPlacement?: number
  }) => Promise<boolean>
}

export function CourseLearningPathLinkSection({
  kind,
  nodeId,
  items,
  dbBacked = false,
  signedIn = false,
  onSignIn,
  onAdd
}: CourseLearningPathLinkSectionProps) {
  const copy = SECTION[kind]
  const headingId = `${kind}s-heading`

  const [editing, setEditing] = React.useState(false)
  const [open, setOpen] = React.useState(false)
  const [url, setUrl] = React.useState('')
  const [title, setTitle] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [placement, setPlacement] = React.useState('')
  const [formError, setFormError] = React.useState<string | null>(null)
  const [submitting, setSubmitting] = React.useState(false)

  const maxPlacement = items.length + 1
  const defaultPlacement = maxPlacement

  React.useEffect(() => {
    setEditing(false)
    setOpen(false)
    setUrl('')
    setTitle('')
    setDescription('')
    setPlacement('')
    setFormError(null)
  }, [nodeId])

  React.useEffect(() => {
    if (!signedIn) setEditing(false)
  }, [signedIn])

  React.useEffect(() => {
    if (placement === '') return
    const n = Number(placement)
    if (Number.isFinite(n) && n > maxPlacement) {
      setPlacement(String(maxPlacement))
    }
  }, [maxPlacement, placement])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    const trimmed = url.trim()
    if (!trimmed) {
      setFormError(`Paste a ${copy.singular} URL to add.`)
      return
    }
    try {
      // eslint-disable-next-line no-new
      new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`)
    } catch {
      setFormError('Enter a valid URL.')
      return
    }

    let suggestedPlacement = defaultPlacement
    if (placement.trim() !== '') {
      const n = Number(placement)
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

    if (!signedIn) {
      setFormError(`Sign in to add ${copy.plural}.`)
      return
    }
    if (!onAdd) return

    setSubmitting(true)
    const normalized = trimmed.startsWith('http')
      ? trimmed
      : `https://${trimmed}`
    const ok = await onAdd({
      nodeId,
      kind,
      url: normalized,
      title: title.trim() || undefined,
      description: description.trim() || undefined,
      suggestedPlacement
    })
    setSubmitting(false)
    if (!ok) {
      setFormError(
        dbBacked
          ? `Could not save this ${copy.singular}. Try again.`
          : `Could not add this ${copy.singular}.`
      )
      return
    }
    setUrl('')
    setTitle('')
    setDescription('')
    setPlacement('')
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
            {kind === 'test' ? <TestIcon /> : <SlidesIcon />}
          </span>
          {copy.heading}
        </h2>
        <div className={styles.videosHeaderActions}>
          {items.length > 0 && !editing && (
            <span className={styles.videosMeta}>
              {items.length} {items.length === 1 ? copy.singular : copy.plural}{' '}
              · in order
            </span>
          )}
          <button
            type='button'
            className={`${styles.editBtn}${
              !signedIn ? ` ${styles.editBtnDisabled}` : ''
            }`}
            aria-disabled={!signedIn}
            aria-pressed={editing}
            title={signedIn ? undefined : 'Sign in to add resources'}
            onClick={() => {
              if (!signedIn) {
                onSignIn?.()
                return
              }
              setEditing((v) => {
                const next = !v
                if (next) setOpen(true)
                return next
              })
            }}
          >
            {editing ? 'Done' : 'Edit'}
          </button>
          <CourseLearningPathSectionToggle
            open={open}
            label={copy.heading}
            onToggle={() => setOpen((v) => !v)}
          />
        </div>
      </div>

      {open && (
        <>
          {editing && signedIn && (
            <div className={styles.editPanel}>
              <p className={styles.editHint}>
                Add a link with a suggested order. It will also appear in
                Community resources, labeled with this topic&apos;s concept
                tree.
                {!dbBacked && (
                  <>
                    {' '}
                    <span className={styles.editHintMuted}>
                      Changes stay in this session until the course is seeded in
                      the database.
                    </span>
                  </>
                )}
              </p>

              <form className={styles.addForm} onSubmit={handleAdd}>
                <label
                  className={styles.addLabel}
                  htmlFor={`cv-add-${kind}-url`}
                >
                  URL
                </label>
                <input
                  id={`cv-add-${kind}-url`}
                  type='url'
                  className={styles.addInput}
                  placeholder='https://…'
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={submitting}
                  autoComplete='off'
                />
                <label
                  className={styles.addLabel}
                  htmlFor={`cv-add-${kind}-title`}
                >
                  Title <span className={styles.optional}>(optional)</span>
                </label>
                <input
                  id={`cv-add-${kind}-title`}
                  type='text'
                  className={styles.addInput}
                  placeholder='Leave blank to infer from the link'
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={submitting}
                  maxLength={500}
                />
                <label
                  className={styles.addLabel}
                  htmlFor={`cv-add-${kind}-description`}
                >
                  Description{' '}
                  <span className={styles.optional}>(optional)</span>
                </label>
                <textarea
                  id={`cv-add-${kind}-description`}
                  className={styles.addTextarea}
                  placeholder={`Why is this ${copy.singular} useful for this topic?`}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={submitting}
                  rows={3}
                  maxLength={2000}
                />
                <label
                  className={styles.addLabel}
                  htmlFor={`cv-add-${kind}-placement`}
                >
                  Suggested order placement
                </label>
                <div className={styles.placementRow}>
                  <input
                    id={`cv-add-${kind}-placement`}
                    type='number'
                    inputMode='numeric'
                    className={`${styles.addInput} ${styles.placementInput}`}
                    placeholder={String(defaultPlacement)}
                    value={placement}
                    onChange={(e) => setPlacement(e.target.value)}
                    disabled={submitting}
                    min={1}
                    max={maxPlacement}
                    step={1}
                  />
                  <span className={styles.placementHint}>
                    1–{maxPlacement}
                    {items.length === 0
                      ? ` (first ${copy.singular})`
                      : ` · blank = end (${defaultPlacement})`}
                  </span>
                </div>
                {formError && <p className={styles.formError}>{formError}</p>}
                <div className={styles.addActions}>
                  <button
                    type='submit'
                    className={styles.addSubmit}
                    disabled={submitting || !url.trim() || !signedIn}
                  >
                    {submitting ? 'Adding…' : copy.addLabel}
                  </button>
                </div>
              </form>
            </div>
          )}

          <CourseLearningPathLinkList kind={kind} items={items} />
        </>
      )}
    </section>
  )
}

export function CourseLearningPathSectionToggle({
  open,
  label,
  onToggle
}: {
  open: boolean
  label: string
  onToggle: () => void
}) {
  return (
    <button
      type='button'
      className={styles.sectionToggleBtn}
      onClick={onToggle}
      aria-expanded={open}
      aria-label={open ? `Collapse ${label}` : `Expand ${label}`}
    >
      <svg
        className={`${styles.sectionToggleIcon}${
          open ? ` ${styles.sectionToggleIconOpen}` : ''
        }`}
        xmlns='http://www.w3.org/2000/svg'
        viewBox='0 0 16 16'
        fill='none'
        aria-hidden
      >
        <path
          d='M6 3.5L10.5 8L6 12.5'
          stroke='currentColor'
          strokeWidth='1.4'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
      </svg>
    </button>
  )
}

function CourseLearningPathLinkList({
  kind,
  items
}: {
  kind: CourseLearningPathLinkKind
  items: CourseLearningPathLink[]
}) {
  const copy = SECTION[kind]

  if (items.length === 0) {
    return (
      <div className={styles.videoEmpty}>
        <span className={styles.videoEmptyIcon}>
          {kind === 'test' ? <TestIcon /> : <SlidesIcon />}
        </span>
        <p>No {copy.plural} have been curated for this section yet.</p>
      </div>
    )
  }

  return (
    <ol className={styles.videoList}>
      {items.map((item) => (
        <li key={item.id}>
          <LinkRow item={item} />
        </li>
      ))}
    </ol>
  )
}

function LinkRow({ item }: { item: CourseLearningPathLink }) {
  const href = item.url && item.url !== '#' ? item.url : undefined
  const host = hostFromUrl(item.url)

  const inner = (
    <>
      <span className={styles.videoPos}>{item.position}</span>
      <div className={styles.videoMeta}>
        <h4 className={styles.videoTitle}>{item.title}</h4>
        {host ? <p className={styles.materialUrl}>{host}</p> : null}
      </div>
      <span className={styles.externalIcon}>
        <ExternalIcon />
      </span>
    </>
  )

  if (!href) {
    return <div className={styles.materialLink}>{inner}</div>
  }

  return (
    <a
      href={href}
      className={styles.materialLink}
      target='_blank'
      rel='noopener noreferrer'
    >
      {inner}
    </a>
  )
}

function hostFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

function TestIcon() {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='20'
      height='20'
      viewBox='0 0 16 16'
      fill='none'
      aria-hidden
    >
      <rect
        x='3.5'
        y='2.5'
        width='9'
        height='11'
        rx='1'
        stroke='currentColor'
        strokeWidth='1.2'
      />
      <path
        d='M6 6H10M6 8.5H10M6 11H8.5'
        stroke='currentColor'
        strokeWidth='1.2'
        strokeLinecap='round'
      />
    </svg>
  )
}

function SlidesIcon() {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='20'
      height='20'
      viewBox='0 0 16 16'
      fill='none'
      aria-hidden
    >
      <rect
        x='2.5'
        y='3.5'
        width='11'
        height='8'
        rx='1'
        stroke='currentColor'
        strokeWidth='1.2'
      />
      <path
        d='M6 13.5H10'
        stroke='currentColor'
        strokeWidth='1.2'
        strokeLinecap='round'
      />
    </svg>
  )
}

function ExternalIcon() {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='14'
      height='14'
      viewBox='0 0 12 12'
      fill='none'
      aria-hidden
    >
      <path
        d='M3 9L9 3'
        stroke='currentColor'
        strokeWidth='1.2'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='M4.125 3H9V7.875'
        stroke='currentColor'
        strokeWidth='1.2'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}
