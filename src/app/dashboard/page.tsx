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
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
        <p className="text-muted-foreground">
          Welcome back! Here is an overview of your NFC cards and analytics.
        </p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Taps</CardTitle>
            <ActivityIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTaps}</div>
            <p className="text-xs text-muted-foreground">Lifetime views</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taps Today</CardTitle>
            <BarChart3Icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tapsToday}</div>
            <p className="text-xs text-muted-foreground">{tapsThisMonth} total this month</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cards</CardTitle>
            <CreditCardIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCards}</div>
            <p className="text-xs text-muted-foreground">{activeCards} active cards</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mobile vs Desktop</CardTitle>
            <SmartphoneIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center mt-2">
              <div className="flex items-center gap-2">
                <SmartphoneIcon className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">{mobileCount}</span>
              </div>
              <div className="flex items-center gap-2">
                <MonitorIcon className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">{desktopCount}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Taps</CardTitle>
          </CardHeader>
          <CardContent>
            {recentTaps.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No taps recorded yet.</p>
            ) : (
              <div className="space-y-4">
                {recentTaps.map(tap => {
                  const cardData = Array.isArray(tap.cards) ? tap.cards[0] : tap.cards
                  return (
                    <div key={tap.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <div className="bg-muted p-2 rounded-full">
                          {tap.device_type === 'Mobile' ? <SmartphoneIcon className="h-4 w-4" /> : <MonitorIcon className="h-4 w-4" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium">Card: {cardData?.short_code}</p>
                          <p className="text-xs text-muted-foreground">{tap.device_type}</p>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
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
