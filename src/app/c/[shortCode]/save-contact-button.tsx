'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { UserPlusIcon, DownloadIcon } from 'lucide-react'

import { generateVCard } from '@/lib/contact-actions'

export interface ProfileData {
  name?: string | null
  phone?: string | null
  email?: string | null
  company?: string | null
  job_title?: string | null
  address?: string | null
  bio?: string | null
  whatsapp?: string | null
  website?: string | null
  linkedin?: string | null
  instagram?: string | null
  facebook?: string | null
}

export interface SaveContactButtonProps {
  shortCode?: string
  profile: ProfileData | null
  className?: string
}

export function SaveContactButton({ shortCode, profile, className = '' }: SaveContactButtonProps) {
  const [downloading, setDownloading] = useState(false)
  const vcardUrl = shortCode ? `/c/${shortCode}/contact.vcf` : ''

  // Build Android Intent URL to launch native "Add to Contacts" screen directly
  const buildAndroidIntentUrl = () => {
    const parts = [
      'intent:#Intent',
      'action=android.intent.action.INSERT',
      'type=vnd.android.cursor.dir/contact',
    ]

    if (profile?.name) parts.push(`S.name=${encodeURIComponent(profile.name)}`)
    if (profile?.phone) parts.push(`S.phone=${encodeURIComponent(profile.phone)}`)
    if (profile?.email) parts.push(`S.email=${encodeURIComponent(profile.email)}`)
    if (profile?.company) parts.push(`S.company=${encodeURIComponent(profile.company)}`)
    if (profile?.job_title) parts.push(`S.job_title=${encodeURIComponent(profile.job_title)}`)
    if (profile?.address) parts.push(`S.postal=${encodeURIComponent(profile.address)}`)

    const notes: string[] = []
    if (profile?.bio) notes.push(profile.bio)
    if (profile?.whatsapp) notes.push(`WhatsApp: ${profile.whatsapp}`)
    if (profile?.website) notes.push(`Website: ${profile.website}`)
    if (profile?.linkedin) notes.push(`LinkedIn: ${profile.linkedin}`)
    if (profile?.instagram) notes.push(`Instagram: ${profile.instagram}`)
    if (profile?.facebook) notes.push(`Facebook: ${profile.facebook}`)

    if (notes.length > 0) {
      parts.push(`S.notes=${encodeURIComponent(notes.join('\n'))}`)
    }

    parts.push('end')
    return parts.join(';')
  }

  const handleSaveContact = () => {
    setDownloading(true)
    setTimeout(() => setDownloading(false), 3000)

    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : ''
    const isAndroid = /Android/i.test(userAgent)

    let targetUrl = isAndroid ? buildAndroidIntentUrl() : vcardUrl
    let objectUrlToRevoke: string | null = null

    if (!isAndroid && !vcardUrl && profile) {
      try {
        const vCardString = generateVCard({
          name: profile.name || 'Contact',
          phone: profile.phone,
          email: profile.email,
          company: profile.company,
          job_title: profile.job_title,
          address: profile.address,
          bio: profile.bio,
          whatsapp: profile.whatsapp,
          website: profile.website,
          linkedin: profile.linkedin,
          instagram: profile.instagram,
          facebook: profile.facebook,
        })
        const blob = new Blob([vCardString], { type: 'text/vcard;charset=utf-8' })
        targetUrl = URL.createObjectURL(blob)
        objectUrlToRevoke = targetUrl
      } catch (err) {
        console.error('Failed to generate fallback vCard:', err)
      }
    }

    if (targetUrl) {
      // Trigger native OS handler via anchor click (preserves user gesture for Android Intent and iOS Contact Card)
      const link = document.createElement('a')
      link.href = targetUrl
      if (objectUrlToRevoke) {
        link.download = `${(profile?.name || 'contact').replace(/[^a-zA-Z0-9_-]/g, '_')}.vcf`
      }
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      if (objectUrlToRevoke) {
        setTimeout(() => URL.revokeObjectURL(objectUrlToRevoke!), 2000)
      }
    }
  }

  return (
    <div className={`w-full mb-6 space-y-2 ${className}`}>
      <Button
        onClick={handleSaveContact}
        size="lg"
        className="w-full rounded-full font-bold shadow-md hover:shadow-lg transition-all text-base py-6 bg-primary text-primary-foreground flex items-center justify-center gap-2 cursor-pointer"
      >
        <UserPlusIcon className="h-5 w-5" />
        {downloading ? 'Opening Contacts...' : 'Save to Contacts'}
      </Button>

      {/* Fallback button for downloading .vcf directly if needed */}
      {vcardUrl && (
        <div className="text-center">
          <a
            href={vcardUrl}
            download={`${(profile?.name || 'contact').replace(/[^a-zA-Z0-9_-]/g, '_')}.vcf`}
            className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 underline underline-offset-2 transition-colors"
          >
            <DownloadIcon className="h-3 w-3" />
            Or download .vcf contact card
          </a>
        </div>
      )}
    </div>
  )
}
