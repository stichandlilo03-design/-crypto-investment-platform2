'use client'

import { useState, useEffect } from 'react'
import { ArrowDownCircle, Loader2, DollarSign, Bitcoin, AlertCircle, TrendingUp, Upload } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'  // ✅ ADD THIS

export default function DepositPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()  // ✅ ADD THIS
  
  const [selectedAsset, setSelectedAsset] = useState('BTC')
  const [usdAmount, setUsdAmount] = useState('')
  const [cryptoAmount, setCryptoAmount] = useState('0.00000000')
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer')
  const [paymentProof, setPaymentProof] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [cryptoPrices, setCryptoPrices] = useState<any>({})
  const [pricesLoading, setPricesLoading] = useState(true)
  const [uploadingProof, setUploadingProof] = useState(false)

  // ✅ ADD AUTH CHECK
  useEffect(() => {
    if (authLoading) return
    
    if (!user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    fetchPrices()
    const interval = setInterval(fetchPrices, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    calculateCryptoAmount()
  }, [usdAmount, selectedAsset, cryptoPrices])

  const fetchPrices = async () => {
    try {
      const response = await fetch('/api/crypto-prices')
      const data = await response.json()
      
      if (data.success) {
        console.log('✅ PRICES LOADED:', data.prices)
        setCryptoPrices(data.prices)
      } else {
        throw new Error('Failed to fetch prices')
      }
      
      setPricesLoading(false)
    } catch (error) {
      console.error('❌ Error fetching prices:', error)
      setCryptoPrices({
        BTC: { price: 95234, change24h: 0 },
        ETH: { price: 3300, change24h: 0 },
        USDT: { price: 1, change24h: 0 },
        USD: { price: 1, change24h: 0 }
      })
      setPricesLoading(false)
    }
  }

  const calculateCryptoAmount = () => {
    const usd = parseFloat(usdAmount) || 0
    const priceData = cryptoPrices[selectedAsset]
    const price = priceData?.price || 1
    
    if (selectedAsset === 'USD') {
      setCryptoAmount(usd.toFixed(2))
    } else {
      const crypto = usd / price
      setCryptoAmount(crypto.toFixed(8))
    }
    
    console.log('💰 CONVERSION CALCULATED:', {
      usdInput: usd,
      asset: selectedAsset,
      marketPrice: price,
      cryptoCalculated: usd / price,
      cryptoAmountString: (usd / price).toFixed(8)
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
    console.log('📎 Payment proof selected:', file.name)
  }

  const uploadPaymentProof = async (file: File): Promise<string | null> => {
    try {
      setUploadingProof(true)
      
      if (!user) throw new Error('User not authenticated')

      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}.${fileExt}`

      console.log('📤 Uploading payment proof...')
      
      const { data, error } = await supabase.storage
        .from('payment-proofs')
        .upload(fileName, file)

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from('payment-proofs')
        .getPublicUrl(fileName)

      console.log('✅ Payment proof uploaded:', publicUrl)
      return publicUrl
    } catch (error) {
      console.error('❌ Error uploading proof:', error)
      return null
    } finally {
      setUploadingProof(false)
    }
  }

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      alert('Please login first')
      router.push('/login')
      return
    }
    
    const usd = parseFloat(usdAmount)
    const crypto = parseFloat(cryptoAmount)

    console.log('🚀 DEPOSIT FORM SUBMITTED')
    console.log('📊 VALUES:', { usdAmount: usd, cryptoAmount: crypto, asset: selectedAsset })

    // ✅ CRITICAL VALIDATION
    if (!usd || usd <= 0) {
      alert('❌ Please enter a valid USD amount')
      return
    }

    if (!crypto || crypto <= 0) {
      alert('❌ Invalid crypto amount calculated. Please refresh and try again.')
      console.error('❌ CRYPTO AMOUNT IS ZERO OR INVALID:', crypto)
      return
    }

    if (!paymentProof) {
      alert('❌ Please upload payment proof')
      return
    }

    // ✅ VALIDATE CONVERSION
    const priceData = cryptoPrices[selectedAsset]
    const currentPrice = priceData?.price || 1
    const expectedCrypto = usd / currentPrice

    console.log('🔍 VALIDATION CHECK:', {
      usdAmount: usd,
      cryptoAmount: crypto,
      currentPrice,
      expectedCrypto,
      difference: Math.abs(crypto - expectedCrypto)
    })

    if (Math.abs(crypto - expectedCrypto) > 0.00000001 && selectedAsset !== 'USD') {
      alert('⚠️ Conversion error detected. Please refresh the page and try again.')
      console.error('❌ CONVERSION MISMATCH:', { crypto, expectedCrypto })
      return
    }

    setLoading(true)

    try {
      // Upload payment proof
      const proofUrl = await uploadPaymentProof(paymentProof)
      if (!proofUrl) throw new Error('Failed to upload payment proof')

      console.log('📤 CREATING TRANSACTION IN DATABASE:')
      console.log('   user_id:', user.id)
      console.log('   type: deposit')
      console.log('   asset:', selectedAsset)
      console.log('   amount (CRYPTO):', crypto, selectedAsset)
      console.log('   value_usd (USD):', usd)
      console.log('   status: pending')
      console.log('   currentPrice:', currentPrice)

      // ✅ CREATE TRANSACTION WITH CORRECT VALUES
      const { data: txData, error: txError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type: 'deposit',
          asset: selectedAsset,
          amount: crypto,      // ✅ CRYPTO AMOUNT
          value_usd: usd,      // ✅ USD AMOUNT
          status: 'pending',
          payment_method: paymentMethod,
          payment_proof_url: proofUrl
        })
        .select()
        .single()

      if (txError) {
        console.error('❌ DATABASE INSERT ERROR:', txError)
        throw txError
      }

      console.log('✅ TRANSACTION CREATED SUCCESSFULLY:', txData)
      console.log('   Stored amount:', txData.amount, selectedAsset)
      console.log('   Stored value_usd:', txData.value_usd)

      // Notification
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

💵 USD Amount: $${usd.toFixed(2)}
₿ ${selectedAsset} Amount: ${crypto.toFixed(8)} ${selectedAsset}
📊 Current Price: $${currentPrice.toLocaleString()}

⏳ Please wait for admin approval.`)
      
      setUsdAmount('')
      setCryptoAmount('0.00000000')
      setPaymentProof(null)
      
      // Redirect to dashboard
      setTimeout(() => router.push('/dashboard'), 1500)
      
    } catch (error: any) {
      console.error('❌ DEPOSIT ERROR:', error)
      alert(`Error: ${error.message || 'Failed to submit deposit'}`)
    } finally {
      setLoading(false)
    }
  }

  // ✅ SHOW LOADING WHILE CHECKING AUTH
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
      </div>
    )
  }

  // ✅ IF NOT LOGGED IN, DON'T SHOW FORM
  if (!user) {
    return null
  }

  const currentPrice = cryptoPrices[selectedAsset]?.price || 1
  const priceChange = cryptoPrices[selectedAsset]?.change24h || 0
  const isPriceUp = priceChange >= 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f] p-4 sm:p-8">
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

          {/* 🔍 DEBUG INFO */}
          {!pricesLoading && (
            <div className="mb-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <p className="text-blue-400 font-mono text-sm">
                🔍 DEBUG: {selectedAsset} Price = ${currentPrice.toLocaleString()}
              </p>
              <p className="text-blue-400 font-mono text-sm mt-1">
                💰 CALCULATION: ${usdAmount || '0'} ÷ ${currentPrice.toLocaleString()} = {cryptoAmount} {selectedAsset}
              </p>
              <p className="text-green-400 font-mono text-xs mt-2">
                ✅ This is what will be stored in database!
              </p>
            </div>
          )}

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

            {/* USD Input */}
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
                  className="w-full pl-12 pr-4 py-4 rounded-xl bg-white/5 border border-white/10 text-white text-lg font-bold focus:outline-none focus:border-purple-500"
                  required
                />
              </div>
            </div>

            {/* Crypto Display */}
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
            </div>

            {/* Summary */}
            {parseFloat(usdAmount) > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20"
              >
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-blue-400 font-medium text-sm mb-2">Summary:</p>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">USD:</span>
                        <span className="text-white font-bold">${parseFloat(usdAmount).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">{selectedAsset}:</span>
                        <span className="text-white font-bold">{cryptoAmount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Price:</span>
                        <span className="text-white">${currentPrice.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Payment Method</label>
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

            {/* Payment Proof */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Payment Proof</label>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileUpload}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-purple-500 file:text-white file:cursor-pointer"
                required
              />
              {paymentProof && (
                <p className="text-green-400 text-sm mt-2">✓ {paymentProof.name}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || uploadingProof || !paymentProof || !usdAmount}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold hover:opacity-90 disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {loading || uploadingProof ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{uploadingProof ? 'Uploading...' : 'Processing...'}</span>
                </>
              ) : (
                <>
                  <ArrowDownCircle className="w-5 h-5" />
                  <span>Submit Deposit</span>
                </>
              )}
            </button>
          </form>

          {/* Notes */}
          <div className="mt-6 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
            <p className="text-yellow-400 text-sm font-medium mb-2">📝 How it works:</p>
            <ul className="text-gray-400 text-xs space-y-1">
              <li>• Enter USD amount</li>
              <li>• System calculates crypto at market price</li>
              <li>• Admin approves (1-24 hours)</li>
              <li>• You receive exact crypto shown</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
