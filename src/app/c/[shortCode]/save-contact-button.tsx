'use client'

import { useState, useSyncExternalStore } from 'react'
import { UserPlusIcon, DownloadIcon, CheckIcon } from 'lucide-react'
import { toast } from 'sonner'

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
  profile_photo?: string | null
}

export interface SaveContactButtonProps {
  shortCode?: string
  profile: ProfileData | null
  className?: string
}

const emptySubscribe = () => () => {}

function useUserAgent() {
  return useSyncExternalStore(
    emptySubscribe,
    () => (typeof navigator !== 'undefined' ? navigator.userAgent : ''),
    () => ''
  )
}

function useOrigin() {
  return useSyncExternalStore(
    emptySubscribe,
    () => (typeof window !== 'undefined' ? window.location.origin : ''),
    () => ''
  )
}

function buildAndroidIntentUrl(profile: ProfileData | null, fallbackUrl: string): string {
  if (!profile) return ''

  const parts: string[] = [
    'intent://vnd.android.cursor.dir/contact/#Intent',
    'action=android.intent.action.INSERT',
    'type=vnd.android.cursor.dir/contact',
  ]

  if (profile.name) {
    parts.push(`S.name=${encodeURIComponent(profile.name.trim())}`)
  }

  const phone = (profile.phone || profile.whatsapp || '').trim()
  if (phone) {
    parts.push(`S.phone=${encodeURIComponent(phone)}`)
  }

  if (profile.email) {
    parts.push(`S.email=${encodeURIComponent(profile.email.trim())}`)
  }

  if (profile.company) {
    parts.push(`S.company=${encodeURIComponent(profile.company.trim())}`)
  }

  if (profile.job_title) {
    parts.push(`S.job_title=${encodeURIComponent(profile.job_title.trim())}`)
  }

  if (profile.address) {
    const cleanAddress = profile.address.trim().replace(/\r?\n/g, ', ')
    parts.push(`S.postal=${encodeURIComponent(cleanAddress)}`)
  }

  const notesList: string[] = []
  if (profile.bio) notesList.push(profile.bio.trim())
  if (profile.whatsapp && profile.whatsapp !== profile.phone) {
    notesList.push(`WhatsApp: ${profile.whatsapp.trim()}`)
  }
  if (profile.website) notesList.push(`Website: ${profile.website.trim()}`)
  if (profile.linkedin) notesList.push(`LinkedIn: ${profile.linkedin.trim()}`)
  if (profile.instagram) notesList.push(`Instagram: ${profile.instagram.trim()}`)
  if (profile.facebook) notesList.push(`Facebook: ${profile.facebook.trim()}`)

  if (notesList.length > 0) {
    parts.push(`S.notes=${encodeURIComponent(notesList.join('\n'))}`)
  }

  if (fallbackUrl) {
    parts.push(`S.browser_fallback_url=${encodeURIComponent(fallbackUrl)}`)
  }

  parts.push('end')
  return parts.join(';') + ';'
}

export function SaveContactButton({ shortCode, profile, className = '' }: SaveContactButtonProps) {
  const [saved, setSaved] = useState(false)
  const userAgent = useUserAgent()
  const origin = useOrigin()

  const isIOS = /iPad|iPhone|iPod/i.test(userAgent)
  const isAndroid = /Android/i.test(userAgent)

  const vcardUrl = shortCode ? `/c/${shortCode}/contact.vcf` : ''
  const safeName = (profile?.name || 'Contact').trim().replace(/[^a-zA-Z0-9_-]/g, '_') || 'Contact'
  const safeFilename = `${safeName}.vcf`

  const fullFallbackUrl = origin && vcardUrl ? `${origin}${vcardUrl}` : ''
  const androidIntentUrl = buildAndroidIntentUrl(profile, fullFallbackUrl)

  // Target href for the main action
  let href = vcardUrl || '#'
  let downloadAttr: string | undefined = undefined

  if (isAndroid && androidIntentUrl) {
    href = androidIntentUrl
  } else if (isIOS) {
    href = vcardUrl || '#'
  } else {
    // Desktop / other
    href = vcardUrl || '#'
    downloadAttr = safeFilename
  }

  const handleClick = () => {
    setSaved(true)
    toast.success('Opening Contact Card...')
    setTimeout(() => setSaved(false), 4000)
  }

  return (
    <div className={`w-full mb-6 space-y-2 ${className}`}>
      <a
        href={href}
        {...(downloadAttr ? { download: downloadAttr } : {})}
        onClick={handleClick}
        className="w-full rounded-full font-bold shadow-md hover:shadow-lg transition-all text-base py-4 px-6 bg-primary text-primary-foreground flex items-center justify-center gap-2 cursor-pointer no-underline select-none active:scale-[0.98]"
      >
        {saved ? (
          <>
            <CheckIcon className="h-5 w-5" />
            Contact Opened
          </>
        ) : (
          <>
            <UserPlusIcon className="h-5 w-5" />
            Save to Contacts
          </>
        )}
      </a>

      {/* Fallback button for downloading .vcf directly if needed */}
      {vcardUrl && (
        <div className="text-center">
          <a
            href={vcardUrl}
            download={safeFilename}
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
