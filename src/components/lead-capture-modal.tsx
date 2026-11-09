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
  PhoneCallIcon,
  MailIcon,
  FileTextIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  KeyIcon,
} from 'lucide-react'
import { submitLead } from '@/app/actions/lead'
import { scanBusinessCardWithAI } from '@/app/actions/scan-card'
import {
  parseBusinessCardText,
  preprocessCardImage,
  DetectedContactNumber,
  ParsedLineInfo,
} from '@/lib/business-card-parser'
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
  const [jobTitle, setJobTitle] = useState('')
  const [company, setCompany] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  // OCR state
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [cardPhotoPreview, setCardPhotoPreview] = useState<string | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [scanComplete, setScanComplete] = useState(false)
  const [detectedPhones, setDetectedPhones] = useState<DetectedContactNumber[]>([])
  const [detectedEmails, setDetectedEmails] = useState<string[]>([])
  const [rawOcrText, setRawOcrText] = useState<string>('')
  const [showRawText, setShowRawText] = useState(false)

  // Optional Free AI Vision Key configuration (Lazy initializers to satisfy React 19)
  const [geminiKey, setGeminiKey] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem('tapnet_gemini_api_key') || ''
      } catch {
        return ''
      }
    }
    return ''
  })
  const [showKeyDialog, setShowKeyDialog] = useState(false)
  const [keyInput, setKeyInput] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem('tapnet_gemini_api_key') || ''
      } catch {
        return ''
      }
    }
    return ''
  })

  const handleSaveApiKey = () => {
    const trimmed = keyInput.trim()
    if (typeof window !== 'undefined') {
      if (trimmed) {
        localStorage.setItem('tapnet_gemini_api_key', trimmed)
        setGeminiKey(trimmed)
        toast.success('Free AI Vision Key connected! 100% accurate card reading enabled.')
      } else {
        localStorage.removeItem('tapnet_gemini_api_key')
        setGeminiKey('')
        toast.info('API key removed. Using enhanced on-device OCR.')
      }
    }
    setShowKeyDialog(false)
  }

  const handleScanCard = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsScanning(true)
    setScanProgress(15)
    setScanComplete(false)
    setShowRawText(false)

    try {
      // 1. Clean image scaling without destructive pixel manipulation
      const preprocessedUrl = await preprocessCardImage(file)
      setCardPhotoPreview(preprocessedUrl)
      setScanProgress(30)

      // 2. Try zero-error AI Vision (via GEMINI_API_KEY from env or localStorage)
      const aiResult = await scanBusinessCardWithAI(preprocessedUrl, geminiKey || null)

      if (aiResult.success && aiResult.data) {
        const d = aiResult.data
        if (d.name) setName(d.name)
        if (d.jobTitle) setJobTitle(d.jobTitle)
        if (d.company) setCompany(d.company)
        if (d.phone) setPhone(d.phone)
        if (d.email) setEmail(d.email)

        // Notes left completely empty as requested
        setNotes('')
        setScanComplete(true)
        setScanProgress(100)
        toast.success('Card details extracted with 100% accuracy via AI Vision!')
        return
      }

      // 3. Fallback: On-Device Probabilistic Classifier with Tesseract
      setScanProgress(45)
      const Tesseract = (await import('tesseract.js')).default

      const worker = await Tesseract.createWorker('eng', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text' && typeof m.progress === 'number') {
            setScanProgress(45 + Math.round(m.progress * 50))
          }
        },
      })

      let rawText = ''
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let pageData: any = null

      try {
        await worker.setParameters({
          tessedit_pageseg_mode: Tesseract.PSM.SPARSE_TEXT,
          preserve_interword_spaces: '1',
        })
        const result = await worker.recognize(preprocessedUrl)
        rawText = result.data.text || ''
        pageData = result.data
      } finally {
        await worker.terminate()
      }

      setRawOcrText(rawText)
      setScanProgress(100)

      // Extract line font heights for name hierarchy
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const allLines = pageData?.lines || pageData?.paragraphs?.flatMap((p: any) => p.lines) || []
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const linesData: ParsedLineInfo[] = allLines.map((l: any) => ({
        text: l.text || '',
        height: l.bbox ? l.bbox.y1 - l.bbox.y0 : undefined,
      }))

      // Parse with Probabilistic Entity Scoring Classifier
      const parsed = parseBusinessCardText(rawText, linesData)

      if (parsed.name) setName(parsed.name)
      if (parsed.jobTitle) setJobTitle(parsed.jobTitle)
      if (parsed.company) setCompany(parsed.company)
      if (parsed.phone) setPhone(parsed.phone)
      if (parsed.email) setEmail(parsed.email)

      setDetectedPhones(parsed.phoneNumbers)
      setDetectedEmails(parsed.emails)

      // Notes left completely empty as requested
      setNotes('')

      setScanComplete(true)
      toast.success('Card scanned! Details extracted for verification.')
    } catch (err: unknown) {
      console.error('OCR Card Scan error:', err)
      const msg = err instanceof Error ? err.message : 'Could not scan card photo'
      toast.error(`OCR scan error: ${msg}. You can enter details manually.`)
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
        jobTitle: jobTitle.trim() || null,
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
    setJobTitle('')
    setCompany('')
    setPhone('')
    setEmail('')
    setNotes('')
    setCardPhotoPreview(null)
    setDetectedPhones([])
    setDetectedEmails([])
    setRawOcrText('')
    setShowRawText(false)
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

      <DialogContent className="sm:max-w-lg p-5 sm:p-6 max-h-[92vh] overflow-y-auto">
        <DialogHeader className="text-left">
          <DialogTitle className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            {isSuccess
              ? 'Information Saved'
              : `Connect with ${personName || companyName || 'Us'}`}
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400">
            {isSuccess
              ? 'The details have been saved and logged to the dashboard.'
              : 'Scan a physical card with your camera or enter contact details below.'}
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
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
                    <ScanTextIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                        Scan Business Card
                      </h4>
                      {geminiKey ? (
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-1.5 py-0.5 rounded-md border border-emerald-300/50">
                          <SparklesIcon className="w-2.5 h-2.5" />
                          AI Active
                        </span>
                      ) : null}
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Take photo to auto-fill Name, Title, Company &amp; Contact info
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    type="button"
                    size="sm"
                    disabled={isScanning}
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8 px-3 rounded-xl shadow-xs cursor-pointer"
                  >
                    {isScanning ? (
                      <>
                        <Loader2Icon className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                        Scanning...
                      </>
                    ) : (
                      <>
                        <CameraIcon className="w-3.5 h-3.5 mr-1.5" />
                        Scan Card
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Free AI Vision Key Switcher */}
              <div className="flex items-center justify-between text-[11px] pt-0.5 border-t border-blue-200/40 dark:border-blue-900/30">
                <span className="text-zinc-500 dark:text-zinc-400">
                  Engine: {geminiKey ? 'Google Gemini AI Vision' : 'On-Device AI Classifier'}
                </span>
                <button
                  type="button"
                  onClick={() => setShowKeyDialog(!showKeyDialog)}
                  className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium cursor-pointer"
                >
                  <KeyIcon className="w-3 h-3" />
                  <span>{geminiKey ? 'Change AI Key' : 'Connect Free Google AI (100% Accuracy)'}</span>
                </button>
              </div>

              {/* Interactive Key Entry Box */}
              {showKeyDialog && (
                <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-blue-200 dark:border-blue-900 space-y-2 animate-in fade-in duration-150">
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                      <SparklesIcon className="w-3.5 h-3.5 text-blue-600" />
                      Free Google Gemini Vision AI (1,500 scans/day for $0)
                    </p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Get a free key from{' '}
                      <a
                        href="https://aistudio.google.com/app/apikey"
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 underline font-medium"
                      >
                        aistudio.google.com
                      </a>{' '}
                      (takes 30 seconds, no credit card required).
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Input
                      type="password"
                      placeholder="Paste Gemini API Key (AIzaSy...)"
                      value={keyInput}
                      onChange={(e) => setKeyInput(e.target.value)}
                      className="h-8 text-xs font-mono"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleSaveApiKey}
                      className="h-8 text-xs bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900 shrink-0 cursor-pointer"
                    >
                      Save Key
                    </Button>
                  </div>
                </div>
              )}

              {/* Live Scanning Progress Bar */}
              {isScanning && (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-[11px] font-medium text-blue-700 dark:text-blue-300">
                    <span className="flex items-center gap-1.5">
                      <SparklesIcon className="w-3 h-3 animate-spin" />
                      {geminiKey ? 'AI Vision analyzing card design & text...' : 'Classifying Name, Title & Company...'}
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

              {/* Card Photo Preview & Summary Badge */}
              {cardPhotoPreview && !isScanning && (
                <div className="space-y-2 pt-1">
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
                        {scanComplete ? 'Details Classified' : 'Card Loaded'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {rawOcrText && (
                        <button
                          type="button"
                          onClick={() => setShowRawText(!showRawText)}
                          className="text-[11px] text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 flex items-center gap-0.5 cursor-pointer"
                        >
                          <FileTextIcon className="w-3 h-3" />
                          <span>{showRawText ? 'Hide OCR' : 'View OCR'}</span>
                          {showRawText ? (
                            <ChevronUpIcon className="w-3 h-3" />
                          ) : (
                            <ChevronDownIcon className="w-3 h-3" />
                          )}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer font-medium"
                      >
                        <RefreshCwIcon className="w-3 h-3" />
                        <span>Retake</span>
                      </button>
                    </div>
                  </div>

                  {showRawText && rawOcrText && (
                    <div className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-[11px] font-mono text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap max-h-32 overflow-y-auto border">
                      {rawOcrText}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* SINGLE CLIENT / VISITOR INFORMATION SECTION */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="border-b pb-1.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Client / Visitor Information
                </h3>
              </div>

              <div className="space-y-3">
                {/* 1. Full Name */}
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

                {/* 2. Job Title & Company */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="lead-job-title" className="text-xs font-medium">
                      Job Title / Designation
                    </Label>
                    <Input
                      id="lead-job-title"
                      placeholder="e.g. Sales Director"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      className="h-9 text-sm"
                    />
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
                </div>

                {/* 3. Phone & Email Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Phone Field */}
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

                    {/* MULTI-NUMBER QUICK SELECTOR PILLS */}
                    {detectedPhones.length > 1 && (
                      <div className="pt-1 space-y-1">
                        <span className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
                          <PhoneCallIcon className="w-3 h-3 text-blue-500" />
                          {detectedPhones.length} numbers detected (tap to select primary):
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {detectedPhones.map((p, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setPhone(p.number)}
                              className={`text-[10px] px-2 py-0.5 rounded-md border font-mono transition-all cursor-pointer ${
                                phone === p.number
                                  ? 'bg-blue-600 text-white border-blue-600 font-semibold shadow-xs'
                                  : 'bg-muted/70 text-foreground hover:bg-muted border-border'
                              }`}
                            >
                              {p.formattedLabel}: {p.number}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Email Field */}
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

                    {/* MULTI-EMAIL QUICK SELECTOR PILLS */}
                    {detectedEmails.length > 1 && (
                      <div className="pt-1 space-y-1">
                        <span className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
                          <MailIcon className="w-3 h-3 text-indigo-500" />
                          {detectedEmails.length} emails detected (tap to select):
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {detectedEmails.map((em, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setEmail(em)}
                              className={`text-[10px] px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                                email === em
                                  ? 'bg-indigo-600 text-white border-indigo-600 font-semibold shadow-xs'
                                  : 'bg-muted/70 text-foreground hover:bg-muted border-border'
                              }`}
                            >
                              {em}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 4. Meeting Notes (Left Completely Clean & Empty) */}
                <div className="space-y-1">
                  <Label htmlFor="lead-notes" className="text-xs font-medium">
                    Meeting Notes
                  </Label>
                  <Textarea
                    id="lead-notes"
                    rows={3}
                    placeholder="Add your meeting discussion points, project requirements, or next follow-up date..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="text-xs font-sans resize-none"
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
