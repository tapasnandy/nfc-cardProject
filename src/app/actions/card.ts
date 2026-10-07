'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

function generateShortCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export async function createCard(organizationId: string) {
  const supabase = await createClient()
  
  // Try generating a unique code
  let shortCode = generateShortCode()
  let isUnique = false
  let attempts = 0
  
  while (!isUnique && attempts < 5) {
    const { data } = await supabase.from('cards').select('id').eq('short_code', shortCode).single()
    if (!data) {
      isUnique = true
    } else {
      shortCode = generateShortCode()
      attempts++
    }
  }

  if (!isUnique) {
    throw new Error('Failed to generate a unique card code. Please try again.')
  }

  const { error } = await supabase
    .from('cards')
    .insert({
      organization_id: organizationId,
      short_code: shortCode,
      status: 'active'
    })

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/dashboard/cards')
  return { success: true, shortCode }
}

export async function assignProfileToCard(cardId: string, profileId: string | null) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('cards')
    .update({ profile_id: profileId })
    .eq('id', cardId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/dashboard/cards')
  return { success: true }
}

export async function toggleCardStatus(cardId: string, currentStatus: string) {
  const supabase = await createClient()
  const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
  
  const { error } = await supabase
    .from('cards')
    .update({ status: newStatus })
    .eq('id', cardId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/dashboard/cards')
  return { success: true }
}

export async function deleteCard(cardId: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('cards')
    .delete()
    .eq('id', cardId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/dashboard/cards')
  return { success: true }
}
