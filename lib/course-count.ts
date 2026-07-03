import { ExtendedRecordMap } from 'notion-types'
import { parsePageId } from 'notion-utils'

const liveCourseCountReplacements = [
  {
    pattern: /\bpreviously published \d+\+? courses\b/g,
    replacement: (courseCount: number) =>
      `previously published ${courseCount} courses`
  },
  {
    pattern: /\bpublished \d+\+? open access courses\b/g,
    replacement: (courseCount: number) =>
      `published ${courseCount} open access courses`
  }
]

function getBlock(recordMap: ExtendedRecordMap, blockId: string) {
  const rawId = parsePageId(blockId, { uuid: false }) || blockId
  const uuidId = parsePageId(blockId, { uuid: true }) || rawId
  const candidateIds = Array.from(
    new Set([blockId, rawId, uuidId].filter(Boolean))
  )

  for (const candidateId of candidateIds) {
    const block = recordMap?.block?.[candidateId]?.value
    if (block) return block
  }
}

function getPlainTitle(block: any): string {
  const title = block?.properties?.title
  if (!Array.isArray(title)) return ''

  return title.map((part) => (Array.isArray(part) ? part[0] : '')).join('')
}

function getCourseCardText(
  recordMap: ExtendedRecordMap,
  siblingIds: string[],
  startIndex: number
): string {
  const parts: string[] = []

  for (let index = startIndex; index < siblingIds.length; index += 1) {
    const block = getBlock(recordMap, siblingIds[index])
    if (!block) continue
    if (index !== startIndex && block.type === 'page') break

    const text = getPlainTitle(block).trim()
    if (index !== startIndex && !text) break

    parts.push(text)
  }

  return parts.join(' ').toLowerCase()
}

export function shouldHideCourseFromPublicHome(
  courseText: string,
  isProduction: boolean
) {
  return isProduction && courseText.toLowerCase().includes('adam cohen')
}

export function getVisibleCourseCount(
  recordMap: ExtendedRecordMap,
  rootPageId: string,
  isProduction: boolean
) {
  const rootBlock = getBlock(recordMap, rootPageId)
  const siblingIds = rootBlock?.content || []

  return siblingIds.reduce((count: number, blockId: string, index: number) => {
    const block = getBlock(recordMap, blockId)
    if (block?.type !== 'page') return count

    const cardText = getCourseCardText(recordMap, siblingIds, index)
    if (shouldHideCourseFromPublicHome(cardText, isProduction)) return count

    return count + 1
  }, 0)
}

export function applyLiveCourseCount(
  recordMap: ExtendedRecordMap,
  courseCount: number
) {
  Object.values(recordMap?.block || {}).forEach((blockEntry: any) => {
    const title = blockEntry?.value?.properties?.title
    if (!Array.isArray(title)) return

    title.forEach((part: any[]) => {
      if (!Array.isArray(part) || typeof part[0] !== 'string') return

      part[0] = liveCourseCountReplacements.reduce(
        (text, { pattern, replacement }) =>
          text.replace(pattern, replacement(courseCount)),
        part[0]
      )
    })
  })
}
