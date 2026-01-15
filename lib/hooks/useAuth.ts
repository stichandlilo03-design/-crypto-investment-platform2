import { useEffect, useState, useMemo } from 'react'
import { createSupabaseClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  
  // ✅ FIXED: Create Supabase client only once using useMemo
  const supabase = useMemo(() => createSupabaseClient(), [])

  useEffect(() => {
    let isMounted = true
    
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!isMounted) return
        
        setUser(session?.user ?? null)
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
  }, [supabase])

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

  // ✅ FIXED: Don't redirect here, let the login page handle it
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

      // ✅ DON'T redirect here - the onAuthStateChange will fire
      // and the login page will redirect when user is set
      
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

      // Check if email confirmation is required
      if (data.user && !data.session) {
        setLoading(false)
        return { 
          data, 
          error: null,
          message: 'Please check your email to confirm your account'
        }
      }

      // If session exists, redirect to dashboard
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
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('Error signing out from Supabase:', error)
        throw error
      }
      
      // Clear local state immediately
      setUser(null)
      setProfile(null)
      
      console.log('Sign out successful, redirecting to home...')
      
      // Redirect to home page
      router.push('/')
      
      // Force a hard refresh to clear any cached data
      setTimeout(() => {
        router.refresh()
      }, 100)
      
    } catch (error) {
      console.error('Error in signOut function:', error)
      // Even if there's an error, still try to redirect
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
    supabase // Export supabase instance so dashboard can use it
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
