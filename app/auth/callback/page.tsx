'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function AuthCallback() {
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Exchange the code for a session
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error)
          router.push('/login?error=auth_failed')
          return
        }

        if (session) {
          // Session exists, redirect to dashboard
          router.push('/dashboard')
          router.refresh()
        } else {
          // No session, redirect to login
          router.push('/login')
        }
      } catch (error) {
        console.error('Unexpected error in auth callback:', error)
        router.push('/login?error=unexpected')
      }
    }

    handleCallback()
  }, [router, supabase])

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f] flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full border-4 border-purple-500/30 border-t-purple-500 animate-spin mx-auto mb-4"></div>
        <p className="text-white text-xl">Completing sign in...</p>
        <p className="text-gray-400 text-sm mt-2">Please wait while we redirect you</p>
      </div>
    </div>
  )
}
