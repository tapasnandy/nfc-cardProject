import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fgjshjyuhozkuppxlvfn.supabase.co'
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnanNoanl1aG96a3VwcHhsdmZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEzNzkzMjgsImV4cCI6MjEwNjk1NTMyOH0.O5wzFj3VAVMhvJVj8gFgf2OMcUJwIqe6kW5HwvDto1s'

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
