'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { 
  TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight, DollarSign,
  PieChart, Activity, Settings, LogOut, Bell, Search, Plus, Download, Upload,
  Eye, EyeOff, History, UserCircle, Menu, X, Check, Clock, AlertCircle, FileText
} from 'lucide-react'
import { useState, useEffect } from 'react'

export default function DashboardPage() {
  const [hideBalance, setHideBalance] = useState(false)
  const [selectedTab, setSelectedTab] = useState('overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [cryptoPrices, setCryptoPrices] = useState({})
  const [loading, setLoading] = useState(true)

  // Fetch real crypto prices
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const response = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,cardano,solana&vs_currencies=usd&include_24hr_change=true&x_cg_demo_api_key=CG-YnK9oBCYZL6hmz6g7R8HtqBm'
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

  // Mock user holdings - would come from database
  const holdings = { bitcoin: 2.5847, ethereum: 15.2341, cardano: 50000, solana: 125.5 }
  
  const calculateBalance = () => {
    let total = 0
    Object.keys(holdings).forEach(coin => {
      if (cryptoPrices[coin]) total += holdings[coin] * cryptoPrices[coin].usd
    })
    return total
  }

  const userBalance = calculateBalance()
  const userProfit = userBalance * 0.327 // 32.7% gain

  const notifications = [
    { id: 1, type: 'deposit', title: 'Deposit Approved', message: 'Your BTC deposit of 0.5 BTC approved', time: '2h ago', read: false },
    { id: 2, type: 'profit', title: 'Portfolio Up 5%', message: 'Your portfolio gained $9,850', time: '4h ago', read: false },
    { id: 3, type: 'withdraw', title: 'Withdrawal Pending', message: 'Withdrawal under review', time: '1d ago', read: true },
  ]

  const portfolioData = [
    { name: 'Bitcoin', symbol: 'BTC', amount: 2.5847, coinGeckoId: 'bitcoin', color: 'from-orange-500 to-yellow-500' },
    { name: 'Ethereum', symbol: 'ETH', amount: 15.2341, coinGeckoId: 'ethereum', color: 'from-blue-500 to-purple-500' },
    { name: 'Cardano', symbol: 'ADA', amount: 50000, coinGeckoId: 'cardano', color: 'from-green-500 to-emerald-500' },
    { name: 'Solana', symbol: 'SOL', amount: 125.5, coinGeckoId: 'solana', color: 'from-purple-500 to-pink-500' },
  ].map(asset => {
    const price = cryptoPrices[asset.coinGeckoId]
    const value = price ? asset.amount * price.usd : 0
    const change = price ? price.usd_24h_change : 0
    return { ...asset, value, change, trend: change >= 0 ? 'up' : 'down' }
  })

  const NavItems = () => (
    <nav className="space-y-2">
      {[
        { id: 'overview', icon: PieChart, label: 'Overview' },
        { id: 'portfolio', icon: Wallet, label: 'Portfolio' },
        { id: 'transactions', icon: History, label: 'Transactions' },
        { id: 'markets', icon: Activity, label: 'Markets' },
        { id: 'deposit', icon: Upload, label: 'Deposit', highlight: true },
        { id: 'withdraw', icon: Download, label: 'Withdraw' },
        { id: 'profile', icon: UserCircle, label: 'Profile' },
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
              <p className="text-gray-400">Welcome back!</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button onClick={() => setNotificationsOpen(!notificationsOpen)} 
              className="p-2.5 rounded-xl glass-effect hover:bg-white/10 relative">
              <Bell className="w-5 h-5 text-white" />
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </button>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <span className="text-white font-bold">U</span>
            </div>
          </div>
        </div>

        {/* Notification Panel */}
        <AnimatePresence>
          {notificationsOpen && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="fixed top-20 right-4 w-96 glass-effect rounded-2xl p-4 z-50 max-h-96 overflow-y-auto">
              <h3 className="text-lg font-bold text-white mb-4">Notifications</h3>
              {notifications.map(n => (
                <div key={n.id} className={`p-3 rounded-xl mb-2 ${n.read ? 'bg-white/5' : 'bg-purple-500/10'}`}>
                  <div className="flex items-start space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      n.type === 'deposit' ? 'bg-green-500/20 text-green-400' :
                      n.type === 'withdraw' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      {n.type === 'deposit' ? <Check className="w-4 h-4" /> :
                       n.type === 'withdraw' ? <Clock className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-white text-sm font-semibold">{n.title}</p>
                      <p className="text-gray-400 text-xs">{n.message}</p>
                      <p className="text-gray-500 text-xs mt-1">{n.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content Tabs */}
        {selectedTab === 'overview' && <OverviewTab />}
        {selectedTab === 'deposit' && <DepositTab />}
        {selectedTab === 'withdraw' && <WithdrawTab />}
        {selectedTab === 'transactions' && <TransactionsTab />}
        {selectedTab === 'markets' && <MarketsTab prices={cryptoPrices} />}
        {selectedTab === 'portfolio' && <PortfolioTab data={portfolioData} hide={hideBalance} />}
      </main>
    </div>
  )

  function OverviewTab() {
    return (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title="Total Balance" value={`$${userBalance.toLocaleString(undefined, {maximumFractionDigits: 2})}`} 
            change="+32.7%" icon={<Eye />} />
          <StatCard title="Total Profit" value={`+$${userProfit.toLocaleString(undefined, {maximumFractionDigits: 2})}`} 
            change="+32.7% ROI" icon={<DollarSign />} color="green" />
          <StatCard title="Assets" value="4" subtitle="BTC, ETH, ADA, SOL" icon={<Wallet />} color="blue" />
          <StatCard title="24h Change" value={cryptoPrices.bitcoin ? `${cryptoPrices.bitcoin.usd_24h_change.toFixed(2)}%` : '...'} 
            icon={<Activity />} color="purple" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { icon: <Upload />, label: 'Deposit', color: 'from-green-500 to-emerald-500', tab: 'deposit' },
            { icon: <Download />, label: 'Withdraw', color: 'from-red-500 to-pink-500', tab: 'withdraw' },
            { icon: <ArrowUpRight />, label: 'Buy', color: 'from-blue-500 to-cyan-500', tab: 'markets' },
            { icon: <ArrowDownRight />, label: 'Sell', color: 'from-orange-500 to-yellow-500', tab: 'markets' }
          ].map((action, i) => (
            <button key={i} onClick={() => setSelectedTab(action.tab)}
              className="p-4 rounded-xl glass-effect hover:bg-white/10 group">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-3 mx-auto group-hover:scale-110 transition-transform`}>
                {action.icon}
              </div>
              <span className="text-white font-medium">{action.label}</span>
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 glass-effect rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Your Portfolio</h2>
            {portfolioData.map((asset, i) => (
              <div key={i} className="p-4 rounded-xl bg-white/5 hover:bg-white/10 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${asset.color}`}></div>
                    <div>
                      <p className="text-white font-semibold">{asset.name}</p>
                      <p className="text-gray-400 text-sm">{asset.amount} {asset.symbol}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold">${asset.value.toLocaleString(undefined, {maximumFractionDigits: 2})}</p>
                    <p className={`text-sm ${asset.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                      {asset.change.toFixed(2)}%
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="glass-effect rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-6">Recent Activity</h2>
            {notifications.map((n, i) => (
              <div key={i} className="p-3 rounded-xl bg-white/5 mb-3">
                <p className="text-white text-sm font-semibold">{n.title}</p>
                <p className="text-gray-400 text-xs">{n.message}</p>
                <p className="text-gray-500 text-xs mt-1">{n.time}</p>
              </div>
            ))}
          </div>
        </div>
      </>
    )
  }

  function DepositTab() {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Deposit Funds</h1>
        <div className="glass-effect rounded-2xl p-6">
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <DepositMethod icon="₿" title="Bitcoin (BTC)" desc="Send BTC to wallet" color="from-orange-500 to-yellow-500" />
            <DepositMethod icon="$" title="Wire Transfer" desc="Bank transfer (USD, EUR)" color="from-blue-500 to-cyan-500" />
          </div>
          <div className="p-6 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5" />
              <div>
                <h4 className="text-yellow-400 font-semibold mb-1">Important</h4>
                <p className="text-gray-300 text-sm">All deposits require admin approval. Upload proof of payment after depositing. Processing: 24-48 hours.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  function WithdrawTab() {
    return (
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Withdraw Funds</h1>
        <div className="glass-effect rounded-2xl p-6">
          <div className="space-y-4">
            <FormField label="Select Asset" type="select" options={['Bitcoin (BTC)', 'Ethereum (ETH)', 'Wire Transfer (USD)']} />
            <FormField label="Amount" type="number" placeholder="0.00" />
            <FormField label="Wallet Address / Account" type="text" placeholder="Enter destination" />
            <button className="w-full py-3 rounded-xl bg-gradient-to-r from-red-500 to-pink-500 text-white font-medium">
              Request Withdrawal
            </button>
          </div>
        </div>
      </div>
    )
  }

  function TransactionsTab() {
    const txns = [
      { type: 'Deposit', asset: 'BTC', amount: '+0.5', value: '$20,450', status: 'Completed', date: '2024-01-10' },
      { type: 'Withdrawal', asset: 'ETH', amount: '-2.0', value: '-$6,400', status: 'Pending', date: '2024-01-09' },
      { type: 'Buy', asset: 'ADA', amount: '+5000', value: '$2,550', status: 'Completed', date: '2024-01-08' },
    ]
    return (
      <div>
        <h1 className="text-3xl font-bold text-white mb-8">Transaction History</h1>
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
                {txns.map((tx, i) => (
                  <tr key={i} className="border-b border-white/5 hover:bg-white/5">
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
      </div>
    )
  }

  function MarketsTab({ prices }) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-white mb-8">Crypto Markets</h1>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.entries(prices).map(([coin, data]) => (
            <div key={coin} className="glass-effect rounded-2xl p-6 hover:bg-white/5">
              <h3 className="text-xl font-bold text-white capitalize mb-2">{coin}</h3>
              <p className="text-3xl font-bold text-white mb-2">${data.usd?.toLocaleString()}</p>
              <p className={`text-sm ${data.usd_24h_change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {data.usd_24h_change?.toFixed(2)}% 24h
              </p>
            </div>
          ))}
        </div>
      </div>
    )
  }

  function PortfolioTab({ data, hide }) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-white mb-8">Portfolio Details</h1>
        <div className="grid gap-6">
          {data.map((asset, i) => (
            <div key={i} className="glass-effect rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${asset.color}`}></div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">{asset.name}</h3>
                    <p className="text-gray-400">{asset.amount} {asset.symbol}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-white">${asset.value.toLocaleString()}</p>
                  <p className={`text-lg ${asset.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                    {asset.change.toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }
}

function StatCard({ title, value, change, subtitle, icon, color = 'green' }) {
  return (
    <div className="p-6 rounded-2xl glass-effect hover:bg-white/5">
      <div className="flex justify-between mb-4">
        <span className="text-gray-400 text-sm">{title}</span>
        <div className={`text-${color}-400`}>{icon}</div>
      </div>
      <p className="text-3xl font-bold text-white mb-2">{value}</p>
      {change && <p className="text-green-400 text-sm">{change}</p>}
      {subtitle && <p className="text-gray-400 text-sm">{subtitle}</p>}
    </div>
  )
}

function DepositMethod({ icon, title, desc, color }) {
  return (
    <div className="p-6 bg-white/5 rounded-xl hover:bg-white/10 cursor-pointer border-2 border-transparent hover:border-purple-500">
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-4 text-2xl`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-gray-400 text-sm mb-4">{desc}</p>
      <button className={`w-full py-2 rounded-lg bg-gradient-to-r ${color} text-white font-medium`}>
        Deposit
      </button>
    </div>
  )
}

function FormField({ label, type, placeholder, options }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-400 mb-2">{label}</label>
      {type === 'select' ? (
        <select className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white">
          {options.map(opt => <option key={opt}>{opt}</option>)}
        </select>
      ) : (
        <input type={type} placeholder={placeholder} 
          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500" />
      )}
    </div>
  )
}
