import { NextResponse } from 'next/server'
import { getCryptoPrices } from '@/lib/api/coingecko'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const symbolsParam = searchParams.get('symbols')
    
    const symbols = symbolsParam ? symbolsParam.split(',') : ['BTC', 'ETH', 'ADA', 'SOL']
    
    const prices = await getCryptoPrices(symbols)
    
    return NextResponse.json(prices)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
