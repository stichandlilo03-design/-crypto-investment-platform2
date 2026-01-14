'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, DollarSign, TrendingUp, Activity, Shield, AlertCircle, 
  CheckCircle, XCircle, Search, Filter, Download, Settings, 
  Bell, LogOut, Wallet, BarChart3, FileText, Clock, Eye,
  Edit, Trash2, MoreVertical, Check, X, ExternalLink, Menu,
  Upload, Loader2, Home, CreditCard, UserCheck, RefreshCw
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'

interface Transaction {
  id: string
  user_id: string
  amount: number
  asset: string
  type: 'deposit' | 'withdrawal' | 'buy' | 'sell'
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
    pendingWithdrawals: 0
  })

  const [selectedAction, setSelectedAction] = useState<{
    type: 'deposit' | 'withdrawal'
    id: string
    userEmail: string
    amount: number
    asset: string
  } | null>(null)
  const [adminNotes, setAdminNotes] = useState('')
  
  const supabase = createClientComponentClient()
  const router = useRouter()

  // Load admin profile once on mount
  useEffect(() => {
    loadAdminProfile()
  }, [])

  useEffect(() => {
    if (adminProfile) {
      fetchDashboardData()
    }
  }, [selectedTab, adminProfile])

  const loadAdminProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/admin/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (!profile || profile.role !== 'admin') {
        router.push('/admin/login')
        return
      }

      setAdminProfile(profile)
    } catch (error) {
      console.error('Profile load error:', error)
      router.push('/admin/login')
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      if (selectedTab === 'dashboard') {
        // Fetch pending transactions
        const transactionsRes = await fetch('/api/admin/transactions?status=pending')
        const transactionsData = await transactionsRes.json()

        if (transactionsData.success) {
          setTransactions(transactionsData.data || [])
        }
      }
      
      if (selectedTab === 'users') {
        const usersRes = await fetch('/api/admin/users')
        const usersData = await usersRes.json()
        if (usersData.success) setUsers(usersData.data || [])
      }

      // Fetch stats
      try {
        const statsRes = await fetch('/api/admin/stats')
        const statsData = await statsRes.json()
        if (statsData.success) setStats(statsData.data)
      } catch (statsError) {
        console.error('Stats fetch error:', statsError)
      }

    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id: string) => {
    if (!selectedAction) return
    
    try {
      const response = await fetch('/api/admin/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          action: 'approve',
          adminNotes: adminNotes || null
        })
      })

      const data = await response.json()

      if (data.success) {
        alert('Transaction approved successfully')
        setSelectedAction(null)
        setAdminNotes('')
        fetchDashboardData()
      } else {
        alert(`Error: ${data.error || 'Failed to approve transaction'}`)
      }
    } catch (error) {
      console.error('Approval error:', error)
      alert('Failed to approve. Please try again.')
    }
  }

  const handleReject = async (id: string) => {
    if (!selectedAction) return
    
    try {
      const response = await fetch('/api/admin/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          action: 'reject',
          adminNotes: adminNotes || null
        })
      })

      const data = await response.json()

      if (data.success) {
        alert('Transaction rejected successfully')
        setSelectedAction(null)
        setAdminNotes('')
        fetchDashboardData()
      } else {
        alert(`Error: ${data.error || 'Failed to reject transaction'}`)
      }
    } catch (error) {
      console.error('Rejection error:', error)
      alert('Failed to reject. Please try again.')
    }
  }

  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          role: newRole
        })
      })

      const data = await response.json()

      if (data.success) {
        alert('User role updated successfully')
        fetchDashboardData()
      } else {
        alert(`Error: ${data.error || 'Failed to update user role'}`)
      }
    } catch (error) {
      console.error('Update error:', error)
      alert('Failed to update user role.')
    }
  }

  const formatTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch (error) {
      return 'Unknown time'
    }
  }

  const renderDashboard = () => {
    // Filter transactions by type
    const pendingDeposits = transactions.filter(t => t.type === 'deposit')
    const pendingWithdrawals = transactions.filter(t => t.type === 'withdrawal')

    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="glass-effect p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white">{stats.totalUsers}</div>
                <div className="text-sm text-gray-400">Total Users</div>
              </div>
            </div>
          </div>

          <div className="glass-effect p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white">{pendingDeposits.length}</div>
                <div className="text-sm text-gray-400">Pending Deposits</div>
              </div>
            </div>
          </div>

          <div className="glass-effect p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white">{pendingWithdrawals.length}</div>
                <div className="text-sm text-gray-400">Pending Withdrawals</div>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Transactions */}
        <div className="glass-effect rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-display font-bold text-white flex items-center">
              <Clock className="w-6 h-6 mr-2 text-yellow-400" />
              Pending Transactions ({transactions.length})
            </h2>
            <button
              onClick={fetchDashboardData}
              className="px-4 py-2 rounded-xl glass-effect hover:bg-white/10 transition-all flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
          
          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 text-purple-500 animate-spin mx-auto" />
              <p className="text-gray-400 mt-2">Loading transactions...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No pending transactions</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Type</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">User</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Amount</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Asset</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Details</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Submitted</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs ${
                          transaction.type === 'deposit' 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {transaction.type === 'deposit' ? 'Deposit' : 'Withdrawal'}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div>
                          <div className="text-white font-medium">
                            {transaction.profiles?.full_name || 'Unknown User'}
                          </div>
                          <div className="text-sm text-gray-400">{transaction.profiles?.email}</div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-white font-bold">
                          ${transaction.value_usd?.toLocaleString() || transaction.amount.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-400">{transaction.amount} {transaction.asset}</div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="px-3 py-1 rounded-full text-xs bg-blue-500/20 text-blue-400">
                          {transaction.asset}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        {transaction.type === 'deposit' ? (
                          transaction.payment_proof_url ? (
                            <a
                              href={transaction.payment_proof_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center space-x-1 text-purple-400 hover:text-purple-300"
                            >
                              <FileText className="w-4 h-4" />
                              <span className="text-sm">View Proof</span>
                            </a>
                          ) : (
                            <span className="text-gray-400 text-sm">No proof</span>
                          )
                        ) : (
                          <div className="text-gray-400 text-sm font-mono max-w-[200px] truncate">
                            {transaction.wallet_address || 'No wallet'}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4 text-gray-400 text-sm">
                        {formatTimeAgo(transaction.created_at)}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setSelectedAction({
                                type: transaction.type as 'deposit' | 'withdrawal',
                                id: transaction.id,
                                userEmail: transaction.profiles?.email || '',
                                amount: transaction.value_usd || transaction.amount,
                                asset: transaction.asset
                              })
                            }}
                            className="px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 text-sm font-medium transition-all flex items-center space-x-1"
                          >
                            <Check className="w-3 h-3" />
                            <span>Review</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </>
    )
  }

  const renderUsers = () => (
    <div className="glass-effect rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-display font-bold text-white flex items-center">
          <UserCheck className="w-6 h-6 mr-2 text-blue-400" />
          User Management ({users.length})
        </h2>
        <button
          onClick={fetchDashboardData}
          className="px-4 py-2 rounded-xl glass-effect hover:bg-white/10 transition-all flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>
      
      {loading ? (
        <div className="text-center py-8">
          <Loader2 className="w-8 h-8 text-purple-500 animate-spin mx-auto" />
          <p className="text-gray-400 mt-2">Loading users...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-8">
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
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Joined</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="py-4 px-4">
                    <div>
                      <div className="text-white font-medium">
                        {user.full_name || 'No Name'}
                      </div>
                      <div className="text-sm text-gray-400">{user.email}</div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <select
                      value={user.role || 'user'}
                      onChange={(e) => handleUpdateUserRole(user.id, e.target.value)}
                      className="bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-white text-sm focus:outline-none focus:border-purple-500"
                    >
                      <option value="user">User</option>
                      <option value="moderator">Moderator</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs ${
                      user.kyc_verified 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {user.kyc_verified ? 'Verified' : 'Pending'}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs ${
                      user.is_active 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-gray-400 text-sm">
                    {formatTimeAgo(user.created_at)}
                  </td>
                  <td className="py-4 px-4">
                    <button
                      onClick={() => alert(`Manage user: ${user.email}`)}
                      className="px-3 py-1.5 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 text-sm font-medium transition-all"
                    >
                      Manage
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

  // Show loading until profile loads
  if (!adminProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f]">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block fixed left-0 top-0 h-screen w-64 glass-effect border-r border-white/10 p-6 z-40">
        <div className="flex items-center space-x-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="text-xl font-bold text-white block">Admin Panel</span>
            <span className="text-xs text-gray-400">CryptoVault</span>
          </div>
        </div>
        
        <nav className="space-y-2">
          {[
            { id: 'dashboard', icon: BarChart3, label: 'Dashboard' },
            { id: 'deposits', icon: Download, label: 'Deposits' },
            { id: 'withdrawals', icon: Upload, label: 'Withdrawals' },
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
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition-all"
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
              className="lg:hidden fixed left-0 top-0 h-screen w-64 glass-effect border-r border-white/10 p-6 z-50"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xl font-bold text-white">Admin</span>
                </div>
                <button onClick={() => setSidebarOpen(false)}>
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>
              
              <nav className="space-y-2">
                {[
                  { id: 'dashboard', icon: BarChart3, label: 'Dashboard' },
                  { id: 'deposits', icon: Download, label: 'Deposits' },
                  { id: 'withdrawals', icon: Upload, label: 'Withdrawals' },
                  { id: 'users', icon: Users, label: 'Users' },
                  { id: 'settings', icon: Settings, label: 'Settings' }
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => { setSelectedTab(item.id); setSidebarOpen(false) }}
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
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition-all"
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
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSidebarOpen(true)} 
              className="lg:hidden p-2 rounded-xl glass-effect"
            >
              <Menu className="w-6 h-6 text-white" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white">
                {selectedTab === 'dashboard' ? 'Admin Dashboard' : 
                 selectedTab === 'users' ? 'User Management' :
                 selectedTab.charAt(0).toUpperCase() + selectedTab.slice(1)}
              </h1>
              <p className="text-gray-400">
                Welcome back, {adminProfile?.full_name || 'Admin'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button className="p-2.5 rounded-xl glass-effect hover:bg-white/10 relative">
              <Bell className="w-5 h-5 text-white" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
            </button>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <span className="text-white font-bold">
                {adminProfile?.full_name?.charAt(0) || 'A'}
              </span>
            </div>
          </div>
        </div>

        {/* Content Area */}
        {selectedTab === 'dashboard' && renderDashboard()}
        {selectedTab === 'users' && renderUsers()}
        {selectedTab === 'deposits' && (
          <div className="text-center py-12">
            <p className="text-gray-400">Deposits management coming soon...</p>
          </div>
        )}
        {selectedTab === 'withdrawals' && (
          <div className="text-center py-12">
            <p className="text-gray-400">Withdrawals management coming soon...</p>
          </div>
        )}
        {selectedTab === 'settings' && (
          <div className="text-center py-12">
            <p className="text-gray-400">Settings coming soon...</p>
          </div>
        )}
      </main>

      {/* Approval Modal */}
      {selectedAction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-effect rounded-2xl p-6 max-w-md w-full"
          >
            <h3 className="text-xl font-bold text-white mb-2">
              Review {selectedAction.type === 'deposit' ? 'Deposit' : 'Withdrawal'}
            </h3>
            
            <div className="space-y-4 my-6">
              <div>
                <label className="block text-sm text-gray-400 mb-1">User</label>
                <div className="text-white font-medium">{selectedAction.userEmail}</div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Amount</label>
                  <div className="text-white font-bold">${selectedAction.amount.toLocaleString()}</div>
                  <div className="text-sm text-gray-400">{selectedAction.amount} {selectedAction.asset}</div>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Type</label>
                  <span className={`px-3 py-1 rounded-full text-xs ${
                    selectedAction.type === 'deposit' 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {selectedAction.type === 'deposit' ? 'Deposit' : 'Withdrawal'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Admin Notes (Optional)</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500"
                  rows={3}
                  placeholder="Add notes about this transaction..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => {
                  setSelectedAction(null)
                  setAdminNotes('')
                }}
                className="px-4 py-2 rounded-xl glass-effect hover:bg-white/10 text-white transition-all"
              >
                Cancel
              </button>
              
              <button
                onClick={() => handleReject(selectedAction.id)}
                className="px-4 py-2 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all flex items-center space-x-2"
              >
                <X className="w-4 h-4" />
                <span>Reject</span>
              </button>
              
              <button
                onClick={() => handleApprove(selectedAction.id)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:opacity-90 transition-all flex items-center space-x-2"
              >
                <Check className="w-4 h-4" />
                <span>Approve</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
