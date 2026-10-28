'use client'

import { useState, useSyncExternalStore } from 'react'
import { 
  UserPlusIcon, 
  DownloadIcon, 
  CheckIcon, 
  SmartphoneIcon, 
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

export function SaveContactButton({ shortCode, profile, className = '' }: SaveContactButtonProps) {
  const [saved, setSaved] = useState(false)
  const [showModal, setShowModal] = useState(false)
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
      // On iOS Safari, direct navigation to /contact.vcf natively opens the Apple Contact Card sheet
      setSaved(true)
      setTimeout(() => setSaved(false), 4000)
      return
    }

    // On Android / Redmi / Desktop:
    e.preventDefault()
    triggerDownload()
    setSaved(true)
    setShowModal(true)
    toast.success('Contact file ready! Tap Open to save.')
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

      {/* Direct download helper */}
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
            How to save / Download file
          </button>
        </div>
      )}

      {/* Simple Guidance Modal for Mobile (Android / Redmi) */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md max-w-[92vw] p-5 rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="text-left space-y-1">
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <SmartphoneIcon className="h-5 w-5 text-primary" />
              Save {profile?.name || 'Contact'}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Follow these simple steps to save directly into your phone:
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 my-2">
            {/* Step 1: Open the downloaded file */}
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-xl space-y-2">
              <div className="flex items-center gap-2 font-bold text-xs text-emerald-900 dark:text-emerald-300">
                <CheckIcon className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>Step 1: Tap &quot;Open&quot; on your phone</span>
              </div>
              <p className="text-[12px] text-emerald-800 dark:text-emerald-300/90 leading-relaxed">
                Your phone just downloaded <strong>{safeFilename}</strong>. Look at the <strong>bottom of your screen</strong> (or swipe down your <strong>notification bar</strong>) and tap <strong>&quot;Open&quot;</strong>.
              </p>
              <p className="text-[11px] text-muted-foreground">
                Your Contacts app will immediately pop up with all info pre-filled. Tap <strong>Save</strong>!
              </p>
              <div className="pt-1">
                <button
                  type="button"
                  onClick={triggerDownload}
                  className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 underline underline-offset-2"
                >
                  Didn&apos;t see the download? Tap here to download again
                </button>
              </div>
            </div>

            {/* Step 2: Instant Camera Scan QR */}
            <div className="p-4 bg-zinc-50 dark:bg-zinc-850/50 border border-zinc-200 dark:border-zinc-800 rounded-xl flex flex-col items-center text-center space-y-2">
              <div className="flex items-center gap-2 font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                <QrCodeIcon className="h-4 w-4 shrink-0 text-primary" />
                <span>Or Scan with Phone Camera (Direct Popup, 0 Downloads)</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Open your phone camera (or Redmi Scanner) and point at this QR code. It will pop up &quot;Add Contact&quot; immediately!
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
