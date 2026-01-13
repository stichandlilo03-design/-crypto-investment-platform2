export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          balance: number
          total_deposits: number
          total_withdrawals: number
          status: 'active' | 'suspended' | 'pending'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          balance?: number
          total_deposits?: number
          total_withdrawals?: number
          status?: 'active' | 'suspended' | 'pending'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          balance?: number
          total_deposits?: number
          total_withdrawals?: number
          status?: 'active' | 'suspended' | 'pending'
          created_at?: string
          updated_at?: string
        }
      }
      deposits: {
        Row: {
          id: string
          user_id: string
          amount: number
          asset: string
          tx_hash: string | null
          payment_proof_url: string | null
          status: 'pending' | 'approved' | 'rejected' | 'processing'
          admin_notes: string | null
          approved_by: string | null
          approved_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          asset: string
          tx_hash?: string | null
          payment_proof_url?: string | null
          status?: 'pending' | 'approved' | 'rejected' | 'processing'
          admin_notes?: string | null
          approved_by?: string | null
          approved_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          asset?: string
          tx_hash?: string | null
          payment_proof_url?: string | null
          status?: 'pending' | 'approved' | 'rejected' | 'processing'
          admin_notes?: string | null
          approved_by?: string | null
          approved_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      withdrawals: {
        Row: {
          id: string
          user_id: string
          amount: number
          asset: string
          wallet_address: string
          status: 'pending' | 'approved' | 'rejected' | 'processing' | 'completed'
          admin_notes: string | null
          approved_by: string | null
          approved_at: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          asset: string
          wallet_address: string
          status?: 'pending' | 'approved' | 'rejected' | 'processing' | 'completed'
          admin_notes?: string | null
          approved_by?: string | null
          approved_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          asset?: string
          wallet_address?: string
          status?: 'pending' | 'approved' | 'rejected' | 'processing' | 'completed'
          admin_notes?: string | null
          approved_by?: string | null
          approved_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          type: 'deposit' | 'withdrawal' | 'trade' | 'transfer'
          amount: number
          asset: string
          description: string | null
          status: 'pending' | 'completed' | 'failed' | 'cancelled'
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'deposit' | 'withdrawal' | 'trade' | 'transfer'
          amount: number
          asset: string
          description?: string | null
          status?: 'pending' | 'completed' | 'failed' | 'cancelled'
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'deposit' | 'withdrawal' | 'trade' | 'transfer'
          amount?: number
          asset?: string
          description?: string | null
          status?: 'pending' | 'completed' | 'failed' | 'cancelled'
          metadata?: Json | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
