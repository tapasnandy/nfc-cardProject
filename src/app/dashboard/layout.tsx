import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { signout } from '@/app/auth/actions'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { connection } from 'next/server'
import { DashboardMobileNav } from '@/components/dashboard-mobile-nav'

export const instant = false

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await connection()
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/95 backdrop-blur-md px-4 sm:px-6">
        <div className="flex items-center gap-3 sm:gap-6">
          <DashboardMobileNav userEmail={user.email} />
          <Link href="/dashboard" className="font-bold text-lg sm:text-xl tracking-tight">
            TapNet
          </Link>

          {/* Desktop Navigation */}
          <nav className="ml-4 hidden md:flex items-center gap-5">
            <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hover:underline underline-offset-4">
              Overview
            </Link>
            <Link href="/dashboard/profiles" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hover:underline underline-offset-4">
              Profiles
            </Link>
            <Link href="/dashboard/cards" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hover:underline underline-offset-4">
              Cards
            </Link>
            <Link href="/dashboard/nfc-writer" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hover:underline underline-offset-4">
              NFC Writer
            </Link>
          </nav>
        </div>

        {/* User Info & Actions */}
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-block text-xs md:text-sm text-muted-foreground truncate max-w-[140px] md:max-w-[200px]">
            {user.email}
          </span>
          <form action={signout} className="hidden sm:block">
            <Button variant="outline" size="sm" className="text-xs h-8">
              Sign out
            </Button>
          </form>
        </div>
      </header>

      {/* Main Content with Mobile Bottom Nav Padding */}
      <main className="flex-1 p-4 sm:p-6 pb-24 md:pb-8 max-w-7xl w-full mx-auto">
        {children}
      </main>
    </div>
  )
}
