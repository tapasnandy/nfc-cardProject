import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Cookie-free, lightweight Supabase client for public read-only requests.
 * Compatible with Next.js 16 'use cache' directives.
 */
export function createPublicClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fgjshjyuhozkuppxlvfn.supabase.co'
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnanNoanl1aG96a3VwcHhsdmZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEzNzkzMjgsImV4cCI6MjEwNjk1NTMyOH0.O5wzFj3VAVMhvJVj8gFgf2OMcUJwIqe6kW5HwvDto1s'

  return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}
