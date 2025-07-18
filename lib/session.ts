import {
  GetServerSidePropsContext,
  GetServerSidePropsResult,
  NextApiHandler,
  NextApiRequest,
  NextApiResponse
} from 'next'

import { IronSession, IronSessionData, getIronSession } from 'iron-session'

import { sessionOptions } from './session-config'

// Ensure SESSION_SECRET is set, especially in production
const sessionSecret = process.env.SESSION_SECRET
if (!sessionSecret) {
  throw new Error(
    'SESSION_SECRET environment variable is not set. Please generate a secure random string (at least 32 characters long) and set it.'
  )
}

// Define the shape of your session data
declare module 'iron-session' {
  interface IronSessionData {
    isAuthenticated?: boolean
  }
}

// Helper function to get the property descriptor, mimicking the internal logic
function getPropertyDescriptorForReqSession(
  session: IronSession<IronSessionData>
): PropertyDescriptor {
  return {
    enumerable: true,
    get() {
      return session
    },
    set(value: Record<string, unknown>) {
      // Allow assigning new object or modifying existing one
      const keys = Object.keys(value)
      const currentKeys = Object.keys(session)

      // Remove keys that aren't in the new value
      currentKeys.forEach((key) => {
        if (!keys.includes(key)) {
          // Use type assertion instead of @ts-ignore
          delete (session as unknown as Record<string, unknown>)[key]
        }
      })

      // Add/update keys from the new value
      keys.forEach((key) => {
        // Use type assertion instead of @ts-ignore
        ;(session as unknown as Record<string, unknown>)[key] = value[key]
      })
    }
  }
}

// Custom helper function to wrap API routes with session handling using getIronSession
export function withSessionRoute(handler: NextApiHandler): NextApiHandler {
  return async function nextApiHandlerWrappedWithIronSession(
    req: NextApiRequest, // Type req explicitly
    res: NextApiResponse
  ) {
    // Use the imported sessionOptions directly
    const session = await getIronSession(req, res, sessionOptions)

    // Define req.session using the helper function
    Object.defineProperty(
      req,
      'session',
      getPropertyDescriptorForReqSession(session)
    )

    // Call the original handler
    return handler(req, res)
  }
}

// Custom helper function to wrap getServerSideProps with session handling using getIronSession
export function withSessionSsr<
  P extends { [key: string]: unknown } = { [key: string]: unknown }
>(
  handler: (
    context: GetServerSidePropsContext & {
      req: { session: IronSession<IronSessionData> }
    }
  ) => GetServerSidePropsResult<P> | Promise<GetServerSidePropsResult<P>>
) {
  return async (
    context: GetServerSidePropsContext
  ): Promise<GetServerSidePropsResult<P>> => {
    const session = await getIronSession(
      context.req,
      context.res,
      sessionOptions
    )

    // Define context.req.session
    Object.defineProperty(
      context.req,
      'session',
      getPropertyDescriptorForReqSession(session)
    )

    // Call the original handler, passing the augmented context
    // We need to cast context because we dynamically added context.req.session
    return handler(
      context as GetServerSidePropsContext & {
        req: { session: IronSession<IronSessionData> }
      }
    )
  }
}
