import * as React from 'react'

import { extractYouTubeVideoId } from '@/lib/youtube-thumbnail'

import styles from './LearningPathsTutorialButton.module.css'

export const PATHS_TUTORIAL_YOUTUBE_URL =
  'https://youtu.be/zOE_BHX87Ko'

type LearningPathsTutorialButtonProps = {
  className?: string
}

export function LearningPathsTutorialButton({
  className
}: LearningPathsTutorialButtonProps) {
  const [open, setOpen] = React.useState(false)
  const videoId = extractYouTubeVideoId(PATHS_TUTORIAL_YOUTUBE_URL)

  React.useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <>
      <button
        type='button'
        className={className ? `${styles.button} ${className}` : styles.button}
        onClick={() => setOpen(true)}
      >
        Learning Paths Tutorial
      </button>

      {open && videoId ? (
        <div
          className={styles.backdrop}
          role='presentation'
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false)
          }}
        >
          <div
            className={styles.modal}
            role='dialog'
            aria-modal='true'
            aria-label='Learning Paths Tutorial'
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              type='button'
              className={styles.modalClose}
              onClick={() => setOpen(false)}
              aria-label='Close video'
            >
              ×
            </button>
            <div className={styles.frame}>
              <iframe
                title='Learning Paths Tutorial'
                src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
                allowFullScreen
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
