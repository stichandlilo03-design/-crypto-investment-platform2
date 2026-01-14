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

// ============================================
// FILE 2: lib/supabase.ts
// ============================================
import { createClient } from '@supabase/supabase-js'
import type { Database } from './supabase/client'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL')
}

if (!supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

// Singleton instances
let adminInstance: ReturnType<typeof createClient<Database>> | null = null
let clientInstance: ReturnType<typeof createClient<Database>> | null = null

// Admin client (server-side only)
export const getSupabaseAdmin = () => {
  if (adminInstance) return adminInstance

  if (!supabaseServiceKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY')
  }

  adminInstance = createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  return adminInstance
}

// Regular client (for server-side operations)
export const getSupabaseClient = () => {
  if (clientInstance) return clientInstance

  clientInstance = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    }
  })

  return clientInstance
}

// Export singletons
export const supabaseAdmin = getSupabaseAdmin()
export const supabase = getSupabaseClient()

// ============================================
// FILE 3: lib/supabase/server.ts
// ============================================
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from './client'

export async function createSupabaseServer() {
  const cookieStore = await cookies()
  
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Handle cookie errors in server components
            console.error('Error setting cookie:', error)
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // Handle cookie errors in server components
            console.error('Error removing cookie:', error)
          }
        },
      },
    }
  )
}
