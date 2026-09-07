import type { NextApiRequest, NextApiResponse } from 'next'

/**
 * Disabled. The public graph is a static snapshot (`data/knowledge-graph.json`).
 * /knowledge-graph does not call this route.
 */
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Allow', 'GET')
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  return res.status(410).json({
    error: 'Knowledge graph harvest is disabled. The page uses a static snapshot.'
  })
}
