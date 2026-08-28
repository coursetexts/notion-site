import * as React from 'react'

import { VoteRow } from '@/components/CourseActivity'
import styles from './CourseLearningPath.module.css'
import { PlayIcon } from './CourseLearningPathSyllabusNav'
import {
  formatCourseLearningPathVideoDuration,
  type CourseLearningPathVideo
} from '@/lib/course-learning-path-types'
import { youtubeThumbnailFromUrl } from '@/lib/youtube-thumbnail'

interface VideoListProps {
  videos: CourseLearningPathVideo[]
  editing?: boolean
  voteDisabled?: boolean
  votingId?: string | null
  onVote?: (videoId: string, value: 1 | -1 | null) => void
}

export function CourseLearningPathVideoList({
  videos,
  editing = false,
  voteDisabled = false,
  votingId = null,
  onVote
}: VideoListProps) {
  if (videos.length === 0) {
    return (
      <div className={styles.videoEmpty}>
        <span className={styles.videoEmptyIcon}>
          <PlayIcon size={22} />
        </span>
        <p>No videos have been curated for this section yet.</p>
      </div>
    )
  }

  return (
    <ol className={styles.videoList}>
      {videos.map((video) => (
        <li key={video.id}>
          <VideoRow
            video={video}
            editing={editing}
            voteDisabled={voteDisabled || votingId === video.id}
            onVote={onVote}
          />
        </li>
      ))}
    </ol>
  )
}

function VideoRow({
  video,
  editing,
  voteDisabled,
  onVote
}: {
  video: CourseLearningPathVideo
  editing: boolean
  voteDisabled: boolean
  onVote?: (videoId: string, value: 1 | -1 | null) => void
}) {
  const href = video.url && video.url !== '#' ? video.url : undefined
  const thumb =
    video.thumbnailUrl || youtubeThumbnailFromUrl(video.url) || null

  const inner = (
    <>
      <span className={styles.videoPos}>{video.position}</span>

      <div className={styles.thumb}>
        {thumb ? (
          <img
            src={thumb}
            alt=''
            className={styles.thumbImg}
            loading='lazy'
          />
        ) : (
          <div className={styles.thumbPlaceholder}>
            {video.thumbnailQuery || 'Video'}
          </div>
        )}
        {video.durationSeconds > 0 && (
          <span className={styles.duration}>
            {formatCourseLearningPathVideoDuration(video.durationSeconds)}
          </span>
        )}
        <span className={styles.playOverlay}>
          <PlayIcon size={28} />
        </span>
      </div>

      <div className={styles.videoMeta}>
        <h4 className={styles.videoTitle}>{video.title}</h4>
        {video.channel ? (
          <p className={styles.videoChannel}>{video.channel}</p>
        ) : null}
        {video.annotation ? (
          <p className={styles.videoAnnotation}>{video.annotation}</p>
        ) : null}
      </div>

      {editing && onVote ? (
        <div
          className={styles.voteWrap}
          onClick={(e) => e.preventDefault()}
          onMouseDown={(e) => e.preventDefault()}
        >
          <VoteRow
            score={video.score ?? 0}
            userVote={video.userVote ?? null}
            disabled={voteDisabled}
            onVote={(value) => onVote(video.id, value)}
          />
        </div>
      ) : (
        <span className={styles.externalIcon}>
          <ExternalIcon />
        </span>
      )}
    </>
  )

  if (!href || editing) {
    return (
      <div
        className={`${styles.videoLink}${
          editing ? ` ${styles.videoLinkEditing}` : ''
        }`}
      >
        {inner}
      </div>
    )
  }

  return (
    <a
      href={href}
      className={styles.videoLink}
      target='_blank'
      rel='noopener noreferrer'
    >
      {inner}
    </a>
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
