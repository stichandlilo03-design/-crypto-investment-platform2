'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Wallet, DollarSign, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

interface UserBalance {
  asset: string
  amount: number
  average_buy_price: number
}

interface BalanceAdjustment {
  id: string
  asset: string
  amount: number
  adjustment_type: 'profit' | 'loss'
  reason: string
  created_at: string
}

export default function PortfolioOverview() {
  const [balances, setBalances] = useState<UserBalance[]>([])
  const [adjustments, setAdjustments] = useState<BalanceAdjustment[]>([])
  const [prices, setPrices] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch balances
      const { data: balancesData } = await supabase
        .from('user_balances')
        .select('*')
        .eq('user_id', user.id)

      // Fetch adjustments
      const { data: adjustmentsData } = await supabase
        .from('balance_adjustments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)

      // Fetch prices
      const response = await fetch('/api/prices')
      const pricesData = await response.json()

      if (balancesData) setBalances(balancesData)
      if (adjustmentsData) setAdjustments(adjustmentsData)
      if (pricesData.success) setPrices(pricesData.prices)
    } catch (error) {
      console.error('Error fetching portfolio:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculatePortfolioValue = () => {
    return balances.reduce((total, balance) => {
      const currentPrice = prices[balance.asset] || 0
      return total + (balance.amount * currentPrice)
    }, 0)
  }

  const calculateTotalInvested = () => {
    return balances.reduce((total, balance) => {
      return total + (balance.amount * balance.average_buy_price)
    }, 0)
  }

  const calculateProfitLoss = () => {
    const currentValue = calculatePortfolioValue()
    const invested = calculateTotalInvested()
    return currentValue - invested
  }

  const calculateProfitLossPercentage = () => {
    const invested = calculateTotalInvested()
    if (invested === 0) return 0
    return (calculateProfitLoss() / invested) * 100
  }

  const totalValue = calculatePortfolioValue()
  const totalInvested = calculateTotalInvested()
  const profitLoss = calculateProfitLoss()
  const profitLossPercentage = calculateProfitLossPercentage()
  const isProfit = profitLoss >= 0

  if (loading) {
    return (
      <div className="glass-effect rounded-2xl p-6 border border-white/10">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Portfolio Value Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Value */}
        <div className="glass-effect rounded-2xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Portfolio Value</span>
            <Wallet className="w-5 h-5 text-blue-400" />
          </div>
          <h3 className="text-3xl font-bold text-white mb-1">
            ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h3>
          <p className="text-gray-400 text-sm">Current market value</p>
        </div>

        {/* Total Invested */}
        <div className="glass-effect rounded-2xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Total Invested</span>
            <DollarSign className="w-5 h-5 text-purple-400" />
          </div>
          <h3 className="text-3xl font-bold text-white mb-1">
            ${totalInvested.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h3>
          <p className="text-gray-400 text-sm">Initial investment</p>
        </div>

        {/* Profit/Loss */}
        <div className="glass-effect rounded-2xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Profit/Loss</span>
            {isProfit ? (
              <TrendingUp className="w-5 h-5 text-green-400" />
            ) : (
              <TrendingDown className="w-5 h-5 text-red-400" />
            )}
          </div>
          <h3 className={`text-3xl font-bold mb-1 ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
            {isProfit ? '+' : ''}{profitLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
          </h3>
          <p className={`text-sm font-medium ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
            {isProfit ? '+' : ''}{profitLossPercentage.toFixed(2)}%
          </p>
        </div>
      </div>

      {/* Holdings Breakdown */}
      <div className="glass-effect rounded-2xl p-6 border border-white/10">
        <h3 className="text-xl font-bold text-white mb-4">Holdings Breakdown</h3>
        
        {balances.length === 0 ? (
          <div className="text-center py-8">
            <Wallet className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No holdings yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {balances.map((balance) => {
              const currentPrice = prices[balance.asset] || 0
              const currentValue = balance.amount * currentPrice
              const invested = balance.amount * balance.average_buy_price
              const assetPL = currentValue - invested
              const assetPLPercentage = invested > 0 ? (assetPL / invested) * 100 : 0
              const isAssetProfit = assetPL >= 0

              return (
                <div key={balance.asset} className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <span className="text-white font-bold text-sm">{balance.asset}</span>
                      </div>
                      <div>
                        <p className="font-medium text-white">{balance.asset}</p>
                        <p className="text-gray-400 text-sm">{balance.amount.toFixed(8)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-white">
                        ${currentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <p className={`text-sm font-medium ${isAssetProfit ? 'text-green-400' : 'text-red-400'}`}>
                        {isAssetProfit ? '+' : ''}{assetPL.toFixed(2)} ({isAssetProfit ? '+' : ''}{assetPLPercentage.toFixed(2)}%)
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-white/10">
                    <div>
                      <p className="text-xs text-gray-400">Avg. Buy Price</p>
                      <p className="text-sm text-white font-medium">
                        ${balance.average_buy_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Current Price</p>
                      <p className="text-sm text-white font-medium">
                        ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Recent Adjustments (Admin Profit/Loss) */}
      {adjustments.length > 0 && (
        <div className="glass-effect rounded-2xl p-6 border border-white/10">
          <h3 className="text-xl font-bold text-white mb-4">Recent Adjustments</h3>
          <div className="space-y-3">
            {adjustments.map((adjustment) => (
              <div key={adjustment.id} className="p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {adjustment.adjustment_type === 'profit' ? (
                      <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-green-400" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                        <TrendingDown className="w-5 h-5 text-red-400" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-white capitalize">
                        {adjustment.adjustment_type} - {adjustment.asset}
                      </p>
                      <p className="text-gray-400 text-sm">{adjustment.reason || 'No reason provided'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${adjustment.adjustment_type === 'profit' ? 'text-green-400' : 'text-red-400'}`}>
                      {adjustment.adjustment_type === 'profit' ? '+' : '-'}{Math.abs(adjustment.amount).toFixed(8)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(adjustment.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
