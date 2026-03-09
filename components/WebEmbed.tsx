import React from 'react'
import styles from './WebEmbed.module.css'

export interface WebEmbedProps {
  url: string
  title?: string
}

export const WebEmbed: React.FC<WebEmbedProps> = ({
  url,
  title = 'Embedded content'
}) => {
  return (
    <div className={styles.root}>
      <iframe
        src={url}
        title={title}
        className={styles.iframe}
      />
      <div className={styles.linkWrap}>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.link}
        >
          Open link in new tab
        </a>
      </div>
    </div>
  )
}
