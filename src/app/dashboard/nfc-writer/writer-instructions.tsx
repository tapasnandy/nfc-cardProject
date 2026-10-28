'use client'

import { useState, useSyncExternalStore } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { CopyIcon, SmartphoneIcon, InfoIcon, QrCodeIcon, ContactIcon, GlobeIcon } from 'lucide-react'
import { toast } from 'sonner'
import QRCode from 'react-qr-code'

const emptySubscribe = () => () => {}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function WriterInstructions({ cards }: { cards: any[] }) {
  const [selectedCard, setSelectedCard] = useState<string>(cards.length > 0 ? cards[0].short_code : '')
  const [qrType, setQrType] = useState<'url' | 'vcard'>('url')

  const appUrl = useSyncExternalStore(
    emptySubscribe,
    () => window.location.origin,
    () => ''
  )

  const currentCard = cards.find(c => c.short_code === selectedCard)
  const profile = currentCard?.profiles ? (Array.isArray(currentCard.profiles) ? currentCard.profiles[0] : currentCard.profiles) : null

  const writeUrl = selectedCard ? `${appUrl}/c/${selectedCard}` : ''

  // Generate direct camera vCard string if profile exists
  let directVCardString = ''
  if (profile) {
    const nameParts = (profile.name || 'Contact').trim().split(' ')
    const lastName = nameParts.length > 1 ? nameParts.pop() : ''
    const firstName = nameParts.join(' ')
    const cleanPhone = (profile.phone || '').replace(/[^0-9+]/g, '')

    directVCardString = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `N:${lastName};${firstName};;;`,
      `FN:${profile.name}`,
      profile.company ? `ORG:${profile.company}` : '',
      profile.job_title ? `TITLE:${profile.job_title}` : '',
      cleanPhone ? `TEL;TYPE=CELL:${cleanPhone}` : '',
      profile.email ? `EMAIL;TYPE=INTERNET:${profile.email}` : '',
      profile.website ? `URL:${profile.website}` : '',
      'END:VCARD',
    ].filter(Boolean).join('\n')
  }

  const activeQrValue = qrType === 'vcard' && directVCardString ? directVCardString : writeUrl

  const copyToClipboard = () => {
    if (writeUrl) {
      navigator.clipboard.writeText(writeUrl)
      toast.success('URL copied to clipboard!')
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
        downloadLink.download = `QR_${selectedCard}_${qrType}.png`
        downloadLink.href = `${pngFile}`
        downloadLink.click()
      }
    }
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
  }

  return (
    <div className="space-y-8">
      <div className="p-4 bg-blue-50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 rounded-lg flex gap-3">
        <InfoIcon className="h-5 w-5 mt-0.5 shrink-0" />
        <p className="text-sm">
          <strong>NTAG216 Compatible:</strong> Your NTAG216 cards have 888 bytes of memory, which is more than enough to store the URL (which takes less than 50 bytes).
        </p>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">1. Select the card to write</h3>
        <Select value={selectedCard} onValueChange={(val) => setSelectedCard(val || '')}>
          <SelectTrigger className="w-full md:w-[400px]">
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

        {writeUrl && (
          <div className="mt-4 p-4 border rounded-md flex flex-col sm:flex-row justify-between items-center gap-4 bg-muted/20">
            <code className="font-mono text-sm break-all">{writeUrl}</code>
            <Button onClick={copyToClipboard} variant="secondary" className="shrink-0">
              <CopyIcon className="h-4 w-4 mr-2" /> Copy URL
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">2. Choose Card Programming Method</h3>
        
        <div className="grid gap-6 md:grid-cols-2">
          {/* Method 1: NFC Tools */}
          <div className="border p-5 rounded-lg space-y-4 bg-card">
            <div className="flex items-center gap-2 font-semibold text-lg">
              <SmartphoneIcon className="h-5 w-5" /> Physical NFC Chip (NTAG216)
            </div>
            <p className="text-sm text-muted-foreground">To write your profile URL to your physical card using an NFC phone:</p>
            <ol className="list-decimal pl-5 space-y-2 text-sm text-muted-foreground">
              <li>Open <strong>NFC Tools</strong> app on your iPhone or Android phone.</li>
              <li>Tap <strong>Write</strong> &gt; <strong>Add a record</strong> &gt; <strong>URL / URI</strong>.</li>
              <li>Paste the URL: <code>{writeUrl || '...'}</code></li>
              <li>Tap OK, then tap <strong>Write</strong> and touch your physical card to the phone!</li>
            </ol>
          </div>

          {/* Method 2: Dual QR Code Generation */}
          <div className="border p-5 rounded-lg space-y-4 bg-card flex flex-col items-center text-center">
            <div className="flex items-center gap-2 font-semibold text-lg justify-center w-full">
              <QrCodeIcon className="h-5 w-5" /> QR Code for Card Back
            </div>
            <p className="text-xs text-muted-foreground">
              Choose the QR behavior you want when printed on the card:
            </p>

            {/* QR Mode Selector */}
            <div className="grid grid-cols-2 gap-2 w-full max-w-[320px] bg-muted/50 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setQrType('url')}
                className={`py-2 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  qrType === 'url' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <GlobeIcon className="h-3.5 w-3.5" /> Web Profile
              </button>
              <button
                type="button"
                onClick={() => setQrType('vcard')}
                disabled={!profile}
                className={`py-2 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  qrType === 'vcard' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                } ${!profile ? 'opacity-40 cursor-not-allowed' : ''}`}
                title={!profile ? 'Assign a profile first to enable direct contact QR' : ''}
              >
                <ContactIcon className="h-3.5 w-3.5" /> Camera Direct Save
              </button>
            </div>

            <p className="text-[11px] text-muted-foreground italic px-2">
              {qrType === 'url' 
                ? 'Opens the mobile digital card webpage with links & photos.' 
                : 'Scanning with ANY phone camera directly pops up "Add to Contacts" (0 downloads!).'}
            </p>

            {activeQrValue ? (
              <div className="flex flex-col items-center gap-4 mt-2 w-full">
                <div className="bg-white p-4 rounded-xl shadow-sm border">
                  <QRCode id="qr-code-svg" value={activeQrValue} size={150} />
                </div>
                <Button onClick={downloadQRCode} variant="outline" className="w-full max-w-[200px]">
                  Download QR Code
                </Button>
              </div>
            ) : (
              <div className="bg-muted w-[150px] h-[150px] flex items-center justify-center rounded-xl mt-4">
                Select a card
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
