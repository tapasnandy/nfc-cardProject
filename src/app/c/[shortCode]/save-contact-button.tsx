'use client'

import { useState } from 'react'
import { generateVCard, ProfileContactData } from '@/lib/contact-actions'
import { UserCheckIcon, UserPlusIcon, Loader2Icon } from 'lucide-react'
import { toast } from 'sonner'

interface SaveContactButtonProps {
  profile: ProfileContactData
  className?: string
}

export function SaveContactButton({ profile, className = '' }: SaveContactButtonProps) {
  const [isSaved, setIsSaved] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSaveContact = () => {
    setIsLoading(true)
    try {
      const vCardString = generateVCard(profile)
      const blob = new Blob([vCardString], { type: 'text/vcard;charset=utf-8' })
      const url = URL.createObjectURL(blob)

      // Create filename based on contact name
      const safeName = (profile.name || 'Contact')
        .trim()
        .replace(/[^a-zA-Z0-9_\-\s]/g, '')
        .replace(/\s+/g, '_')

      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${safeName || 'Contact'}.vcf`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Clean up object URL after brief delay
      setTimeout(() => URL.revokeObjectURL(url), 2000)

      setIsSaved(true)
      toast.success('Contact file ready! Open it to save to your contacts.')
    } catch (error) {
      console.error('Failed to generate vCard:', error)
      toast.error('Could not generate contact file. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleSaveContact}
      disabled={isLoading}
      aria-label={`Save ${profile.name} to contacts`}
      className={`group relative flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl transition-all duration-200 select-none touch-manipulation active:scale-[0.97] ${
        isSaved
          ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20'
          : 'bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 shadow-md shadow-zinc-900/10'
      } ${className}`}
    >
      <div className="flex items-center justify-center w-11 h-11 rounded-full mb-1.5 transition-transform group-hover:scale-105">
        {isLoading ? (
          <Loader2Icon className="w-5 h-5 animate-spin" />
        ) : isSaved ? (
          <UserCheckIcon className="w-5 h-5" />
        ) : (
          <UserPlusIcon className="w-5 h-5" />
        )}
      </div>
      <span className="text-xs font-semibold tracking-tight">
        {isLoading ? 'Saving...' : isSaved ? 'Saved (.vcf)' : 'Save Contact'}
      </span>
      <span className="text-[10px] opacity-75 hidden xs:inline mt-0.5">
        Add to address book
      </span>
    </button>
  )
}
