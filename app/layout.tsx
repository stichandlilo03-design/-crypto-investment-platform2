import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CryptoVault - Professional Crypto Investment Platform',
  description: 'Secure and professional cryptocurrency investment platform with real-time analytics and portfolio management',
  keywords: ['crypto', 'investment', 'cryptocurrency', 'trading', 'portfolio'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-body antialiased">{children}</body>
    </html>
  )
}
