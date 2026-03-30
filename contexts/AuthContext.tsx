import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState
} from 'react'

import type { User } from '@supabase/supabase-js'

import {
  clearCachedAuth,
  getCachedAuth,
  setCachedAuth,
  subscribeToAuthCache
} from '@/lib/auth-cache'
import { authDebug } from '@/lib/auth-debug'
import { getSupabaseClient } from '@/lib/supabase'
import type { Profile } from '@/lib/supabase-types'

interface AuthContextValue {
  user: User | null
  profile: Profile | null
  isLoading: boolean
  error: string | null
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

async function fetchProfile(userId: string): Promise<Profile | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single()
  if (error) {
    console.error('Failed to fetch profile:', error)
    return null
  }
  return data as Profile
}

async function fetchProfileWithTimeout(
  userId: string,
  timeoutMs = 2500
): Promise<Profile | null> {
  return Promise.race([
    fetchProfile(userId),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs))
  ])
}

export function AuthProvider({
  children,
  rootName = 'app'
}: {
  children: React.ReactNode
  rootName?: string
}) {
  const providerIdRef = React.useRef(
    `${rootName}-${Math.random().toString(36).slice(2, 7)}`
  )
  const { user: cachedUser, profile: cachedProfile } = getCachedAuth()
  const [user, setUserState] = useState<User | null>(cachedUser)
  const [profile, setProfileState] = useState<Profile | null>(cachedProfile)
  const [isLoading, setIsLoading] = useState(!cachedUser)
  const [error, setError] = useState<string | null>(null)

  const refreshProfile = useCallback(async () => {
    if (!user) {
      setProfileState(null)
      return
    }
    const p = await fetchProfile(user.id)
    setProfileState(p)
    setCachedAuth(user, p)
  }, [user])

  useEffect(() => {
    authDebug('provider:mount', {
      provider: providerIdRef.current,
      rootName,
      cachedUser: cachedUser?.id ?? null
    })
    const supabase = getSupabaseClient()
    if (!supabase) {
      authDebug('provider:no-supabase', {
        provider: providerIdRef.current
      })
      setIsLoading(false)
      return
    }

    const init = async () => {
      const {
        data: { session }
      } = await supabase.auth.getSession()
      authDebug('provider:init:getSession', {
        provider: providerIdRef.current,
        sessionUser: session?.user?.id ?? null
      })
      if (session?.user) {
        const u = session.user
        setUserState(u)
        setCachedAuth(u, getCachedAuth().profile)
        setIsLoading(false)

        // Profile hydration should not block auth state.
        fetchProfileWithTimeout(u.id).then((p) => {
          setProfileState(p)
          setCachedAuth(u, p)
          authDebug('provider:profile:hydrated', {
            provider: providerIdRef.current,
            user: u.id,
            hasProfile: Boolean(p)
          })
        })
      } else {
        // Important in multi-root setup: do not clear shared cache on a null
        // initial session, because another root may already hold a valid user.
        if (!getCachedAuth().user) {
          setUserState(null)
          setProfileState(null)
        }
        setIsLoading(false)
      }
      authDebug('provider:init:done', {
        provider: providerIdRef.current,
        user: session?.user?.id ?? getCachedAuth().user?.id ?? null
      })
    }

    init()

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      authDebug('provider:onAuthStateChange', {
        provider: providerIdRef.current,
        event,
        sessionUser: session?.user?.id ?? null
      })
      if (session?.user) {
        const u = session.user
        setUserState(u)
        setCachedAuth(u, getCachedAuth().profile)
        setIsLoading(false)

        // Do not block auth on profile query.
        fetchProfileWithTimeout(u.id).then((p) => {
          setProfileState(p)
          setCachedAuth(u, p)
          authDebug('provider:profile:hydrated', {
            provider: providerIdRef.current,
            user: u.id,
            hasProfile: Boolean(p)
          })
        })
      } else {
        // Only clear global auth on explicit sign out.
        if (event === 'SIGNED_OUT') {
          setUserState(null)
          setProfileState(null)
          clearCachedAuth()
        }
      }
    })

    return () => {
      authDebug('provider:unmount', { provider: providerIdRef.current })
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    return subscribeToAuthCache(() => {
      const { user: u, profile: p } = getCachedAuth()
      authDebug('provider:cache:update', {
        provider: providerIdRef.current,
        user: u?.id ?? null
      })
      if (u) {
        setUserState(u)
        setProfileState(p)
        setIsLoading(false)
      }
    })
  }, [])

  const signInWithGoogle = useCallback(async () => {
    setError(null)
    const supabase = getSupabaseClient()
    if (!supabase) {
      setError(
        'Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
      )
      return
    }
    try {
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo:
            typeof window !== 'undefined'
              ? `${window.location.origin}/auth/callback`
              : undefined
        }
      })
      if (signInError) {
        setError(signInError.message)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed')
    }
  }, [])

  const signOut = useCallback(async () => {
    setError(null)
    const supabase = getSupabaseClient()
    if (!supabase) return
    await supabase.auth.signOut()
    setUserState(null)
    setProfileState(null)
    clearCachedAuth()
  }, [])

  const value: AuthContextValue = {
    user,
    profile,
    isLoading,
    error,
    signInWithGoogle,
    signOut,
    refreshProfile
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}

/** Use when component might render outside AuthProvider (e.g. header). Returns null if no provider or not configured. */
export function useAuthOptional(): AuthContextValue | null {
  return useContext(AuthContext)
}
