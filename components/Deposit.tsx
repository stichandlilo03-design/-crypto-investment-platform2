'use client'

import { useState, useEffect } from 'react'
import { ArrowDownCircle, Loader2, DollarSign, Bitcoin, AlertCircle, TrendingUp, Copy, CheckCircle, Building, Wallet } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { motion } from 'framer-motion'

// 🔧 DEMO WALLET ADDRESSES - Replace with your actual wallet addresses
const CRYPTO_WALLETS = {
  BTC: 'bc1qjwpl49rh53p3s7euxq9t074mfxmtxue70rzve6',
  ETH: '0xba99397e779F619FbEaAc6f1924f2F0cd79134EA',
  USDT: '0xba99397e779F619FbEaAc6f1924f2F0cd79134EA',
  SOL: '7EcDhSYGxXyscszYEp35KHN8vvw3svAuLKTzXwCFLtV',
  ADA: 'addr1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlhxu56se8d2v',
  BNB: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
  XRP: 'rEb8TK3gBgk5auZkwc6sHnwrGVJH8DuaLh',
  DOGE: 'DH5yaieqoZN36fDVciNyRueRGvGLR3mr7L'
}

// 🏦 BANK TRANSFER DETAILS - Replace with your actual bank details
const BANK_INFO = {
  bankName: 'Sofi Bank',
  accountName: 'CryptoVault Holdings LLC',
  accountNumber: '1234567890',
  routingNumber: '021000021',
  swiftCode: 'CHASUS33',
  iban: 'US12 BANK 0000 1234 5678 90',
  bankAddress: '270 Park Avenue, New York, NY 10017, USA'
}

