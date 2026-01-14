'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import AdminDashboard from '@/components/admin/AdminDashboard'

export default function AdminPage() {
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [debugInfo, setDebugInfo] = useState<string[]>([])
  const router = useRouter()
  const supabase = createClientComponentClient()

  const addDebug = (msg: string) => {
    console.log('🔧 Admin Page:', msg)
    setDebugInfo(prev => [...prev, msg])
  }

  useEffect(() => {
    addDebug('Component mounted')
    checkAdminAccess()
  }, [])

  const checkAdminAccess = async () => {
    try {
      addDebug('Checking admin access...')
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError) {
        addDebug(`User error: ${userError.message}`)
        addDebug('Redirecting to /admin/login')
        router.push('/admin/login')
        return
      }
      
      if (!user) {
        addDebug('No user found')
        addDebug('Redirecting to /admin/login')
        router.push('/admin/login')
        return
      }

      addDebug(`User found: ${user.email}`)

      // Check admin role
      addDebug('Fetching profile...')
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profileError) {
        addDebug(`Profile error: ${profileError.message}`)
        addDebug('Redirecting to /admin/login')
        router.push('/admin/login')
        return
      }
      
      if (!profile) {
        addDebug('No profile found')
        addDebug('Redirecting to /admin/login')
        router.push('/admin/login')
        return
      }

      addDebug(`Profile role: ${profile.role}`)

      if (profile.role !== 'admin') {
        addDebug('Not admin! Redirecting to /admin/login')
        router.push('/admin/login')
        return
      }

      addDebug('✅ Admin verified! Loading dashboard...')
      setIsAdmin(true)
      setLoading(false)
    } catch (error: any) {
      addDebug(`Exception: ${error.message}`)
      addDebug('Redirecting to /admin/login')
      router.push('/admin/login')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f] flex items-center justify-center p-8">
        <div className="text-center max-w-2xl w-full">
          <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white mb-4">Verifying admin access...</p>
          
          {/* Debug info */}
          <div className="glass-effect rounded-xl p-4 text-left mt-8">
            <p className="text-purple-400 font-bold mb-2">Debug Log:</p>
            <div className="space-y-1 text-sm text-gray-300 font-mono">
              {debugInfo.map((info, i) => (
                <div key={i}>→ {info}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <p className="text-white">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  addDebug('Rendering AdminDashboard')
  return <AdminDashboard />
}
