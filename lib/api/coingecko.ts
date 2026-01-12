const COINGECKO_API = 'https://api.coingecko.com/api/v3'

const COIN_IDS: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  ADA: 'cardano',
  SOL: 'solana',
  USDT: 'tether',
  BNB: 'binancecoin',
  XRP: 'ripple',
  DOGE: 'dogecoin'
}

export async function getCryptoPrices(symbols: string[]) {
  try {
    const ids = symbols.map(s => COIN_IDS[s] || s.toLowerCase()).join(',')
    const response = await fetch(
      `${COINGECKO_API}/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true`,
      { next: { revalidate: 30 } } // Cache for 30 seconds
    )
    
    if (!response.ok) throw new Error('Failed to fetch prices')
    
    const data = await response.json()
    
    // Convert back to symbol keys
    const result: Record<string, any> = {}
    Object.entries(COIN_IDS).forEach(([symbol, id]) => {
      if (data[id]) {
        result[symbol] = {
          price: data[id].usd,
          change24h: data[id].usd_24h_change,
          marketCap: data[id].usd_market_cap
        }
      }
    })
    
    return result
  } catch (error) {
    console.error('CoinGecko API Error:', error)
    return {}
  }
}

export async function getCryptoChart(symbol: string, days: number = 7) {
  try {
    const id = COIN_IDS[symbol] || symbol.toLowerCase()
    const response = await fetch(
      `${COINGECKO_API}/coins/${id}/market_chart?vs_currency=usd&days=${days}`,
      { next: { revalidate: 300 } } // Cache for 5 minutes
    )
    
    if (!response.ok) throw new Error('Failed to fetch chart')
    
    return await response.json()
  } catch (error) {
    console.error('CoinGecko Chart Error:', error)
    return { prices: [] }
  }
}

export async function getMarketData(limit: number = 50) {
  try {
    const response = await fetch(
      `${COINGECKO_API}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}&page=1&sparkline=true&price_change_percentage=24h`,
      { next: { revalidate: 60 } } // Cache for 1 minute
    )
    
    if (!response.ok) throw new Error('Failed to fetch market data')
    
    return await response.json()
  } catch (error) {
    console.error('CoinGecko Market Error:', error)
    return []
  }
}

export function getSymbolFromId(id: string): string {
  const entry = Object.entries(COIN_IDS).find(([_, coinId]) => coinId === id)
  return entry ? entry[0] : id.toUpperCase()
}
