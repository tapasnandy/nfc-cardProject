import { requireOrganization } from '@/utils/auth-helpers'
import { createClient } from '@/utils/supabase/server'
import { LeadList, LeadItem } from './lead-list'
import { connection } from 'next/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { UserCheck2Icon, ClockIcon, CheckCircle2Icon, TrendingUpIcon } from 'lucide-react'

export const instant = false

export default async function LeadsPage() {
  await connection()
  const { organization } = await requireOrganization()
  const supabase = await createClient()

  // 1. Fetch leads for this organization
  const { data: rawLeads } = await supabase
    .from('leads')
    .select(`
      id,
      name,
      phone,
      email,
      company,
      notes,
      source,
      status,
      created_at,
      card_id,
      profile_id,
      cards ( id, short_code ),
      profiles ( id, name, profile_photo, job_title )
    `)
    .eq('organization_id', organization.id)
    .order('created_at', { ascending: false })

  // 2. Fetch cards for this organization (for filter options)
  const { data: cards } = await supabase
    .from('cards')
    .select('id, short_code')
    .eq('organization_id', organization.id)
    .order('created_at', { ascending: false })

  // 3. Fetch profiles for this organization (for filter options)
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, name')
    .eq('organization_id', organization.id)
    .order('name', { ascending: true })

  // Normalize Supabase joins which can return an array or object depending on schema
  const leads: LeadItem[] = (rawLeads || []).map((l) => ({
    id: l.id,
    name: l.name,
    phone: l.phone,
    email: l.email,
    company: l.company,
    notes: l.notes,
    source: (l.source as 'visitor' | 'salesperson') || 'visitor',
    status: (l.status as 'new' | 'contacted' | 'qualified' | 'closed' | 'lost') || 'new',
    created_at: l.created_at,
    card_id: l.card_id,
    profile_id: l.profile_id,
    cards: Array.isArray(l.cards) ? l.cards[0] : l.cards,
    profiles: Array.isArray(l.profiles) ? l.profiles[0] : l.profiles,
  }))

  // Stats calculation
  const totalLeads = leads.length
  const newLeads = leads.filter((l) => l.status === 'new').length
  const inProgressLeads = leads.filter((l) => l.status === 'contacted' || l.status === 'qualified').length
  const closedLeads = leads.filter((l) => l.status === 'closed').length

  return (
    <div className="space-y-6">
      {/* Page Title & Subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Leads &amp; Enquiries</h1>
          <p className="text-sm text-muted-foreground">
            Track client meetings, prospective client enquiries, and field sales performance.
          </p>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Leads</CardTitle>
            <UserCheck2Icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLeads}</div>
            <p className="text-xs text-muted-foreground">Captured across all cards</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">New Enquiries</CardTitle>
            <ClockIcon className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{newLeads}</div>
            <p className="text-xs text-muted-foreground">Awaiting follow-up</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">In Discussion</CardTitle>
            <TrendingUpIcon className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{inProgressLeads}</div>
            <p className="text-xs text-muted-foreground">Contacted &amp; qualified</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Closed / Won</CardTitle>
            <CheckCircle2Icon className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{closedLeads}</div>
            <p className="text-xs text-muted-foreground">Deals successfully closed</p>
          </CardContent>
        </Card>
      </div>

      {/* Leads Table & Interactive Filters */}
      <LeadList
        initialLeads={leads}
        cards={cards || []}
        profiles={profiles || []}
      />
    </div>
  )
}
