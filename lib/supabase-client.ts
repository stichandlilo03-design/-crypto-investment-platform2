import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

let supabaseInstance: ReturnType<typeof createClientComponentClient> | null = null

export function getSupabaseClient() {
  if (!supabaseInstance) {
    supabaseInstance = createClientComponentClient()
  }
  return supabaseInstance
}
