import {
  type PathTreeItem,
  isCoreStep,
  parentMap,
  visibleTree
} from '@/lib/learning-path-graph-layout'
import { learningPathTopicHasWhy } from '@/lib/learning-path-publish'
import {
  isLearningPathKnowledgeSelection,
  isLearningPathOverviewSelection,
  outlineTreeWithoutGoal
} from '@/lib/learning-path-sections'
import {
  type LearningPathData,
  type PathMark,
  sequenceMarks
} from '@/lib/learning-path-seed'

function quote(value: string) {
  return `"${value.replace(/\s+/g, ' ').trim()}"`
}

function displayMark(mark?: PathMark) {
  if (!mark?.mark) return ''
  if (mark.role === 'core') return mark.mark
  return `${mark.mark})`
}

function locationSentence(path: LearningPathData, selectedId: string) {
  const title = path.title.trim() || 'this learning path'
  if (isLearningPathOverviewSelection(selectedId)) {
    return `I am on the path ${quote(
      title
    )}. I am viewing the path overview, not a specific step.`
  }
  if (isLearningPathKnowledgeSelection(selectedId)) {
    return `I am on the path ${quote(
      title
    )}. I am reviewing what I learned on this path.`
  }
  const byId = Object.fromEntries(path.nodes.map((node) => [node.id, node]))
  const selected = byId[selectedId]
  if (!selected) {
    return `I am on the path ${quote(title)}.`
  }
  if (selected.kind === 'goal') {
    return `I am on the path ${quote(title)}. I am on the goal ${quote(
      selected.label
    )}.`
  }
  const parents = parentMap(path)
  const chain: string[] = []
  let current: string | undefined = selectedId
  const seen = new Set<string>()
  while (current && !seen.has(current)) {
    seen.add(current)
    const node = byId[current]
    if (!node || node.kind === 'goal') break
    const label = node.label.trim()
    if (label) chain.push(label)
    if (isCoreStep(node)) break
    current = parents.get(current)
  }
  if (chain.length === 0) {
    return `I am on the path ${quote(title)}.`
  }
  const [here, ...ancestors] = chain
  if (ancestors.length === 0) {
    return `I am on the path ${quote(title)}. I am on the step ${quote(here)}.`
  }
  const insides = ancestors
    .map((label) => `which is inside the step ${quote(label)}`)
    .join(' ')
  return `I am on the path ${quote(
    title
  )}. I am on the step ${quote(here)} ${insides}.`
}

function formatOutline(path: LearningPathData) {
  const marks = sequenceMarks(path)
  const tree = outlineTreeWithoutGoal(visibleTree(path, path.nodes))
  const lines: string[] = []

  function walk(items: PathTreeItem[]) {
    for (const item of items) {
      const mark = displayMark(marks[item.node.id])
      const label = item.node.label.trim()
      const heading = [mark, label].filter(Boolean).join(' ')
      if (heading) lines.push(heading)
      if (learningPathTopicHasWhy(item.node.why)) {
        lines.push(`Why is this on the learning path: ${item.node.why.trim()}`)
      }
      lines.push('')
      if (item.children.length > 0) walk(item.children)
    }
  }

  walk(tree)
  return lines.join('\n').trim()
}

/** Clipboard text: where you are, the numbered outline with whys, and the goal. */
export function formatLearningPathExportContext({
  path,
  selectedId
}: {
  path: LearningPathData
  selectedId: string
}): string {
  const goal = (path.goal || path.title).trim()
  const summary = path.summary.trim()
  const outline = formatOutline(path)
  const parts = [
    locationSentence(path, selectedId),
    '',
    'The entire learning path I am going to take is:',
    '',
    outline || '(This path has no steps yet.)',
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
