import { requireOrganization } from '@/utils/auth-helpers'
import { createClient } from '@/utils/supabase/server'
import { CardList } from './card-list'
import { connection } from 'next/server'

export const instant = false

export default async function CardsPage() {
  await connection();
  const { organization } = await requireOrganization()
  const supabase = await createClient()

  // Fetch all cards for this org
  const { data: cards } = await supabase
    .from('cards')
    .select(`
      id, 
      short_code, 
      status, 
      created_at, 
      profile_id,
      profiles ( id, name )
    `)
    .eq('organization_id', organization.id)
    .order('created_at', { ascending: false })

  // Fetch all profiles for this org to use in the dropdown
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, name')
    .eq('organization_id', organization.id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">NFC Cards</h1>
        <p className="text-muted-foreground">
          Manage your NFC cards and link them to digital profiles.
        </p>
      </div>
      
      <CardList 
        initialCards={cards || []} 
        profiles={profiles || []} 
        organizationId={organization.id} 
      />
    </div>
  )
}
