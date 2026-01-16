'use client'

import { useState, useEffect } from 'react'
import { ArrowDownCircle, Loader2, DollarSign, Bitcoin, AlertCircle, TrendingUp } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { getCryptoPrices } from '@/lib/api/coingecko'
import { motion } from 'framer-motion'

interface CryptoPrice {
  price: number
  change24h: number
  marketCap?: number
}

interface CryptoPrices {
  [key: string]: CryptoPrice
}

export default function Deposit() {
  const [selectedAsset, setSelectedAsset] = useState('BTC')
  const [usdAmount, setUsdAmount] = useState('')
  const [cryptoAmount, setCryptoAmount] = useState('0.00000000')
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer')
  const [paymentProof, setPaymentProof] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [cryptoPrices, setCryptoPrices] = useState<CryptoPrices>({})
  const [pricesLoading, setPricesLoading] = useState(true)
  const [uploadingProof, setUploadingProof] = useState(false)

  useEffect(() => {
    fetchPrices()
    const interval = setInterval(fetchPrices, 30000) // Update every 30 seconds
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    calculateCryptoAmount()
  }, [usdAmount, selectedAsset, cryptoPrices])

  const fetchPrices = async () => {
    try {
      // Use your existing API route
      const prices = await getCryptoPrices(['BTC', 'ETH', 'USDT', 'SOL', 'ADA', 'BNB', 'XRP', 'DOGE'])
      
      console.log('Fetched crypto prices from API:', prices)
      
      // Add USD (1:1 conversion)
      const pricesWithUSD = {
        ...prices,
        USD: { price: 1, change24h: 0, marketCap: 0 }
      }
      
      setCryptoPrices(pricesWithUSD)
      setPricesLoading(false)
    } catch (error) {
      console.error('Error fetching prices:', error)
      // Set fallback prices
      setCryptoPrices({
        BTC: { price: 42000, change24h: 0 },
        ETH: { price: 3300, change24h: 0 },
        USDT: { price: 1, change24h: 0 },
        USD: { price: 1, change24h: 0 }
      })
      setPricesLoading(false)
    }
  }

  // ✅ ACCURATE USD TO CRYPTO CONVERSION using your API
  const calculateCryptoAmount = () => {
    const usd = parseFloat(usdAmount) || 0
    const priceData = cryptoPrices[selectedAsset]
    const price = priceData?.price || 1
    
    if (selectedAsset === 'USD') {
      // USD to USD = 1:1
      setCryptoAmount(usd.toFixed(2))
    } else {
      // USD to Crypto = USD / Market Price
      const crypto = usd / price
      setCryptoAmount(crypto.toFixed(8))
    }
    
    console.log('Conversion using API price:', {
      usdAmount: usd,
      selectedAsset,
      marketPrice: price,
      cryptoAmount: usd / price,
      priceChange24h: priceData?.change24h || 0
    })
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
    if (!validTypes.includes(file.type)) {
      alert('Please upload a valid image (JPG, PNG, WebP) or PDF file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB')
      return
    }

    setPaymentProof(file)
  }

  const uploadPaymentProof = async (file: File): Promise<string | null> => {
    try {
      setUploadingProof(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}.${fileExt}`

      const { data, error } = await supabase.storage
        .from('payment-proofs')
        .upload(fileName, file)

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from('payment-proofs')
        .getPublicUrl(fileName)

      return publicUrl
    } catch (error) {
      console.error('Error uploading proof:', error)
      return null
    } finally {
      setUploadingProof(false)
    }
  }

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const usd = parseFloat(usdAmount)
    const crypto = parseFloat(cryptoAmount)

    if (!usd || usd <= 0) {
      alert('Please enter a valid USD amount')
      return
    }

    if (!paymentProof) {
      alert('Please upload payment proof')
      return
    }

    if (crypto <= 0) {
      alert('Invalid crypto amount calculated. Please try again.')
      return
    }

    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Upload payment proof
      const proofUrl = await uploadPaymentProof(paymentProof)
      if (!proofUrl) throw new Error('Failed to upload payment proof')

      // Get current market price for the asset from your API
      const priceData = cryptoPrices[selectedAsset]
      const currentPrice = priceData?.price || 1

      console.log('Creating transaction with API price:', {
        asset: selectedAsset,
        usd_amount: usd,
        crypto_amount: crypto,
        market_price: currentPrice,
        price_change_24h: priceData?.change24h || 0
      })

      // ✅ CREATE TRANSACTION WITH ACCURATE VALUES
      const { error: txError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type: 'deposit',
          asset: selectedAsset,
          amount: crypto, // ✅ Accurate crypto amount (e.g., 0.00238 BTC)
          value_usd: usd, // ✅ Actual USD deposited (e.g., $100)
          status: 'pending',
          payment_method: paymentMethod,
          payment_proof_url: proofUrl
        })

      if (txError) throw txError

      // Send notification
      await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          type: 'deposit',
          title: 'Deposit Submitted',
          message: `Your deposit of $${usd.toFixed(2)} (≈ ${crypto.toFixed(8)} ${selectedAsset}) has been submitted and is pending approval.`,
          read: false
        })

      alert(`✅ Deposit submitted successfully!

USD Amount: $${usd.toFixed(2)}
${selectedAsset} Amount: ${crypto.toFixed(8)} ${selectedAsset}
Current Price: $${currentPrice.toLocaleString()}

Please wait for admin approval.`)
      
      // Reset form
      setUsdAmount('')
      setCryptoAmount('0.00000000')
      setPaymentProof(null)
      
      // Reload page to show pending transaction
      window.location.reload()
      
    } catch (error: any) {
      console.error('Deposit error:', error)
      alert(`Error: ${error.message || 'Failed to submit deposit'}`)
    } finally {
      setLoading(false)
    }
  }

  const currentPrice = cryptoPrices[selectedAsset]?.price || 1
  const priceChange = cryptoPrices[selectedAsset]?.change24h || 0
  const isPriceUp = priceChange >= 0

  return (
    <div className="max-w-2xl mx-auto">
      <div className="glass-effect rounded-2xl p-8 border border-white/10">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
            <ArrowDownCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Deposit Funds</h2>
            <p className="text-gray-400">Add funds to your account</p>
          </div>
        </div>

        <form onSubmit={handleDeposit} className="space-y-6">
          {/* Asset Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Select Asset
            </label>
            <div className="grid grid-cols-4 gap-3">
              {['BTC', 'ETH', 'USDT', 'USD'].map((asset) => {
                const assetPrice = cryptoPrices[asset]?.price || 1
                return (
                  <button
                    key={asset}
                    type="button"
                    onClick={() => setSelectedAsset(asset)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      selectedAsset === asset
                        ? 'border-purple-500 bg-purple-500/20'
                        : 'border-white/10 bg-white/5 hover:border-white/20'
                    }`}
                  >
                    <p className="text-white font-bold text-lg">{asset}</p>
                    {!pricesLoading && (
                      <p className="text-gray-400 text-xs mt-1">
                        ${assetPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </p>
                    )}
                  </button>
                )
              })}
            </div>
            
            {/* Live Price Display */}
            {!pricesLoading && selectedAsset !== 'USD' && (
              <div className="mt-3 p-3 rounded-lg bg-white/5 border border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Current {selectedAsset} Price</span>
                  <div className="text-right">
                    <p className="text-white font-bold">
                      ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className={`text-xs flex items-center justify-end gap-1 ${isPriceUp ? 'text-green-400' : 'text-red-400'}`}>
                      <TrendingUp className={`w-3 h-3 ${!isPriceUp && 'rotate-180'}`} />
                      {isPriceUp ? '+' : ''}{priceChange.toFixed(2)}% (24h)
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* USD Amount Input (Primary) */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              USD Amount (How much you're depositing)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="number"
                value={usdAmount}
                onChange={(e) => setUsdAmount(e.target.value)}
                placeholder="0.00"
                min="1"
                step="0.01"
                className="w-full pl-12 pr-4 py-4 rounded-xl bg-white/5 border border-white/10 text-white text-lg font-bold focus:outline-none focus:border-purple-500 transition-all"
                required
              />
            </div>
            <p className="text-gray-400 text-xs mt-2">
              Enter the exact USD amount you're depositing
            </p>
          </div>

          {/* Crypto Amount Display (Calculated) */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              You Will Receive
            </label>
            <div className="relative">
              <Bitcoin className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-400" />
              <input
                type="text"
                value={cryptoAmount}
                readOnly
                className="w-full pl-12 pr-20 py-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 text-lg font-bold cursor-not-allowed"
              />
              <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-purple-400 font-bold">
                {selectedAsset}
              </span>
            </div>
            <p className="text-gray-400 text-xs mt-2">
              {selectedAsset === 'USD' 
                ? 'USD to USD conversion (1:1)'
                : `Calculated: $${usdAmount || '0'} ÷ $${currentPrice.toLocaleString()} = ${cryptoAmount} ${selectedAsset}`
              }
            </p>
          </div>

          {/* Conversion Summary */}
          {parseFloat(usdAmount) > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20"
            >
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-blue-400 font-medium text-sm mb-2">Deposit Summary:</p>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">USD Depositing:</span>
                      <span className="text-white font-bold">${parseFloat(usdAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">{selectedAsset} Receiving:</span>
                      <span className="text-white font-bold">{cryptoAmount} {selectedAsset}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Current Price:</span>
                      <span className="text-white">${currentPrice.toLocaleString()}</span>
                    </div>
                    <div className="border-t border-blue-500/20 pt-2 mt-2">
                      <div className="flex justify-between items-start">
                        <span className="text-xs text-gray-400">Your portfolio will show:</span>
                        <div className="text-right">
                          <p className="text-white font-bold text-sm">${parseFloat(usdAmount).toLocaleString()} invested</p>
                          <p className="text-gray-400 text-xs">{cryptoAmount} {selectedAsset}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500"
              required
            >
              <option value="bank_transfer">Bank Transfer</option>
              <option value="wire_transfer">Wire Transfer</option>
              <option value="crypto_transfer">Crypto Transfer</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Payment Proof Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Payment Proof
            </label>
            <div className="relative">
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileUpload}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-purple-500 file:text-white file:cursor-pointer hover:file:bg-purple-600"
                required
              />
            </div>
            {paymentProof && (
              <p className="text-green-400 text-sm mt-2">
                ✓ {paymentProof.name} uploaded
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || uploadingProof || !paymentProof || !usdAmount || parseFloat(cryptoAmount) <= 0}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {loading || uploadingProof ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>{uploadingProof ? 'Uploading proof...' : 'Processing...'}</span>
              </>
            ) : (
              <>
                <ArrowDownCircle className="w-5 h-5" />
                <span>Submit Deposit</span>
              </>
            )}
          </button>
        </form>

        {/* Important Notes */}
        <div className="mt-6 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
          <p className="text-yellow-400 text-sm font-medium mb-2">📝 Important Notes:</p>
          <ul className="text-gray-400 text-xs space-y-1">
            <li>• Enter the exact USD amount you're depositing</li>
            <li>• Crypto amount is auto-calculated at current market price</li>
            <li>• Your portfolio will track USD invested accurately</li>
            <li>• Deposits require admin approval (1-24 hours)</li>
            <li>• Upload clear payment proof for faster processing</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
