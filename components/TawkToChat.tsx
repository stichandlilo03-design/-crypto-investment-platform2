'use client'

import { useEffect } from 'react'

export default function TawkToChat() {
  useEffect(() => {
    // Check if Tawk.to script is already loaded
    if (typeof window !== 'undefined' && !(window as any).Tawk_API) {
      // Initialize Tawk_API
      ;(window as any).Tawk_API = (window as any).Tawk_API || {}
      ;(window as any).Tawk_LoadStart = new Date()

      // Create script element with YOUR Tawk.to ID
      const script = document.createElement('script')
      script.async = true
      script.src = 'https://embed.tawk.to/696b2f39ef4ece197e16174b/1jf5b0v72'
      script.charset = 'UTF-8'
      script.setAttribute('crossorigin', '*')

      // Insert script
      const firstScript = document.getElementsByTagName('script')[0]
      if (firstScript && firstScript.parentNode) {
        firstScript.parentNode.insertBefore(script, firstScript)
      }

      // Log when chat loads
      script.onload = () => {
        console.log('✅ Tawk.to chat widget loaded successfully!')
      }

      script.onerror = () => {
        console.error('❌ Failed to load Tawk.to chat widget')
      }
    }
  }, [])

  // This component doesn't render anything visible
  // The chat widget is injected by Tawk.to script
  return null
}
