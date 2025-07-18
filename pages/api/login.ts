import { NextApiRequest, NextApiResponse } from 'next'

import { IronSessionData, getIronSession } from 'iron-session'

import { sessionOptions } from '@/lib/session-config'

export default async function loginRoute(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  const { password } = req.body

  const correctPassword = process.env.PREVIEW_PASSWORD

  // Basic validation
  if (!password || !correctPassword) {
    console.error(
      'Missing credentials in request body or environment variables'
    )
    return res.status(400).json({ message: 'Missing credentials' })
  }

  // Check if password protection is even enabled. If not, don't allow login.
  const passwordProtectEnabled = process.env.PASSWORD_PROTECT === 'true'
  if (!passwordProtectEnabled) {
    console.warn('Attempted login when password protection is disabled.')
    return res
      .status(403)
      .json({ message: 'Preview protection is not enabled.' })
  }

  // Validate credentials
  const isCorrectCredentials = password === correctPassword

  if (isCorrectCredentials) {
    // Get/create the session
    const session = await getIronSession<IronSessionData>(
      req,
      res,
      sessionOptions
    )

    // Set session data
    session.isAuthenticated = true
    await session.save()
    console.log(`User successfully logged in.`)
    res.status(200).json({ message: 'Login successful' })
  } else {
    console.warn(`Failed login attempt.`)
    res.status(401).json({ message: 'Invalid username or password' })
  }
}
