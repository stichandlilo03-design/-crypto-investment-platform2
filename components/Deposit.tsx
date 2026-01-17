'use client'

import { useState, useEffect } from 'react'
import { ArrowDownCircle, Loader2, DollarSign, AlertCircle, Copy, CheckCircle, Building, Wallet, QrCode } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import QRCode from 'qrcode'

const CRYPTO_WALLETS = {
  BTC: {
    address: 'bc1qjwpl49rh53p3s7euxq9t074mfxmtxue70rzve6',
    network: 'Bitcoin Network',
    confirmations: 3
  },
  ETH: {
    address: '0xba99397e779F619FbEaAc6f1924f2F0cd79134EA',
    network: 'Ethereum (ERC-20)',
    confirmations: 12
  },
  USDT: {
    address: '0xba99397e779F619FbEaAc6f1924f2F0cd79134EA',
    network: 'Ethereum (ERC-20)',
    confirmations: 12
  },
  SOL: {
    address: 'BnRgk89ztk8wwZfK5dYLV4tLScPG5vtQwXA7FhyUomX5',
    network: 'Solana Network',
    confirmations: 32
  },
  ADA: {
    address: 'addr1qxpv53zfm2lhsyr908z5yh3ckhctluxx3hnl3dttyu09snj6tmgktn74dq3sxdn6p3cxjhlwudp5x03q50eylvsafp9q09xadr',
    network: 'Cardano Network',
    confirmations: 15
  },
  BNB: {
    address: '0xba99397e779F619FbEaAc6f1924f2F0cd79134EA',
    network: 'BNB Smart Chain (BEP-20)',
    confirmations: 15
  },
  XRP: {
    address: 'r3qHCQ5Fs31EFrTMnreNL2LwcumdSPZjhS',
    network: 'Ripple Network',
    confirmations: 1
  },
  DOGE: {
    address: 'DTLGiNoUjbUrfsYeygKN9VZuKKSwR68Jzu',
    network: 'Dogecoin Network',
    confirmations: 6
  }
}

const BANK_INFO = {
  bankName: 'Sofi Bank',
  accountName: 'CryptoVault Holdings LLC',
  accountNumber: '1234567890',
  routingNumber: '021000021',
  swiftCode: 'CHASUS33',
  iban: 'US12 BANK 0000 1234 5678 90',
  bankAddress: '270 Park Avenue, New York, NY 10017, USA'
}

const MIN_DEPOSIT = {
  USD: 500,
  CRYPTO: 250
}

