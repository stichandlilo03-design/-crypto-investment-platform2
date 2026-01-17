'use client'

import { useState, useEffect } from 'react'
import { ArrowDownUp, Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { motion } from 'framer-motion'

export default function SwapComponent() {
  const [fromAsset, setFromAsset] = useState('USD')
  const [toAsset, setToAsset] = useState('BTC')
  const [fromAmount, setFromAmount] = useState('')
  const [toAmount, setToAmount] = useState('0.00000000')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [cryptoPrices, setCryptoPrices] = useState<any>({})
  const [userBalances, setUserBalances] = useState<any[]>([])
  const [pricesLoading, setPricesLoading] = useState(true)

  const assets = [
    { symbol: 'USD', name: 'US Dollar' },
    { symbol: 'BTC', name: 'Bitcoin' },
    { symbol: 'ETH', name: 'Ethereum' },
    { symbol: 'USDT', name: 'Tether' },
    { symbol: 'SOL', name: 'Solana' },
    { symbol: 'ADA', name: 'Cardano' },
    { symbol: 'BNB', name: 'Binance Coin' },
    { symbol: 'XRP', name: 'Ripple' },
    { symbol: 'DOGE', name: 'Dogecoin' }
  ]

  useEffect(() => {
    fetchUserBalances()
    fetchPrices()
    const interval = setInterval(fetchPrices, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    calculateToAmount()
  }, [fromAmount, fromAsset, toAsset, cryptoPrices])

  const fetchUserBalances = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('user_balances')
        .select('*')
        .eq('user_id', user.id)

      if (!error && data) {
        setUserBalances(data)
      }
    } catch (error) {
      console.error('Error fetching balances:', error)
    }
  }

  const fetchPrices = async () => {
    try {
      const response = await fetch('/api/crypto-prices?symbols=BTC,ETH,USDT,SOL,ADA,BNB,XRP,DOGE,USD')
      const data = await response.json()
      
      if (data.success) {
        const prices = { ...data.prices }
        if (!prices.USD) {
          prices.USD = { price: 1, change24h: 0 }
        }
        setCryptoPrices(prices)
      }
      setPricesLoading(false)
    } catch (error) {
      console.error('Error fetching prices:', error)
      setCryptoPrices({
        USD: { price: 1, change24h: 0 },
        BTC: { price: 95000, change24h: 2.5 },
        ETH: { price: 3300, change24h: 1.8 },
        USDT: { price: 1, change24h: 0 },
        SOL: { price: 145, change24h: 3.2 },
        ADA: { price: 0.85, change24h: 1.5 },
        BNB: { price: 610, change24h: 2.1 },
        XRP: { price: 2.15, change24h: 4.2 },
        DOGE: { price: 0.32, change24h: 5.8 }
      })
      setPricesLoading(false)
    }
  }

  const getAssetPrice = (asset: string): number => {
    if (asset === 'USD') return 1
    return cryptoPrices[asset]?.price || 0
  }

  const getAvailableBalance = (asset: string): number => {
    const balance = userBalances.find(b => b.asset === asset)
    return balance ? Number(balance.amount) : 0
  }

  const calculateToAmount = () => {
    const from = parseFloat(fromAmount) || 0
    
    if (from <= 0) {
      setToAmount('0.00000000')
      return
    }

    const fromPrice = getAssetPrice(fromAsset)
    const toPrice = getAssetPrice(toAsset)

    if (fromPrice > 0 && toPrice > 0) {
      const usdValue = from * fromPrice
      const toAmountCalc = usdValue / toPrice
      setToAmount(toAmountCalc.toFixed(8))
    }
  }

  const handleSwap = async () => {
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const fromAmountNum = parseFloat(fromAmount)
      const toAmountNum = parseFloat(toAmount)

      if (!fromAmountNum || fromAmountNum <= 0) {
        throw new Error('Invalid from amount')
      }

      if (!toAmountNum || toAmountNum <= 0) {
        throw new Error('Invalid to amount - please wait for price calculation')
      }

      const availableBalance = getAvailableBalance(fromAsset)
      if (fromAmountNum > availableBalance) {
        throw new Error(`Insufficient ${fromAsset} balance. Available: ${availableBalance.toFixed(8)}`)
      }

      const fromPrice = getAssetPrice(fromAsset)
      const toPrice = getAssetPrice(toAsset)
      const usdValue = fromAmountNum * fromPrice

      const { error: swapError } = await supabase
        .from('swap_transactions')
        .insert({
          user_id: user.id,
          from_asset: fromAsset,
          to_asset: toAsset,
          from_amount: fromAmountNum,
          to_amount: toAmountNum,
          from_price: fromPrice,
          to_price: toPrice,
          value_usd: usdValue,
          exchange_rate: toPrice > 0 ? fromPrice / toPrice : 0,
          status: 'completed'
        })

      if (swapError) throw swapError

      const { data: fromBalance } = await supabase
        .from('user_balances')
        .select('*')
        .eq('user_id', user.id)
        .eq('asset', fromAsset)
        .single()

      if (fromBalance) {
        const newFromAmount = Number(fromBalance.amount) - fromAmountNum
        
        if (newFromAmount < 0) {
          throw new Error('Insufficient balance')
        }

        if (newFromAmount > 0.00000001) {
          await supabase
            .from('user_balances')
            .update({ amount: newFromAmount })
            .eq('user_id', user.id)
            .eq('asset', fromAsset)
        } else {
          await supabase
            .from('user_balances')
            .delete()
            .eq('user_id', user.id)
            .eq('asset', fromAsset)
        }
      }

      const { data: toBalance } = await supabase
        .from('user_balances')
        .select('*')
        .eq('user_id', user.id)
        .eq('asset', toAsset)
        .single()

      if (toBalance) {
        const existingAmount = Number(toBalance.amount)
        const existingAvgPrice = Number(toBalance.average_buy_price)
        const newTotalAmount = existingAmount + toAmountNum

        const existingValue = existingAmount * existingAvgPrice
        const newValue = toAmountNum * toPrice
        const newAvgPrice = (existingValue + newValue) / newTotalAmount

        await supabase
          .from('user_balances')
          .update({
            amount: newTotalAmount,
            average_buy_price: newAvgPrice
          })
          .eq('user_id', user.id)
          .eq('asset', toAsset)
      } else {
        await supabase
          .from('user_balances')
          .insert({
            user_id: user.id,
            asset: toAsset,
            amount: toAmountNum,
            average_buy_price: toPrice
          })
      }

      await supabase.from('notifications').insert({
        user_id: user.id,
        type: 'swap',
        title: 'Swap Completed Successfully',
        message: `✅ Swapped ${fromAmountNum.toFixed(8)} ${fromAsset} → ${toAmountNum.toFixed(8)} ${toAsset}`,
        read: false
      })

      setSuccess(true)
      setFromAmount('')
      setToAmount('0.00000000')

      setTimeout(() => {
        setSuccess(false)
        window.location.reload()
      }, 2000)

    } catch (error: any) {
      console.error('Swap error:', error)
      setError(error.message || 'Swap failed')
    } finally {
      setLoading(false)
    }
  }

  const handleFlipAssets = () => {
    const temp = fromAsset
    setFromAsset(toAsset)
    setToAsset(temp)
  }

  if (pricesLoading) {
    return (
      <div className="glass-effect rounded-2xl p-8 border border-white/10 text-center">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin mx-auto mb-2" />
        <p className="text-gray-400">Loading prices...</p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-lg mx-auto px-4">
      <div className="glass-effect rounded-2xl p-6 sm:p-8 border border-white/10">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
            <ArrowDownUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">Swap Assets</h2>
            <p className="text-sm text-gray-400">Exchange one crypto for another</p>
          </div>
        </div>

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl bg-green-500/20 border border-green-500/30 flex items-start space-x-3"
          >
            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
            <div>
              <p className="text-green-400 font-medium text-sm">Swap completed successfully!</p>
              <p className="text-green-300 text-xs mt-1">Your portfolio has been updated</p>
            </div>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl bg-red-500/20 border border-red-500/30 flex items-start space-x-3"
          >
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-red-400 text-sm">{error}</p>
          </motion.div>
        )}

        <div className="space-y-4">
          <div className="p-4 sm:p-6 rounded-xl bg-white/5 border border-white/10">
            <label className="block text-sm font-medium text-gray-400 mb-3">From</label>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-3">
              <select
                value={fromAsset}
                onChange={(e) => setFromAsset(e.target.value)}
                className="w-full sm:w-auto px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500"
              >
                {assets.map(asset => (
                  <option key={asset.symbol} value={asset.symbol}>
                    {asset.symbol} - {asset.name}
                  </option>
                ))}
              </select>
              
              <input
                type="number"
                value={fromAmount}
                onChange={(e) => setFromAmount(e.target.value)}
                placeholder="0.00000000"
                step="0.00000001"
                min="0"
                className="flex-1 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-right text-sm sm:text-base font-bold focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-gray-400 truncate">Available: {getAvailableBalance(fromAsset).toFixed(8)} {fromAsset}</span>
              <span className="text-gray-400 flex-shrink-0 ml-2">
                ${(getAssetPrice(fromAsset) * (parseFloat(fromAmount) || 0)).toFixed(2)}
              </span>
            </div>
          </div>

          <div className="flex justify-center -my-2">
            <button
              type="button"
              onClick={handleFlipAssets}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center hover:scale-110 transition-transform shadow-lg touch-manipulation"
            >
              <ArrowDownUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </button>
          </div>

          <div className="p-4 sm:p-6 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
            <label className="block text-sm font-medium text-gray-400 mb-3">To</label>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-3">
              <select
                value={toAsset}
                onChange={(e) => setToAsset(e.target.value)}
                className="w-full sm:w-auto px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500"
              >
                {assets.map(asset => (
                  <option key={asset.symbol} value={asset.symbol}>
                    {asset.symbol} - {asset.name}
                  </option>
                ))}
              </select>
              
              <input
                type="text"
                value={toAmount}
                readOnly
                className="flex-1 px-3 py-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 text-right text-sm sm:text-base font-bold"
              />
            </div>

            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-gray-400 truncate">Balance: {getAvailableBalance(toAsset).toFixed(8)} {toAsset}</span>
              <span className="text-gray-400 flex-shrink-0 ml-2">
                ${(getAssetPrice(toAsset) * parseFloat(toAmount)).toFixed(2)}
              </span>
            </div>
          </div>

          {parseFloat(fromAmount) > 0 && (
            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-blue-400 font-medium text-xs sm:text-sm mb-2">Exchange Rate:</p>
                  <div className="space-y-1.5 text-xs sm:text-sm">
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-gray-400 whitespace-nowrap">1 {fromAsset} =</span>
                      <span className="text-white font-bold text-right break-all">
                        {(getAssetPrice(fromAsset) / getAssetPrice(toAsset)).toFixed(8)} {toAsset}
                      </span>
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-gray-400 whitespace-nowrap">USD Value:</span>
                      <span className="text-white font-bold">
                        ${(parseFloat(fromAmount) * getAssetPrice(fromAsset)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleSwap}
            disabled={loading || !fromAmount || parseFloat(fromAmount) <= 0}
            className="w-full py-3.5 sm:py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-all text-sm sm:text-base touch-manipulation"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <ArrowDownUp className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Swap {fromAsset} for {toAsset}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
