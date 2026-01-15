'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, Shield, AlertCircle, CheckCircle, Bell, LogOut, 
  BarChart3, FileText, Clock, Check, X, Menu, Upload, Loader2, 
  Home, CreditCard, UserCheck, RefreshCw, Download, Settings,
  Eye, TrendingUp, DollarSign
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'

interface Transaction {
  id: string
  user_id: string
  amount: number
  asset: string
  type: 'deposit' | 'withdraw' | 'buy' | 'sell'
  value_usd: number
  status: 'pending' | 'approved' | 'rejected' | 'processing' | 'completed'
  payment_proof_url: string | null
  wallet_address: string | null
  admin_notes: string | null
  created_at: string
  profiles: {
    email: string
    full_name: string | null
    phone: string | null
  }
}

interface User {
  id: string
  email: string
  full_name: string | null
  role: 'user' | 'admin' | 'moderator'
  kyc_verified: boolean
  kyc_status: string | null
  is_active: boolean
  created_at: string
}

export default function AdminDashboard() {
  const [selectedTab, setSelectedTab] = useState('dashboard')
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [adminProfile, setAdminProfile] = useState<any>(null)
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDeposits: 0,
    totalWithdrawals: 0,
    totalVolume: 0,
    pendingDeposits: 0,
    pendingWithdrawals: 0,
    verifiedUsers: 0,
    activeUsers: 0
  })

  const [selectedAction, setSelectedAction] = useState<{
    type: 'deposit' | 'withdraw'
    transaction: Transaction
  } | null>(null)
  const [adminNotes, setAdminNotes] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  
  const supabase = createClientComponentClient()
  const router = useRouter()

  useEffect(() => {
    checkAdminAndLoadData()
  }, [])

  useEffect(() => {
    if (adminProfile) {
      fetchDashboardData()
    }
  }, [selectedTab, adminProfile])

  const checkAdminAndLoadData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/admin/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (profile?.role !== 'admin') {
        router.push('/dashboard')
        return
      }

      console.log('Admin authenticated:', profile.email)
      setAdminProfile(profile)
      await fetchDashboardData()
      setLoading(false)
    } catch (error) {
      console.error('Auth error:', error)
      router.push('/admin/login')
    }
  }

  const fetchDashboardData = async () => {
    try {
      if (selectedTab === 'dashboard' || selectedTab === 'deposits' || selectedTab === 'withdrawals') {
        await fetchTransactions()
      }
      
      if (selectedTab === 'users') {
        await fetchUsers()
      }
      
      if (selectedTab === 'dashboard') {
        await fetchStats()
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }

  const fetchTransactions = async () => {
    try {
      let query = supabase
        .from('transactions')
        .select(`
          *,
          profiles:user_id (
            email,
            full_name,
            phone
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100)

      if (selectedTab === 'dashboard') {
        query = query.eq('status', 'pending')
      } else if (selectedTab === 'deposits') {
        query = query.eq('type', 'deposit')
      } else if (selectedTab === 'withdrawals') {
        query = query.eq('type', 'withdraw')
      }

      const { data, error } = await query

      if (error) throw error
      setTransactions(data || [])
    } catch (error) {
      console.error('Error fetching transactions:', error)
    }
  }

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const fetchStats = async () => {
    try {
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })

      const { count: verifiedUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('kyc_verified', true)

      const { count: activeUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)

      const { data: allTransactions } = await supabase
        .from('transactions')
        .select('*')

      const deposits = allTransactions?.filter(t => t.type === 'deposit') || []
      const withdrawals = allTransactions?.filter(t => t.type === 'withdraw') || []
      
      const totalDeposits = deposits
        .filter(t => t.status === 'approved')
        .reduce((sum, t) => sum + Number(t.value_usd || t.amount), 0)
      
      const totalWithdrawals = withdrawals
        .filter(t => t.status === 'approved')
        .reduce((sum, t) => sum + Number(t.value_usd || t.amount), 0)

      const pendingDeposits = deposits.filter(t => t.status === 'pending').length
      const pendingWithdrawals = withdrawals.filter(t => t.status === 'pending').length

      setStats({
        totalUsers: totalUsers || 0,
        verifiedUsers: verifiedUsers || 0,
        activeUsers: activeUsers || 0,
        totalDeposits,
        totalWithdrawals,
        totalVolume: totalDeposits + totalWithdrawals,
        pendingDeposits,
        pendingWithdrawals
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const handleApprove = async () => {
    if (!selectedAction) return
    
    setActionLoading(true)
    try {
      const { transaction } = selectedAction

      const { error: updateError } = await supabase
        .from('transactions')
        .update({
          status: 'approved',
          admin_notes: adminNotes || null,
          approved_by: adminProfile.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', transaction.id)

      if (updateError) throw updateError

      if (transaction.type === 'deposit') {
        const { data: existingPortfolio } = await supabase
          .from('user_portfolio')
          .select('*')
          .eq('user_id', transaction.user_id)
          .eq('asset', transaction.asset)
          .single()

        if (existingPortfolio) {
          await supabase
            .from('user_portfolio')
            .update({
              amount: Number(existingPortfolio.amount) + Number(transaction.amount),
              updated_at: new Date().toISOString()
            })
            .eq('id', existingPortfolio.id)
        } else {
          await supabase
            .from('user_portfolio')
            .insert({
              user_id: transaction.user_id,
              asset: transaction.asset,
              amount: transaction.amount
            })
        }
      }

      if (transaction.type === 'withdraw') {
        const { data: portfolio } = await supabase
          .from('user_portfolio')
          .select('*')
          .eq('user_id', transaction.user_id)
          .eq('asset', transaction.asset)
          .single()

        if (portfolio) {
          const newAmount = Number(portfolio.amount) - Number(transaction.amount)
          if (newAmount > 0) {
            await supabase
              .from('user_portfolio')
              .update({
                amount: newAmount,
                updated_at: new Date().toISOString()
              })
              .eq('id', portfolio.id)
          } else {
            await supabase
              .from('user_portfolio')
              .delete()
              .eq('id', portfolio.id)
          }
        }
      }

      await supabase
        .from('notifications')
        .insert({
          user_id: transaction.user_id,
          type: 'transaction',
          title: `${transaction.type === 'deposit' ? 'Deposit' : 'Withdrawal'} Approved`,
          message: `Your ${transaction.type} of ${transaction.amount} ${transaction.asset} has been approved.${adminNotes ? ' Note: ' + adminNotes : ''}`,
          metadata: {
            transaction_id: transaction.id,
            amount: transaction.amount,
            asset: transaction.asset
          }
        })

      alert('Transaction approved successfully!')
      setSelectedAction(null)
      setAdminNotes('')
      await fetchDashboardData()
    } catch (error: any) {
      console.error('Approval error:', error)
      alert('Error approving transaction: ' + error.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    if (!selectedAction) return
    
    setActionLoading(true)
    try {
      const { transaction } = selectedAction

      const { error: updateError } = await supabase
        .from('transactions')
        .update({
          status: 'rejected',
          admin_notes: adminNotes || null,
          approved_by: adminProfile.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', transaction.id)

      if (updateError) throw updateError

      await supabase
        .from('notifications')
        .insert({
          user_id: transaction.user_id,
          type: 'transaction',
          title: `${transaction.type === 'deposit' ? 'Deposit' : 'Withdrawal'} Rejected`,
          message: `Your ${transaction.type} of ${transaction.amount} ${transaction.asset} has been rejected.${adminNotes ? ' Reason: ' + adminNotes : ''}`,
          metadata: {
            transaction_id: transaction.id,
            amount: transaction.amount,
            asset: transaction.asset
          }
        })

      alert('Transaction rejected!')
      setSelectedAction(null)
      setAdminNotes('')
      await fetchDashboardData()
    } catch (error: any) {
      console.error('Rejection error:', error)
      alert('Error rejecting transaction: ' + error.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId)

      if (error) throw error

      alert('User role updated successfully!')
      await fetchUsers()
    } catch (error: any) {
      console.error('Update error:', error)
      alert('Error updating user role: ' + error.message)
    }
  }

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !currentStatus })
        .eq('id', userId)

      if (error) throw error

      alert('User status updated successfully!')
      await fetchUsers()
    } catch (error: any) {
      console.error('Update error:', error)
      alert('Error updating user status: ' + error.message)
    }
  }

  const handleVerifyKYC = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          kyc_verified: true,
          kyc_status: 'approved',
          kyc_verified_at: new Date().toISOString(),
          kyc_verified_by: adminProfile.id
        })
        .eq('id', userId)

      if (error) throw error

      await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type: 'kyc',
          title: 'KYC Verified!',
          message: 'Your KYC verification has been approved. You now have full access to all features.'
        })

      alert('KYC verified successfully!')
      await fetchUsers()
    } catch (error: any) {
      console.error('KYC verification error:', error)
      alert('Error verifying KYC: ' + error.message)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  const formatTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch {
      return 'Unknown time'
    }
  }

  const renderDashboard = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-[#1a1a2e]/50 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/20">
          <div className="flex items-center justify-between mb-4">
            <Users className="w-8 h-8 text-blue-400" />
            <TrendingUp className="w-5 h-5 text-green-400" />
          </div>
          <div className="text-3xl font-bold text-white mb-1">{stats.totalUsers}</div>
          <div className="text-sm text-gray-400">Total Users</div>
          <div className="text-xs text-green-400 mt-2">{stats.activeUsers} active</div>
        </div>

        <div className="bg-[#1a1a2e]/50 backdrop-blur-xl rounded-2xl p-6 border border-green-500/20">
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="w-8 h-8 text-green-400" />
            <Clock className="w-5 h-5 text-yellow-400" />
          </div>
          <div className="text-3xl font-bold text-white mb-1">${stats.totalDeposits.toLocaleString()}</div>
          <div className="text-sm text-gray-400">Total Deposits</div>
          <div className="text-xs text-yellow-400 mt-2">{stats.pendingDeposits} pending</div>
        </div>

        <div className="bg-[#1a1a2e]/50 backdrop-blur-xl rounded-2xl p-6 border border-red-500/20">
          <div className="flex items-center justify-between mb-4">
            <Download className="w-8 h-8 text-red-400" />
            <Clock className="w-5 h-5 text-yellow-400" />
          </div>
          <div className="text-3xl font-bold text-white mb-1">${stats.totalWithdrawals.toLocaleString()}</div>
          <div className="text-sm text-gray-400">Total Withdrawals</div>
          <div className="text-xs text-yellow-400 mt-2">{stats.pendingWithdrawals} pending</div>
        </div>

        <div className="bg-[#1a1a2e]/50 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/20">
          <div className="flex items-center justify-between mb-4">
            <BarChart3 className="w-8 h-8 text-purple-400" />
            <CheckCircle className="w-5 h-5 text-green-400" />
          </div>
          <div className="text-3xl font-bold text-white mb-1">${stats.totalVolume.toLocaleString()}</div>
          <div className="text-sm text-gray-400">Total Volume</div>
          <div className="text-xs text-green-400 mt-2">{stats.verifiedUsers} verified</div>
        </div>
      </div>

      <div className="bg-[#1a1a2e]/50 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/20">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <Clock className="w-6 h-6 mr-2 text-yellow-400" />
            Pending Transactions ({transactions.length})
          </h2>
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 rounded-xl bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-all flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
        {renderTransactionsTable(transactions)}
      </div>
    </>
  )

  const renderTransactionsTable = (txList: Transaction[]) => {
    if (loading) {
      return (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading transactions...</p>
        </div>
      )
    }

    if (txList.length === 0) {
      return (
        <div className="text-center py-12">
          <CheckCircle className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No transactions found</p>
        </div>
      )
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Status</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">User</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Type</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Amount</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Asset</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Proof</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Date</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {txList.map((tx) => (
              <tr key={tx.id} className="border-b border-white/5 hover:bg-white/5">
                <td className="py-4 px-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    tx.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                    tx.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                    tx.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-blue-500/20 text-blue-400'
                  }`}>
                    {tx.status}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <div className="text-white font-medium">{tx.profiles?.full_name || 'Unknown'}</div>
                  <div className="text-sm text-gray-400">{tx.profiles?.email}</div>
                </td>
                <td className="py-4 px-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    tx.type === 'deposit' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {tx.type}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <div className="text-white font-bold">${(tx.value_usd || tx.amount)?.toLocaleString()}</div>
                  <div className="text-sm text-gray-400">{tx.amount} {tx.asset}</div>
                </td>
                <td className="py-4 px-4">
                  <span className="px-3 py-1 rounded-full text-xs bg-blue-500/20 text-blue-400 font-medium">
                    {tx.asset}
                  </span>
                </td>
                <td className="py-4 px-4">
                  {tx.payment_proof_url ? (
                    <a
                      href={tx.payment_proof_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1 text-purple-400 hover:text-purple-300"
                    >
                      <Eye className="w-4 h-4" />
                      <span className="text-sm">View</span>
                    </a>
                  ) : (
                    <span className="text-gray-500 text-sm">No proof</span>
                  )}
                </td>
                <td className="py-4 px-4 text-gray-400 text-sm">
                  {formatTimeAgo(tx.created_at)}
                </td>
                <td className="py-4 px-4">
                  {tx.status === 'pending' ? (
                    <button
                      onClick={() => setSelectedAction({ type: tx.type as any, transaction: tx })}
                      className="px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 text-sm font-medium transition-all"
                    >
                      Review
                    </button>
                  ) : (
                    <span className="text-gray-500 text-sm">{tx.status}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  const renderUsers = () => (
    <div className="bg-[#1a1a2e]/50 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/20">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center">
          <UserCheck className="w-6 h-6 mr-2 text-blue-400" />
          User Management ({users.length})
        </h2>
        <button
          onClick={fetchUsers}
          className="px-4 py-2 rounded-xl bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-all flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading users...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No users found</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">User</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Role</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">KYC Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Account Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Joined</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="py-4 px-4">
                    <div className="text-white font-medium">{user.full_name || 'No Name'}</div>
                    <div className="text-sm text-gray-400">{user.email}</div>
                  </td>
                  <td className="py-4 px-4">
                    <select
                      value={user.role}
                      onChange={(e) => handleUpdateUserRole(user.id, e.target.value)}
                      className="bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-white text-sm focus:outline-none focus:border-purple-500"
                    >
                      <option value="user">User</option>
                      <option value="moderator">Moderator</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        user.kyc_verified 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {user.kyc_verified ? 'Verified' : user.kyc_status || 'Pending'}
                      </span>
                      {!user.kyc_verified && user.kyc_status === 'pending' && (
                        <button
                          onClick={() => handleVerifyKYC(user.id)}
                          className="text-xs text-green-400 hover:text-green-300"
                        >
                          Verify
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <button
                      onClick={() => handleToggleUserStatus(user.id, user.is_active)}
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        user.is_active 
                          ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
                          : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                      }`}
                    >
                      {user.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="py-4 px-4 text-gray-400 text-sm">
                    {formatTimeAgo(user.created_at)}
                  </td>
                  <td className="py-4 px-4">
                    <button className="px-3 py-1.5 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 text-sm font-medium transition-all">
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f]">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:block fixed left-0 top-0 h-screen w-64 bg-[#1a1a2e]/80 backdrop-blur-xl border-r border-white/10 p-6 z-40">
        <div className="flex items-center space-x-2 mb-8">
          <Shield className="w-8 h-8 text-purple-500" />
          <div>
            <span className="text-xl font-bold text-white block">Admin Panel</span>
            <span className="text-xs text-gray-400">CryptoVault</span>
          </div>
        </div>

        <nav className="space-y-2">
          {[
            { id: 'dashboard', icon: BarChart3, label: 'Dashboard' },
            { id: 'deposits', icon: Upload, label: 'Deposits' },
            { id: 'withdrawals', icon: Download, label: 'Withdrawals' },
            { id: 'users', icon: Users, label: 'Users' },
            { id: 'settings', icon: Settings, label: 'Settings' }
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setSelectedTab(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                selectedTab === item.id 
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="absolute bottom-6 left-6 right-6 space-y-2">
          <a 
            href="/dashboard" 
            className="flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition-all"
          >
            <Home className="w-5 h-5" />
            <span>Main Site</span>
          </a>
          <button 
            onClick={handleSignOut}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)} 
              className="lg:hidden fixed inset-0 bg-black/50 z-40" 
            />
            <motion.aside 
              initial={{ x: -300 }} 
              animate={{ x: 0 }} 
              exit={{ x: -300 }}
              className="lg:hidden fixed left-0 top-0 h-screen w-64 bg-[#1a1a2e] border-r border-white/10 p-6 z-50"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-2">
                  <Shield className="w-8 h-8 text-purple-500" />
                  <span className="text-xl font-bold text-white">Admin</span>
                </div>
                <button onClick={() => setSidebarOpen(false)}>
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>

              <nav className="space-y-2">
                {[
                  { id: 'dashboard', icon: BarChart3, label: 'Dashboard' },
                  { id: 'deposits', icon: Upload, label: 'Deposits' },
                  { id: 'withdrawals', icon: Download, label: 'Withdrawals' },
                  { id: 'users', icon: Users, label: 'Users' },
                  { id: 'settings', icon: Settings, label: 'Settings' }
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => { setSelectedTab(item.id); setSidebarOpen(false) }}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                      selectedTab === item.id ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                ))}
              </nav>

              <div className="absolute bottom-6 left-6 right-6">
                <button 
                  onClick={handleSignOut}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="lg:ml-64 p-4 sm:p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSidebarOpen(true)} 
              className="lg:hidden p-2 rounded-xl bg-[#1a1a2e]/50 backdrop-blur-xl border border-purple-500/20"
            >
              <Menu className="w-6 h-6 text-white" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white">
                {selectedTab === 'dashboard' ? 'Admin Dashboard' : 
                 selectedTab === 'users' ? 'User Management' :
                 selectedTab === 'deposits' ? 'Deposit Management' :
                 selectedTab === 'withdrawals' ? 'Withdrawal Management' :
                 selectedTab.charAt(0).toUpperCase() + selectedTab.slice(1)}
              </h1>
              <p className="text-gray-400">Welcome back, {adminProfile?.full_name || 'Admin'}</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <span className="text-white font-bold">{adminProfile?.full_name?.charAt(0) || 'A'}</span>
            </div>
          </div>
        </div>

        {selectedTab === 'dashboard' && renderDashboard()}
        {selectedTab === 'deposits' && (
          <div className="bg-[#1a1a2e]/50 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/20">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <Upload className="w-6 h-6 mr-2 text-green-400" />
              All Deposits ({transactions.length})
            </h2>
            {renderTransactionsTable(transactions)}
          </div>
        )}
        {selectedTab === 'withdrawals' && (
          <div className="bg-[#1a1a2e]/50 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/20">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <Download className="w-6 h-6 mr-2 text-red-400" />
              All Withdrawals ({transactions.length})
            </h2>
            {renderTransactionsTable(transactions)}
          </div>
        )}
        {selectedTab === 'users' && renderUsers()}
        {selectedTab === 'settings' && (
          <div className="bg-[#1a1a2e]/50 backdrop-blur-xl rounded-2xl p-12 border border-purple-500/20 text-center">
            <Settings className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">Settings coming soon...</p>
          </div>
        )}
      </main>

      {/* Action Modal */}
      {selectedAction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#1a1a2e] rounded-2xl p-6 max-w-md w-full border border-purple-500/20"
          >
            <h3 className="text-xl font-bold text-white mb-4">
              Review {selectedAction.type === 'deposit' ? 'Deposit' : 'Withdrawal'}
            </h3>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm text-gray-400 mb-1">User</label>
                <div className="text-white font-medium">{selectedAction.transaction.profiles?.email}</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Amount</label>
                  <div className="text-white font-bold text-lg">
                    ${selectedAction.transaction.value_usd?.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-400">
                    {selectedAction.transaction.amount} {selectedAction.transaction.asset}
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Type</label>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    selectedAction.type === 'deposit' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {selectedAction.type}
                  </span>
                </div>
              </div>

              {selectedAction.transaction.payment_proof_url && (
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Payment Proof</label>
                  <a
                    href={selectedAction.transaction.payment_proof_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-400 hover:text-purple-300 text-sm flex items-center gap-1"
                  >
                    <Eye className="w-4 h-4" />
                    View Proof
                  </a>
                </div>
              )}

              <div>
                <label className="block text-sm text-gray-400 mb-2">Admin Notes (Optional)</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500 resize-none"
                  rows={3}
                  placeholder="Add notes about this transaction..."
                  disabled={actionLoading}
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3">
              <button 
                onClick={() => { setSelectedAction(null); setAdminNotes('') }} 
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleReject}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all flex items-center space-x-2 disabled:opacity-50"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                <span>Reject</span>
              </button>
              <button 
                onClick={handleApprove}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:opacity-90 transition-all flex items-center space-x-2 disabled:opacity-50"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                <span>Approve</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
