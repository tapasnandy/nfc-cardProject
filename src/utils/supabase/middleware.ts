import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Fast path: if no Supabase auth cookies are present, skip auth network refresh.
  // This drastically speeds up anonymous requests (landing page, public card scans)
  // and prevents runtime Worker timeouts.
  const cookies = request.cookies.getAll()
  const hasAuthCookie = cookies.some(
    (c) => c.name.startsWith('sb-') || c.name.includes('auth-token')
  )

  if (!hasAuthCookie) {
    return supabaseResponse
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fgjshjyuhozkuppxlvfn.supabase.co'
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnanNoanl1aG96a3VwcHhsdmZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEzNzkzMjgsImV4cCI6MjEwNjk1NTMyOH0.O5wzFj3VAVMhvJVj8gFgf2OMcUJwIqe6kW5HwvDto1s'

  try {
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            supabaseResponse = NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    // refreshing the auth token
    await supabase.auth.getUser()
  } catch (err) {
    console.error('Supabase middleware auth refresh error:', err)
  }

  return supabaseResponse
}
