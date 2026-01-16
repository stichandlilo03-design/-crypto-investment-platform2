import { NextResponse } from 'next/server'
import { getCryptoPrices } from '@/lib/api/coingecko'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const symbolsParam = searchParams.get('symbols')
    
    const symbols = symbolsParam 
      ? symbolsParam.split(',') 
      : ['BTC', 'ETH', 'USDT', 'SOL', 'ADA', 'BNB', 'XRP', 'DOGE']
    
    const prices = await getCryptoPrices(symbols)
    
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
      error: error.message,
      prices: {
        BTC: { price: 42000, change24h: 0 },
        ETH: { price: 3300, change24h: 0 },
        USDT: { price: 1, change24h: 0 },
        USD: { price: 1, change24h: 0 }
      }
    }, { status: 500 })
  }
}
