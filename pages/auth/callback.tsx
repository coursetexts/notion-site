import Head from 'next/head'
import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'

import { getSupabaseClient } from '@/lib/supabase'
import { takeAuthRedirect } from '@/lib/auth-redirect'

/**
 * OAuth callback: Google returns here on the same origin that started sign-in
 * (localhost in dev, the live site in production). Exchange the code / hash
 * for a session, then continue on this host.
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
      const params = new URLSearchParams(window.location.search)
      const hashParams = new URLSearchParams(
        window.location.hash.replace(/^#/, '')
      )
      const code = params.get('code')
      const oauthError =
        params.get('error_description') ||
        params.get('error') ||
        hashParams.get('error_description') ||
        hashParams.get('error')
      if (oauthError) {
        console.error('Auth callback error:', oauthError)
        setStatus('error')
        return
      }

      if (code) {
        const { error: exchangeError } =
          await supabase.auth.exchangeCodeForSession(code)
        if (exchangeError) {
          // AuthProvider may already have consumed the code via detectSessionInUrl.
          console.warn('Auth callback exchange:', exchangeError.message)
        }
      }

      let {
        data: { session },
        error
      } = await supabase.auth.getSession()
      if (!session && (code || hashParams.get('access_token'))) {
        await new Promise((resolve) => setTimeout(resolve, 400))
        const retry = await supabase.auth.getSession()
        session = retry.data.session
        error = retry.error
      }
      if (error) {
        console.error('Auth callback error:', error)
        setStatus('error')
        return
      }
      setStatus('done')
      const next = takeAuthRedirect()
      router.replace(session ? next || '/profile' : '/')
    }

    void run()
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
          fontFamily: "'Hanken Grotesk', sans-serif"
        }}
      >
        {status === 'loading' && <p>Signing you in…</p>}
        {status === 'done' && <p>Redirecting…</p>}
        {status === 'error' && (
          <div>
            <p>Something went wrong.</p>
            <a href='/'>Return home</a>
          </div>
        )}
      </div>
    </>
  )
}
