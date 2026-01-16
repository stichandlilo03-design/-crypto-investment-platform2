'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowDownUp, Loader2, RefreshCw, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

const SUPPORTED_COINS = [
  { symbol: 'BTC', name: 'Bitcoin', icon: '₿' },
  { symbol: 'ETH', name: 'Ethereum', icon: 'Ξ' },
  { symbol: 'USDT', name: 'Tether', icon: '₮' },
  { symbol: 'BNB', name: 'Binance Coin', icon: 'B' },
  { symbol: 'SOL', name: 'Solana', icon: 'S' },
  { symbol: 'XRP', name: 'Ripple', icon: 'X' }
]

interface UserBalance {
  asset: string
  amount: number
  average_buy_price: number
}

export default function SwapComponent() {
  const [fromAsset, setFromAsset] = useState('BTC')
  const [toAsset, setToAsset] = useState('ETH')
  const [fromAmount, setFromAmount] = useState('')
  const [toAmount, setToAmount] = useState('')
  const [balances, setBalances] = useState<UserBalance[]>([])
  const [prices, setPrices] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(false)
  const [swapping, setSwapping] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchUserBalances()
    fetchPrices()
  }, [])

  useEffect(() => {
    calculateToAmount()
  }, [fromAmount, fromAsset, toAsset, prices])

  const fetchUserBalances = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('user_balances')
        .select('*')
        .eq('user_id', user.id)

      if (error) throw error
      setBalances(data || [])
    } catch (error) {
      console.error('Error fetching balances:', error)
    }
  }

  const fetchPrices = async () => {
    try {
      const response = await fetch('/api/prices')
      const data = await response.json()
      
      if (data.success) {
        setPrices(data.prices)
      }
    } catch (error) {
      console.error('Error fetching prices:', error)
    }
  }

  const calculateToAmount = () => {
    if (!fromAmount || !prices[fromAsset] || !prices[toAsset]) {
      setToAmount('')
      return
    }

    const fromValue = parseFloat(fromAmount) * prices[fromAsset]
    const toValue = fromValue / prices[toAsset]
    setToAmount(toValue.toFixed(8))
  }

  const getBalance = (asset: string) => {
    const balance = balances.find(b => b.asset === asset)
    return balance?.amount || 0
  }

  const handleSwap = async () => {
    setError('')
    
    const amount = parseFloat(fromAmount)
    if (!amount || amount <= 0) {
      setError('Please enter a valid amount')
      return
    }

    const balance = getBalance(fromAsset)
    if (amount > balance) {
      setError(`Insufficient ${fromAsset} balance`)
      return
    }

    if (!prices[fromAsset] || !prices[toAsset]) {
      setError('Unable to fetch exchange rates')
      return
    }

    try {
      setSwapping(true)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const exchangeRate = prices[toAsset] / prices[fromAsset]
      const toAmountNum = parseFloat(toAmount)

      // Create swap transaction
      const { error: swapError } = await supabase
        .from('swap_transactions')
        .insert([
          {
            user_id: user.id,
            from_asset: fromAsset,
            from_amount: amount,
            to_asset: toAsset,
            to_amount: toAmountNum,
            exchange_rate: exchangeRate,
            status: 'completed'
          }
        ])

      if (swapError) throw swapError

      // Update FROM balance (decrease)
      const { error: fromError } = await supabase
        .from('user_balances')
        .update({ 
          amount: balance - amount,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('asset', fromAsset)

      if (fromError) throw fromError

      // Update TO balance (increase)
      const toBalance = getBalance(toAsset)
      if (toBalance > 0) {
        const { error: toError } = await supabase
          .from('user_balances')
          .update({ 
            amount: toBalance + toAmountNum,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id)
          .eq('asset', toAsset)

        if (toError) throw toError
      } else {
        const { error: insertError } = await supabase
          .from('user_balances')
          .insert([
            {
              user_id: user.id,
              asset: toAsset,
              amount: toAmountNum,
              average_buy_price: prices[toAsset]
            }
          ])

        if (insertError) throw insertError
      }

      // Create notification
      await supabase.from('notifications').insert([
        {
          user_id: user.id,
          type: 'swap',
          title: 'Swap Completed',
          message: `Successfully swapped ${amount} ${fromAsset} to ${toAmountNum.toFixed(8)} ${toAsset}`,
          read: false
        }
      ])

      alert('Swap completed successfully!')
      setFromAmount('')
      setToAmount('')
      fetchUserBalances()
    } catch (error: any) {
      console.error('Swap error:', error)
      setError(error.message || 'Failed to complete swap')
    } finally {
      setSwapping(false)
    }
  }

  const handleFlipAssets = () => {
    setFromAsset(toAsset)
    setToAsset(fromAsset)
    setFromAmount(toAmount)
  }

  return (
    <div className="glass-effect rounded-2xl p-6 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Swap Crypto</h2>
        <button
          onClick={fetchPrices}
          className="p-2 rounded-xl glass-effect hover:bg-white/10 transition-all"
        >
          <RefreshCw className="w-4 h-4 text-white" />
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* FROM */}
      <div className="mb-4">
        <label className="block text-sm text-gray-400 mb-2">From</label>
        <div className="glass-effect rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <select
              value={fromAsset}
              onChange={(e) => setFromAsset(e.target.value)}
              className="bg-transparent text-white text-lg font-bold focus:outline-none"
            >
              {SUPPORTED_COINS.map(coin => (
                <option key={coin.symbol} value={coin.symbol} className="bg-gray-900">
                  {coin.icon} {coin.symbol}
                </option>
              ))}
            </select>
            <input
              type="number"
              value={fromAmount}
              onChange={(e) => setFromAmount(e.target.value)}
              placeholder="0.00"
              className="bg-transparent text-white text-right text-2xl font-bold focus:outline-none w-1/2"
              step="any"
            />
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">
              ${prices[fromAsset]?.toLocaleString() || '0.00'}
            </span>
            <span className="text-gray-400">
              Balance: {getBalance(fromAsset).toFixed(8)}
            </span>
          </div>
        </div>
      </div>

      {/* SWAP BUTTON */}
      <div className="flex justify-center -my-2 relative z-10">
        <button
          onClick={handleFlipAssets}
          className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 transition-all"
        >
          <ArrowDownUp className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* TO */}
      <div className="mb-6">
        <label className="block text-sm text-gray-400 mb-2">To</label>
        <div className="glass-effect rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <select
              value={toAsset}
              onChange={(e) => setToAsset(e.target.value)}
              className="bg-transparent text-white text-lg font-bold focus:outline-none"
            >
              {SUPPORTED_COINS.map(coin => (
                <option key={coin.symbol} value={coin.symbol} className="bg-gray-900">
                  {coin.icon} {coin.symbol}
                </option>
              ))}
            </select>
            <div className="text-white text-right text-2xl font-bold">
              {toAmount || '0.00'}
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">
              ${prices[toAsset]?.toLocaleString() || '0.00'}
            </span>
            <span className="text-gray-400">
              Balance: {getBalance(toAsset).toFixed(8)}
            </span>
          </div>
        </div>
      </div>

      {/* Exchange Rate */}
      {fromAmount && prices[fromAsset] && prices[toAsset] && (
        <div className="mb-6 p-4 glass-effect rounded-xl">
          <div className="text-sm text-gray-400 mb-1">Exchange Rate</div>
          <div className="text-white font-medium">
            1 {fromAsset} = {(prices[toAsset] / prices[fromAsset]).toFixed(8)} {toAsset}
          </div>
        </div>
      )}

      {/* SWAP BUTTON */}
      <button
        onClick={handleSwap}
        disabled={swapping || !fromAmount || !toAmount}
        className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {swapping ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Swapping...</span>
          </>
        ) : (
          <span>Swap</span>
        )}
      </button>
    </div>
  )
}
