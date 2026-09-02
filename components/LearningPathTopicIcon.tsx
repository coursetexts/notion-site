import * as React from 'react'

import type { LearningPathTopicId } from '@/lib/learning-path-topic'

export function LearningPathTopicIcon({
  id,
  className
}: {
  id: LearningPathTopicId
  className?: string
}) {
  if (id === 'languages') {
    return (
      <svg
        className={className}
        viewBox='0 0 20 20'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
        aria-hidden
      >
        <path
          d='M3.5 5.25h8.25a1.5 1.5 0 0 1 1.5 1.5v4.25a1.5 1.5 0 0 1-1.5 1.5H8.1L5.5 15.25v-2.75H3.5A1.5 1.5 0 0 1 2 10.99V6.75a1.5 1.5 0 0 1 1.5-1.5Z'
          stroke='currentColor'
          strokeWidth='1.25'
          strokeLinejoin='round'
        />
        <path
          d='M13.25 4.4V3.75A1.5 1.5 0 0 0 11.75 2.25H4.4'
          stroke='currentColor'
          strokeWidth='1.25'
          strokeLinecap='round'
        />
      </svg>
    )
  }

  if (id === 'coding') {
    return (
      <svg
        className={className}
        viewBox='0 0 20 20'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
        aria-hidden
      >
        <path
          d='M6.25 6.5 2.75 10l3.5 3.5M13.75 6.5 17.25 10l-3.5 3.5M11.15 5.25 8.85 14.75'
          stroke='currentColor'
          strokeWidth='1.35'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
      </svg>
    )
  }

  if (id === 'creative') {
    return (
      <svg
        className={className}
        viewBox='0 0 20 20'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
        aria-hidden
      >
        <path
          d='M11.9 3.6 16.4 8.1 7.4 17.1 3.5 17.65 4.05 13.75 11.9 3.6Z'
          stroke='currentColor'
          strokeWidth='1.3'
          strokeLinejoin='round'
        />
        <path
          d='M10.85 4.85 15.15 9.15M7.15 13.2 4.9 16.6'
          stroke='currentColor'
          strokeWidth='1.3'
          strokeLinecap='round'
        />
      </svg>
    )
  }

  return (
    <svg
      className={className}
      viewBox='0 0 20 20'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      aria-hidden
    >
      <path
        d='M11.5 3.75 16.25 8.5M13.15 5.4 7.4 11.15'
        stroke='currentColor'
        strokeWidth='1.35'
        strokeLinecap='round'
      />
      <path
        d='M4.4 16.35 8.9 9.65l2.35 2.35-4.5 6.7H4.4v-2.35Z'
        stroke='currentColor'
        strokeWidth='1.3'
        strokeLinejoin='round'
      />
    </svg>
  )
}
