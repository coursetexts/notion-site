import * as React from 'react'
import dynamic from 'next/dynamic'

import styles from './CuratedCourse.module.css'
import { CuratedCourseChat } from './CuratedCourseChat'
import { CuratedCourseVideoList } from './CuratedCourseVideoList'
import { PlayIcon } from './CuratedCourseSyllabusNav'
import type {
  CuratedCourseFlatNode,
  CuratedCourseNode
} from '@/lib/curated-course-types'

const CuratedCourseNotes = dynamic(
  () =>
    import('./CuratedCourseNotes').then((m) => m.CuratedCourseNotes),
  {
    ssr: false,
    loading: () => (
      <div className={styles.notesSection}>
        <div className={styles.notesHeader}>
          <span className={styles.notesTitle}>Notes</span>
          <span className={styles.notesHeaderMeta}>Loading…</span>
        </div>
      </div>
    )
  }
)

const TYPE_LABEL: Record<CuratedCourseNode['type'], string> = {
  topic: 'Topic',
  subtopic: 'Subtopic',
  concept: 'Concept'
}

interface TopicContentProps {
  entry: CuratedCourseFlatNode
  onSelect: (id: string) => void
  courseTitle?: string
  courseDescription?: string
  courseSlug?: string
  /** Whether mutations can be saved to Supabase. */
  dbBacked?: boolean
  signedIn?: boolean
  onSignIn?: () => void
  onAddVideo?: (input: {
    nodeId: string
    url: string
    title?: string
    suggestedPlacement?: number
  }) => Promise<boolean>
  onVoteVideo?: (
    nodeId: string,
    videoId: string,
    value: 1 | -1 | null
  ) => Promise<void>
}

