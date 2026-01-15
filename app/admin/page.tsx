'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'  // ✅ Use singleton
import { useRouter } from 'next/navigation'
import AdminDashboard from '@/components/admin/AdminDashboard'
import { Loader2 } from 'lucide-react'

export default function AdminPage() {
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const router = useRouter()
  
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
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()
      
      if (profile?.role === 'admin') {
        setIsAdmin(true)
        setLoading(false)
      } else {
        router.replace('/dashboard')
      }
    } catch (error) {
      console.error('Auth check error:', error)
      router.replace('/admin/login')
    }
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
      </div>
    )
  }
  
  if (!isAdmin) {
    return null
  }
  
  return <AdminDashboard />
}
