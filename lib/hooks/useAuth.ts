import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'  // ← Import singleton directly
import { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)  // ✅ CORRECT! Start as loading
  const router = useRouter()
  
  // ✅ NO useMemo - use the singleton from imports

  useEffect(() => {
    let isMounted = true
    
   const getInitialSession = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!isMounted) return
    
    setUser(session?.user ?? null)
    setLoading(false)  // ✅ ADD THIS LINE
        if (session?.user) {
          await fetchProfile(session.user.id)
        }
      } catch (error) {
        console.error('Error getting initial session:', error)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return
      
      console.log('Auth state changed:', _event, session?.user?.email)
      setUser(session?.user ?? null)
      if (session?.user) {
        await fetchProfile(session.user.id)
      } else {
        setProfile(null)
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, []) // ✅ Empty deps - supabase is singleton

  async function fetchProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      if (error) throw error
      setProfile(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  async function signIn(email: string, password: string) {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) {
        setLoading(false)
        return { data: null, error }
      }

      // ✅ DON'T redirect - let login page handle it
      setLoading(false)
      return { data, error: null }
    } catch (error: any) {
      setLoading(false)
      return { data: null, error }
    }
  }

  async function signUp(email: string, password: string, metadata: any) {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })
      
      if (error) {
        setLoading(false)
        return { data: null, error }
      }

      if (data.user && !data.session) {
        setLoading(false)
        return { 
          data, 
          error: null,
          message: 'Please check your email to confirm your account'
        }
      }

      if (data.session) {
        await new Promise(resolve => setTimeout(resolve, 500))
        router.push('/dashboard')
        router.refresh()
      }
      
      setLoading(false)
      return { data, error: null }
    } catch (error: any) {
      setLoading(false)
      return { data: null, error }
    }
  }

  async function signInWithGoogle() {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    
    if (error) setLoading(false)
    return { error }
  }

  async function signInWithGithub() {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    
    if (error) setLoading(false)
    return { error }
  }

  async function signOut() {
    try {
      console.log('Signing out...')
      
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('Error signing out from Supabase:', error)
        throw error
      }
      
      setUser(null)
      setProfile(null)
      
      console.log('Sign out successful, redirecting to home...')
      
      router.push('/')
      
      setTimeout(() => {
        router.refresh()
      }, 100)
      
    } catch (error) {
      console.error('Error in signOut function:', error)
      setUser(null)
      setProfile(null)
      router.push('/')
      router.refresh()
    }
  }

  return {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signInWithGithub,
    signOut,
    supabase // Export singleton
  }
}

export function useRequireAuth(requireAdmin = false) {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login')
      } else if (requireAdmin && profile?.role !== 'admin') {
        router.push('/dashboard')
      }
    }
  }, [user, profile, loading, requireAdmin, router])

  return { user, profile, loading }
}
