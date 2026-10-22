import {
  COURSE_LEARNING_PATH_GENERAL_RESOURCES_LABEL,
  isCourseLearningPathKnowledgeSelection,
  isCourseLearningPathOverviewSelection,
  isCourseLearningPathResourceSelection
} from '@/lib/course-learning-path-resources'
import {
  type CourseLearningPathData,
  type CourseLearningPathNode,
  buildCourseLearningPathIndex
} from '@/lib/course-learning-path-types'
import { LEARNING_PATH_OVERVIEW_LABEL } from '@/lib/learning-path-sections'

function quote(value: string) {
  return `"${value.replace(/\s+/g, ' ').trim()}"`
}

function roman(n: number) {
  const numerals = [
    'i',
    'ii',
    'iii',
    'iv',
    'v',
    'vi',
    'vii',
    'viii',
    'ix',
    'x',
    'xi',
    'xii',
    'xiii',
    'xiv',
    'xv'
  ]
  return numerals[n - 1] ?? String(n)
}

function displayMark(depth: number, index: number) {
  if (depth <= 0) return String(index)
  if (depth === 1) return `${String.fromCharCode(96 + index)})`
  return `${roman(index)})`
}

function locationSentence(course: CourseLearningPathData, selectedId: string) {
  const title = course.title.trim() || 'this course learning path'
  if (isCourseLearningPathOverviewSelection(selectedId)) {
    return `I am on the path ${quote(
      title
    )}. I am viewing the path overview, not a specific topic.`
  }
  if (isCourseLearningPathResourceSelection(selectedId)) {
    return `I am on the path ${quote(
      title
    )}. I am viewing ${quote(COURSE_LEARNING_PATH_GENERAL_RESOURCES_LABEL)}.`
  }
  if (isCourseLearningPathKnowledgeSelection(selectedId)) {
    return `I am on the path ${quote(
      title
    )}. I am reviewing what I learned on this path.`
  }
  const index = buildCourseLearningPathIndex(course)
  const entry = index[selectedId]
  if (!entry) {
    return `I am on the path ${quote(title)}.`
  }
  const chain = [
    ...entry.parents.map((parent) => parent.title.trim()),
    entry.node.title.trim()
  ].filter(Boolean)
  if (chain.length === 0) {
    return `I am on the path ${quote(title)}.`
  }
  const here = chain[chain.length - 1]
  const ancestors = chain.slice(0, -1).reverse()
  if (ancestors.length === 0) {
    return `I am on the path ${quote(title)}. I am on the topic ${quote(here)}.`
  }
  const insides = ancestors
    .map((label) => `which is inside the topic ${quote(label)}`)
    .join(' ')
  return `I am on the path ${quote(
    title
  )}. I am on the topic ${quote(here)} ${insides}.`
}

export function formatCourseLearningPathOutlineText(
  course: CourseLearningPathData
) {
  const lines: string[] = []

  function walk(nodes: CourseLearningPathNode[], depth: number) {
    nodes.forEach((node, i) => {
      const mark = displayMark(depth, i + 1)
      const label = node.title.trim()
      const heading = [mark, label].filter(Boolean).join(' ')
      if (heading) lines.push(heading)
      const why = node.description?.trim()
      if (why) {
        lines.push(`Why is this on the learning path: ${why}`)
      }
      lines.push('')
      if (node.children?.length) walk(node.children, depth + 1)
    })
  }

  walk(course.topics, 0)
  return lines.join('\n').trim()
}

/** Clipboard text: where you are, the syllabus outline with whys, and the course goal. */
export function formatCourseLearningPathExportContext({
  course,
  selectedId
}: {
  course: CourseLearningPathData
  selectedId: string
}): string {
  const goal = course.title.trim()
  const summary = course.description.trim()
  const outline = formatCourseLearningPathOutlineText(course)
  const parts = [
    locationSentence(course, selectedId),
    '',
    'The entire learning path I am going to take is:',
    '',
    outline || `(This path has no topics yet. Start from ${LEARNING_PATH_OVERVIEW_LABEL}.)`,
    '',
    `My goal is ${quote(goal)}.`
  ]
  if (summary) {
    parts.push(quote(summary))
  }
  parts.push(
    '',
    'Using this path as context, explain my current step given what I know so far and where I am going in this goal.'
  )
  return parts.join('\n').trim()
}