export default function Deposit() {
  const [selectedAsset, setSelectedAsset] = useState('BTC')
  const [usdAmount, setUsdAmount] = useState('')
  const [cryptoAmount, setCryptoAmount] = useState('0.00000000')
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer')
  const [paymentProof, setPaymentProof] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [cryptoPrices, setCryptoPrices] = useState<any>({})
  const [pricesLoading, setPricesLoading] = useState(true)
  const [uploadingProof, setUploadingProof] = useState(false)
  const [copied, setCopied] = useState('')
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    fetchUser()
    fetchPrices()
    const interval = setInterval(fetchPrices, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    calculateCryptoAmount()
  }, [usdAmount, selectedAsset, cryptoPrices])

  const fetchUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setCurrentUser(user)
  }

  const fetchPrices = async () => {
    try {
      // ✅ Use server-side API route to avoid CORS/rate limit
      const response = await fetch('/api/crypto-prices?symbols=BTC,ETH,USDT,SOL,ADA,BNB,XRP,DOGE')
      const data = await response.json()
      
      if (data.success) {
        console.log('✅ Fetched prices:', data.prices)
        setCryptoPrices(data.prices)
      } else {
        throw new Error(data.error)
      }
      
      setPricesLoading(false)
    } catch (error) {
      console.error('Error fetching prices:', error)
      // Fallback prices
      setCryptoPrices({
        BTC: { price: 42000, change24h: 0 },
        ETH: { price: 3300, change24h: 0 },
        USDT ERC 20: { price: 1, change24h: 0 },
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
    
    console.log('💰 CONVERSION:', {
      usdInput: usd,
      asset: selectedAsset,
      marketPrice: price,
      cryptoCalculated: usd / price
    })
  }

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(''), 2000)
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

    console.log('🔍 FORM SUBMISSION:', {
      usdAmount: usd,
      cryptoAmount: crypto,
      asset: selectedAsset
    })

    // ✅ CRITICAL VALIDATION
    if (!usd || usd <= 0) {
      alert('❌ Please enter a valid USD amount')
      return
    }

    if (!crypto || crypto <= 0) {
      alert('❌ Invalid crypto amount calculated. Please refresh and try again.')
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
      return
    }

    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Upload payment proof
      const proofUrl = await uploadPaymentProof(paymentProof)
      if (!proofUrl) throw new Error('Failed to upload payment proof')

      console.log('📤 CREATING TRANSACTION:', {
        user_id: user.id,
        type: 'deposit',
        asset: selectedAsset,
        amount: crypto,  // ✅ CRYPTO AMOUNT
        value_usd: usd,  // ✅ USD AMOUNT
        status: 'pending',
        currentPrice
      })

      // ✅ INSERT TRANSACTION
      const { data: txData, error: txError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type: 'deposit',
          asset: selectedAsset,
          amount: crypto,      // ✅ Crypto (0.00238 BTC)
          value_usd: usd,      // ✅ USD ($100)
          status: 'pending',
          payment_method: paymentMethod,
          payment_proof_url: proofUrl
        })
        .select()
        .single()

      if (txError) {
        console.error('❌ INSERT ERROR:', txError)
        throw txError
      }

      console.log('✅ TRANSACTION CREATED IN DB:', txData)

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

      alert(`✅ Deposit submitted!

💵 USD: $${usd.toFixed(2)}
₿ ${selectedAsset}: ${crypto.toFixed(8)}
📊 Price: $${currentPrice.toLocaleString()}

⏳ Waiting for admin approval.`)
      
      setUsdAmount('')
      setCryptoAmount('0.00000000')
      setPaymentProof(null)
      
      setTimeout(() => window.location.reload(), 1000)
      
    } catch (error: any) {
      console.error('❌ DEPOSIT ERROR:', error)
      alert(`Error: ${error.message || 'Failed to submit deposit'}`)
    } finally {
      setLoading(false)
    }
  }

  const currentPrice = cryptoPrices[selectedAsset]?.price || 1
  const priceChange = cryptoPrices[selectedAsset]?.change24h || 0
  const isPriceUp = priceChange >= 0

  return (
    <div className="max-w-4xl mx-auto">
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

        {/* Debug Info */}
        {!pricesLoading && (
          <div className="mb-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs">
            <p className="text-blue-400 font-mono">
              🔍 {selectedAsset} Price: ${currentPrice.toLocaleString()} | 
              ${usdAmount || '0'} ÷ ${currentPrice.toLocaleString()} = {cryptoAmount} {selectedAsset}
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
              USD Amount
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
                className="w-full pl-12 pr-20 py-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 text-lg font-bold"
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

          {/* 🆕 PAYMENT DETAILS SECTION */}
          <div className="border-t border-white/10 pt-6">
            {selectedAsset === 'USD' ? (
              /* 🏦 BANK TRANSFER DETAILS */
              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-4">
                  <Building className="w-6 h-6 text-blue-400" />
                  <h3 className="text-xl font-bold text-white">Bank Transfer Details</h3>
                </div>

                <div className="p-6 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Bank Name */}
                    <div>
                      <p className="text-gray-400 text-xs uppercase tracking-wide mb-2">Bank Name</p>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                        <p className="text-white font-semibold">{BANK_INFO.bankName}</p>
                        <button
                          type="button"
                          onClick={() => handleCopy(BANK_INFO.bankName, 'bankName')}
                          className="text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          {copied === 'bankName' ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Account Name */}
                    <div>
                      <p className="text-gray-400 text-xs uppercase tracking-wide mb-2">Account Name</p>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                        <p className="text-white font-semibold">{BANK_INFO.accountName}</p>
                        <button
                          type="button"
                          onClick={() => handleCopy(BANK_INFO.accountName, 'accountName')}
                          className="text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          {copied === 'accountName' ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Account Number */}
                    <div>
                      <p className="text-gray-400 text-xs uppercase tracking-wide mb-2">Account Number</p>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                        <p className="text-white font-mono font-bold text-lg">{BANK_INFO.accountNumber}</p>
                        <button
                          type="button"
                          onClick={() => handleCopy(BANK_INFO.accountNumber, 'accountNumber')}
                          className="text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          {copied === 'accountNumber' ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Routing Number */}
                    <div>
                      <p className="text-gray-400 text-xs uppercase tracking-wide mb-2">Routing Number</p>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                        <p className="text-white font-mono font-bold text-lg">{BANK_INFO.routingNumber}</p>
                        <button
                          type="button"
                          onClick={() => handleCopy(BANK_INFO.routingNumber, 'routingNumber')}
                          className="text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          {copied === 'routingNumber' ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* SWIFT Code */}
                    <div>
                      <p className="text-gray-400 text-xs uppercase tracking-wide mb-2">SWIFT Code</p>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                        <p className="text-white font-mono font-bold text-lg">{BANK_INFO.swiftCode}</p>
                        <button
                          type="button"
                          onClick={() => handleCopy(BANK_INFO.swiftCode, 'swiftCode')}
                          className="text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          {copied === 'swiftCode' ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* IBAN */}
                    <div>
                      <p className="text-gray-400 text-xs uppercase tracking-wide mb-2">IBAN</p>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                        <p className="text-white font-mono font-bold">{BANK_INFO.iban}</p>
                        <button
                          type="button"
                          onClick={() => handleCopy(BANK_INFO.iban, 'iban')}
                          className="text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          {copied === 'iban' ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Payment Reference */}
                  <div className="pt-4 border-t border-blue-500/20">
                    <p className="text-gray-400 text-xs uppercase tracking-wide mb-2">⚠️ Payment Reference (IMPORTANT!)</p>
                    <div className="flex items-center justify-between p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                      <div>
                        <p className="text-yellow-400 font-medium text-sm mb-1">Always include in transfer:</p>
                        <p className="text-yellow-300 font-mono font-bold text-lg">{currentUser?.email || 'Your registered email'}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(currentUser?.email || '', 'email')}
                        className="text-yellow-400 hover:text-yellow-300 transition-colors"
                      >
                        {copied === 'email' ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* 💰 CRYPTO WALLET ADDRESS */
              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-4">
                  <Wallet className="w-6 h-6 text-purple-400" />
                  <h3 className="text-xl font-bold text-white">{selectedAsset} Deposit Address</h3>
                </div>

                <div className="p-6 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-gray-300 font-medium">Send {selectedAsset} to this address:</p>
                    {copied === 'wallet' && (
                      <span className="text-green-400 text-sm flex items-center space-x-1 animate-pulse">
                        <CheckCircle className="w-4 h-4" />
                        <span>Copied!</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-3 p-4 rounded-xl bg-black/20 border border-white/10">
                    <p className="flex-1 text-white font-mono text-sm md:text-base break-all">
                      {CRYPTO_WALLETS[selectedAsset as keyof typeof CRYPTO_WALLETS] || 'Wallet address not available'}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleCopy(CRYPTO_WALLETS[selectedAsset as keyof typeof CRYPTO_WALLETS], 'wallet')}
                      className="p-3 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-all flex-shrink-0"
                    >
                      <Copy className="w-5 h-5" />
                    </button>
                  </div>

                  {/* QR Code Placeholder */}
                  <div className="mt-6 flex justify-center">
                    <div className="w-48 h-48 rounded-xl bg-white p-4 flex items-center justify-center border-4 border-purple-500/20">
                      <div className="text-center">
                        <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600 text-xs font-semibold">QR Code</p>
                        <p className="text-gray-400 text-xs mt-1">Coming Soon</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Crypto Instructions */}
                <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-yellow-400">
                      <p className="font-semibold mb-2">Important:</p>
                      <ul className="space-y-1 text-yellow-400/90">
                        <li>• Only send {selectedAsset} to this address</li>
                        <li>• Minimum deposit: $10 USD equivalent</li>
                        <li>• Network confirmations required: {selectedAsset === 'BTC' ? '3' : selectedAsset === 'ETH' ? '12' : '6'}</li>
                        <li>• Funds credited after network confirmations</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

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
            <label className="block text-sm font-medium text-gray-400 mb-2">Payment Proof (Upload Receipt/Screenshot)</label>
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileUpload}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-purple-500 file:text-white file:cursor-pointer hover:file:bg-purple-600 transition-all"
              required
            />
            {paymentProof && (
              <p className="text-green-400 text-sm mt-2 flex items-center space-x-2">
                <CheckCircle className="w-4 h-4" />
                <span>{paymentProof.name}</span>
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || uploadingProof || !paymentProof || !usdAmount}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-all transform hover:scale-[1.02]"
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
      </div>
    </div>
  )
}
