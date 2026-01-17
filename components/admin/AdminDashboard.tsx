'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, Shield, AlertCircle, CheckCircle, Bell, LogOut, 
  BarChart3, FileText, Clock, Check, X, Menu, Upload, Loader2, 
  Home, CreditCard, UserCheck, RefreshCw, Download, Settings, DollarSign,
  Plus, Minus, TrendingUp, TrendingDown, Wallet, Eye, ArrowDownRight, ArrowUpRight
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { supabase } from '@/lib/supabase/client'
import { getCryptoPrices } from '@/lib/api/coingecko'
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

interface CryptoPrice {
  price: number
  change24h: number
  marketCap?: number
}

interface CryptoPrices {
  [key: string]: CryptoPrice
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
  const [cryptoPrices, setCryptoPrices] = useState<CryptoPrices>({})
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

  const [balanceManagerModal, setBalanceManagerModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<string>('')
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'subtract'>('add')
  const [adjustmentAsset, setAdjustmentAsset] = useState('USD')
  const [adjustmentAmount, setAdjustmentAmount] = useState('')
  const [adjustmentReason, setAdjustmentReason] = useState('')
  const [processingAdjustment, setProcessingAdjustment] = useState(false)
  const [pricesLoading, setPricesLoading] = useState(true)
  
  // ✅ View as User Feature
  const [viewAsUserModal, setViewAsUserModal] = useState(false)
  const [viewingUserId, setViewingUserId] = useState<string | null>(null)
  const [viewingUserData, setViewingUserData] = useState<any>(null)
  const [viewingUserBalances, setViewingUserBalances] = useState<any[]>([])
  const [viewingUserTransactions, setViewingUserTransactions] = useState<any[]>([])
  const [loadingUserView, setLoadingUserView] = useState(false)
  
  const router = useRouter()

  useEffect(() => {
    checkAdminAuth()
    fetchPrices()
  }, [])

  const fetchPrices = async () => {
    try {
      setPricesLoading(true)
      const prices = await getCryptoPrices(['BTC', 'ETH', 'USDT', 'SOL', 'ADA', 'BNB', 'XRP', 'DOGE'])
      
      const pricesWithUSD = {
        ...prices,
        USD: { price: 1, change24h: 0, marketCap: 0 }
      }
      
      setCryptoPrices(pricesWithUSD)
      console.log('Admin fetched prices from API:', pricesWithUSD)
    } catch (error) {
      console.error('Error fetching prices:', error)
      setCryptoPrices({
        BTC: { price: 95000, change24h: 0 },
        ETH: { price: 3300, change24h: 0 },
        USDT: { price: 1, change24h: 0 },
        USD: { price: 1, change24h: 0 }
      })
    } finally {
      setPricesLoading(false)
    }
  }

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
      const transaction = transactions.find(t => t.id === id)
      if (!transaction) {
        alert('Transaction not found')
        return
      }

      const cryptoAmount = Number(transaction.amount)
      const usdValue = Number(transaction.value_usd)

      if (!cryptoAmount || cryptoAmount <= 0) {
        alert('Error: Invalid crypto amount in transaction')
        return
      }

      if (!usdValue || usdValue <= 0) {
        alert('Error: Invalid USD value in transaction')
        return
      }

      console.log('Approving transaction:', {
        id: transaction.id,
        asset: transaction.asset,
        cryptoAmount,
        usdValue,
        pricePerCoin: usdValue / cryptoAmount
      })

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

      const { data: currentBalance } = await supabase
        .from('user_balances')
        .select('*')
        .eq('user_id', transaction.user_id)
        .eq('asset', transaction.asset)
        .single()

      let newAmount = 0
      let newAvgPrice = 0

      // ✅ Handle DEPOSIT vs WITHDRAWAL differently
      if (transaction.type === 'deposit') {
        // DEPOSIT: Add to balance
        if (currentBalance) {
          const existingAmount = Number(currentBalance.amount)
          const existingAvgPrice = Number(currentBalance.average_buy_price)
          const depositAmount = cryptoAmount
          const depositPrice = usdValue / cryptoAmount

          newAmount = existingAmount + depositAmount

          const existingValue = existingAmount * existingAvgPrice
          const newValue = depositAmount * depositPrice
          newAvgPrice = (existingValue + newValue) / newAmount

          console.log('✅ DEPOSIT - Balance calculation:', {
            existing: { amount: existingAmount, price: existingAvgPrice, value: existingValue },
            deposit: { amount: depositAmount, price: depositPrice, value: newValue },
            result: { amount: newAmount, avgPrice: newAvgPrice }
          })
        } else {
          newAmount = cryptoAmount
          newAvgPrice = usdValue / cryptoAmount
          
          console.log('✅ DEPOSIT - First deposit:', {
            amount: newAmount,
            price: newAvgPrice
          })
        }
      } else if (transaction.type === 'withdraw') {
        // WITHDRAWAL: Subtract from balance
        if (!currentBalance) {
          alert('❌ Error: User has no balance for this asset')
          await supabase.from('transactions').update({ status: 'pending' }).eq('id', id)
          return
        }

        const existingAmount = Number(currentBalance.amount)
        const existingAvgPrice = Number(currentBalance.average_buy_price)

        // Check if user has enough balance
        if (existingAmount < cryptoAmount) {
          alert(`❌ Error: Insufficient balance
          
User has: ${existingAmount.toFixed(8)} ${transaction.asset}
Trying to withdraw: ${cryptoAmount.toFixed(8)} ${transaction.asset}`)
          await supabase.from('transactions').update({ status: 'pending' }).eq('id', id)
          return
        }

        newAmount = existingAmount - cryptoAmount
        newAvgPrice = existingAvgPrice // Keep same average price

        console.log('✅ WITHDRAWAL - Balance calculation:', {
          existing: { amount: existingAmount, price: existingAvgPrice },
          withdraw: { amount: cryptoAmount },
          result: { amount: newAmount, avgPrice: newAvgPrice }
        })
      } else {
        alert('❌ Error: Unknown transaction type')
        return
      }

      const { error: balanceError } = await supabase
        .from('user_balances')
        .upsert(
          {
            user_id: transaction.user_id,
            asset: transaction.asset,
            amount: newAmount,
            average_buy_price: newAvgPrice
          },
          {
            onConflict: 'user_id,asset',
            ignoreDuplicates: false
          }
        )

      if (balanceError) {
        console.error('Balance update error:', balanceError)
        await supabase
          .from('transactions')
          .update({ status: 'pending' })
          .eq('id', id)
        
        alert(`Error updating balance: ${balanceError.message}`)
        return
      }

      await supabase
        .from('notifications')
        .insert({
          user_id: transaction.user_id,
          type: transaction.type,
          title: `${transaction.type === 'deposit' ? 'Deposit' : 'Withdrawal'} Approved`,
          message: `Your ${transaction.type} of $${usdValue.toFixed(2)} (${cryptoAmount.toFixed(8)} ${transaction.asset}) has been approved and added to your account.`,
          read: false
        })

      alert(`✅ Transaction approved successfully!

USD Amount: $${usdValue.toFixed(2)}
${transaction.asset} Amount: ${cryptoAmount.toFixed(8)}
New Total Balance: ${newAmount.toFixed(8)} ${transaction.asset}
Average Buy Price: $${newAvgPrice.toFixed(2)}`)
      
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

  const handleViewAsUser = async (userId: string) => {
    setLoadingUserView(true)
    setViewAsUserModal(true)
    setViewingUserId(userId)
    
    try {
      // Fetch user profile
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      setViewingUserData(userProfile)
      
      // Fetch user balances
      const { data: balances } = await supabase
        .from('user_balances')
        .select('*')
        .eq('user_id', userId)
      
      setViewingUserBalances(balances || [])
      
      // Fetch user transactions
      const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)
      
      setViewingUserTransactions(transactions || [])
      
    } catch (error) {
      console.error('Error fetching user data:', error)
      alert('Failed to load user data')
    } finally {
      setLoadingUserView(false)
    }
  }

