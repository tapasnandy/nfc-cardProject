import { createClient } from '@/utils/supabase/server'
import { connection } from 'next/server'

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

  const nameParts = (profile.name || 'Contact').trim().split(' ')
  const lastName = nameParts.length > 1 ? nameParts.pop() : ''
  const firstName = nameParts.join(' ')

  const cleanPhone = (profile.phone || '').replace(/[^0-9+]/g, '')
  const cleanWhatsapp = (profile.whatsapp || '').replace(/[^0-9+]/g, '')

  const vCardLines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${lastName};${firstName};;;`,
    `FN:${profile.name}`,
    profile.company ? `ORG:${profile.company}` : '',
    profile.job_title ? `TITLE:${profile.job_title}` : '',
    cleanPhone ? `TEL;TYPE=CELL:${cleanPhone}` : '',
    cleanWhatsapp ? `TEL;TYPE=WORK,MSG:${cleanWhatsapp}` : '',
    profile.email ? `EMAIL;TYPE=INTERNET:${profile.email}` : '',
    profile.website ? `URL:${profile.website}` : '',
    profile.linkedin ? `URL;type=LinkedIn:${profile.linkedin}` : '',
    profile.instagram ? `URL;type=Instagram:${profile.instagram}` : '',
    profile.facebook ? `URL;type=Facebook:${profile.facebook}` : '',
    profile.address ? `ADR;TYPE=WORK:;;${profile.address.replace(/\r?\n/g, ' ')};;;;` : '',
    profile.bio ? `NOTE:${profile.bio.replace(/\r?\n/g, '\\n')}` : '',
    profile.profile_photo ? `PHOTO;VALUE=uri:${profile.profile_photo}` : '',
    'END:VCARD',
  ].filter(Boolean)

  const vCardData = vCardLines.join('\r\n')
  const safeFilename = `${(profile.name || 'contact').replace(/[^a-zA-Z0-9_-]/g, '_')}.vcf`

  const userAgent = request.headers.get('user-agent') || ''
  const isIOS = /iPhone|iPad|iPod/i.test(userAgent)

  return new Response(vCardData, {
    headers: {
      'Content-Type': 'text/vcard; charset=utf-8',
      'Content-Disposition': isIOS
        ? `inline; filename="${safeFilename}"`
        : `attachment; filename="${safeFilename}"`,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  })
}
