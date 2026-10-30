'use client'

import { useState, useSyncExternalStore } from 'react'
import { UserPlusIcon, CheckIcon } from 'lucide-react'
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

const emptySubscribe = () => () => {}

function useUserAgent() {
  return useSyncExternalStore(
    emptySubscribe,
    () => (typeof navigator !== 'undefined' ? navigator.userAgent : ''),
    () => ''
  )
}

export function SaveContactButton({ shortCode, profile, className = '' }: SaveContactButtonProps) {
  const [saved, setSaved] = useState(false)
  const userAgent = useUserAgent()

  const isIOS = /iPad|iPhone|iPod/i.test(userAgent)
  const vcardUrl = shortCode ? `/c/${shortCode}/contact.vcf` : ''
  const safeName = (profile?.name || 'Contact').trim().replace(/[^a-zA-Z0-9_-]/g, '_') || 'Contact'
  const safeFilename = `${safeName}.vcf`

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

  const triggerDownload = () => {
    if (vcardUrl) {
      const link = document.createElement('a')
      link.href = vcardUrl
      link.download = safeFilename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } else {
      const blob = new Blob([vCardString], { type: 'text/vcard;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = safeFilename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      setTimeout(() => URL.revokeObjectURL(url), 3000)
    }
  }

  const handleMainAction = (e: React.MouseEvent) => {
    if (isIOS && vcardUrl) {
      setSaved(true)
      setTimeout(() => setSaved(false), 4000)
      return
    }

    e.preventDefault()
    triggerDownload()
    setSaved(true)
    toast.success('Contact ready! Tap "Open" to save to phone.', { duration: 5000 })
    setTimeout(() => setSaved(false), 5000)
  }

  return (
    <div className={`w-full mb-6 ${className}`}>
      {/* Primary Action Button */}
      <a
        href={isIOS && vcardUrl ? vcardUrl : '#'}
        onClick={handleMainAction}
        className="w-full rounded-full font-bold shadow-md hover:shadow-lg transition-all text-base py-4 px-6 bg-primary text-primary-foreground flex items-center justify-center gap-2 cursor-pointer no-underline select-none active:scale-[0.98]"
      >
        {saved ? (
          <>
            <CheckIcon className="h-5 w-5" />
            Contact Saved
          </>
        ) : (
          <>
            <UserPlusIcon className="h-5 w-5" />
            Save to Contacts
          </>
        )}
      </a>
    </div>
  )
}

