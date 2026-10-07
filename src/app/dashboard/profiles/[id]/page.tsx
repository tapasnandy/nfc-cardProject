import { requireOrganization } from '@/utils/auth-helpers'
import { createClient } from '@/utils/supabase/server'
import { ProfileForm } from '../profile-form'
import { connection } from 'next/server'
import { notFound } from 'next/navigation'
import { Button, buttonVariants } from '@/components/ui/button'
import Link from 'next/link'
import { ChevronLeftIcon } from 'lucide-react'

export const instant = false

export default async function EditProfilePage({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params
  const { organization } = await requireOrganization()
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .eq('organization_id', organization.id)
    .single()

  if (!profile) {
    notFound()
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/profiles" className={buttonVariants({ variant: 'ghost', size: 'icon' })}>
          <ChevronLeftIcon className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Profile</h1>
          <p className="text-muted-foreground">
            Update the digital profile details.
          </p>
        </div>
      </div>
      
      <ProfileForm profile={profile} organizationId={organization.id} redirectAfterSave="/dashboard/profiles" />
    </div>
  )
}
