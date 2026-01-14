'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { 
  Wallet, ArrowUpRight, ArrowDownRight, DollarSign,
  PieChart, Activity, Settings, LogOut, Bell, Search, Download, Upload,
  Eye, EyeOff, History, UserCircle, Menu, X, Check, Clock, AlertCircle, FileText,
  CheckCircle, Loader2, Copy, ExternalLink, CreditCard, Building, Globe,
  Mail, Phone, MapPin, User, Shield, HelpCircle
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { createSupabaseClient } from '@/lib/supabase/client'
import { useState, useEffect, useRef, useMemo } from 'react'


// Define types based on your Supabase schema
interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  kyc_verified: boolean;
  created_at: string;
  updated_at: string;
}

interface CryptoPrice {
  usd: number;
  usd_24h_change: number;
}

interface CryptoPrices {
  [key: string]: CryptoPrice;
}

interface DepositRequest {
  userId: string;
  amount: number;
  asset: string;
  paymentMethod: 'wire' | 'crypto';
  walletAddress?: string;
  txHash?: string;
  paymentProof?: File | string;
}

interface WithdrawalRequest {
  userId: string;
  amount: number;
  asset: string;
  walletAddress?: string;
  bankDetails?: {
    accountName: string;
    accountNumber: string;
    bankName: string;
    swiftCode: string;
    country: string;
  };
}

// Demo wallet addresses (replace with real ones)
const DEMO_WALLETS = {
  BTC: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
  ETH: '0x742d35Cc6634C0532925a3b844Bc9e70C6d4e5a1',
  USDT: 'TBA6C4H5G7J8K9L0M1N2P3Q4R5S6T7U8V9W0',
  USD: 'Bank Transfer Only'
}

// Demo wire transfer details (replace with your details)
const WIRE_TRANSFER_DETAILS = {
  bankName: 'JPMorgan Chase Bank',
  accountName: 'CRYPTOVAULT TRADING LTD',
  accountNumber: '9876543210',
  routingNumber: '021000021',
  swiftCode: 'CHASUS33',
  iban: 'US70000000000000000000',
  address: '383 Madison Avenue, New York, NY 10017, USA',
  reference: 'DEPOSIT-USERID'
}

