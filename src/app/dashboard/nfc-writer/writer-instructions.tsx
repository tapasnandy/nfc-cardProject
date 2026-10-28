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
  CheckCircle2Icon,
  UserIcon,
  BriefcaseIcon,
  BuildingIcon,
  PhoneIcon,
  MailIcon,
  ExternalLinkIcon
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
    if (typeof window === 'undefined' || !('NDEFReader' in window)) {
      toast.info(
        '1-Tap NFC writing requires Chrome on an Android phone with NFC enabled. To write directly, open this dashboard on your Android phone, or copy the details below into the NFC Tools app.',
        { duration: 7000 }
      )
      return
    }

    try {
      setWritingNfc(true)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ndef = new (window as any).NDEFReader()
      toast.info('Hold your physical NFC card against the back of your phone now...', { duration: 8000 })

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
    <div className="space-y-8 max-w-5xl">
      {/* Overview Notice */}
      <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-300 rounded-xl flex gap-3 border border-emerald-200 dark:border-emerald-800">
        <ZapIcon className="h-5 w-5 mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
        <div className="text-sm space-y-1">
          <p className="font-semibold">NFC Card Programming Center</p>
          <p className="text-xs text-emerald-800 dark:text-emerald-300/90 leading-relaxed">
            Choose how your card behaves when tapped. Use <strong>Mode A</strong> to trigger an instant contact popup directly on mobile phones (0 downloads, 0 websites), or <strong>Mode B</strong> to open your full digital profile webpage with photo and social links.
          </p>
        </div>
      </div>

      {/* Step 1: Card Selector */}
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
            <div className="text-xs text-muted-foreground flex items-center gap-1.5 bg-muted/60 px-3 py-2 rounded-lg">
              <UserIcon className="h-3.5 w-3.5 text-primary" />
              <span>Assigned to: <strong>{profile.name}</strong></span>
            </div>
          )}
        </div>
      </div>

      {/* Step 2: Modes Grid */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold">2. Choose Programming Mode</h3>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Mode A: Direct Contact (0 Downloads, Just Tap & Save) */}
          <div className="border-2 border-emerald-500/40 p-5 rounded-xl space-y-4 bg-card shadow-sm flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-base text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2Icon className="h-5 w-5" /> Mode A: Direct Contact (No Downloads)
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded-full uppercase">
                  Recommended
                </span>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                When anyone taps your card, their phone screen <strong>immediately pops up the Add to Contacts screen</strong> with all fields pre-filled. No browser opens, zero files downloaded.
              </p>

              {/* Data Preview */}
              {profile ? (
                <div className="p-3 bg-muted/40 rounded-lg text-xs space-y-1.5 border">
                  <p className="font-semibold text-foreground text-[11px] uppercase tracking-wider text-muted-foreground mb-1">
                    Details to be written onto card:
                  </p>
                  <div className="flex items-center gap-2 text-foreground">
                    <UserIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span><strong>Name:</strong> {profile.name || 'Not set'}</span>
                  </div>
                  {profile.job_title && (
                    <div className="flex items-center gap-2 text-foreground">
                      <BriefcaseIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span><strong>Title:</strong> {profile.job_title}</span>
                    </div>
                  )}
                  {profile.company && (
                    <div className="flex items-center gap-2 text-foreground">
                      <BuildingIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span><strong>Company:</strong> {profile.company}</span>
                    </div>
                  )}
                  {profile.phone && (
                    <div className="flex items-center gap-2 text-foreground">
                      <PhoneIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span><strong>Phone:</strong> {profile.phone}</span>
                    </div>
                  )}
                  {profile.email && (
                    <div className="flex items-center gap-2 text-foreground">
                      <MailIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span><strong>Email:</strong> {profile.email}</span>
                    </div>
                  )}
                  {profile.website && (
                    <div className="flex items-center gap-2 text-foreground">
                      <GlobeIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span><strong>Website:</strong> {profile.website}</span>
                    </div>
                  )}
                  <p className="text-[10px] text-muted-foreground italic pt-1">
                    * Text fields only. Photos cannot physically fit inside NFC chip memory (max 888 bytes).
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-muted/40 rounded-lg text-xs text-muted-foreground">
                  Assign a profile to this card first.
                </div>
              )}
            </div>

            <div className="space-y-3 pt-3 border-t">
              {/* Prominent Green Button */}
              <Button 
                onClick={() => writeDirectNfc('vcard')} 
                disabled={writingNfc || !profile}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-5 text-sm shadow-sm transition-all"
              >
                <RadioIcon className="h-4 w-4 mr-2" />
                {writingNfc ? 'Touch card to back of phone now...' : 'Write Direct Contact to Card'}
              </Button>

              <div className="flex flex-col sm:flex-row gap-2">
                {directVCardString && (
                  <Button 
                    onClick={() => copyToClipboard(directVCardString, 'vCard Data')} 
                    variant="outline" 
                    size="sm" 
                    className="w-full text-xs h-9"
                  >
                    <CopyIcon className="h-3.5 w-3.5 mr-1.5" /> Copy Contact Data
                  </Button>
                )}
                {selectedCard && (
                  <a
                    href={`/c/${selectedCard}/contact.vcf`}
                    download={`${(profile?.name || 'contact').replace(/[^a-zA-Z0-9]/g, '_')}.vcf`}
                    className="w-full"
                  >
                    <Button variant="outline" size="sm" className="w-full text-xs h-9">
                      Download .vcf
                    </Button>
                  </a>
                )}
              </div>

              <div className="text-[11px] text-muted-foreground bg-muted/30 p-2.5 rounded-lg space-y-1">
                <p className="font-semibold text-foreground">Or write using free NFC Tools app:</p>
                <p>1. Open NFC Tools &gt; <strong>Write</strong> &gt; <strong>Add a record</strong> &gt; <strong>Contact</strong>.</p>
                <p>2. Fill in your details &gt; Tap <strong>Write</strong> and touch your physical card!</p>
              </div>
            </div>
          </div>

          {/* Mode B: Web Profile Page */}
          <div className="border p-5 rounded-xl space-y-4 bg-card shadow-sm flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-base text-blue-700 dark:text-blue-400">
                  <GlobeIcon className="h-5 w-5" /> Mode B: Web Landing Page
                </div>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                When anyone taps your card, their phone opens your online digital card webpage with your <strong>Profile Photo, Bio, Social links, and Save Contact button</strong>.
              </p>

              <div className="p-3 bg-muted/40 rounded-lg text-xs space-y-2 border">
                <p className="font-semibold text-foreground text-[11px] uppercase tracking-wider text-muted-foreground">
                  Your Card Profile Webpage:
                </p>
                <div className="flex items-center justify-between gap-2 bg-background p-2 rounded border break-all">
                  <span className="font-mono text-xs">{writeUrl || 'Select a card above'}</span>
                  {writeUrl && (
                    <a href={writeUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline shrink-0">
                      <ExternalLinkIcon className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground">
                  * Supports full high-resolution profile photo, WhatsApp direct chat, LinkedIn, and social links.
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-3 border-t">
              <Button 
                onClick={() => writeDirectNfc('url')} 
                disabled={writingNfc || !writeUrl}
                variant="secondary"
                className="w-full font-semibold py-5 text-sm"
              >
                <RadioIcon className="h-4 w-4 mr-2" />
                {writingNfc ? 'Touch card to back of phone now...' : 'Write Webpage Link to Card'}
              </Button>

              {writeUrl && (
                <Button 
                  onClick={() => copyToClipboard(writeUrl, 'Profile URL')} 
                  variant="outline" 
                  size="sm" 
                  className="w-full text-xs"
                >
                  <CopyIcon className="h-3.5 w-3.5 mr-1.5" /> Copy Profile URL
                </Button>
              )}

              <div className="text-[11px] text-muted-foreground bg-muted/30 p-2.5 rounded-lg space-y-1">
                <p className="font-semibold text-foreground">Or write using free NFC Tools app:</p>
                <p>1. Open NFC Tools &gt; <strong>Write</strong> &gt; <strong>Add a record</strong> &gt; <strong>URL / URI</strong>.</p>
                <p>2. Paste your copied Profile URL &gt; Tap <strong>Write</strong> and touch your card!</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* QR Code Section (Optional Backup) */}
      <div className="border p-6 rounded-xl space-y-4 bg-card flex flex-col items-center text-center max-w-lg mx-auto">
        <div className="flex items-center gap-2 font-semibold text-base justify-center w-full">
          <QrCodeIcon className="h-5 w-5 text-primary" /> Optional QR Code (Card Back)
        </div>
        <p className="text-xs text-muted-foreground">
          You can print this QR code on the back of your card for phones without NFC.
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

        {activeQrValue ? (
          <div className="flex flex-col items-center gap-4 mt-2 w-full">
            <div className="bg-white p-4 rounded-xl shadow-sm border">
              <QRCode id="qr-code-svg" value={activeQrValue} size={150} />
            </div>
            <Button onClick={downloadQRCode} variant="outline" size="sm" className="w-full max-w-[200px] text-xs">
              Download QR Code
            </Button>
          </div>
        ) : (
          <div className="bg-muted w-[150px] h-[150px] flex items-center justify-center rounded-xl mt-4 text-xs text-muted-foreground">
            Select a card
          </div>
        )}
      </div>
    </div>
  )
}
