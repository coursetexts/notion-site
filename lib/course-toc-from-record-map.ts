import type { Block, ExtendedRecordMap } from 'notion-types'
import { getBlockTitle, parsePageId, uuidToId } from 'notion-utils'

import { getRecordBlockValue } from '@/lib/notion-record-block'

const HEADING_TYPES = new Set(['header', 'sub_header', 'sub_sub_header'])

function pageIdVariants(pageId: string): string[] {
  const raw = pageId.trim()
  if (!raw) return []
  const uuid = parsePageId(raw, { uuid: true }) || ''
  const compact =
    parsePageId(raw, { uuid: false }) || (uuid ? uuidToId(uuid) : '')
  return [...new Set([raw, uuid, compact].filter(Boolean))]
}

function blockById(
  recordMap: ExtendedRecordMap,
  blockId: string
): Block | undefined {
  const direct = getRecordBlockValue(recordMap, blockId)
  if (direct) return direct
  const uuid = parsePageId(blockId, { uuid: true })
  if (uuid && uuid !== blockId) {
    const dashed = getRecordBlockValue(recordMap, uuid)
    if (dashed) return dashed
  }
  const compact = parsePageId(blockId, { uuid: false })
  if (compact && compact !== blockId) {
    return getRecordBlockValue(recordMap, compact)
  }
  return undefined
}

function resolveRootBlockId(
  recordMap: ExtendedRecordMap,
  pageId: string
): string | null {
  for (const id of pageIdVariants(pageId)) {
    if (blockById(recordMap, id)) return id
  }
  const target = parsePageId(pageId, { uuid: true })
  if (!target || !recordMap.block) return null
  for (const key of Object.keys(recordMap.block)) {
    if (parsePageId(key, { uuid: true }) === target) return key
  }
  return null
}

/** Heading titles in document order — fallback TOC when the course page has not been opened. */
export function extractCourseTocLabelsFromRecordMap(
  recordMap: ExtendedRecordMap,
  pageId: string
): string[] {
  const rootId = resolveRootBlockId(recordMap, pageId)
  if (!rootId) return []
  const labels: string[] = []
  const seen = new Set<string>()

  const visit = (blockId: string, isRoot: boolean) => {
    const block = blockById(recordMap, blockId)
    if (!block) return
    if (
      !isRoot &&
      (block.type === 'page' || block.type === 'collection_view_page')
    ) {
      return
    }
    if (HEADING_TYPES.has(block.type)) {
      const title = (getBlockTitle(block, recordMap) || '')
        .replace(/\s+/g, ' ')
        .trim()
      if (title && !seen.has(title)) {
        seen.add(title)
        labels.push(title)
      }
    }
    const children = Array.isArray(block.content) ? block.content : []
    for (const child of children) visit(child, false)
  }

  visit(rootId, true)
  return labels
}
