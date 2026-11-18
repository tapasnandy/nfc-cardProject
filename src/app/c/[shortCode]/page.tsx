import { createPublicClient } from '@/utils/supabase/public'
import { notFound } from 'next/navigation'
import { cacheLife, cacheTag } from 'next/cache'
import { DigitalBusinessCard } from '@/components/digital-business-card'
import { TapAnalyticsTracker } from '@/components/tap-analytics-tracker'

export const instant = false

/**
 * Cached data fetcher for public card profiles using Next.js 16 Cache Components.
 * Keeps public card profiles cached in memory for sub-50ms responses.
 */
async function getCardByShortCode(shortCode: string) {
  'use cache'
  cacheLife('minutes')
  cacheTag(`card-${shortCode}`, 'cards')

  const supabase = createPublicClient()

  const { data: card } = await supabase
    .from('cards')
    .select(`
      id,
      organization_id,
      status,
      profiles (
        id, organization_id, name, job_title, company, bio, profile_photo, phone, email, whatsapp, website, linkedin, facebook, instagram, address
      )
    `)
    .eq('short_code', shortCode)
    .single()

  return card
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ shortCode: string }>
}) {
  const { shortCode } = await params
  const card = await getCardByShortCode(shortCode)

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

  return (
    <div className="min-h-screen bg-zinc-100/70 dark:bg-zinc-950 sm:py-8 sm:px-4 flex items-start justify-center font-sans">
      <TapAnalyticsTracker cardId={card.id} />
      <DigitalBusinessCard
        profile={profile}
        shortCode={shortCode}
        cardId={card.id}
        organizationId={card.organization_id || profile.organization_id || undefined}
        hasAiVision={!!process.env.GEMINI_API_KEY}
      />
    </div>
  )
}
