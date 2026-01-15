'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { Loader2, Shield, LogOut, BarChart3, Download, Upload, Users, Settings } from 'lucide-react'

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState<any[]>([])
  const [adminProfile, setAdminProfile] = useState<any>(null)
  const supabase = createClientComponentClient()
  const router = useRouter()

  useEffect(() => {
    checkAdminAndLoadData()
  }, [])

  const checkAdminAndLoadData = async () => {
    try {
      // Check session
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/admin/login')
        return
      }

      // Check if admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (profile?.role !== 'admin') {
        router.push('/dashboard')
        return
      }

      setAdminProfile(profile)

      // Load transactions directly from Supabase
      const { data: txns } = await supabase
        .from('transactions')
        .select(`
          *,
          profiles:user_id (
            email,
            full_name
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(50)

      setTransactions(txns || [])
      setLoading(false)

    } catch (error) {
      console.error('Error:', error)
      router.push('/admin/login')
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f]">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-64 bg-[#1a1a2e]/80 backdrop-blur-xl border-r border-white/10 p-6">
        <div className="flex items-center space-x-2 mb-8">
          <Shield className="w-8 h-8 text-purple-500" />
          <span className="text-xl font-bold text-white">Admin Panel</span>
        </div>
        
        <button
          onClick={handleSignOut}
          className="absolute bottom-6 left-6 right-6 flex items-center space-x-2 px-4 py-3 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-gray-400">Welcome back, {adminProfile?.full_name}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-[#1a1a2e]/50 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/20">
            <div className="text-gray-400 text-sm mb-2">Pending Transactions</div>
            <div className="text-3xl font-bold text-white">{transactions.length}</div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-[#1a1a2e]/50 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/20">
          <h2 className="text-xl font-bold text-white mb-6">Pending Transactions</h2>
          
          {transactions.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No pending transactions</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">User</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Type</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Amount</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Asset</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="border-b border-white/5">
                      <td className="py-4 px-4">
                        <div className="text-white">{tx.profiles?.full_name || 'Unknown'}</div>
                        <div className="text-sm text-gray-400">{tx.profiles?.email}</div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs ${
                          tx.type === 'deposit' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {tx.type}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-white font-bold">
                        ${tx.amount?.toLocaleString()}
                      </td>
                      <td className="py-4 px-4 text-white">{tx.asset}</td>
                      <td className="py-4 px-4 text-gray-400">
                        {new Date(tx.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
