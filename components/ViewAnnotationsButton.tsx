import React from 'react'

import styles from './ViewAnnotationsButton.module.css'

export interface ViewAnnotationsButtonProps {
  count?: number
  onClick?: () => void
}

const ChatIcon: React.FC = () => (
  <span className={styles.icon} aria-hidden>
    <svg
      width='18'
      height='18'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
    >
      <path d='M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' />
      <circle cx='8' cy='12' r='1.25' fill='currentColor' />
      <circle cx='12' cy='12' r='1.25' fill='currentColor' />
      <circle cx='16' cy='12' r='1.25' fill='currentColor' />
    </svg>
  </span>
)

export const ViewAnnotationsButton: React.FC<ViewAnnotationsButtonProps> = ({
  count = 0,
  onClick
}) => {
  return (
    <button
      type='button'
      className={styles.root}
      onClick={onClick}
      aria-label={`View annotations (${count})`}
    >
      <ChatIcon />
      <span>View Annotations</span>
      <span className={styles.count}>({count})</span>
    </button>
  )
}
