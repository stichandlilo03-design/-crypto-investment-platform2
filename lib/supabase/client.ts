import { createBrowserClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

// Browser client for client components
export function createSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Admin client for server-side operations
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// For backwards compatibility
export const supabase = createSupabaseClient()

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          phone: string | null
          avatar_url: string | null
          role: 'user' | 'admin'
          kyc_verified: boolean
          created_at: string
          updated_at: string
        }
      }
      portfolios: {
        Row: {
          id: string
          user_id: string
          asset_symbol: string
          asset_name: string
          amount: number
          average_buy_price: number | null
          total_invested: number
          created_at: string
          updated_at: string
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          type: 'deposit' | 'withdrawal' | 'buy' | 'sell'
          asset_symbol: string
          amount: number
          price_at_transaction: number | null
          total_value: number
          status: 'pending' | 'approved' | 'completed' | 'rejected'
          payment_method: string | null
          payment_proof_url: string | null
          admin_notes: string | null
          approved_by: string | null
          approved_at: string | null
          created_at: string
          updated_at: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: 'deposit' | 'withdrawal' | 'trade' | 'profit' | 'admin'
          title: string
          message: string
          read: boolean
          action_url: string | null
          created_at: string
        }
      }
    }
  }
}
