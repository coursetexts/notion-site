import { SessionOptions } from 'iron-session'

// Ensure SESSION_SECRET is set, especially in production
const sessionSecret = process.env.SESSION_SECRET
if (!sessionSecret) {
  throw new Error(
    'SESSION_SECRET environment variable is not set. Please generate a secure random string (at least 32 characters long) and set it.'
  )
}

export const sessionOptions: SessionOptions = {
  password: sessionSecret,
  cookieName: 'preview-session', // Choose a unique name
  // Secure: true should be used in production (HTTPS)
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    // REASON: 'lax', not 'strict'. Share links (?password=, see middleware.ts)
    // are opened from other sites; a Strict cookie is withheld on that whole
    // cross-site redirect chain, so the visitor would land on /signin despite
    // a correct password. Lax still blocks cross-site POSTs to /api/login and
    // /api/logout, and the cookie only gates a read-only preview.
    sameSite: 'lax'
  }
}

// Define the shape of your session data
// This needs to be accessible by both edge and node runtimes
declare module 'iron-session' {
  interface IronSessionData {
    isAuthenticated?: boolean
  }
}
