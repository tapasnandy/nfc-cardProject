import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

/**
 * Lightweight, non-blocking Route Handler for NFC card tap analytics.
 * Receives background beacon/fetch from client without blocking the profile HTML response.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    const cardId = body?.cardId

    if (!cardId || typeof cardId !== 'string') {
      return NextResponse.json({ success: false, error: 'cardId required' }, { status: 400 })
    }

    const userAgent = req.headers.get('user-agent') || 'Unknown'

    // Simple device detection
    let deviceType = 'Desktop'
    if (/mobile/i.test(userAgent)) deviceType = 'Mobile'
    if (/tablet/i.test(userAgent)) deviceType = 'Tablet'

    const supabase = await createClient()

    await supabase.from('analytics_events').insert({
      card_id: cardId,
      event_type: 'tap',
      device_type: deviceType,
      user_agent: userAgent.substring(0, 255),
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Non-blocking tap analytics error:', err)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
