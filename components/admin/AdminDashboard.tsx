'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, Shield, AlertCircle, CheckCircle, Bell, LogOut, 
  BarChart3, FileText, Clock, Check, X, Menu, Upload, Loader2, 
  Home, CreditCard, UserCheck, RefreshCw, Download, Settings, DollarSign,
  Plus, Minus, TrendingUp, TrendingDown, Wallet
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { supabase } from '@/lib/supabase/client'
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
  user_email?: string
  user_name?: string
  user_phone?: string
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

interface UserBalance {
  user_id: string
  asset: string
  amount: number
  average_buy_price: number
  user_email?: string
  user_name?: string
}

export default function AdminDashboard() {
  const [selectedTab, setSelectedTab] = useState('dashboard')
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [userBalances, setUserBalances] = useState<UserBalance[]>([])
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [adminProfile, setAdminProfile] = useState<any>(null)
  const [authChecking, setAuthChecking] = useState(true)
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDeposits: 0,
    totalWithdrawals: 0,
    totalVolume: 0,
    pendingDeposits: 0,
    pendingWithdrawals: 0
  })

  const [selectedAction, setSelectedAction] = useState<{
    type: 'deposit' | 'withdraw'
    id: string
    userEmail: string
    amount: number
    asset: string
  } | null>(null)
  const [adminNotes, setAdminNotes] = useState('')

  // Balance Manager State
  const [balanceManagerModal, setBalanceManagerModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<string>('')
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'subtract'>('add')
  const [adjustmentAsset, setAdjustmentAsset] = useState('USD')
  const [adjustmentAmount, setAdjustmentAmount] = useState('')
  const [adjustmentReason, setAdjustmentReason] = useState('')
  const [processingAdjustment, setProcessingAdjustment] = useState(false)
  
  const router = useRouter()

  useEffect(() => {
    checkAdminAuth()
  }, [])

  const checkAdminAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        console.log('No session found')
        router.push('/admin/login')
        return
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (error) {
        console.error('Profile fetch error:', error)
        router.push('/admin/login')
        return
      }

      if (profile?.role !== 'admin') {
        console.log('User is not admin:', profile?.role)
        router.push('/dashboard')
        return
      }

      console.log('Admin authenticated:', profile.email)
      setAdminProfile(profile)
      setAuthChecking(false)
      await fetchDashboardData()
    } catch (error) {
      console.error('Auth error:', error)
      router.push('/admin/login')
    }
  }

  useEffect(() => {
    if (adminProfile && !authChecking) {
      fetchDashboardData()
    }
  }, [selectedTab])

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/admin/login')
    } catch (error) {
      console.error('Sign out error:', error)
      window.location.href = '/admin/login'
    }
  }

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch transactions
      let transactionsQuery = supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (selectedTab === 'dashboard') {
        transactionsQuery = transactionsQuery.eq('status', 'pending')
      } else if (selectedTab === 'deposits') {
        transactionsQuery = transactionsQuery.eq('type', 'deposit')
      } else if (selectedTab === 'withdrawals') {
        transactionsQuery = transactionsQuery.eq('type', 'withdraw')
      }

      const { data: transactionsData, error: transactionsError } = await transactionsQuery

      if (transactionsError) {
        console.error('Error fetching transactions:', transactionsError)
        setTransactions([])
      } else if (transactionsData) {
        const userIds = [...new Set(transactionsData.map(t => t.user_id))]
        
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, email, full_name, phone')
          .in('id', userIds)

        const enrichedTransactions = transactionsData.map(tx => {
          const userProfile = profilesData?.find(p => p.id === tx.user_id)
          return {
            ...tx,
            user_email: userProfile?.email || 'Unknown',
            user_name: userProfile?.full_name || 'Unknown User',
            user_phone: userProfile?.phone || null
          }
        })

        setTransactions(enrichedTransactions)
      }
      
      if (selectedTab === 'users') {
        const { data: usersData, error: usersError } = await supabase
          .from('profiles')
          .select('id, email, full_name, role, kyc_verified, is_active, created_at')
          .order('created_at', { ascending: false })

        if (usersError) {
          console.error('Error fetching users:', usersError)
          setUsers([])
        } else {
          setUsers(usersData || [])
        }
      }

      // Fetch user balances for Balance Manager
      if (selectedTab === 'balance-manager') {
        const { data: balancesData } = await supabase
          .from('user_balances')
          .select('*')
          .order('amount', { ascending: false })

        if (balancesData) {
          const userIds = [...new Set(balancesData.map(b => b.user_id))]
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, email, full_name')
            .in('id', userIds)

          const enrichedBalances = balancesData.map(balance => {
            const userProfile = profilesData?.find(p => p.id === balance.user_id)
            return {
              ...balance,
              user_email: userProfile?.email || 'Unknown',
              user_name: userProfile?.full_name || 'Unknown User'
            }
          })

          setUserBalances(enrichedBalances)
        }
      }

      // Calculate stats
      try {
        const { data: allTransactions } = await supabase
          .from('transactions')
          .select('*')

        if (allTransactions) {
          const deposits = allTransactions.filter(t => t.type === 'deposit' && t.status === 'approved')
          const withdrawals = allTransactions.filter(t => t.type === 'withdraw' && t.status === 'approved')
          const pendingDeposits = allTransactions.filter(t => t.type === 'deposit' && t.status === 'pending')
          const pendingWithdrawals = allTransactions.filter(t => t.type === 'withdraw' && t.status === 'pending')

          const { count: userCount } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })

          setStats({
            totalUsers: userCount || 0,
            totalDeposits: deposits.reduce((sum, t) => sum + (t.value_usd || t.amount), 0),
            totalWithdrawals: withdrawals.reduce((sum, t) => sum + (t.value_usd || t.amount), 0),
            totalVolume: allTransactions.reduce((sum, t) => sum + (t.value_usd || t.amount), 0),
            pendingDeposits: pendingDeposits.length,
            pendingWithdrawals: pendingWithdrawals.length
          })
        }
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
      const { error: updateError } = await supabase
        .from('transactions')
        .update({
          status: 'approved',
          admin_notes: adminNotes || null
        })
        .eq('id', id)

      if (updateError) {
        console.error('Approval error:', updateError)
        alert(`Error: ${updateError.message}`)
        return
      }

      const transaction = transactions.find(t => t.id === id)
      if (transaction) {
        await supabase
          .from('notifications')
          .insert([
            {
              user_id: transaction.user_id,
              type: transaction.type,
              title: `${transaction.type === 'deposit' ? 'Deposit' : 'Withdrawal'} Approved`,
              message: `Your ${transaction.type} of $${transaction.value_usd || transaction.amount} has been approved.`,
              read: false
            }
          ])
      }

      alert('Transaction approved successfully')
      setSelectedAction(null)
      setAdminNotes('')
      fetchDashboardData()
    } catch (error) {
      console.error('Approval error:', error)
      alert('Failed to approve. Please try again.')
    }
  }

  const handleReject = async (id: string) => {
    if (!selectedAction) return
    
    try {
      const { error: updateError } = await supabase
        .from('transactions')
        .update({
          status: 'rejected',
          admin_notes: adminNotes || null
        })
        .eq('id', id)

      if (updateError) {
        console.error('Rejection error:', updateError)
        alert(`Error: ${updateError.message}`)
        return
      }

      const transaction = transactions.find(t => t.id === id)
      if (transaction) {
        await supabase
          .from('notifications')
          .insert([
            {
              user_id: transaction.user_id,
              type: transaction.type,
              title: `${transaction.type === 'deposit' ? 'Deposit' : 'Withdrawal'} Rejected`,
              message: `Your ${transaction.type} of $${transaction.value_usd || transaction.amount} has been rejected. ${adminNotes ? 'Reason: ' + adminNotes : ''}`,
              read: false
            }
          ])
      }

      alert('Transaction rejected successfully')
      setSelectedAction(null)
      setAdminNotes('')
      fetchDashboardData()
    } catch (error) {
      console.error('Rejection error:', error)
      alert('Failed to reject. Please try again.')
    }
  }

  const handleBalanceAdjustment = async () => {
    if (!selectedUser || !adjustmentAmount || Number(adjustmentAmount) <= 0) {
      alert('Please fill in all fields')
      return
    }

    setProcessingAdjustment(true)

    try {
      const user = users.find(u => u.id === selectedUser)
      if (!user) throw new Error('User not found')

      // Get current balance
      const { data: currentBalance } = await supabase
        .from('user_balances')
        .select('*')
        .eq('user_id', selectedUser)
        .eq('asset', adjustmentAsset)
        .single()

      const currentAmount = currentBalance?.amount || 0
      const adjustmentValue = Number(adjustmentAmount)
      const newAmount = adjustmentType === 'add' 
        ? currentAmount + adjustmentValue 
        : currentAmount - adjustmentValue

      if (newAmount < 0) {
        alert('Cannot reduce balance below zero')
        setProcessingAdjustment(false)
        return
      }

      // Update or insert balance
      const { error: balanceError } = await supabase
        .from('user_balances')
        .upsert({
          user_id: selectedUser,
          asset: adjustmentAsset,
          amount: newAmount,
          average_buy_price: currentBalance?.average_buy_price || 0
        })

      if (balanceError) throw balanceError

      // Create transaction record
      await supabase
        .from('transactions')
        .insert({
          user_id: selectedUser,
          type: adjustmentType === 'add' ? 'deposit' : 'withdraw',
          asset: adjustmentAsset,
          amount: adjustmentValue,
          value_usd: adjustmentValue,
          status: 'approved',
          admin_notes: `Admin adjustment: ${adjustmentReason}`
        })

      // Send notification
      await supabase
        .from('notifications')
        .insert({
          user_id: selectedUser,
          type: 'info',
          title: 'Balance Adjustment',
          message: `Your ${adjustmentAsset} balance has been ${adjustmentType === 'add' ? 'increased' : 'decreased'} by ${adjustmentValue}. ${adjustmentReason}`,
          read: false
        })

      alert('Balance adjusted successfully')
      setBalanceManagerModal(false)
      setSelectedUser('')
      setAdjustmentAmount('')
      setAdjustmentReason('')
      fetchDashboardData()

    } catch (error: any) {
      console.error('Adjustment error:', error)
      alert(`Error: ${error.message}`)
    } finally {
      setProcessingAdjustment(false)
    }
  }

  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId)

      if (error) {
        console.error('Update error:', error)
        alert(`Error: ${error.message}`)
        return
      }

      alert('User role updated successfully')
      fetchDashboardData()
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }

  const renderTransactionsList = (title: string, icon: any, filterType?: string) => {
    const Icon = icon
    const filteredTransactions = filterType 
      ? transactions.filter(t => t.type === filterType)
      : transactions

    return (
      <div className="glass-effect rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-display font-bold text-white flex items-center">
            <Icon className="w-6 h-6 mr-2 text-yellow-400" />
            {title} ({filteredTransactions.length})
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
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No transactions found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">User</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Amount</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Asset</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Details</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-4 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs ${
                        transaction.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                        transaction.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                        transaction.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {transaction.status}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div>
                        <div className="text-white font-medium">
                          {transaction.user_name || 'Unknown User'}
                        </div>
                        <div className="text-sm text-gray-400">{transaction.user_email}</div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-white font-bold">
                        ${(transaction.value_usd || transaction.amount).toLocaleString()}
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
                      {transaction.status === 'pending' ? (
                        <button
                          onClick={() => {
                            setSelectedAction({
                              type: transaction.type === 'deposit' ? 'deposit' : 'withdraw',
                              id: transaction.id,
                              userEmail: transaction.user_email || '',
                              amount: transaction.value_usd || transaction.amount,
                              asset: transaction.asset
                            })
                          }}
                          className="px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 text-sm font-medium transition-all flex items-center space-x-1"
                        >
                          <Check className="w-3 h-3" />
                          <span>Review</span>
                        </button>
                      ) : (
                        <span className="text-gray-500 text-sm">
                          {transaction.status === 'approved' ? 'Approved' : 'Completed'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    )
  }

  const renderDashboard = () => {
    const pendingDeposits = transactions.filter(t => t.type === 'deposit')
    const pendingWithdrawals = transactions.filter(t => t.type === 'withdraw')

    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
                <Download className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white">${stats.totalDeposits.toLocaleString()}</div>
                <div className="text-sm text-gray-400">Total Deposits</div>
              </div>
            </div>
          </div>

          <div className="glass-effect p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center">
                <Upload className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white">${stats.totalWithdrawals.toLocaleString()}</div>
                <div className="text-sm text-gray-400">Total Withdrawals</div>
              </div>
            </div>
          </div>

          <div className="glass-effect p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white">{pendingDeposits.length + pendingWithdrawals.length}</div>
                <div className="text-sm text-gray-400">Pending</div>
              </div>
            </div>
          </div>
        </div>

        {renderTransactionsList('Pending Transactions', Clock)}
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
                      <div className="text-white font-medium">{user.full_name || 'No Name'}</div>
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
                      onClick={() => {
                        setSelectedUser(user.id)
                        setBalanceManagerModal(true)
                      }}
                      className="px-3 py-1.5 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 text-sm font-medium transition-all"
                    >
                      Adjust Balance
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

  const renderBalanceManager = () => (
    <div className="glass-effect rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-display font-bold text-white flex items-center">
          <DollarSign className="w-6 h-6 mr-2 text-green-400" />
          Balance Manager
        </h2>
        <button
          onClick={() => setBalanceManagerModal(true)}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:opacity-90 transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Adjustment</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <Loader2 className="w-8 h-8 text-purple-500 animate-spin mx-auto" />
          <p className="text-gray-400 mt-2">Loading balances...</p>
        </div>
      ) : userBalances.length === 0 ? (
        <div className="text-center py-8">
          <Wallet className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No user balances found</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">User</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Asset</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Amount</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">USD Value</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {userBalances.map((balance, index) => (
                <tr key={`${balance.user_id}-${balance.asset}-${index}`} className="border-b border-white/5 hover:bg-white/5">
                  <td className="py-4 px-4">
                    <div>
                      <div className="text-white font-medium">{balance.user_name}</div>
                      <div className="text-sm text-gray-400">{balance.user_email}</div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="px-3 py-1 rounded-full text-xs bg-blue-500/20 text-blue-400">
                      {balance.asset}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="text-white font-bold">{balance.amount.toFixed(8)}</div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="text-white font-medium">
                      {formatCurrency(balance.amount * (balance.average_buy_price || 1))}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <button
                      onClick={() => {
                        setSelectedUser(balance.user_id)
                        setAdjustmentAsset(balance.asset)
                        setBalanceManagerModal(true)
                      }}
                      className="px-3 py-1.5 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 text-sm font-medium transition-all"
                    >
                      Adjust
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

  if (authChecking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Checking authentication...</p>
        </div>
      </div>
    )
  }
    
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f]">
      <aside className="hidden lg:block fixed left-0 top-0 h-screen w-64 glass-effect border-r border-white/10 p-6 z-40 overflow-y-auto">
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
            { id: 'balance-manager', icon: DollarSign, label: 'Balance Manager', highlight: true },
            { id: 'settings', icon: Settings, label: 'Settings' }
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setSelectedTab(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                selectedTab === item.id 
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                  : item.highlight
                  ? 'text-green-400 hover:bg-green-500/10'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
        
        <div className="absolute bottom-6 left-6 right-6 space-y-2">
          <a href="/dashboard" className="flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition-all">
            <Home className="w-5 h-5" />
            <span>Main Site</span>
          </a>
          <button onClick={handleSignOut} className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition-all">
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSidebarOpen(false)} className="lg:hidden fixed inset-0 bg-black/50 z-40" />
            <motion.aside initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }} className="lg:hidden fixed left-0 top-0 h-screen w-64 glass-effect border-r border-white/10 p-6 z-50 overflow-y-auto">
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
                  { id: 'balance-manager', icon: DollarSign, label: 'Balance Manager', highlight: true },
                  { id: 'settings', icon: Settings, label: 'Settings' }
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => { setSelectedTab(item.id); setSidebarOpen(false) }}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                      selectedTab === item.id 
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                        : item.highlight
                        ? 'text-green-400 hover:bg-green-500/10'
                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                ))}
              </nav>
              <div className="absolute bottom-6 left-6 right-6 space-y-2">
                <a href="/dashboard" className="flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition-all">
                  <Home className="w-5 h-5" />
                  <span>Main Site</span>
                </a>
                <button onClick={handleSignOut} className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition-all">
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main className="lg:ml-64 p-4 sm:p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-xl glass-effect">
              <Menu className="w-6 h-6 text-white" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white">
                {selectedTab === 'dashboard' ? 'Admin Dashboard' : 
                 selectedTab === 'users' ? 'User Management' :
                 selectedTab === 'deposits' ? 'Deposit Management' :
                 selectedTab === 'withdrawals' ? 'Withdrawal Management' :
                 selectedTab === 'balance-manager' ? 'Balance Manager' :
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
        {selectedTab === 'deposits' && renderTransactionsList('All Deposits', Download, 'deposit')}
        {selectedTab === 'withdrawals' && renderTransactionsList('All Withdrawals', Upload, 'withdraw')}
        {selectedTab === 'users' && renderUsers()}
        {selectedTab === 'balance-manager' && renderBalanceManager()}
        {selectedTab === 'settings' && <div className="text-center py-12"><p className="text-gray-400">Settings coming soon...</p></div>}
      </main>

      {/* Transaction Review Modal */}
      {selectedAction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-effect rounded-2xl p-6 max-w-md w-full">
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
                    selectedAction.type === 'deposit' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
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
              <button onClick={() => { setSelectedAction(null); setAdminNotes('') }} className="px-4 py-2 rounded-xl glass-effect hover:bg-white/10 text-white transition-all">
                Cancel
              </button>
              <button onClick={() => handleReject(selectedAction.id)} className="px-4 py-2 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all flex items-center space-x-2">
                <X className="w-4 h-4" />
                <span>Reject</span>
              </button>
              <button onClick={() => handleApprove(selectedAction.id)} className="px-4 py-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:opacity-90 transition-all flex items-center space-x-2">
                <Check className="w-4 h-4" />
                <span>Approve</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Balance Adjustment Modal */}
      {balanceManagerModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-effect rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4">Adjust User Balance</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">User</label>
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500"
                  required
                >
                  <option value="">Select user...</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.full_name || user.email} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Adjustment Type</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setAdjustmentType('add')}
                    className={`p-3 rounded-xl border-2 transition-all ${
                      adjustmentType === 'add'
                        ? 'border-green-500 bg-green-500/20'
                        : 'border-white/10 bg-white/5'
                    }`}
                  >
                    <Plus className="w-5 h-5 text-green-400 mx-auto mb-1" />
                    <p className="text-white text-sm font-medium">Add Profit</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAdjustmentType('subtract')}
                    className={`p-3 rounded-xl border-2 transition-all ${
                      adjustmentType === 'subtract'
                        ? 'border-red-500 bg-red-500/20'
                        : 'border-white/10 bg-white/5'
                    }`}
                  >
                    <Minus className="w-5 h-5 text-red-400 mx-auto mb-1" />
                    <p className="text-white text-sm font-medium">Deduct Loss</p>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Asset</label>
                <select
                  value={adjustmentAsset}
                  onChange={(e) => setAdjustmentAsset(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500"
                  required
                >
                  <option value="USD">USD</option>
                  <option value="BTC">BTC</option>
                  <option value="ETH">ETH</option>
                  <option value="USDT">USDT</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Amount</label>
                <input
                  type="number"
                  value={adjustmentAmount}
                  onChange={(e) => setAdjustmentAmount(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Reason</label>
                <textarea
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500"
                  rows={3}
                  placeholder="Reason for adjustment..."
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setBalanceManagerModal(false)
                  setSelectedUser('')
                  setAdjustmentAmount('')
                  setAdjustmentReason('')
                }}
                className="px-4 py-2 rounded-xl glass-effect hover:bg-white/10 text-white transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleBalanceAdjustment}
                disabled={processingAdjustment}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90 transition-all flex items-center space-x-2 disabled:opacity-50"
              >
                {processingAdjustment ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Confirm Adjustment</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