export function CuratedCourseTopicContent({
  entry,
  onSelect,
  courseTitle = '',
  courseDescription = '',
  courseSlug = '',
  dbBacked = false,
  signedIn = false,
  onSignIn,
  onAddVideo,
  onVoteVideo
}: TopicContentProps) {
  const { node, parents } = entry
  const videos = node.videos ?? []
  const childList = node.children ?? []

  const [editing, setEditing] = React.useState(false)
  const [url, setUrl] = React.useState('')
  const [title, setTitle] = React.useState('')
  const [placement, setPlacement] = React.useState('')
  const [formError, setFormError] = React.useState<string | null>(null)
  const [submitting, setSubmitting] = React.useState(false)
  const [votingId, setVotingId] = React.useState<string | null>(null)

  const maxPlacement = videos.length + 1
  const defaultPlacement = maxPlacement

  React.useEffect(() => {
    setEditing(false)
    setUrl('')
    setTitle('')
    setPlacement('')
    setFormError(null)
  }, [node.id])

  React.useEffect(() => {
    // Keep blank field meaning "end of list" as the list grows while editing.
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
      setFormError('Paste a video URL to add.')
      return
    }
    try {
      // Validate absolute URL shape
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
        setFormError(
          `Suggested order must be between 1 and ${maxPlacement}.`
        )
        return
      }
      suggestedPlacement = n
    }

    if (dbBacked && !signedIn) {
      setFormError('Sign in to add videos.')
      return
    }
    if (!onAddVideo) return

    setSubmitting(true)
    const normalized = trimmed.startsWith('http')
      ? trimmed
      : `https://${trimmed}`
    const ok = await onAddVideo({
      nodeId: node.id,
      url: normalized,
      title: title.trim() || undefined,
      suggestedPlacement
    })
    setSubmitting(false)
    if (!ok) {
      setFormError(
        dbBacked
          ? 'Could not save this video. Try again.'
          : 'Could not add this video.'
      )
      return
    }
    setUrl('')
    setTitle('')
    setPlacement('')
  }

  async function handleVote(videoId: string, value: 1 | -1 | null) {
    if (dbBacked && !signedIn) {
      onSignIn?.()
      return
    }
    if (!onVoteVideo) return
    setVotingId(videoId)
    await onVoteVideo(node.id, videoId, value)
    setVotingId(null)
  }

  return (
    <article className={styles.article}>
      <header className={styles.articleHeader}>
        {parents.length > 0 && (
          <nav aria-label='Breadcrumb'>
            <ol className={styles.breadcrumb}>
              {parents.map((p) => (
                <li
                  key={p.id}
                  style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <button
                    type='button'
                    onClick={() => onSelect(p.id)}
                    className={styles.breadcrumbBtn}
                  >
                    {p.title}
                  </button>
                  <ChevronSmall />
                </li>
              ))}
            </ol>
          </nav>
        )}

        <span className={styles.typeBadge}>{TYPE_LABEL[node.type]}</span>

        <h1 className={styles.articleTitle}>{node.title}</h1>

        {node.description ? (
          <p className={styles.articleDesc}>{node.description}</p>
        ) : null}
      </header>

      {childList.length > 0 && (
        <section aria-labelledby='subtopics-heading'>
          <h2 id='subtopics-heading' className={styles.sectionHeading}>
            <LayersIcon />
            In this {TYPE_LABEL[node.type].toLowerCase()}
          </h2>
          <ul className={styles.childrenGrid}>
            {childList.map((child) => (
              <li key={child.id}>
                <button
                  type='button'
                  onClick={() => onSelect(child.id)}
                  className={styles.childBtn}
                >
                  <span className={styles.childTitle}>{child.title}</span>
                  {child.videos?.length ? (
                    <span className={styles.videoCount}>
                      <PlayIcon size={12} />
                      {child.videos.length}
                    </span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <CuratedCourseChat
        courseTitle={courseTitle || 'this course'}
        courseDescription={courseDescription}
        topicTitle={node.title}
        topicDescription={node.description}
      />

      <CuratedCourseNotes
        nodeId={node.id}
        courseSlug={courseSlug || 'course'}
        topicTitle={node.title}
        signedIn={signedIn}
        onSignIn={onSignIn}
      />

      <section aria-labelledby='videos-heading'>
        <div className={styles.videosHeader}>
          <h2 id='videos-heading' className={styles.videosTitle}>
            <span style={{ color: '#0089c4', display: 'inline-flex' }}>
              <PlayIcon size={20} />
            </span>
            Videos
          </h2>
          <div className={styles.videosHeaderActions}>
            {videos.length > 0 && !editing && (
              <span className={styles.videosMeta}>
                {videos.length} {videos.length === 1 ? 'video' : 'videos'} · in
                order
              </span>
            )}
            <button
              type='button'
              className={styles.editBtn}
              onClick={() => setEditing((v) => !v)}
              aria-pressed={editing}
            >
              {editing ? 'Done' : 'Edit'}
            </button>
          </div>
        </div>

        {editing && (
          <div className={styles.editPanel}>
            <p className={styles.editHint}>
              Add a link with a suggested order, or upvote / downvote to change
              the curated ranking.
              {!dbBacked && (
                <>
                  {' '}
                  <span className={styles.editHintMuted}>
                    Changes stay in this session until the course is seeded in
                    the database.
                  </span>
                </>
              )}
              {dbBacked && !signedIn && (
                <>
                  {' '}
                  <button
                    type='button'
                    className={styles.signInLink}
                    onClick={() => onSignIn?.()}
                  >
                    Sign in
                  </button>{' '}
                  to save.
                </>
              )}
            </p>

            <form className={styles.addForm} onSubmit={handleAdd}>
              <label className={styles.addLabel} htmlFor='cv-add-url'>
                Video URL
              </label>
              <input
                id='cv-add-url'
                type='url'
                className={styles.addInput}
                placeholder='https://youtube.com/watch?v=…'
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={submitting}
                autoComplete='off'
              />
              <label className={styles.addLabel} htmlFor='cv-add-title'>
                Title <span className={styles.optional}>(optional)</span>
              </label>
              <input
                id='cv-add-title'
                type='text'
                className={styles.addInput}
                placeholder='Leave blank to infer from the link'
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={submitting}
                maxLength={500}
              />
              <label className={styles.addLabel} htmlFor='cv-add-placement'>
                Suggested order placement
              </label>
              <div className={styles.placementRow}>
                <input
                  id='cv-add-placement'
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
                  {videos.length === 0
                    ? ' (first video)'
                    : ` · blank = end (${defaultPlacement})`}
                </span>
              </div>
              {formError && <p className={styles.formError}>{formError}</p>}
              <div className={styles.addActions}>
                <button
                  type='submit'
                  className={styles.addSubmit}
                  disabled={submitting || !url.trim()}
                >
                  {submitting ? 'Adding…' : 'Add video'}
                </button>
              </div>
            </form>
          </div>
        )}

        <CuratedCourseVideoList
          videos={videos}
          editing={editing}
          voteDisabled={Boolean(votingId)}
          votingId={votingId}
          onVote={editing ? handleVote : undefined}
        />
      </section>
    </article>
  )
}

function ChevronSmall() {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='12'
      height='12'
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
  )
}

function LayersIcon() {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='14'
      height='14'
      viewBox='0 0 16 16'
      fill='none'
      aria-hidden
    >
      <path
        d='M8 2L14 5.5L8 9L2 5.5L8 2Z'
        stroke='currentColor'
        strokeWidth='1.2'
        strokeLinejoin='round'
      />
      <path
        d='M2 8L8 11.5L14 8'
        stroke='currentColor'
        strokeWidth='1.2'
        strokeLinejoin='round'
      />
      <path
        d='M2 10.5L8 14L14 10.5'
        stroke='currentColor'
        strokeWidth='1.2'
        strokeLinejoin='round'
      />
    </svg>
  )
}
