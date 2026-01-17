'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Upload, DollarSign, CheckCircle, Loader2, Copy, 
  AlertCircle, ArrowRight, Building, Wallet, CreditCard
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'

// Demo wallet addresses - Replace with your actual wallets
const DEMO_WALLETS = {
  BTC: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
  ETH: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
  USDT: 'TRC20: TYDzsYUEpvnYmQk4zGP9sWWcTEd2MiAtW6',
  SOL: '7EcDhSYGxXyscszYEp35KHN8vvw3svAuLKTzXwCFLtV',
  ADA: 'addr1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlhxu56se8d2v',
  BNB: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
  XRP: 'rEb8TK3gBgk5auZkwc6sHnwrGVJH8DuaLh',
  DOGE: 'DH5yaieqoZN36fDVciNyRueRGvGLR3mr7L'
}

// Bank transfer details
const BANK_DETAILS = {
  bankName: 'JPMorgan Chase Bank',
  accountName: 'CryptoVault Holdings LLC',
  accountNumber: '1234567890',
  routingNumber: '021000021',
  swiftCode: 'CHASUS33',
  bankAddress: '270 Park Avenue, New York, NY 10017',
  reference: 'Your email or user ID'
}

export default function Deposit() {
  const { user } = useAuth()
  const [selectedAsset, setSelectedAsset] = useState('BTC')
  const [amount, setAmount] = useState('')
  const [paymentProof, setPaymentProof] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const assets = [
    { symbol: 'USD', name: 'US Dollar', icon: '💵' },
    { symbol: 'BTC', name: 'Bitcoin', icon: '₿' },
    { symbol: 'ETH', name: 'Ethereum', icon: 'Ξ' },
    { symbol: 'USDT', name: 'Tether', icon: '₮' },
    { symbol: 'SOL', name: 'Solana', icon: '◎' },
    { symbol: 'ADA', name: 'Cardano', icon: '₳' },
    { symbol: 'BNB', name: 'BNB', icon: '🔶' },
    { symbol: 'XRP', name: 'Ripple', icon: '✕' },
    { symbol: 'DOGE', name: 'Dogecoin', icon: 'Ð' }
  ]

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB')
        return
      }
      
      // Check file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
      if (!allowedTypes.includes(file.type)) {
        setError('Only JPG, PNG, WEBP, and PDF files are allowed')
        return
      }
      
      setPaymentProof(file)
      setError('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)
    
    try {
      if (!user) throw new Error('User not authenticated')
      if (!amount || Number(amount) <= 0) throw new Error('Invalid amount')
      if (!paymentProof && selectedAsset !== 'USD') throw new Error('Please upload payment proof')

      let paymentProofUrl = null

      // Upload payment proof if provided
      if (paymentProof) {
        const fileExt = paymentProof.name.split('.').pop()
        const fileName = `${user.id}/${Date.now()}.${fileExt}`
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('payment-proofs')
          .upload(fileName, paymentProof, {
            onUploadProgress: (progress) => {
              const percent = (progress.loaded / progress.total) * 100
              setUploadProgress(Math.round(percent))
            }
          })

        if (uploadError) throw uploadError

        const { data: urlData } = supabase.storage
          .from('payment-proofs')
          .getPublicUrl(fileName)

        paymentProofUrl = urlData.publicUrl
      }

      // Create transaction record
      const { error: insertError } = await supabase
        .from('transactions')
        .insert([
          {
            user_id: user.id,
            type: 'deposit',
            asset: selectedAsset,
            amount: Number(amount),
            value_usd: Number(amount),
            status: 'pending',
            payment_proof_url: paymentProofUrl
          }
        ])

      if (insertError) throw insertError

      // Create notification
      await supabase.from('notifications').insert([
        {
          user_id: user.id,
          type: 'deposit',
          title: 'Deposit Request Submitted',
          message: `Your deposit request of $${amount} ${selectedAsset} has been submitted and is pending approval.`,
          read: false
        }
      ])

      setSuccess(true)
      setAmount('')
      setPaymentProof(null)
      setUploadProgress(0)

      // Reset form after 3 seconds
      setTimeout(() => {
        setSuccess(false)
      }, 3000)

    } catch (error: any) {
      console.error('Deposit error:', error)
      setError(error.message || 'Failed to submit deposit')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="glass-effect rounded-2xl p-8 border border-white/10">
        <div className="flex items-center space-x-3 mb-6">
          <Upload className="w-8 h-8 text-green-400" />
          <h2 className="text-2xl font-bold text-white">Deposit Funds</h2>
        </div>

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl bg-green-500/20 border border-green-500/30 flex items-start space-x-3"
          >
            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-green-400 font-medium">Deposit request submitted!</p>
              <p className="text-green-400/80 text-sm mt-1">
                Your deposit is being reviewed and will be processed shortly.
              </p>
            </div>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl bg-red-500/20 border border-red-500/30 flex items-start space-x-3"
          >
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-400">{error}</p>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Asset Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-3">
              Select Asset
            </label>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
              {assets.map((asset) => (
                <button
                  key={asset.symbol}
                  type="button"
                  onClick={() => setSelectedAsset(asset.symbol)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    selectedAsset === asset.symbol
                      ? 'border-purple-500 bg-purple-500/20'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="text-2xl mb-1">{asset.icon}</div>
                  <div className="text-white text-sm font-bold">{asset.symbol}</div>
                  <div className="text-gray-400 text-xs">{asset.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Amount (USD)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                min="10"
                step="0.01"
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-lg font-bold focus:outline-none focus:border-purple-500"
                required
              />
            </div>
            <p className="text-gray-400 text-sm mt-2">Minimum deposit: $10.00</p>
          </div>

          {/* Wallet/Bank Details Display */}
          {selectedAsset === 'USD' ? (
            /* Bank Transfer Details */
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-blue-400 mb-3">
                <Building className="w-5 h-5" />
                <h3 className="font-bold text-lg">Bank Transfer Details</h3>
              </div>

              <div className="p-6 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400 text-xs mb-1">Bank Name</p>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                      <p className="text-white font-medium">{BANK_DETAILS.bankName}</p>
                      <button
                        type="button"
                        onClick={() => handleCopy(BANK_DETAILS.bankName)}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <p className="text-gray-400 text-xs mb-1">Account Name</p>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                      <p className="text-white font-medium">{BANK_DETAILS.accountName}</p>
                      <button
                        type="button"
                        onClick={() => handleCopy(BANK_DETAILS.accountName)}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <p className="text-gray-400 text-xs mb-1">Account Number</p>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                      <p className="text-white font-mono font-bold">{BANK_DETAILS.accountNumber}</p>
                      <button
                        type="button"
                        onClick={() => handleCopy(BANK_DETAILS.accountNumber)}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <p className="text-gray-400 text-xs mb-1">Routing Number</p>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                      <p className="text-white font-mono font-bold">{BANK_DETAILS.routingNumber}</p>
                      <button
                        type="button"
                        onClick={() => handleCopy(BANK_DETAILS.routingNumber)}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <p className="text-gray-400 text-xs mb-1">SWIFT Code</p>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                      <p className="text-white font-mono font-bold">{BANK_DETAILS.swiftCode}</p>
                      <button
                        type="button"
                        onClick={() => handleCopy(BANK_DETAILS.swiftCode)}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <p className="text-gray-400 text-xs mb-1">Bank Address</p>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                      <p className="text-white text-sm">{BANK_DETAILS.bankAddress}</p>
                      <button
                        type="button"
                        onClick={() => handleCopy(BANK_DETAILS.bankAddress)}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10">
                  <p className="text-gray-400 text-xs mb-2">Payment Reference (Important!)</p>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                    <p className="text-yellow-400 font-medium">
                      Use: <span className="font-mono">{user?.email || 'Your email'}</span>
                    </p>
                    <button
                      type="button"
                      onClick={() => handleCopy(user?.email || '')}
                      className="text-yellow-400 hover:text-yellow-300"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-yellow-400/80 text-xs mt-2">
                    ⚠️ Always include your email in the transfer reference to ensure proper crediting
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-400">
                    <p className="font-medium mb-1">Important Instructions:</p>
                    <ul className="space-y-1 text-blue-400/80">
                      <li>• Processing time: 1-3 business days</li>
                      <li>• Upload your transfer receipt below</li>
                      <li>• Include your email as payment reference</li>
                      <li>• Contact support if funds don't arrive within 3 days</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Crypto Wallet Address */
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-purple-400 mb-3">
                <Wallet className="w-5 h-5" />
                <h3 className="font-bold text-lg">{selectedAsset} Deposit Address</h3>
              </div>

              <div className="p-6 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-gray-400 text-sm">Send {selectedAsset} to this address:</p>
                  {copied && (
                    <span className="text-green-400 text-sm flex items-center space-x-1">
                      <CheckCircle className="w-4 h-4" />
                      <span>Copied!</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-3 p-4 rounded-xl bg-white/5 border border-white/10">
                  <p className="flex-1 text-white font-mono text-sm break-all">
                    {DEMO_WALLETS[selectedAsset as keyof typeof DEMO_WALLETS]}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleCopy(DEMO_WALLETS[selectedAsset as keyof typeof DEMO_WALLETS])}
                    className="p-2 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-all"
                  >
                    <Copy className="w-5 h-5" />
                  </button>
                </div>

                {/* QR Code Placeholder */}
                <div className="mt-6 flex justify-center">
                  <div className="w-48 h-48 rounded-xl bg-white p-4 flex items-center justify-center">
                    <div className="text-center">
                      <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600 text-xs">QR Code</p>
                      <p className="text-gray-400 text-xs">Coming Soon</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-400">
                    <p className="font-medium mb-1">Important:</p>
                    <ul className="space-y-1 text-yellow-400/80">
                      <li>• Only send {selectedAsset} to this address</li>
                      <li>• Minimum deposit: $10 USD equivalent</li>
                      <li>• Network confirmations required: {selectedAsset === 'BTC' ? '3' : selectedAsset === 'ETH' ? '12' : '6'}</li>
                      <li>• Funds will be credited after confirmations</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Payment Proof Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Upload Payment Proof {selectedAsset === 'USD' ? '(Required)' : '(Optional but recommended)'}
            </label>
            <div className="relative">
              <input
                type="file"
                onChange={handleFileChange}
                accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
                className="hidden"
                id="payment-proof"
              />
              <label
                htmlFor="payment-proof"
                className="flex items-center justify-center space-x-3 p-6 rounded-xl border-2 border-dashed border-white/20 hover:border-purple-500/50 cursor-pointer transition-all bg-white/5 hover:bg-white/10"
              >
                <Upload className="w-6 h-6 text-gray-400" />
                <div className="text-center">
                  <p className="text-white font-medium">
                    {paymentProof ? paymentProof.name : 'Click to upload'}
                  </p>
                  <p className="text-gray-400 text-sm mt-1">
                    PNG, JPG, WEBP or PDF (Max 5MB)
                  </p>
                </div>
              </label>
            </div>

            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-400">Uploading...</span>
                  <span className="text-sm text-purple-400">{uploadProgress}%</span>
                </div>
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <h4 className="font-medium text-white mb-2 flex items-center space-x-2">
              <ArrowRight className="w-4 h-4 text-purple-400" />
              <span>How to deposit:</span>
            </h4>
            <ol className="space-y-2 text-gray-400 text-sm">
              <li>1. Select your preferred asset (USD or Cryptocurrency)</li>
              <li>2. Enter the amount you wish to deposit</li>
              <li>3. {selectedAsset === 'USD' 
                ? 'Transfer funds to the bank account above' 
                : `Send ${selectedAsset} to the wallet address above`}
              </li>
              <li>4. Upload your payment proof (transaction receipt or screenshot)</li>
              <li>5. Submit the form and wait for admin approval</li>
            </ol>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium hover:shadow-lg hover:shadow-green-500/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                <span>Submit Deposit Request</span>
              </>
            )}
          </button>
        </form>

        {/* Help Text */}
        <div className="mt-6 pt-6 border-t border-white/10">
          <p className="text-gray-400 text-sm text-center">
            Having trouble? Contact our support team for assistance.
          </p>
        </div>
      </div>
    </div>
  )
}
