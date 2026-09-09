import React, { useLayoutEffect, useRef, useState } from 'react'

import { ProfilePersonalLinksPopover } from '@/components/ProfilePersonalLinksPopover'
import type { ProfilePersonalLink } from '@/lib/profile-personal-links-db'
import {
  formatLearningMetadataFullLine,
  getLearningMetadataHiddenCount,
  getLearningMetadataVisibleItems,
  learningMetadataHasHiddenItems,
  parseLearningItems
} from '@/lib/profile-learning-display'
import styles from '@/styles/profile.module.css'

type ProfilePublicSummaryProps = {
  bio?: string | null
  learningNow?: string | null
  learningLearned?: string | null
  personalLinks?: ProfilePersonalLink[]
  /** Render only the bio block. */
  bioOnly?: boolean
  /** Render only the learning blocks. */
  learningOnly?: boolean
  /** Compact metadata styling with divider and expandable rows. */
  metadataStyle?: boolean
}

function ProfileLearningMetadataTopics({
  items,
  expanded
}: {
  items: string[]
  expanded: boolean
}) {
  const visibleItems = expanded
    ? items
    : getLearningMetadataVisibleItems(items)

  return (
    <>
      {visibleItems.map((item, index) => (
        <React.Fragment key={`${item}-${index}`}>
          {index > 0 ? (
            <span className={styles.profileLearningMetadataSep} aria-hidden>
              {' · '}
            </span>
          ) : null}
          <span className={styles.profileLearningMetadataTopic}>{item}</span>
        </React.Fragment>
      ))}
    </>
  )
}

function ProfileLearningMetadataRow({
  label,
  items
}: {
  label: string
  items: string[]
}) {
  const [expanded, setExpanded] = useState(false)
  const topicsRef = useRef<HTMLSpanElement>(null)
  const [textOverflows, setTextOverflows] = useState(false)
  const hasHiddenItems = learningMetadataHasHiddenItems(items)
  const hiddenCount = getLearningMetadataHiddenCount(items)
  const expandable = hasHiddenItems || textOverflows

  useLayoutEffect(() => {
    const el = topicsRef.current
    if (!el) return

    const checkOverflow = () => {
      if (expanded) {
        setTextOverflows(false)
        return
      }
      setTextOverflows(el.scrollWidth > el.clientWidth)
    }

    checkOverflow()
    const observer = new ResizeObserver(checkOverflow)
    observer.observe(el)
    return () => observer.disconnect()
  }, [items, expanded, label])

  const rowClassName = expandable
    ? `${styles.profileLearningMetadataRow} ${styles.profileLearningMetadataRowInteractive}`
    : styles.profileLearningMetadataRow

  const topicListClassName = expanded
    ? `${styles.profileLearningMetadataTopicList} ${styles.profileLearningMetadataTopicListExpanded}`
    : styles.profileLearningMetadataTopicList

  const content = (
    <>
      <span className={styles.profileLearningMetadataLabel}>{label}</span>
      <span className={styles.profileLearningMetadataTopics}>
        <span ref={topicsRef} className={topicListClassName}>
          <ProfileLearningMetadataTopics items={items} expanded={expanded} />
        </span>
        {hasHiddenItems && !expanded ? (
          <>
            <span className={styles.profileLearningMetadataSep} aria-hidden>
              {' · '}
            </span>
            <span className={styles.profileLearningMetadataMore}>+{hiddenCount}</span>
          </>
        ) : null}
      </span>
    </>
  )

  if (expandable) {
    return (
      <button
        type='button'
        className={rowClassName}
        onClick={() => setExpanded((open) => !open)}
        aria-expanded={expanded}
        aria-label={`${label}: ${formatLearningMetadataFullLine(items)}`}
      >
        {content}
      </button>
    )
  }

  return <div className={rowClassName}>{content}</div>
}

export function ProfilePublicSummary({
  bio,
  learningNow,
  learningLearned,
  personalLinks = [],
  bioOnly = false,
  learningOnly = false,
  metadataStyle = false
}: ProfilePublicSummaryProps) {
  const bioText = (bio ?? '').trim()
  const nowText = (learningNow ?? '').trim()
  const learnedText = (learningLearned ?? '').trim()
  const showBio = !learningOnly && bioText
  const showBioRow = bioOnly && (bioText || personalLinks.length > 0)

  if (showBioRow) {
    return (
      <p className={styles.sidebarBio}>
        {bioText ? <>{bioText} </> : null}
        <ProfilePersonalLinksPopover links={personalLinks} />
      </p>
    )
  }

  if (showBio) {
    return <p className={styles.sidebarBio}>{bioText}</p>
  }

  if (learningOnly && metadataStyle) {
    const nowItems = parseLearningItems(nowText)
    const learnedItems = parseLearningItems(learnedText)
    if (nowItems.length === 0 && learnedItems.length === 0) return null

    return (
      <div className={styles.profileLearningMetadata}>
        {nowItems.length > 0 ? (
          <ProfileLearningMetadataRow
            label='Currently learning'
            items={nowItems}
          />
        ) : null}
        {learnedItems.length > 0 ? (
          <ProfileLearningMetadataRow
            label='Previously learned'
            items={learnedItems}
          />
        ) : null}
      </div>
    )
  }

  return null
}
