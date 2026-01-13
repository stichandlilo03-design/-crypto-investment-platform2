'use client'

import { useState, useRef } from 'react'
import { Upload, X, FileText, Image, CheckCircle } from 'lucide-react'
import { motion } from 'framer-motion'

interface FileUploadProps {
  onUpload: (file: File) => Promise<string>
  accept?: string
  maxSize?: number // in MB
  label?: string
}

export default function FileUpload({ 
  onUpload, 
  accept = 'image/*,.pdf',
  maxSize = 5,
  label = 'Upload payment proof'
}: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    // Validate file size
    if (selectedFile.size > maxSize * 1024 * 1024) {
      setError(`File size must be less than ${maxSize}MB`)
      return
    }

    setError(null)
    setFile(selectedFile)
    setUploadedUrl(null)

    // Create preview for images
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(selectedFile)
    } else {
      setPreview(null)
    }

    // Upload file
    setUploading(true)
    try {
      const url = await onUpload(selectedFile)
      setUploadedUrl(url)
    } catch (err) {
      setError('Failed to upload file. Please try again.')
      console.error('Upload error:', err)
    } finally {
      setUploading(false)
    }
  }

  const removeFile = () => {
    setFile(null)
    setPreview(null)
    setUploadedUrl(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const getFileIcon = () => {
    if (!file) return <Upload className="w-8 h-8 text-gray-400" />
    if (file.type.startsWith('image/')) return <Image className="w-8 h-8 text-blue-400" />
    return <FileText className="w-8 h-8 text-purple-400" />
  }

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-400 mb-2">
        {label}
      </label>

      <div className="relative">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept={accept}
          className="hidden"
          id="file-upload"
        />

        {!file ? (
          <label
            htmlFor="file-upload"
            className="flex flex-col items-center justify-center w-full h-32 px-4 transition bg-white/5 border-2 border-gray-300/20 border-dashed rounded-xl cursor-pointer hover:border-purple-500/50 hover:bg-white/10"
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className="w-10 h-10 mb-3 text-gray-400" />
              <p className="mb-2 text-sm text-gray-400">
                <span className="font-semibold">Click to upload</span>
              </p>
              <p className="text-xs text-gray-500">
                PNG, JPG, PDF up to {maxSize}MB
              </p>
            </div>
          </label>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-white/5 border border-white/10"
          >
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                {getFileIcon()}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-white truncate">
                    {file.name}
                  </p>
                  <button
                    type="button"
                    onClick={removeFile}
                    className="ml-2 flex-shrink-0 p-1 rounded-lg hover:bg-white/10 transition-all"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
                
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-gray-400">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  
                  {uploading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                      <span className="text-xs text-purple-400">Uploading...</span>
                    </div>
                  ) : uploadedUrl ? (
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-xs text-green-400">Uploaded</span>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            {preview && (
              <div className="mt-4">
                <img
                  src={preview}
                  alt="Preview"
                  className="max-w-full h-auto max-h-48 rounded-lg mx-auto"
                />
              </div>
            )}

            {error && (
              <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-xs text-red-400">{error}</p>
              </div>
            )}

            {uploadedUrl && (
              <input
                type="hidden"
                name="paymentProof"
                value={uploadedUrl}
              />
            )}
          </motion.div>
        )}
      </div>

      <p className="mt-2 text-xs text-gray-500">
        Upload proof of payment (screenshot or PDF)
      </p>
    </div>
  )
}
