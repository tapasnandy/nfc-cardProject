'use client'

import { useState, useSyncExternalStore } from 'react'
import { 
  UserPlusIcon, 
  DownloadIcon, 
  CheckIcon, 
  SmartphoneIcon, 
  ExternalLinkIcon, 
  QrCodeIcon 
} from 'lucide-react'
import { generateVCard } from '@/lib/contact-actions'
import { toast } from 'sonner'
import QRCode from 'react-qr-code'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

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

function buildAndroidIntentUrl(profile: ProfileData | null): string {
  if (!profile) return ''

  const parts: string[] = [
    'intent:#Intent',
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

  parts.push('end')
  return parts.join(';')
}

export function SaveContactButton({ shortCode, profile, className = '' }: SaveContactButtonProps) {
  const [saved, setSaved] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const userAgent = useUserAgent()

  const isIOS = /iPad|iPhone|iPod/i.test(userAgent)
  const vcardUrl = shortCode ? `/c/${shortCode}/contact.vcf` : ''
  const safeName = (profile?.name || 'Contact').trim().replace(/[^a-zA-Z0-9_-]/g, '_') || 'Contact'
  const safeFilename = `${safeName}.vcf`

  const androidIntentUrl = buildAndroidIntentUrl(profile)

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
      // On iOS Safari, direct navigation to /contact.vcf natively opens Apple Contact Card
      setSaved(true)
      setTimeout(() => setSaved(false), 4000)
      return
    }

    // On Android (Redmi, Samsung, etc.) and Desktop:
    // Prevent default navigation to avoid blank page and trigger the download + modal popup
    e.preventDefault()
    triggerDownload()
    setSaved(true)
    setShowModal(true)
    toast.success('Contact downloaded! Tap Open to save.')
  }

  return (
    <div className={`w-full mb-6 space-y-2 ${className}`}>
      {/* Primary Action Button */}
      <a
        href={isIOS && vcardUrl ? vcardUrl : '#'}
        onClick={handleMainAction}
        className="w-full rounded-full font-bold shadow-md hover:shadow-lg transition-all text-base py-4 px-6 bg-primary text-primary-foreground flex items-center justify-center gap-2 cursor-pointer no-underline select-none active:scale-[0.98]"
      >
        {saved ? (
          <>
            <CheckIcon className="h-5 w-5" />
            Contact Ready
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
          <button
            type="button"
            onClick={() => {
              triggerDownload()
              setShowModal(true)
            }}
            className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 underline underline-offset-2 transition-colors cursor-pointer"
          >
            <DownloadIcon className="h-3 w-3" />
            How to save / Download .vcf
          </button>
        </div>
      )}

      {/* Save Contact Guide & Modal Popup for Mobile (Android/Redmi) */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md max-w-[92vw] p-5 rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="text-left space-y-1">
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <SmartphoneIcon className="h-5 w-5 text-primary" />
              Save to Phone Contacts
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Add {profile?.name || 'this contact'} directly into your phone&apos;s address book.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 my-2">
            {/* Step 1: Open the downloaded file */}
            <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-xl space-y-2">
              <div className="flex items-center gap-2 font-semibold text-xs text-blue-900 dark:text-blue-300">
                <DownloadIcon className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
                <span>Step 1: Open Downloaded File</span>
              </div>
              <p className="text-[12px] text-blue-800 dark:text-blue-300/90 leading-relaxed">
                Your phone just downloaded <strong>{safeFilename}</strong>. Look at the <strong>bottom of your screen</strong> (or swipe down your <strong>notification bar</strong>) and tap <strong>&quot;Open&quot;</strong>.
              </p>
              <div className="pt-0.5">
                <button
                  type="button"
                  onClick={triggerDownload}
                  className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 underline underline-offset-2"
                >
                  Download again
                </button>
              </div>
            </div>

            {/* Step 2: Direct Android App Intent */}
            {androidIntentUrl && (
              <div className="p-3.5 bg-zinc-50 dark:bg-zinc-850/50 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-2">
                <div className="flex items-center gap-2 font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                  <ExternalLinkIcon className="h-4 w-4 shrink-0 text-zinc-600 dark:text-zinc-400" />
                  <span>Option 2: Direct Contacts App Screen</span>
                </div>
                <p className="text-[12px] text-muted-foreground leading-relaxed">
                  Tap below to launch your phone&apos;s Contacts editor screen with pre-filled details.
                </p>
                <a
                  href={androidIntentUrl}
                  className="inline-flex items-center justify-center w-full py-2.5 px-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 font-medium text-xs transition-colors gap-1.5 no-underline mt-1"
                >
                  <UserPlusIcon className="h-3.5 w-3.5" />
                  Launch Contacts Editor
                </a>
              </div>
            )}

            {/* Step 3: Instant Camera Scan QR */}
            <div className="p-3.5 bg-zinc-50 dark:bg-zinc-850/50 border border-zinc-200 dark:border-zinc-800 rounded-xl flex flex-col items-center text-center space-y-2">
              <div className="flex items-center gap-2 font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                <QrCodeIcon className="h-4 w-4 shrink-0 text-primary" />
                <span>Option 3: Camera Scan (Direct Popup, 0 Downloads)</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Scan this QR code with any smartphone camera (or Redmi Scanner) to pop up &quot;Add Contact&quot; immediately.
              </p>
              <div className="p-3 bg-white rounded-xl shadow-sm border mt-1">
                <QRCode value={vCardString} size={150} />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
