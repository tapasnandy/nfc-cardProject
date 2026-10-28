import { createClient } from '@/utils/supabase/server'
import { connection } from 'next/server'
import { requireOrganization } from '@/utils/auth-helpers'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3Icon, CreditCardIcon, SmartphoneIcon, ActivityIcon, MonitorIcon } from 'lucide-react'

export const instant = false

export default async function DashboardPage() {
  await connection();
  const supabase = await createClient()
  const { organization } = await requireOrganization()

  // Fetch cards for this org to get their IDs
  const { data: cards } = await supabase
    .from('cards')
    .select('id, short_code, status')
    .eq('organization_id', organization.id)

  const cardIds = (cards || []).map(c => c.id)
  const totalCards = cardIds.length
  const activeCards = (cards || []).filter(c => c.status === 'active').length

  // Fetch analytics if they have cards
  let totalTaps = 0
  let tapsToday = 0
  let tapsThisMonth = 0
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let recentTaps: any[] = []
  
  let mobileCount = 0
  let desktopCount = 0

  if (cardIds.length > 0) {
    const { data: events } = await supabase
      .from('analytics_events')
      .select('id, created_at, device_type, cards(short_code)')
      .in('card_id', cardIds)
      .order('created_at', { ascending: false })

    if (events) {
      totalTaps = events.length
      
      const now = new Date()
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      
      tapsToday = events.filter(e => e.created_at >= startOfDay).length
      tapsThisMonth = events.filter(e => e.created_at >= startOfMonth).length
      
      mobileCount = events.filter(e => e.device_type === 'Mobile').length
      desktopCount = events.filter(e => e.device_type === 'Desktop').length
      
      recentTaps = events.slice(0, 5)
    }
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard Overview</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
          Welcome back! Here is an overview of your NFC cards and analytics.
        </p>
      </div>
      
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3.5 sm:p-6 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Taps</CardTitle>
            <ActivityIcon className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent className="p-3.5 sm:p-6 pt-0">
            <div className="text-xl sm:text-2xl font-bold">{totalTaps}</div>
            <p className="text-[11px] sm:text-xs text-muted-foreground">Lifetime views</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3.5 sm:p-6 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Taps Today</CardTitle>
            <BarChart3Icon className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent className="p-3.5 sm:p-6 pt-0">
            <div className="text-xl sm:text-2xl font-bold">{tapsToday}</div>
            <p className="text-[11px] sm:text-xs text-muted-foreground truncate">{tapsThisMonth} this month</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3.5 sm:p-6 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Cards</CardTitle>
            <CreditCardIcon className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent className="p-3.5 sm:p-6 pt-0">
            <div className="text-xl sm:text-2xl font-bold">{totalCards}</div>
            <p className="text-[11px] sm:text-xs text-muted-foreground truncate">{activeCards} active</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3.5 sm:p-6 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Devices</CardTitle>
            <SmartphoneIcon className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent className="p-3.5 sm:p-6 pt-0">
            <div className="flex justify-between items-center mt-1 sm:mt-2">
              <div className="flex items-center gap-1.5" title="Mobile taps">
                <SmartphoneIcon className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                <span className="text-xs sm:text-sm font-medium">{mobileCount}</span>
              </div>
              <div className="flex items-center gap-1.5" title="Desktop taps">
                <MonitorIcon className="h-3.5 w-3.5 text-gray-500 shrink-0" />
                <span className="text-xs sm:text-sm font-medium">{desktopCount}</span>
              </div>
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Mobile vs Desktop</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-7">
        <Card className="lg:col-span-5 shadow-sm">
          <CardHeader className="p-4 sm:p-6 pb-3">
            <CardTitle className="text-base sm:text-lg">Recent Taps</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            {recentTaps.length === 0 ? (
              <p className="text-xs sm:text-sm text-muted-foreground text-center py-6">No taps recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {recentTaps.map(tap => {
                  const cardData = Array.isArray(tap.cards) ? tap.cards[0] : tap.cards
                  return (
                    <div key={tap.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-3 border-b pb-3 last:border-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <div className="bg-muted p-2 rounded-full shrink-0">
                          {tap.device_type === 'Mobile' ? <SmartphoneIcon className="h-4 w-4" /> : <MonitorIcon className="h-4 w-4" />}
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm font-medium">Card: <span className="font-mono">{cardData?.short_code}</span></p>
                          <p className="text-[11px] text-muted-foreground">{tap.device_type}</p>
                        </div>
                      </div>
                      <div className="text-[11px] sm:text-xs text-muted-foreground sm:text-right pl-11 sm:pl-0">
                        {new Date(tap.created_at).toLocaleString()}
                      </div>
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
