import type { Block, ExtendedRecordMap } from 'notion-types'

/**
 * Notion's loadPageChunk response often nests the real block as
 * recordMap.block[id].value.value (with `role` on the outer wrapper).
 * Reading only `.value` once yields an object without `type` / `content`.
 */
export function getRecordBlockValue(
  recordMap: ExtendedRecordMap,
  blockId: string
): Block | undefined {
  const entry = recordMap.block?.[blockId] as { value?: unknown } | undefined
  if (entry == null || entry.value == null) return undefined

  let node: unknown = entry.value
  for (let i = 0; i < 6 && node && typeof node === 'object'; i++) {
    const o = node as Record<string, unknown>
    const looksLikeBlock =
      typeof o.type === 'string' && typeof o.id === 'string'

    if (looksLikeBlock) {
      return node as Block
    }

    const inner = o.value
    if (inner && typeof inner === 'object') {
      node = inner
      continue
    }
    break
  }

  if (node && typeof node === 'object' && typeof (node as Block).type === 'string') {
    return node as Block
  }
  return undefined
}

type BlockEntry = { value?: unknown; role?: string; [key: string]: unknown }

/**
 * Mutates `recordMap.block` so each entry is `{ value: Block, role? }` with a
 * real Block at `.value` (unwraps `{ value: { value: Block } }` from Notion).
 * Downstream code and notion-utils expect a single `.value` layer.
 */
export function normalizeRecordMapBlocks(recordMap: ExtendedRecordMap): void {
  const blocks = recordMap?.block
  if (!blocks || typeof blocks !== 'object') return

  for (const blockId of Object.keys(blocks)) {
    const block = getRecordBlockValue(recordMap, blockId)
    if (!block) continue

    const raw = blocks[blockId] as BlockEntry
    if (!raw || typeof raw !== 'object') continue

    const rest: Record<string, unknown> = { ...raw }
    delete rest.value
    ;(blocks as Record<string, unknown>)[blockId] = {
      ...rest,
      value: block
    }
  }
}
