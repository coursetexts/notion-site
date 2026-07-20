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

    if (!Object.keys(fetchedBlocks).length) {
      console.warn(
        `notion fillMissingBlocks: getBlocks returned no data for ${pendingIds.length} block(s), stopping`
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
  const recordMap = await rawGetPage(...args)
  normalizeRecordMapBlocks(recordMap)

  const options = args[1] as GetPageOptions | undefined
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

// Rate-limited wrapper for getPage
export async function getPageWithRetry(
  pageId: string,
  maxRetries = 3,
  getPageOpts?: GetPageOptions
): Promise<any> {
  const chunkLimit =
    getPageOpts?.chunkLimit ??
    (process.env.NOTION_PAGE_CHUNK_LIMIT
      ? Number(process.env.NOTION_PAGE_CHUNK_LIMIT)
      : 250)
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
        const delay = Math.min(
          30000,
          retryAfterMs ?? Math.pow(2, attempt) * 1000
        )

        console.log(
          `notion retryable error (${
            status ?? error?.message
          }), retrying in ${delay}ms...`
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
