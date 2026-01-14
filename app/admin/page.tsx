'use client'

import AdminDashboard from '@/components/admin/AdminDashboard'

export default function AdminPage() {
  // Middleware handles all auth checks
  // If you're here, you're an admin
  return <AdminDashboard />
}
