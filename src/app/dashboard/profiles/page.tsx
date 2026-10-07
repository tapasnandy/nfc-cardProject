import { requireOrganization } from '@/utils/auth-helpers'
import { createClient } from '@/utils/supabase/server'
import { connection } from 'next/server'
import Link from 'next/link'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { PlusIcon, UserIcon, EditIcon } from 'lucide-react'
import { DeleteProfileButton } from './delete-button'

export const instant = false

export default async function ProfilesListPage() {
  await connection();
  const { organization } = await requireOrganization()
  const supabase = await createClient()

  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .eq('organization_id', organization.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Profiles</h1>
          <p className="text-muted-foreground">
            Manage digital profiles for your team members. You can assign these to NFC cards.
          </p>
        </div>
        <Link href="/dashboard/profiles/new" className={buttonVariants()}>
          <PlusIcon className="h-4 w-4 mr-2" /> Add Profile
        </Link>
      </div>

      {!profiles || profiles.length === 0 ? (
        <Card className="p-8 text-center flex flex-col items-center justify-center">
          <UserIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium">No profiles yet</h3>
          <p className="text-muted-foreground mb-4">Create your first digital profile to assign to a card.</p>
          <Link href="/dashboard/profiles/new" className={buttonVariants()}>Create Profile</Link>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {profiles.map(profile => (
            <Card key={profile.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="p-6 flex flex-col items-center text-center border-b">
                  <Avatar className="h-20 w-20 mb-4">
                    <AvatarImage src={profile.profile_photo || ''} />
                    <AvatarFallback>{profile.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <h3 className="font-bold text-lg">{profile.name}</h3>
                  <p className="text-sm text-muted-foreground">{profile.job_title || 'No title'} • {profile.company || 'No company'}</p>
                </div>
                <div className="p-3 flex justify-between bg-muted/20">
                  <DeleteProfileButton profileId={profile.id} />
                  <Link href={`/dashboard/profiles/${profile.id}`} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                    <EditIcon className="h-4 w-4 mr-2" /> Edit
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
