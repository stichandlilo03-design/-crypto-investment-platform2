'use client'

import { useState, useEffect } from 'react'
import { Wallet, TrendingUp, TrendingDown, Clock, ArrowDownCircle, ArrowUpCircle, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { formatDistanceToNow } from 'date-fns'

interface UserBalance {
  asset: string
  amount: number
  average_buy_price: number
}

interface Transaction {
  id: string
  type: string
  amount: number
  value_usd: number
  status: string
  created_at: string
  asset: string
}

interface CryptoPrice {
  usd: number
  usd_24h_change: number
}

interface CryptoPrices {
  [key: string]: CryptoPrice
}

export default function Overview() {
  const [balances, setBalances] = useState<UserBalance[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [cryptoPrices, setCryptoPrices] = useState<CryptoPrices>({})
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalBalance: 0,
    totalDeposits: 0,
    totalWithdrawals: 0,
    pendingCount: 0,
    change24h: 0
  })

  useEffect(() => {
    fetchData()
    
    // Fetch prices every 30 seconds
    const interval = setInterval(fetchPrices, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchPrices = async () => {
    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether&vs_currencies=usd&include_24hr_change=true'
      )
      const data = await response.json()
      
      setCryptoPrices({
        BTC: data.bitcoin || { usd: 0, usd_24h_change: 0 },
        ETH: data.ethereum || { usd: 0, usd_24h_change: 0 },
        USDT: data.tether || { usd: 1, usd_24h_change: 0 },
        USD: { usd: 1, usd_24h_change: 0 }
      })
    } catch (error) {
      console.error('Error fetching crypto prices:', error)
    }
  }

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch user balances
      const { data: balancesData } = await supabase
        .from('user_balances')
        .select('*')
        .eq('user_id', user.id)

      // Fetch transactions
      const { data: transactionsData } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)

      // Fetch prices
      await fetchPrices()

      if (balancesData) setBalances(balancesData)
      if (transactionsData) setTransactions(transactionsData)

      // Calculate stats
      if (balancesData && transactionsData) {
        calculateStats(balancesData, transactionsData)
      }
    } catch (error) {
      console.error('Error fetching overview data:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (balances: UserBalance[], transactions: Transaction[]) => {
    // Calculate total balance in USD
    const totalBalance = balances.reduce((sum, balance) => {
      const price = balance.asset === 'USD' ? 1 : (cryptoPrices[balance.asset]?.usd || 0)
      return sum + (Number(balance.amount) * price)
    }, 0)

    // Calculate total deposits (approved only)
    const totalDeposits = transactions
      .filter(t => t.type === 'deposit' && t.status === 'approved')
      .reduce((sum, t) => sum + (Number(t.value_usd) || Number(t.amount)), 0)

    // Calculate total withdrawals (approved only)
    const totalWithdrawals = transactions
      .filter(t => t.type === 'withdraw' && t.status === 'approved')
      .reduce((sum, t) => sum + (Number(t.value_usd) || Number(t.amount)), 0)

    // Count pending transactions
    const pendingCount = transactions.filter(t => t.status === 'pending').length

    // Calculate 24h change
    let change24h = 0
    balances.forEach(balance => {
      if (balance.asset !== 'USD') {
        const priceChange = cryptoPrices[balance.asset]?.usd_24h_change || 0
        const balanceValue = Number(balance.amount) * (cryptoPrices[balance.asset]?.usd || 0)
        change24h += (balanceValue * priceChange) / 100
      }
    })

    setStats({
      totalBalance,
      totalDeposits,
      totalWithdrawals,
      pendingCount,
      change24h
    })
  }

  // Recalculate stats when prices update
  useEffect(() => {
    if (balances.length > 0 && Object.keys(cryptoPrices).length > 0) {
      calculateStats(balances, transactions)
    }
  }, [cryptoPrices, balances])

  const getAssetBalance = (asset: string) => {
    const balance = balances.find(b => b.asset === asset)
    if (!balance) return { amount: 0, value: 0, change: 0 }
    
    const price = asset === 'USD' ? 1 : (cryptoPrices[asset]?.usd || 0)
    const value = Number(balance.amount) * price
    const change = cryptoPrices[asset]?.usd_24h_change || 0
    
    return { amount: Number(balance.amount), value, change }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    )
  }

  const isPositiveChange = stats.change24h >= 0

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Balance */}
        <div className="glass-effect rounded-2xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Total Balance</span>
            <Wallet className="w-5 h-5 text-purple-400" />
          </div>
          <h3 className="text-3xl font-bold text-white mb-1">
            ${stats.totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h3>
          <p className={`text-sm font-medium ${isPositiveChange ? 'text-green-400' : 'text-red-400'}`}>
            {isPositiveChange ? '+' : ''}{stats.change24h.toFixed(2)}%
          </p>
        </div>

        {/* Total Deposits */}
        <div className="glass-effect rounded-2xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Total Deposits</span>
            <ArrowDownCircle className="w-5 h-5 text-green-400" />
          </div>
          <h3 className="text-3xl font-bold text-white mb-1">
            ${stats.totalDeposits.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h3>
          <p className="text-sm text-gray-400">
            {transactions.filter(t => t.type === 'deposit' && t.status === 'approved').length} transactions
          </p>
        </div>

        {/* Total Withdrawals */}
        <div className="glass-effect rounded-2xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Total Withdrawals</span>
            <ArrowUpCircle className="w-5 h-5 text-red-400" />
          </div>
          <h3 className="text-3xl font-bold text-white mb-1">
            ${stats.totalWithdrawals.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h3>
          <p className="text-sm text-gray-400">
            {transactions.filter(t => t.type === 'withdraw' && t.status === 'approved').length} transactions
          </p>
        </div>

        {/* Pending */}
        <div className="glass-effect rounded-2xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Pending</span>
            <Clock className="w-5 h-5 text-yellow-400" />
          </div>
          <h3 className="text-3xl font-bold text-white mb-1">
            {stats.pendingCount}
          </h3>
          <p className="text-sm text-gray-400">Awaiting approval</p>
        </div>
      </div>

      {/* Portfolio & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Portfolio */}
        <div className="glass-effect rounded-2xl p-6 border border-white/10">
          <h3 className="text-xl font-bold text-white mb-4">Portfolio</h3>
          
          {balances.length === 0 ? (
            <div className="text-center py-8">
              <Wallet className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No assets yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {balances.map((balance) => {
                const { amount, value, change } = getAssetBalance(balance.asset)
                const isPositive = change >= 0

                return (
                  <div key={balance.asset} className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                          <span className="text-white font-bold text-sm">{balance.asset}</span>
                        </div>
                        <div>
                          <p className="font-medium text-white">{balance.asset}</p>
                          <p className="text-gray-400 text-sm">{amount.toFixed(8)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-white">
                          ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <p className={`text-sm font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                          {isPositive ? '+' : ''}{change.toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="glass-effect rounded-2xl p-6 border border-white/10">
          <h3 className="text-xl font-bold text-white mb-4">Recent Transactions</h3>
          
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.slice(0, 5).map((transaction) => {
                const isDeposit = transaction.type === 'deposit'
                const isPending = transaction.status === 'pending'
                const amount = Number(transaction.value_usd) || Number(transaction.amount)

                return (
                  <div key={transaction.id} className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isDeposit ? 'bg-green-500/20' : 'bg-red-500/20'
                        }`}>
                          {isDeposit ? (
                            <ArrowDownCircle className="w-5 h-5 text-green-400" />
                          ) : (
                            <ArrowUpCircle className="w-5 h-5 text-red-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-white capitalize">{transaction.type}</p>
                          <p className="text-gray-400 text-sm">
                            {formatDistanceToNow(new Date(transaction.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${isDeposit ? 'text-green-400' : 'text-red-400'}`}>
                          {isDeposit ? '+' : '-'}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          transaction.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                          transaction.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {transaction.status === 'approved' ? 'Approved' : 
                           transaction.status === 'pending' ? 'Pending' : 'Rejected'}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