export default function DashboardPage() {
  const [hideBalance, setHideBalance] = useState(false)
  const [selectedTab, setSelectedTab] = useState('overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [cryptoPrices, setCryptoPrices] = useState<CryptoPrices>({})
  const [loading, setLoading] = useState(true)
  const [depositLoading, setDepositLoading] = useState(false)
  const [withdrawLoading, setWithdrawLoading] = useState(false)
  const [depositSuccess, setDepositSuccess] = useState(false)
  const [withdrawSuccess, setWithdrawSuccess] = useState(false)
  const [depositError, setDepositError] = useState('')
  const [withdrawError, setWithdrawError] = useState('')
  const [userPortfolio, setUserPortfolio] = useState<any[]>([])
  const [transactions, setTransactions] = useState<any[]>([])
  const [notifications, setNotifications] = useState<any[]>([])
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null)
  const [paymentProofPreview, setPaymentProofPreview] = useState<string | null>(null)
  
  const { user, profile, loading: authLoading, signOut } = useAuth()
  const router = useRouter()

  const supabase = useMemo(() => createSupabaseClient(), [])


  // REDIRECT LOGIC - CHECK IF ADMIN
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        // Not logged in, redirect to login
        router.push('/login')
      } else if (profile?.role === 'admin') {
        // User is admin, redirect to admin dashboard
        router.push('/admin')
      }
    }
  }, [authLoading, user, profile, router])

   useEffect(() => {
    if (!user) return

    let isMounted = true
    
    const fetchUserData = async () => {
      try {
        // Fetch all in parallel (3x faster!)
        const [portfolioResult, transactionsResult, notificationsResult] = await Promise.all([
          supabase.from('user_portfolio').select('*').eq('user_id', user.id),
          supabase.from('transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
          supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10)
        ])

        if (!isMounted) return

        if (!portfolioResult.error && portfolioResult.data) {
          setUserPortfolio(portfolioResult.data)
        }

        if (!transactionsResult.error && transactionsResult.data) {
          setTransactions(transactionsResult.data)
        }

        if (!notificationsResult.error && notificationsResult.data) {
          setNotifications(notificationsResult.data)
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
  }, [user, supabase])


  // Fetch real crypto prices
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const response = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether&vs_currencies=usd&include_24hr_change=true&x_cg_demo_api_key=CG-YnK9oBCYZL6hmz6g7R8HtqBm'
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

  // Calculate total balance from portfolio
  const calculateTotalBalance = () => {
    if (!userPortfolio.length) return 0
    
    return userPortfolio.reduce((total, item) => {
      const assetPrice = cryptoPrices[item.asset.toLowerCase()]?.usd || 0
      return total + (Number(item.amount) * assetPrice)
    }, 0)
  }

  // Calculate total deposits
  const calculateTotalDeposits = () => {
    const depositTransactions = transactions.filter(tx => 
      tx.type === 'deposit' && tx.status === 'approved'
    )
    return depositTransactions.reduce((total, tx) => total + Number(tx.amount), 0)
  }

  // Calculate total withdrawals
  const calculateTotalWithdrawals = () => {
    const withdrawalTransactions = transactions.filter(tx => 
      tx.type === 'withdraw' && tx.status === 'approved'
    )
    return withdrawalTransactions.reduce((total, tx) => total + Number(tx.amount), 0)
  }

  // Handle file upload for payment proof
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      alert('Please upload an image or PDF file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB')
      return
    }

    setPaymentProofFile(file)

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPaymentProofPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setPaymentProofPreview(null)
    }
  }

  // Handle deposit submission with Supabase
  const handleDeposit = async (data: DepositRequest) => {
    setDepositLoading(true)
    setDepositError('')
    setDepositSuccess(false)
    
    try {
      // Upload payment proof to Supabase Storage if exists
      let paymentProofUrl = ''
      if (paymentProofFile) {
        const fileExt = paymentProofFile.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('payment-proofs')
          .upload(fileName, paymentProofFile)
        
        if (uploadError) throw uploadError
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('payment-proofs')
          .getPublicUrl(fileName)
        
        paymentProofUrl = publicUrl
      }

      // Insert deposit record to Supabase
      const { data: depositData, error: depositError } = await supabase
        .from('transactions')
        .insert([
          {
            user_id: data.userId,
            type: 'deposit',
            asset: data.asset,
            amount: data.amount,
            value_usd: data.amount,
            status: 'pending',
            payment_proof_url: paymentProofUrl,
            wallet_address: data.walletAddress,
            created_at: new Date().toISOString()
          }
        ])
        .select()
        .single()
      
      if (depositError) {
        throw new Error(depositError.message || 'Deposit failed')
      }
      
      // Create notification for deposit request
      await supabase
        .from('notifications')
        .insert([
          {
            user_id: data.userId,
            type: 'deposit',
            title: 'Deposit Request Submitted',
            message: `Your deposit request of $${data.amount} ${data.asset} has been submitted and is pending approval.`,
            created_at: new Date().toISOString()
          }
        ])
      
      setDepositSuccess(true)
      
      // Add to local transactions
      setTransactions(prev => [{
        id: depositData.id,
        user_id: data.userId,
        type: 'deposit',
        asset: data.asset,
        amount: data.amount,
        value_usd: data.amount,
        status: 'pending',
        payment_proof_url: paymentProofUrl,
        wallet_address: data.walletAddress,
        created_at: new Date().toISOString()
      }, ...prev])
      
      // Reset form after success
      setTimeout(() => {
        setDepositSuccess(false)
        setSelectedTab('overview')
        setPaymentProofFile(null)
        setPaymentProofPreview(null)
      }, 5000)
      
    } catch (error) {
      setDepositError(error instanceof Error ? error.message : 'Deposit failed')
    } finally {
      setDepositLoading(false)
    }
  }

  // Handle withdrawal submission with Supabase
  const handleWithdrawal = async (data: WithdrawalRequest) => {
    setWithdrawLoading(true)
    setWithdrawError('')
    setWithdrawSuccess(false)
    
    // Check if user has sufficient balance in portfolio
    const totalBalance = calculateTotalBalance()
    if (data.amount > totalBalance) {
      setWithdrawError('Insufficient balance')
      setWithdrawLoading(false)
      return
    }
    
    try {
      // Insert withdrawal record to Supabase
      const { data: withdrawalData, error: withdrawalError } = await supabase
        .from('transactions')
        .insert([
          {
            user_id: data.userId,
            type: 'withdraw',
            asset: data.asset,
            amount: data.amount,
            value_usd: data.amount,
            status: 'pending',
            wallet_address: data.walletAddress,
            created_at: new Date().toISOString()
          }
        ])
        .select()
        .single()
      
      if (withdrawalError) {
        throw new Error(withdrawalError.message || 'Withdrawal failed')
      }
      
      // Create notification for withdrawal request
      await supabase
        .from('notifications')
        .insert([
          {
            user_id: data.userId,
            type: 'withdraw',
            title: 'Withdrawal Request Submitted',
            message: `Your withdrawal request of $${data.amount} ${data.asset} has been submitted and is pending approval.`,
            created_at: new Date().toISOString()
          }
        ])
      
      setWithdrawSuccess(true)
      
      // Add to local transactions
      setTransactions(prev => [{
        id: withdrawalData.id,
        user_id: data.userId,
        type: 'withdraw',
        asset: data.asset,
        amount: data.amount,
        value_usd: data.amount,
        status: 'pending',
        wallet_address: data.walletAddress,
        created_at: new Date().toISOString()
      }, ...prev])
      
      // Reset form after success
      setTimeout(() => {
        setWithdrawSuccess(false)
        setSelectedTab('overview')
      }, 5000)
      
    } catch (error) {
      setWithdrawError(error instanceof Error ? error.message : 'Withdrawal failed')
    } finally {
      setWithdrawLoading(false)
    }
  }

  // Copy wallet address to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        alert('Copied to clipboard!')
      })
      .catch(err => {
        console.error('Failed to copy:', err)
      })
  }

  const NavItems = () => (
    <nav className="space-y-2">
      {[
        { id: 'overview', icon: PieChart, label: 'Overview' },
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
    </nav>
  )

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    )
  }

  if (!user || profile?.role === 'admin') {
    // Will redirect via useEffect
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    )
  }

  // Extract first name from full_name
  const getFirstName = () => {
    if (!profile?.full_name) return 'User'
    return profile.full_name.split(' ')[0]
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f]">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block fixed left-0 top-0 h-screen w-64 glass-effect border-r border-white/10 p-6 z-40">
        <div className="flex items-center space-x-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-white">CryptoVault</span>
        </div>
        <NavItems />
        <button 
          onClick={signOut}
          className="absolute bottom-6 left-6 right-6 flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)} className="lg:hidden fixed inset-0 bg-black/50 z-40" />
            <motion.aside initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }}
              className="lg:hidden fixed left-0 top-0 h-screen w-64 glass-effect border-r border-white/10 p-6 z-50">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <Wallet className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xl font-bold text-white">CryptoVault</span>
                </div>
                <button onClick={() => setSidebarOpen(false)}><X className="w-6 h-6 text-white" /></button>
              </div>
              <NavItems />
              <button 
                onClick={signOut}
                className="absolute bottom-6 left-6 right-6 flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="lg:ml-64 p-4 sm:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-xl glass-effect">
              <Menu className="w-6 h-6 text-white" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white">Dashboard</h1>
              <p className="text-gray-400">
                Welcome back, {getFirstName()}!
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button onClick={() => setHideBalance(!hideBalance)} 
              className="p-2.5 rounded-xl glass-effect hover:bg-white/10">
              {hideBalance ? <EyeOff className="w-5 h-5 text-white" /> : <Eye className="w-5 h-5 text-white" />}
            </button>
            <button onClick={() => setNotificationsOpen(!notificationsOpen)} 
              className="p-2.5 rounded-xl glass-effect hover:bg-white/10 relative">
              <Bell className="w-5 h-5 text-white" />
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              )}
            </button>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <span className="text-white font-bold">
                {profile?.full_name?.charAt(0) || 'U'}
              </span>
            </div>
          </div>
        </div>

        {/* Notifications Dropdown */}
        <AnimatePresence>
          {notificationsOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute right-8 top-20 w-80 glass-effect rounded-xl p-4 z-50 max-h-96 overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold">Notifications</h3>
                <span className="text-xs text-gray-400">
                  {notifications.filter(n => !n.read).length} unread
                </span>
              </div>
              {notifications.length === 0 ? (
                <p className="text-gray-400 text-center py-4">No notifications</p>
              ) : (
                <div className="space-y-3">
                  {notifications.slice(0, 5).map(notification => (
                    <div key={notification.id} className={`p-3 rounded-lg ${notification.read ? 'bg-white/5' : 'bg-blue-500/10'}`}>
                      <p className="text-white font-medium text-sm">{notification.title}</p>
                      <p className="text-gray-400 text-xs mt-1">{notification.message}</p>
                      <p className="text-gray-500 text-xs mt-2">
                        {new Date(notification.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content Tabs */}
        {selectedTab === 'overview' && <OverviewTab 
          profile={profile} 
          hideBalance={hideBalance} 
          totalBalance={calculateTotalBalance()}
          totalDeposits={calculateTotalDeposits()}
          totalWithdrawals={calculateTotalWithdrawals()}
          portfolio={userPortfolio}
          cryptoPrices={cryptoPrices}
        />}
        {selectedTab === 'deposit' && <DepositTab 
          onSubmit={handleDeposit} 
          loading={depositLoading} 
          success={depositSuccess} 
          error={depositError} 
          paymentProofFile={paymentProofFile} 
          paymentProofPreview={paymentProofPreview} 
          onFileUpload={handleFileUpload} 
          userId={user?.id || ''}
        />}
        {selectedTab === 'withdraw' && <WithdrawTab 
          onSubmit={handleWithdrawal} 
          loading={withdrawLoading} 
          success={withdrawSuccess} 
          error={withdrawError} 
          userBalance={calculateTotalBalance()}
          userId={user?.id || ''}
        />}
        {selectedTab === 'transactions' && <TransactionsTab transactions={transactions} />}
        {selectedTab === 'markets' && <MarketsTab prices={cryptoPrices} />}
        {selectedTab === 'settings' && <SettingsTab profile={profile} />}
      </main>
    </div>
  )

  function OverviewTab({ 
    profile, 
    hideBalance, 
    totalBalance,
    totalDeposits,
    totalWithdrawals,
    portfolio,
    cryptoPrices 
  }: { 
    profile: any;
    hideBalance: boolean;
    totalBalance: number;
    totalDeposits: number;
    totalWithdrawals: number;
    portfolio: any[];
    cryptoPrices: CryptoPrices;
  }) {
    return (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="p-6 rounded-2xl glass-effect hover:bg-white/5">
            <div className="flex justify-between mb-4">
              <span className="text-gray-400 text-sm">Total Balance</span>
              <Eye className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-3xl font-bold text-white mb-2">
              {hideBalance ? '••••••' : `$${totalBalance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}
            </p>
            <p className="text-gray-400 text-sm">
              {totalBalance === 0 ? 'Make a deposit to get started' : 'Available for trading & withdrawal'}
            </p>
          </div>
          
          <div className="p-6 rounded-2xl glass-effect hover:bg-white/5">
            <div className="flex justify-between mb-4">
              <span className="text-gray-400 text-sm">Total Deposits</span>
              <ArrowUpRight className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-3xl font-bold text-white mb-2">
              ${totalDeposits.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </p>
            <p className="text-gray-400 text-sm">All-time deposit amount</p>
          </div>
          
          <div className="p-6 rounded-2xl glass-effect hover:bg-white/5">
            <div className="flex justify-between mb-4">
              <span className="text-gray-400 text-sm">Total Withdrawals</span>
              <ArrowDownRight className="w-5 h-5 text-red-400" />
            </div>
            <p className="text-3xl font-bold text-white mb-2">
              ${totalWithdrawals.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </p>
            <p className="text-gray-400 text-sm">All-time withdrawal amount</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 gap-4 mb-8">
          <button onClick={() => setSelectedTab('deposit')}
            className="p-4 rounded-xl glass-effect hover:bg-white/10 group">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mb-3 mx-auto group-hover:scale-110 transition-transform">
              <Upload className="w-6 h-6 text-white" />
            </div>
            <span className="text-white font-medium">Deposit</span>
          </button>
          
          <button onClick={() => setSelectedTab('withdraw')}
            className="p-4 rounded-xl glass-effect hover:bg-white/10 group">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center mb-3 mx-auto group-hover:scale-110 transition-transform">
              <Download className="w-6 h-6 text-white" />
            </div>
            <span className="text-white font-medium">Withdraw</span>
          </button>
        </div>

        {/* Portfolio Section */}
        {portfolio.length > 0 && (
          <div className="glass-effect rounded-2xl p-6 mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">Your Portfolio</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 text-gray-400">Asset</th>
                    <th className="text-left py-3 text-gray-400">Amount</th>
                    <th className="text-left py-3 text-gray-400">Current Price</th>
                    <th className="text-left py-3 text-gray-400">Value (USD)</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolio.map(item => {
                    const assetPrice = cryptoPrices[item.asset.toLowerCase()]?.usd || 0
                    const value = Number(item.amount) * assetPrice
                    
                    return (
                      <tr key={item.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="py-4">
                          <span className="text-white font-medium">{item.asset}</span>
                        </td>
                        <td className="py-4 text-white">{Number(item.amount).toFixed(4)}</td>
                        <td className="py-4 text-white">
                          ${assetPrice.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                        </td>
                        <td className="py-4 text-white">
                          ${value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="glass-effect rounded-2xl p-6">
          <h2 className="text-2xl font-bold text-white mb-6">Getting Started</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-4 rounded-xl bg-white/5">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center mb-3">
                <span className="text-blue-400 font-bold">1</span>
              </div>
              <h3 className="text-white font-semibold mb-2">Make a Deposit</h3>
              <p className="text-gray-400 text-sm">Deposit funds via wire transfer or crypto to start trading</p>
            </div>
            
            <div className="p-4 rounded-xl bg-white/5">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center mb-3">
                <span className="text-purple-400 font-bold">2</span>
              </div>
              <h3 className="text-white font-semibold mb-2">Wait for Approval</h3>
              <p className="text-gray-400 text-sm">Admin will approve your deposit within 24-48 hours</p>
            </div>
            
            <div className="p-4 rounded-xl bg-white/5">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center mb-3">
                <span className="text-green-400 font-bold">3</span>
              </div>
              <h3 className="text-white font-semibold mb-2">Start Trading</h3>
              <p className="text-gray-400 text-sm">Once approved, funds will be available in your account</p>
            </div>
          </div>
        </div>
      </>
    )
  }

  function DepositTab({ 
    onSubmit, 
    loading, 
    success, 
    error, 
    paymentProofFile, 
    paymentProofPreview, 
    onFileUpload,
    userId
  }: { 
    onSubmit: (data: DepositRequest) => void; 
    loading: boolean;
    success: boolean;
    error: string;
    paymentProofFile: File | null;
    paymentProofPreview: string | null;
    onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    userId: string;
  }) {
    const [amount, setAmount] = useState('')
    const [asset, setAsset] = useState('USD')
    const [paymentMethod, setPaymentMethod] = useState<'wire' | 'crypto'>('wire')
    const [txHash, setTxHash] = useState('')
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault()
      
      if (paymentMethod === 'crypto' && !txHash) {
        alert('Please enter transaction hash for crypto deposits')
        return
      }
      
      if (paymentMethod === 'wire' && !paymentProofFile) {
        alert('Please upload payment proof for wire transfers')
        return
      }
      
      onSubmit({
        userId,
        amount: parseFloat(amount),
        asset,
        paymentMethod,
        walletAddress: paymentMethod === 'crypto' ? DEMO_WALLETS[asset as keyof typeof DEMO_WALLETS] : undefined,
        txHash: paymentMethod === 'crypto' ? txHash : undefined,
        paymentProof: paymentProofFile || undefined
      })
    }

    const removePaymentProof = () => {
      setPaymentProofFile(null)
      setPaymentProofPreview(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }

    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Deposit Funds</h1>
        
        {success && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl"
          >
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <div>
                <p className="text-green-400 font-medium">Deposit request submitted!</p>
                <p className="text-green-400/80 text-sm">Waiting for admin approval. You'll be notified once approved.</p>
              </div>
            </div>
          </motion.div>
        )}

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl"
          >
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <p className="text-red-400 font-medium">{error}</p>
            </div>
          </motion.div>
        )}

        <div className="glass-effect rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-6">Select Deposit Method</h2>
          
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <button
              onClick={() => setPaymentMethod('wire')}
              className={`p-6 rounded-xl border-2 transition-all ${paymentMethod === 'wire' ? 'border-green-500 bg-green-500/10' : 'border-white/10 bg-white/5 hover:border-green-500/50'}`}
            >
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-3">
                <Building className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-white font-bold mb-2">Wire Transfer</h3>
              <p className="text-gray-400 text-sm">Bank transfer (USD)</p>
              {paymentMethod === 'wire' && (
                <div className="mt-3">
                  <p className="text-green-400 text-sm">✓ Selected</p>
                </div>
              )}
            </button>
            
            <button
              onClick={() => setPaymentMethod('crypto')}
              className={`p-6 rounded-xl border-2 transition-all ${paymentMethod === 'crypto' ? 'border-green-500 bg-green-500/10' : 'border-white/10 bg-white/5 hover:border-green-500/50'}`}
            >
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500 to-yellow-500 flex items-center justify-center mb-3">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-white font-bold mb-2">Cryptocurrency</h3>
              <p className="text-gray-400 text-sm">BTC, ETH, USDT</p>
              {paymentMethod === 'crypto' && (
                <div className="mt-3">
                  <p className="text-green-400 text-sm">✓ Selected</p>
                </div>
              )}
            </button>
          </div>
        </div>

        {paymentMethod === 'crypto' && (
          <div className="glass-effect rounded-2xl p-6 mb-8">
            <h2 className="text-xl font-bold text-white mb-4">Deposit Wallet Address</h2>
            <div className="space-y-3">
              {Object.entries(DEMO_WALLETS).map(([assetType, address]) => (
                <div key={assetType} className="p-4 rounded-xl bg-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium">{assetType}</span>
                    <button
                      onClick={() => copyToClipboard(address)}
                      className="px-3 py-1 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 text-sm flex items-center space-x-1"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </button>
                  </div>
                  <p className="text-gray-400 text-sm font-mono break-all">{address}</p>
                </div>
              ))}
            </div>
            <p className="text-gray-400 text-sm mt-4">
              Send only {asset} to this address. Sending other assets may result in loss of funds.
            </p>
          </div>
        )}

        {paymentMethod === 'wire' && (
          <div className="glass-effect rounded-2xl p-6 mb-8">
            <h2 className="text-xl font-bold text-white mb-4">Wire Transfer Details</h2>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Bank Name</p>
                  <p className="text-white font-medium">{WIRE_TRANSFER_DETAILS.bankName}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Account Name</p>
                  <p className="text-white font-medium">{WIRE_TRANSFER_DETAILS.accountName}</p>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Account Number</p>
                  <p className="text-white font-medium">{WIRE_TRANSFER_DETAILS.accountNumber}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Routing Number</p>
                  <p className="text-white font-medium">{WIRE_TRANSFER_DETAILS.routingNumber}</p>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-sm mb-1">SWIFT Code</p>
                  <p className="text-white font-medium">{WIRE_TRANSFER_DETAILS.swiftCode}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">IBAN</p>
                  <p className="text-white font-medium">{WIRE_TRANSFER_DETAILS.iban}</p>
                </div>
              </div>
              
              <div>
                <p className="text-gray-400 text-sm mb-1">Bank Address</p>
                <p className="text-white">{WIRE_TRANSFER_DETAILS.address}</p>
              </div>
              
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-yellow-400 font-medium mb-1">Important</p>
                    <p className="text-yellow-400/80 text-sm">
                      Use <span className="font-bold">"{WIRE_TRANSFER_DETAILS.reference}"</span> as payment reference
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="glass-effect rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-6">Deposit Details</h2>
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {paymentMethod === 'crypto' && (
                <FormField 
                  label="Select Cryptocurrency" 
                  type="select" 
                  value={asset}
                  onChange={(e) => setAsset(e.target.value)}
                  options={['BTC', 'ETH', 'USDT']} 
                  required
                />
              )}
              
              <FormField 
                label="Amount" 
                type="number" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                min="50"
                step="0.01"
                required
              />
              
              {paymentMethod === 'crypto' && (
                <FormField 
                  label="Transaction Hash" 
                  type="text" 
                  value={txHash}
                  onChange={(e) => setTxHash(e.target.value)}
                  placeholder="Enter blockchain transaction hash"
                  required
                />
              )}
              
              {paymentMethod === 'wire' && (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Payment Proof (Transaction ID/Receipt)*
                  </label>
                  <div className="border-2 border-dashed border-white/10 rounded-xl p-6 hover:border-purple-500/50 transition-colors">
                    {paymentProofFile ? (
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <FileText className="w-8 h-8 text-blue-400" />
                            <div>
                              <p className="text-white font-medium">{paymentProofFile.name}</p>
                              <p className="text-gray-400 text-sm">
                                {(paymentProofFile.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={removePaymentProof}
                            className="p-2 rounded-lg hover:bg-white/10"
                          >
                            <X className="w-4 h-4 text-gray-400" />
                          </button>
                        </div>
                        
                        {paymentProofPreview && (
                          <div className="mt-4">
                            <img 
                              src={paymentProofPreview} 
                              alt="Payment proof preview" 
                              className="max-w-full h-auto max-h-48 rounded-lg mx-auto"
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center">
                        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-400 mb-2">Click to upload payment proof</p>
                        <p className="text-gray-500 text-sm mb-4">PNG, JPG, PDF up to 5MB</p>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-4 py-2 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30"
                        >
                          Choose File
                        </button>
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={onFileUpload}
                      accept="image/*,.pdf"
                      className="hidden"
                    />
                  </div>
                  <p className="text-gray-500 text-sm mt-2">
                    Upload screenshot or PDF of bank transfer receipt
                  </p>
                </div>
              )}
              
              <button 
                type="submit"
                disabled={loading || !amount || (paymentMethod === 'wire' && !paymentProofFile)}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>Submit Deposit Request</span>
                )}
              </button>
            </div>
          </form>
          
          <div className="mt-8 p-6 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5" />
              <div>
                <h4 className="text-yellow-400 font-semibold mb-1">Important Instructions</h4>
                <ul className="text-gray-300 text-sm space-y-1">
                  <li>• All deposits require admin approval</li>
                  <li>• Processing time: 24-48 hours</li>
                  <li>• Minimum deposit: $50</li>
                  {paymentMethod === 'crypto' && (
                    <>
                      <li>• Send only the selected cryptocurrency</li>
                      <li>• Include transaction hash for verification</li>
                    </>
                  )}
                  {paymentMethod === 'wire' && (
                    <>
                      <li>• Include bank transfer receipt/screenshot</li>
                      <li>• Use reference: {WIRE_TRANSFER_DETAILS.reference}</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  function WithdrawTab({ 
    onSubmit, 
    loading, 
    success, 
    error, 
    userBalance,
    userId
  }: { 
    onSubmit: (data: WithdrawalRequest) => void; 
    loading: boolean;
    success: boolean;
    error: string;
    userBalance: number;
    userId: string;
  }) {
    const [amount, setAmount] = useState('')
    const [asset, setAsset] = useState('USD')
    const [walletAddress, setWalletAddress] = useState('')
    const [bankDetails, setBankDetails] = useState({
      accountName: '',
      accountNumber: '',
      bankName: '',
      swiftCode: '',
      country: ''
    })

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault()
      
      if (parseFloat(amount) > userBalance) {
        alert('Amount exceeds available balance')
        return
      }
      
      const data: WithdrawalRequest = {
        userId,
        amount: parseFloat(amount),
        asset,
      }
      
      if (asset === 'USD') {
        // Validate bank details
        if (!bankDetails.accountName || !bankDetails.accountNumber || !bankDetails.bankName) {
          alert('Please fill in all required bank details')
          return
        }
        data.bankDetails = bankDetails
      } else {
        // Validate wallet address
        if (!walletAddress) {
          alert('Please enter wallet address')
          return
        }
        data.walletAddress = walletAddress
      }
      
      onSubmit(data)
    }

    return (
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Withdraw Funds</h1>
        
        <div className="glass-effect rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Available Balance</p>
              <p className="text-3xl font-bold text-white">${userBalance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Wallet className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        
        {success && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl"
          >
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <div>
                <p className="text-green-400 font-medium">Withdrawal request submitted!</p>
                <p className="text-green-400/80 text-sm">Waiting for admin approval. You'll be notified once approved.</p>
              </div>
            </div>
          </motion.div>
        )}

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl"
          >
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <p className="text-red-400 font-medium">{error}</p>
            </div>
          </motion.div>
        )}

        <div className="glass-effect rounded-2xl p-6">
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <FormField 
                label="Select Asset" 
                type="select" 
                value={asset}
                onChange={(e) => {
                  setAsset(e.target.value)
                  setWalletAddress('')
                  setBankDetails({
                    accountName: '',
                    accountNumber: '',
                    bankName: '',
                    swiftCode: '',
                    country: ''
                  })
                }}
                options={['USD', 'BTC', 'ETH', 'USDT']} 
                required
              />
              
              <FormField 
                label="Amount" 
                type="number" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                min="50"
                max={userBalance.toString()}
                step="0.01"
                required
              />
              
              {asset === 'USD' ? (
                <div className="space-y-4">
                  <h3 className="text-white font-semibold">Bank Details</h3>
                  
                  <FormField 
                    label="Account Holder Name*" 
                    type="text" 
                    value={bankDetails.accountName}
                    onChange={(e) => setBankDetails({...bankDetails, accountName: e.target.value})}
                    placeholder="Enter account holder name"
                    required
                  />
                  
                  <FormField 
                    label="Account Number*" 
                    type="text" 
                    value={bankDetails.accountNumber}
                    onChange={(e) => setBankDetails({...bankDetails, accountNumber: e.target.value})}
                    placeholder="Enter account number"
                    required
                  />
                  
                  <FormField 
                    label="Bank Name*" 
                    type="text" 
                    value={bankDetails.bankName}
                    onChange={(e) => setBankDetails({...bankDetails, bankName: e.target.value})}
                    placeholder="Enter bank name"
                    required
                  />
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField 
                      label="SWIFT/BIC Code" 
                      type="text" 
                      value={bankDetails.swiftCode}
                      onChange={(e) => setBankDetails({...bankDetails, swiftCode: e.target.value})}
                      placeholder="Enter SWIFT code"
                    />
                    
                    <FormField 
                      label="Country" 
                      type="text" 
                      value={bankDetails.country}
                      onChange={(e) => setBankDetails({...bankDetails, country: e.target.value})}
                      placeholder="Enter country"
                    />
                  </div>
                </div>
              ) : (
                <FormField 
                  label={`${asset} Wallet Address*`} 
                  type="text" 
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  placeholder={`Enter your ${asset} wallet address`}
                  required
                />
              )}
              
              <button 
                type="submit"
                disabled={loading || !amount || (asset === 'USD' ? (!bankDetails.accountName || !bankDetails.accountNumber || !bankDetails.bankName) : !walletAddress)}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-red-500 to-pink-500 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>Request Withdrawal</span>
                )}
              </button>
            </div>
          </form>
          
          <div className="mt-8 p-6 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5" />
              <div>
                <h4 className="text-yellow-400 font-semibold mb-1">Important Information</h4>
                <ul className="text-gray-300 text-sm space-y-1">
                  <li>• All withdrawals require admin approval</li>
                  <li>• Processing time: 24-48 hours</li>
                  <li>• Minimum withdrawal: $50</li>
                  <li>• Network fees may apply for crypto withdrawals</li>
                  <li>• Ensure wallet/bank details are correct</li>
                  <li>• Double-check all information before submitting</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  function TransactionsTab({ transactions }: { transactions: any[] }) {
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'approved': return 'bg-green-500/20 text-green-400'
        case 'pending': return 'bg-yellow-500/20 text-yellow-400'
        case 'rejected': return 'bg-red-500/20 text-red-400'
        default: return 'bg-gray-500/20 text-gray-400'
      }
    }

    return (
      <div>
        <h1 className="text-3xl font-bold text-white mb-8">Transaction History</h1>
        
        {transactions.length === 0 ? (
          <div className="glass-effect rounded-2xl p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
              <History className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No Transactions Yet</h3>
            <p className="text-gray-400 mb-6">Make your first deposit to see transactions here</p>
            <button onClick={() => setSelectedTab('deposit')} 
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium">
              Make a Deposit
            </button>
          </div>
        ) : (
          <div className="glass-effect rounded-2xl p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 text-gray-400">Type</th>
                    <th className="text-left py-3 text-gray-400">Asset</th>
                    <th className="text-left py-3 text-gray-400">Amount</th>
                    <th className="text-left py-3 text-gray-400">Value (USD)</th>
                    <th className="text-left py-3 text-gray-400">Status</th>
                    <th className="text-left py-3 text-gray-400">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-4">
                        <span className={`px-3 py-1 rounded-full text-xs ${tx.type === 'deposit' ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400'}`}>
                          {tx.type}
                        </span>
                      </td>
                      <td className="py-4 text-white">{tx.asset}</td>
                      <td className={`py-4 ${tx.type === 'deposit' ? 'text-green-400' : 'text-red-400'}`}>
                        {tx.type === 'deposit' ? '+' : '-'}{Number(tx.amount).toFixed(2)} {tx.asset}
                      </td>
                      <td className="py-4 text-white">
                        ${Number(tx.value_usd).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </td>
                      <td className="py-4">
                        <span className={`px-3 py-1 rounded-full text-xs ${getStatusColor(tx.status)}`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-4 text-gray-400">
                        {new Date(tx.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    )
  }

  function MarketsTab({ prices }: { prices: CryptoPrices }) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-white mb-8">Crypto Markets</h1>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(prices).map(([coin, data]) => (
            <div key={coin} className="glass-effect rounded-2xl p-6 hover:bg-white/5">
              <h3 className="text-xl font-bold text-white capitalize mb-2">
                {coin === 'tether' ? 'USDT' : coin}
              </h3>
              <p className="text-3xl font-bold text-white mb-2">
                ${data.usd?.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </p>
              <p className={`text-sm ${data.usd_24h_change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {data.usd_24h_change?.toFixed(2)}% 24h
              </p>
            </div>
          ))}
        </div>
      </div>
    )
  }

  function SettingsTab({ profile }: { profile: any }) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Settings</h1>
        
        <div className="glass-effect rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center">
            <User className="w-5 h-5 mr-2" />
            Profile Information
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-400 mb-2">Full Name</label>
              <input
                type="text"
                value={profile?.full_name || ''}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white"
                readOnly
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-400 mb-2">Email Address</label>
              <input
                type="email"
                value={profile?.email || ''}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white"
                readOnly
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Role</label>
              <input
                type="text"
                value={profile?.role || ''}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white"
                readOnly
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">KYC Status</label>
              <div className={`px-4 py-3 rounded-xl ${profile?.kyc_verified ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                {profile?.kyc_verified ? 'Verified ✓' : 'Pending Verification'}
              </div>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-400 mb-2">Member Since</label>
              <input
                type="text"
                value={profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : ''}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white"
                readOnly
              />
            </div>
          </div>
        </div>
        
        <div className="glass-effect rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center">
            <Shield className="w-5 h-5 mr-2" />
            Security
          </h2>
          
          <div className="space-y-4">
            <button className="w-full p-4 rounded-xl bg-white/5 hover:bg-white/10 text-left transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Two-Factor Authentication</p>
                  <p className="text-gray-400 text-sm">Add an extra layer of security</p>
                </div>
                <span className="text-gray-400">Disabled</span>
              </div>
            </button>
            
            <button className="w-full p-4 rounded-xl bg-white/5 hover:bg-white/10 text-left transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Change Password</p>
                  <p className="text-gray-400 text-sm">Update your password regularly</p>
                </div>
                <ArrowUpRight className="w-5 h-5 text-gray-400" />
              </div>
            </button>
            
            <button className="w-full p-4 rounded-xl bg-white/5 hover:bg-white/10 text-left transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Login History</p>
                  <p className="text-gray-400 text-sm">View recent login activity</p>
                </div>
                <ArrowUpRight className="w-5 h-5 text-gray-400" />
              </div>
            </button>
          </div>
        </div>
        
        <div className="glass-effect rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center">
            <HelpCircle className="w-5 h-5 mr-2" />
            Support
          </h2>
          
          <div className="space-y-4">
            <button className="w-full p-4 rounded-xl bg-white/5 hover:bg-white/10 text-left transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Contact Support</p>
                  <p className="text-gray-400 text-sm">Get help from our support team</p>
                </div>
                <ArrowUpRight className="w-5 h-5 text-gray-400" />
              </div>
            </button>
            
            <button className="w-full p-4 rounded-xl bg-white/5 hover:bg-white/10 text-left transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">FAQ</p>
                  <p className="text-gray-400 text-sm">Frequently asked questions</p>
                </div>
                <ArrowUpRight className="w-5 h-5 text-gray-400" />
              </div>
            </button>
            
            <button className="w-full p-4 rounded-xl bg-white/5 hover:bg-white/10 text-left transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Documentation</p>
                  <p className="text-gray-400 text-sm">User guides and tutorials</p>
                </div>
                <ArrowUpRight className="w-5 h-5 text-gray-400" />
              </div>
            </button>
          </div>
        </div>
      </div>
    )
  }
}

function FormField({ 
  label, 
  type, 
  value,
  onChange,
  placeholder, 
  options,
  required = false,
  min,
  max,
  step
}: { 
  label: string; 
  type: string; 
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  placeholder?: string; 
  options?: string[];
  required?: boolean;
  min?: string;
  max?: string;
  step?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-400 mb-2">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {type === 'select' && options ? (
        <select 
          value={value}
          onChange={onChange}
          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500"
          required={required}
        >
          <option value="">Select an option</option>
          {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      ) : (
        <input 
          type={type} 
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          min={min}
          max={max}
          step={step}
          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500"
          required={required}
        />
      )}
    </div>
  )
}
