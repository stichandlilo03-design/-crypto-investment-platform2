'use client'

import { Play } from 'lucide-react'

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
  
  // ✅ Simple: Open YouTube directly (works 100% on all devices)
  const handleClick = () => {
    window.open(videoUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <button
      onClick={handleClick}
      className={buttonClassName || "group relative px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-white font-bold hover:shadow-2xl hover:shadow-purple-500/50 transition-all flex items-center space-x-2"}
    >
      <Play className="w-5 h-5 group-hover:scale-110 transition-transform" />
      <span>{buttonText}</span>
    </button>
  )
}
