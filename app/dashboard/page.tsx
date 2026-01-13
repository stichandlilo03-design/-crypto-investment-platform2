'use client'

import { motion } from 'framer-motion'
import { 
  TrendingUp, 
  TrendingDown,
  Wallet, 
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  PieChart,
  Activity,
  Settings,
  LogOut,
  Bell,
  Search,
  Plus,
  Download,
  Upload,
  Eye,
  EyeOff,
  History,
  UserCircle
} from 'lucide-react'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/hooks/useAuth'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const { user, profile, loading, signOut } = useAuth()
  const router = useRouter()
  const [hideBalance, setHideBalance] = useState(false)
  const [selectedTab, setSelectedTab] = useState('overview')

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  // Handle logout
  const handleLogout = async () => {
    await signOut()
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f] flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  // Don't render if no user
  if (!user) {
    return null
  }

  // Get user's name from profile or email
  const getUserName = () => {
    if (profile?.full_name) {
      return profile.full_name.split(' ')[0] // First name only
    }
    if (user?.email) {
      return user.email.split('@')[0] // Username from email
    }
    return 'User'
  }

  const getUserInitials = () => {
  if (profile?.full_name) {
    const names = profile.full_name.split(' ')
    return names.map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
  }
  if (user?.email) {
    return user.email.slice(0, 2).toUpperCase()
  }
  return 'U'
}

  const portfolioData = [
    { 
      name: 'Bitcoin', 
      symbol: 'BTC', 
      amount: '2.5847',
      value: '$105,234.50',
      change: '+12.34%',
      changeValue: '+$13,456',
      trend: 'up',
      color: 'from-orange-500 to-yellow-500',
      sparkline: [40, 45, 42, 48, 50, 55, 58, 60]
    },
    { 
      name: 'Ethereum', 
      symbol: 'ETH', 
      amount: '15.2341',
      value: '$48,723.40',
      change: '+8.67%',
      changeValue: '+$3,890',
      trend: 'up',
      color: 'from-blue-500 to-purple-500',
      sparkline: [30, 32, 35, 33, 38, 40, 42, 45]
    },
    { 
      name: 'Cardano', 
      symbol: 'ADA', 
      amount: '50000',
      value: '$25,500.00',
      change: '+15.23%',
      changeValue: '+$3,367',
      trend: 'up',
      color: 'from-green-500 to-emerald-500',
      sparkline: [20, 22, 21, 25, 28, 30, 32, 35]
    },
    { 
      name: 'Solana', 
      symbol: 'SOL', 
      amount: '125.5',
      value: '$18,825.00',
      change: '-2.45%',
      changeValue: '-$473',
      trend: 'down',
      color: 'from-purple-500 to-pink-500',
      sparkline: [35, 33, 30, 28, 29, 27, 26, 25]
    }
  ]

  const recentTransactions = [
    {
      type: 'deposit',
      asset: 'Bitcoin',
      symbol: 'BTC',
      amount: '+0.5 BTC',
      value: '+$20,450',
      date: '2 hours ago',
      status: 'completed'
    },
    {
      type: 'withdraw',
      asset: 'Ethereum',
      symbol: 'ETH',
      amount: '-2.0 ETH',
      value: '-$6,400',
      date: '5 hours ago',
      status: 'completed'
    },
    {
      type: 'trade',
      asset: 'Cardano',
      symbol: 'ADA',
      amount: '+5000 ADA',
      value: '+$2,550',
      date: '1 day ago',
      status: 'completed'
    },
    {
      type: 'deposit',
      asset: 'Solana',
      symbol: 'SOL',
      amount: '+25 SOL',
      value: '+$3,750',
      date: '2 days ago',
      status: 'pending'
    }
  ]

  const quickActions = [
    { icon: <Upload className="w-6 h-6" />, label: 'Deposit', color: 'from-green-500 to-emerald-500' },
    { icon: <Download className="w-6 h-6" />, label: 'Withdraw', color: 'from-red-500 to-pink-500' },
    { icon: <ArrowUpRight className="w-6 h-6" />, label: 'Buy', color: 'from-blue-500 to-cyan-500' },
    { icon: <ArrowDownRight className="w-6 h-6" />, label: 'Sell', color: 'from-orange-500 to-yellow-500' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f]">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-64 glass-effect border-r border-white/10 p-6 z-40">
        <div className="flex items-center space-x-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-display font-bold text-white">CryptoVault</span>
        </div>

        <nav className="space-y-2">
          <button
            onClick={() => setSelectedTab('overview')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
              selectedTab === 'overview' 
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                : 'text-gray-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <PieChart className="w-5 h-5" />
            <span className="font-medium">Overview</span>
          </button>
          <button
            onClick={() => setSelectedTab('portfolio')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
              selectedTab === 'portfolio' 
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                : 'text-gray-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Wallet className="w-5 h-5" />
            <span className="font-medium">Portfolio</span>
          </button>
          <button
            onClick={() => setSelectedTab('transactions')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
              selectedTab === 'transactions' 
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                : 'text-gray-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <History className="w-5 h-5" />
            <span className="font-medium">Transactions</span>
          </button>
          <button
            onClick={() => setSelectedTab('markets')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
              selectedTab === 'markets' 
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                : 'text-gray-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Activity className="w-5 h-5" />
            <span className="font-medium">Markets</span>
          </button>
          <button
            onClick={() => setSelectedTab('profile')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
              selectedTab === 'profile' 
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                : 'text-gray-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <UserCircle className="w-5 h-5" />
            <span className="font-medium">Profile</span>
          </button>
          <button
            onClick={() => setSelectedTab('settings')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
              selectedTab === 'settings' 
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                : 'text-gray-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Settings className="w-5 h-5" />
            <span className="font-medium">Settings</span>
          </button>
        </nav>

        <div className="absolute bottom-6 left-6 right-6">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-white mb-2">
              Welcome back, {getUserName()}!
            </h1>
            <p className="text-gray-400">Here's what's happening with your investments today</p>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative">
              <input
                type="search"
                placeholder="Search..."
                className="w-64 pl-10 pr-4 py-2.5 rounded-xl glass-effect border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
            
            <button className="p-2.5 rounded-xl glass-effect hover:bg-white/10 transition-all relative">
              <Bell className="w-5 h-5 text-white" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center cursor-pointer">
              <span className="text-white font-bold text-sm">{getUserInitials()}</span>
            </div>
          </div>
        </div>

        {/* Portfolio Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-2xl glass-effect hover:bg-white/5 transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-400 text-sm font-medium">Total Balance</span>
              <button onClick={() => setHideBalance(!hideBalance)} className="text-gray-400 hover:text-white">
                {hideBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="text-3xl font-bold text-white mb-2">
              {hideBalance ? '••••••' : '$198,282.90'}
            </div>
            <div className="flex items-center text-green-400 text-sm">
              <TrendingUp className="w-4 h-4 mr-1" />
              <span>+24.5% ($48,902)</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-6 rounded-2xl glass-effect hover:bg-white/5 transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-400 text-sm font-medium">Total Profit/Loss</span>
              <DollarSign className="w-5 h-5 text-green-400" />
            </div>
            <div className="text-3xl font-bold text-white mb-2">
              {hideBalance ? '••••••' : '+$48,902'}
            </div>
            <div className="flex items-center text-green-400 text-sm">
              <ArrowUpRight className="w-4 h-4 mr-1" />
              <span>+24.5% This month</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-6 rounded-2xl glass-effect hover:bg-white/5 transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-400 text-sm font-medium">Total Invested</span>
              <Wallet className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-3xl font-bold text-white mb-2">
              {hideBalance ? '••••••' : '$149,380'}
            </div>
            <div className="flex items-center text-gray-400 text-sm">
              <span>Across 4 assets</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-6 rounded-2xl glass-effect hover:bg-white/5 transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-400 text-sm font-medium">24h Change</span>
              <Activity className="w-5 h-5 text-purple-400" />
            </div>
            <div className="text-3xl font-bold text-white mb-2">
              {hideBalance ? '••••••' : '+$4,823'}
            </div>
            <div className="flex items-center text-green-400 text-sm">
              <TrendingUp className="w-4 h-4 mr-1" />
              <span>+2.43%</span>
            </div>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {quickActions.map((action, index) => (
            <motion.button
              key={action.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="p-4 rounded-xl glass-effect hover:bg-white/10 transition-all group"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                {action.icon}
              </div>
              <span className="text-white font-medium">{action.label}</span>
            </motion.button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Portfolio Assets */}
          <div className="lg:col-span-2">
            <div className="glass-effect rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-display font-bold text-white">Your Portfolio</h2>
                <button className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-medium hover:shadow-lg transition-all">
                  <Plus className="w-4 h-4 inline mr-1" />
                  Add Asset
                </button>
              </div>

              <div className="space-y-4">
                {portfolioData.map((asset, index) => (
                  <motion.div
                    key={asset.symbol}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${asset.color}`}></div>
                        <div>
                          <div className="font-semibold text-white text-lg">{asset.name}</div>
                          <div className="text-sm text-gray-400">{asset.amount} {asset.symbol}</div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="font-bold text-white text-lg mb-1">{hideBalance ? '••••••' : asset.value}</div>
                        <div className={`text-sm font-medium flex items-center justify-end ${asset.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                          {asset.trend === 'up' ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                          {asset.change}
                        </div>
                      </div>
                    </div>

                    {/* Mini sparkline */}
                    <div className="mt-4 h-12 flex items-end space-x-1">
                      {asset.sparkline.map((value, i) => (
                        <div
                          key={i}
                          className={`flex-1 rounded-t ${asset.trend === 'up' ? 'bg-green-500/50' : 'bg-red-500/50'}`}
                          style={{ height: `${(value / Math.max(...asset.sparkline)) * 100}%` }}
                        ></div>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          <div>
            <div className="glass-effect rounded-2xl p-6">
              <h2 className="text-xl font-display font-bold text-white mb-6">Recent Activity</h2>
              
              <div className="space-y-4">
                {recentTransactions.map((tx, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        tx.type === 'deposit' ? 'bg-green-500/20 text-green-400' :
                        tx.type === 'withdraw' ? 'bg-red-500/20 text-red-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {tx.type === 'deposit' ? <ArrowDownRight className="w-5 h-5" /> :
                         tx.type === 'withdraw' ? <ArrowUpRight className="w-5 h-5" /> :
                         <Activity className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="text-white font-medium text-sm">{tx.asset}</div>
                        <div className="text-gray-400 text-xs">{tx.date}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-semibold text-sm ${
                        tx.amount.startsWith('+') ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {tx.amount}
                      </div>
                      <div className="text-gray-400 text-xs">{tx.value}</div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <button className="w-full mt-4 py-2.5 rounded-xl glass-effect hover:bg-white/10 text-white text-sm font-medium transition-all">
                View All Transactions
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
