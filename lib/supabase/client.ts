// ============================================
// FILE: lib/supabase/client.ts
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

// Type definitions for your database
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
          role: 'user' | 'admin' | 'moderator'
          kyc_verified: boolean
          kyc_status: string | null
          kyc_submitted_at: string | null
          kyc_verified_at: string | null
          kyc_verified_by: string | null
          kyc_rejection_reason: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          role?: 'user' | 'admin' | 'moderator'
          kyc_verified?: boolean
          kyc_status?: string | null
          kyc_submitted_at?: string | null
          kyc_verified_at?: string | null
          kyc_verified_by?: string | null
          kyc_rejection_reason?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          role?: 'user' | 'admin' | 'moderator'
          kyc_verified?: boolean
          kyc_status?: string | null
          kyc_submitted_at?: string | null
          kyc_verified_at?: string | null
          kyc_verified_by?: string | null
          kyc_rejection_reason?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
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
        Insert: {
          id?: string
          user_id: string
          asset: string
          amount: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          asset?: string
          amount?: number
          created_at?: string
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          type: 'deposit' | 'withdraw' | 'buy' | 'sell'
          asset: string
          amount: number
          value_usd: number
          status: 'pending' | 'approved' | 'rejected' | 'processing' | 'completed'
          payment_proof_url: string | null
          wallet_address: string | null
          admin_notes: string | null
          approved_by: string | null
          approved_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'deposit' | 'withdraw' | 'buy' | 'sell'
          asset: string
          amount: number
          value_usd: number
          status?: 'pending' | 'approved' | 'rejected' | 'processing' | 'completed'
          payment_proof_url?: string | null
          wallet_address?: string | null
          admin_notes?: string | null
          approved_by?: string | null
          approved_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'deposit' | 'withdraw' | 'buy' | 'sell'
          asset?: string
          amount?: number
          value_usd?: number
          status?: 'pending' | 'approved' | 'rejected' | 'processing' | 'completed'
          payment_proof_url?: string | null
          wallet_address?: string | null
          admin_notes?: string | null
          approved_by?: string | null
          approved_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          message: string
          read: boolean
          metadata: any | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          message: string
          read?: boolean
          metadata?: any | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          message?: string
          read?: boolean
          metadata?: any | null
          created_at?: string
        }
      }
      kyc_documents: {
        Row: {
          id: string
          user_id: string
          document_type: string
          document_url: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          document_type: string
          document_url: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          document_type?: string
          document_url?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
