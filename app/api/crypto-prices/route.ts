import { NextResponse } from 'next/server'
import { getCryptoPrices } from '@/lib/api/coingecko'

export async function GET() {
  try {
    const prices = await getCryptoPrices(['BTC', 'ETH', 'USDT', 'SOL', 'ADA', 'BNB', 'XRP', 'DOGE'])
    
    return NextResponse.json({
      success: true,
      prices: {
        ...prices,
        USD: { price: 1, change24h: 0, marketCap: 0 }
      }
    })
  } catch (error: any) {
    console.error('Crypto prices API error:', error)
    return NextResponse.json({ 
      success: false,
      prices: {
        BTC: { price: 42000, change24h: 0 },
        ETH: { price: 3300, change24h: 0 },
        USDT: { price: 1, change24h: 0 },
        USD: { price: 1, change24h: 0 }
      }
    })
  }
}
