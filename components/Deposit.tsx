'use client'

import { useState, useEffect } from 'react'
import { ArrowDownCircle, Loader2, DollarSign, Bitcoin, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { motion } from 'framer-motion'

interface CryptoPrice {
  usd: number
  usd_24h_change: number
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
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether&vs_currencies=usd&include_24hr_change=true'
      )
      const data = await response.json()
      
      setCryptoPrices({
        BTC: data.bitcoin || { usd: 42000, usd_24h_change: 0 },
        ETH: data.ethereum || { usd: 3300, usd_24h_change: 0 },
        USDT: data.tether || { usd: 1, usd_24h_change: 0 },
        USD: { usd: 1, usd_24h_change: 0 }
      })
      setPricesLoading(false)
    } catch (error) {
      console.error('Error fetching prices:', error)
      // Set fallback prices
      setCryptoPrices({
        BTC: { usd: 42000, usd_24h_change: 0 },
        ETH: { usd: 3300, usd_24h_change: 0 },
        USDT: { usd: 1, usd_24h_change: 0 },
        USD: { usd: 1, usd_24h_change: 0 }
      })
      setPricesLoading(false)
    }
  }

  const calculateCryptoAmount = () => {
    const usd = parseFloat(usdAmount) || 0
    const price = cryptoPrices[selectedAsset]?.usd || 1
    
    if (selectedAsset === 'USD') {
      setCryptoAmount(usd.toFixed(2))
    } else {
      const crypto = usd / price
      setCryptoAmount(crypto.toFixed(8))
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
    if (!validTypes.includes(file.type)) {
      alert('Please upload a valid image (JPG, PNG, WebP) or PDF file')
      return
    }

    // Validate file size (max 5MB)
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

    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Upload payment proof
      const proofUrl = await uploadPaymentProof(paymentProof)
      if (!proofUrl) throw new Error('Failed to upload payment proof')

      // Get current price for the asset
      const currentPrice = cryptoPrices[selectedAsset]?.usd || 1

      // Create transaction with ACCURATE values
      const { error: txError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type: 'deposit',
          asset: selectedAsset,
          amount: crypto, // Crypto amount (e.g., 0.212 ETH)
          value_usd: usd, // Actual USD amount (e.g., $700)
          status: 'pending',
          payment_method: paymentMethod,
          payment_proof_url: proofUrl,
          // Store the price at time of deposit for reference
          metadata: {
            price_at_deposit: currentPrice,
            usd_deposited: usd,
            crypto_amount: crypto
          }
        })

      if (txError) throw txError

      // Send notification
      await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          type: 'deposit',
          title: 'Deposit Submitted',
          message: `Your deposit of $${usd} (≈ ${crypto} ${selectedAsset}) has been submitted and is pending approval.`,
          read: false
        })

      alert(`Deposit submitted successfully!\n\nUSD Amount: $${usd}\nCrypto Amount: ${crypto} ${selectedAsset}\n\nPlease wait for admin approval.`)
      
      // Reset form
      setUsdAmount('')
      setCryptoAmount('0.00000000')
      setPaymentProof(null)
      
    } catch (error: any) {
      console.error('Deposit error:', error)
      alert(`Error: ${error.message || 'Failed to submit deposit'}`)
    } finally {
      setLoading(false)
    }
  }

  const currentPrice = cryptoPrices[selectedAsset]?.usd || 1
  const priceChange = cryptoPrices[selectedAsset]?.usd_24h_change || 0
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
              {['BTC', 'ETH', 'USDT', 'USD'].map((asset) => (
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
                      ${currentPrice.toLocaleString()}
                    </p>
                  )}
                </button>
              ))}
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
                    <p className={`text-xs ${isPriceUp ? 'text-green-400' : 'text-red-400'}`}>
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
              Enter the actual USD amount you're depositing
            </p>
          </div>

          {/* Crypto Amount Display (Calculated) */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              You Will Receive (Approximate)
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
              Based on current market price of ${currentPrice.toLocaleString()}
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
                <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-blue-400 font-medium text-sm mb-2">Deposit Summary:</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">USD Amount:</span>
                      <span className="text-white font-bold">${parseFloat(usdAmount).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Crypto Amount:</span>
                      <span className="text-white font-bold">{cryptoAmount} {selectedAsset}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Current Price:</span>
                      <span className="text-white">${currentPrice.toLocaleString()}</span>
                    </div>
                    <div className="border-t border-blue-500/20 pt-2 mt-2">
                      <p className="text-xs text-gray-400">
                        Your portfolio will show: <span className="text-white font-bold">${parseFloat(usdAmount).toLocaleString()} invested</span>
                      </p>
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
            disabled={loading || uploadingProof || !paymentProof || !usdAmount}
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
          <p className="text-yellow-400 text-sm font-medium mb-2">Important Notes:</p>
          <ul className="text-gray-400 text-xs space-y-1">
            <li>• Enter the exact USD amount you're depositing</li>
            <li>• Crypto amount is calculated based on current market price</li>
            <li>• Your portfolio will track the USD invested accurately</li>
            <li>• Deposits require admin approval (typically 1-24 hours)</li>
            <li>• Upload clear payment proof for faster processing</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
