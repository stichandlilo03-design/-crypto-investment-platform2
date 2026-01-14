'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Upload, CheckCircle, AlertCircle, Loader2, FileText, X, Camera, User, MapPin, Calendar } from 'lucide-react'
import { createSupabaseClient } from '@/lib/supabase/client'

interface KYCVerificationProps {
  userId: string
  profile: any
  onSuccess: () => void
}

export default function KYCVerification({ userId, profile, onSuccess }: KYCVerificationProps) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  
  // Personal Info
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [country, setCountry] = useState('')
  const [postalCode, setPostalCode] = useState('')
  
  // Document uploads
  const [idFront, setIdFront] = useState<File | null>(null)
  const [idBack, setIdBack] = useState<File | null>(null)
  const [selfie, setSelfie] = useState<File | null>(null)
  
  // Previews
  const [idFrontPreview, setIdFrontPreview] = useState<string | null>(null)
  const [idBackPreview, setIdBackPreview] = useState<string | null>(null)
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null)
  
  const idFrontRef = useRef<HTMLInputElement>(null)
  const idBackRef = useRef<HTMLInputElement>(null)
  const selfieRef = useRef<HTMLInputElement>(null)
  
  const supabase = createSupabaseClient()

  const handleFileUpload = (
    file: File, 
    setFile: (file: File) => void, 
    setPreview: (preview: string) => void
  ) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB')
      return
    }

    setFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const removeFile = (
    setFile: (file: File | null) => void,
    setPreview: (preview: string | null) => void,
    ref: React.RefObject<HTMLInputElement>
  ) => {
    setFile(null)
    setPreview(null)
    if (ref.current) {
      ref.current.value = ''
    }
  }

  const handleSubmitPersonalInfo = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!fullName || !dateOfBirth || !phoneNumber || !address || !city || !country) {
      setError('Please fill in all required fields')
      return
    }

    setError('')
    setStep(2)
  }

  const handleSubmitDocuments = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!idFront || !idBack || !selfie) {
      setError('Please upload all required documents')
      return
    }

    setLoading(true)
    setError('')
    
    try {
      // Upload ID Front
      const idFrontExt = idFront.name.split('.').pop()
      const idFrontFileName = `${userId}-id-front-${Date.now()}.${idFrontExt}`
      const { error: idFrontError } = await supabase.storage
        .from('kyc-documents')
        .upload(idFrontFileName, idFront)
      
      if (idFrontError) throw idFrontError
      
      const { data: { publicUrl: idFrontUrl } } = supabase.storage
        .from('kyc-documents')
        .getPublicUrl(idFrontFileName)

      // Upload ID Back
      const idBackExt = idBack.name.split('.').pop()
      const idBackFileName = `${userId}-id-back-${Date.now()}.${idBackExt}`
      const { error: idBackError } = await supabase.storage
        .from('kyc-documents')
        .upload(idBackFileName, idBack)
      
      if (idBackError) throw idBackError
      
      const { data: { publicUrl: idBackUrl } } = supabase.storage
        .from('kyc-documents')
        .getPublicUrl(idBackFileName)

      // Upload Selfie
      const selfieExt = selfie.name.split('.').pop()
      const selfieFileName = `${userId}-selfie-${Date.now()}.${selfieExt}`
      const { error: selfieError } = await supabase.storage
        .from('kyc-documents')
        .upload(selfieFileName, selfie)
      
      if (selfieError) throw selfieError
      
      const { data: { publicUrl: selfieUrl } } = supabase.storage
        .from('kyc-documents')
        .getPublicUrl(selfieFileName)

      // Update profile with KYC data
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          date_of_birth: dateOfBirth,
          phone_number: phoneNumber,
          address: address,
          city: city,
          country: country,
          postal_code: postalCode,
          kyc_status: 'pending',
          kyc_submitted_at: new Date().toISOString(),
          kyc_id_front_url: idFrontUrl,
          kyc_id_back_url: idBackUrl,
          kyc_selfie_url: selfieUrl
        })
        .eq('id', userId)
      
      if (updateError) throw updateError

      setSuccess(true)
      setLoading(false)
      
      setTimeout(() => {
        onSuccess()
      }, 3000)
      
    } catch (error) {
      console.error('KYC submission error:', error)
      setError(error instanceof Error ? error.message : 'Failed to submit KYC')
      setLoading(false)
    }
  }

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="min-h-screen flex items-center justify-center p-4"
      >
        <div className="glass-effect rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">KYC Submitted Successfully!</h2>
          <p className="text-gray-400 mb-6">
            Your documents are being reviewed. You'll be notified once your account is verified.
          </p>
          <p className="text-sm text-gray-500">
            Verification usually takes 24-48 hours
          </p>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f] p-4 sm:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Identity Verification</h1>
          <p className="text-gray-400">Complete your KYC to start trading</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= 1 ? 'bg-purple-500' : 'bg-white/10'}`}>
              <span className="text-white font-bold">1</span>
            </div>
            <div className={`w-20 h-1 ${step >= 2 ? 'bg-purple-500' : 'bg-white/10'}`}></div>
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= 2 ? 'bg-purple-500' : 'bg-white/10'}`}>
              <span className="text-white font-bold">2</span>
            </div>
          </div>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl"
          >
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <p className="text-red-400 font-medium">{error}</p>
            </div>
          </motion.div>
        )}

        {/* Step 1: Personal Information */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-effect rounded-2xl p-6"
          >
            <h2 className="text-xl font-bold text-white mb-6 flex items-center">
              <User className="w-5 h-5 mr-2" />
              Personal Information
            </h2>
            
            <form onSubmit={handleSubmitPersonalInfo} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Full Name*</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white"
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Date of Birth*</label>
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Phone Number*</label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+1234567890"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Street Address*</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white"
                  required
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">City*</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Country*</label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Postal Code</label>
                  <input
                    type="text"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:opacity-90"
              >
                Continue to Document Upload
              </button>
            </form>
          </motion.div>
        )}

        {/* Step 2: Document Upload */}
        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-effect rounded-2xl p-6"
          >
            <h2 className="text-xl font-bold text-white mb-6 flex items-center">
              <Camera className="w-5 h-5 mr-2" />
              Upload Documents
            </h2>

            <form onSubmit={handleSubmitDocuments} className="space-y-6">
              {/* ID Front */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Government ID (Front)*
                </label>
                <div className="border-2 border-dashed border-white/10 rounded-xl p-6 hover:border-purple-500/50 transition-colors">
                  {idFrontPreview ? (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <FileText className="w-8 h-8 text-blue-400" />
                          <div>
                            <p className="text-white font-medium">{idFront?.name}</p>
                            <p className="text-gray-400 text-sm">
                              {idFront ? (idFront.size / 1024 / 1024).toFixed(2) : 0} MB
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(setIdFront, setIdFrontPreview, idFrontRef)}
                          className="p-2 rounded-lg hover:bg-white/10"
                        >
                          <X className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                      <img src={idFrontPreview} alt="ID Front" className="max-w-full h-auto max-h-48 rounded-lg mx-auto" />
                    </div>
                  ) : (
                    <div className="text-center">
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-400 mb-2">Upload front of ID</p>
                      <p className="text-gray-500 text-sm mb-4">PNG, JPG up to 5MB</p>
                      <button
                        type="button"
                        onClick={() => idFrontRef.current?.click()}
                        className="px-4 py-2 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30"
                      >
                        Choose File
                      </button>
                    </div>
                  )}
                  <input
                    ref={idFrontRef}
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleFileUpload(file, setIdFront, setIdFrontPreview)
                    }}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              </div>

              {/* ID Back */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Government ID (Back)*
                </label>
                <div className="border-2 border-dashed border-white/10 rounded-xl p-6 hover:border-purple-500/50 transition-colors">
                  {idBackPreview ? (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <FileText className="w-8 h-8 text-blue-400" />
                          <div>
                            <p className="text-white font-medium">{idBack?.name}</p>
                            <p className="text-gray-400 text-sm">
                              {idBack ? (idBack.size / 1024 / 1024).toFixed(2) : 0} MB
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(setIdBack, setIdBackPreview, idBackRef)}
                          className="p-2 rounded-lg hover:bg-white/10"
                        >
                          <X className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                      <img src={idBackPreview} alt="ID Back" className="max-w-full h-auto max-h-48 rounded-lg mx-auto" />
                    </div>
                  ) : (
                    <div className="text-center">
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-400 mb-2">Upload back of ID</p>
                      <p className="text-gray-500 text-sm mb-4">PNG, JPG up to 5MB</p>
                      <button
                        type="button"
                        onClick={() => idBackRef.current?.click()}
                        className="px-4 py-2 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30"
                      >
                        Choose File
                      </button>
                    </div>
                  )}
                  <input
                    ref={idBackRef}
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleFileUpload(file, setIdBack, setIdBackPreview)
                    }}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              </div>

              {/* Selfie */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Selfie with ID*
                </label>
                <div className="border-2 border-dashed border-white/10 rounded-xl p-6 hover:border-purple-500/50 transition-colors">
                  {selfiePreview ? (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <FileText className="w-8 h-8 text-blue-400" />
                          <div>
                            <p className="text-white font-medium">{selfie?.name}</p>
                            <p className="text-gray-400 text-sm">
                              {selfie ? (selfie.size / 1024 / 1024).toFixed(2) : 0} MB
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(setSelfie, setSelfiePreview, selfieRef)}
                          className="p-2 rounded-lg hover:bg-white/10"
                        >
                          <X className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                      <img src={selfiePreview} alt="Selfie" className="max-w-full h-auto max-h-48 rounded-lg mx-auto" />
                    </div>
                  ) : (
                    <div className="text-center">
                      <Camera className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-400 mb-2">Upload selfie holding your ID</p>
                      <p className="text-gray-500 text-sm mb-4">PNG, JPG up to 5MB</p>
                      <button
                        type="button"
                        onClick={() => selfieRef.current?.click()}
                        className="px-4 py-2 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30"
                      >
                        Choose File
                      </button>
                    </div>
                  )}
                  <input
                    ref={selfieRef}
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleFileUpload(file, setSelfie, setSelfiePreview)
                    }}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 rounded-xl bg-white/5 text-white font-medium hover:bg-white/10"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading || !idFront || !idBack || !selfie}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <span>Submit for Verification</span>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5" />
                <div>
                  <p className="text-yellow-400 font-medium mb-1">Document Requirements</p>
                  <ul className="text-gray-300 text-sm space-y-1">
                    <li>• Documents must be clear and readable</li>
                    <li>• Government-issued ID (Passport, Driver's License, or National ID)</li>
                    <li>• Selfie must show your face and ID clearly</li>
                    <li>• All corners of documents must be visible</li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
