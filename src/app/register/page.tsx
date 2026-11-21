'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { BrandLogo } from '@/components/brand-logo'
import { Loader2Icon } from 'lucide-react'

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
        },
      })

      if (signUpError) {
        setError(signUpError.message)
        setLoading(false)
        return
      }

      // Hard navigation ensures server components pick up the new session cookies cleanly
      window.location.href = '/dashboard'
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to register. Please try again.'
      setError(msg)
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-muted/20">
      <div className="w-full max-w-sm space-y-6 bg-card border border-border/80 p-6 sm:p-8 rounded-3xl shadow-sm">
        <div className="flex flex-col items-center space-y-3 text-center">
          <BrandLogo size="lg" />
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Create an account</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Start using Tapqori smart NFC cards for free</p>
          </div>
        </div>

        {error && (
          <div className="p-3 text-xs sm:text-sm text-rose-600 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs font-semibold">Full Name</Label>
            <Input
              id="name"
              name="name"
              placeholder="e.g. John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
              className="h-10 text-sm rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-semibold">Email address</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="h-10 text-sm rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs font-semibold">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              disabled={loading}
              className="h-10 text-sm rounded-xl"
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 text-sm font-bold bg-[#13B1A5] hover:bg-[#109F94] text-white rounded-xl shadow-sm shadow-[#13B1A5]/25 transition-all cursor-pointer"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2Icon className="w-4 h-4 animate-spin" />
                Creating account...
              </span>
            ) : (
              'Create Free Account'
            )}
          </Button>
        </form>

        <div className="text-center text-xs text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-[#0F8A80] dark:text-[#18C8BB] hover:underline underline-offset-4">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
