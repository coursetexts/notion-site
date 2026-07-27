import { NotionAPI } from '@genthegreat/notion-client'
import { getPageContentBlockIds } from 'notion-utils'
import pMap from 'p-map'

import { normalizeRecordMapBlocks } from './notion-record-block'

const notionClient = new NotionAPI({
  apiBaseUrl: process.env.NOTION_API_BASE_URL
})

export type GetPageOptions = {
  chunkLimit?: number
  fetchMissingBlocks?: boolean
}

async function fillMissingBlocks(recordMap: any): Promise<any> {
  if (!recordMap?.block) return recordMap

  normalizeRecordMapBlocks(recordMap)

  for (let pass = 0; pass < 10; pass += 1) {
    const pendingIds = getPageContentBlockIds(recordMap).filter(
      (id) => !recordMap.block[id]?.value
    )

    if (!pendingIds.length) break

    console.log(
      `notion fillMissingBlocks: fetching ${
        pendingIds.length
      } missing blocks (pass ${pass + 1})`
    )

    const response: any = await (notionClient as any).getBlocks(pendingIds)
    const fetchedRecordMap = response?.recordMap
    const fetchedBlocks = fetchedRecordMap?.block || {}
    const resolvedCount = pendingIds.filter(
      (id) => fetchedBlocks[id]?.value || fetchedBlocks[id]?.value?.value
    ).length

    if (!Object.keys(fetchedBlocks).length || resolvedCount === 0) {
      console.warn(
        `notion fillMissingBlocks: made no progress for ${pendingIds.length} block(s), stopping`
      )
      break
    }

    normalizeRecordMapBlocks(fetchedRecordMap)
    Object.assign(recordMap.block, fetchedRecordMap.block)
  }

  return recordMap
}

const rawGetPage = notionClient.getPage.bind(notionClient)

notionClient.getPage = (async (
  ...args: Parameters<typeof rawGetPage>
): Promise<any> => {
  const options = args[1] as GetPageOptions | undefined
  // The upstream client's fetchMissingBlocks loop is uncapped. Disable it and
  // recover missing blocks exclusively through the bounded loop above.
  const recordMap = await rawGetPage(args[0], {
    ...options,
    fetchMissingBlocks: false
  })
  normalizeRecordMapBlocks(recordMap)

  return options?.fetchMissingBlocks === false
    ? recordMap
    : fillMissingBlocks(recordMap)
}) as typeof notionClient.getPage

export const notion = notionClient

function parseRetryAfterMs(
  headerValue: string | null | undefined
): number | null {
  if (!headerValue) return null

  const seconds = Number(headerValue)
  if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1000

  const dateMs = Date.parse(headerValue)
  if (Number.isNaN(dateMs)) return null

  return Math.max(0, dateMs - Date.now())
}

function normalizeChunkLimit(value: number | undefined): number {
  if (!Number.isFinite(value) || !value || value < 1) return 250
  return Math.min(Math.floor(value), 1000)
}

// Rate-limited wrapper for getPage
export async function getPageWithRetry(
  pageId: string,
  maxRetries = 6,
  getPageOpts?: GetPageOptions
): Promise<any> {
  const chunkLimit = normalizeChunkLimit(
    getPageOpts?.chunkLimit ??
      (process.env.NOTION_PAGE_CHUNK_LIMIT
        ? Number(process.env.NOTION_PAGE_CHUNK_LIMIT)
        : undefined)
  )
  const fetchMissingBlocks = getPageOpts?.fetchMissingBlocks ?? true

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`notion getPage ${pageId} (attempt ${attempt})`)
      return await notion.getPage(pageId, {
        chunkLimit,
        fetchMissingBlocks
      })
    } catch (error: any) {
      const status = error?.response?.status
      const isRetryable =
        status === 429 ||
        (status && status >= 500) ||
        /timed out|fetch failed|ECONNRESET|ETIMEDOUT/i.test(
          error?.message || ''
        )

      if (isRetryable && attempt < maxRetries) {
        const retryAfterMs = parseRetryAfterMs(
          error?.response?.headers?.get?.('retry-after')
        )
        // Honor the service's Retry-After instruction (with a defensive
        // five-minute ceiling). Only our own exponential fallback is capped
        // at 30 seconds.
        const delay =
          retryAfterMs === null
            ? Math.min(30000, Math.pow(2, attempt) * 1000)
            : Math.min(300000, retryAfterMs)

        console.log(
          `notion retryable error (${
            status ?? error?.message
          }), retrying in ${delay}ms...`
        )
        await new Promise((resolve) => setTimeout(resolve, delay))
        continue
      }

      console.error(`page load error`, { pageId }, error?.message)
      throw error
    }
  }

  throw new Error(`getPageWithRetry: exhausted retries for ${pageId}`)
}

// Throttled batch processing
export async function getPages(
  pageIds: string[]
): Promise<{ [pageId: string]: any }> {
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
