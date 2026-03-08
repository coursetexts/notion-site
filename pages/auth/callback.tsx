import React, { useEffect, useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { getSupabaseClient } from '@/lib/supabase'

/**
 * OAuth callback: Supabase redirects here after Google sign-in.
 * We let the client absorb the session from the URL hash, then redirect.
 */
export default function AuthCallbackPage() {
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'done' | 'error'>('loading')

  useEffect(() => {
    const supabase = getSupabaseClient()
    if (!supabase) {
      setStatus('error')
      return
    }

    const run = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) {
        console.error('Auth callback error:', error)
        setStatus('error')
        return
      }
      setStatus('done')
      router.replace(session ? '/profile' : '/')
    }

    run()
  }, [router])

  return (
    <>
      <Head>
        <title>Signing in… - Coursetexts</title>
      </Head>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          fontFamily: 'sans-serif'
        }}
      >
        {status === 'loading' && <p>Signing you in…</p>}
        {status === 'done' && <p>Redirecting…</p>}
        {status === 'error' && (
          <div>
            <p>Something went wrong.</p>
            <a href="/">Return home</a>
          </div>
        )}
      </div>
    </>
  )
}
