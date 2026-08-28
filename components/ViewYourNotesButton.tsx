import React from 'react'

import styles from './ViewCourseChatButton.module.css'

export interface ViewYourNotesButtonProps {
  onClick?: () => void
}

const NotesIcon: React.FC = () => (
  <span className={styles.icon} aria-hidden>
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='12'
      height='12'
      viewBox='0 0 12 12'
      fill='none'
    >
      <path
        d='M3 1.5h5.25L9.75 3v7.5H3V1.5Z'
        stroke='black'
        strokeWidth='1.1'
        strokeLinejoin='round'
      />
      <path
        d='M8.25 1.5V3h1.5'
        stroke='black'
        strokeWidth='1.1'
        strokeLinejoin='round'
      />
      <path
        d='M4.5 5.25H8M4.5 7H8M4.5 8.75H6.75'
        stroke='black'
        strokeWidth='1.1'
        strokeLinecap='round'
      />
    </svg>
  </span>
)

export const ViewYourNotesButton: React.FC<ViewYourNotesButtonProps> = ({
  onClick
}) => {
  return (
    <button
      type='button'
      className={styles.root}
      onClick={onClick}
      aria-label='Open your notes'
    >
      <NotesIcon />
      <span>Your Notes</span>
    </button>
  )
}
