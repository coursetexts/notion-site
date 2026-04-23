import { NotionAPI } from '@genthegreat/notion-client'
import { getPageContentBlockIds } from 'notion-utils'
import pMap from 'p-map'

const notionClient = new NotionAPI({
  apiBaseUrl: process.env.NOTION_API_BASE_URL
})

// REASON: Notion's unofficial API returns blocks double-nested as
// `{spaceId, value: {role, value: <actual block>}}`. The @genthegreat fork
// flattens this to `{spaceId, role, value: <block>}` so downstream consumers
// (notion-utils, react-notion-x) can read block.value.content / .properties
// directly. Without this, getPageContentBlockIds returns just the root id
// because it walks `entry.value.content` which is undefined in the raw shape.
function normalizeRecordMap(recordMap: any) {
  if (!recordMap?.block) {
    return recordMap
  }

  const normalizedBlocks = Object.fromEntries(
    Object.entries(recordMap.block).map(([blockId, entry]: [string, any]) => {
      const nestedValue = entry?.value?.value

      if (!nestedValue) {
        return [blockId, entry]
      }

      return [
        blockId,
        {
          ...entry,
          role: entry.role ?? entry.value?.role,
          value: nestedValue
        }
      ]
    })
  )

  return {
    ...recordMap,
    block: normalizedBlocks
  }
}

// REASON: The library's internal fetchMissingBlocks loop inside getPage runs
// BEFORE normalization, so it sees the double-nested shape and can't walk the
// content tree — it returns only the root id and exits. That means any page
// whose block tree exceeds `chunkLimit` (100 by default) silently drops the
// rest. Here we re-run the missing-block fill AFTER normalization to recover
// the cut-off blocks. Removing this will cause the homepage to drop ~17 of
// 42 courses (including anything added after the 100-block mark in Notion).
async function fillMissingBlocks(recordMap: any): Promise<any> {
  if (!recordMap?.block) return recordMap

  // Bounded iteration — each pass should discover references inside the
  // blocks we just fetched. Cap at 10 to avoid pathological loops.
  for (let i = 0; i < 10; i++) {
    const pendingIds = getPageContentBlockIds(recordMap).filter(
      (id) => !recordMap.block[id]?.value
    )
    if (!pendingIds.length) break

    console.log(`notion fillMissingBlocks: fetching ${pendingIds.length} missing blocks (pass ${i + 1})`)

    const res: any = await (notionClient as any).getBlocks(pendingIds)
    const fetched = res?.recordMap?.block || {}

    // Normalize freshly fetched blocks into the same flat shape.
    for (const [id, entry] of Object.entries<any>(fetched)) {
      const inner = entry?.value?.value
      recordMap.block[id] = inner
        ? { ...entry, role: entry.role ?? entry.value?.role, value: inner }
        : entry
    }
  }

  return recordMap
}

const rawGetPage = notionClient.getPage.bind(notionClient)
notionClient.getPage = (async (...args: Parameters<typeof rawGetPage>) => {
  const normalized = normalizeRecordMap(await rawGetPage(...args))
  return fillMissingBlocks(normalized)
}) as typeof notionClient.getPage

export const notion = notionClient

// REASON: Notion's 429 responses include a Retry-After header telling us
// exactly how long to back off. Respecting it is both politer and usually
// faster than a blind exponential schedule: Notion often asks for <1s when
// the burst was small, and >10s when we're deep in the penalty box. Spec:
// Retry-After can be an integer (seconds) or an HTTP-date.
function parseRetryAfterMs(headerValue: string | null | undefined): number | null {
  if (!headerValue) return null
  const seconds = Number(headerValue)
  if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1000
  const dateMs = Date.parse(headerValue)
  if (!Number.isNaN(dateMs)) {
    const delta = dateMs - Date.now()
    return delta > 0 ? delta : 0
  }
  return null
}

export async function getPageWithRetry(pageId: string, maxRetries = 6): Promise<any> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`notion getPage ${pageId} (attempt ${attempt})`)
      return await notion.getPage(pageId)
    } catch (error: any) {
      const status = error?.response?.status
      const isRetryable =
        status === 429 ||
        (status && status >= 500) ||
        /timed out|fetch failed|ECONNRESET|ETIMEDOUT/i.test(error?.message || '')

      if (isRetryable && attempt < maxRetries) {
        // Prefer the server-provided Retry-After; fall back to exponential.
        // Cap at 30s so a bad clock or hostile header can't wedge us.
        const serverDelay = parseRetryAfterMs(
          error?.response?.headers?.get?.('retry-after')
        )
        const expDelay = Math.pow(2, attempt) * 1000
        const delay = Math.min(30000, serverDelay ?? expDelay)
        console.log(
          `notion retryable error (${status ?? error?.message}), ` +
            `retrying in ${delay}ms${serverDelay != null ? ' (Retry-After)' : ''}...`
        )
        await new Promise((resolve) => setTimeout(resolve, delay))
        continue
      }

      console.error(`page load error`, { pageId }, error?.message)
      if (attempt === maxRetries) {
        throw error
      }
    }
  }
}

// Throttled batch processing
export async function getPages(pageIds: string[]): Promise<{ [pageId: string]: any }> {
  console.log(`Fetching ${pageIds.length} pages with rate limiting...`)
  
  const results = await pMap(
    pageIds,
    async (pageId) => {
      try {
        const page = await getPageWithRetry(pageId)
        return { pageId, page }
      } catch (error) {
        console.error(`Failed to load page ${pageId}:`, error)
        return { pageId, page: null }
      }
    },
    { 
      concurrency: 3, // Limit to 3 concurrent requests
      stopOnError: false // Continue processing remaining items if an error occurs
    }
  )

  return results.reduce((acc, { pageId, page }) => {
    if (page) acc[pageId] = page
    return acc
  }, {} as { [pageId: string]: any })
}
