import { ExtendedRecordMap, SearchParams, SearchResults } from 'notion-types'
import { mergeRecordMaps } from 'notion-utils'
import pMap from 'p-map'
import pMemoize from 'p-memoize'

import {
  isPreviewImageSupportEnabled,
  navigationLinks,
  navigationStyle
} from './config'
import { getPageWithRetry, notion } from './notion-api'
import { getPreviewImageMap } from './preview-images'

const getNavigationLinkPages = pMemoize(
  async (): Promise<ExtendedRecordMap[]> => {
    const navigationLinkPageIds = (navigationLinks || [])
      .map((link) => link.pageId)
      .filter(Boolean)

    if (navigationStyle !== 'default' && navigationLinkPageIds.length) {
      return pMap(
        navigationLinkPageIds,
        async (navigationLinkPageId) =>
          notion.getPage(navigationLinkPageId, {
            chunkLimit: 1,
            fetchMissingBlocks: false,
            fetchCollections: false,
            signFileUrls: false
          }),
        {
          concurrency: 4
        }
      )
    }

    return []
  }
)

function sanitizeRecordMapBlocks(recordMap: ExtendedRecordMap, pageId: string) {
  const blockMap = (recordMap as any).block || {}
  let removed = 0
  let repaired = 0

  for (const [blockId, blockEntry] of Object.entries<any>(blockMap)) {
    const value = blockEntry?.value

    // Remove malformed blocks which cannot be rendered safely.
    if (!blockId || !value || typeof value !== 'object') {
      delete blockMap[blockId]
      removed += 1
      continue
    }

    // Some Notion responses omit value.id; react-notion-x expects it.
    if (!value.id) {
      value.id = blockId
      repaired += 1
    }
  }

  if (removed || repaired) {
    console.warn('Sanitized recordMap blocks', {
      pageId,
      removed,
      repaired
    })
  }
}

export async function getPage(pageId: string): Promise<ExtendedRecordMap> {
  let recordMap: ExtendedRecordMap

  try {
    recordMap = await getPageWithRetry(pageId)
  } catch (error: any) {
    console.error('Failed to fetch Notion page after retries', {
      pageId,
      message: error?.message
    })
    throw error
  }

  // Validate that we received valid page data
  if (!recordMap || typeof recordMap !== 'object' || !recordMap.block) {
    console.error(`Invalid recordMap received for pageId: ${pageId}`, { recordMap })
    return { block: {} } as ExtendedRecordMap
  }

  sanitizeRecordMapBlocks(recordMap, pageId)
  if (navigationStyle !== 'default') {
    // ensure that any pages linked to in the custom navigation header have
    // their block info fully resolved in the page record map so we know
    // the page title, slug, etc.
    const navigationLinkRecordMaps = await getNavigationLinkPages()

    if (navigationLinkRecordMaps?.length) {
      recordMap = navigationLinkRecordMaps.reduce(
        (map, navigationLinkRecordMap) =>
          mergeRecordMaps(map, navigationLinkRecordMap),
        recordMap
      )

      // Navigation page merges can also introduce malformed block entries.
      sanitizeRecordMapBlocks(recordMap, pageId)
    }
  }

  if (isPreviewImageSupportEnabled) {
    try {
      const previewImageMap = await getPreviewImageMap(recordMap)
      ;(recordMap as any).preview_images = previewImageMap
    } catch (error: any) {
      console.warn('Failed to fetch preview images', {
        pageId,
        message: error?.message
      })
    }
  }

  return recordMap
}

export async function search(params: SearchParams): Promise<SearchResults> {
  return notion.search(params)
}
