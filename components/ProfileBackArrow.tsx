import React from 'react'

type ProfileBackArrowProps = {
  className?: string
}

/** Same chevron as “Back to Home” in the profile sidebar. */
export function ProfileBackArrow({ className }: ProfileBackArrowProps) {
  return (
    <span className={className} aria-hidden>
      <svg
        xmlns='http://www.w3.org/2000/svg'
        width='14'
        height='14'
        viewBox='0 0 14 14'
        fill='none'
      >
        <path
          d='M8.75 11.375L4.375 7L8.75 2.625'
          stroke='currentColor'
          strokeWidth='1.60417'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
      </svg>
    </span>
  )
}
