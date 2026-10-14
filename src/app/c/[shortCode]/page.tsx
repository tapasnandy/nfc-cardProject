import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { connection } from 'next/server'
import { DigitalBusinessCard } from '@/components/digital-business-card'
import { SmartphoneNfcIcon, AlertCircleIcon } from 'lucide-react'

export const instant = false

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ shortCode: string }>
}) {
  const { shortCode } = await params
  const supabase = await createClient()

  // Find the card and associated profile
  const { data: card } = await supabase
    .from('cards')
    .select(`
      id,
      status,
      profiles (
        id, 
        name, 
        job_title, 
        company, 
        bio, 
        profile_photo, 
        phone, 
        email, 
        whatsapp, 
        website, 
        linkedin, 
        facebook, 
        instagram, 
        address
      )
    `)
    .eq('short_code', shortCode)
    .single()

  if (!card) {
    notFound()
  }

  // Handle Deactivated Card State
  if (card.status !== 'active') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-950 font-sans">
        <div className="w-full max-w-sm p-8 text-center bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xl">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <AlertCircleIcon className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">Card Inactive</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            This NFC digital business card has been temporarily deactivated by its owner.
          </p>
        </div>
      </div>
    )
  }

  const profile = Array.isArray(card.profiles) ? card.profiles[0] : card.profiles
  
  // Handle Unassigned Card State
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-950 font-sans">
        <div className="w-full max-w-sm p-8 text-center bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xl">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <SmartphoneNfcIcon className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">Card Not Assigned</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            This NFC card has not been linked to a digital profile yet. Log in to your dashboard to assign it.
          </p>
        </div>
      </div>
    )
  }

  // Record Tap Analytics Event (failsafe)
  try {
    const headersList = await headers()
    const userAgent = headersList.get('user-agent') || 'Unknown'
    
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

  await connection()

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 sm:p-4 md:p-8 flex items-start justify-center font-sans antialiased">
      <DigitalBusinessCard profile={profile} />
    </div>
  )
}
