import type { NextApiRequest, NextApiResponse } from 'next'

import { isAllowedPreviewUrl, type LinkPreviewData } from '@/lib/link-preview'
import { fetchLinkPreview } from '@/lib/link-preview-server'

type ErrorBody = { error: string }

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<LinkPreviewData | ErrorBody>
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const raw = Array.isArray(req.query.url) ? req.query.url[0] : req.query.url
  const url = typeof raw === 'string' ? raw.trim() : ''
  if (!url || !isAllowedPreviewUrl(url)) {
    return res.status(400).json({ error: 'Invalid url' })
  }

  const preview = await fetchLinkPreview(url)
  if (!preview) {
    return res.status(404).json({ error: 'Preview unavailable' })
  }

  res.setHeader(
    'Cache-Control',
    'public, s-maxage=3600, stale-while-revalidate=86400'
  )
  return res.status(200).json(preview)
}
