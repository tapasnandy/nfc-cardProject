'use client'

import { useState, useSyncExternalStore } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { 
  CopyIcon, 
  QrCodeIcon, 
  RadioIcon,
  ExternalLinkIcon,
  SparklesIcon,
  CheckCircle2Icon
} from 'lucide-react'
import { toast } from 'sonner'
import QRCode from 'react-qr-code'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

const emptySubscribe = () => () => {}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function WriterInstructions({ cards }: { cards: any[] }) {
  const [selectedCard, setSelectedCard] = useState<string>(cards.length > 0 ? cards[0].short_code : '')
  const [writingNfc, setWritingNfc] = useState(false)

  const appUrl = useSyncExternalStore(
    emptySubscribe,
    () => (typeof window !== 'undefined' ? window.location.origin : ''),
    () => ''
  )

  const currentCard = cards.find(c => c.short_code === selectedCard)
  const profile = currentCard?.profiles ? (Array.isArray(currentCard.profiles) ? currentCard.profiles[0] : currentCard.profiles) : null
  const writeUrl = selectedCard ? `${appUrl}/c/${selectedCard}` : ''

  const copyToClipboard = (text: string, label: string) => {
    if (text) {
      navigator.clipboard.writeText(text)
      toast.success(`${label} copied to clipboard!`)
    }
  }

  // Write directly to physical card using Web NFC in Chrome on Android
  const writeDirectNfc = async () => {
    if (typeof window === 'undefined' || !('NDEFReader' in window)) {
      toast.info(
        '1-Tap Web NFC writing requires Chrome on an Android phone with NFC enabled. You can also copy the URL below and write with the free NFC Tools app.',
        { duration: 7000 }
      )
      return
    }

    try {
      setWritingNfc(true)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ndef = new (window as any).NDEFReader()
      toast.info('Hold your physical NFC card against the back of your phone now...', { duration: 8000 })

      await ndef.write({
        records: [
          {
            recordType: 'url',
            data: writeUrl,
          },
        ],
      })

      toast.success('Card successfully programmed! Tap on any phone to test.', { duration: 5000 })
    } catch (err: unknown) {
      console.error('NFC Write Error:', err)
      const error = err as Error
      if (error.name !== 'AbortError') {
        toast.error(`Write failed: ${error.message || 'Tag disconnected or not supported'}`)
      }
    } finally {
      setWritingNfc(false)
    }
  }

  const downloadQRCode = () => {
    const svg = document.getElementById('qr-code-svg')
    if (!svg) return

    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      if (ctx) {
        ctx.fillStyle = 'white'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0)
        const pngFile = canvas.toDataURL('image/png')
        const downloadLink = document.createElement('a')
        downloadLink.download = `QR_${selectedCard}.png`
        downloadLink.href = `${pngFile}`
        downloadLink.click()
      }
    }
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Informational Header */}
      <div className="p-4 bg-blue-50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-300 rounded-xl flex gap-3 border border-blue-200 dark:border-blue-800">
        <SparklesIcon className="h-5 w-5 mt-0.5 shrink-0 text-blue-600 dark:text-blue-400" />
        <div className="text-sm space-y-1">
          <p className="font-semibold">NFC Card Programming Center</p>
          <p className="text-xs text-blue-800 dark:text-blue-300/90 leading-relaxed">
            Program your physical NFC card with your digital business card profile. When anyone taps your card, their phone opens your full profile with photo, contact saving, WhatsApp, and social links.
          </p>
        </div>
      </div>

      {/* Step 1: Select Card */}
      <div className="space-y-3 bg-card border p-5 rounded-xl shadow-sm">
        <label className="text-sm font-semibold flex items-center gap-2">
          <span>1. Select Card to Program</span>
        </label>
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <Select value={selectedCard} onValueChange={(val) => setSelectedCard(val || '')}>
            <SelectTrigger className="w-full sm:w-[380px]">
              <SelectValue placeholder="Select a card" />
            </SelectTrigger>
            <SelectContent>
              {cards.map(c => {
                const p = c.profiles ? (Array.isArray(c.profiles) ? c.profiles[0] : c.profiles) : null
                return (
                  <SelectItem key={c.id} value={c.short_code}>
                    Card: {c.short_code} {p?.name ? `(${p.name})` : `(${c.status})`}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>

          {profile && (
            <div className="text-xs text-muted-foreground flex items-center gap-2 bg-muted/60 px-3 py-1.5 rounded-lg">
              <Avatar className="h-6 w-6">
                <AvatarImage src={profile.profile_photo || ''} />
                <AvatarFallback className="text-[10px]">{profile.name?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
              <span>Assigned: <strong>{profile.name}</strong></span>
            </div>
          )}
        </div>
      </div>

      {/* Step 2: Write to Card */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Card Programming Box */}
        <div className="border p-5 rounded-xl space-y-4 bg-card shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 font-bold text-base text-foreground">
              <RadioIcon className="h-5 w-5 text-primary" /> 2. Write to Physical NFC Card
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Program your card so that touching it to any smartphone (iPhone or Android) immediately launches your digital business card.
            </p>

            <div className="p-3 bg-muted/40 rounded-lg text-xs space-y-2 border">
              <p className="font-semibold text-foreground text-[11px] uppercase tracking-wider text-muted-foreground">
                Public Card Link:
              </p>
              <div className="flex items-center justify-between gap-2 bg-background p-2 rounded border break-all">
                <span className="font-mono text-xs">{writeUrl || 'Select a card above'}</span>
                {writeUrl && (
                  <a href={writeUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline shrink-0" title="Open live card">
                    <ExternalLinkIcon className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
              <ul className="text-[11px] text-muted-foreground space-y-1 pt-1">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2Icon className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>Works on 100% of iPhones & Android smartphones</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2Icon className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>Includes Profile Photo, WhatsApp, and Social links</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2Icon className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>Update details anytime without replacing the card</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="space-y-3 pt-3 border-t">
            {/* 1-Tap Browser Write Button */}
            <Button 
              onClick={writeDirectNfc} 
              disabled={writingNfc || !writeUrl}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-5 text-sm shadow-sm transition-all"
            >
              <RadioIcon className="h-4 w-4 mr-2" />
              {writingNfc ? 'Touch card to back of phone now...' : 'Write to Card (1-Tap Web NFC)'}
            </Button>

            {writeUrl && (
              <Button 
                onClick={() => copyToClipboard(writeUrl, 'Profile URL')} 
                variant="outline" 
                size="sm" 
                className="w-full text-xs h-9"
              >
                <CopyIcon className="h-3.5 w-3.5 mr-1.5" /> Copy Profile URL
              </Button>
            )}

            <div className="text-[11px] text-muted-foreground bg-muted/30 p-2.5 rounded-lg space-y-1">
              <p className="font-semibold text-foreground">Or write with free NFC Tools mobile app:</p>
              <p>1. Open <strong>NFC Tools</strong> app on your smartphone.</p>
              <p>2. Tap <strong>Write</strong> &gt; <strong>Add a record</strong> &gt; <strong>URL / URI</strong>.</p>
              <p>3. Paste your Profile URL &gt; Tap <strong>Write</strong> and touch your card!</p>
            </div>
          </div>
        </div>

        {/* QR Code Section for Card Back */}
        <div className="border p-5 rounded-xl space-y-4 bg-card shadow-sm flex flex-col justify-between items-center text-center">
          <div className="space-y-2 w-full">
            <div className="flex items-center gap-2 font-bold text-base text-foreground justify-center">
              <QrCodeIcon className="h-5 w-5 text-primary" /> QR Code for Card Back
            </div>
            <p className="text-xs text-muted-foreground">
              Print this QR code on the back of your physical card for devices without NFC.
            </p>
          </div>

          {writeUrl ? (
            <div className="flex flex-col items-center gap-4 my-2">
              <div className="bg-white p-4 rounded-xl shadow-sm border">
                <QRCode id="qr-code-svg" value={writeUrl} size={150} />
              </div>
              <Button onClick={downloadQRCode} variant="outline" size="sm" className="w-full max-w-[200px] text-xs h-9">
                Download QR Code (PNG)
              </Button>
            </div>
          ) : (
            <div className="bg-muted w-[150px] h-[150px] flex items-center justify-center rounded-xl my-4 text-xs text-muted-foreground">
              Select a card
            </div>
          )}

          <p className="text-[11px] text-muted-foreground italic">
            Scanning this QR code with any phone camera opens your live digital business card with your photo, contact info, and socials.
          </p>
        </div>
      </div>
    </div>
  )
}
