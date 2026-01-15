import { createBrowserClient } from '@supabase/ssr'

// ✅ SINGLETON: Only create ONE client instance for entire app
let client: ReturnType<typeof createBrowserClient> | null = null

export function createSupabaseClient() {
  // If client already exists, return it
  if (client) {
    return client
  }

  // Create client only once
  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  return client
}

// Alternative: Export the client directly
export const supabase = createSupabaseClient()
