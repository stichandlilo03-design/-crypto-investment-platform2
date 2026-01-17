'use client'

import { useState, useEffect } from 'react'
import { X, Play, ExternalLink } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface DemoVideoModalProps {
  videoUrl: string
  buttonText?: string
  buttonClassName?: string
}

export default function DemoVideoModal({ 
  videoUrl, 
  buttonText = "Watch Demo",
  buttonClassName = ""
}: DemoVideoModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // ✅ Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent))
    }
    checkMobile()
  }, [])

  // ✅ Detect if it's a YouTube Short
  const isYouTubeShort = (url: string) => {
    return url.includes('/shorts/')
  }

  // ✅ Get video ID from YouTube URL
  const getYouTubeVideoId = (url: string) => {
    if (url.includes('/shorts/')) {
      return url.split('/shorts/')[1]?.split('?')[0]
    }
    if (url.includes('youtu.be/')) {
      return url.split('youtu.be/')[1]?.split('?')[0]
    }
    if (url.includes('v=')) {
      return url.split('v=')[1]?.split('&')[0]
    }
    return ''
  }

  // ✅ Handle button click
  const handleClick = () => {
    const isShort = isYouTubeShort(videoUrl)
    
    // If mobile + YouTube Short, open in new tab
    if (isMobile && isShort) {
      window.open(videoUrl, '_blank')
    } else {
      setIsOpen(true)
    }
  }

  // ✅ Get embed URL for desktop
  const getVideoEmbedUrl = (url: string) => {
    // YouTube
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const videoId = getYouTubeVideoId(url)
      // Use regular embed for Shorts on desktop (works better)
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`
    }
    
    // Vimeo
    if (url.includes('vimeo.com')) {
      const videoId = url.split('vimeo.com/')[1]?.split('?')[0]
      return `https://player.vimeo.com/video/${videoId}?autoplay=1`
    }
    
    return url
  }

  const embedUrl = getVideoEmbedUrl(videoUrl)
  const isDirectVideo = !videoUrl.includes('youtube') && !videoUrl.includes('vimeo')

  return (
    <>
      {/* ✅ Watch Demo Button */}
      <button
        onClick={handleClick}
        className={buttonClassName || "group relative px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-white font-bold hover:shadow-2xl hover:shadow-purple-500/50 transition-all flex items-center space-x-2"}
      >
        <Play className="w-5 h-5 group-hover:scale-110 transition-transform" />
        <span>{buttonText}</span>
        {isMobile && isYouTubeShort(videoUrl) && (
          <ExternalLink className="w-4 h-4 ml-1" />
        )}
      </button>

      {/* ✅ Video Modal (Desktop only for Shorts) */}
      <AnimatePresence>
        {isOpen && !isMobile && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              {/* Modal Container */}
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: 'spring', duration: 0.5 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-5xl bg-gradient-to-br from-gray-900 to-black rounded-2xl overflow-hidden shadow-2xl border border-white/10"
              >
                {/* Close Button */}
                <button
                  onClick={() => setIsOpen(false)}
                  className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all group"
                >
                  <X className="w-6 h-6 text-white group-hover:rotate-90 transition-transform" />
                </button>

                {/* Video Container */}
                <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                  {isDirectVideo ? (
                    <video
                      src={embedUrl}
                      controls
                      autoPlay
                      className="absolute top-0 left-0 w-full h-full"
                    >
                      Your browser does not support video playback.
                    </video>
                  ) : (
                    <iframe
                      src={embedUrl}
                      className="absolute top-0 left-0 w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  )}
                </div>

                {/* Video Title/Description */}
                <div className="p-6 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-t border-white/10">
                  <h3 className="text-xl font-bold text-white mb-2">CryptoVault Demo</h3>
                  <p className="text-gray-400 text-sm">
                    See how easy it is to manage your crypto portfolio with CryptoVault
                  </p>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
