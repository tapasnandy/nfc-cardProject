import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { signout } from '@/app/auth/actions'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { connection } from 'next/server'

export const instant = false

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await connection();
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-16 items-center gap-4 border-b px-6">
        <Link href="/dashboard" className="font-bold text-xl tracking-tight">
          TapNet Dashboard
        </Link>
        <nav className="ml-6 flex gap-4 hidden md:flex">
          <Link href="/dashboard" className="text-sm font-medium hover:underline underline-offset-4">Overview</Link>
          <Link href="/dashboard/profiles" className="text-sm font-medium hover:underline underline-offset-4">Profiles</Link>
          <Link href="/dashboard/cards" className="text-sm font-medium hover:underline underline-offset-4">Cards</Link>
          <Link href="/dashboard/nfc-writer" className="text-sm font-medium hover:underline underline-offset-4">NFC Writer</Link>
        </nav>
        <div className="ml-auto flex items-center gap-4">
          <span className="text-sm text-muted-foreground">{user.email}</span>
          <form action={signout}>
            <Button variant="outline" size="sm">Sign out</Button>
          </form>
        </div>
      </header>
      <main className="flex-1 p-6">
        {children}
      </main>
    </div>
  )
}
