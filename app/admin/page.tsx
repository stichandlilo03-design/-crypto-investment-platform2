'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import AdminDashboard from '@/components/admin/AdminDashboard'

export default function AdminPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        // Not logged in, redirect to admin login
        router.push('/admin/login')
      } else if (profile?.role !== 'admin') {
        // Not an admin, redirect to dashboard
        router.push('/dashboard')
      }
    }
  }, [authLoading, user, profile, router])

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
      </div>
    )
  }

  // If not admin, show nothing while redirecting
  if (!user || profile?.role !== 'admin') {
    return null
  }

  return <AdminDashboard />
}
