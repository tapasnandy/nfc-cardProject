'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function saveProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('Not authenticated')
  }

  const profileId = formData.get('id') as string
  const organizationId = formData.get('organization_id') as string

  const profileData = {
    name: formData.get('name') as string,
    job_title: formData.get('job_title') as string,
    company: formData.get('company') as string,
    bio: formData.get('bio') as string,
    phone: formData.get('phone') as string,
    email: formData.get('email') as string,
    whatsapp: formData.get('whatsapp') as string,
    website: formData.get('website') as string,
    linkedin: formData.get('linkedin') as string,
    facebook: formData.get('facebook') as string,
    instagram: formData.get('instagram') as string,
    address: formData.get('address') as string,
    profile_photo: formData.get('profile_photo') as string,
  }

  if (profileId) {
    // Update existing
    const { error } = await supabase
      .from('profiles')
      .update(profileData)
      .eq('id', profileId)
      .eq('organization_id', organizationId) // Security check handled by RLS too

    if (error) throw new Error(error.message)
  } else {
    // Create new
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
  return { success: true }
}

export async function deleteProfile(id: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', id)
    
  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/dashboard/profiles')
  revalidatePath('/dashboard/cards')
  return { success: true }
}
