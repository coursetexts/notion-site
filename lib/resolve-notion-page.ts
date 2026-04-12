import { ExtendedRecordMap } from 'notion-types'
import { parsePageId } from 'notion-utils'

import * as acl from './acl'
import { environment, pageUrlAdditions, pageUrlOverrides, site } from './config'
import { db } from './db'
import { getSiteMap } from './get-site-map'
import { getPage } from './notion'

export async function resolveNotionPage(domain: string, rawPageId?: string) {
  let pageId: string
  let recordMap: ExtendedRecordMap

  if (rawPageId && rawPageId !== 'index') {
    pageId = parsePageId(rawPageId)

    if (!pageId) {
      // check if the site configuration provides an override or a fallback for
      // the page's URI
      const override =
        pageUrlOverrides[rawPageId] || pageUrlAdditions[rawPageId]

      if (override) {
        pageId = parsePageId(override)
      }
    }

    const useUriToPageIdCache = true
    const cacheKey = `uri-to-page-id:${domain}:${environment}:${rawPageId}`
    // TODO: should we use a TTL for these mappings or make them permanent?
    // const cacheTTL = 8.64e7 // one day in milliseconds
    const cacheTTL = undefined // disable cache TTL

    if (!pageId && useUriToPageIdCache) {
      try {
        // check if the database has a cached mapping of this URI to page ID
        pageId = await db.get(cacheKey)

        // console.log(`redis get "${cacheKey}"`, pageId)
      } catch (err) {
        // ignore redis errors
        console.warn(`redis error get "${cacheKey}"`, err.message)
      }
    }

    if (pageId) {
      try {
        recordMap = await getPage(pageId)
        
        // Check if recordMap has valid data
        if (!recordMap?.block || Object.keys(recordMap.block).length === 0) {
          console.warn(`Page resolved but recordMap is empty for pageId: ${pageId}, rawPageId: ${rawPageId}`)
        }
      } catch (err) {
        console.error(`Failed to get page for pageId: ${pageId}, rawPageId: ${rawPageId}`, err)
        return {
          error: {
            message: `Failed to load page "${rawPageId}"`,
            statusCode: 500
          }
        }
      }
    } else {
      // handle mapping of user-friendly canonical page paths to Notion page IDs
      // e.g., /developer-x-entrepreneur versus /71201624b204481f862630ea25ce62fe
      const siteMap = await getSiteMap()
      pageId = siteMap?.canonicalPageMap[rawPageId]

      if (pageId) {
        // TODO: we're not re-using the page recordMap from siteMaps because it is
        // cached aggressively
        // recordMap = siteMap.pageMap[pageId]

        try {
          recordMap = await getPage(pageId)
          
          if (!recordMap?.block || Object.keys(recordMap.block).length === 0) {
            console.warn(`Page from siteMap resolved but recordMap is empty for pageId: ${pageId}, rawPageId: ${rawPageId}`)
          }

          if (useUriToPageIdCache) {
            try {
              // update the database mapping of URI to pageId
              await db.set(cacheKey, pageId, cacheTTL)

              // console.log(`redis set "${cacheKey}"`, pageId, { cacheTTL })
            } catch (err) {
              // ignore redis errors
              console.warn(`redis error set "${cacheKey}"`, err.message)
            }
          }
        } catch (err) {
          console.error(`Failed to get page from siteMap for pageId: ${pageId}, rawPageId: ${rawPageId}`, err)
          return {
            error: {
              message: `Failed to load page "${rawPageId}"`,
              statusCode: 500
            }
          }
        }
      } else {
        // note: we're purposefully not caching URI to pageId mappings for 404s
        console.warn(`Page not found in siteMap: ${rawPageId}`)
        return {
          error: {
            message: `Not found "${rawPageId}"`,
            statusCode: 404
          }
        }
      }
    }
  } else {
    pageId = site.rootNotionPageId

    console.log('Loading root notion page', { rootPageId: site.rootNotionPageId })
    try {
      recordMap = await getPage(pageId)
      
      if (!recordMap?.block || Object.keys(recordMap.block).length === 0) {
        console.warn(`Root page recordMap is empty for pageId: ${pageId}`)
      }
    } catch (err) {
      console.error(`Failed to get root page for pageId: ${pageId}`, err)
      return {
        error: {
          message: 'Failed to load root page',
          statusCode: 500
        }
      }
    }
  }

  const props = { site, recordMap, pageId }
  return { ...props, ...(await acl.pageAcl(props)) }
}
