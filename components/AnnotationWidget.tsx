import React from 'react'
import styles from './AnnotationWidget.module.css'

export interface AnnotationWidgetProps {
  count?: number
  onHide?: () => void
}

const placeholderAnnotations = [
  { author: 'Babak Shammas', time: '12d', body: 'This connects well to the reading on platform economies.', votes: 3, replies: 0 },
  { author: 'Aileen Luo', time: '11d', body: 'Would love to see more examples from non-Western contexts here.', votes: 1, replies: 3 }
]

export const AnnotationWidget: React.FC<AnnotationWidgetProps> = ({
  count = 20,
  onHide
}) => {
  const [inputValue, setInputValue] = React.useState('')

  return (
    <aside className={styles.root} aria-label="Annotations">
      <div className={styles.header}>
        <h2 className={styles.title}>Annotations ({count})</h2>
        <button
          type="button"
          className={styles.hideBtn}
          onClick={onHide}
          aria-label="Hide annotations"
        >
          Hide
        </button>
      </div>
      <div className={styles.addWrap}>
        <input
          type="text"
          className={styles.addInput}
          placeholder="Add your thoughts..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          aria-label="Add annotation"
        />
      </div>
      <div className={styles.list}>
        {placeholderAnnotations.map((a, i) => (
          <div key={i} className={styles.annotation}>
            <div className={styles.annotationHeader}>
              <span className={styles.author}>{a.author}</span>
              <span className={styles.time}>{a.time}</span>
            </div>
            <p className={styles.body}>{a.body}</p>
            <div className={styles.actions}>
              <button type="button" className={styles.voteBtn} aria-label="Upvote">
                ↑ {a.votes}
              </button>
              <button type="button" className={styles.reply}>
                Reply
              </button>
            </div>
            {a.replies > 0 && (
              <button type="button" className={styles.showReplies}>
                Show Replies ({a.replies})
              </button>
            )}
          </div>
        ))}
      </div>
    </aside>
  )
}
