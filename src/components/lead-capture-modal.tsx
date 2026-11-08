'use client'

import React, { useState } from 'react'
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
import { MessageSquarePlusIcon, UserCheck2Icon, CheckCircle2Icon, Loader2Icon } from 'lucide-react'
import { submitLead } from '@/app/actions/lead'
import { toast } from 'sonner'

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
  const [source, setSource] = useState<'visitor' | 'salesperson'>('visitor')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error('Please enter a name.')
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
        source,
      })

      if (!res.success) {
        toast.error(res.error || 'Failed to submit enquiry')
        return
      }

      setIsSuccess(true)
      toast.success(
        source === 'salesperson'
          ? 'Lead / Client meeting logged to dashboard!'
          : 'Enquiry sent! We will be in touch shortly.'
      )
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to submit enquiry'
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
      <DialogContent className="sm:max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-left">
          <DialogTitle className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            {isSuccess
              ? 'Enquiry Received'
              : `Connect with ${personName || companyName || 'Us'}`}
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400">
            {isSuccess
              ? 'Your information was securely saved. Our team will contact you soon.'
              : 'Share your contact details, ask for a consultation, or log a meeting.'}
          </DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          <div className="py-6 flex flex-col items-center text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2Icon className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                {source === 'salesperson' ? 'Client Meeting Saved!' : 'Enquiry Sent Successfully!'}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs">
                {source === 'salesperson'
                  ? 'This prospect is now tracked under your card and visible in your manager dashboard.'
                  : `${personName || 'Our representative'} will review your request and get in touch with you shortly.`}
              </p>
            </div>
            <div className="flex gap-2 w-full pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => resetForm()}
              >
                Submit Another
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
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {/* Toggle Source: Visitor vs Salesperson */}
            <div className="flex p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-xl text-xs font-medium">
              <button
                type="button"
                onClick={() => setSource('visitor')}
                className={`flex-1 py-1.5 px-3 rounded-lg transition-all cursor-pointer ${
                  source === 'visitor'
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs font-semibold'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                I am a Client / Visitor
              </button>
              <button
                type="button"
                onClick={() => setSource('salesperson')}
                className={`flex-1 py-1.5 px-3 rounded-lg transition-all cursor-pointer ${
                  source === 'salesperson'
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs font-semibold'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                Salesperson Entry
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="lead-name" className="text-xs font-medium">
                  {source === 'salesperson' ? 'Client / Prospect Name' : 'Your Name'} <span className="text-red-500">*</span>
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
                  {source === 'salesperson' ? 'Meeting Notes / Discussion' : 'Enquiry / Requirements'}
                </Label>
                <Textarea
                  id="lead-notes"
                  rows={3}
                  placeholder={
                    source === 'salesperson'
                      ? 'Met at expo, interested in 50 NFC cards for corporate sales team...'
                      : 'Looking to schedule a consultation or quote...'
                  }
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="text-sm resize-none"
                />
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl shadow-md cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : source === 'salesperson' ? (
                  <>
                    <UserCheck2Icon className="w-4 h-4 mr-2" />
                    Save Lead to Dashboard
                  </>
                ) : (
                  <>
                    <MessageSquarePlusIcon className="w-4 h-4 mr-2" />
                    Send Enquiry
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
