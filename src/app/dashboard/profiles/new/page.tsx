import { requireOrganization } from '@/utils/auth-helpers'
import { ProfileForm } from '../profile-form'
import { connection } from 'next/server'
import { Button, buttonVariants } from '@/components/ui/button'
import Link from 'next/link'
import { ChevronLeftIcon } from 'lucide-react'

export const instant = false

export default async function NewProfilePage() {
  await connection();
  const { organization } = await requireOrganization()

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/profiles" className={buttonVariants({ variant: 'ghost', size: 'icon' })}>
          <ChevronLeftIcon className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Profile</h1>
          <p className="text-muted-foreground">
            Add a new digital profile to your organization.
          </p>
        </div>
      </div>
      
      <ProfileForm profile={null} organizationId={organization.id} redirectAfterSave="/dashboard/profiles" />
    </div>
  )
}
