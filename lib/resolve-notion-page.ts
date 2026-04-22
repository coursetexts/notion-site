import { ExtendedRecordMap } from 'notion-types'
import { parsePageId } from 'notion-utils'

import * as acl from './acl'
import { environment, pageUrlAdditions, pageUrlOverrides, site } from './config'
import { db } from './db'
import { getSiteMap } from './get-site-map'
import { getPage } from './notion'

function getSiteMapRecordMap(
  siteMap: Awaited<ReturnType<typeof getSiteMap>>,
  pageId: string
): ExtendedRecordMap | undefined {
  const rawId = parsePageId(pageId, { uuid: false }) || pageId
  const uuidId = parsePageId(pageId, { uuid: true }) || rawId
  const candidateIds = Array.from(new Set([pageId, rawId, uuidId].filter(Boolean)))

  for (const candidateId of candidateIds) {
    const recordMap = siteMap?.pageMap?.[candidateId]
    if (recordMap) {
      return recordMap
    }
  }

  for (const recordMap of Object.values(siteMap?.pageMap || {})) {
    const blockMap = (recordMap as ExtendedRecordMap)?.block
    if (!blockMap) continue

    if (blockMap[uuidId] || blockMap[rawId]) {
      console.warn('Resolved site map recordMap via block match', {
        requestedPageId: pageId,
        rawId,
        uuidId
      })
      return recordMap as ExtendedRecordMap
    }
  }
}

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
      recordMap = await getPage(pageId)
    } else {
      // handle mapping of user-friendly canonical page paths to Notion page IDs
      // e.g., /developer-x-entrepreneur versus /71201624b204481f862630ea25ce62fe
      const siteMap = await getSiteMap()
      pageId = siteMap?.canonicalPageMap[rawPageId]

      if (pageId) {
        // Reuse the site map's already-fetched record map during SSG to avoid
        // a second burst of Notion API calls for every static page.
        recordMap = getSiteMapRecordMap(siteMap, pageId) || (await getPage(pageId))

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
      } else {
        // note: we're purposefully not caching URI to pageId mappings for 404s
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

    console.log(site)
    const siteMap = await getSiteMap()
    recordMap = getSiteMapRecordMap(siteMap, pageId) || (await getPage(pageId))
  }

  const props = { site, recordMap, pageId }
  return { ...props, ...(await acl.pageAcl(props)) }
}
