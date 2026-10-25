import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { MailIcon, PhoneIcon, GlobeIcon, MapPinIcon } from 'lucide-react'
import Link from 'next/link'
import { headers } from 'next/headers'
import { connection } from 'next/server'

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
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Card Inactive</h1>
          <p className="text-muted-foreground">This NFC card has been deactivated.</p>
        </div>
      </div>
    )
  }

  const profile = Array.isArray(card.profiles) ? card.profiles[0] : card.profiles
  
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Not Setup</h1>
          <p className="text-muted-foreground">This card has not been assigned to a profile yet.</p>
        </div>
      </div>
    )
  }

  // Phase 5: record analytics event
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
      user_agent: userAgent.substring(0, 255) // Keep it within typical limits
    })
  } catch (e) {
    console.error('Failed to log analytics:', e)
    // Fail silently so the user still sees the profile
  }

  await connection();

  const nameParts = profile.name.split(' ');
  const lastName = nameParts.length > 1 ? nameParts.pop() : '';
  const firstName = nameParts.join(' ');

  // Create vCard string for "Save Contact" button
  const vCardData = `BEGIN:VCARD
VERSION:3.0
N:${lastName};${firstName};;;
FN:${profile.name}
ORG:${profile.company || ''}
TITLE:${profile.job_title || ''}
TEL;type=CELL:${profile.phone || ''}
TEL;type=WORK,MSG:${profile.whatsapp ? profile.whatsapp.replace(/[^0-9+]/g, '') : ''}
EMAIL;type=INTERNET:${profile.email || ''}
URL:${profile.website || ''}
URL;type=LinkedIn:${profile.linkedin || ''}
URL;type=Instagram:${profile.instagram || ''}
URL;type=Facebook:${profile.facebook || ''}
ADR;type=WORK:;;${(profile.address || '').replace(/\n/g, ' ')};;;;
NOTE:${(profile.bio || '').replace(/\n/g, '\\n')}
PHOTO;VALUE=uri:${profile.profile_photo || ''}
END:VCARD`

  const vCardUrl = `data:text/vcard;charset=utf-8,${encodeURIComponent(vCardData)}`

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 sm:p-4 md:p-8 flex items-start justify-center font-sans">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 sm:rounded-3xl shadow-xl overflow-hidden min-h-screen sm:min-h-0 border border-zinc-200 dark:border-zinc-800">
        
        {/* Cover / Header Area */}
        <div className="h-32 bg-gradient-to-r from-blue-500 to-indigo-600 relative"></div>
        
        <div className="px-6 pb-6 pt-0 relative">
          <div className="flex justify-center -mt-16 mb-4">
            <Avatar className="h-32 w-32 border-4 border-white dark:border-zinc-900 shadow-lg">
              <AvatarImage src={profile.profile_photo || ''} alt={profile.name} className="object-cover" />
              <AvatarFallback className="text-3xl bg-muted">{profile.name.charAt(0)}</AvatarFallback>
            </Avatar>
          </div>
          
          <div className="text-center space-y-1 mb-6">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{profile.name}</h1>
            {(profile.job_title || profile.company) && (
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                {profile.job_title} {profile.job_title && profile.company ? 'at' : ''} {profile.company}
              </p>
            )}
            {profile.bio && (
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                {profile.bio}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            {profile.phone && (
                <a href={`tel:${profile.phone}`} className="inline-flex h-9 items-center justify-center rounded-lg border border-transparent bg-zinc-900 text-sm font-medium text-white shadow hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 w-full transition-colors">
                  <PhoneIcon className="mr-2 h-4 w-4" /> Call
                </a>
            )}
            {profile.email && (
                <a href={`mailto:${profile.email}`} className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-background text-sm font-medium shadow hover:bg-muted w-full transition-colors">
                  <MailIcon className="mr-2 h-4 w-4" /> Email
                </a>
            )}
            {profile.whatsapp && (
                <a href={`https://wa.me/${profile.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center justify-center rounded-lg border border-green-200 text-sm font-medium text-green-700 shadow hover:bg-green-50 dark:border-green-900 dark:text-green-400 dark:hover:bg-green-900/20 col-span-2 transition-colors">
                  WhatsApp
                </a>
            )}
          </div>

          <a href={vCardUrl} download={`${profile.name.replace(/\s+/g, '_')}_Contact.vcf`} className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-8 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 w-full mb-6 transition-all font-bold">
            Save Contact
          </a>

          <div className="space-y-4">
            {profile.website && (
              <Card className="border-0 shadow-sm bg-zinc-50 dark:bg-zinc-800/50">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="bg-blue-100 dark:bg-blue-900/50 p-2 rounded-full">
                    <GlobeIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-xs text-muted-foreground font-medium mb-1">Website</p>
                    <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:underline truncate block">
                      {profile.website.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {profile.address && (
              <Card className="border-0 shadow-sm bg-zinc-50 dark:bg-zinc-800/50">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="bg-red-100 dark:bg-red-900/50 p-2 rounded-full">
                    <MapPinIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground font-medium mb-1">Address</p>
                    <p className="text-sm font-medium">{profile.address}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          
          {(profile.linkedin || profile.instagram || profile.facebook) && (
            <div className="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-800 text-center">
              <p className="text-xs font-semibold text-muted-foreground mb-4 uppercase tracking-wider">Connect with me</p>
              <div className="flex justify-center gap-4">
                {profile.linkedin && (
                  <Link href={profile.linkedin} target="_blank" className="text-blue-700 hover:opacity-80 transition-opacity">
                    LinkedIn
                  </Link>
                )}
                {profile.instagram && (
                  <Link href={profile.instagram} target="_blank" className="text-pink-600 hover:opacity-80 transition-opacity">
                    Instagram
                  </Link>
                )}
                {profile.facebook && (
                  <Link href={profile.facebook} target="_blank" className="text-blue-600 hover:opacity-80 transition-opacity">
                    Facebook
                  </Link>
                )}
              </div>
            </div>
          )}
          
          <div className="mt-8 text-center pb-4">
             <Link href="/" className="text-[10px] text-muted-foreground uppercase tracking-widest hover:text-foreground transition-colors">
               Powered by TapNet
             </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
