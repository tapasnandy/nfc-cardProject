import { createClient } from '@/utils/supabase/server'
import { connection } from 'next/server'
import { generateVCardWithPhoto } from '@/lib/contact-actions'

export const instant = false

export async function GET(
  request: Request,
  { params }: { params: Promise<{ shortCode: string }> }
) {
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

  if (!card || card.status !== 'active' || !card.profiles) {
    return new Response('Contact not found or inactive', { status: 404 })
  }

  const profile = Array.isArray(card.profiles) ? card.profiles[0] : card.profiles
  if (!profile) {
    return new Response('Profile not assigned', { status: 404 })
  }

  const vCardData = await generateVCardWithPhoto(profile)
  const safeFilename = `${(profile.name || 'contact').trim().replace(/[^a-zA-Z0-9_-]/g, '_') || 'contact'}.vcf`

  // Detect iOS Safari: inline disposition triggers native iOS Contact Sheet directly
  const userAgent = request.headers.get('user-agent') || ''
  const isIOS = /iPhone|iPad|iPod/i.test(userAgent)
  const disposition = isIOS
    ? `inline; filename="${safeFilename}"`
    : `attachment; filename="${safeFilename}"`

  return new Response(vCardData, {
    headers: {
      'Content-Type': 'text/vcard; charset=utf-8',
      'Content-Disposition': disposition,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  })
}
