import { ExtendedRecordMap } from 'notion-types'
import { getAllPagesInSpace, getPageProperty } from 'notion-utils'
import pMemoize from 'p-memoize'

import * as config from './config'
import * as types from './types'
import { includeNotionIdInUrls } from './config'
import { getCanonicalPageId } from './get-canonical-page-id'
import { getRecordBlockValue } from './notion-record-block'
import { getPageWithRetry } from './notion-api'

const uuid = !!includeNotionIdInUrls

export async function getSiteMap(): Promise<types.SiteMap> {
  const partialSiteMap = await getAllPages(
    config.rootNotionPageId,
    config.rootNotionSpaceId
  )

  return {
    site: config.site,
    ...partialSiteMap
  } as types.SiteMap
}

const getAllPages = pMemoize(getAllPagesImpl, {
  cacheKey: (...args) => JSON.stringify(args)
})

async function getAllPagesImpl(
  rootNotionPageId: string,
  rootNotionSpaceId: string
): Promise<Partial<types.SiteMap>> {
  const getPage = async (pageId: string): Promise<ExtendedRecordMap> => {
    // Larger first chunk + fetchMissingBlocks (default) reduces incomplete trees on big pages.
    return getPageWithRetry(pageId, 3, {
      chunkLimit: process.env.NOTION_PAGE_CHUNK_LIMIT
        ? Number(process.env.NOTION_PAGE_CHUNK_LIMIT)
        : 250
    })
  }

  const pageMap = await getAllPagesInSpace(
    rootNotionPageId,
    rootNotionSpaceId,
    getPage as any
  )

  const canonicalPageMap = Object.keys(pageMap).reduce(
    (map, pageId: string) => {
      const recordMap = pageMap[pageId]
      if (!recordMap) {
        console.warn(`Skipping page "${pageId}" - failed to load`)
        return map
      }

      const block = getRecordBlockValue(recordMap, pageId)
      if (!block) {
        console.warn(`Skipping page "${pageId}" - no block value`)
        return map
      }
      if (
        !(getPageProperty<boolean | null>('Public', block, recordMap) ?? true)
      ) {
        return map
      }

      let canonicalPageId = getCanonicalPageId(pageId, recordMap, {
        uuid
      })

      if (!canonicalPageId) {
        console.warn(`Skipping page "${pageId}" - no canonical ID generated`)
        return map
      }

      // Handle duplicates by appending page ID suffix
      const originalId = canonicalPageId
      if (map[canonicalPageId]) {
        const shortPageId = pageId.slice(-8) // Use last 8 chars of page ID
        canonicalPageId = `${originalId}-${shortPageId}`
        console.warn('Duplicate canonical ID detected:', {
          originalId,
          existingPageId: map[originalId],
          newPageId: pageId,
          newCanonicalId: canonicalPageId
        })
      }

      return {
        ...map,
        [canonicalPageId]: pageId
      }
    },
    {}
  )

  console.log(
    `Successfully processed ${Object.keys(canonicalPageMap).length} pages`
  )

  return {
    pageMap,
    canonicalPageMap
  }
}
