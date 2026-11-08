import { createClient } from '@/utils/supabase/server'
import { connection } from 'next/server'
import { requireOrganization } from '@/utils/auth-helpers'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  CreditCardIcon,
  SmartphoneIcon,
  ActivityIcon,
  MonitorIcon,
  UserCheck2Icon,
  ExternalLinkIcon,
  UsersIcon,
  SparklesIcon,
} from 'lucide-react'
import Link from 'next/link'

export const instant = false

export default async function DashboardPage() {
  await connection()
  const supabase = await createClient()
  const { organization } = await requireOrganization()

  // 1. Fetch cards with linked profiles for this organization
  const { data: cards } = await supabase
    .from('cards')
    .select(`
      id,
      short_code,
      status,
      created_at,
      profile_id,
      profiles (
        id,
        name,
        job_title,
        company,
        profile_photo
      )
    `)
    .eq('organization_id', organization.id)
    .order('created_at', { ascending: false })

  const cardList = cards || []
  const cardIds = cardList.map((c) => c.id)
  const totalCards = cardIds.length
  const activeCards = cardList.filter((c) => c.status === 'active').length

  // 2. Fetch analytics events for taps
  let totalTaps = 0
  let tapsToday = 0
  let tapsThisMonth = 0
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let recentTaps: any[] = []
  let mobileCount = 0
  let desktopCount = 0

  // Map for card_id -> tapCount
  const cardTapCounts: Record<string, number> = {}

  if (cardIds.length > 0) {
    const { data: events } = await supabase
      .from('analytics_events')
      .select('id, card_id, created_at, device_type, cards(short_code)')
      .in('card_id', cardIds)
      .order('created_at', { ascending: false })

    if (events) {
      totalTaps = events.length

      const now = new Date()
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

      tapsToday = events.filter((e) => e.created_at >= startOfDay).length
      tapsThisMonth = events.filter((e) => e.created_at >= startOfMonth).length

      mobileCount = events.filter((e) => e.device_type === 'Mobile').length
      desktopCount = events.filter((e) => e.device_type === 'Desktop').length

      recentTaps = events.slice(0, 6)

      for (const ev of events) {
        if (ev.card_id) {
          cardTapCounts[ev.card_id] = (cardTapCounts[ev.card_id] || 0) + 1
        }
      }
    }
  }

  // 3. Fetch leads for this organization
  const { data: rawLeads } = await supabase
    .from('leads')
    .select('id, name, company, card_id, profile_id, status, created_at, source')
    .eq('organization_id', organization.id)
    .order('created_at', { ascending: false })

  const allLeads = rawLeads || []
  const totalLeads = allLeads.length
  const recentLeads = allLeads.slice(0, 5)

  // Map for card_id -> leadCount
  const cardLeadCounts: Record<string, number> = {}
  for (const lead of allLeads) {
    if (lead.card_id) {
      cardLeadCounts[lead.card_id] = (cardLeadCounts[lead.card_id] || 0) + 1
    }
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard Overview</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Real-time analytics, individual sales card tracking, and captured client leads.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/leads"
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-xs"
          >
            <UserCheck2Icon className="w-4 h-4" />
            <span>View All Leads ({totalLeads})</span>
          </Link>
        </div>
      </div>

      {/* 4 Metric Summary Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3.5 sm:p-5 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Taps</CardTitle>
            <ActivityIcon className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent className="p-3.5 sm:p-5 pt-0">
            <div className="text-xl sm:text-2xl font-bold">{totalTaps}</div>
            <p className="text-[11px] sm:text-xs text-muted-foreground">
              {tapsToday} today • {tapsThisMonth} this month
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3.5 sm:p-5 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Captured Leads</CardTitle>
            <UserCheck2Icon className="h-4 w-4 text-blue-500 shrink-0" />
          </CardHeader>
          <CardContent className="p-3.5 sm:p-5 pt-0">
            <div className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">
              {totalLeads}
            </div>
            <p className="text-[11px] sm:text-xs text-muted-foreground">
              {totalTaps > 0 ? `${((totalLeads / totalTaps) * 100).toFixed(1)}% conversion` : 'From shared cards'}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3.5 sm:p-5 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Active Cards</CardTitle>
            <CreditCardIcon className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent className="p-3.5 sm:p-5 pt-0">
            <div className="text-xl sm:text-2xl font-bold">{activeCards}</div>
            <p className="text-[11px] sm:text-xs text-muted-foreground truncate">
              {totalCards} total registered
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3.5 sm:p-5 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Devices</CardTitle>
            <SmartphoneIcon className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent className="p-3.5 sm:p-5 pt-0">
            <div className="flex justify-between items-center mt-1 sm:mt-1.5">
              <div className="flex items-center gap-1.5" title="Mobile taps">
                <SmartphoneIcon className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                <span className="text-xs sm:text-sm font-medium">{mobileCount}</span>
              </div>
              <div className="flex items-center gap-1.5" title="Desktop taps">
                <MonitorIcon className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                <span className="text-xs sm:text-sm font-medium">{desktopCount}</span>
              </div>
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Mobile vs Desktop</p>
          </CardContent>
        </Card>
      </div>

      {/* ======================================================== */}
      {/* INDIVIDUAL CARDS & PERSONS PERFORMANCE TABLE / SECTION   */}
      {/* ======================================================== */}
      <Card className="shadow-xs">
        <CardHeader className="p-4 sm:p-6 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <UsersIcon className="w-5 h-5 text-blue-600" />
              <CardTitle className="text-base sm:text-lg font-bold">
                Individual Cards &amp; Team Members
              </CardTitle>
            </div>
            <p className="text-xs text-muted-foreground">
              Monitor individual card unique IDs, salesperson profiles, NFC taps, and enquiries generated.
            </p>
          </div>

          <Link
            href="/dashboard/cards"
            className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
          >
            <span>Manage All Cards</span>
            <ExternalLinkIcon className="w-3 h-3" />
          </Link>
        </CardHeader>

        <CardContent className="p-0">
          {cardList.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-3">
              <CreditCardIcon className="w-10 h-10 mx-auto text-muted-foreground/60" />
              <h3 className="text-sm font-semibold text-foreground">No cards registered yet</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Create NFC cards and assign them to team members to start tracking taps and customer enquiries.
              </p>
              <Link
                href="/dashboard/cards"
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-primary text-primary-foreground"
              >
                Create your first card
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {cardList.map((card) => {
                const profile = Array.isArray(card.profiles) ? card.profiles[0] : card.profiles
                const taps = cardTapCounts[card.id] || 0
                const leads = cardLeadCounts[card.id] || 0
                const initials = profile?.name
                  ? profile.name
                      .split(/\s+/)
                      .slice(0, 2)
                      .map((p: string) => p.charAt(0).toUpperCase())
                      .join('')
                  : '?'

                return (
                  <div
                    key={card.id}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/30 transition-colors"
                  >
                    {/* Person Information & Card Unique ID */}
                    <div className="flex items-start sm:items-center gap-3.5">
                      <Avatar className="h-11 w-11 border shrink-0">
                        <AvatarImage src={profile?.profile_photo || ''} />
                        <AvatarFallback className="font-semibold text-xs">
                          {initials}
                        </AvatarFallback>
                      </Avatar>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-foreground">
                            {profile?.name || 'Unassigned Card'}
                          </h4>

                          {/* Card Unique ID */}
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted font-mono text-xs font-semibold text-foreground border border-muted-foreground/20">
                            <CreditCardIcon className="w-3 h-3 text-muted-foreground" />
                            Card: {card.short_code}
                          </span>

                          <Badge
                            variant={card.status === 'active' ? 'default' : 'secondary'}
                            className={`text-[10px] uppercase font-bold tracking-wider py-0.5 ${
                              card.status === 'active'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                            }`}
                          >
                            {card.status}
                          </Badge>
                        </div>

                        {(profile?.job_title || profile?.company) && (
                          <p className="text-xs text-muted-foreground">
                            {profile.job_title}
                            {profile.job_title && profile.company ? ' • ' : ''}
                            {profile.company}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Performance Metrics: Taps & Leads Captured */}
                    <div className="flex items-center gap-6 justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0">
                      <div className="text-center sm:text-right">
                        <p className="text-xs text-muted-foreground">Taps / Views</p>
                        <p className="text-base font-bold text-foreground">{taps}</p>
                      </div>

                      <div className="text-center sm:text-right">
                        <p className="text-xs text-muted-foreground">Leads Captured</p>
                        <p className="text-base font-bold text-blue-600 dark:text-blue-400">{leads}</p>
                      </div>

                      <div className="flex items-center gap-1.5 pl-2">
                        <Link
                          href={`/c/${card.short_code}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          title="Open Live Card Profile"
                        >
                          <ExternalLinkIcon className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Two Column Section: Recent Leads & Recent Taps */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recent Client Enquiries */}
        <Card className="shadow-xs">
          <CardHeader className="p-4 sm:p-5 pb-3 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <SparklesIcon className="w-4 h-4 text-blue-500" />
              <CardTitle className="text-base font-bold">Recent Leads &amp; Enquiries</CardTitle>
            </div>
            <Link
              href="/dashboard/leads"
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              View all ({totalLeads})
            </Link>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 pt-0">
            {recentLeads.length === 0 ? (
              <p className="text-xs sm:text-sm text-muted-foreground text-center py-8">
                No customer enquiries captured yet.
              </p>
            ) : (
              <div className="space-y-3">
                {recentLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className="flex items-center justify-between border-b pb-2.5 last:border-0 last:pb-0 gap-2"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <p className="text-xs sm:text-sm font-semibold text-foreground">
                          {lead.name}
                        </p>
                        <Badge
                          variant="outline"
                          className="text-[10px] py-0 uppercase font-semibold"
                        >
                          {lead.status}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {lead.company || lead.source === 'salesperson' ? 'Sales Rep Meeting' : 'Client direct enquiry'}
                      </p>
                    </div>
                    <span className="text-[11px] text-muted-foreground shrink-0">
                      {new Date(lead.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent NFC Taps Activity */}
        <Card className="shadow-xs">
          <CardHeader className="p-4 sm:p-5 pb-3">
            <CardTitle className="text-base font-bold">Recent NFC Card Taps</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 pt-0">
            {recentTaps.length === 0 ? (
              <p className="text-xs sm:text-sm text-muted-foreground text-center py-8">
                No taps recorded yet. Tap an NFC card to see live logs.
              </p>
            ) : (
              <div className="space-y-3">
                {recentTaps.map((tap) => {
                  const cardData = Array.isArray(tap.cards) ? tap.cards[0] : tap.cards
                  return (
                    <div
                      key={tap.id}
                      className="flex items-center justify-between border-b pb-2.5 last:border-0 last:pb-0 gap-2"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="bg-muted p-1.5 rounded-full shrink-0">
                          {tap.device_type === 'Mobile' ? (
                            <SmartphoneIcon className="h-3.5 w-3.5 text-blue-500" />
                          ) : (
                            <MonitorIcon className="h-3.5 w-3.5 text-zinc-500" />
                          )}
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm font-medium">
                            Card:{' '}
                            <span className="font-mono font-semibold">
                              {cardData?.short_code || 'Unknown'}
                            </span>
                          </p>
                          <p className="text-[11px] text-muted-foreground">{tap.device_type}</p>
                        </div>
                      </div>
                      <span className="text-[11px] text-muted-foreground shrink-0">
                        {new Date(tap.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
