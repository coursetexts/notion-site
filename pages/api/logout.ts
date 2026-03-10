import { NextApiRequest, NextApiResponse } from 'next'

import { IronSessionData, getIronSession } from 'iron-session'

import { sessionOptions } from '@/lib/session-config'

export default async function logoutRoute(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Get the session
  const session = await getIronSession<IronSessionData>(
    req,
    res,
    sessionOptions
  )

  // Destroy the session
  session.destroy()
  console.log('User logged out.')

  // Redirect to sign-in page after logout
  res.writeHead(302, { Location: '/signin' })
  res.end()
}
