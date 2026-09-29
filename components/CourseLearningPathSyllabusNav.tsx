import * as React from 'react'

import {
  COURSE_LEARNING_PATH_GENERAL_RESOURCES_LABEL,
  COURSE_LEARNING_PATH_KNOWLEDGE_SECTION_ID,
  COURSE_LEARNING_PATH_RESOURCES_SECTION_ID,
  COURSE_LEARNING_PATH_RESOURCE_SECTIONS,
  COURSE_LEARNING_PATH_SYLLABUS_SECTION_ID,
  isCourseLearningPathKnowledgeSelection,
  isCourseLearningPathOverviewSelection,
  isCourseLearningPathResourceSelection
} from '@/lib/course-learning-path-resources'
import type {
  CourseLearningPathData,
  CourseLearningPathNode
} from '@/lib/course-learning-path-types'
import {
  isCourseLearningPathFinished,
  knowledgeTopicItemsFromCourseLearningPath
} from '@/lib/learning-path-knowledge'
import {
  LEARNING_PATH_MENTAL_MAP_LABEL,
  LEARNING_PATH_OVERVIEW_LABEL
} from '@/lib/learning-path-sections'

import styles from './CourseLearningPath.module.css'
import { OutlineAccordionChevron, PathCompleteCheck } from './PathCompleteCheck'

function matchesQuery(text: string, query: string) {
  return text.toLowerCase().includes(query)
}

function filterTopicTree(
  nodes: CourseLearningPathNode[],
  query: string
): CourseLearningPathNode[] {
  if (!query) return nodes
  return nodes
    .map((node) => {
      const selfMatch = matchesQuery(node.title, query)
      const children = filterTopicTree(node.children ?? [], query)
      if (selfMatch) return node
      if (children.length) return { ...node, children }
      return null
    })
    .filter((node): node is CourseLearningPathNode => node != null)
}

interface SyllabusNavProps {
  course: CourseLearningPathData
  selectedId: string
  expanded: Set<string>
  exploredIds: Set<string>
  onSelect: (id: string) => void
  onToggle: (id: string) => void
  search?: string
  onSearchChange?: (value: string) => void
  hideSearch?: boolean
}

export function CourseLearningPathSyllabusNav({
  course,
  selectedId,
  expanded,
  exploredIds,
  onSelect,
  onToggle,
  search: searchProp,
  onSearchChange,
  hideSearch = false
}: SyllabusNavProps) {
  const [searchState, setSearchState] = React.useState('')
  const search = searchProp ?? searchState
  function setSearch(value: string) {
    onSearchChange?.(value)
    if (searchProp === undefined) setSearchState(value)
  }
  const query = search.trim().toLowerCase()
  const searching = query.length > 0
  const filteredTopics = React.useMemo(
    () => filterTopicTree(course.topics, query),
    [course.topics, query]
  )
  const showOverview =
    !searching ||
    matchesQuery(LEARNING_PATH_OVERVIEW_LABEL, query) ||
    matchesQuery('Recommended Syllabus', query) ||
    matchesQuery('Recommended Path', query) ||
    matchesQuery('Mental Map', query) ||
    matchesQuery(LEARNING_PATH_MENTAL_MAP_LABEL, query) ||
    matchesQuery(course.title, query)
  const learnedTopics = React.useMemo(
    () => knowledgeTopicItemsFromCourseLearningPath(course),
    [course]
  )
  const pathFinished = isCourseLearningPathFinished(course, exploredIds)
  const showKnowledge =
    pathFinished &&
    (!searching ||
      matchesQuery('What you learned', query) ||
      matchesQuery('knowledge', query) ||
      matchesQuery('learned', query) ||
      learnedTopics.some((topic) => matchesQuery(topic.label, query)))
  const resourceSectionMatch = COURSE_LEARNING_PATH_RESOURCE_SECTIONS.some(
    (section) => matchesQuery(section.label, query)
  )
  const showResources =
    !searching ||
    matchesQuery(COURSE_LEARNING_PATH_GENERAL_RESOURCES_LABEL, query) ||
    matchesQuery('Resources', query) ||
    resourceSectionMatch
  const resourceSelected = isCourseLearningPathResourceSelection(selectedId)
  const overviewSelected = isCourseLearningPathOverviewSelection(selectedId)
  const knowledgeSelected = isCourseLearningPathKnowledgeSelection(selectedId)
  const noMatches =
    searching &&
    !showOverview &&
    !showKnowledge &&
    !showResources &&
    filteredTopics.length === 0

  return (
    <nav aria-label='Course syllabus' className={styles.nav}>
      {hideSearch ? null : (
        <div className={styles.searchWrap}>
          <input
            type='search'
            className={styles.search}
            placeholder='SEARCH'
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label='Search in syllabus'
          />
        </div>
      )}
      {noMatches ? (
        <p className={styles.navSyllabusEmpty}>No matching topics.</p>
      ) : null}
      {showOverview || showResources ? (
        <div className={styles.navSectionGroup}>
          {showOverview ? (
            <div
              className={`${styles.navPanelSection} ${styles.navOverviewSection}`}
            >
              <div
                className={`${styles.navRow}${
                  overviewSelected ? ` ${styles.navRowSelected}` : ''
                }`}
                style={{ paddingLeft: 4 }}
              >
                <button
                  type='button'
                  onClick={() =>
                    onSelect(COURSE_LEARNING_PATH_SYLLABUS_SECTION_ID)
                  }
                  aria-current={overviewSelected ? 'true' : undefined}
                  className={styles.navSelect}
                >
                  <span
                    className={`${styles.navTitle} ${styles.navTitleTopic}${
                      overviewSelected ? ` ${styles.navTitleSelected}` : ''
                    }`}
                  >
                    {LEARNING_PATH_OVERVIEW_LABEL}
                  </span>
                </button>
              </div>
            </div>
          ) : null}

          {showResources ? (
            <div
              className={`${styles.navPanelSection} ${styles.navGeneralResourcesSection}`}
            >
          <div
            className={`${styles.navRow}${
              resourceSelected ? ` ${styles.navRowSelected}` : ''
            }`}
            style={{ paddingLeft: 4 }}
          >
            <button
              type='button'
              onClick={() =>
                onSelect(COURSE_LEARNING_PATH_RESOURCES_SECTION_ID)
              }
              aria-current={resourceSelected ? 'true' : undefined}
              className={styles.navSelect}
            >
              <span
                className={`${styles.navTitle} ${styles.navTitleTopic}${
                  resourceSelected ? ` ${styles.navTitleSelected}` : ''
                }`}
              >
                {COURSE_LEARNING_PATH_GENERAL_RESOURCES_LABEL}
              </span>
            </button>
          </div>
        </div>
          ) : null}
        </div>
      ) : null}

      {filteredTopics.length > 0 ? (
        <ol className={styles.navList}>
          {filteredTopics.map((topic, i) => (
            <NavItem
              key={topic.id}
              node={topic}
              index={i + 1}
              depth={0}
              selectedId={selectedId}
              expanded={expanded}
              exploredIds={exploredIds}
              forceOpen={searching}
              onSelect={onSelect}
              onToggle={onToggle}
            />
          ))}
        </ol>
      ) : !searching && course.topics.length === 0 ? (
        <p className={styles.navSyllabusEmpty}>Syllabus topics coming soon.</p>
      ) : null}

      {showKnowledge ? (
        <div className={styles.navPanelSection}>
          <div
            className={`${styles.navRow}${
              knowledgeSelected ? ` ${styles.navRowSelected}` : ''
            }`}
            style={{ paddingLeft: 4 }}
          >
            <button
              type='button'
              onClick={() =>
                onSelect(COURSE_LEARNING_PATH_KNOWLEDGE_SECTION_ID)
              }
              aria-current={knowledgeSelected ? 'true' : undefined}
              className={styles.navSelect}
            >
              <span
                className={`${styles.navTitle} ${styles.navTitleTopic}${
                  knowledgeSelected ? ` ${styles.navTitleSelected}` : ''
                }`}
              >
                What you learned
              </span>
              {learnedTopics.length > 0 ? (
                <span className={styles.videoCount}>
                  {learnedTopics.length}
                </span>
              ) : null}
            </button>
          </div>
        </div>
      ) : null}
    </nav>
  )
}

