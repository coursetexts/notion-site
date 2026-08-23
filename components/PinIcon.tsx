import * as React from 'react'

export function PinIcon({
  filled = false,
  size = 16
}: {
  filled?: boolean
  size?: number
}) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width={size}
      height={size}
      viewBox='0 0 24 24'
      fill={filled ? 'currentColor' : 'none'}
      stroke='currentColor'
      strokeWidth={filled ? 0 : 1.7}
      strokeLinecap='round'
      strokeLinejoin='round'
      aria-hidden
    >
      <path d='M16 9V4h1V2H7v2h1v5c0 1.66-1.34 3-3 3v2h5.97V21l1.03 1 1.03-1v-7H19v-2c-1.66 0-3-1.34-3-3z' />
    </svg>
  )
}
