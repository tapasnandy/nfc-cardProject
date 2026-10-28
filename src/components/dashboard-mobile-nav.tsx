'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboardIcon, 
  UsersIcon, 
  CreditCardIcon, 
  RadioIcon, 
  MenuIcon, 
  XIcon,
  LogOutIcon
} from 'lucide-react'
import { signout } from '@/app/auth/actions'
import { Button } from '@/components/ui/button'

const navItems = [
  { label: 'Overview', href: '/dashboard', icon: LayoutDashboardIcon },
  { label: 'Profiles', href: '/dashboard/profiles', icon: UsersIcon },
  { label: 'Cards', href: '/dashboard/cards', icon: CreditCardIcon },
  { label: 'NFC Writer', href: '/dashboard/nfc-writer', icon: RadioIcon },
]

export function DashboardMobileNav({ userEmail }: { userEmail?: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Mobile Hamburger Toggle (top bar) */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        aria-label="Toggle navigation menu"
      >
        {isOpen ? <XIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
      </button>

      {/* Expandable Mobile Dropdown Menu */}
      {isOpen && (
        <div className="fixed inset-x-0 top-16 z-40 bg-background/95 backdrop-blur-md border-b md:hidden shadow-lg animate-in slide-in-from-top-2 duration-200">
          <div className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'bg-primary text-primary-foreground font-semibold'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              )
            })}

            <div className="pt-3 mt-2 border-t flex items-center justify-between px-2">
              <span className="text-xs text-muted-foreground truncate max-w-[180px]">
                {userEmail}
              </span>
              <form action={signout}>
                <Button variant="ghost" size="sm" className="text-xs text-destructive hover:text-destructive flex items-center gap-1.5 h-8 px-2.5">
                  <LogOutIcon className="h-3.5 w-3.5" />
                  <span>Sign out</span>
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Fixed Bottom Nav Bar (App-like Experience for Smartphones) */}
      <nav className="fixed bottom-0 inset-x-0 z-30 bg-background/95 backdrop-blur-md border-t md:hidden flex justify-around items-center h-16 px-2 safe-area-bottom shadow-lg">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-[11px] font-medium transition-all ${
                active
                  ? 'text-primary font-bold scale-105'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className={`h-5 w-5 mb-1 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
