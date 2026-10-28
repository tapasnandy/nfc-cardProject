'use client'

import { useState, useSyncExternalStore } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { 
  CopyIcon, 
  QrCodeIcon, 
  ContactIcon, 
  GlobeIcon, 
  ZapIcon, 
  RadioIcon,
  CheckCircle2Icon 
} from 'lucide-react'
import { toast } from 'sonner'
import QRCode from 'react-qr-code'
import { generateVCard } from '@/lib/contact-actions'

const emptySubscribe = () => () => {}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function WriterInstructions({ cards }: { cards: any[] }) {
  const [selectedCard, setSelectedCard] = useState<string>(cards.length > 0 ? cards[0].short_code : '')
  const [qrType, setQrType] = useState<'url' | 'vcard'>('vcard')
  const [writingNfc, setWritingNfc] = useState(false)

  const appUrl = useSyncExternalStore(
    emptySubscribe,
    () => (typeof window !== 'undefined' ? window.location.origin : ''),
    () => ''
  )

  const hasWebNfc = typeof window !== 'undefined' && 'NDEFReader' in window

  const currentCard = cards.find(c => c.short_code === selectedCard)
  const profile = currentCard?.profiles ? (Array.isArray(currentCard.profiles) ? currentCard.profiles[0] : currentCard.profiles) : null

  const writeUrl = selectedCard ? `${appUrl}/c/${selectedCard}` : ''

  const directVCardString = profile ? generateVCard(profile) : ''
  const activeQrValue = qrType === 'vcard' && directVCardString ? directVCardString : writeUrl

  const copyToClipboard = (text: string, label: string) => {
    if (text) {
      navigator.clipboard.writeText(text)
      toast.success(`${label} copied to clipboard!`)
    }
  }

  // Write directly to physical card using Web NFC in Chrome on Android
  const writeDirectNfc = async (type: 'vcard' | 'url') => {
    if (!hasWebNfc) {
      toast.error('Web NFC is not supported on this browser. Please use Chrome on Android or the NFC Tools app.')
      return
    }

    try {
      setWritingNfc(true)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ndef = new (window as any).NDEFReader()
      toast.info('Ready! Hold your NFC card against the back of your phone now...', { duration: 8000 })

      if (type === 'vcard') {
        if (!directVCardString) {
          toast.error('Please assign a profile to this card first.')
          setWritingNfc(false)
          return
        }
        await ndef.write({
          records: [
            {
              recordType: 'mime',
              mediaType: 'text/vcard',
              data: new TextEncoder().encode(directVCardString),
            },
          ],
        })
      } else {
        await ndef.write({
          records: [
            {
              recordType: 'url',
              data: writeUrl,
            },
          ],
        })
      }

      toast.success('Card successfully programmed! Tap any phone to test.', { duration: 5000 })
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
        downloadLink.download = `QR_${selectedCard}_${qrType}.png`
        downloadLink.href = `${pngFile}`
        downloadLink.click()
      }
    }
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
  }

  return (
    <div className="space-y-8">
      {/* Informational banner highlighting Direct Tap */}
      <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-300 rounded-xl flex gap-3 border border-emerald-200 dark:border-emerald-800">
        <ZapIcon className="h-5 w-5 mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
        <div className="text-sm space-y-1">
          <p className="font-semibold">Direct Contact Popup (Just Tap & Save, 0 Downloads!):</p>
          <p className="text-xs text-emerald-800 dark:text-emerald-300/90 leading-relaxed">
            To make an NFC card <strong>instantly pop up the phone&apos;s native &quot;Add to Contacts&quot; screen</strong> with no web browser and no file download, write the <strong>Contact / vCard Record</strong> to your card instead of a URL.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">1. Select the Card</h3>
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
      </div>

      <div className="space-y-6">
        <h3 className="text-lg font-medium">2. Choose Card Programming Mode</h3>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Method A: Instant Direct Contact (Tap -> Popup -> Save) */}
          <div className="border-2 border-emerald-500/30 p-5 rounded-xl space-y-4 bg-card shadow-sm relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-lg text-emerald-700 dark:text-emerald-400">
                <CheckCircle2Icon className="h-5 w-5" /> Mode A: Direct Contact Popup
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded-full uppercase">
                Recommended
              </span>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              When anyone taps your card, their phone <strong>directly pops up the Add to Contacts screen</strong>. Zero browser redirection, zero file downloads.
            </p>

            {hasWebNfc && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg space-y-2 border border-emerald-200 dark:border-emerald-900">
                <p className="text-xs font-semibold text-emerald-900 dark:text-emerald-200">
                  ⚡ 1-Tap Browser Write (Supported on this device)
                </p>
                <Button 
                  onClick={() => writeDirectNfc('vcard')} 
                  disabled={writingNfc || !profile}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs"
                >
                  <RadioIcon className="h-4 w-4 mr-2" />
                  {writingNfc ? 'Touch card to phone now...' : 'Write Direct Contact to Card'}
                </Button>
              </div>
            )}

            <div className="space-y-2 pt-2 border-t text-xs text-muted-foreground">
              <p className="font-semibold text-foreground">Or write with free NFC Tools app:</p>
              <ol className="list-decimal pl-4 space-y-1.5">
                <li>Open <strong>NFC Tools</strong> app on your smartphone.</li>
                <li>Tap <strong>Write</strong> &gt; <strong>Add a record</strong> &gt; <strong>Contact</strong>.</li>
                <li>Enter the contact info: <strong>{profile?.name || 'Name'}</strong> ({profile?.phone || 'Phone'}).</li>
                <li>Tap <strong>Write</strong> and touch your physical card to the phone!</li>
              </ol>
            </div>

            {directVCardString && (
              <div className="pt-2">
                <Button 
                  onClick={() => copyToClipboard(directVCardString, 'vCard Data')} 
                  variant="outline" 
                  size="sm" 
                  className="w-full text-xs"
                >
                  <CopyIcon className="h-3.5 w-3.5 mr-2" /> Copy Full vCard Data
                </Button>
              </div>
            )}
          </div>

          {/* Method B: Web Profile Page */}
          <div className="border p-5 rounded-xl space-y-4 bg-card shadow-sm">
            <div className="flex items-center gap-2 font-semibold text-lg">
              <GlobeIcon className="h-5 w-5 text-blue-600" /> Mode B: Web Landing Page
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              When tapped, the phone opens your hosted digital business card in their web browser with photo, social links, and bio.
            </p>

            {hasWebNfc && (
              <div className="p-3 bg-muted/40 rounded-lg space-y-2 border">
                <Button 
                  onClick={() => writeDirectNfc('url')} 
                  disabled={writingNfc || !writeUrl}
                  variant="secondary"
                  className="w-full font-semibold text-xs"
                >
                  <RadioIcon className="h-4 w-4 mr-2" />
                  {writingNfc ? 'Touch card to phone now...' : 'Write Profile URL to Card'}
                </Button>
              </div>
            )}

            <div className="space-y-2 pt-2 border-t text-xs text-muted-foreground">
              <p className="font-semibold text-foreground">Or write with NFC Tools app:</p>
              <ol className="list-decimal pl-4 space-y-1.5">
                <li>Open <strong>NFC Tools</strong> app.</li>
                <li>Tap <strong>Write</strong> &gt; <strong>Add a record</strong> &gt; <strong>URL / URI</strong>.</li>
                <li>Paste URL: <code>{writeUrl || '...'}</code></li>
                <li>Tap <strong>Write</strong> and touch your card!</li>
              </ol>
            </div>

            {writeUrl && (
              <div className="pt-2">
                <Button 
                  onClick={() => copyToClipboard(writeUrl, 'URL')} 
                  variant="outline" 
                  size="sm" 
                  className="w-full text-xs"
                >
                  <CopyIcon className="h-3.5 w-3.5 mr-2" /> Copy URL
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* QR Code Section */}
        <div className="border p-6 rounded-xl space-y-4 bg-card flex flex-col items-center text-center max-w-xl mx-auto mt-6">
          <div className="flex items-center gap-2 font-semibold text-lg justify-center w-full">
            <QrCodeIcon className="h-5 w-5 text-primary" /> QR Code Backup (Card Back)
          </div>
          <p className="text-xs text-muted-foreground">
            Print this QR code on the back of your card. Scanning with a camera directly prompts &quot;Add Contact&quot;!
          </p>

          <div className="grid grid-cols-2 gap-2 w-full max-w-[320px] bg-muted/50 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setQrType('vcard')}
              disabled={!profile}
              className={`py-2 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                qrType === 'vcard' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
              } ${!profile ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              <ContactIcon className="h-3.5 w-3.5" /> Direct Contact QR
            </button>
            <button
              type="button"
              onClick={() => setQrType('url')}
              className={`py-2 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                qrType === 'url' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <GlobeIcon className="h-3.5 w-3.5" /> Web Profile QR
            </button>
          </div>

          <p className="text-[11px] text-muted-foreground italic px-2">
            {qrType === 'vcard'
              ? '⚡ Scanning with ANY phone camera (iPhone or Redmi/Android) instantly triggers "Add to Contacts" (0 downloads!).'
              : 'Opens your online digital card webpage with all social links & bio.'}
          </p>

          {activeQrValue ? (
            <div className="flex flex-col items-center gap-4 mt-2 w-full">
              <div className="bg-white p-4 rounded-xl shadow-sm border">
                <QRCode id="qr-code-svg" value={activeQrValue} size={160} />
              </div>
              <Button onClick={downloadQRCode} variant="outline" className="w-full max-w-[200px]">
                Download QR Code
              </Button>
            </div>
          ) : (
            <div className="bg-muted w-[160px] h-[160px] flex items-center justify-center rounded-xl mt-4 text-xs">
              Select a card
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
