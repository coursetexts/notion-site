import * as React from 'react'

import type { CuratedCourseVideo } from '@/lib/curated-course-types'

import styles from './CuratedCourse.module.css'
import { CuratedCourseSectionToggle } from './CuratedCourseLinkSection'
import { PlayIcon } from './CuratedCourseSyllabusNav'
import { CuratedCourseVideoList } from './CuratedCourseVideoList'

interface CuratedCourseVideoSectionProps {
  nodeId: string
  videos: CuratedCourseVideo[]
  headingId?: string
  formIdPrefix?: string
  dbBacked?: boolean
  signedIn?: boolean
  onSignIn?: () => void
  onAddVideo?: (input: {
    nodeId: string
    url: string
    title?: string
    description?: string
    suggestedPlacement?: number
  }) => Promise<boolean>
  onVoteVideo?: (
    nodeId: string,
    videoId: string,
    value: 1 | -1 | null
  ) => Promise<void>
}

export function CuratedCourseVideoSection({
  nodeId,
  videos,
  headingId = 'videos-heading',
  formIdPrefix = 'cv',
  dbBacked = false,
  signedIn = false,
  onSignIn,
  onAddVideo,
  onVoteVideo
}: CuratedCourseVideoSectionProps) {
  const [editing, setEditing] = React.useState(false)
  const [open, setOpen] = React.useState(false)
  const [url, setUrl] = React.useState('')
  const [title, setTitle] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [placement, setPlacement] = React.useState('')
  const [formError, setFormError] = React.useState<string | null>(null)
  const [submitting, setSubmitting] = React.useState(false)
  const [votingId, setVotingId] = React.useState<string | null>(null)

  const maxPlacement = videos.length + 1
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
      nodeId,
      url: normalized,
      title: title.trim() || undefined,
      description: description.trim() || undefined,
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
    setDescription('')
    setPlacement('')
  }

  async function handleVote(videoId: string, value: 1 | -1 | null) {
    if (dbBacked && !signedIn) {
      onSignIn?.()
      return
    }
    if (!onVoteVideo) return
    setVotingId(videoId)
    await onVoteVideo(nodeId, videoId, value)
    setVotingId(null)
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
            onClick={() => {
              setEditing((v) => {
                const next = !v
                if (next) setOpen(true)
                return next
              })
            }}
            aria-pressed={editing}
          >
            {editing ? 'Done' : 'Edit'}
          </button>
          <CuratedCourseSectionToggle
            open={open}
            label='Videos'
            onToggle={() => setOpen((v) => !v)}
          />
        </div>
      </div>

      {open && (
        <>
          {editing && (
            <div className={styles.editPanel}>
              <p className={styles.editHint}>
                Add a link with a suggested order, or upvote / downvote to
                change the curated ranking. Videos also appear in Community
                resources, labeled with this topic&apos;s concept tree.
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
                <label
                  className={styles.addLabel}
                  htmlFor={`${formIdPrefix}-add-url`}
                >
                  Video URL
                </label>
                <input
                  id={`${formIdPrefix}-add-url`}
                  type='url'
                  className={styles.addInput}
                  placeholder='https://youtube.com/watch?v=…'
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={submitting}
                  autoComplete='off'
                />
                <label
                  className={styles.addLabel}
                  htmlFor={`${formIdPrefix}-add-title`}
                >
                  Title <span className={styles.optional}>(optional)</span>
                </label>
                <input
                  id={`${formIdPrefix}-add-title`}
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
                  htmlFor={`${formIdPrefix}-add-description`}
                >
                  Description{' '}
                  <span className={styles.optional}>(optional)</span>
                </label>
                <textarea
                  id={`${formIdPrefix}-add-description`}
                  className={styles.addTextarea}
                  placeholder='Why is this useful for this topic?'
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={submitting}
                  rows={3}
                  maxLength={2000}
                />
                <label
                  className={styles.addLabel}
                  htmlFor={`${formIdPrefix}-add-placement`}
                >
                  Suggested order placement
                </label>
                <div className={styles.placementRow}>
                  <input
                    id={`${formIdPrefix}-add-placement`}
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
        </>
      )}
    </section>
  )
}