export default function Deposit() {
  const [selectedAsset, setSelectedAsset] = useState('BTC')
  const [usdAmount, setUsdAmount] = useState('')
  const [cryptoAmount, setCryptoAmount] = useState('0.00000000')
  const [paymentProof, setPaymentProof] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [cryptoPrices, setCryptoPrices] = useState<any>({})
  const [pricesLoading, setPricesLoading] = useState(true)
  const [uploadingProof, setUploadingProof] = useState(false)
  const [copied, setCopied] = useState('')
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [generatingQR, setGeneratingQR] = useState(false)

  useEffect(() => {
    fetchUser()
    fetchPrices()
    const interval = setInterval(fetchPrices, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    calculateCryptoAmount()
  }, [usdAmount, selectedAsset, cryptoPrices])

  useEffect(() => {
    if (selectedAsset !== 'USD' && CRYPTO_WALLETS[selectedAsset as keyof typeof CRYPTO_WALLETS]) {
      generateQRCode(CRYPTO_WALLETS[selectedAsset as keyof typeof CRYPTO_WALLETS].address)
    }
  }, [selectedAsset])

  const fetchUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setCurrentUser(user)
  }

  const fetchPrices = async () => {
    try {
      const response = await fetch('/api/crypto-prices')
      const data = await response.json()
      
      if (data.success) {
        setCryptoPrices(data.prices)
      }
      setPricesLoading(false)
    } catch (error) {
      console.error('Error fetching prices:', error)
      setPricesLoading(false)
    }
  }

  const generateQRCode = async (address: string) => {
    setGeneratingQR(true)
    try {
      const qrDataUrl = await QRCode.toDataURL(address, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
      setQrCodeUrl(qrDataUrl)
    } catch (error) {
      console.error('Error generating QR code:', error)
    } finally {
      setGeneratingQR(false)
    }
  }

  const getAssetPrice = (asset: string): number => {
    if (asset === 'USD') return 1
    return cryptoPrices[asset]?.price || 0
  }

  const calculateCryptoAmount = () => {
    const usd = parseFloat(usdAmount) || 0
    
    if (selectedAsset === 'USD') {
      setCryptoAmount(usd.toFixed(2))
      return
    }

    const price = getAssetPrice(selectedAsset)
    
    if (price > 0) {
      const crypto = usd / price
      setCryptoAmount(crypto.toFixed(8))
    } else {
      setCryptoAmount('0.00000000')
    }
  }

  const validateMinimumDeposit = (): { valid: boolean; error: string } => {
    const usd = parseFloat(usdAmount) || 0
    
    if (selectedAsset === 'USD') {
      if (usd < MIN_DEPOSIT.USD) {
        return {
          valid: false,
          error: `Minimum USD deposit is $${MIN_DEPOSIT.USD.toLocaleString()}`
        }
      }
    } else {
      if (usd < MIN_DEPOSIT.CRYPTO) {
        return {
          valid: false,
          error: `Minimum crypto deposit is $${MIN_DEPOSIT.CRYPTO.toLocaleString()}`
        }
      }
    }
    
    return { valid: true, error: '' }
  }

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(''), 2000)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB')
        return
      }
      
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf']
      if (!allowedTypes.includes(file.type)) {
        alert('Only images (JPEG, PNG, GIF) and PDF files are allowed')
        return
      }
      
      setPaymentProof(file)
    }
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

  const handleSubmit = async () => {
    const validation = validateMinimumDeposit()
    if (!validation.valid) {
      alert(validation.error)
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

      const proofUrl = await uploadPaymentProof(paymentProof)
      if (!proofUrl) throw new Error('Failed to upload payment proof')

      const cryptoAmountNum = parseFloat(cryptoAmount)
      const usdAmountNum = parseFloat(usdAmount)

      const { error: insertError } = await supabase
        .from('transactions')
        .insert([
          {
            user_id: user.id,
            type: 'deposit',
            asset: selectedAsset,
            amount: cryptoAmountNum,
            value_usd: usdAmountNum,
            status: 'pending',
            payment_proof_url: proofUrl
          }
        ])

      if (insertError) throw insertError

      await supabase.from('notifications').insert([
        {
          user_id: user.id,
          type: 'deposit',
          title: 'Deposit Request Submitted',
          message: `Your deposit of $${usdAmountNum.toFixed(2)} (${cryptoAmountNum.toFixed(8)} ${selectedAsset}) has been submitted and is pending approval.`,
          read: false
        }
      ])

      alert('✅ Deposit request submitted successfully! Please wait for processing.')
      
      setUsdAmount('')
      setCryptoAmount('0.00000000')
      setPaymentProof(null)
      
      setTimeout(() => {
        window.location.reload()
      }, 2000)

    } catch (error: any) {
      console.error('Deposit error:', error)
      alert(error.message || 'Failed to submit deposit')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4">
      <div className="glass-effect rounded-2xl p-6 sm:p-8 border border-white/10">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0">
            <ArrowDownCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold text-white">Make a Deposit</h2>
            <p className="text-sm text-gray-400 truncate">Fund your account with crypto or fiat</p>
          </div>
        </div>

        <div className="mb-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm min-w-0">
              <p className="text-blue-400 font-medium mb-1">Minimum Deposit Requirements:</p>
              <ul className="space-y-1 text-blue-400/80">
                <li>• USD deposits: Minimum <strong>${MIN_DEPOSIT.USD.toLocaleString()}</strong></li>
                <li>• Crypto deposits: Minimum <strong>${MIN_DEPOSIT.CRYPTO.toLocaleString()}</strong> equivalent</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Select Asset</label>
            <select
              value={selectedAsset}
              onChange={(e) => setSelectedAsset(e.target.value)}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-green-500"
            >
              <option value="USD">USD (US Dollar) - Min $500</option>
              <option value="BTC">BTC (Bitcoin) - Min $250</option>
              <option value="ETH">ETH (Ethereum) - Min $250</option>
              <option value="USDT">USDT (Tether ERC-20) - Min $250</option>
              <option value="SOL">SOL (Solana) - Min $250</option>
              <option value="ADA">ADA (Cardano) - Min $250</option>
              <option value="BNB">BNB (Binance Coin) - Min $250</option>
              <option value="XRP">XRP (Ripple) - Min $250</option>
              <option value="DOGE">DOGE (Dogecoin) - Min $250</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Amount (USD)</label>
            <div className="relative">
              <DollarSign className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              <input
                type="number"
                value={usdAmount}
                onChange={(e) => setUsdAmount(e.target.value)}
                placeholder={selectedAsset === 'USD' ? '500.00' : '250.00'}
                min={selectedAsset === 'USD' ? MIN_DEPOSIT.USD : MIN_DEPOSIT.CRYPTO}
                step="0.01"
                className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-green-500"
              />
            </div>
            
            {!pricesLoading && selectedAsset !== 'USD' && parseFloat(usdAmount) > 0 && (
              <div className="mt-3 p-3 sm:p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs sm:text-sm text-gray-400">You will receive:</span>
                  <span className="text-sm sm:text-base text-green-400 font-bold break-all ml-2">
                    {cryptoAmount} {selectedAsset}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400">Current price:</span>
                  <span className="text-xs text-gray-300">
                    ${getAssetPrice(selectedAsset).toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>

          {selectedAsset === 'USD' ? (
            <div className="p-4 sm:p-6 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
              <h3 className="text-base sm:text-lg font-bold text-white mb-4 flex items-center">
                <Building className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-400 flex-shrink-0" />
                <span className="truncate">Bank Transfer Details</span>
              </h3>
              
              <div className="space-y-3">
                {[
                  { label: 'Bank Name', value: BANK_INFO.bankName, key: 'bank' },
                  { label: 'Account Name', value: BANK_INFO.accountName, key: 'accname' },
                  { label: 'Account Number', value: BANK_INFO.accountNumber, key: 'accnum', mono: true },
                  { label: 'Routing Number', value: BANK_INFO.routingNumber, key: 'routing', mono: true },
                  { label: 'SWIFT Code', value: BANK_INFO.swiftCode, key: 'swift', mono: true }
                ].map((item) => (
                  <div key={item.key} className="flex justify-between items-center p-3 rounded-lg bg-white/5 gap-2">
                    <span className="text-gray-400 text-xs sm:text-sm whitespace-nowrap">{item.label}:</span>
                    <div className="flex items-center space-x-2 min-w-0">
                      <span className={`text-white text-xs sm:text-sm font-medium truncate ${item.mono ? 'font-mono' : ''}`}>
                        {item.value}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(item.value, item.key)}
                        className="p-1.5 rounded hover:bg-white/10 transition-colors flex-shrink-0 touch-manipulation"
                      >
                        {copied === item.key ? (
                          <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}

                <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <p className="text-yellow-400 text-xs sm:text-sm font-medium mb-1">
                    ⚠️ Important: Payment Reference
                  </p>
                  <p className="text-yellow-400/80 text-xs break-all">
                    Please use your email <strong>({currentUser?.email})</strong> as the payment reference/memo
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 sm:p-6 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
              <h3 className="text-base sm:text-lg font-bold text-white mb-4 flex items-center">
                <Wallet className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-purple-400 flex-shrink-0" />
                <span className="truncate">Send {selectedAsset} to this address</span>
              </h3>

              <div className="mb-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-xs sm:text-sm min-w-0">
                    <p className="text-blue-400 font-medium break-words">
                      Network: <strong>{CRYPTO_WALLETS[selectedAsset as keyof typeof CRYPTO_WALLETS]?.network}</strong>
                    </p>
                    <p className="text-blue-400/80 text-xs mt-1">
                      Please ensure you're using the correct network. Sending on wrong network will result in loss of funds!
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center mb-4">
                {generatingQR ? (
                  <div className="w-48 h-48 sm:w-64 sm:h-64 bg-white rounded-xl flex items-center justify-center">
                    <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 text-purple-500 animate-spin" />
                  </div>
                ) : qrCodeUrl ? (
                  <div className="bg-white p-3 sm:p-4 rounded-xl">
                    <img src={qrCodeUrl} alt="Wallet QR Code" className="w-44 h-44 sm:w-56 sm:h-56" />
                    <p className="text-center text-gray-600 text-xs mt-2">Scan to send {selectedAsset}</p>
                  </div>
                ) : (
                  <div className="w-48 h-48 sm:w-64 sm:h-64 bg-white/5 rounded-xl flex items-center justify-center border border-white/10">
                    <QrCode className="w-10 h-10 sm:w-12 sm:h-12 text-gray-600" />
                  </div>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-400 mb-2">Wallet Address:</label>
                <div className="flex items-center space-x-2 p-3 rounded-lg bg-white/5 border border-white/10">
                  <span className="flex-1 text-white font-mono text-xs sm:text-sm break-all">
                    {CRYPTO_WALLETS[selectedAsset as keyof typeof CRYPTO_WALLETS]?.address}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(CRYPTO_WALLETS[selectedAsset as keyof typeof CRYPTO_WALLETS]?.address, 'wallet')}
                    className="p-2 rounded hover:bg-white/10 transition-colors flex-shrink-0 touch-manipulation"
                  >
                    {copied === 'wallet' ? (
                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                    )}
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <p className="text-yellow-400 text-xs sm:text-sm">
                  ⏱️ Minimum <strong>{CRYPTO_WALLETS[selectedAsset as keyof typeof CRYPTO_WALLETS]?.confirmations} network confirmations</strong> required
                </p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Upload Payment Proof *
            </label>
            <input
              type="file"
              onChange={handleFileChange}
              accept="image/*,.pdf"
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-white/5 border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-green-500 file:mr-3 sm:file:mr-4 file:py-1.5 sm:file:py-2 file:px-3 sm:file:px-4 file:rounded-lg file:border-0 file:text-xs sm:file:text-sm file:font-semibold file:bg-green-500/20 file:text-green-400 hover:file:bg-green-500/30"
            />
            {paymentProof && (
              <p className="mt-2 text-xs sm:text-sm text-green-400 flex items-center">
                <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
                <span className="truncate">{paymentProof.name}</span>
                <span className="ml-1 flex-shrink-0">({(paymentProof.size / 1024 / 1024).toFixed(2)} MB)</span>
              </p>
            )}
            <p className="mt-2 text-xs text-gray-400">
              Upload screenshot of payment confirmation or transaction receipt (Max 5MB)
            </p>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || uploadingProof || pricesLoading}
            className="w-full py-3.5 sm:py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm sm:text-base font-bold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2 touch-manipulation"
          >
            {loading || uploadingProof ? (
              <>
                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                <span>{uploadingProof ? 'Uploading...' : 'Submitting...'}</span>
              </>
            ) : (
              <>
                <ArrowDownCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Submit Deposit Request</span>
              </>
            )}
          </button>

          <div className="p-3 sm:p-4 rounded-xl bg-white/5 border border-white/10">
            <h4 className="text-sm sm:text-base text-white font-medium mb-2 flex items-center">
              <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2 text-blue-400 flex-shrink-0" />
              Important Instructions:
            </h4>
            <ul className="space-y-1 text-xs sm:text-sm text-gray-400">
              <li>• {selectedAsset === 'USD' ? `Minimum deposit: $${MIN_DEPOSIT.USD.toLocaleString()}` : `Minimum deposit: $${MIN_DEPOSIT.CRYPTO.toLocaleString()} equivalent`}</li>
              <li className="break-words">• {selectedAsset === 'USD' ? 'Use your email as payment reference' : `Send only ${selectedAsset} to this address on ${CRYPTO_WALLETS[selectedAsset as keyof typeof CRYPTO_WALLETS]?.network}`}</li>
              <li>• Upload clear payment proof (screenshot or receipt)</li>
              <li>• Deposits are processed after Confirmed</li>
              <li>• Processing time: {selectedAsset === 'USD' ? '2-5 business days' : '10-30 minutes after confirmations'}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
