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
import { supabase } from '@/lib/supabase/client'  // ← CHANGED: Import singleton
import { useState, useEffect, useRef } from 'react'  // ← CHANGED: Removed useMemo

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

// ← DELETED: const supabase = useMemo(() => createSupabaseClient(), [])
// Now using imported singleton instead

// ✅ FIXED: Wait for auth to load, then check user

// ✅ FIXED: Wait for auth to load, then check user
useEffect(() => {
  // CRITICAL: Don't do ANYTHING while loading
  if (authLoading) {
    console.log('Auth still loading, waiting...')
    return  // ← This is KEY! Exit early while loading
  }

  // Now auth is loaded, check if user exists
  if (!user) {
    console.log('No user found after auth loaded, redirecting to login')
    router.push('/login')
    return
  }

  // User exists, check if admin
  if (profile?.role === 'admin') {
    console.log('Admin user, redirecting to admin dashboard')
    router.push('/admin')
    return
  }

  // All good, user is authenticated and not admin
  console.log('User authenticated:', user.email, 'Role:', profile?.role)
}, [authLoading, user, profile?.role, router])

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

  useEffect(() => {
    if (profile && !profile.kyc_verified) {
      // Only redirect if KYC not submitted or rejected
      const shouldShowKYC = !profile.kyc_status || 
                           profile.kyc_status === 'not_submitted' || 
                           profile.kyc_status === 'rejected'
      
      if (shouldShowKYC) {
        setSelectedTab('kyc-verification')
      }
    }
  }, [profile])

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

  // ✅ FIXED: Show loading while checking auth
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

  // ✅ FIXED: Don't render anything if no user (will redirect via useEffect)
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    )
  }

  // ✅ FIXED: Don't render if admin (will redirect via useEffect)
  if (profile?.role === 'admin') {
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

        {/* Rest of your dashboard content stays the same... */}
        <div className="text-white">
          <p>Dashboard Content Here</p>
          <p>User: {user?.email}</p>
          <p>Role: {profile?.role}</p>
        </div>
      </main>
    </div>
  )
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
