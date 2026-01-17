'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { 
  Wallet, ArrowUpRight, ArrowDownRight, DollarSign,
  PieChart, Activity, Settings, LogOut, Bell, Search, Download, Upload,
  Eye, EyeOff, History, Menu, X, Clock, 
  CheckCircle, Loader2, TrendingUp, TrendingDown, ArrowDownUp, AlertCircle
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { supabase } from '@/lib/supabase/client'
import { useState, useEffect } from 'react'
import PortfolioOverview from '@/components/PortfolioOverview'
import SwapComponent from '@/components/SwapComponent'
import Deposit from '@/components/Deposit'

// Types
interface CryptoPrice {
  usd: number
  usd_24h_change: number
}

interface CryptoPrices {
  [key: string]: CryptoPrice
}

interface UserBalance {
  asset: string
  amount: number
  average_buy_price: number
}

export default function DashboardPage() {
  // UI State
  const [hideBalance, setHideBalance] = useState(false)
  const [selectedTab, setSelectedTab] = useState('overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  
  // Data State
  const [cryptoPrices, setCryptoPrices] = useState<CryptoPrices>({})
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState<any[]>([])
  const [notifications, setNotifications] = useState<any[]>([])
  const [userBalances, setUserBalances] = useState<UserBalance[]>([])
  
  // Withdrawal State
  const [withdrawLoading, setWithdrawLoading] = useState(false)
  const [withdrawSuccess, setWithdrawSuccess] = useState(false)
  const [withdrawError, setWithdrawError] = useState('')
  const [withdrawUsdAmount, setWithdrawUsdAmount] = useState('')
  const [withdrawCryptoAmount, setWithdrawCryptoAmount] = useState('0.00000000')
  const [withdrawAsset, setWithdrawAsset] = useState('USD')
  const [withdrawAddress, setWithdrawAddress] = useState('')
  
  // Bank Account State (for USD withdrawals)
  const [bankName, setBankName] = useState('')
  const [accountHolderName, setAccountHolderName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [routingNumber, setRoutingNumber] = useState('')
  const [swiftCode, setSwiftCode] = useState('')
  
  // Search and Filter
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [filterType, setFilterType] = useState<'all' | 'deposit' | 'withdraw' | 'trade'>('all')
  
  const { user, profile, loading: authLoading, signOut } = useAuth()
  const router = useRouter()

  // ✅ Auth Check
  useEffect(() => {
    if (authLoading) return

    if (!user) {
      router.push('/login')
      return
    }

    if (profile?.role === 'admin') {
      router.push('/admin')
      return
    }
  }, [authLoading, user, profile?.role, router])

  // ✅ Fetch User Data
  useEffect(() => {
    if (!user) return

    let isMounted = true
    
    const fetchUserData = async () => {
      try {
        const [transactionsResult, notificationsResult, balancesResult] = await Promise.all([
          supabase.from('transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
          supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
          supabase.from('user_balances').select('*').eq('user_id', user.id)
        ])

        if (!isMounted) return

        if (!transactionsResult.error && transactionsResult.data) {
          setTransactions(transactionsResult.data)
        }

        if (!notificationsResult.error && notificationsResult.data) {
          setNotifications(notificationsResult.data)
        }

        if (!balancesResult.error && balancesResult.data) {
          setUserBalances(balancesResult.data)
        }

      } catch (error) {
        console.error('Error fetching user data:', error)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchUserData()

    return () => {
      isMounted = false
    }
  }, [user])

  // ✅ Fetch Crypto Prices
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const response = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether,solana,cardano,binancecoin,ripple,dogecoin&vs_currencies=usd&include_24hr_change=true'
        )
        const data = await response.json()
        setCryptoPrices(data)
      } catch (error) {
        console.error('Error fetching crypto prices:', error)
      }
    }
    
    fetchPrices()
    const interval = setInterval(fetchPrices, 30000)
    return () => clearInterval(interval)
  }, [])

  // ✅ Calculate withdraw crypto amount when USD changes
  useEffect(() => {
    if (!withdrawUsdAmount || withdrawAsset === 'USD') {
      setWithdrawCryptoAmount(withdrawUsdAmount || '0.00')
      return
    }

    const usd = parseFloat(withdrawUsdAmount) || 0
    const price = getAssetPrice(withdrawAsset)
    
    if (price > 0) {
      const crypto = usd / price
      setWithdrawCryptoAmount(crypto.toFixed(8))
    }
  }, [withdrawUsdAmount, withdrawAsset, cryptoPrices])

  // ✅ Get asset price with proper mapping
  const getAssetPrice = (asset: string): number => {
    if (asset === 'USD') return 1
    
    const assetMap: { [key: string]: string } = {
      'BTC': 'bitcoin',
      'ETH': 'ethereum',
      'USDT': 'tether',
      'SOL': 'solana',
      'ADA': 'cardano',
      'BNB': 'binancecoin',
      'XRP': 'ripple',
      'DOGE': 'dogecoin'
    }
    
    const coinGeckoId = assetMap[asset] || asset.toLowerCase()
    return cryptoPrices[coinGeckoId]?.usd || 0
  }

  // ✅ Calculate Total Balance from user_balances
  const calculateTotalBalance = () => {
    if (!userBalances.length) return 0
    
    const total = userBalances.reduce((sum, balance) => {
      const assetPrice = getAssetPrice(balance.asset)
      const value = Number(balance.amount) * assetPrice
      return sum + value
    }, 0)
    
    return total
  }

  // ✅ Calculate available balance for specific asset
  const getAvailableBalance = (asset: string): number => {
    const balance = userBalances.find(b => b.asset === asset)
    return balance ? Number(balance.amount) : 0
  }

  // ✅ Calculate Total Deposits
  const calculateTotalDeposits = () => {
    const depositTransactions = transactions.filter(tx => 
      tx.type === 'deposit' && tx.status === 'approved'
    )
    return depositTransactions.reduce((total, tx) => total + Number(tx.value_usd || tx.amount), 0)
  }

  // ✅ Calculate Total Withdrawals
  const calculateTotalWithdrawals = () => {
    const withdrawalTransactions = transactions.filter(tx => 
      tx.type === 'withdraw' && tx.status === 'approved'
    )
    return withdrawalTransactions.reduce((total, tx) => total + Number(tx.value_usd || tx.amount), 0)
  }

  // ✅ Handle Withdrawal
  const handleWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault()
    setWithdrawLoading(true)
    setWithdrawError('')
    setWithdrawSuccess(false)
    
    try {
      if (!user) throw new Error('User not authenticated')
      
      const usdAmount = parseFloat(withdrawUsdAmount)
      const cryptoAmount = parseFloat(withdrawCryptoAmount)
      
      if (!usdAmount || usdAmount <= 0) throw new Error('Invalid USD amount')
      if (!cryptoAmount || cryptoAmount <= 0) throw new Error('Invalid crypto amount')

      // Check if user has enough balance for this asset
      const availableBalance = getAvailableBalance(withdrawAsset)
      
      if (withdrawAsset === 'USD') {
        if (usdAmount > availableBalance) {
          throw new Error(`Insufficient USD balance. Available: $${availableBalance.toFixed(2)}`)
        }
      } else {
        if (cryptoAmount > availableBalance) {
          throw new Error(`Insufficient ${withdrawAsset} balance. Available: ${availableBalance.toFixed(8)} ${withdrawAsset}`)
        }
      }

      // ✅ Prepare wallet/bank details
      let walletOrBankDetails = ''
      
      if (withdrawAsset === 'USD') {
        // Store bank details for USD withdrawals
        if (!bankName || !accountHolderName || !accountNumber || !routingNumber) {
          throw new Error('Please fill in all required bank account details')
        }
        
        walletOrBankDetails = JSON.stringify({
          type: 'bank',
          bankName,
          accountHolderName,
          accountNumber,
          routingNumber,
          swiftCode: swiftCode || null
        })
      } else {
        // Store wallet address for crypto withdrawals
        if (!withdrawAddress) {
          throw new Error('Please enter your wallet address')
        }
        walletOrBankDetails = withdrawAddress
      }

      // ✅ INSERT WITHDRAWAL WITH CORRECT AMOUNTS
      const { error: insertError } = await supabase
        .from('transactions')
        .insert([
          {
            user_id: user.id,
            type: 'withdraw',
            asset: withdrawAsset,
            amount: cryptoAmount,  // Crypto amount
            value_usd: usdAmount,  // USD value
            status: 'pending',
            wallet_address: walletOrBankDetails
          }
        ])
      
      if (insertError) throw insertError
      
      await supabase.from('notifications').insert([
        {
          user_id: user.id,
          type: 'withdraw',
          title: 'Withdrawal Request Submitted',
          message: `Your withdrawal request of $${usdAmount.toFixed(2)} (${cryptoAmount.toFixed(8)} ${withdrawAsset}) has been submitted and is pending approval.`,
          read: false
        }
      ])
      
      setWithdrawSuccess(true)
      setWithdrawUsdAmount('')
      setWithdrawCryptoAmount('0.00000000')
      setWithdrawAsset('USD')
      setWithdrawAddress('')
      setBankName('')
      setAccountHolderName('')
      setAccountNumber('')
      setRoutingNumber('')
      setSwiftCode('')
      
      const { data } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      if (data) setTransactions(data)
      
      setTimeout(() => {
        setWithdrawSuccess(false)
        setSelectedTab('overview')
      }, 3000)
      
    } catch (error: any) {
      setWithdrawError(error.message || 'Withdrawal failed')
    } finally {
      setWithdrawLoading(false)
    }
  }

  // ✅ Filter Transactions
  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = searchQuery === '' || 
      tx.asset?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.type?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = filterStatus === 'all' || tx.status === filterStatus
    const matchesType = filterType === 'all' || tx.type === filterType
    
    return matchesSearch && matchesStatus && matchesType
  })

  // ✅ Format Currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }

  // ✅ Format Date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // ✅ Get Status Badge
  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-500/20 text-yellow-400',
      approved: 'bg-green-500/20 text-green-400',
      rejected: 'bg-red-500/20 text-red-400'
    }
    
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  // ✅ Get 24h Price Change
  const get24hChange = (asset: string): number => {
    if (asset === 'USD') return 0
    
    const changeMap: { [key: string]: number } = {
      'BTC': cryptoPrices.bitcoin?.usd_24h_change || 0,
      'ETH': cryptoPrices.ethereum?.usd_24h_change || 0,
      'USDT': cryptoPrices.tether?.usd_24h_change || 0,
      'SOL': cryptoPrices.solana?.usd_24h_change || 0,
      'ADA': cryptoPrices.cardano?.usd_24h_change || 0,
      'BNB': cryptoPrices.binancecoin?.usd_24h_change || 0,
      'XRP': cryptoPrices.ripple?.usd_24h_change || 0,
      'DOGE': cryptoPrices.dogecoin?.usd_24h_change || 0
    }
    
    return changeMap[asset] || 0
  }

  // ✅ Navigation Items
  const NavItems = () => (
    <nav className="flex flex-col h-full">
      <div className="flex-1 space-y-2">
        {[
          { id: 'overview', icon: PieChart, label: 'Overview' },
          { id: 'portfolio', icon: TrendingUp, label: 'Portfolio' },
          { id: 'swap', icon: ArrowDownUp, label: 'Swap', highlight: true },
          { id: 'deposit', icon: Upload, label: 'Deposit', highlight: true },
          { id: 'withdraw', icon: Download, label: 'Withdraw' },
          { id: 'transactions', icon: History, label: 'Transactions' },
          { id: 'markets', icon: Activity, label: 'Markets' },
          { id: 'settings', icon: Settings, label: 'Settings' }
        ].map(item => (
          <button
            key={item.id}
            onClick={() => { setSelectedTab(item.id); setSidebarOpen(false) }}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
              selectedTab === item.id ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' : 
              item.highlight ? 'text-green-400 hover:bg-green-500/10' :
              'text-gray-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </div>
      
      {/* Fixed Logout Button at Bottom */}
      <div className="mt-auto pt-4 border-t border-white/10">
        <button 
          onClick={signOut}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </nav>
  )

  // ✅ Get First Name
  const getFirstName = () => {
    if (!profile?.full_name) return 'User'
    return profile.full_name.split(' ')[0]
  }

  // ✅ Loading State
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  // ✅ Redirect if not authenticated or is admin
  if (!user || profile?.role === 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f]">
      {/* ✅ Desktop Sidebar - FIXED HEIGHT */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-64 glass-effect border-r border-white/10 p-6 z-40 flex-col">
        <div className="flex items-center space-x-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-white">CryptoVault</span>
        </div>
        <NavItems />
      </aside>

      {/* ✅ Mobile Sidebar - FIXED HEIGHT */}
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
              className="lg:hidden fixed left-0 top-0 h-screen w-64 glass-effect border-r border-white/10 p-6 z-50 flex flex-col"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <Wallet className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xl font-bold text-white">CryptoVault</span>
                </div>
                <button onClick={() => setSidebarOpen(false)}>
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>
              <NavItems />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ✅ Notifications Sidebar */}
      <AnimatePresence>
        {notificationsOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setNotificationsOpen(false)} 
              className="fixed inset-0 bg-black/50 z-40" 
            />
            <motion.aside 
              initial={{ x: 300 }} 
              animate={{ x: 0 }} 
              exit={{ x: 300 }}
              className="fixed right-0 top-0 h-screen w-80 glass-effect border-l border-white/10 p-6 z-50 overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Notifications</h2>
                <button onClick={() => setNotificationsOpen(false)}>
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>
              
              <div className="space-y-3">
                {notifications.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">No notifications</p>
                ) : (
                  notifications.map(notification => (
                    <div 
                      key={notification.id}
                      className={`p-4 rounded-xl cursor-pointer transition-all ${
                        notification.read ? 'bg-white/5' : 'bg-purple-500/10 border border-purple-500/20'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-medium text-white text-sm">{notification.title}</h3>
                        {!notification.read && (
                          <span className="w-2 h-2 bg-purple-500 rounded-full mt-1"></span>
                        )}
                      </div>
                      <p className="text-gray-400 text-xs mb-2">{notification.message}</p>
                      <span className="text-gray-500 text-xs">{formatDate(notification.created_at)}</span>
                    </div>
                  ))
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ✅ Main Content */}
      <main className="lg:ml-64 p-4 sm:p-8">
        {/* ✅ Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSidebarOpen(true)} 
              className="lg:hidden p-2 rounded-xl glass-effect hover:bg-white/10 transition-all"
            >
              <Menu className="w-6 h-6 text-white" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white">Dashboard</h1>
              <p className="text-gray-400">Welcome back, {getFirstName()}!</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setHideBalance(!hideBalance)} 
              className="p-2.5 rounded-xl glass-effect hover:bg-white/10 transition-all"
            >
              {hideBalance ? <EyeOff className="w-5 h-5 text-white" /> : <Eye className="w-5 h-5 text-white" />}
            </button>
            
            <button 
              onClick={() => setNotificationsOpen(!notificationsOpen)} 
              className="p-2.5 rounded-xl glass-effect hover:bg-white/10 relative transition-all"
            >
              <Bell className="w-5 h-5 text-white" />
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
                  {notifications.filter(n => !n.read).length}
                </span>
              )}
            </button>
            
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">
                {profile?.full_name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
          </div>
        </div>

        {/* ✅ Content Area */}
        <AnimatePresence mode="wait">
          {selectedTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="glass-effect rounded-2xl p-6 border border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-gray-400 text-sm">Total Balance</span>
                    <Wallet className="w-5 h-5 text-purple-400" />
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-2">
                    {hideBalance ? '••••••' : formatCurrency(calculateTotalBalance())}
                  </h3>
                  <p className="text-green-400 text-sm">+0.00%</p>
                </div>

                <div className="glass-effect rounded-2xl p-6 border border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-gray-400 text-sm">Total Deposits</span>
                    <ArrowDownRight className="w-5 h-5 text-green-400" />
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-2">
                    {hideBalance ? '••••••' : formatCurrency(calculateTotalDeposits())}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {transactions.filter(tx => tx.type === 'deposit').length} transactions
                  </p>
                </div>

                <div className="glass-effect rounded-2xl p-6 border border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-gray-400 text-sm">Total Withdrawals</span>
                    <ArrowUpRight className="w-5 h-5 text-red-400" />
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-2">
                    {hideBalance ? '••••••' : formatCurrency(calculateTotalWithdrawals())}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {transactions.filter(tx => tx.type === 'withdraw').length} transactions
                  </p>
                </div>

                <div className="glass-effect rounded-2xl p-6 border border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-gray-400 text-sm">Pending</span>
                    <Clock className="w-5 h-5 text-yellow-400" />
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-2">
                    {transactions.filter(tx => tx.status === 'pending').length}
                  </h3>
                  <p className="text-gray-400 text-sm">Awaiting approval</p>
                </div>
              </div>

              {/* Portfolio and Recent Transactions */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Portfolio */}
                <div className="glass-effect rounded-2xl p-6 border border-white/10">
                  <h2 className="text-xl font-bold text-white mb-6">Portfolio</h2>
                  
                  {userBalances.length === 0 ? (
                    <div className="text-center py-12">
                      <PieChart className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-400">No assets yet</p>
                      <button 
                        onClick={() => setSelectedTab('deposit')}
                        className="mt-4 px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white font-medium hover:opacity-90 transition-all"
                      >
                        Make a Deposit
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {userBalances.map(balance => {
                        const price = getAssetPrice(balance.asset)
                        const value = Number(balance.amount) * price
                        const change = get24hChange(balance.asset)
                        
                        return (
                          <div key={balance.asset} className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                <span className="text-white font-bold text-sm">{balance.asset}</span>
                              </div>
                              <div>
                                <p className="font-medium text-white">{balance.asset}</p>
                                <p className="text-gray-400 text-sm">{Number(balance.amount).toFixed(8)}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-white">
                                {hideBalance ? '••••••' : formatCurrency(value)}
                              </p>
                              {balance.asset !== 'USD' && (
                                <p className={`text-sm ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                  {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                                </p>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Recent Transactions */}
                <div className="glass-effect rounded-2xl p-6 border border-white/10">
                  <h2 className="text-xl font-bold text-white mb-6">Recent Transactions</h2>
                  
                  {transactions.length === 0 ? (
                    <div className="text-center py-12">
                      <History className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-400">No transactions yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {transactions.slice(0, 5).map(tx => (
                        <div key={tx.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all">
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
                              <p className="font-medium text-white capitalize">{tx.type}</p>
                              <p className="text-gray-400 text-sm">{formatDate(tx.created_at)}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-white">
                              {tx.type === 'deposit' ? '+' : '-'}{formatCurrency(Number(tx.value_usd || tx.amount))}
                            </p>
                            {getStatusBadge(tx.status)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="glass-effect rounded-2xl p-6 border border-white/10">
                <h2 className="text-xl font-bold text-white mb-6">Quick Actions</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <button 
                    onClick={() => setSelectedTab('deposit')}
                    className="p-6 rounded-xl bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30 hover:border-green-500/50 transition-all group"
                  >
                    <Upload className="w-8 h-8 text-green-400 mb-3 mx-auto group-hover:scale-110 transition-transform" />
                    <p className="text-white font-medium">Deposit</p>
                  </button>

                  <button 
                    onClick={() => setSelectedTab('withdraw')}
                    className="p-6 rounded-xl bg-gradient-to-br from-red-500/20 to-red-600/20 border border-red-500/30 hover:border-red-500/50 transition-all group"
                  >
                    <Download className="w-8 h-8 text-red-400 mb-3 mx-auto group-hover:scale-110 transition-transform" />
                    <p className="text-white font-medium">Withdraw</p>
                  </button>

                  <button 
                    onClick={() => setSelectedTab('transactions')}
                    className="p-6 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 hover:border-purple-500/50 transition-all group"
                  >
                    <History className="w-8 h-8 text-purple-400 mb-3 mx-auto group-hover:scale-110 transition-transform" />
                    <p className="text-white font-medium">History</p>
                  </button>

                  <button 
                    onClick={() => setSelectedTab('settings')}
                    className="p-6 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 hover:border-blue-500/50 transition-all group"
                  >
                    <Settings className="w-8 h-8 text-blue-400 mb-3 mx-auto group-hover:scale-110 transition-transform" />
                    <p className="text-white font-medium">Settings</p>
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {selectedTab === 'portfolio' && (
            <motion.div
              key="portfolio"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <PortfolioOverview />
            </motion.div>
          )}

          {selectedTab === 'swap' && (
            <motion.div
              key="swap"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="max-w-lg mx-auto">
                <SwapComponent />
              </div>
            </motion.div>
          )}

          {selectedTab === 'deposit' && (
            <motion.div
              key="deposit"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Deposit />
            </motion.div>
          )}

          {selectedTab === 'withdraw' && (
            <motion.div
              key="withdraw"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto"
            >
              <div className="glass-effect rounded-2xl p-8 border border-white/10">
                <h2 className="text-2xl font-bold text-white mb-6">Make a Withdrawal</h2>
                
                {withdrawSuccess && (
                  <div className="mb-6 p-4 rounded-xl bg-green-500/20 border border-green-500/30 flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <p className="text-green-400 font-medium">Withdrawal request submitted successfully!</p>
                  </div>
                )}

                {withdrawError && (
                  <div className="mb-6 p-4 rounded-xl bg-red-500/20 border border-red-500/30">
                    <p className="text-red-400">{withdrawError}</p>
                  </div>
                )}

                {/* Available Balances */}
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-white mb-4">Available Balances</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {userBalances.length === 0 ? (
                      <p className="text-gray-400 col-span-full text-center py-4">No balances available</p>
                    ) : (
                      userBalances.map((balance) => {
                        const assetPrice = getAssetPrice(balance.asset)
                        return (
                          <div key={balance.asset} className="p-4 rounded-xl bg-white/5 border border-white/10">
                            <p className="text-gray-400 text-sm mb-1">{balance.asset}</p>
                            <p className="text-white font-bold">{balance.amount.toFixed(8)}</p>
                            <p className="text-gray-400 text-xs">
                              ${(balance.amount * assetPrice).toFixed(2)}
                            </p>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>

                {/* Total Available Balance */}
                <div className="mb-6 p-6 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
                  <p className="text-gray-400 text-sm mb-1">Total Available Balance</p>
                  <p className="text-3xl font-bold text-white">
                    {hideBalance ? '••••••' : formatCurrency(calculateTotalBalance())}
                  </p>
                </div>

                <form onSubmit={handleWithdrawal} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Asset</label>
                    <select
                      value={withdrawAsset}
                      onChange={(e) => setWithdrawAsset(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500"
                      required
                    >
                      <option value="USD">USD</option>
                      <option value="BTC">BTC</option>
                      <option value="ETH">ETH</option>
                      <option value="USDT">USDT</option>
                      <option value="SOL">SOL</option>
                      <option value="ADA">ADA</option>
                      <option value="BNB">BNB</option>
                      <option value="XRP">XRP</option>
                      <option value="DOGE">DOGE</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Amount (USD)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="number"
                        value={withdrawUsdAmount}
                        onChange={(e) => setWithdrawUsdAmount(e.target.value)}
                        placeholder="0.00"
                        min="10"
                        step="0.01"
                        className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500"
                        required
                      />
                    </div>
                  </div>

                  {/* Show Crypto Amount */}
                  {withdrawAsset !== 'USD' && parseFloat(withdrawUsdAmount) > 0 && (
                    <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                      <div className="flex items-start space-x-3">
                        <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-blue-400 font-medium text-sm mb-2">Withdrawal Summary:</p>
                          <div className="space-y-1.5 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-400">USD Amount:</span>
                              <span className="text-white font-bold">${parseFloat(withdrawUsdAmount).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">{withdrawAsset} Amount:</span>
                              <span className="text-white font-bold">{withdrawCryptoAmount} {withdrawAsset}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Current Price:</span>
                              <span className="text-white">${getAssetPrice(withdrawAsset).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {withdrawAsset === 'USD' ? (
                    // 🏦 Bank Account Details for USD Withdrawals
                    <div className="space-y-4">
                      <h3 className="text-lg font-bold text-white mb-4">Bank Account Details</h3>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Bank Name *</label>
                        <input
                          type="text"
                          value={bankName}
                          onChange={(e) => setBankName(e.target.value)}
                          placeholder="Enter your bank name"
                          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Account Holder Name *</label>
                        <input
                          type="text"
                          value={accountHolderName}
                          onChange={(e) => setAccountHolderName(e.target.value)}
                          placeholder="Name as shown on bank account"
                          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Account Number *</label>
                        <input
                          type="text"
                          value={accountNumber}
                          onChange={(e) => setAccountNumber(e.target.value)}
                          placeholder="Your bank account number"
                          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500 font-mono"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Routing Number *</label>
                        <input
                          type="text"
                          value={routingNumber}
                          onChange={(e) => setRoutingNumber(e.target.value)}
                          placeholder="9-digit routing number"
                          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500 font-mono"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">SWIFT/BIC Code (Optional)</label>
                        <input
                          type="text"
                          value={swiftCode}
                          onChange={(e) => setSwiftCode(e.target.value)}
                          placeholder="For international transfers"
                          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500 font-mono"
                        />
                      </div>

                      <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                        <div className="flex items-start space-x-3">
                          <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                          <div className="text-sm text-blue-400">
                            <p className="font-medium mb-1">Bank Transfer Information:</p>
                            <ul className="space-y-1 text-blue-400/80">
                              <li>• Processing time: 2-5 business days</li>
                              <li>• Ensure account details are accurate</li>
                              <li>• SWIFT code required for international transfers</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // 💰 Wallet Address for Crypto Withdrawals
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        {withdrawAsset} Wallet Address *
                      </label>
                      <input
                        type="text"
                        value={withdrawAddress}
                        onChange={(e) => setWithdrawAddress(e.target.value)}
                        placeholder={`Enter your ${withdrawAsset} wallet address`}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500 font-mono text-sm"
                        required
                      />
                      <p className="text-gray-400 text-sm mt-2">
                        ⚠️ Double-check your wallet address. Transactions cannot be reversed.
                      </p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={withdrawLoading}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 text-white font-medium hover:shadow-lg disabled:opacity-50 flex items-center justify-center space-x-2 transition-all"
                  >
                    {withdrawLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-5 h-5" />
                        <span>Submit Withdrawal</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {selectedTab === 'transactions' && (
            <motion.div key="transactions" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="glass-effect rounded-2xl p-8 border border-white/10">
                <h2 className="text-2xl font-bold text-white mb-6">Transaction History</h2>
                
                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search..."
                      className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as any)}
                    className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="all">All Types</option>
                    <option value="deposit">Deposits</option>
                    <option value="withdraw">Withdrawals</option>
                  </select>

                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                {/* Transactions List */}
                {filteredTransactions.length === 0 ? (
                  <div className="text-center py-12">
                    <History className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No transactions found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredTransactions.map(tx => (
                      <div key={tx.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all">
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
                            <p className="font-medium text-white capitalize">{tx.type} - {tx.asset}</p>
                            <p className="text-gray-400 text-sm">{formatDate(tx.created_at)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-white">
                            {tx.type === 'deposit' ? '+' : '-'}{formatCurrency(Number(tx.value_usd || tx.amount))}
                          </p>
                          {getStatusBadge(tx.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {selectedTab === 'markets' && (
            <motion.div key="markets" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="glass-effect rounded-2xl p-8 border border-white/10">
                <h2 className="text-2xl font-bold text-white mb-6">Live Markets</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Bitcoin */}
                  <div className="glass-effect rounded-xl p-6 border border-white/10">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-white">Bitcoin (BTC)</h3>
                      <div className={`text-sm ${
                        (cryptoPrices.bitcoin?.usd_24h_change || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {(cryptoPrices.bitcoin?.usd_24h_change || 0) >= 0 ? '+' : ''}
                        {(cryptoPrices.bitcoin?.usd_24h_change || 0).toFixed(2)}%
                      </div>
                    </div>
                    <p className="text-3xl font-bold text-white">
                      ${cryptoPrices.bitcoin?.usd?.toLocaleString() || '—'}
                    </p>
                  </div>

                  {/* Ethereum */}
                  <div className="glass-effect rounded-xl p-6 border border-white/10">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-white">Ethereum (ETH)</h3>
                      <div className={`text-sm ${
                        (cryptoPrices.ethereum?.usd_24h_change || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {(cryptoPrices.ethereum?.usd_24h_change || 0) >= 0 ? '+' : ''}
                        {(cryptoPrices.ethereum?.usd_24h_change || 0).toFixed(2)}%
                      </div>
                    </div>
                    <p className="text-3xl font-bold text-white">
                      ${cryptoPrices.ethereum?.usd?.toLocaleString() || '—'}
                    </p>
                  </div>

                  {/* Tether */}
                  <div className="glass-effect rounded-xl p-6 border border-white/10">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-white">Tether (USDT)</h3>
                      <div className="text-gray-400 text-sm">
                        {(cryptoPrices.tether?.usd_24h_change || 0).toFixed(2)}%
                      </div>
                    </div>
                    <p className="text-3xl font-bold text-white">
                      ${cryptoPrices.tether?.usd?.toFixed(4) || '—'}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {selectedTab === 'settings' && (
            <motion.div key="settings" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="glass-effect rounded-2xl p-8 border border-white/10 max-w-2xl mx-auto">
                <h2 className="text-2xl font-bold text-white mb-6">Settings</h2>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-white mb-4">Profile Information</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Name</label>
                        <input 
                          type="text" 
                          value={profile?.full_name || ''}
                          readOnly
                          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Email</label>
                        <input 
                          type="email" 
                          value={user?.email || ''}
                          readOnly
                          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-6 border-t border-white/10">
                    <p className="text-gray-400 text-sm">
                      Need to update your information? Contact support.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
