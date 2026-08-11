import { NotionAPI } from '@genthegreat/notion-client'
import pMap from 'p-map'

/**
 * Notion's edge (Cloudflare) rejects Node's default fetch User-Agent with 403
 * HTML challenges, which empties the site map and forces homepage course
 * placeholders. Send a browser-like UA so public pages load again.
 */
export const notion = new NotionAPI({
  apiBaseUrl: process.env.NOTION_API_BASE_URL,
  kyOptions: {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: 'application/json',
      'Accept-Language': 'en-US,en;q=0.9'
    }
  }
})

export type GetPageOptions = {
  chunkLimit?: number
  fetchMissingBlocks?: boolean
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
      if (error?.response?.status === 429 && attempt < maxRetries) {
        // Exponential backoff: wait 2^attempt seconds
        const delay = Math.pow(2, attempt) * 1000
        console.log(`Rate limited, retrying in ${delay}ms...`)
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
