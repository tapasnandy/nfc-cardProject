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
import { DigitalBusinessCard } from '@/components/digital-business-card'
import { ProfileContactData } from '@/lib/contact-actions'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import { EyeIcon, Trash2Icon, UploadCloudIcon, Loader2Icon } from 'lucide-react'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ProfileForm({ 
  profile, 
  organizationId, 
  redirectAfterSave 
}: { 
  profile: any
  organizationId: string
  redirectAfterSave?: string 
}) {
  const [isPending, setIsPending] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState(profile?.profile_photo || '')
  const [uploading, setUploading] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  
  // Track field state for live card preview
  const [formDataState, setFormDataState] = useState({
    name: profile?.name || '',
    job_title: profile?.job_title || '',
    company: profile?.company || '',
    email: profile?.email || '',
    phone: profile?.phone || '',
    whatsapp: profile?.whatsapp || '',
    website: profile?.website || '',
    bio: profile?.bio || '',
    address: profile?.address || '',
    linkedin: profile?.linkedin || '',
    instagram: profile?.instagram || '',
    facebook: profile?.facebook || '',
  })

  const supabase = createClient()
  const router = useRouter()

  const handleInputChange = (field: string, value: string) => {
    setFormDataState(prev => ({ ...prev, [field]: value }))
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    try {
      if (!e.target.files || e.target.files.length === 0) return
      
      const file = e.target.files[0]

      // Validation 1: MIME Type check
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
      if (!validTypes.includes(file.type)) {
        toast.error('Invalid file format. Please upload a JPEG, PNG, or WebP image.')
        e.target.value = ''
        return
      }

      // Validation 2: File Size check (max 2MB)
      const maxSizeBytes = 2 * 1024 * 1024
      if (file.size > maxSizeBytes) {
        toast.error('File is too large. Maximum allowed size is 2MB.')
        e.target.value = ''
        return
      }

      setUploading(true)
      const fileExt = file.name.split('.').pop()
      const filePath = `${organizationId}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })

      if (uploadError) {
        throw uploadError
      }

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
      setAvatarUrl(data.publicUrl)
      
      // Auto-update database if profile already exists
      if (profile?.id) {
        await supabase
          .from('profiles')
          .update({ profile_photo: data.publicUrl })
          .eq('id', profile.id)
      }

      toast.success('Profile photo uploaded!')
    } catch (error: unknown) {
      const err = error as Error
      toast.error(err.message || 'Error uploading photo')
    } finally {
      setUploading(false)
      if (e.target) e.target.value = ''
    }
  }

  async function handleRemovePhoto() {
    try {
      setAvatarUrl('')
      if (profile?.id) {
        await supabase
          .from('profiles')
          .update({ profile_photo: null })
          .eq('id', profile.id)
      }
      toast.success('Profile photo removed.')
    } catch (error: unknown) {
      const err = error as Error
      toast.error(err.message || 'Error removing photo')
    }
  }

  async function onSubmit(formData: FormData) {
    setIsPending(true)
    try {
      formData.append('organization_id', organizationId)
      if (profile?.id) {
        formData.append('id', profile.id)
      }
      formData.set('profile_photo', avatarUrl || '')
      
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

  const previewProfile: ProfileContactData = {
    ...formDataState,
    profile_photo: avatarUrl,
  }

  return (
    <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-6">
        <div>
          <CardTitle className="text-xl">Profile Details</CardTitle>
          <CardDescription>
            This digital business card information is displayed when your NFC card is tapped.
          </CardDescription>
        </div>

        {/* Live Preview Modal */}
        <Button 
          type="button"
          variant="outline" 
          size="sm" 
          onClick={() => setPreviewOpen(true)}
          className="gap-2 shrink-0 self-start sm:self-auto"
        >
          <EyeIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          Preview Card
        </Button>

        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-md p-0 overflow-hidden bg-transparent border-0 shadow-2xl">
            <DialogHeader className="sr-only">
              <DialogTitle>Card Preview</DialogTitle>
            </DialogHeader>
            <div className="max-h-[90vh] overflow-y-auto rounded-3xl">
              <DigitalBusinessCard profile={previewProfile} previewMode={true} />
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent className="pt-6">
        
        {/* Profile Photo Management */}
        <div className="mb-8 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-700/60 flex flex-col sm:flex-row items-center gap-5">
          <Avatar className="h-24 w-24 ring-4 ring-white dark:ring-zinc-800 shadow-md">
            <AvatarImage src={avatarUrl} alt="Profile preview" className="object-cover" />
            <AvatarFallback className="text-2xl font-bold bg-zinc-200 dark:bg-zinc-700">
              {(formDataState.name || 'UP').charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 text-center sm:text-left space-y-2">
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Profile Photo
            </h4>
            <p className="text-xs text-muted-foreground">
              JPG, PNG, or WebP. Maximum size 2MB. Square ratio recommended.
            </p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
              <Label htmlFor="avatar-upload" className="cursor-pointer">
                <span className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 px-3.5 py-1.5 text-xs font-semibold shadow-sm transition-colors">
                  {uploading ? (
                    <>
                      <Loader2Icon className="h-3.5 w-3.5 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <UploadCloudIcon className="h-3.5 w-3.5" />
                      {avatarUrl ? 'Replace Photo' : 'Upload Photo'}
                    </>
                  )}
                </span>
                <input 
                  type="file" 
                  id="avatar-upload" 
                  accept="image/jpeg,image/png,image/webp,image/gif" 
                  className="hidden" 
                  onChange={handleImageUpload}
                  disabled={uploading}
                />
              </Label>

              {avatarUrl && (
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleRemovePhoto}
                  className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs h-9 px-3 gap-1.5"
                >
                  <Trash2Icon className="h-3.5 w-3.5" />
                  Remove
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Profile Information Form */}
        <form action={onSubmit} className="space-y-6">
          
          {/* Core Identity */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider text-xs">
              Personal & Professional Info
            </h3>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs font-medium">Full Name <span className="text-red-500">*</span></Label>
                <Input 
                  id="name" 
                  name="name" 
                  value={formDataState.name} 
                  onChange={e => handleInputChange('name', e.target.value)}
                  placeholder="e.g. Alex Johnson"
                  required 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="job_title" className="text-xs font-medium">Job Title / Designation</Label>
                <Input 
                  id="job_title" 
                  name="job_title" 
                  value={formDataState.job_title} 
                  onChange={e => handleInputChange('job_title', e.target.value)}
                  placeholder="e.g. Managing Director"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company" className="text-xs font-medium">Company / Organization</Label>
                <Input 
                  id="company" 
                  name="company" 
                  value={formDataState.company} 
                  onChange={e => handleInputChange('company', e.target.value)}
                  placeholder="e.g. Acme Innovations Ltd."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-medium">Public Email</Label>
                <Input 
                  id="email" 
                  name="email" 
                  type="email" 
                  value={formDataState.email} 
                  onChange={e => handleInputChange('email', e.target.value)}
                  placeholder="contact@company.com"
                />
              </div>
            </div>
          </div>

          {/* Contact Action Numbers (Call & WhatsApp) */}
          <div className="space-y-4 pt-2 border-t">
            <div>
              <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                Action Channels (Call & WhatsApp)
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Always include the international country code (e.g. +880 for Bangladesh, +1 for US/Canada).
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-xs font-medium">Primary Phone (Call Button)</Label>
                <Input 
                  id="phone" 
                  name="phone" 
                  value={formDataState.phone} 
                  onChange={e => handleInputChange('phone', e.target.value)}
                  placeholder="+880 1712-345678"
                />
                <p className="text-[11px] text-muted-foreground">Used by visitors tapping the "Call" button.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="whatsapp" className="text-xs font-medium">WhatsApp Number</Label>
                <Input 
                  id="whatsapp" 
                  name="whatsapp" 
                  value={formDataState.whatsapp} 
                  onChange={e => handleInputChange('whatsapp', e.target.value)}
                  placeholder="+880 1712-345678"
                />
                <p className="text-[11px] text-muted-foreground">Leave blank if identical to Primary Phone.</p>
              </div>
            </div>
          </div>

          {/* Web & Bio */}
          <div className="space-y-4 pt-2 border-t">
            <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
              Online Presence & Bio
            </h3>

            <div className="space-y-2">
              <Label htmlFor="website" className="text-xs font-medium">Business Website (Website Button)</Label>
              <Input 
                id="website" 
                name="website" 
                value={formDataState.website} 
                onChange={e => handleInputChange('website', e.target.value)}
                placeholder="https://yourbrand.com or yourbrand.com"
              />
              <p className="text-[11px] text-muted-foreground">Used by visitors tapping the "Website" button.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio" className="text-xs font-medium">Professional Bio</Label>
              <Textarea 
                id="bio" 
                name="bio" 
                value={formDataState.bio} 
                onChange={e => handleInputChange('bio', e.target.value)}
                rows={3} 
                placeholder="Brief introduction, expertise, or company summary..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="text-xs font-medium">Office Address / Location</Label>
              <Input 
                id="address" 
                name="address" 
                value={formDataState.address} 
                onChange={e => handleInputChange('address', e.target.value)}
                placeholder="Suite 500, Tech Park, Dhaka"
              />
            </div>
          </div>

          {/* Social Profiles */}
          <div className="space-y-4 pt-2 border-t">
            <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
              Social Media Links
            </h3>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="linkedin" className="text-xs font-medium">LinkedIn</Label>
                <Input 
                  id="linkedin" 
                  name="linkedin" 
                  value={formDataState.linkedin} 
                  onChange={e => handleInputChange('linkedin', e.target.value)}
                  placeholder="https://linkedin.com/in/..." 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="instagram" className="text-xs font-medium">Instagram</Label>
                <Input 
                  id="instagram" 
                  name="instagram" 
                  value={formDataState.instagram} 
                  onChange={e => handleInputChange('instagram', e.target.value)}
                  placeholder="https://instagram.com/..." 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="facebook" className="text-xs font-medium">Facebook</Label>
                <Input 
                  id="facebook" 
                  name="facebook" 
                  value={formDataState.facebook} 
                  onChange={e => handleInputChange('facebook', e.target.value)}
                  placeholder="https://facebook.com/..." 
                />
              </div>
            </div>
          </div>
          
          <input type="hidden" name="profile_photo" value={avatarUrl} />

          {/* Form Actions */}
          <div className="pt-4 flex items-center gap-3">
            <Button type="submit" disabled={isPending} className="font-semibold">
              {isPending ? (
                <>
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Profile'
              )}
            </Button>

            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setPreviewOpen(true)}
              className="gap-1.5"
            >
              <EyeIcon className="h-4 w-4" />
              Preview Card
            </Button>
          </div>

        </form>
      </CardContent>
    </Card>
  )
}
