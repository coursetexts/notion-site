import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'
import type { NextApiRequest } from 'next'

export type ApiUserContext = {
  user: User
  supabase: SupabaseClient
  accessToken: string
}

function readBearerToken(req: NextApiRequest) {
  const header = req.headers.authorization
  if (typeof header !== 'string') return ''
  const match = header.match(/^Bearer\s+(.+)$/i)
  return match?.[1]?.trim() || ''
}

export async function getApiUser(
  req: NextApiRequest
): Promise<ApiUserContext | null> {
  const accessToken = readBearerToken(req)
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!accessToken || !url || !anonKey) return null

  const supabase = createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    },
    global: {
      headers: { Authorization: `Bearer ${accessToken}` }
    }
  })
  const {
    data: { user },
    error
  } = await supabase.auth.getUser(accessToken)
  if (error || !user) return null
  return { user, supabase, accessToken }
}
