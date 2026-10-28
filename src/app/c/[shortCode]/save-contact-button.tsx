'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { UserPlusIcon, DownloadIcon, CheckIcon } from 'lucide-react'
import { generateVCard } from '@/lib/contact-actions'
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

export function SaveContactButton({ shortCode, profile, className = '' }: SaveContactButtonProps) {
  const [downloading, setDownloading] = useState(false)
  const [saved, setSaved] = useState(false)
  const vcardUrl = shortCode ? `/c/${shortCode}/contact.vcf` : ''

  const safeName = (profile?.name || 'Contact').trim().replace(/[^a-zA-Z0-9_-]/g, '_') || 'Contact'
  const safeFilename = `${safeName}.vcf`

  const triggerBlobDownload = (vCardString: string) => {
    const blob = new Blob([vCardString], { type: 'text/vcard;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', safeFilename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setTimeout(() => URL.revokeObjectURL(url), 3000)
  }

  const handleSaveContact = async () => {
    if (downloading) return
    setDownloading(true)

    try {
      const vCardString = generateVCard({
        name: profile?.name || 'Contact',
        phone: profile?.phone,
        email: profile?.email,
        company: profile?.company,
        job_title: profile?.job_title,
        address: profile?.address,
        bio: profile?.bio,
        whatsapp: profile?.whatsapp,
        website: profile?.website,
        linkedin: profile?.linkedin,
        instagram: profile?.instagram,
        facebook: profile?.facebook,
        profile_photo: profile?.profile_photo,
      })

      const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : ''
      const isIOS = /iPhone|iPad|iPod/i.test(userAgent)

      // 1. On iOS Safari:
      // Direct navigation to /contact.vcf with 'Content-Disposition: inline'
      // natively prompts the Apple Contact Card sheet with the "Done" / "Save" button.
      if (isIOS && vcardUrl) {
        window.location.href = vcardUrl
        setSaved(true)
        toast.success('Opening Contact Card...')
        setTimeout(() => setSaved(false), 4000)
        return
      }

      // 2. On Android & modern mobile browsers:
      // Try Web Share API with .vcf file. Android's native share sheet offers
      // direct "Contacts - Add to Contacts" option.
      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        try {
          const file = new File([vCardString], safeFilename, { type: 'text/vcard' })
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: profile?.name || 'Contact',
              text: `Save contact for ${profile?.name || 'Contact'}`,
            })
            setSaved(true)
            toast.success('Contact shared! Select Contacts to save.')
            setTimeout(() => setSaved(false), 4000)
            return
          }
        } catch (err: unknown) {
          const error = err as Error
          // If the user dismissed or cancelled the share sheet, return silently
          if (error.name === 'AbortError') {
            return
          }
          console.warn('Native share failed, falling back to download:', error)
        }
      }

      // 3. Fallback for Desktop, Android browsers without file share, or WebViews:
      // Directly trigger a client-side .vcf file download
      triggerBlobDownload(vCardString)
      setSaved(true)
      toast.info("Contact downloaded! Tap 'Open' or check your downloads to save.", {
        duration: 5000,
      })
      setTimeout(() => setSaved(false), 4000)
    } catch (error) {
      console.error('Failed to save contact:', error)
      toast.error('Could not save contact. Please use the direct download link below.')
    } finally {
      setTimeout(() => setDownloading(false), 1500)
    }
  }

  return (
    <div className={`w-full mb-6 space-y-2 ${className}`}>
      <Button
        onClick={handleSaveContact}
        disabled={downloading}
        size="lg"
        className="w-full rounded-full font-bold shadow-md hover:shadow-lg transition-all text-base py-6 bg-primary text-primary-foreground flex items-center justify-center gap-2 cursor-pointer"
      >
        {saved ? (
          <>
            <CheckIcon className="h-5 w-5" />
            Contact Opened
          </>
        ) : (
          <>
            <UserPlusIcon className="h-5 w-5" />
            {downloading ? 'Opening Contacts...' : 'Save to Contacts'}
          </>
        )}
      </Button>

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
