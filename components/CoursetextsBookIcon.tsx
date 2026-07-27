import * as React from 'react'
import cs from 'classnames'

import styles from './CoursetextsBookIcon.module.css'

type CoursetextsBookIconProps = {
  className?: string
  title?: string
}

export function CoursetextsBookIcon({
  className,
  title
}: CoursetextsBookIconProps) {
  return (
    <img
      src='/coursetexts-book.svg'
      alt={title ?? ''}
      width={18}
      height={15}
      className={cs(styles.svg, className)}
      aria-hidden={title ? undefined : true}
    />
  )
}
