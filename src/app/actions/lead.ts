'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export interface SubmitLeadParams {
  cardId?: string | null
  profileId?: string | null
  organizationId?: string | null
  name: string
  phone?: string | null
  email?: string | null
  company?: string | null
  notes?: string | null
  source?: 'visitor' | 'salesperson'
}

/**
 * Submits a new prospective customer enquiry / lead from the digital card.
 * Accessible to public visitors and salespeople without requiring visitor authentication.
 */
export async function submitLead(params: SubmitLeadParams) {
  const supabase = await createClient()

  const name = (params.name || '').trim()
  const phone = (params.phone || '').trim()
  const email = (params.email || '').trim()
  const company = (params.company || '').trim()
  const notes = (params.notes || '').trim()

  if (!name) {
    throw new Error('Please provide your name.')
  }

  if (!phone && !email) {
    throw new Error('Please provide either a phone number or email so we can reach you.')
  }

  let orgId = params.organizationId

  // If organizationId was not provided, resolve it from cardId or profileId
  if (!orgId && params.cardId) {
    const { data: card } = await supabase
      .from('cards')
      .select('organization_id')
      .eq('id', params.cardId)
      .single()
    orgId = card?.organization_id
  }

  if (!orgId && params.profileId) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', params.profileId)
      .single()
    orgId = profile?.organization_id
  }

  if (!orgId) {
    throw new Error('Could not find the organization associated with this card.')
  }

  const { error } = await supabase.from('leads').insert({
    organization_id: orgId,
    card_id: params.cardId || null,
    profile_id: params.profileId || null,
    name,
    phone: phone || null,
    email: email || null,
    company: company || null,
    notes: notes || null,
    source: params.source || 'visitor',
    status: 'new',
  })

  if (error) {
    console.error('Lead submission error:', error)
    throw new Error(error.message || 'Failed to submit enquiry. Please try again.')
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/leads')
  return { success: true }
}

/**
 * Updates the CRM status of a lead (e.g. New -> Contacted -> Qualified -> Closed -> Lost).
 */
export async function updateLeadStatus(leadId: string, status: 'new' | 'contacted' | 'qualified' | 'closed' | 'lost') {
  const supabase = await createClient()

  const { error } = await supabase
    .from('leads')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', leadId)

  if (error) {
    throw new Error(error.message || 'Failed to update lead status')
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/leads')
  return { success: true }
}

/**
 * Deletes a lead record from the CRM.
 */
export async function deleteLead(leadId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('leads')
    .delete()
    .eq('id', leadId)

  if (error) {
    throw new Error(error.message || 'Failed to delete lead')
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/leads')
  return { success: true }
}
