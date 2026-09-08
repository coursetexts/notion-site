import type { NextApiRequest, NextApiResponse } from 'next'

import type { ExtendedRecordMap } from 'notion-types'
import { parsePageId } from 'notion-utils'

import { extractCourseTocLabelsFromRecordMap } from '@/lib/course-toc-from-record-map'
import { getPageWithRetry } from '@/lib/notion-api'
import { normalizeRecordMapBlocks } from '@/lib/notion-record-block'

const MAX_PAGES = 12

function uniquePageIds(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  const out: string[] = []
  const seen = new Set<string>()
  for (const item of value) {
    if (typeof item !== 'string') continue
    const id = item.trim()
    if (!id || !parsePageId(id) || seen.has(id)) continue
    seen.add(id)
    out.push(id)
    if (out.length >= MAX_PAGES) break
  }
  return out
}

async function labelsForPage(pageId: string): Promise<string[]> {
  const recordMap = (await getPageWithRetry(pageId, 2, {
    chunkLimit: 40,
    fetchMissingBlocks: false
  })) as ExtendedRecordMap
  if (!recordMap?.block) return []
  normalizeRecordMapBlocks(recordMap)
  return extractCourseTocLabelsFromRecordMap(recordMap, pageId)
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'method not allowed' })
  }

  const pageIds = uniquePageIds(req.body?.pageIds)
  const labelsByPageId: Record<string, string[]> = {}
  await Promise.all(
    pageIds.map(async (pageId) => {
      try {
        labelsByPageId[pageId] = await labelsForPage(pageId)
      } catch {
        labelsByPageId[pageId] = []
      }
    })
  )

  res.setHeader(
    'Cache-Control',
    'private, max-age=300, stale-while-revalidate=600'
  )
  return res.status(200).json({ labelsByPageId })
}