interface NavItemProps {
  node: CourseLearningPathNode
  index: number
  depth: number
  selectedId: string
  expanded: Set<string>
  exploredIds: Set<string>
  forceOpen?: boolean
  onSelect: (id: string) => void
  onToggle: (id: string) => void
}

function NavItem({
  node,
  index,
  depth,
  selectedId,
  expanded,
  exploredIds,
  forceOpen = false,
  onSelect,
  onToggle
}: NavItemProps) {
  const hasChildren = Boolean(node.children?.length)
  const isOpen = forceOpen || expanded.has(node.id)
  const isSelected = selectedId === node.id
  const isExplored = exploredIds.has(node.id)
  const videoCount = node.topicResources?.length ?? 0
  const isTopic = depth === 0

  return (
    <li className={isTopic ? styles.navTopicItem : undefined}>
      <div
        className={`${styles.navRow}${
          isSelected ? ` ${styles.navRowSelected}` : ''
        }`}
      >
        <button
          type='button'
          onClick={() => onSelect(node.id)}
          aria-current={isSelected ? 'true' : undefined}
          className={styles.navSelect}
        >
          <span
            className={[
              styles.navTitle,
              depth === 0 ? styles.navTitleTopic : '',
              depth >= 2 ? styles.navTitleConcept : '',
              isSelected ? styles.navTitleSelected : ''
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {depth === 0 && <span className={styles.navIndex}>{index}.</span>}
            {node.title}
          </span>
          {videoCount > 0 && (
            <span className={styles.videoCount}>{videoCount}</span>
          )}
        </button>
        <span className={styles.completeCheckSlot}>
          {isExplored ? <PathCompleteCheck /> : null}
        </span>
        {hasChildren ? (
          <button
            type='button'
            onClick={() => onToggle(node.id)}
            aria-label={
              isOpen ? `Collapse ${node.title}` : `Expand ${node.title}`
            }
            aria-expanded={isOpen}
            className={styles.chevronBtn}
          >
            <OutlineAccordionChevron open={isOpen} />
          </button>
        ) : null}
      </div>

      {hasChildren && isOpen && (
        <ol className={styles.navList}>
          {node.children!.map((child, i) => (
            <NavItem
              key={child.id}
              node={child}
              index={i + 1}
              depth={depth + 1}
              selectedId={selectedId}
              expanded={expanded}
              exploredIds={exploredIds}
              forceOpen={forceOpen}
              onSelect={onSelect}
              onToggle={onToggle}
            />
          ))}
        </ol>
      )}
    </li>
  )
}

export function PlayIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width={size}
      height={size}
      viewBox='0 0 16 16'
      fill='none'
      aria-hidden
    >
      <circle cx='8' cy='8' r='6.25' stroke='currentColor' strokeWidth='1.2' />
      <path d='M6.75 5.5L11 8L6.75 10.5V5.5Z' fill='currentColor' />
    </svg>
  )
}
