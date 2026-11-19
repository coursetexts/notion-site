import { NextRequest, NextResponse } from 'next/server'

import { IronSessionData, getIronSession } from 'iron-session'

import { sessionOptions } from '@/lib/session-config'

export const config = {
  // Match all routes except for specific ones like API routes, static files,
  // the sign-in page itself, and Next.js internal paths.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|signin|logo.svg).*)']
}

// Share links: https://preview.coursetexts.org/<page>?password=<PREVIEW_PASSWORD>
const SHARE_PASSWORD_PARAM = 'password'

export async function middleware(req: NextRequest) {
  // Check if password protection is enabled
  const passwordProtectEnabled = process.env.PASSWORD_PROTECT === 'true'

  if (!passwordProtectEnabled) {
    // If protection is disabled, allow the request to proceed
    return NextResponse.next()
  }

  const sharedPassword = req.nextUrl.searchParams.get(SHARE_PASSWORD_PARAM)
  if (sharedPassword !== null) {
    // REASON: always redirect to the same URL without the password, right or
    // wrong, so it does not stay in the address bar, browser history or a
    // Referer header sent to embedded Notion assets. The session cookie is set
    // on this redirect response; that only works for links opened from other
    // sites (Slack, email) because the cookie is SameSite=Lax, not Strict
    // (see lib/session-config.ts).
    const cleanUrl = req.nextUrl.clone()
    cleanUrl.searchParams.delete(SHARE_PASSWORD_PARAM)
    const redirect = NextResponse.redirect(cleanUrl)
    const expected = process.env.PREVIEW_PASSWORD
    if (expected && sharedPassword === expected) {
      const session = await getIronSession<IronSessionData>(
        req,
        redirect,
        sessionOptions
      )
      session.isAuthenticated = true
      await session.save()
      console.log(`Share-link access to ${cleanUrl.pathname}.`)
    } else {
      console.warn(`Wrong share-link password for ${cleanUrl.pathname}.`)
    }
    // A wrong password falls through to the normal sign-in redirect on the
    // clean URL, so the bad value is never echoed into ?redirect=.
    return redirect
  }

  // If protection is enabled, check for a valid session
  const res = NextResponse.next() // Prepare response object for session handling
  const session = await getIronSession<IronSessionData>(
    req,
    res,
    sessionOptions
  )

  // Check if the user is authenticated
  if (!session.isAuthenticated) {
    // If not authenticated, redirect to the sign-in page
    // Preserve the original URL as a query parameter for redirection after login
    const signInUrl = new URL('/signin', req.url)
    signInUrl.searchParams.set(
      'redirect',
      req.nextUrl.pathname + req.nextUrl.search
    )
    console.log(
      `Unauthenticated access to ${req.nextUrl.pathname}. Redirecting to signin.`
    )
    return NextResponse.redirect(signInUrl)
  }

  // If authenticated, allow the request to proceed
  // The session cookie will be updated automatically by getIronSession if needed
  console.log(`Authenticated access to ${req.nextUrl.pathname}.`)
  return res // Return the response object (which might contain updated session cookie)
}
