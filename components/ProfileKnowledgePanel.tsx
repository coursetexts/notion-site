import * as React from 'react'

import { type UserKnowledgeTopic } from '@/lib/user-knowledge-topics-db'
import { ProfileLightbulbIcon } from '@/components/ProfileTabItemIcons'
import styles from '@/styles/profile.module.css'

export function ProfileKnowledgePanel({
  topics,
  loading = false,
  searchId,
  emptyMessage
}: {
  topics: UserKnowledgeTopic[]
  loading?: boolean
  searchId: string
  emptyMessage: string
}) {
  const [query, setQuery] = React.useState('')

  const normalized = query.trim().toLowerCase()
  const visible = normalized
    ? topics.filter((topic) => topic.label.toLowerCase().includes(normalized))
    : topics

  return (
    <div className={styles.tabPanel}>
      <div className={styles.tabPanelTop}>
        <h2 className={styles.mainSerifTitle}>Knowledge</h2>
        <div className={styles.tabPanelSearchRow}>
          <div className={styles.panelSearchWrap}>
            <input
              id={searchId}
              type='search'
              className={styles.panelSearchInput}
              placeholder='SEARCH'
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label='Search completed topics'
            />
          </div>
        </div>
      </div>
      {loading ? (
        <p className={styles.placeholder}>Loading…</p>
      ) : topics.length === 0 ? (
        <p className={styles.placeholder}>{emptyMessage}</p>
      ) : visible.length === 0 ? (
        <p className={styles.placeholder}>No matching topics.</p>
      ) : (
        <ul className={`${styles.list} ${styles.knowledgeList}`}>
          {visible.map((topic) => (
            <li key={topic.id} className={styles.listItem}>
              <span className={styles.tabItemRow}>
                <span className={styles.tabItemIcon} aria-hidden>
                  <ProfileLightbulbIcon />
                </span>
                <span className={styles.listTitle}>{topic.label}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
