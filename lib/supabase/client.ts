// ============================================
// FILE 1: lib/supabase/client.ts
// ============================================
import { createBrowserClient } from '@supabase/ssr'

// Singleton instance
let clientInstance: ReturnType<typeof createBrowserClient> | null = null

// Browser client for client components
export function createSupabaseClient() {
  if (clientInstance) return clientInstance

  clientInstance = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  return clientInstance
}

// For backwards compatibility - use singleton
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
      user_portfolio: {
        Row: {
          id: string
          user_id: string
          asset: string
          amount: number
          created_at: string
          updated_at: string
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          type: 'deposit' | 'withdraw'
          asset: string
          amount: number
          value_usd: number
          status: 'pending' | 'approved' | 'rejected'
          payment_proof_url: string | null
          wallet_address: string | null
          admin_notes: string | null
          created_at: string
          updated_at: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: 'deposit' | 'withdraw' | 'trade' | 'admin'
          title: string
          message: string
          read: boolean
          created_at: string
        }
      }
    }
  }
}

