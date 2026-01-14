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
