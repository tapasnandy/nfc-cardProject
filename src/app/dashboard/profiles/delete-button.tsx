'use client'

import { Button } from '@/components/ui/button'
import { TrashIcon } from 'lucide-react'
import { useState } from 'react'
import { deleteProfile } from '@/app/actions/profile'
import { toast } from 'sonner'

export function DeleteProfileButton({ profileId }: { profileId: string }) {
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this profile? Any cards assigned to it will become unassigned.')) return
    
    setIsDeleting(true)
    try {
      await deleteProfile(profileId)
      toast.success('Profile deleted')
    } catch (error: unknown) {
      toast.error((error as Error).message || 'Failed to delete profile')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950" onClick={handleDelete} disabled={isDeleting}>
      <TrashIcon className="h-4 w-4 mr-2" /> {isDeleting ? '...' : 'Delete'}
    </Button>
  )
}
