import React from 'react'

import styles from './PdfEmbed.module.css'

export interface PdfEmbedProps {
  url: string
  title?: string
}

export const PdfEmbed: React.FC<PdfEmbedProps> = ({
  url,
  title = 'PDF document'
}) => {
  return (
    <div className={styles.root}>
      <iframe src={url} title={title} className={styles.iframe} />
      <div className={styles.linkWrap}>
        <a
          href={url}
          target='_blank'
          rel='noopener noreferrer'
          className={styles.link}
        >
          Open PDF in new tab
        </a>
      </div>
    </div>
  )
}
