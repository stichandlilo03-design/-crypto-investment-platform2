'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { 
  Wallet, ArrowUpRight, ArrowDownRight, DollarSign,
  PieChart, Activity, Settings, LogOut, Bell, Search, Download, Upload,
  Eye, EyeOff, History, UserCircle, Menu, X, Check, Clock, AlertCircle, FileText,
  CheckCircle, Loader2, Copy, ExternalLink
} from 'lucide-react'
import { useState, useEffect } from 'react'

// Define types
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
  paymentProof?: string;
}

interface WithdrawalRequest {
  userId: string;
  amount: number;
  asset: string;
  walletAddress: string;
}

interface UserData {
  id: string;
  email: string;
  balance: number;
  totalDeposits: number;
  totalWithdrawals: number;
}

// Demo wallet addresses (replace with real ones)
const DEMO_WALLETS = {
  BTC: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
  ETH: '0x742d35Cc6634C0532925a3b844Bc9e70C6d4e5a1',
  USDT: 'TBA6C4H5G7J8K9L0M1N2P3Q4R5S6T7U8V9W0',
  USD: 'Bank Transfer Only'
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
  const [userData, setUserData] = useState<UserData | null>(null)
  const [transactions, setTransactions] = useState<any[]>([])

  // Mock user ID - in real app, get from auth
  const userId = 'user-123'

  // Fetch user data (real implementation)
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // In real app, fetch from your API
        // const response = await fetch(`/api/user/${userId}`)
        // const data = await response.json()
        
        // Mock data - replace with real API call
        setUserData({
          id: userId,
          email: 'user@example.com',
          balance: 0, // Start with 0 balance
          totalDeposits: 0,
          totalWithdrawals: 0
        })
      } catch (error) {
        console.error('Error fetching user data:', error)
      }
    }

    fetchUserData()
  }, [userId])

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
        console.error('Error:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchPrices()
    const interval = setInterval(fetchPrices, 30000)
    return () => clearInterval(interval)
  }, [])

  // Handle deposit submission
  const handleDeposit = async (data: DepositRequest) => {
    setDepositLoading(true)
    setDepositError('')
    setDepositSuccess(false)
    
    try {
      const response = await fetch('/api/deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          // Add payment proof if wire transfer
          paymentProof: data.paymentMethod === 'wire' ? data.paymentProof : undefined,
          // Add transaction hash if crypto
          txHash: data.paymentMethod === 'crypto' ? data.txHash : undefined
        })
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Deposit failed')
      }
      
      setDepositSuccess(true)
      
      // Update user balance locally (in real app, this would come from server)
      if (userData) {
        setUserData({
          ...userData,
          totalDeposits: userData.totalDeposits + data.amount
        })
      }
      
      // Add to transactions
      setTransactions(prev => [{
        id: `deposit-${Date.now()}`,
        type: 'deposit',
        asset: data.asset,
        amount: `+${data.amount}`,
        value: `$${data.amount}`,
        status: 'Pending',
        date: new Date().toISOString().split('T')[0],
        method: data.paymentMethod === 'wire' ? 'Wire Transfer' : 'Crypto'
      }, ...prev])
      
      // Reset form after success
      setTimeout(() => {
        setDepositSuccess(false)
        setSelectedTab('overview')
      }, 5000)
      
    } catch (error) {
      setDepositError(error instanceof Error ? error.message : 'Deposit failed')
    } finally {
      setDepositLoading(false)
    }
  }

  // Handle withdrawal submission
  const handleWithdrawal = async (data: WithdrawalRequest) => {
    setWithdrawLoading(true)
    setWithdrawError('')
    setWithdrawSuccess(false)
    
    // Check if user has sufficient balance
    if (userData && userData.balance < data.amount) {
      setWithdrawError('Insufficient balance')
      setWithdrawLoading(false)
      return
    }
    
    try {
      const response = await fetch('/api/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Withdrawal failed')
      }
      
      setWithdrawSuccess(true)
      
      // Update user balance locally (in real app, this would come from server)
      if (userData) {
        setUserData({
          ...userData,
          balance: userData.balance - data.amount,
          totalWithdrawals: userData.totalWithdrawals + data.amount
        })
      }
      
      // Add to transactions
      setTransactions(prev => [{
        id: `withdraw-${Date.now()}`,
        type: 'withdrawal',
        asset: data.asset,
        amount: `-${data.amount}`,
        value: `-$${data.amount}`,
        status: 'Pending',
        date: new Date().toISOString().split('T')[0]
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
        alert('Wallet address copied to clipboard!')
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
        <button className="absolute bottom-6 left-6 right-6 flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-white/5">
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
              <p className="text-gray-400">Welcome back, {userData?.email || 'User'}!</p>
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
            </button>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <span className="text-white font-bold">U</span>
            </div>
          </div>
        </div>

        {/* Content Tabs */}
        {selectedTab === 'overview' && <OverviewTab userData={userData} hideBalance={hideBalance} />}
        {selectedTab === 'deposit' && <DepositTab onSubmit={handleDeposit} loading={depositLoading} success={depositSuccess} error={depositError} />}
        {selectedTab === 'withdraw' && <WithdrawTab onSubmit={handleWithdrawal} loading={withdrawLoading} success={withdrawSuccess} error={withdrawError} userBalance={userData?.balance || 0} />}
        {selectedTab === 'transactions' && <TransactionsTab transactions={transactions} />}
        {selectedTab === 'markets' && <MarketsTab prices={cryptoPrices} />}
      </main>
    </div>
  )

  function OverviewTab({ userData, hideBalance }: { userData: UserData | null, hideBalance: boolean }) {
    return (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="p-6 rounded-2xl glass-effect hover:bg-white/5">
            <div className="flex justify-between mb-4">
              <span className="text-gray-400 text-sm">Total Balance</span>
              <Eye className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-3xl font-bold text-white mb-2">
              {hideBalance ? '••••••' : `$${userData?.balance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) || '0.00'}`}
            </p>
            <p className="text-gray-400 text-sm">
              {userData && userData.balance === 0 ? 'Make a deposit to get started' : 'Available for trading & withdrawal'}
            </p>
          </div>
          
          <div className="p-6 rounded-2xl glass-effect hover:bg-white/5">
            <div className="flex justify-between mb-4">
              <span className="text-gray-400 text-sm">Total Deposits</span>
              <ArrowUpRight className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-3xl font-bold text-white mb-2">
              ${userData?.totalDeposits.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) || '0.00'}
            </p>
            <p className="text-gray-400 text-sm">All-time deposit amount</p>
          </div>
          
          <div className="p-6 rounded-2xl glass-effect hover:bg-white/5">
            <div className="flex justify-between mb-4">
              <span className="text-gray-400 text-sm">Total Withdrawals</span>
              <ArrowDownRight className="w-5 h-5 text-red-400" />
            </div>
            <p className="text-3xl font-bold text-white mb-2">
              ${userData?.totalWithdrawals.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) || '0.00'}
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

  function DepositTab({ onSubmit, loading, success, error }: { 
    onSubmit: (data: DepositRequest) => void; 
    loading: boolean;
    success: boolean;
    error: string;
  }) {
    const [amount, setAmount] = useState('')
    const [asset, setAsset] = useState('USD')
    const [paymentMethod, setPaymentMethod] = useState<'wire' | 'crypto'>('wire')
    const [txHash, setTxHash] = useState('')
    const [paymentProof, setPaymentProof] = useState('')

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault()
      
      if (paymentMethod === 'crypto' && !txHash) {
        alert('Please enter transaction hash for crypto deposits')
        return
      }
      
      if (paymentMethod === 'wire' && !paymentProof) {
        alert('Please provide payment proof for wire transfers')
        return
      }
      
      onSubmit({
        userId,
        amount: parseFloat(amount),
        asset,
        paymentMethod,
        walletAddress: DEMO_WALLETS[asset as keyof typeof DEMO_WALLETS],
        txHash: paymentMethod === 'crypto' ? txHash : undefined,
        paymentProof: paymentMethod === 'wire' ? paymentProof : undefined
      })
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
                <span className="text-white text-xl">$</span>
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
                <span className="text-white text-xl">₿</span>
              </div>
              <h3 className="text-white font-bold mb-2">Crypto</h3>
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
              Send only {paymentMethod === 'crypto' ? asset : 'USD'} to this address. Sending other assets may result in loss of funds.
            </p>
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
                min="0"
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
                <FormField 
                  label="Payment Proof (Transaction ID/Receipt)" 
                  type="text" 
                  value={paymentProof}
                  onChange={(e) => setPaymentProof(e.target.value)}
                  placeholder="Enter transaction ID or upload receipt"
                  required
                />
              )}
              
              <button 
                type="submit"
                disabled={loading || !amount}
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
                      <li>• Use reference: DEPOSIT-{userId}</li>
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

  function WithdrawTab({ onSubmit, loading, success, error, userBalance }: { 
  onSubmit: (data: WithdrawalRequest) => void; 
  loading: boolean;
  success: boolean;
  error: string;
  userBalance: number;
}) {
  const [amount, setAmount] = useState('')
  const [asset, setAsset] = useState('USD')
  const [walletAddress, setWalletAddress] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (parseFloat(amount) > userBalance) {
      alert('Amount exceeds available balance')
      return
    }
    
    onSubmit({
      userId,
      amount: parseFloat(amount),
      asset,
      walletAddress
    })
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
              onChange={(e) => setAsset(e.target.value)}
              options={['USD', 'BTC', 'ETH', 'USDT']} 
              required
            />
            
            <FormField 
              label="Amount" 
              type="number" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              min="0"
              max={userBalance.toString()}  // ← FIX IS HERE
              step="0.01"
              required
            />
            
            <FormField 
              label="Destination Wallet Address" 
              type="text" 
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              placeholder="Enter your wallet address"
              required
            />
            
            <button 
              type="submit"
              disabled={loading || !amount || !walletAddress || parseFloat(amount) > userBalance}
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
                <li>• Ensure wallet address is correct</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

  function TransactionsTab({ transactions }: { transactions: any[] }) {
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
                    <th className="text-left py-3 text-gray-400">Value</th>
                    <th className="text-left py-3 text-gray-400">Status</th>
                    <th className="text-left py-3 text-gray-400">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-4 text-white">{tx.type}</td>
                      <td className="py-4 text-white">{tx.asset}</td>
                      <td className={`py-4 ${tx.amount.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>{tx.amount}</td>
                      <td className="py-4 text-white">{tx.value}</td>
                      <td className="py-4">
                        <span className={`px-3 py-1 rounded-full text-xs ${tx.status === 'Completed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-4 text-gray-400">{tx.date}</td>
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
