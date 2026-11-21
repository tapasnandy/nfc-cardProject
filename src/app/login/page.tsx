import { login } from '@/app/auth/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { connection } from 'next/server'
import { BrandLogo } from '@/components/brand-logo'

export const dynamic = 'force-dynamic'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  await connection()
  const params = await searchParams

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-muted/20">
      <div className="w-full max-w-sm space-y-6 bg-card border border-border/80 p-6 sm:p-8 rounded-3xl shadow-sm">
        <div className="flex flex-col items-center space-y-3 text-center">
          <BrandLogo size="lg" />
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Welcome back</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Sign in to your Tapqori account</p>
          </div>
        </div>

        {params?.error && (
          <div className="p-3 text-xs sm:text-sm text-rose-600 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl">
            {params.error}
          </div>
        )}

        <form action={login} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-semibold">Email address</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@company.com"
              required
              className="h-10 text-sm rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-xs font-semibold">Password</Label>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              className="h-10 text-sm rounded-xl"
            />
          </div>
          <Button
            type="submit"
            className="w-full h-11 text-sm font-bold bg-[#13B1A5] hover:bg-[#109F94] text-white rounded-xl shadow-sm shadow-[#13B1A5]/25 transition-all cursor-pointer"
          >
            Sign In to Dashboard
          </Button>
        </form>

        <div className="text-center text-xs text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-semibold text-[#0F8A80] dark:text-[#18C8BB] hover:underline underline-offset-4">
            Sign up for free
          </Link>
        </div>
      </div>
    </div>
  )
}
