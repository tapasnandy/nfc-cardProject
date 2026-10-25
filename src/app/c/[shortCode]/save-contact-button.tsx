'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { UserPlusIcon, CheckIcon } from 'lucide-react'
import { toast } from 'sonner'

interface SaveContactButtonProps {
  shortCode: string
  name: string
  vCardData: string
}

export function SaveContactButton({ shortCode, name, vCardData }: SaveContactButtonProps) {
  const [saved, setSaved] = useState(false)

  const handleSaveContact = async () => {
    const safeFilename = `${(name || 'contact').replace(/[^a-zA-Z0-9_-]/g, '_')}.vcf`
    const vcardEndpoint = `/c/${shortCode}/vcard`

    // Check if the browser supports sharing files (Android Chrome, modern mobile browsers)
    if (typeof navigator !== 'undefined' && 'canShare' in navigator) {
      try {
        const blob = new Blob([vCardData], { type: 'text/vcard;charset=utf-8' })
        const file = new File([blob], safeFilename, { type: 'text/vcard;charset=utf-8' })

        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: name,
            text: `Contact card for ${name}`,
          })
          setSaved(true)
          setTimeout(() => setSaved(false), 4000)
          return
        }
      } catch (err: unknown) {
        const error = err as Error
        // User closed or dismissed the share sheet
        if (error.name === 'AbortError') {
          return
        }
        console.warn('Native share failed, falling back to direct endpoint:', error)
      }
    }

    // Direct endpoint navigation:
    // - On iOS Safari: Opens native iOS Contact Card sheet directly
    // - On Android/Desktop: Downloads the .vcf and prompts "Open" to save into Contacts
    window.location.href = vcardEndpoint
    setSaved(true)
    toast.info("Opening contact! Tap 'Open' or 'Save' to add directly to your address book.", {
      duration: 5000,
    })
    setTimeout(() => setSaved(false), 4000)
  }

  return (
    <Button
      onClick={handleSaveContact}
      size="lg"
      className="w-full mb-6 rounded-full font-bold shadow-md hover:shadow-lg transition-all text-base py-6 bg-primary text-primary-foreground flex items-center justify-center gap-2"
    >
      {saved ? (
        <>
          <CheckIcon className="h-5 w-5" />
          Contact Opened
        </>
      ) : (
        <>
          <UserPlusIcon className="h-5 w-5" />
          Save Contact
        </>
      )}
    </Button>
  )
}
