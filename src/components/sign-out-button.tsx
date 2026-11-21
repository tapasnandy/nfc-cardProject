'use client'

import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { LogOutIcon } from 'lucide-react'

export function SignOutButton({
  variant = 'outline',
  className,
}: {
  variant?: 'outline' | 'ghost'
  className?: string
}) {
  const handleSignOut = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
    } catch (e) {
      console.error('Sign out error:', e)
    } finally {
      window.location.href = '/'
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      size="sm"
      onClick={handleSignOut}
      className={className}
    >
      {variant === 'ghost' && <LogOutIcon className="h-3.5 w-3.5 mr-1.5" />}
      <span>Sign out</span>
    </Button>
  )
}
