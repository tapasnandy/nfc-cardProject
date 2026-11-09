'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export interface SubmitLeadParams {
  cardId?: string | null
  profileId?: string | null
  organizationId?: string | null
  name: string
  jobTitle?: string | null
  phone?: string | null
  email?: string | null
  company?: string | null
  notes?: string | null
  source?: 'visitor' | 'salesperson'
}

export interface ActionResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

/**
 * Submits a new prospective customer enquiry / lead from the digital card.
 * Accessible to public visitors and salespeople without requiring visitor authentication.
 * Returns a typed ActionResult to prevent Next.js / React 19 RSC digest masking (Error #441).
 */
export async function submitLead(params: SubmitLeadParams): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    const name = (params.name || '').trim()
    const jobTitle = (params.jobTitle || '').trim()
    const phone = (params.phone || '').trim()
    const email = (params.email || '').trim()
    const company = (params.company || '').trim()
    const notes = (params.notes || '').trim()

    if (!name) {
      return { success: false, error: 'Please enter your name.' }
    }

    if (!phone && !email) {
      return {
        success: false,
        error: 'Please enter either a phone number or email so we can reach you.',
      }
    }

    let orgId = params.organizationId

    // If organizationId was not provided, resolve it from cardId or profileId
    if (!orgId && params.cardId) {
      const { data: card } = await supabase
        .from('cards')
        .select('organization_id')
        .eq('id', params.cardId)
        .maybeSingle()
      orgId = card?.organization_id
    }

    if (!orgId && params.profileId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', params.profileId)
        .maybeSingle()
      orgId = profile?.organization_id
    }

    if (!orgId) {
      return {
        success: false,
        error: 'Could not find the organization associated with this card.',
      }
    }

    const { error } = await supabase.from('leads').insert({
      organization_id: orgId,
      card_id: params.cardId || null,
      profile_id: params.profileId || null,
      name,
      job_title: jobTitle || null,
      phone: phone || null,
      email: email || null,
      company: company || null,
      notes: notes || null,
      source: params.source || 'visitor',
      status: 'new',
    })

    if (error) {
      console.error('Lead submission error:', error)
      if (error.code === 'PGRST205' || error.message?.includes('leads')) {
        return {
          success: false,
          error:
            "The 'leads' database table does not exist in Supabase yet. Please run migration-leads.sql in your Supabase SQL Editor.",
        }
      }
      return {
        success: false,
        error: error.message || 'Failed to submit enquiry. Please try again.',
      }
    }

    // Safely revalidate dashboard if authenticated
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        revalidatePath('/dashboard')
        revalidatePath('/dashboard/leads')
      }
    } catch {
      // Revalidation is only applicable for active dashboard sessions
    }

    return { success: true }
  } catch (err: unknown) {
    console.error('Unexpected lead submission error:', err)
    const message = err instanceof Error ? err.message : 'An unexpected error occurred'
    return { success: false, error: message }
  }
}

/**
 * Updates the CRM status of a lead (e.g. New -> Contacted -> Qualified -> Closed -> Lost).
 */
export async function updateLeadStatus(
  leadId: string,
  status: 'new' | 'contacted' | 'qualified' | 'closed' | 'lost'
): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('leads')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', leadId)

    if (error) {
      if (error.code === 'PGRST205') {
        return {
          success: false,
          error: "The 'leads' table does not exist in Supabase yet. Please run migration-leads.sql.",
        }
      }
      return { success: false, error: error.message || 'Failed to update lead status' }
    }

    try {
      revalidatePath('/dashboard')
      revalidatePath('/dashboard/leads')
    } catch {
      // Ignore
    }

    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update status'
    return { success: false, error: message }
  }
}

/**
 * Deletes a lead record from the CRM.
 */
export async function deleteLead(leadId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    const { error } = await supabase.from('leads').delete().eq('id', leadId)

    if (error) {
      return { success: false, error: error.message || 'Failed to delete lead' }
    }

    try {
      revalidatePath('/dashboard')
      revalidatePath('/dashboard/leads')
    } catch {
      // Ignore
    }

    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete lead'
    return { success: false, error: message }
  }
}
