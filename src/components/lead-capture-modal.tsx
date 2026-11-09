'use client'

import React, { useState, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  MessageSquarePlusIcon,
  CheckCircle2Icon,
  Loader2Icon,
  CameraIcon,
  SparklesIcon,
  RefreshCwIcon,
  SaveIcon,
  ScanTextIcon,
} from 'lucide-react'
import { submitLead } from '@/app/actions/lead'
import { parseBusinessCardText, preprocessCardImage } from '@/lib/business-card-parser'
import { toast } from 'sonner'
import Image from 'next/image'

interface LeadCaptureModalProps {
  cardId?: string | null
  profileId?: string | null
  organizationId?: string | null
  personName?: string | null
  companyName?: string | null
}

export function LeadCaptureModal({
  cardId,
  profileId,
  organizationId,
  personName,
  companyName,
}: LeadCaptureModalProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  // OCR state
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [cardPhotoPreview, setCardPhotoPreview] = useState<string | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [scanComplete, setScanComplete] = useState(false)

  const handleScanCard = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsScanning(true)
    setScanProgress(5)
    setScanComplete(false)

    try {
      // 1. Generate preview & optimize image for OCR
      const preprocessedUrl = await preprocessCardImage(file)
      setCardPhotoPreview(preprocessedUrl)
      setScanProgress(20)

      // 2. Dynamically load Tesseract.js (keeps initial bundle small)
      const Tesseract = (await import('tesseract.js')).default

      const result = await Tesseract.recognize(preprocessedUrl, 'eng', {
        logger: (m) => {
          if (m.status === 'recognizing text' && typeof m.progress === 'number') {
            setScanProgress(20 + Math.round(m.progress * 75))
          }
        },
      })

      const rawText = result.data.text || ''
      setScanProgress(100)

      // 3. Parse extracted card text
      const parsed = parseBusinessCardText(rawText)

      if (parsed.name && !name) setName(parsed.name)
      else if (parsed.name) setName(parsed.name)

      if (parsed.phone) setPhone(parsed.phone)
      if (parsed.email) setEmail(parsed.email)
      if (parsed.company) setCompany(parsed.company)

      // Include job title or unparsed card text in notes
      let extraNotes = ''
      if (parsed.jobTitle) {
        extraNotes += `Title: ${parsed.jobTitle}`
      }
      if (parsed.website) {
        extraNotes += extraNotes ? ` • Website: ${parsed.website}` : `Website: ${parsed.website}`
      }
      if (extraNotes) {
        setNotes((prev) => (prev ? `${extraNotes}\n${prev}` : extraNotes))
      }

      setScanComplete(true)
      toast.success('Card text extracted! Please verify the details below.')
    } catch (err: unknown) {
      console.error('OCR Card Scan error:', err)
      const msg = err instanceof Error ? err.message : 'Could not scan card photo'
      toast.error(`OCR scan error: ${msg}. You can still fill details manually.`)
    } finally {
      setIsScanning(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error('Please enter the client / visitor name.')
      return
    }

    if (!phone.trim() && !email.trim()) {
      toast.error('Please enter at least a phone number or email address.')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await submitLead({
        cardId,
        profileId,
        organizationId,
        name: name.trim(),
        phone: phone.trim() || null,
        email: email.trim() || null,
        company: company.trim() || null,
        notes: notes.trim() || null,
        source: 'visitor',
      })

      if (!res.success) {
        toast.error(res.error || 'Failed to save information')
        return
      }

      setIsSuccess(true)
      toast.success('Information saved successfully!')
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to save information'
      toast.error(errorMsg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setName('')
    setPhone('')
    setEmail('')
    setCompany('')
    setNotes('')
    setCardPhotoPreview(null)
    setScanComplete(false)
    setIsSuccess(false)
  }

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (!nextOpen) {
      setTimeout(() => {
        resetForm()
      }, 200)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-2xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 font-semibold text-sm shadow-md transition-all active:scale-[0.98] touch-manipulation cursor-pointer border border-zinc-700/30 dark:border-zinc-300/30">
        <MessageSquarePlusIcon className="w-4 h-4 text-blue-400 dark:text-blue-600" />
        <span>Connect &amp; Send Enquiry</span>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md p-6 max-h-[92vh] overflow-y-auto">
        <DialogHeader className="text-left">
          <DialogTitle className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            {isSuccess
              ? 'Information Saved'
              : `Connect with ${personName || companyName || 'Us'}`}
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400">
            {isSuccess
              ? 'The details have been saved and logged to the dashboard.'
              : 'Scan a physical business card or enter the visitor details below.'}
          </DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          <div className="py-6 flex flex-col items-center text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2Icon className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                Information Saved Successfully!
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs">
                The lead details have been recorded and are now visible on the dashboard.
              </p>
            </div>
            <div className="flex gap-2 w-full pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => resetForm()}
              >
                Add Another
              </Button>
              <Button
                type="button"
                className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900"
                onClick={() => setOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 pt-1">
            {/* Hidden Camera / File Input for Card Scanning */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              capture="environment"
              onChange={handleScanCard}
              className="hidden"
            />

            {/* SCAN BUSINESS CARD ACTION CARD */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200/60 dark:border-blue-900/60 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                    <ScanTextIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      Scan Business Card
                    </h4>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Take a photo or upload a card to extract details automatically
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  size="sm"
                  disabled={isScanning}
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8 px-3 rounded-xl shadow-xs shrink-0 cursor-pointer"
                >
                  {isScanning ? (
                    <>
                      <Loader2Icon className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      Scanning...
                    </>
                  ) : (
                    <>
                      <CameraIcon className="w-3.5 h-3.5 mr-1.5" />
                      Take Photo
                    </>
                  )}
                </Button>
              </div>

              {/* Live Scanning Progress or Scanned Card Preview */}
              {isScanning && (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-[11px] font-medium text-blue-700 dark:text-blue-300">
                    <span className="flex items-center gap-1.5">
                      <SparklesIcon className="w-3 h-3 animate-spin" />
                      Analyzing card with OCR...
                    </span>
                    <span>{scanProgress}%</span>
                  </div>
                  <div className="w-full bg-blue-200 dark:bg-blue-900/60 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-blue-600 h-1.5 transition-all duration-200 rounded-full"
                      style={{ width: `${scanProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {cardPhotoPreview && !isScanning && (
                <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-zinc-900 border border-blue-200/50 dark:border-blue-900/40 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="relative w-12 h-8 rounded-lg overflow-hidden border">
                      <Image
                        src={cardPhotoPreview}
                        alt="Scanned card preview"
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    </div>
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2Icon className="w-3.5 h-3.5" />
                      {scanComplete ? 'Card OCR Extracted' : 'Card Loaded'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer font-medium"
                  >
                    <RefreshCwIcon className="w-3 h-3" />
                    <span>Retake</span>
                  </button>
                </div>
              )}
            </div>

            {/* SINGLE CLIENT / VISITOR INFORMATION SECTION */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="border-b pb-2 pt-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Client / Visitor Information
                </h3>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="lead-name" className="text-xs font-medium">
                    Full Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="lead-name"
                    required
                    placeholder="e.g. Alex Morgan"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="lead-phone" className="text-xs font-medium">
                      Phone / WhatsApp
                    </Label>
                    <Input
                      id="lead-phone"
                      type="tel"
                      placeholder="+1 234 567 890"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="h-9 text-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="lead-email" className="text-xs font-medium">
                      Email Address
                    </Label>
                    <Input
                      id="lead-email"
                      type="email"
                      placeholder="alex@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-9 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="lead-company" className="text-xs font-medium">
                    Company / Organization
                  </Label>
                  <Input
                    id="lead-company"
                    placeholder="e.g. Prime Realty Ltd"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="lead-notes" className="text-xs font-medium">
                    Meeting Notes / Requirements
                  </Label>
                  <Textarea
                    id="lead-notes"
                    rows={3}
                    placeholder="Discussion points, project requirements, follow-up timeline..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="text-sm resize-none"
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={isSubmitting || isScanning}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl shadow-md cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <SaveIcon className="w-4 h-4 mr-2" />
                      Save Information
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
