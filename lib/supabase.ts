// ============================================
// SERVER-SIDE SUPABASE CLIENT (for API routes and server components)
// ============================================
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables')
}

// This is the ADMIN client with service role key
// Use this ONLY in API routes or server-side code
// DO NOT use this in client components
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Re-export the Database type if you have it defined elsewhere
// If you don't have a Database type, you can remove this or create one
export type Database = any // Replace with your actual database types if you have them
