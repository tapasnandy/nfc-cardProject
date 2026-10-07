'use client'

import { useState, useEffect } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { CopyIcon, SmartphoneIcon, InfoIcon, QrCodeIcon } from 'lucide-react'
import { toast } from 'sonner'
import QRCode from 'react-qr-code'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function WriterInstructions({ cards }: { cards: any[] }) {
  const [selectedCard, setSelectedCard] = useState<string>('')
  const [appUrl, setAppUrl] = useState('')

  useEffect(() => {
    setAppUrl(window.location.origin)
    if (cards.length > 0 && !selectedCard) {
      setSelectedCard(cards[0].short_code)
    }
  }, [cards, selectedCard])

  const writeUrl = selectedCard ? `${appUrl}/c/${selectedCard}` : ''

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
        downloadLink.download = `QR_${selectedCard}.png`
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
            {cards.map(c => (
              <SelectItem key={c.id} value={c.short_code}>
                Card: {c.short_code} ({c.status})
              </SelectItem>
            ))}
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
        <h3 className="text-lg font-medium">2. Write to physical card</h3>
        
        <div className="grid gap-6 md:grid-cols-2">
          <div className="border p-5 rounded-lg space-y-4 bg-card">
            <div className="flex items-center gap-2 font-semibold text-lg">
              <SmartphoneIcon className="h-5 w-5" /> Write with Smartphone
            </div>
            <p className="text-sm text-muted-foreground">Almost all modern smartphones have built-in NFC.</p>
            <ol className="list-decimal pl-5 space-y-2 text-sm text-muted-foreground">
              <li>Borrow a smartphone or download <strong>NFC Tools</strong> on yours.</li>
              <li>Open the app and select <strong>Write</strong>.</li>
              <li>Tap <strong>Add a record</strong> &gt; <strong>URL / URI</strong>.</li>
              <li>Paste the URL: <code>{writeUrl || '...'}</code></li>
              <li>Tap OK, then select <strong>Write</strong> and tap the card!</li>
            </ol>
          </div>

          <div className="border p-5 rounded-lg space-y-4 bg-card flex flex-col items-center text-center">
            <div className="flex items-center gap-2 font-semibold text-lg justify-center w-full">
              <QrCodeIcon className="h-5 w-5" /> No NFC? Use QR Code!
            </div>
            <p className="text-sm text-muted-foreground">
              You can print this QR code on a sticker and place it on your card, or let people scan it directly from your screen.
            </p>
            {writeUrl ? (
              <div className="flex flex-col items-center gap-4 mt-4 w-full">
                <div className="bg-white p-4 rounded-xl shadow-sm border">
                  <QRCode id="qr-code-svg" value={writeUrl} size={150} />
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
