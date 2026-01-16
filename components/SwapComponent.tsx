'use client'

import { useState, useEffect } from 'react'
import { ArrowDownUp, Loader2, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

const SUPPORTED_ASSETS = ['BTC', 'ETH', 'USDT', 'USD'] // ✅ Added USD

export default function SwapComponent() {
  const [fromAsset, setFromAsset] = useState('BTC')
  const [toAsset, setToAsset] = useState('ETH')
  const [fromAmount, setFromAmount] = useState('')
  const [toAmount, setToAmount] = useState('')
  const [prices, setPrices] = useState<Record<string, number>>({})
  const [balances, setBalances] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch user balances
      const { data: balancesData } = await supabase
        .from('user_balances')
        .select('*')
        .eq('user_id', user.id)

      if (balancesData) {
        const balancesMap: Record<string, number> = {}
        balancesData.forEach(b => {
          balancesMap[b.asset] = b.amount
        })
        setBalances(balancesMap)
      }

      // Fetch prices
      const response = await fetch('/api/prices')
      const data = await response.json()
      if (data.success) {
        // ✅ Add USD with price of 1
        setPrices({ ...data.prices, USD: 1 })
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }

  const calculateToAmount = (amount: string) => {
    if (!amount || !prices[fromAsset] || !prices[toAsset]) return ''
    
    const fromValue = parseFloat(amount) * prices[fromAsset]
    const toValue = fromValue / prices[toAsset]
    return toValue.toFixed(8)
  }

  const handleFromAmountChange = (value: string) => {
    setFromAmount(value)
    setToAmount(calculateToAmount(value))
  }

  const handleSwapAssets = () => {
    const tempAsset = fromAsset
    const tempAmount = fromAmount
    
    setFromAsset(toAsset)
    setToAsset(tempAsset)
    setFromAmount(toAmount)
    setToAmount(tempAmount)
  }

  const handleSwap = async () => {
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const fromAmountNum = parseFloat(fromAmount)
      const toAmountNum = parseFloat(toAmount)

      if (!fromAmountNum || fromAmountNum <= 0) throw new Error('Invalid amount')
      if (fromAmountNum > (balances[fromAsset] || 0)) throw new Error('Insufficient balance')

      // Create swap transaction
      const { error: swapError } = await supabase
        .from('swap_transactions')
        .insert([{
          user_id: user.id,
          from_asset: fromAsset,
          to_asset: toAsset,
          from_amount: fromAmountNum,
          to_amount: toAmountNum,
          exchange_rate: prices[toAsset] / prices[fromAsset],
          status: 'completed'
        }])

      if (swapError) throw swapError

      // Update from_asset balance (decrease)
      const { data: fromBalanceData } = await supabase
        .from('user_balances')
        .select('*')
        .eq('user_id', user.id)
        .eq('asset', fromAsset)
        .single()

      if (fromBalanceData) {
        const newFromAmount = fromBalanceData.amount - fromAmountNum
        
        if (newFromAmount <= 0.00000001) {
          // Delete balance if too small
          await supabase
            .from('user_balances')
            .delete()
            .eq('user_id', user.id)
            .eq('asset', fromAsset)
        } else {
          // Update balance
          await supabase
            .from('user_balances')
            .update({ amount: newFromAmount })
            .eq('user_id', user.id)
            .eq('asset', fromAsset)
        }
      }

      // Update to_asset balance (increase)
      const { data: toBalanceData } = await supabase
        .from('user_balances')
        .select('*')
        .eq('user_id', user.id)
        .eq('asset', toAsset)
        .single()

      if (toBalanceData) {
        // Update existing balance with weighted average
        const oldAmount = toBalanceData.amount
        const oldPrice = toBalanceData.average_buy_price
        const newAmount = oldAmount + toAmountNum
        const newPrice = ((oldAmount * oldPrice) + (toAmountNum * prices[toAsset])) / newAmount

        await supabase
          .from('user_balances')
          .update({ 
            amount: newAmount,
            average_buy_price: newPrice
          })
          .eq('user_id', user.id)
          .eq('asset', toAsset)
      } else {
        // Create new balance
        await supabase
          .from('user_balances')
          .insert([{
            user_id: user.id,
            asset: toAsset,
            amount: toAmountNum,
            average_buy_price: prices[toAsset]
          }])
      }

      // Send notification
      await supabase.from('notifications').insert([{
        user_id: user.id,
        type: 'swap',
        title: 'Swap Completed',
        message: `Successfully swapped ${fromAmountNum} ${fromAsset} for ${toAmountNum} ${toAsset}`,
        read: false
      }])

      setSuccess(true)
      setFromAmount('')
      setToAmount('')
      
      // Refresh balances
      await fetchData()

      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message || 'Swap failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="glass-effect rounded-2xl p-6 border border-white/10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Swap Assets</h2>
        <button
          onClick={fetchData}
          className="p-2 rounded-lg glass-effect hover:bg-white/10 transition-all"
        >
          <RefreshCw className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {success && (
        <div className="mb-4 p-4 rounded-xl bg-green-500/20 border border-green-500/30 flex items-center space-x-2">
          <CheckCircle className="w-5 h-5 text-green-400" />
          <p className="text-green-400">Swap completed successfully!</p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <p className="text-red-400">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        {/* From Section */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">From</span>
            <span className="text-gray-400 text-sm">
              Balance: {(balances[fromAsset] || 0).toFixed(8)}
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <input
              type="number"
              value={fromAmount}
              onChange={(e) => handleFromAmountChange(e.target.value)}
              placeholder="0.00"
              className="flex-1 bg-transparent text-2xl text-white focus:outline-none"
              step="0.00000001"
            />
            <select
              value={fromAsset}
              onChange={(e) => setFromAsset(e.target.value)}
              className="px-4 py-2 rounded-lg bg-white/10 text-white font-medium focus:outline-none"
            >
              {SUPPORTED_ASSETS.map(asset => (
                <option key={asset} value={asset}>{asset}</option>
              ))}
            </select>
          </div>
          <div className="mt-2 text-sm text-gray-400">
            ≈ ${((parseFloat(fromAmount) || 0) * (prices[fromAsset] || 0)).toFixed(2)}
          </div>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center">
          <button
            onClick={handleSwapAssets}
            className="p-3 rounded-full glass-effect hover:bg-white/10 transition-all"
          >
            <ArrowDownUp className="w-5 h-5 text-purple-400" />
          </button>
        </div>

        {/* To Section */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">To</span>
            <span className="text-gray-400 text-sm">
              Balance: {(balances[toAsset] || 0).toFixed(8)}
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <input
              type="number"
              value={toAmount}
              readOnly
              placeholder="0.00"
              className="flex-1 bg-transparent text-2xl text-white focus:outline-none"
            />
            <select
              value={toAsset}
              onChange={(e) => setToAsset(e.target.value)}
              className="px-4 py-2 rounded-lg bg-white/10 text-white font-medium focus:outline-none"
            >
              {SUPPORTED_ASSETS.map(asset => (
                <option key={asset} value={asset}>{asset}</option>
              ))}
            </select>
          </div>
          <div className="mt-2 text-sm text-gray-400">
            ≈ ${((parseFloat(toAmount) || 0) * (prices[toAsset] || 0)).toFixed(2)}
          </div>
        </div>

        {/* Exchange Rate */}
        {prices[fromAsset] && prices[toAsset] && (
          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <p className="text-sm text-gray-400">
              1 {fromAsset} = {(prices[fromAsset] / prices[toAsset]).toFixed(8)} {toAsset}
            </p>
          </div>
        )}

        {/* Swap Button */}
        <button
          onClick={handleSwap}
          disabled={loading || !fromAmount || parseFloat(fromAmount) <= 0}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:opacity-90 disabled:opacity-50 flex items-center justify-center space-x-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Swapping...</span>
            </>
          ) : (
            <>
              <ArrowDownUp className="w-5 h-5" />
              <span>Swap</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
