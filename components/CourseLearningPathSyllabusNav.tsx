import * as React from 'react'

import { LEARNING_PATH_MENTAL_MAP_LABEL } from '@/lib/learning-path-sections'
import {
  COURSE_LEARNING_PATH_KNOWLEDGE_SECTION_ID,
  COURSE_LEARNING_PATH_MENTAL_MAP_SECTION_ID,
  COURSE_LEARNING_PATH_RESOURCES_SECTION_ID,
  COURSE_LEARNING_PATH_RESOURCE_SECTIONS,
  COURSE_LEARNING_PATH_SYLLABUS_SECTION_ID,
  type CourseLearningPathResourceSection,
  isCourseLearningPathKnowledgeSelection,
  isCourseLearningPathMentalMapSelection,
  isCourseLearningPathResourceSelection,
  isCourseLearningPathSyllabusSelection,
  resourcesForSection
} from '@/lib/course-learning-path-resources'
import {
  isCourseLearningPathFinished,
  knowledgeTopicItemsFromCourseLearningPath
} from '@/lib/learning-path-knowledge'
import type {
  CourseLearningPathData,
  CourseLearningPathNode
} from '@/lib/course-learning-path-types'

import {
  OutlineAccordionChevron,
  PathCompleteCheck
} from './PathCompleteCheck'
import styles from './CourseLearningPath.module.css'

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
  const showSyllabus =
    !searching || matchesQuery('Recommended Syllabus', query)
  const showMentalMap =
    !searching ||
    matchesQuery('Mental Map', query) ||
    matchesQuery(LEARNING_PATH_MENTAL_MAP_LABEL, query)
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
  const matchingResourceSections = searching
    ? COURSE_LEARNING_PATH_RESOURCE_SECTIONS.filter(
        (section) =>
          matchesQuery('Resources', query) || matchesQuery(section.label, query)
      )
    : COURSE_LEARNING_PATH_RESOURCE_SECTIONS
  const showResources =
    !searching ||
    matchesQuery('Resources', query) ||
    matchingResourceSections.length > 0
  const resourcesOpen =
    searching || expanded.has(COURSE_LEARNING_PATH_RESOURCES_SECTION_ID)
  const resourceSelected = isCourseLearningPathResourceSelection(selectedId)
  const syllabusSelected = isCourseLearningPathSyllabusSelection(selectedId)
  const mentalMapSelected = isCourseLearningPathMentalMapSelection(selectedId)
  const knowledgeSelected = isCourseLearningPathKnowledgeSelection(selectedId)
  const noMatches =
    searching &&
    !showSyllabus &&
    !showMentalMap &&
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
      {showSyllabus || showMentalMap || filteredTopics.length > 0 || (!searching && course.topics.length === 0) ? (
      <div className={styles.navPanelSection}>
        {showMentalMap ? (
        <div
          className={`${styles.navRow}${
            mentalMapSelected ? ` ${styles.navRowSelected}` : ''
          }`}
          style={{ paddingLeft: 4 }}
        >
          <button
            type='button'
            onClick={() => onSelect(COURSE_LEARNING_PATH_MENTAL_MAP_SECTION_ID)}
            aria-current={mentalMapSelected ? 'true' : undefined}
            className={styles.navSelect}
          >
            <span
              className={`${styles.navTitle} ${styles.navTitleTopic}${
                mentalMapSelected ? ` ${styles.navTitleSelected}` : ''
              }`}
            >
              {LEARNING_PATH_MENTAL_MAP_LABEL}
            </span>
          </button>
        </div>
        ) : null}

        {showSyllabus ? (
        <div
          className={`${styles.navRow}${
            syllabusSelected ? ` ${styles.navRowSelected}` : ''
          }`}
          style={{ paddingLeft: 4 }}
        >
          <button
            type='button'
            onClick={() => onSelect(COURSE_LEARNING_PATH_SYLLABUS_SECTION_ID)}
            aria-current={syllabusSelected ? 'true' : undefined}
            className={styles.navSelect}
          >
            <span
              className={`${styles.navTitle} ${styles.navTitleTopic}${
                syllabusSelected ? ` ${styles.navTitleSelected}` : ''
              }`}
            >
              Recommended Syllabus
            </span>
            {course.topics.length > 0 ? (
              <span className={styles.videoCount}>{course.topics.length}</span>
            ) : null}
          </button>
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
          <p className={styles.navSyllabusEmpty}>
            Syllabus topics coming soon.
          </p>
        ) : null}
      </div>
      ) : null}

      {showResources ? (
      <div className={styles.navPanelSection}>
        <div
          className={`${styles.navRow}${
            resourceSelected ? ` ${styles.navRowSelected}` : ''
          }`}
          style={{ paddingLeft: 4 }}
        >
          <button
            type='button'
            onClick={() => onToggle(COURSE_LEARNING_PATH_RESOURCES_SECTION_ID)}
            aria-label={
              resourcesOpen ? 'Collapse Resources' : 'Expand Resources'
            }
            aria-expanded={resourcesOpen}
            className={styles.chevronBtn}
          >
            <ChevronIcon
              className={`${styles.chevronIcon}${
                resourcesOpen ? ` ${styles.chevronOpen}` : ''
              }`}
            />
          </button>
          <button
            type='button'
            onClick={() => {
              if (!resourcesOpen) onToggle(COURSE_LEARNING_PATH_RESOURCES_SECTION_ID)
              const first = matchingResourceSections[0] ?? COURSE_LEARNING_PATH_RESOURCE_SECTIONS[0]
              onSelect(first.id)
            }}
            className={styles.navSelect}
          >
            <span
              className={`${styles.navTitle} ${styles.navTitleTopic}${
                resourceSelected ? ` ${styles.navTitleSelected}` : ''
              }`}
            >
              Resources
            </span>
            {(course.resources?.length ?? 0) > 0 ? (
              <span className={styles.videoCount}>
                {course.resources!.length}
              </span>
            ) : null}
          </button>
        </div>

        {resourcesOpen ? (
          <ol className={styles.navList}>
            {matchingResourceSections.map((section) => (
              <ResourceNavItem
                key={section.id}
                section={section}
                count={
                  resourcesForSection(course.resources, section.kind).length
                }
                selectedId={selectedId}
                onSelect={onSelect}
              />
            ))}
          </ol>
        ) : null}
      </div>
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
            onClick={() => onSelect(COURSE_LEARNING_PATH_KNOWLEDGE_SECTION_ID)}
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
              <span className={styles.videoCount}>{learnedTopics.length}</span>
            ) : null}
          </button>
        </div>
      </div>
      ) : null}
    </nav>
  )
}

function ResourceNavItem({
  section,
  count,
  selectedId,
  onSelect
}: {
  section: CourseLearningPathResourceSection
  count: number
  selectedId: string
  onSelect: (id: string) => void
}) {
  const isSelected = selectedId === section.id

  return (
    <li>
      <div
        className={`${styles.navRow}${
          isSelected ? ` ${styles.navRowSelected}` : ''
        }`}
        style={{ paddingLeft: 8 }}
      >
        <button
          type='button'
          onClick={() => onSelect(section.id)}
          aria-current={isSelected ? 'true' : undefined}
          className={styles.navSelect}
        >
          <span
            className={`${styles.navTitle}${
              isSelected ? ` ${styles.navTitleSelected}` : ''
            }`}
          >
            {section.label}
          </span>
          {count > 0 ? (
            <span className={styles.videoCount}>{count}</span>
          ) : null}
        </button>
      </div>
    </li>
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

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 16 16'
      fill='none'
      aria-hidden
    >
      <path
        d='M6 3.5L10.5 8L6 12.5'
        stroke='currentColor'
        strokeWidth='1.4'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
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
