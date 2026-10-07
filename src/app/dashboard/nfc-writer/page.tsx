import { requireOrganization } from '@/utils/auth-helpers'
import { createClient } from '@/utils/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { connection } from 'next/server'
import { WriterInstructions } from './writer-instructions'

export const instant = false

export default async function NFCWriterPage() {
  await connection();
  const { organization } = await requireOrganization()
  const supabase = await createClient()

  // Fetch all cards for this org
  const { data: cards } = await supabase
    .from('cards')
    .select('id, short_code, status')
    .eq('organization_id', organization.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">NFC Card Writer</h1>
        <p className="text-muted-foreground">
          Instructions on how to write the digital profile URL to your physical NFC cards.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>How it works</CardTitle>
          <CardDescription>
            Web browsers on desktop computers cannot directly write data to physical NFC chips. 
            Instead, you use a free smartphone app to write the unique URL to the card.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WriterInstructions cards={cards || []} />
        </CardContent>
      </Card>
    </div>
  )
}
