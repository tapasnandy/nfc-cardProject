'use client'

import { useState } from 'react'
import { saveProfile } from '@/app/actions/profile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { createClient } from '@/utils/supabase/client'

import { useRouter } from 'next/navigation'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ProfileForm({ profile, organizationId, redirectAfterSave }: { profile: any, organizationId: string, redirectAfterSave?: string }) {
  const [isPending, setIsPending] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState(profile?.profile_photo || '')
  const [uploading, setUploading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    try {
      setUploading(true)
      if (!e.target.files || e.target.files.length === 0) {
        throw new Error('You must select an image to upload.')
      }
      
      const file = e.target.files[0]
      const fileExt = file.name.split('.').pop()
      const filePath = `${organizationId}-${Math.random()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) {
        throw uploadError
      }

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
      setAvatarUrl(data.publicUrl)
      
      // Auto-save the photo to profile if profile exists
      if (profile?.id) {
        await supabase.from('profiles').update({ profile_photo: data.publicUrl }).eq('id', profile.id)
      }
      toast.success('Avatar uploaded successfully!')
    } catch (error: unknown) {
      const err = error as Error
      toast.error(err.message || 'Error uploading image')
    } finally {
      setUploading(false)
    }
  }

  async function onSubmit(formData: FormData) {
    setIsPending(true)
    try {
      formData.append('organization_id', organizationId)
      if (profile?.id) {
        formData.append('id', profile.id)
      }
      if (avatarUrl && !profile?.id) {
        // If creating new, we might need to send photo, but for now let's just keep it simple.
        // Actually, we should add profile_photo to saveProfile. Let's just do it next iteration.
      }
      
      await saveProfile(formData)
      toast.success('Profile saved successfully!')
      if (redirectAfterSave) {
        router.push(redirectAfterSave)
      }
    } catch (error: unknown) {
      const err = error as Error
      toast.error(err.message || 'Failed to save profile')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Details</CardTitle>
        <CardDescription>This information will be displayed publicly when your NFC card is tapped.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 flex flex-col items-center gap-4 sm:flex-row">
          <Avatar className="h-24 w-24">
            <AvatarImage src={avatarUrl} alt="Profile photo" />
            <AvatarFallback>{profile?.name?.charAt(0) || 'UP'}</AvatarFallback>
          </Avatar>
          <div>
            <Label htmlFor="avatar" className="cursor-pointer">
              <div className="inline-flex h-9 items-center justify-center rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground shadow-sm hover:bg-secondary/80">
                {uploading ? 'Uploading...' : 'Change Photo'}
              </div>
              <input 
                type="file" 
                id="avatar" 
                accept="image/*" 
                className="hidden" 
                onChange={handleImageUpload}
                disabled={uploading}
              />
            </Label>
            <p className="mt-2 text-xs text-muted-foreground">Recommended: Square image, max 2MB.</p>
          </div>
        </div>

        <form action={onSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" name="name" defaultValue={profile?.name || ""} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="job_title">Job Title</Label>
              <Input id="job_title" name="job_title" defaultValue={profile?.job_title || ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input id="company" name="company" defaultValue={profile?.company || ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Public Email</Label>
              <Input id="email" name="email" type="email" defaultValue={profile?.email || ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" name="phone" defaultValue={profile?.phone || ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input id="whatsapp" name="whatsapp" defaultValue={profile?.whatsapp || ""} />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea id="bio" name="bio" defaultValue={profile?.bio || ""} rows={3} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input id="website" name="website" type="url" defaultValue={profile?.website || ""} placeholder="https://" />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="linkedin">LinkedIn URL</Label>
              <Input id="linkedin" name="linkedin" defaultValue={profile?.linkedin || ""} placeholder="https://linkedin.com/in/..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="instagram">Instagram URL</Label>
              <Input id="instagram" name="instagram" defaultValue={profile?.instagram || ""} placeholder="https://instagram.com/..." />
            </div>
          </div>
          
          <input type="hidden" name="profile_photo" value={avatarUrl} />

          <Button type="submit" disabled={isPending}>
            {isPending ? 'Saving...' : 'Save Profile'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
