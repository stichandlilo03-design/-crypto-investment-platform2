'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import AdminDashboard from '@/components/admin/AdminDashboard'
import { Loader2 } from 'lucide-react'

export default function AdminPage() {
  const [checking, setChecking] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const [adminProfile, setAdminProfile] = useState<any>(null)
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.replace('/admin/login')
        return
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (error) {
        console.error('Profile fetch error:', error)
        router.replace('/admin/login')
        return
      }

      if (profile?.role === 'admin') {
        setAdminProfile(profile)
        setAuthorized(true)
      } else {
        router.replace('/admin/login')
      }
    } catch (error) {
      console.error('Auth check error:', error)
      router.replace('/admin/login')
    } finally {
      setChecking(false)
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Checking authorization...</p>
        </div>
      </div>
    )
  }

  if (!authorized || !adminProfile) {
    return null
  }

  return <AdminDashboard initialProfile={adminProfile} />
}