  const calculateUserTotalBalance = () => {
    if (!viewingUserBalances.length) return 0
    
    return viewingUserBalances.reduce((total, balance) => {
      const assetPrice = cryptoPrices[balance.asset]?.price || 1
      return total + (Number(balance.amount) * assetPrice)
    }, 0)
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

      const adjustmentValue = Number(adjustmentAmount)

      const { data: currentBalance } = await supabase
        .from('user_balances')
        .select('*')
        .eq('user_id', selectedUser)
        .eq('asset', adjustmentAsset)
        .single()

      const currentAmount = currentBalance?.amount || 0
      
      let cryptoAdjustmentAmount = adjustmentValue
      if (adjustmentAsset !== 'USD') {
        const priceData = cryptoPrices[adjustmentAsset]
        const currentPrice = priceData?.price || 1
        cryptoAdjustmentAmount = adjustmentValue / currentPrice
        
        console.log('Admin adjustment conversion:', {
          usdAmount: adjustmentValue,
          asset: adjustmentAsset,
          marketPrice: currentPrice,
          cryptoAmount: cryptoAdjustmentAmount
        })
      }

      const newAmount = adjustmentType === 'add' 
        ? currentAmount + cryptoAdjustmentAmount 
        : currentAmount - cryptoAdjustmentAmount

      if (newAmount < 0) {
        alert('Cannot reduce balance below zero')
        setProcessingAdjustment(false)
        return
      }

      const { error: balanceError } = await supabase
        .from('user_balances')
        .upsert(
          {
            user_id: selectedUser,
            asset: adjustmentAsset,
            amount: newAmount,
            average_buy_price: currentBalance?.average_buy_price || 1
          },
          {
            onConflict: 'user_id,asset',
            ignoreDuplicates: false
          }
        )

      if (balanceError) {
        console.error('Balance upsert error:', balanceError)
        throw balanceError
      }

      await supabase
        .from('transactions')
        .insert({
          user_id: selectedUser,
          type: adjustmentType === 'add' ? 'deposit' : 'withdraw',
          asset: adjustmentAsset,
          amount: cryptoAdjustmentAmount,
          value_usd: adjustmentValue,
          status: 'approved',
          admin_notes: `Admin adjustment: ${adjustmentReason}`
        })

      await supabase
        .from('notifications')
        .insert({
          user_id: selectedUser,
          type: 'info',
          title: 'Balance Adjustment',
          message: `Your ${adjustmentAsset} balance has been ${adjustmentType === 'add' ? 'increased' : 'decreased'} by $${adjustmentValue} (${cryptoAdjustmentAmount.toFixed(8)} ${adjustmentAsset}). ${adjustmentReason}`,
          read: false
        })

      alert(`✅ Balance adjusted successfully!

USD Amount: $${adjustmentValue}
Crypto Amount: ${cryptoAdjustmentAmount.toFixed(8)} ${adjustmentAsset}
New Balance: ${newAmount.toFixed(8)} ${adjustmentAsset}`)
      
      setBalanceManagerModal(false)
      setSelectedUser('')
      setAdjustmentAmount('')
      setAdjustmentReason('')
      fetchDashboardData()

    } catch (error: any) {
      console.error('Adjustment error:', error)
      alert(`Error: ${error.message || 'Failed to adjust balance'}`)
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
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleViewAsUser(user.id)}
                        className="px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 text-sm font-medium transition-all flex items-center space-x-1"
                      >
                        <Eye className="w-3 h-3" />
                        <span>View Account</span>
                      </button>
                      <button
                        onClick={() => {
                          setSelectedUser(user.id)
                          setBalanceManagerModal(true)
                        }}
                        className="px-3 py-1.5 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 text-sm font-medium transition-all"
                      >
                        Adjust Balance
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
      {/* ✅ DESKTOP SIDEBAR - FIXED WITH FLEXBOX */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-64 glass-effect border-r border-white/10 p-6 z-40 flex-col">
        <div className="flex items-center space-x-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="text-xl font-bold text-white block">Admin Panel</span>
            <span className="text-xs text-gray-400">CryptoVault</span>
          </div>
        </div>
        
        {/* Main Navigation - Takes Available Space */}
        <nav className="flex-1 space-y-2 overflow-y-auto">
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
        
        {/* Bottom Links - Always at Bottom */}
        <div className="mt-auto pt-4 border-t border-white/10 space-y-2">
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

      {balanceManagerModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-effect rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-2">Adjust User Balance</h3>
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 mb-4">
              <p className="text-sm text-blue-400">
                💡 <strong>How it works:</strong> Enter amount in USD. System automatically converts to crypto using live market rates.
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Select User *</label>
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
                <label className="block text-sm text-gray-400 mb-2">Adjustment Type *</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setAdjustmentType('add')}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      adjustmentType === 'add'
                        ? 'border-green-500 bg-green-500/20'
                        : 'border-white/10 bg-white/5 hover:border-white/20'
                    }`}
                  >
                    <TrendingUp className="w-6 h-6 text-green-400 mx-auto mb-2" />
                    <p className="text-white text-sm font-bold">Add Profit</p>
                    <p className="text-gray-400 text-xs mt-1">Increase balance</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAdjustmentType('subtract')}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      adjustmentType === 'subtract'
                        ? 'border-red-500 bg-red-500/20'
                        : 'border-white/10 bg-white/5 hover:border-white/20'
                    }`}
                  >
                    <TrendingDown className="w-6 h-6 text-red-400 mx-auto mb-2" />
                    <p className="text-white text-sm font-bold">Deduct Loss</p>
                    <p className="text-gray-400 text-xs mt-1">Decrease balance</p>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Asset *</label>
                <select
                  value={adjustmentAsset}
                  onChange={(e) => setAdjustmentAsset(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500"
                  required
                >
                  <option value="USD">USD (US Dollar)</option>
                  <option value="BTC">BTC (Bitcoin)</option>
                  <option value="ETH">ETH (Ethereum)</option>
                  <option value="USDT">USDT (Tether)</option>
                  <option value="SOL">SOL (Solana)</option>
                  <option value="ADA">ADA (Cardano)</option>
                  <option value="BNB">BNB (Binance Coin)</option>
                  <option value="XRP">XRP (Ripple)</option>
                  <option value="DOGE">DOGE (Dogecoin)</option>
                </select>
                
                {pricesLoading ? (
                  <div className="mt-2 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                    <div className="flex items-center justify-center space-x-2">
                      <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                      <span className="text-sm text-purple-400">Loading price data...</span>
                    </div>
                  </div>
                ) : adjustmentAsset !== 'USD' && cryptoPrices[adjustmentAsset] ? (
                  <div className="mt-2 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Current {adjustmentAsset} Price:</span>
                      <span className="text-white font-bold">
                        ${cryptoPrices[adjustmentAsset].price.toLocaleString(undefined, { 
                          minimumFractionDigits: 2, 
                          maximumFractionDigits: 2 
                        })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-400">24h Change:</span>
                      <span className={`text-xs font-medium ${
                        cryptoPrices[adjustmentAsset].change24h >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {cryptoPrices[adjustmentAsset].change24h >= 0 ? '+' : ''}
                        {cryptoPrices[adjustmentAsset].change24h.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                ) : null}
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Amount in USD *</label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    value={adjustmentAmount}
                    onChange={(e) => setAdjustmentAmount(e.target.value)}
                    placeholder="0.00"
                    min="0.01"
                    step="0.01"
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-lg font-bold focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>
                
                {adjustmentAmount && Number(adjustmentAmount) > 0 && !pricesLoading && (
                  <div className="mt-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                    <p className="text-sm text-blue-400 mb-2">💰 Conversion Preview:</p>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 text-sm">USD Amount:</span>
                        <span className="text-white font-bold">${Number(adjustmentAmount).toFixed(2)}</span>
                      </div>
                      {adjustmentAsset !== 'USD' && cryptoPrices[adjustmentAsset] && (
                        <>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400 text-sm">{adjustmentAsset} Amount:</span>
                            <span className="text-green-400 font-bold text-lg">
                              {(Number(adjustmentAmount) / cryptoPrices[adjustmentAsset].price).toFixed(8)} {adjustmentAsset}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400 text-sm">Rate:</span>
                            <span className="text-gray-300 text-sm">
                              1 {adjustmentAsset} = ${cryptoPrices[adjustmentAsset].price.toLocaleString()}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Reason for Adjustment *</label>
                <textarea
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500"
                  rows={3}
                  placeholder="e.g., Trading profit from EUR/USD, Investment returns, Bonus reward, etc."
                  required
                />
                <p className="text-xs text-gray-400 mt-1">
                  ℹ️ This reason will be visible to the user in their transaction history
                </p>
              </div>

              {adjustmentType === 'subtract' && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-red-400 text-sm font-medium">Warning: Deducting Balance</p>
                      <p className="text-gray-400 text-xs mt-1">
                        This will reduce the user's balance. Make sure this is intended.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t border-white/10">
              <button
                onClick={() => {
                  setBalanceManagerModal(false)
                  setSelectedUser('')
                  setAdjustmentAmount('')
                  setAdjustmentReason('')
                }}
                disabled={processingAdjustment}
                className="px-6 py-3 rounded-xl glass-effect hover:bg-white/10 text-white transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleBalanceAdjustment}
                disabled={processingAdjustment || !selectedUser || !adjustmentAmount || !adjustmentReason}
                className={`px-6 py-3 rounded-xl text-white font-medium hover:opacity-90 transition-all flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                  adjustmentType === 'add'
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                    : 'bg-gradient-to-r from-red-500 to-orange-500'
                }`}
              >
                {processingAdjustment ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    {adjustmentType === 'add' ? (
                      <>
                        <TrendingUp className="w-5 h-5" />
                        <span>Add Profit</span>
                      </>
                    ) : (
                      <>
                        <TrendingDown className="w-5 h-5" />
                        <span>Deduct Loss</span>
                      </>
                    )}
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ✅ VIEW AS USER MODAL */}
      {viewAsUserModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            className="glass-effect rounded-2xl p-6 max-w-5xl w-full my-8 max-h-[90vh] overflow-y-auto"
          >
            {loadingUserView ? (
              <div className="text-center py-12">
                <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
                <p className="text-gray-400">Loading user account...</p>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="flex items-start justify-between mb-6 pb-6 border-b border-white/10">
                  <div>
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <span className="text-white font-bold text-lg">
                          {viewingUserData?.full_name?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white">
                          {viewingUserData?.full_name || 'Unknown User'}
                        </h3>
                        <p className="text-gray-400">{viewingUserData?.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 text-sm">
                      <span className={`px-3 py-1 rounded-full ${
                        viewingUserData?.role === 'admin' 
                          ? 'bg-red-500/20 text-red-400' 
                          : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {viewingUserData?.role || 'user'}
                      </span>
                      <span className={`px-3 py-1 rounded-full ${
                        viewingUserData?.kyc_verified 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {viewingUserData?.kyc_verified ? 'KYC Verified' : 'KYC Pending'}
                      </span>
                      <span className={`px-3 py-1 rounded-full ${
                        viewingUserData?.is_active 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {viewingUserData?.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setViewAsUserModal(false)
                      setViewingUserId(null)
                      setViewingUserData(null)
                      setViewingUserBalances([])
                      setViewingUserTransactions([])
                    }}
                    className="p-2 rounded-xl hover:bg-white/10 transition-all"
                  >
                    <X className="w-6 h-6 text-white" />
                  </button>
                </div>

                {/* Total Balance Card */}
                <div className="mb-6 p-6 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Total Portfolio Value</p>
                      <h2 className="text-4xl font-bold text-white">
                        ${calculateUserTotalBalance().toLocaleString(undefined, { 
                          minimumFractionDigits: 2, 
                          maximumFractionDigits: 2 
                        })}
                      </h2>
                    </div>
                    <Wallet className="w-12 h-12 text-purple-400" />
                  </div>
                </div>

                {/* User's Portfolio */}
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                    <Wallet className="w-5 h-5 mr-2 text-purple-400" />
                    Portfolio ({viewingUserBalances.length} assets)
                  </h3>
                  
                  {viewingUserBalances.length === 0 ? (
                    <div className="text-center py-8 glass-effect rounded-xl">
                      <Wallet className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-400">No assets yet</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {viewingUserBalances.map((balance, index) => {
                        const assetPrice = cryptoPrices[balance.asset]?.price || 1
                        const usdValue = Number(balance.amount) * assetPrice
                        const change24h = cryptoPrices[balance.asset]?.change24h || 0
                        
                        return (
                          <div key={`${balance.asset}-${index}`} className="glass-effect rounded-xl p-4 border border-white/10">
                            <div className="flex items-center justify-between mb-3">
                              <span className="px-3 py-1 rounded-full text-xs bg-blue-500/20 text-blue-400 font-bold">
                                {balance.asset}
                              </span>
                              <span className={`text-xs font-medium ${
                                change24h >= 0 ? 'text-green-400' : 'text-red-400'
                              }`}>
                                {change24h >= 0 ? '+' : ''}{change24h.toFixed(2)}%
                              </span>
                            </div>
                            <div className="mb-2">
                              <p className="text-2xl font-bold text-white">
                                {Number(balance.amount).toFixed(8)}
                              </p>
                              <p className="text-sm text-gray-400">{balance.asset}</p>
                            </div>
                            <div className="pt-3 border-t border-white/10">
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-400">USD Value:</span>
                                <span className="text-white font-bold">
                                  ${usdValue.toLocaleString(undefined, { 
                                    minimumFractionDigits: 2, 
                                    maximumFractionDigits: 2 
                                  })}
                                </span>
                              </div>
                              <div className="flex justify-between items-center mt-1">
                                <span className="text-xs text-gray-400">Avg Buy Price:</span>
                                <span className="text-gray-300 text-xs">
                                  ${Number(balance.average_buy_price).toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Recent Transactions */}
                <div>
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-blue-400" />
                    Recent Transactions ({viewingUserTransactions.length})
                  </h3>
                  
                  {viewingUserTransactions.length === 0 ? (
                    <div className="text-center py-8 glass-effect rounded-xl">
                      <FileText className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-400">No transactions yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {viewingUserTransactions.map((tx) => (
                        <div 
                          key={tx.id} 
                          className="flex items-center justify-between p-4 rounded-xl glass-effect hover:bg-white/5 transition-all"
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              tx.type === 'deposit' ? 'bg-green-500/20' : 'bg-red-500/20'
                            }`}>
                              {tx.type === 'deposit' ? (
                                <ArrowDownRight className="w-5 h-5 text-green-400" />
                              ) : (
                                <ArrowUpRight className="w-5 h-5 text-red-400" />
                              )}
                            </div>
                            <div>
                              <p className="text-white font-medium capitalize">{tx.type}</p>
                              <p className="text-gray-400 text-sm">
                                {formatTimeAgo(tx.created_at)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-white font-bold">
                              {tx.type === 'deposit' ? '+' : '-'}${(tx.value_usd || tx.amount).toFixed(2)}
                            </p>
                            <p className="text-gray-400 text-sm">
                              {tx.amount} {tx.asset}
                            </p>
                            <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs ${
                              tx.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                              tx.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                              tx.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-blue-500/20 text-blue-400'
                            }`}>
                              {tx.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t border-white/10">
                  <button
                    onClick={() => {
                      setViewAsUserModal(false)
                      setSelectedUser(viewingUserId || '')
                      setBalanceManagerModal(true)
                    }}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium hover:opacity-90 transition-all flex items-center space-x-2"
                  >
                    <DollarSign className="w-5 h-5" />
                    <span>Adjust Balance</span>
                  </button>
                  <button
                    onClick={() => {
                      setViewAsUserModal(false)
                      setViewingUserId(null)
                      setViewingUserData(null)
                      setViewingUserBalances([])
                      setViewingUserTransactions([])
                    }}
                    className="px-6 py-3 rounded-xl glass-effect hover:bg-white/10 text-white transition-all"
                  >
                    Close
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </div>
  )
}
