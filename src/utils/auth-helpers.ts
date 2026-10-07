import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function requireOrganization() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Check if they have an organization
  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('owner_id', user.id)
    .limit(1)

  if (!orgs || orgs.length === 0) {
    // Auto-create default organization
    const { data: newOrg, error } = await supabase
      .from('organizations')
      .insert({
        name: 'My Company',
        slug: `company-${user.id.substring(0, 8)}`,
        owner_id: user.id
      })
      .select('id, name')
      .single()
      
    if (error) {
      console.error('Error creating default org:', error)
      throw new Error('Could not create organization')
    }
    
    return { user, organization: newOrg }
  }

  return { user, organization: orgs[0] }
}
