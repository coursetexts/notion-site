import { ExtendedRecordMap } from 'notion-types'
import { parsePageId, uuidToId } from 'notion-utils'

import { includeNotionIdInUrls } from './config'
import { getCanonicalPageId } from './get-canonical-page-id'
import { Site } from './types'

// include UUIDs in page URLs during local development but not in production
// (they're nice for debugging and speed up local dev)
const uuid = !!includeNotionIdInUrls

export const mapPageUrl =
  (site: Site, recordMap: ExtendedRecordMap, searchParams: URLSearchParams) =>
  (pageId = '') => {
    const pageUuid = parsePageId(pageId, { uuid: true })

    // Guard malformed page references from Notion blocks.
    if (!pageUuid) {
      return createUrl('/', searchParams)
    }

    if (uuidToId(pageUuid) === site.rootNotionPageId) {
      return createUrl('/', searchParams)
    } else {
      const canonical = getCanonicalPageId(pageUuid, recordMap, { uuid })

      if (!canonical) {
        return createUrl('/', searchParams)
      }

      return createUrl(
        `/${canonical}`,
        searchParams
      )
    }
  }

export const getCanonicalPageUrl =
  (site: Site, recordMap: ExtendedRecordMap) =>
  (pageId = '') => {
    const pageUuid = parsePageId(pageId, { uuid: true })

    if (!pageUuid) {
      return `https://${site.domain}`
    }

    if (uuidToId(pageUuid) === site.rootNotionPageId) {
      return `https://${site.domain}`
    } else {
      const canonical = getCanonicalPageId(pageUuid, recordMap, { uuid })

      if (!canonical) {
        return `https://${site.domain}`
      }

      return `https://${site.domain}/${canonical}`
    }
  }

function createUrl(path: string, searchParams: URLSearchParams) {
  return [path, searchParams.toString()].filter(Boolean).join('?')
}
