import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { connection } from 'next/server'
import { DigitalBusinessCard } from '@/components/digital-business-card'

export const instant = false

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ shortCode: string }>
}) {
  await connection()
  const { shortCode } = await params
  const supabase = await createClient()

  // Find the card and associated profile
  const { data: card } = await supabase
    .from('cards')
    .select(`
      id,
      status,
      profiles (
        id, name, job_title, company, bio, profile_photo, phone, email, whatsapp, website, linkedin, facebook, instagram, address
      )
    `)
    .eq('short_code', shortCode)
    .single()

  if (!card) {
    notFound()
  }

  if (card.status !== 'active') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
        <div className="text-center p-6 bg-card rounded-2xl border shadow-sm max-w-sm w-full">
          <h1 className="text-xl font-bold mb-2">Card Inactive</h1>
          <p className="text-sm text-muted-foreground">This NFC card has been deactivated.</p>
        </div>
      </div>
    )
  }

  const profile = Array.isArray(card.profiles) ? card.profiles[0] : card.profiles
  
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
        <div className="text-center p-6 bg-card rounded-2xl border shadow-sm max-w-sm w-full">
          <h1 className="text-xl font-bold mb-2">Card Not Assigned</h1>
          <p className="text-sm text-muted-foreground">This card has not been assigned to a profile yet.</p>
        </div>
      </div>
    )
  }

  // Analytics event recording
  try {
    const headersList = await headers()
    const userAgent = headersList.get('user-agent') || 'Unknown'
    
    // Simple device detection
    let deviceType = 'Desktop'
    if (/mobile/i.test(userAgent)) deviceType = 'Mobile'
    if (/tablet/i.test(userAgent)) deviceType = 'Tablet'

    await supabase.from('analytics_events').insert({
      card_id: card.id,
      event_type: 'tap',
      device_type: deviceType,
      user_agent: userAgent.substring(0, 255)
    })
  } catch (e) {
    console.error('Failed to log analytics:', e)
  }

  return (
    <div className="min-h-screen bg-zinc-100/70 dark:bg-zinc-950 sm:py-8 sm:px-4 flex items-start justify-center font-sans">
      <DigitalBusinessCard profile={profile} shortCode={shortCode} />
    </div>
  )
}
