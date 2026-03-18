import React from 'react'

import styles from './ViewAnnotationsButton.module.css'

export interface ViewAnnotationsButtonProps {
  count?: number
  onClick?: () => void
}

const AnnotationsIcon: React.FC = () => (
  <span className={styles.icon} aria-hidden>
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='12'
      height='12'
      viewBox='0 0 12 12'
      fill='none'
    >
      <path
        d='M6.1875 1.125C4.94506 1.12748 3.75421 1.62213 2.87567 2.50067C1.99713 3.37921 1.50248 4.57006 1.5 5.8125V9.76406C1.5 9.95925 1.57754 10.1464 1.71555 10.2844C1.85357 10.4225 2.04075 10.5 2.23594 10.5H6.1875C7.4307 10.5 8.62299 10.0061 9.50206 9.12706C10.3811 8.24799 10.875 7.0557 10.875 5.8125C10.875 4.5693 10.3811 3.37701 9.50206 2.49794C8.62299 1.61886 7.4307 1.125 6.1875 1.125Z'
        fill='black'
      />
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
      aria-label={`Annotations (${count})`}
    >
      <AnnotationsIcon />
      <span>Annotations</span>
      <span className={styles.count}>({count})</span>
    </button>
  )
}
