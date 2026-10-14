'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function saveProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('Not authenticated')
  }

  const profileId = (formData.get('id') as string)?.trim() || null
  const organizationId = (formData.get('organization_id') as string)?.trim()

  if (!organizationId) {
    throw new Error('Organization ID is required')
  }

  // Strict server-side authorization check: verify user owns this organization
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('id')
    .eq('id', organizationId)
    .eq('owner_id', user.id)
    .single()

  if (orgError || !org) {
    throw new Error('Unauthorized: You do not have permission to manage this organization.')
  }

  const name = (formData.get('name') as string)?.trim()
  if (!name) {
    throw new Error('Full Name is required')
  }

  // Sanitize potentially dangerous URL schemes
  const sanitizeUrl = (val: FormDataEntryValue | null): string | null => {
    if (!val || typeof val !== 'string') return null
    const trimmed = val.trim()
    if (!trimmed) return null
    const lower = trimmed.toLowerCase()
    if (
      lower.startsWith('javascript:') ||
      lower.startsWith('data:') ||
      lower.startsWith('vbscript:') ||
      lower.startsWith('file:')
    ) {
      return null
    }
    return trimmed
  }

  const profilePhotoRaw = (formData.get('profile_photo') as string)?.trim()

  const profileData = {
    name,
    job_title: (formData.get('job_title') as string)?.trim() || null,
    company: (formData.get('company') as string)?.trim() || null,
    bio: (formData.get('bio') as string)?.trim() || null,
    phone: (formData.get('phone') as string)?.trim() || null,
    email: (formData.get('email') as string)?.trim() || null,
    whatsapp: (formData.get('whatsapp') as string)?.trim() || null,
    website: sanitizeUrl(formData.get('website')),
    linkedin: sanitizeUrl(formData.get('linkedin')),
    facebook: sanitizeUrl(formData.get('facebook')),
    instagram: sanitizeUrl(formData.get('instagram')),
    address: (formData.get('address') as string)?.trim() || null,
    profile_photo: profilePhotoRaw || null,
  }

  if (profileId) {
    // Update existing profile with organization verification
    const { error } = await supabase
      .from('profiles')
      .update(profileData)
      .eq('id', profileId)
      .eq('organization_id', organizationId)

    if (error) throw new Error(error.message)
  } else {
    // Create new profile
    const { error } = await supabase
      .from('profiles')
      .insert({
        ...profileData,
        organization_id: organizationId,
        user_id: user.id
      })

    if (error) throw new Error(error.message)
  }

  revalidatePath('/dashboard/profiles')
  revalidatePath('/dashboard/cards')
  revalidatePath('/c', 'layout')
  return { success: true }
}

export async function deleteProfile(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  // Authorize: confirm the profile belongs to an organization owned by the caller
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, organizations!inner(owner_id)')
    .eq('id', id)
    .single()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const org = profile?.organizations as any
  if (!profile || org?.owner_id !== user.id) {
    throw new Error('Unauthorized: You cannot delete this profile.')
  }
  
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', id)
    
  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/dashboard/profiles')
  revalidatePath('/dashboard/cards')
  revalidatePath('/c', 'layout')
  return { success: true }
}
